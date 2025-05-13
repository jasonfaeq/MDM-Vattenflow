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
  Region,
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

const formSchema = z.object({
  requestType: z.string().min(1, "Request type is required"),
  requestName: z.string().min(1, "Request name is required"),
  region: z.string().min(1, "Region is required"),
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
      region: initialData.region,
      submittedData: initialData.submittedData,
    } : {
      requestType: "",
      requestName: "",
      region: "",
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
        region: formValues.region as Region,
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
        region: formValues.region as Region,
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
          region={formValues.region as Region} 
          onSubmit={submitWBSRequest as any} // Type assertion to fix type mismatch
          initialData={initialData?.submittedData as any} // Type assertion to fix type mismatch
        />;
      case "PCCC":
        return <PCCCForm 
          region={formValues.region as Region} 
          onSubmit={submitPCCCRequest}
          initialData={initialData?.submittedData as PCCCData[]}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{initialData ? "Edit Request" : "New MDM Request"}</CardTitle>
          <CardDescription>
            {initialData ? "Update your request details" : "Submit a new request to the MDM team for processing"}
          </CardDescription>
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
                        <FormLabel>Request Name</FormLabel>
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

                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select region" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="DE">Germany (DE)</SelectItem>
                            <SelectItem value="NL">Netherlands (NL)</SelectItem>
                            <SelectItem value="SE">Sweden (SE)</SelectItem>
                            <SelectItem value="DK">Denmark (DK)</SelectItem>
                            <SelectItem value="UK">United Kingdom (UK)</SelectItem>
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">
                    {formValues?.requestType} Request - {formValues?.region}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Fill in the required details below
                  </p>
                </div>
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
              </div>

              {renderFormByType()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
