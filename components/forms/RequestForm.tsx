"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase/config";
import { collection, updateDoc, doc, Timestamp, serverTimestamp, query, where, getDocs, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import WBSForm from "./WBSForm";
import PCCCForm from "./PCCCForm";
import {
  Request,
  WBSData,
  PCCCData,
  StoredWBSData,
  StoredPCCCData,
  RequestType,
  RequestStatus,
} from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Info } from "lucide-react";

const formSchema = z.object({
  requestType: z.string().min(1, "Request type is required"),
  requestName: z.string().min(1, "Request name is required"),
  submittedData: z.any(),
});

type FormValues = z.infer<typeof formSchema>;

interface RequestFormProps {
  initialData?: Request;
  onSubmitSuccess?: () => void;
  isAdmin?: boolean; // Add this line
}

export default function RequestForm({ initialData, onSubmitSuccess, isAdmin }: RequestFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formValues, setFormValues] = useState<FormValues | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Example usage of isAdmin
  if (isAdmin) {
    console.log("Admin is editing the request");
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      requestType: initialData.requestType,
      requestName: initialData.requestName,
      submittedData: initialData.submittedData,
    } : {
      requestType: "",
      requestName: "",
      submittedData: {},
    },
  });

  const onFirstStepSubmit = (values: FormValues) => {
    setFormValues(values);
    setStep(2);
  };

  const submitWBSRequest = async (data: WBSData[]) => {
    if (!user || !formValues) return;

    setIsSubmitting(true);
    try {
      const convertDates = (data: WBSData): StoredWBSData => ({
        ...data,
        startDate: data.startDate instanceof Date ? Timestamp.fromDate(data.startDate) : null,
        endDate: data.endDate instanceof Date ? Timestamp.fromDate(data.endDate) : null,
      });

      const requestData = {
        requesterId: user.uid,
        requesterEmail: user.email,
        requesterDisplayName: user.displayName,
        requestType: formValues.requestType as RequestType,
        requestName: formValues.requestName,
        status: "Submitted" as RequestStatus,
        updatedAt: serverTimestamp() as Timestamp,
        submittedData: data.map(convertDates),
      };

      if (initialData?.id) {
        // Update existing request
        await updateDoc(doc(db, "requests", initialData.id), {
          ...requestData,
          status: initialData.status, // Preserve the current status
        });
        toast.success("Request updated successfully!");
      } else {
        // Create new request with custom ID
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const datePrefix = `${yyyy}${mm}${dd}`;
        const requestsRef = collection(db, 'requests');
        const q = query(requestsRef, where("createdDate", "==", datePrefix));
        const snapshot = await getDocs(q);
        const countToday = snapshot.size + 1;
        const requestId = `${datePrefix}${String(countToday).padStart(3, '0')}`;
        await setDoc(doc(db, 'requests', requestId), {
          ...requestData,
          createdAt: serverTimestamp() as Timestamp,
          createdDate: datePrefix,
          comments: [],
          internalComments: [],
          history: [],
        });
        toast.success("Request submitted successfully!");
        onSubmitSuccess?.();
        router.push(`/requests/${requestId}`);
        return;
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitPCCCRequest = async (data: PCCCData[]) => {
    if (!user || !formValues) return;

    setIsSubmitting(true);
    try {
      const convertDates = (data: PCCCData): StoredPCCCData => ({
        ...data,
        startDate: data.startDate instanceof Date ? Timestamp.fromDate(data.startDate) : null,
        endDate: data.endDate instanceof Date ? Timestamp.fromDate(data.endDate) : null,
      });

      const requestData = {
        requesterId: user.uid,
        requesterEmail: user.email,
        requesterDisplayName: user.displayName,
        requestType: formValues.requestType as RequestType,
        requestName: formValues.requestName,
        status: "Submitted" as RequestStatus,
        updatedAt: serverTimestamp() as Timestamp,
        submittedData: data.map(convertDates),
      };

      if (initialData?.id) {
        // Update existing request
        await updateDoc(doc(db, "requests", initialData.id), {
          ...requestData,
          status: initialData.status, // Preserve the current status
        });
        toast.success("Request updated successfully!");
      } else {
        // Create new request with custom ID
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const datePrefix = `${yyyy}${mm}${dd}`;
        const requestsRef = collection(db, 'requests');
        const q = query(requestsRef, where("createdDate", "==", datePrefix));
        const snapshot = await getDocs(q);
        const countToday = snapshot.size + 1;
        const requestId = `${datePrefix}${String(countToday).padStart(3, '0')}`;
        await setDoc(doc(db, 'requests', requestId), {
          ...requestData,
          createdAt: serverTimestamp() as Timestamp,
          createdDate: datePrefix,
          comments: [],
          internalComments: [],
          history: [],
        });
        toast.success("Request submitted successfully!");
        onSubmitSuccess?.();
        router.push(`/requests/${requestId}`);
        return;
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormByType = () => {
    if (!formValues) return null;
    switch (formValues.requestType) {
      case "WBS":
        return <WBSForm 
          onSubmit={submitWBSRequest}
          initialData={initialData?.submittedData as WBSData[]}
          requestName={formValues.requestName}
        />;
      case "PCCC":
        return <PCCCForm 
          onSubmit={submitPCCCRequest}
          initialData={initialData?.submittedData as PCCCData[]}
          region="DE"
        />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{initialData ? "Edit Request" : "New MDM Request"}</CardTitle>
              <CardDescription>
                {initialData ? "Update your request details" : "Submit a new request to the MDM team for processing"}
              </CardDescription>
            </div>
            {step === 2 && (
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onFirstStepSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="requestName"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel className="mb-0">Request Name</FormLabel>
                          <Dialog>
                            <DialogTrigger asChild>
                              <button
                                type="button"
                                className="text-muted-foreground hover:text-primary focus:outline-none flex items-center justify-center bg-transparent"
                                style={{ padding: 0, lineHeight: 1 }}
                                tabIndex={0}
                              >
                                <Info className="h-4 w-4" aria-label="Request Name Info" />
                              </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Request Name Guidance</DialogTitle>
                              </DialogHeader>
                              <div className="mt-2">
                                Choose a name that is appropriate and unique for your request. It can be based off of your header element, or the region, or multiple factors.
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <FormControl>
                          <Input placeholder="Enter request name" {...field} autoComplete="off" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="requestType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Request Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select request type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="WBS">WBS Element</SelectItem>
                            <SelectItem value="PCCC">PC/CC</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Continue"}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="space-y-6">
              {renderFormByType()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
