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
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Request, RequestStatus, WBSData } from "@/types";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, Info } from "lucide-react";

// Status color mapping
const statusColors: Record<RequestStatus, "default" | "secondary" | "warning" | "success" | "destructive"> = {
  Submitted: "default",
  "In Progress": "secondary",
  Completed: "success",
  Rejected: "destructive",
};

const statusDisplayMap: Record<string, string> = {
  'In Progress': 'Progress',
  PendingInfo: 'Pending',
  ForwardedToSD: 'Forwarded',
  Submitted: 'Submitted',
  Completed: 'Completed',
  Rejected: 'Rejected',
};

const statusExplanations = [
  { label: "Submitted", desc: "The request has been submitted and is awaiting review." },
  { label: "Progress", desc: "The request is currently being processed." },
  { label: "Pending", desc: "The request is waiting for additional information or action." },
  { label: "Forwarded", desc: "The request has been forwarded to another department or SD." },
  { label: "Completed", desc: "The request has been completed successfully." },
  { label: "Rejected", desc: "The request was reviewed and rejected." },
];

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

  // Filter requests based on search term
  const filteredRequests = requests.filter((request) => {
    const searchValue = searchTerm.toLowerCase();
    return (
      (request.id ?? "").toLowerCase().includes(searchValue) ||
      (request.requestType ?? "").toLowerCase().includes(searchValue) ||
      (request.region ?? "").toLowerCase().includes(searchValue) ||
      (request.requesterEmail ?? "").toLowerCase().includes(searchValue) ||
      (request.status ?? "").toLowerCase().includes(searchValue) ||
      (request.requestName ?? "").toLowerCase().includes(searchValue)
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
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>All Requests (Admin)</CardTitle>
            <CardDescription>View and manage your MDM requests</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Input
              placeholder="Search by ID, type, region, name, requester..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
          {filteredRequests.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No requests match your search criteria."
                  : "There are no requests in the system yet."}
              </p>
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm("")} className="mt-4">
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableCaption>All submitted requests</TableCaption>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-[#ffe066] via-[#fffbe6] to-[#ffd600]">
                  <TableHead className="w-72">Request ID</TableHead>
                  <TableHead className="w-24">Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-56 text-center">Region</TableHead>
                  <TableHead className="w-56 text-center">Requester</TableHead>
                  <TableHead className="w-28 text-center flex items-center gap-1 justify-center">
                    Status
                    <Dialog>
                      <DialogTrigger asChild>
                        <button type="button" className="ml-1 text-muted-foreground hover:text-primary focus:outline-none">
                          <Info className="inline h-4 w-4 align-text-bottom" aria-label="Status Info" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Status Explanations</DialogTitle>
                        </DialogHeader>
                        <ul className="space-y-2 mt-2">
                          {statusExplanations.map((s) => (
                            <li key={s.label}>
                              <span className="font-semibold">{s.label}:</span> {s.desc}
                            </li>
                          ))}
                        </ul>
                      </DialogContent>
                    </Dialog>
                  </TableHead>
                  <TableHead className="w-38 text-center">Created</TableHead>
                  <TableHead className="w-38 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="w-72 font-normal text-base break-all">{request.id}</TableCell>
                    <TableCell>{request.requestType}</TableCell>
                    <TableCell>{request.requestName}</TableCell>
                    <TableCell className="w-56 text-center align-middle font-normal text-base whitespace-nowrap">
                      {Array.isArray(request.submittedData) && request.submittedData.length > 0 && 'controllingArea' in request.submittedData[0]
                        ? Array.from(new Set((request.submittedData as WBSData[]).map((wbs) => wbs.region))).join(", ")
                        : request.region}
                    </TableCell>
                    <TableCell className="w-56 text-center align-middle font-normal text-base whitespace-nowrap">
                      {request.requesterDisplayName || request.requesterEmail}
                    </TableCell>
                    <TableCell className="w-28 text-center">
                      <Badge variant={statusColors[request.status]}>
                        {statusDisplayMap[request.status] || request.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-32 text-center">{formatDate(request.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/requests/${request.id}`}>Manage</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/requests/${request.id}/edit`}>Edit</Link>
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
          )}
        </CardContent>
      </Card>

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
