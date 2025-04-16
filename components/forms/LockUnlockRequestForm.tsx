"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Region, RequestStatus } from "@/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const formSchema = z.object({
  action: z.enum(["Lock", "Unlock"]),
  objectType: z.enum(["WBS", "PC", "CC"]),
  objectId: z
    .string()
    .min(3, { message: "Object ID is required" })
    .max(50, { message: "Object ID must be less than 50 characters" }),
  region: z.enum(["DE", "NL", "SE", "DK", "UK"] as [Region, ...Region[]]),
  effectiveDate: z.string().optional(),
  justification: z
    .string()
    .min(5, { message: "Justification must be at least 5 characters" })
    .max(500, { message: "Justification must be less than 500 characters" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function LockUnlockRequestForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      action: "Lock",
      objectType: "WBS",
      objectId: "",
      region: "DE",
      effectiveDate: "",
      justification: "",
    },
  });

  // Get the current action type to customize form text
  const actionType = form.watch("action");

  async function onSubmit(data: FormValues) {
    if (!user) {
      toast.error("You must be logged in to submit a request.");
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        requestType: data.action,
        requesterId: user.uid,
        requesterEmail: user.email,
        region: data.region,
        status: "Submitted" as RequestStatus,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        submittedData: {
          action: data.action,
          objectType: data.objectType,
          objectId: data.objectId,
          region: data.region,
          effectiveDate: data.effectiveDate || "",
          justification: data.justification,
        },
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
      toast.success(`${data.action} request submitted successfully!`);
      router.push(`/requests/${docRef.id}`);
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="action"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Action</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="Lock" />
                      </FormControl>
                      <FormLabel className="font-normal">Lock</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="Unlock" />
                      </FormControl>
                      <FormLabel className="font-normal">Unlock</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormDescription>
                  Select whether you want to lock or unlock an object
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="objectType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Object Type</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="WBS" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Work Breakdown Structure (WBS)
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="PC" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Profit Center (PC)
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="CC" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Cost Center (CC)
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <SelectValue placeholder="Select a region" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="DE">Germany</SelectItem>
                    <SelectItem value="NL">Netherlands</SelectItem>
                    <SelectItem value="SE">Sweden</SelectItem>
                    <SelectItem value="DK">Denmark</SelectItem>
                    <SelectItem value="UK">United Kingdom</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="objectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Object ID</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. WBS-12345 or PC-789" {...field} />
                </FormControl>
                <FormDescription>
                  The ID of the object you want to {actionType.toLowerCase()}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="effectiveDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Effective Date (Optional)</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormDescription>
                When should this {actionType.toLowerCase()} take effect? Leave
                blank for immediate action.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="justification"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Justification</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={`Explain why this object needs to be ${actionType.toLowerCase()}ed...`}
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Submitting..." : `Submit ${actionType} Request`}
        </Button>
      </form>
    </Form>
  );
}
