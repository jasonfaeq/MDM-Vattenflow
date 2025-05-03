"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { format } from "date-fns";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/auth";
import { Request, RequestStatus } from "@/types";
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
import { Input } from "@/components/ui/input";

// Status color mapping
const statusColors: Record<RequestStatus, "default" | "secondary" | "warning" | "success" | "destructive"> = {
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
        request.status.toLowerCase().includes(term) ||
        request.requestName.toLowerCase().includes(term) ||
        request.id.toLowerCase().includes(term)
    );
    setFilteredRequests(filtered);
  }, [searchTerm, requests]);

  const formatDate = (timestamp: Timestamp | Date | null) => {
    if (!timestamp) return "N/A";
    if ('toDate' in timestamp) {
      return format(timestamp.toDate(), "dd MMM yyyy");
    }
    if (timestamp instanceof Date) {
      return format(timestamp, "dd MMM yyyy");
    }
    return "Invalid date";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>My Requests</CardTitle>
            <CardDescription>View and manage your MDM requests</CardDescription>
          </div>
          <Button asChild variant="default">
            <Link href="/requests/new">+ New Request</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Input
              placeholder="Search by ID, type, region, status, name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
          {loading ? (
            <div className="py-8 text-center">Loading your requests...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                You haven&apos;t submitted any requests yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableCaption>List of your MDM requests</TableCaption>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-[#ffe066] via-[#fffbe6] to-[#ffd600]">
                  <TableHead className="w-64">Request ID</TableHead>
                  <TableHead className="w-24 text-center">Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-24 text-center">Region</TableHead>
                  <TableHead className="w-28 text-center">Status</TableHead>
                  <TableHead className="w-38 text-center">Created</TableHead>
                  <TableHead className="w-38 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="text-xs break-all w-64">{request.id}</TableCell>
                    <TableCell>{request.requestType}</TableCell>
                    <TableCell>{request.requestName}</TableCell>
                    <TableCell className="w-24 text-center">{request.region}</TableCell>
                    <TableCell className="w-28 text-center">
                      <Badge variant={statusColors[request.status]}>
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-32 text-center">{formatDate(request.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/requests/${request.id}`}>View</Link>
                        </Button>
                        {request.status === "Submitted" && (
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/requests/${request.id}/edit`}>Edit</Link>
                          </Button>
                        )}
                      </div>
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