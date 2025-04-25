"use client";

import React from "react";
import { useState, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/auth";
import { Request } from "@/types";
import RequestForm from "@/components/forms/RequestForm";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminEditRequestPage({ params }: PageProps) {
  const { id: requestId } = React.use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="flex justify-center p-4">Loading request...</div>;
  }

  if (!request) {
    return null;
  }

  return <RequestForm initialData={request} isAdmin={true} />;
} 