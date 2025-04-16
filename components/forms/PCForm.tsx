"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Timestamp } from "firebase/firestore";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PCData, Region } from "@/types";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// PC schema based on the region
const basePCSchema = z.object({
  costCenter: z
    .string()
    .min(4, { message: "Cost center must be at least 4 characters" })
    .max(20, { message: "Cost center must be less than 20 characters" }),
  profitCenterName: z
    .string()
    .min(3, { message: "Profit center name is required" })
    .max(100, {
      message: "Profit center name must be less than 100 characters",
    }),
  region: z.string() as z.ZodType<Region>,
  department: z.string().min(2, { message: "Department is required" }),
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

// Remove single PC schema and keep only bulk
const formSchema = z.object({
  region: z.string() as z.ZodType<Region>,
  bulkPC: z.array(basePCSchema).min(1, "At least one PC item is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface PCFormProps {
  region: Region;
  onSubmit: (data: PCData[]) => Promise<void>;
}

export default function PCForm({ region, onSubmit }: PCFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      region,
      bulkPC: [
        {
          costCenter: "",
          profitCenterName: "",
          region,
          department: "",
          description: "",
          justification: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "bulkPC",
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      console.log("Submitting PC values:", values);
      await onSubmit(values.bulkPC as PCData[]);
    } catch (error) {
      console.error("Error submitting PC request:", error);
      throw error;
    }
  };

  const addPCItem = () => {
    append({
      costCenter: "",
      profitCenterName: "",
      region,
      department: "",
      description: "",
      justification: "",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Profit Center Entries</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPCItem}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Profit Center
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cost Center</TableHead>
                    <TableHead>Profit Center Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Justification</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`bulkPC.${index}.costCenter`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Enter cost center"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`bulkPC.${index}.profitCenterName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} placeholder="Enter name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`bulkPC.${index}.department`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} placeholder="Department" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`bulkPC.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} placeholder="Description" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`bulkPC.${index}.justification`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} placeholder="Justification" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={fields.length <= 1}
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full">
          Submit Profit Centers
        </Button>
      </form>
    </Form>
  );
}
