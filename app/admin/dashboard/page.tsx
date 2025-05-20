"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Request } from "@/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  LineChart,
  Users,
  FileText,
  Clock,
  BarChart,
  Bot,
  CheckCircle2,
} from "lucide-react";
import { AIService } from "@/lib/services/ai-service";
import { AiButton } from "@/components/ui/ai-button";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    totalUsers: 0,
    adminUsers: 0,
  });
  const [recentRequests, setRecentRequests] = useState<Request[]>([]);
  const [aiStatus, setAiStatus] = useState({
    aiReplies: false,
    aiInternal: false,
    aiTasks: false,
  });

  useEffect(() => {
    Promise.all([
      fetchStats(),
      fetchRecentRequests(),
      fetchAiSettings(),
    ]).finally(() => {
      setLoading(false);
    });
  }, []);

  const fetchStats = async () => {
    try {
      // Get all requests
      const requestsSnapshot = await getDocs(collection(db, "requests"));
      const totalRequests = requestsSnapshot.size;

      // Count by status
      let pendingRequests = 0;
      let completedRequests = 0;

      requestsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === "Completed") {
          completedRequests++;
        } else if (
          ["Submitted", "InProgress", "PendingInfo", "ForwardedToSD"].includes(
            data.status
          )
        ) {
          pendingRequests++;
        }
      });

      // Get user stats
      const usersSnapshot = await getDocs(collection(db, "users"));
      const totalUsers = usersSnapshot.size;

      let adminUsers = 0;
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.role === "MDM") {
          adminUsers++;
        }
      });

      setStats({
        totalRequests,
        pendingRequests,
        completedRequests,
        totalUsers,
        adminUsers,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchRecentRequests = async () => {
    try {
      const q = query(
        collection(db, "requests"),
        orderBy("createdAt", "desc"),
        limit(5)
      );

      const querySnapshot = await getDocs(q);
      const requests: Request[] = [];

      querySnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() } as Request);
      });

      setRecentRequests(requests);
    } catch (error) {
      console.error("Error fetching recent requests:", error);
    }
  };

  const fetchAiSettings = async () => {
    try {
      const aiReplyEnabled = await AIService.isAiResponseEnabled();
      const aiInternalEnabled = await AIService.isAiInternalResponseEnabled();
      const aiTasksEnabled = await AIService.isAiTaskCompletionEnabled();

      setAiStatus({
        aiReplies: aiReplyEnabled,
        aiInternal: aiInternalEnabled,
        aiTasks: aiTasksEnabled,
      });
    } catch (error) {
      console.error("Error checking AI settings:", error);
    }
  };

  // Unified status color and display mapping
  const statusColors: Record<string, "info" | "warning" | "pending" | "forwardedToSD" | "success" | "rejected" | "default"> = {
    Submitted: "info",
    "In Progress": "warning",
    PendingInfo: "pending",
    ForwardedToSD: "forwardedToSD",
    Completed: "success",
    Rejected: "rejected",
  };
  const statusDisplayMap: Record<string, string> = {
    'In Progress': 'Progress',
    PendingInfo: 'Pending',
    ForwardedToSD: 'Forwarded',
    Submitted: 'Submitted',
    Completed: 'Completed',
    Rejected: 'Rejected',
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-end md:justify-between items-center">
        <div className="hidden md:block">
          <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your Master Data Management system
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/analytics">
              <BarChart className="h-4 w-4 mr-2" />
              View Analytics
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/requests">
              <FileText className="h-4 w-4 mr-2" />
              Manage Requests
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title="Total Requests"
            value={stats.totalRequests.toString()}
            icon={<FileText className="h-4 w-4" />}
            href="/admin/requests"
          />
          <StatsCard
            title="Pending Requests"
            value={stats.pendingRequests.toString()}
            icon={<Clock className="h-4 w-4" />}
            href="/admin/requests"
            highlight={stats.pendingRequests > 0}
          />
          <StatsCard
            title="Users"
            value={stats.totalUsers.toString()}
            subvalue={`${stats.adminUsers} admins`}
            icon={<Users className="h-4 w-4" />}
            href="/admin/users"
          />
          <StatsCard
            title="Completion Rate"
            value={`${
              stats.totalRequests > 0
                ? Math.round(
                    (stats.completedRequests / stats.totalRequests) * 100
                  )
                : 0
            }%`}
            icon={<LineChart className="h-4 w-4" />}
            href="/admin/analytics"
          />
        </div>
      )}

      {/* Add AI status card if any AI feature is enabled */}
      {(aiStatus.aiReplies || aiStatus.aiInternal || aiStatus.aiTasks) && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-primary">
              <Bot className="h-5 w-5 mr-2" />
              AI Assistant Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {aiStatus.aiReplies && (
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  <span className="text-sm">
                    AI user comment responses enabled
                  </span>
                </div>
              )}
              {aiStatus.aiInternal && (
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  <span className="text-sm">
                    AI internal team assistance enabled
                  </span>
                </div>
              )}
              {aiStatus.aiTasks && (
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  <span className="text-sm">AI task automation enabled</span>
                </div>
              )}
              <div className="pt-2">
                <AiButton asChild>
                  <Link href="/admin/settings">Manage AI Settings</Link>
                </AiButton>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="recent">
        <TabsList>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          <TabsTrigger value="pending">Pending Action</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4 mt-4">
          <div className="rounded-lg border">
            {loading ? (
              <div className="p-4">
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </div>
            ) : recentRequests.length === 0 ? (
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium">No recent requests</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  There are no requests in the system yet.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {recentRequests.map((request) => (
                  <div key={request.id} className="p-4 hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <span>WBS</span>
                          <span>-</span>
                          <span>{request.requestName}</span>
                          <span>-</span>
                          <Badge
                            className="ml-1"
                            variant={statusColors[request.status] || "default"}
                          >
                            {statusDisplayMap[request.status] || request.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          From {request.requesterDisplayName || request.requesterEmail} - about {formatDistanceToNow(request.createdAt.toDate(), { addSuffix: true })}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/requests/${request.id}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" asChild>
              <Link href="/admin/requests">
                View All Requests
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-4">
          <div className="rounded-lg border">
            {loading ? (
              <div className="p-4">
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </div>
            ) : recentRequests.filter(
                (r) => r.status !== "Completed" && r.status !== "Rejected"
              ).length === 0 ? (
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium">No pending requests</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  There are no requests requiring your attention right now.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {recentRequests
                  .filter(
                    (r) => r.status !== "Completed" && r.status !== "Rejected"
                  )
                  .map((request) => (
                    <div key={request.id} className="p-4 hover:bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <span>WBS</span>
                            <span>-</span>
                            <span>{request.requestName}</span>
                            <span>-</span>
                            <Badge
                              className="ml-1"
                              variant={statusColors[request.status] || "default"}
                            >
                              {statusDisplayMap[request.status] || request.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            From {request.requesterDisplayName || request.requesterEmail} - about {formatDistanceToNow(request.createdAt.toDate(), { addSuffix: true })}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/requests/${request.id}`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  href: string;
  subvalue?: string;
  highlight?: boolean;
}

function StatsCard({
  title,
  value,
  icon,
  href,
  subvalue,
  highlight = false,
}: StatsCardProps) {
  return (
    <Card
      className={
        highlight
          ? "border-orange-200 bg-orange-50 dark:bg-orange-950/10 dark:border-orange-950/20"
          : ""
      }
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subvalue && (
          <p className="text-xs text-muted-foreground">{subvalue}</p>
        )}
      </CardContent>
      <CardFooter className="p-2">
        <Link
          href={href}
          className="text-xs text-muted-foreground flex items-center hover:underline w-full justify-end"
        >
          View Details
          <ArrowUpRight className="h-3 w-3 ml-1" />
        </Link>
      </CardFooter>
    </Card>
  );
}
