"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Request } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { FileText } from "lucide-react";

// Status color mapping
const statusColors: Record<string, string> = {
  Submitted: "default",
  InProgress: "secondary",
  PendingInfo: "warning",
  ForwardedToSD: "secondary",
  Completed: "success",
  Rejected: "destructive",
};

export default function RequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Create a query against the requests collection
    const q = query(
      collection(db, "requests"),
      where("requesterId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const requestsList: Request[] = [];
        querySnapshot.forEach((doc) => {
          requestsList.push({ id: doc.id, ...doc.data() } as Request);
        });
        setRequests(requestsList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching requests:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    if (timestamp.toDate) {
      return format(timestamp.toDate(), "dd MMM yyyy");
    }
    if (timestamp instanceof Date) {
      return format(timestamp, "dd MMM yyyy");
    }
    return "Invalid date";
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">Loading your requests...</div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Requests</h1>
        <Button asChild>
          <Link href="/requests/new">
            <FileText className="mr-2 h-4 w-4" />
            New Request
          </Link>
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No requests found</CardTitle>
            <CardDescription>
              You haven't submitted any requests yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/requests/new">Create your first request</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Request History</CardTitle>
            <CardDescription>
              View and track the status of all your submitted requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>A list of your recent requests</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.id ? `${request.id.slice(0, 8)}...` : "Unknown"}
                    </TableCell>
                    <TableCell>{request.requestType}</TableCell>
                    <TableCell>{request.requestName}</TableCell>
                    <TableCell>{request.region}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[request.status] as any}>
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(request.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/requests/${request.id}`}>View</Link>
                        </Button>
                        {request.status === "Submitted" && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/requests/${request.id}/edit`}>Edit</Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
