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
  objectType: z.enum(["WBS", "PC", "CC"]),
  objectId: z
    .string()
    .min(3, { message: "Object ID is required" })
    .max(50, { message: "Object ID must be less than 50 characters" }),
  region: z.enum(["DE", "NL", "SE", "DK", "UK"] as [Region, ...Region[]]),
  changes: z
    .string()
    .min(10, { message: "Changes must be at least 10 characters" })
    .max(1000, { message: "Changes must be less than 1000 characters" }),
  justification: z
    .string()
    .min(5, { message: "Justification must be at least 5 characters" })
    .max(500, { message: "Justification must be less than 500 characters" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function ModifyRequestForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      objectType: "WBS",
      objectId: "",
      region: "DE",
      changes: "",
      justification: "",
    },
  });

  async function onSubmit(data: FormValues) {
    if (!user) {
      toast.error("You must be logged in to submit a request.");
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        requestType: "Modify",
        requesterId: user.uid,
        requesterEmail: user.email,
        region: data.region,
        status: "Submitted" as RequestStatus,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        submittedData: {
          objectType: data.objectType,
          objectId: data.objectId,
          region: data.region,
          changes: data.changes,
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
      toast.success("Modification request submitted successfully!");
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
                <FormDescription>
                  Select the type of object you want to modify
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-6">
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
                    The ID of the object you want to modify
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="changes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Required Changes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe in detail what changes need to be made to this object..."
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Be specific about what fields/properties need to be modified and
                their new values
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
                  placeholder="Explain why these changes are necessary..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Submitting..." : "Submit Modification Request"}
        </Button>
      </form>
    </Form>
  );
}
