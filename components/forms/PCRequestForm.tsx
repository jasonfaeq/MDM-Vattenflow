"use client";

import { useState } from "react";
import { toast } from "sonner";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { PCData, Region, RequestStatus } from "@/types";
import PCForm from "@/components/forms/PCForm";

export default function PCRequestForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(data: PCData | PCData[]) {
    if (!user) {
      toast.error("You must be logged in to submit a request.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Handle both single and bulk submissions
      if (Array.isArray(data)) {
        // Bulk submission
        const submissions = data.map(async (pcData) => {
          const requestData = {
            requestType: "PC",
            requesterId: user.uid,
            requesterEmail: user.email,
            region: pcData.region,
            status: "Submitted" as RequestStatus,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            submittedData: pcData,
            comments: [],
            internalComments: [],
            history: [
              {
                timestamp: Timestamp.now(),
                status: "Submitted" as RequestStatus,
                changedByUserId: user.uid,
                changedByUserName: user.displayName || user.email,
              },
            ],
          };

          return addDoc(collection(db, "requests"), requestData);
        });

        await Promise.all(submissions);
        toast.success("Bulk Profit Center requests submitted successfully!");
        router.push("/dashboard");
      } else {
        // Single submission
        const requestData = {
          requestType: "PC",
          requesterId: user.uid,
          requesterEmail: user.email,
          region: data.region,
          status: "Submitted" as RequestStatus,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          submittedData: data,
          comments: [],
          internalComments: [],
          history: [
            {
              timestamp: Timestamp.now(),
              status: "Submitted" as RequestStatus,
              changedByUserId: user.uid,
              changedByUserName: user.displayName || user.email,
            },
          ],
        };

        const docRef = await addDoc(collection(db, "requests"), requestData);
        toast.success("Profit Center request submitted successfully!");
        router.push(`/requests/${docRef.id}`);
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Profit Center Request</h1>
      <PCForm region="DE" onSubmit={handleSubmit} />
    </div>
  );
}
