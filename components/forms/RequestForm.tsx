"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/auth";
import {
  Request,
  RequestType,
  Region,
  WBSData,
  PCData,
  CCData,
  ModifyData,
  LockUnlockData,
} from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import WBSForm from "./WBSForm";
import PCForm from "./PCForm";
import CCForm from "./CCForm";
import ModifyRequestForm from "./ModifyRequestForm";
import LockUnlockRequestForm from "./LockUnlockRequestForm";

const formSchema = z.object({
  requestType: z.string() as z.ZodType<RequestType>,
  region: z.string() as z.ZodType<Region>,
});

type FormValues = z.infer<typeof formSchema>;

export default function RequestForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formValues, setFormValues] = useState<FormValues | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requestType: "WBS",
      region: "DE",
    },
  });

  const onFirstStepSubmit = (values: FormValues) => {
    setFormValues(values);
    setStep(2);
  };

  const submitRequest = async (submittedData: any) => {
    if (!user || !formValues) return;

    setIsSubmitting(true);
    try {
      // Create request object
      const now = Timestamp.now();

      // Handle both single and bulk submissions
      if (Array.isArray(submittedData)) {
        // For bulk submissions
        const submissions = submittedData.map(async (itemData) => {
          const request: Omit<Request, "id"> = {
            requesterId: user.uid,
            requesterEmail: user.email,
            requestType: formValues.requestType,
            region: formValues.region,
            status: "Submitted",
            createdAt: now,
            updatedAt: now,
            submittedData: {
              ...itemData,
              startDate: itemData.startDate
                ? Timestamp.fromDate(itemData.startDate)
                : null,
              endDate: itemData.endDate
                ? Timestamp.fromDate(itemData.endDate)
                : null,
            },
            comments: [],
            internalComments: [],
            history: [
              {
                timestamp: now,
                status: "Submitted",
                changedByUserId: user.uid,
                changedByUserName: user.displayName || user.email,
              },
            ],
          };
          return addDoc(collection(db, "requests"), request);
        });

        await Promise.all(submissions);
        toast.success("Bulk request submitted successfully!");
        router.push("/requests");
      } else {
        // For single submissions
        const request: Omit<Request, "id"> = {
          requesterId: user.uid,
          requesterEmail: user.email,
          requestType: formValues.requestType,
          region: formValues.region,
          status: "Submitted",
          createdAt: now,
          updatedAt: now,
          submittedData: {
            ...submittedData,
            startDate: submittedData.startDate
              ? Timestamp.fromDate(submittedData.startDate)
              : null,
            endDate: submittedData.endDate
              ? Timestamp.fromDate(submittedData.endDate)
              : null,
          },
          comments: [],
          internalComments: [],
          history: [
            {
              timestamp: now,
              status: "Submitted",
              changedByUserId: user.uid,
              changedByUserName: user.displayName || user.email,
            },
          ],
        };

        // Add to Firestore
        const docRef = await addDoc(collection(db, "requests"), request);
        toast.success("Request submitted successfully!");
        router.push(`/requests/${docRef.id}`);
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
        return <WBSForm region={formValues.region} onSubmit={submitRequest} />;
      case "PC":
        return <PCForm region={formValues.region} onSubmit={submitRequest} />;
      case "CC":
        return <CCForm region={formValues.region} onSubmit={submitRequest} />;
      case "Modify":
        return <ModifyRequestForm />;
      case "Lock":
      case "Unlock":
        return <LockUnlockRequestForm />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>New MDM Request</CardTitle>
          <CardDescription>
            Submit a new request to the MDM team for processing
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
                            <SelectItem value="PC">Profit Center</SelectItem>
                            <SelectItem value="CC">Cost Center</SelectItem>
                            <SelectItem value="Modify">Modify</SelectItem>
                            <SelectItem value="Lock">Lock</SelectItem>
                            <SelectItem value="Unlock">Unlock</SelectItem>
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
                            <SelectItem value="UK">
                              United Kingdom (UK)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit">Continue</Button>
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
