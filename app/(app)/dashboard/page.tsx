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
import { Input } from "@/components/ui/input";
import { Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Status color mapping
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

// Update type guard function
function isWBSData(data: unknown): data is { region: string }[] {
  return Array.isArray(data) && data.length > 0 && 'controllingArea' in data[0];
}

const statusExplanations = [
  { label: "Submitted", desc: "The request has been submitted and is awaiting review.", color: "text-blue-600" },
  { label: "Progress", desc: "The request is currently being processed.", color: "text-yellow-600" },
  { label: "Pending", desc: "The request is waiting for additional information or action.", color: "text-orange-600" },
  { label: "Forwarded", desc: "The request has been forwarded to another department or SD.", color: "text-purple-600" },
  { label: "Completed", desc: "The request has been completed successfully.", color: "text-green-600" },
  { label: "Rejected", desc: "The request was reviewed and rejected.", color: "text-red-600" },
];

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
        (request.requestType ?? "").toLowerCase().includes(term) ||
        (request.region ?? "").toLowerCase().includes(term) ||
        (request.status ?? "").toLowerCase().includes(term) ||
        (request.requestName ?? "").toLowerCase().includes(term) ||
        (request.id ?? "").toLowerCase().includes(term)
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
    <div className="space-y-6 max-w-8xl mx-auto w-3/4">
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
            <Table className="w-full">
              <TableCaption>List of your MDM requests</TableCaption>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-[#ffe066] via-[#fffbe6] to-[#ffd600]">
                  <TableHead className="w-72 flex items-center gap-1">
                    Request ID
                    <Dialog>
                      <DialogTrigger asChild>
                        <button type="button" className="ml-1 text-muted-foreground hover:text-primary focus:outline-none">
                          <Info className="inline h-4 w-4 align-text-bottom" aria-label="Request ID Info" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Request ID Format</DialogTitle>
                        </DialogHeader>
                        <div className="mt-2 text-sm">
                          Each Request ID is generated using the following logic:<br />
                          <span className="font-mono">yyyymmddxxx</span><br />
                          <ul className="list-disc ml-5 mt-2">
                            <li><b>yyyy</b>: The 4-digit year when the request was created</li>
                            <li><b>mm</b>: The 2-digit month</li>
                            <li><b>dd</b>: The 2-digit day</li>
                            <li><b>xxx</b>: A unique sequence number for that day</li>
                          </ul>
                          <p className="mt-2">This ensures every request has a unique, chronological identifier that is easy to reference and track.</p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableHead>
                  <TableHead className="w-24">Type</TableHead>
                  <TableHead className="w-[500px]">Name</TableHead>
                  <TableHead className="w-48 text-center">Region</TableHead>
                  <TableHead className="w-48 text-center flex items-center gap-1 justify-center">
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
                              <span className={`font-semibold ${s.color}`}>{s.label}:</span> {s.desc}
                            </li>
                          ))}
                        </ul>
                      </DialogContent>
                    </Dialog>
                  </TableHead>
                  <TableHead className="w-56 text-center">Created</TableHead>
                  <TableHead className="w-56 text-center flex items-center gap-1 justify-center">
                    Actions
                    <Dialog>
                      <DialogTrigger asChild>
                        <button type="button" className="ml-1 text-muted-foreground hover:text-primary focus:outline-none">
                          <Info className="inline h-4 w-4 align-text-bottom" aria-label="Actions Info" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Editing Your Request</DialogTitle>
                        </DialogHeader>
                        <div className="mt-2 text-sm">
                          <p>
                            <b>You can edit your request as long as it is in <span className="text-blue-600 font-semibold">Submitted</span> status.</b>
                          </p>
                          <ul className="list-disc ml-5 mt-2">
                            <li>Click the <b>Edit</b> button in the Actions column.</li>
                            <li>You can update the request name and modify any WBS elements you have entered.</li>
                            <li>Once your request moves to another status (e.g., Progress, Pending, Forwarded), editing is disabled to ensure data integrity during processing.</li>
                          </ul>
                          <p className="mt-2">If you need to make changes after submission, please contact the MDM team for assistance.</p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="w-72 font-normal text-base break-all">{request.id}</TableCell>
                    <TableCell>{request.requestType}</TableCell>
                    <TableCell className="w-[400px]">{request.requestName}</TableCell>
                    <TableCell className="w-56 text-center align-middle font-normal text-base whitespace-nowrap">
                      {isWBSData(request.submittedData)
                        ? Array.from(new Set(request.submittedData.map(wbs => wbs.region))).join(", ")
                        : request.region}
                    </TableCell>
                    <TableCell className="w-28 text-center">
                      <Badge variant={statusColors[request.status] || "default"}>
                        {statusDisplayMap[request.status] || request.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-40 text-center">{formatDate(request.createdAt)}</TableCell>
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