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

const formSchema = z.object({
  costCenterName: z
    .string()
    .min(3, { message: "Cost center name is required" })
    .max(100, { message: "Cost center name must be less than 100 characters" }),
  region: z.enum(["DE", "NL", "SE", "DK", "UK"] as [Region, ...Region[]]),
  businessUnit: z.string().min(2, { message: "Business unit is required" }),
  manager: z.string().min(3, { message: "Manager name is required" }),
  companyCode: z.string().min(1, { message: "Company code is required" }),
  profitCenter: z.string().min(2, { message: "Profit center is required" }),
  description: z
    .string()
    .min(5, { message: "Description must be at least 5 characters" })
    .max(500, { message: "Description must be less than 500 characters" })
    .optional(),
  justification: z
    .string()
    .min(5, { message: "Justification must be at least 5 characters" })
    .max(500, { message: "Justification must be less than 500 characters" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function CCRequestForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      costCenterName: "",
      region: "DE",
      businessUnit: "",
      manager: "",
      companyCode: "",
      profitCenter: "",
      description: "",
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
        requestType: "CC",
        requesterId: user.uid,
        requesterEmail: user.email,
        region: data.region,
        status: "Submitted" as RequestStatus,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        submittedData: {
          costCenterName: data.costCenterName,
          region: data.region,
          businessUnit: data.businessUnit,
          manager: data.manager,
          companyCode: data.companyCode,
          profitCenter: data.profitCenter,
          description: data.description || "",
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
      toast.success("Cost Center request submitted successfully!");
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
                <FormDescription>
                  The region where this cost center will be used
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="costCenterName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost Center Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. WIND-MAINT-2023" {...field} />
                </FormControl>
                <FormDescription>
                  Name that identifies the purpose of this cost center
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="businessUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Unit</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Wind Operations" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="manager"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manager</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. John Smith" {...field} />
                </FormControl>
                <FormDescription>
                  Person responsible for this cost center
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="companyCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Code</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. VTF01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="profitCenter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profit Center</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. PC123" {...field} />
                </FormControl>
                <FormDescription>
                  The profit center this cost center is linked to
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide additional details about this cost center request..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
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
                  placeholder="Explain why this cost center is needed..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Submitting..." : "Submit CC Request"}
        </Button>
      </form>
    </Form>
  );
}
