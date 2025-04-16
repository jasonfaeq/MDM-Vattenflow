"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
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
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

// Status color mapping
const statusColors: Record<string, string> = {
  Submitted: "default",
  InProgress: "secondary",
  PendingInfo: "warning",
  ForwardedToSD: "secondary",
  Completed: "success",
  Rejected: "destructive",
};

export default function AdminRequestsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== "MDM") {
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user || user.role !== "MDM") return;

    // Create a query against the requests collection
    const q = query(collection(db, "requests"), orderBy("createdAt", "desc"));

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

  // Filter requests based on search term
  const filteredRequests = requests.filter((request) => {
    const searchValue = searchTerm.toLowerCase();
    return (
      request.id?.toLowerCase().includes(searchValue) ||
      request.requestType.toLowerCase().includes(searchValue) ||
      request.region.toLowerCase().includes(searchValue) ||
      request.requesterEmail.toLowerCase().includes(searchValue) ||
      request.status.toLowerCase().includes(searchValue)
    );
  });

  const handleDeleteRequest = async () => {
    if (!selectedRequest?.id) return;

    try {
      await deleteDoc(doc(db, "requests", selectedRequest.id));
      setIsDeleteDialogOpen(false);
      toast.success("Request deleted successfully");
    } catch (error) {
      console.error("Error deleting request:", error);
      toast.error("Failed to delete request");
    }
  };

  if (loading) {
    return <div className="flex justify-center p-4">Loading requests...</div>;
  }

  return (
    <div className="container mx-auto">
      <div className="flex flex-col gap-4 mb-6">
        <h1 className="text-2xl font-bold">All Requests (Admin)</h1>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search by ID, type, region, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No requests found</CardTitle>
            <CardDescription>
              {searchTerm
                ? "No requests match your search criteria."
                : "There are no requests in the system yet."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {searchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Clear search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Request History</CardTitle>
            <CardDescription>
              {filteredRequests.length} requests found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>All submitted requests</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.id ? `${request.id.slice(0, 8)}...` : "Unknown"}
                    </TableCell>
                    <TableCell>{request.requestType}</TableCell>
                    <TableCell>{request.region}</TableCell>
                    <TableCell>{request.requesterEmail}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[request.status] as any}>
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(request.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/requests/${request.id}`}>
                            Manage
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete request {selectedRequest?.id}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRequest}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
