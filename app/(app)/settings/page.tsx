"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
type UserRole = "Controller" | "MDM";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    (user?.role as UserRole) || "Controller"
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleChange = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        role: selectedRole,
      });

      // Refresh the user in auth context to reflect new role
      await refreshUser();

      toast.success("Role updated successfully");
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>User Role</CardTitle>
          <CardDescription>
            Change your role for testing purposes. In a production environment,
            this would be controlled by your Vattenfall SSO permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedRole}
            onValueChange={(value: string) =>
              setSelectedRole(value as UserRole)
            }
            className="space-y-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Controller" id="controller" />
              <Label htmlFor="controller">Controller</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="MDM" id="mdm" />
              <Label htmlFor="mdm">MDM Admin</Label>
            </div>
          </RadioGroup>
        </CardContent>
        <CardFooter>
          <Button onClick={handleRoleChange} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Role"}
          </Button>
        </CardFooter>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>
            Current user details from Firebase Authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Email:</span> {user?.email}
            </div>
            <div>
              <span className="font-medium">User ID:</span> {user?.uid}
            </div>
            <div>
              <span className="font-medium">Display Name:</span>{" "}
              {user?.displayName || "Not set"}
            </div>
            <div>
              <span className="font-medium">Current Role:</span>{" "}
              {user?.role || "Not set"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
