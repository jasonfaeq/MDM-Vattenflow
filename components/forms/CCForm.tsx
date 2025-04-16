"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CCData, Region } from "@/types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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

// CC schema
const baseCCSchema = z.object({
  costCenterName: z
    .string()
    .min(3, { message: "Cost center name is required" })
    .max(100, { message: "Cost center name must be less than 100 characters" }),
  region: z.string() as z.ZodType<Region>,
  department: z.string().min(2, { message: "Department is required" }),
  manager: z.string().min(2, { message: "Manager name is required" }),
  description: z
    .string()
    .min(5, { message: "Description must be at least 5 characters" })
    .max(500, { message: "Description must be less than 500 characters" }),
  justification: z
    .string()
    .min(5, { message: "Justification must be at least 5 characters" })
    .max(500, { message: "Justification must be less than 500 characters" }),
});

// Form schema
const formSchema = z.object({
  region: z.string() as z.ZodType<Region>,
  bulkCC: z.array(baseCCSchema).min(1, "At least one Cost Center is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface CCFormProps {
  region: Region;
  onSubmit: (data: CCData[]) => Promise<void>;
}

export default function CCForm({ region, onSubmit }: CCFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      region,
      bulkCC: [
        {
          costCenterName: "",
          region,
          department: "",
          manager: "",
          description: "",
          justification: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "bulkCC",
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      console.log("Submitting CC values:", values);
      await onSubmit(values.bulkCC as CCData[]);
    } catch (error) {
      console.error("Error submitting CC request:", error);
      throw error;
    }
  };

  const addCCItem = () => {
    append({
      costCenterName: "",
      region,
      department: "",
      manager: "",
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
              <h3 className="text-lg font-medium">Cost Center Entries</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCCItem}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Cost Center
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cost Center Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Manager</TableHead>
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
                          name={`bulkCC.${index}.costCenterName`}
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
                          name={`bulkCC.${index}.department`}
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
                          name={`bulkCC.${index}.manager`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} placeholder="Manager name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`bulkCC.${index}.description`}
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
                          name={`bulkCC.${index}.justification`}
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
          Submit Cost Centers
        </Button>
      </form>
    </Form>
  );
}
