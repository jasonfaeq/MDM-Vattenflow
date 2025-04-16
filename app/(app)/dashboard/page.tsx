"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { format } from "date-fns";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/auth";
import { Request } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { exportRequestsToCSV } from "@/lib/utils";

// Status color mapping
const statusColors: Record<string, string> = {
  Submitted: "default",
  InProgress: "secondary",
  PendingInfo: "warning",
  ForwardedToSD: "secondary",
  Completed: "success",
  Rejected: "destructive",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user) return;

    const requestsRef = collection(db, "requests");
    const q = query(
      requestsRef,
      where("requesterId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const requestsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Request[];

        setRequests(requestsData);
        setFilteredRequests(requestsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching requests:", error);
        toast.error("Failed to load your requests");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Apply search filter when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRequests(requests);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = requests.filter(
      (request) =>
        request.requestType.toLowerCase().includes(term) ||
        request.region.toLowerCase().includes(term) ||
        request.status.toLowerCase().includes(term)
    );

    setFilteredRequests(filtered);
    setSearchTerm(term);
  }, [searchTerm, requests]);

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

  const getTruncatedId = (id: string | undefined) => {
    if (!id) return "N/A";
    return id.length > 8 ? `${id.substring(0, 8)}...` : id;
  };

  const exportToCsv = () => {
    try {
      // Use the filtered requests if filtering is applied, otherwise use all requests
      const dataToExport =
        filteredRequests.length > 0 ? filteredRequests : requests;

      // Create a filename with the current date
      const date = new Date().toISOString().split("T")[0];
      const filename = `my-requests-${date}.csv`;

      exportRequestsToCSV(dataToExport, filename);
      toast.success("Requests exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>My Requests</CardTitle>
            <CardDescription>View and manage your MDM requests</CardDescription>
          </div>
          <Button onClick={exportToCsv} variant="outline" size="sm">
            Export to CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <div className="flex space-x-2">
              <Button asChild variant="default">
                <Link href="/requests/new">+ New Request</Link>
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center">Loading your requests...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                You haven't submitted any requests yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableCaption>List of your MDM requests</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{getTruncatedId(request.id)}</TableCell>
                    <TableCell>{request.requestType}</TableCell>
                    <TableCell>{request.region}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          (statusColors[request.status] as any) || "default"
                        }
                      >
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(request.createdAt)}</TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/requests/${request.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
