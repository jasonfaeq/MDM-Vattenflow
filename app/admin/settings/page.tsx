"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings, Database, Shield, Lock, RefreshCw, Bot } from "lucide-react";

interface UserCount {
  total: number;
  admins: number;
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [userCount, setUserCount] = useState<UserCount>({
    total: 0,
    admins: 0,
  });

  // Mock settings data
  const [emailSettings, setEmailSettings] = useState({
    notifyNewRequests: true,
    notifyStatusChanges: true,
    summaryReport: true,
    summaryFrequency: "daily",
  });

  const [systemSettings, setSystemSettings] = useState({
    allowBulkRequests: true,
    maxBulkRequestSize: "50",
    requireApproval: false,
    defaultTimeoutMinutes: "60",
    enableAiReplies: false,
    enableAiInternalReplies: false,
    enableAiTaskCompletion: false,
  });

  useEffect(() => {
    fetchUserStats();
    fetchSystemSettings();
  }, []);

  const fetchUserStats = async () => {
    try {
      const q = query(collection(db, "users"));
      const querySnapshot = await getDocs(q);

      let total = 0;
      let admins = 0;

      querySnapshot.forEach((doc) => {
        total++;
        const userData = doc.data();
        if (userData.role === "MDM") {
          admins++;
        }
      });

      setUserCount({ total, admins });
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  // Fetch system settings from Firestore
  const fetchSystemSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, "system", "settings"));

      if (settingsDoc.exists()) {
        const data = settingsDoc.data();

        // Only update the settings that exist in the document
        setSystemSettings((prevSettings) => ({
          ...prevSettings,
          ...(data.requestSettings || {}),
        }));

        setEmailSettings((prevSettings) => ({
          ...prevSettings,
          ...(data.emailSettings || {}),
        }));
      }
    } catch (error) {
      console.error("Error fetching system settings:", error);
      toast.error("Failed to load settings");
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);

    try {
      // Save settings to Firestore
      await setDoc(
        doc(db, "system", "settings"),
        {
          requestSettings: systemSettings,
          emailSettings: emailSettings,
          updatedAt: new Date(),
          updatedBy: user?.uid,
        },
        { merge: true }
      );

      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerDatabaseBackup = () => {
    setIsLoading(true);

    // Simulate database backup
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Database backed up successfully");
    }, 1500);
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Admin Settings</h1>
        <p className="text-muted-foreground">
          Configure system settings and preferences
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <RefreshCw className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="h-4 w-4 mr-2" />
            Database
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Request Settings</CardTitle>
              <CardDescription>
                Configure general request handling settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Allow Bulk Requests</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable users to submit multiple requests at once
                  </p>
                </div>
                <Switch
                  checked={systemSettings.allowBulkRequests}
                  onCheckedChange={(checked: boolean) =>
                    setSystemSettings({
                      ...systemSettings,
                      allowBulkRequests: checked,
                    })
                  }
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxBulkSize">Max Bulk Request Size</Label>
                  <Input
                    id="maxBulkSize"
                    type="number"
                    value={systemSettings.maxBulkRequestSize}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        maxBulkRequestSize: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of items in a bulk request
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeout">Request Timeout (minutes)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={systemSettings.defaultTimeoutMinutes}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        defaultTimeoutMinutes: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Default timeout for request processing
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Require Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    Require explicit approval for all request changes
                  </p>
                </div>
                <Switch
                  checked={systemSettings.requireApproval}
                  onCheckedChange={(checked: boolean) =>
                    setSystemSettings({
                      ...systemSettings,
                      requireApproval: checked,
                    })
                  }
                />
              </div>

              <div className="mt-8 mb-4">
                <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400 flex items-center">
                  <Bot className="h-5 w-5 mr-2" />
                  AI Assistant Settings
                </h3>
                <div className="h-1 w-full mt-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>AI Auto-Responses</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable AI to automatically respond to user comments and
                    questions
                  </p>
                </div>
                <Switch
                  checked={systemSettings.enableAiReplies}
                  onCheckedChange={(checked: boolean) =>
                    setSystemSettings({
                      ...systemSettings,
                      enableAiReplies: checked,
                    })
                  }
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-indigo-500"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>AI Internal Assistance</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable AI to respond to internal team comments with
                    suggestions
                  </p>
                </div>
                <Switch
                  checked={systemSettings.enableAiInternalReplies}
                  onCheckedChange={(checked: boolean) =>
                    setSystemSettings({
                      ...systemSettings,
                      enableAiInternalReplies: checked,
                    })
                  }
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-indigo-500"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>AI Task Automation</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable AI to automatically update status and complete tasks
                    when appropriate
                  </p>
                </div>
                <Switch
                  checked={systemSettings.enableAiTaskCompletion}
                  onCheckedChange={(checked: boolean) =>
                    setSystemSettings({
                      ...systemSettings,
                      enableAiTaskCompletion: checked,
                    })
                  }
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-indigo-500"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Settings"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Configure when and how email notifications are sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>New Request Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email when new requests are submitted
                  </p>
                </div>
                <Switch
                  checked={emailSettings.notifyNewRequests}
                  onCheckedChange={(checked: boolean) =>
                    setEmailSettings({
                      ...emailSettings,
                      notifyNewRequests: checked,
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Status Change Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email when request status changes
                  </p>
                </div>
                <Switch
                  checked={emailSettings.notifyStatusChanges}
                  onCheckedChange={(checked: boolean) =>
                    setEmailSettings({
                      ...emailSettings,
                      notifyStatusChanges: checked,
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Summary Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive periodic summary reports
                  </p>
                </div>
                <Switch
                  checked={emailSettings.summaryReport}
                  onCheckedChange={(checked: boolean) =>
                    setEmailSettings({
                      ...emailSettings,
                      summaryReport: checked,
                    })
                  }
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Settings"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security settings for the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="font-medium">Admin Access</Label>
                <p className="text-sm text-muted-foreground">
                  Currently {userCount.admins} of {userCount.total} users have
                  admin access
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="/admin/users">
                    <Lock className="h-4 w-4 mr-2" />
                    Manage User Access
                  </a>
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="font-medium">Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  The application currently uses Firebase Authentication
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    <Shield className="h-4 w-4 mr-2" />
                    Configure SSO
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Operations</CardTitle>
              <CardDescription>
                Manage database operations and backups
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="font-medium">Backup Database</Label>
                <p className="text-sm text-muted-foreground">
                  Create a backup of all data in the database
                </p>
                <Button
                  variant="outline"
                  onClick={triggerDatabaseBackup}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Backing up...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Create Backup
                    </>
                  )}
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="font-medium">Export Data</Label>
                <p className="text-sm text-muted-foreground">
                  Export data for reporting and analysis
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Export Requests
                  </Button>
                  <Button variant="outline" size="sm">
                    Export Users
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
