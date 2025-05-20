"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  doc,
  updateDoc,
  arrayUnion,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/auth";
import { 
  Request, 
  Comment, 
  RequestStatus,
  StoredWBSData,
} from "@/types";
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
import { AIService } from "@/lib/services/ai-service";
import { ExportButton } from "@/components/ExportButton";
import { 
  getControllingAreaOptions, 
  getProjectTypeOptions, 
  getFunctionalAreaOptions, 
  getProjectSpecOptions 
} from "@/components/forms/WBSForm";

// Status color mapping
const statusColors: Record<RequestStatus, "default" | "secondary" | "warning" | "success" | "destructive"> = {
  Submitted: "default",
  "In Progress": "secondary",
  Completed: "success",
  Rejected: "destructive",
};

// Update type guard function
function isWBSData(data: unknown): data is StoredWBSData[] {
  return Array.isArray(data) && data.length > 0 && 'controllingArea' in data[0];
}

// Add formatDate function
const formatDate = (timestamp: Date | { toDate: () => Date } | null) => {
  if (!timestamp) return "N/A";
  if ('toDate' in timestamp) {
    return format(timestamp.toDate(), "dd MMM yyyy HH:mm");
  }
  return format(timestamp, "dd MMM yyyy HH:mm");
};

const statusDisplayMap: Record<string, string> = {
  'In Progress': 'Progress',
  PendingInfo: 'Pending',
  ForwardedToSD: 'Forwarded',
  Submitted: 'Submitted',
  Completed: 'Completed',
  Rejected: 'Rejected',
};

export default function RequestDetailPage({
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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const requestRef = doc(db, "requests", requestId);
    const unsubscribe = onSnapshot(
      requestRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const requestData = { id: docSnap.id, ...docSnap.data() } as Request;

          // Only show the request if it belongs to the current user
          if (requestData.requesterId === user.uid) {
            setRequest(requestData);
          } else {
            router.push("/dashboard");
          }
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

      // Check if AI replies are enabled and generate an AI response
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
    if (isWBSData(data)) {
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="font-medium">WBS Elements ({data.length} items)</p>
            <ExportButton 
              wbsData={data} 
              requestName={request.requestName}
              submissionDate={
                (() => {
                  const d = request.createdAt;
                  let dateObj;
                  if (d && typeof d === 'object' && 'toDate' in d) {
                    dateObj = d.toDate();
                  } else if (d && typeof d === 'object' && Object.prototype.toString.call(d) === '[object Date]') {
                    dateObj = d;
                  } else {
                    dateObj = new Date();
                  }
                  const yyyy = dateObj.getFullYear();
                  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                  const dd = String(dateObj.getDate()).padStart(2, '0');
                  return `${yyyy}${mm}${dd}`;
                })()
              }
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Region</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">System</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Controlling Area</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Company Code</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Project Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Project Definition</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Level</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Project Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Investment Profile</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Responsible Profit Center</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Responsible Cost Center</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Planning Element</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Rubric Element</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Billing Element</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Settlement Rule %</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Settlement Rule Goal</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Project Profile</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">TM1 Project</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Responsible Person</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">User ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Employment Number</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Functional Area</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">TG Phase</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Project Spec</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Mother Code</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Comment</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((wbs, index) => {
                  // Label helpers
                  const controllingAreaLabel = getControllingAreaOptions(wbs.region).find(opt => opt.value === wbs.controllingArea)?.label || wbs.controllingArea;
                  const projectTypeLabel = getProjectTypeOptions(wbs.region).find(opt => opt.value === wbs.projectType)?.label || wbs.projectType;
                  const functionalAreaLabel = getFunctionalAreaOptions(wbs.region).find(opt => opt.value === wbs.functionalArea)?.label || wbs.functionalArea;
                  const projectSpecLabel = getProjectSpecOptions(wbs.region).find(opt => opt.value === wbs.projectSpec)?.label || wbs.projectSpec;
                  // Region label (optional: use a mapping for full name)
                  const regionLabel = wbs.region;
                  return (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-semibold">{regionLabel}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{wbs.type}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{wbs.system}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{controllingAreaLabel}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{wbs.companyCode}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{wbs.projectName}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{wbs.projectDefinition}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{wbs.level}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{projectTypeLabel}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{wbs.investmentProfile}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{wbs.responsibleProfitCenter}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{wbs.responsibleCostCenter}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{wbs.planningElement ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{wbs.rubricElement ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{wbs.billingElement ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{wbs.settlementRulePercent}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{wbs.settlementRuleGoal}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{wbs.projectProfile}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{wbs.tm1Project}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{wbs.responsiblePerson}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{wbs.userId}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{wbs.employmentNumber}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{functionalAreaLabel}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{wbs.tgPhase}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{projectSpecLabel}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{wbs.motherCode}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{wbs.comment}</td>
                    </tr>
                  );
                })}
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Request Details</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>
                {request.requestType} - {request.requestName}
              </CardTitle>
              <CardDescription>
                Submitted on {formatDate(request.createdAt)}
              </CardDescription>
            </div>
            <Badge variant={statusColors[request.status]}>
              {statusDisplayMap[request.status] || request.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium">Request ID</p>
                <p className="font-mono">{request.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Requester</p>
                <p>{request.requesterDisplayName || request.requesterEmail}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Regions</p>
                <p>
                  {isWBSData(request.submittedData) 
                    ? Array.from(new Set(request.submittedData.map(wbs => wbs.region))).join(", ")
                    : request.region}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-4">Request Details</h3>
              {renderRequestData()}
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-4">Status History</h3>
              <ul className="space-y-2">
                {request.history.map((entry, index) => (
                  <li key={index} className="flex justify-between">
                    <span>
                      Status changed to <strong>{statusDisplayMap[entry.status] || entry.status}</strong> by{" "}
                      {entry.changedByUserName}
                    </span>
                    <span className="text-muted-foreground">
                      {formatDate(entry.timestamp)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-4">Comments</h3>
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
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="w-full space-y-4">
            <Textarea
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none"
            />
            <Button
              onClick={handleCommentSubmit}
              disabled={submitting || !comment.trim()}
            >
              {submitting ? "Submitting..." : "Add Comment"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
