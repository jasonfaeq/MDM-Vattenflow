"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  Timestamp,
  onSnapshot,
  query,
  collection,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/auth";
import { Request, Comment, RequestStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { AIService } from "@/lib/services/ai-service";
import { Bot } from "lucide-react";
import { AiButton } from "@/components/ui/ai-button";

// Status color mapping
const statusColors: Record<RequestStatus, "default" | "secondary" | "warning" | "success" | "destructive"> = {
  Submitted: "default",
  InProgress: "secondary",
  PendingInfo: "warning",
  ForwardedToSD: "secondary",
  Completed: "success",
  Rejected: "destructive",
};

export default function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: requestId } = React.use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [internalComment, setInternalComment] = useState("");
  const [newStatus, setNewStatus] = useState<RequestStatus | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Verify the user has MDM role before proceeding
    if (user.role !== "MDM") {
      router.push("/dashboard");
      return;
    }

    const requestRef = doc(db, "requests", requestId);
    const unsubscribe = onSnapshot(
      requestRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const requestData = { id: docSnap.id, ...docSnap.data() } as Request;
          setRequest(requestData);
          setNewStatus(requestData.status); // Initialize dropdown with current status
        } else {
          notFound();
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching request:", error);
        toast.error("Failed to load request details");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [requestId, router, user]);

  const formatDate = (timestamp: Timestamp | Date | null) => {
    if (!timestamp) return "N/A";
    if ('toDate' in timestamp) {
      return format(timestamp.toDate(), "dd MMM yyyy HH:mm");
    }
    if (timestamp instanceof Date) {
      return format(timestamp, "dd MMM yyyy HH:mm");
    }
    return "Invalid date";
  };

  const handleCommentSubmit = async () => {
    if (!user || !request || !comment.trim()) return;

    setSubmitting(true);
    try {
      const newComment: Comment = {
        userId: user.uid,
        userName: user.displayName || user.email,
        timestamp: Timestamp.now(),
        text: comment.trim(),
      };

      const requestRef = doc(db, "requests", requestId);
      await updateDoc(requestRef, {
        comments: arrayUnion(newComment),
      });

      // Check if AI replies are enabled
      try {
        const aiEnabled = await AIService.isAiResponseEnabled();

        if (aiEnabled) {
          // Add a small delay to make it feel more natural
          setTimeout(async () => {
            const aiResponse = await AIService.generateCommentResponse(
              request,
              newComment
            );

            const aiComment: Comment = {
              userId: "ai-assistant",
              userName: "MDM Assistant",
              timestamp: Timestamp.now(),
              text: aiResponse,
              isAiResponse: true,
            };

            await updateDoc(requestRef, {
              comments: arrayUnion(aiComment),
            });
          }, 2000);
        }
      } catch (error) {
        console.error("Error with AI response:", error);
        // Don't show error to user, just continue without AI response
      }

      setComment("");
      toast.success("Comment added successfully");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInternalCommentSubmit = async () => {
    if (!user || !request || !internalComment.trim()) return;

    setSubmitting(true);
    try {
      const newComment: Comment = {
        userId: user.uid,
        userName: user.displayName || user.email,
        timestamp: Timestamp.now(),
        text: internalComment.trim(),
      };

      const requestRef = doc(db, "requests", requestId);
      await updateDoc(requestRef, {
        internalComments: arrayUnion(newComment),
      });

      // Check if AI internal responses are enabled
      try {
        const aiEnabled = await AIService.isAiInternalResponseEnabled();

        if (aiEnabled) {
          // Add a small delay to make it feel more natural
          setTimeout(async () => {
            const aiResponse = await AIService.generateInternalCommentResponse(
              request,
              newComment
            );

            const aiComment: Comment = {
              userId: "ai-assistant",
              userName: "MDM Assistant",
              timestamp: Timestamp.now(),
              text: aiResponse,
              isAiResponse: true,
            };

            await updateDoc(requestRef, {
              internalComments: arrayUnion(aiComment),
            });

            // Check if AI task completion is enabled
            const taskAutomationEnabled =
              await AIService.isAiTaskCompletionEnabled();

            if (taskAutomationEnabled) {
              // Check if AI recommends a status update
              const statusUpdate =
                await AIService.analyzeRequestForStatusUpdate(request);

              if (
                statusUpdate &&
                statusUpdate.status &&
                statusUpdate.status !== request.status
              ) {
                const historyEntry = {
                  timestamp: Timestamp.now(),
                  status: statusUpdate.status,
                  changedByUserId: "ai-assistant",
                  changedByUserName: "MDM Assistant (AI)",
                };

                // Update the request status
                await updateDoc(requestRef, {
                  status: statusUpdate.status,
                  updatedAt: Timestamp.now(),
                  history: arrayUnion(historyEntry),
                  internalComments: arrayUnion({
                    userId: "ai-assistant",
                    userName: "MDM Assistant",
                    timestamp: Timestamp.now(),
                    text: `I've updated the status to ${statusUpdate.status}. Reason: ${statusUpdate.reason}`,
                    isAiResponse: true,
                  } as Comment),
                });

                toast.success(
                  `AI assistant updated request status to ${statusUpdate.status}`
                );
              }
            }
          }, 2000);
        }
      } catch (error) {
        console.error("Error with AI internal response:", error);
        // Don't show error to user, just continue without AI response
      }

      setInternalComment("");
      toast.success("Internal comment added successfully");
    } catch (error) {
      console.error("Error adding internal comment:", error);
      toast.error("Failed to add internal comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async () => {
    if (!user || !request || !newStatus || newStatus === request.status) return;

    setSubmitting(true);
    try {
      const historyEntry = {
        timestamp: Timestamp.now(),
        status: newStatus,
        changedByUserId: user.uid,
        changedByUserName: user.displayName || user.email,
      };

      const requestRef = doc(db, "requests", requestId);
      await updateDoc(requestRef, {
        status: newStatus,
        updatedAt: Timestamp.now(),
        history: arrayUnion(historyEntry),
      });

      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiStatusCheck = async () => {
    if (!user || !request) return;

    setIsCheckingStatus(true);
    try {
      // Check if AI task completion is enabled
      const taskAutomationEnabled = await AIService.isAiTaskCompletionEnabled();

      if (!taskAutomationEnabled) {
        toast.warning("AI task automation is disabled in settings");
        return;
      }

      // Check if AI recommends a status update
      const statusUpdate = await AIService.analyzeRequestForStatusUpdate(
        request
      );

      if (statusUpdate && statusUpdate.status) {
        if (statusUpdate.status === request.status) {
          toast.info(
            `AI analysis: Current status "${request.status}" is appropriate`
          );
        } else {
          // Set the new status in the dropdown
          setNewStatus(statusUpdate.status);
          toast.info(
            `AI suggests changing status to "${statusUpdate.status}": ${statusUpdate.reason}`
          );
        }
      } else {
        toast.info("AI analysis: No status change recommended");
      }
    } catch (error) {
      console.error("Error with AI status check:", error);
      toast.error("Failed to analyze request status");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleExport = async () => {
    // Placeholder for export functionality
    toast.info("Export functionality will be implemented");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading request details...
      </div>
    );
  }

  if (!request) {
    return notFound();
  }

  // Helper to render the correct data fields based on request type
  const renderRequestData = () => {
    const data = request.submittedData;

    // For bulk WBS, render a table
    if (Array.isArray(data)) {
      return (
        <div className="space-y-4">
          <p className="font-medium">WBS Elements ({data.length} items)</p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Controlling Area</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Code</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Definition</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsible PC/CC</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planning Element</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rubric Element</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billing Element</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((wbs, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{wbs.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{wbs.controllingArea}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{wbs.companyCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{wbs.projectName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{wbs.projectDefinition}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{wbs.level}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{wbs.responsiblePCCC}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{wbs.planningElement ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{wbs.rubricElement ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{wbs.billingElement ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // For single request
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(data).map(([key, value]) => {
          // Skip region as it's already shown above
          if (key === "region") return null;

          // Format date fields - handle both Date and Firestore Timestamp
          if (
            value &&
            (value instanceof Date ||
              (typeof value === "object" && "toDate" in value))
          ) {
            return (
              <div key={key}>
                <p className="text-sm font-medium capitalize">{key}</p>
                <p>{formatDate(value)}</p>
              </div>
            );
          }

          // Handle null values
          if (value === null) {
            return (
              <div key={key}>
                <p className="text-sm font-medium capitalize">{key}</p>
                <p>Not specified</p>
              </div>
            );
          }

          return (
            <div key={key}>
              <p className="text-sm font-medium capitalize">
                {key.replace(/([A-Z])/g, " $1")}
              </p>
              <p>{String(value)}</p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin - Request Management</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExport}>
            Export
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>
                {request.requestType} - {request.region}
                <span className="block text-lg font-normal mt-1">{request.requestName}</span>
              </CardTitle>
              <CardDescription>
                Submitted on {formatDate(request.createdAt)} by{" "}
                {request.requesterEmail}
              </CardDescription>
            </div>
            <Badge variant={statusColors[request.status]}>
              {request.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Request ID</p>
                <p className="font-mono">{request.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p>{formatDate(request.updatedAt)}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-4">Update Status</h3>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Select
                    value={newStatus}
                    onValueChange={(value) =>
                      setNewStatus(value as RequestStatus)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Submitted">Submitted</SelectItem>
                      <SelectItem value="InProgress">In Progress</SelectItem>
                      <SelectItem value="PendingInfo">Pending Info</SelectItem>
                      <SelectItem value="ForwardedToSD">
                        Forwarded to SD
                      </SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleStatusChange}
                  disabled={
                    submitting || !newStatus || newStatus === request.status
                  }
                >
                  Update Status
                </Button>
                <AiButton
                  variant="subtle"
                  onClick={handleAiStatusCheck}
                  isLoading={isCheckingStatus}
                  disabled={isCheckingStatus}
                >
                  AI Suggest
                </AiButton>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-4">Request Details</h3>
              {renderRequestData()}
            </div>

            <Tabs defaultValue="comments" className="border-t pt-4">
              <TabsList className="mb-4">
                <TabsTrigger value="comments">Public Comments</TabsTrigger>
                <TabsTrigger value="internal">Internal Notes</TabsTrigger>
                <TabsTrigger value="history">Status History</TabsTrigger>
              </TabsList>

              <TabsContent value="comments" className="space-y-4">
                <h3 className="text-lg font-medium mb-2">Comments</h3>
                {request.comments.length === 0 ? (
                  <p className="text-muted-foreground">No comments yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {request.comments.map((comment, index) => (
                      <li
                        key={index}
                        className={`border rounded-md p-3 ${
                          comment.isAiResponse
                            ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-900/50"
                            : ""
                        }`}
                      >
                        <div className="flex justify-between mb-2">
                          <span className="font-medium flex items-center">
                            {comment.userName}
                            {comment.isAiResponse && (
                              <Badge
                                className="ml-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 border-0"
                                variant="outline"
                              >
                                AI
                              </Badge>
                            )}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(comment.timestamp)}
                          </span>
                        </div>
                        <p
                          className={`whitespace-pre-wrap ${
                            comment.isAiResponse
                              ? "text-blue-900 dark:text-blue-200"
                              : ""
                          }`}
                        >
                          {comment.text}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="space-y-4 pt-4">
                  <Textarea
                    placeholder="Add a public comment (visible to requester)..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="resize-none"
                  />
                  <Button
                    onClick={handleCommentSubmit}
                    disabled={submitting || !comment.trim()}
                  >
                    {submitting ? "Submitting..." : "Add Public Comment"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="internal" className="space-y-4">
                {request.internalComments.length === 0 ? (
                  <p className="text-muted-foreground">
                    No internal notes yet.
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {request.internalComments.map((comment, index) => (
                      <li
                        key={index}
                        className={`border rounded-md p-3 ${
                          comment.isAiResponse
                            ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-900/50"
                            : "bg-muted/20"
                        }`}
                      >
                        <div className="flex justify-between mb-2">
                          <span className="font-medium flex items-center">
                            {comment.userName}
                            {comment.isAiResponse && (
                              <Badge
                                className="ml-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 border-0"
                                variant="outline"
                              >
                                AI
                              </Badge>
                            )}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(comment.timestamp)}
                          </span>
                        </div>
                        <p
                          className={`whitespace-pre-wrap ${
                            comment.isAiResponse
                              ? "text-blue-900 dark:text-blue-200"
                              : ""
                          }`}
                        >
                          {comment.text}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="space-y-4 pt-4">
                  <Textarea
                    placeholder="Add an internal note (only visible to MDM team)..."
                    value={internalComment}
                    onChange={(e) => setInternalComment(e.target.value)}
                    className="resize-none"
                  />
                  <Button
                    onClick={handleInternalCommentSubmit}
                    disabled={submitting || !internalComment.trim()}
                  >
                    {submitting ? "Submitting..." : "Add Internal Note"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="history">
                <ul className="space-y-2">
                  {request.history.map((entry, index) => (
                    <li
                      key={index}
                      className="flex justify-between py-2 border-b"
                    >
                      <span>
                        Status changed to{" "}
                        <Badge variant={statusColors[entry.status]}>
                          {entry.status}
                        </Badge>{" "}
                        by {entry.changedByUserName}
                      </span>
                      <span className="text-muted-foreground">
                        {formatDate(entry.timestamp)}
                      </span>
                    </li>
                  ))}
                </ul>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
