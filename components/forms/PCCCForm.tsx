"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Region, PCCCData } from "@/types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
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
import { useState } from "react";
import { getControllingAreaOptions, getFunctionalAreaOptions, RegionType } from "./WBSForm";

const basePCCCSchema = z.object({
  type: z.enum(["New", "Update", "Lock", "Unlock", "Close"]),
  pcccId: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
  controllingArea: z.string().min(1, "Required"),
  companyCode: z.string().min(1, "Required"),
  responsiblePerson: z.string().min(1, "Required"),
  userId: z.string().min(1, "Required"),
  employmentNumber: z.string().min(1, "Required"),
  functionalArea: z.string().optional(),
  comment: z.string().optional(),
  region: z.string() as z.ZodType<Region>,
});

const formSchema = z.object({
  region: z.string() as z.ZodType<Region>,
  bulkPCCC: z.array(basePCCCSchema).min(1, "At least one PC/CC item is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface PCCCFormProps {
  region: Region;
  onSubmit: (data: PCCCData[]) => Promise<void>;
  initialData?: PCCCData[];
}

export default function PCCCForm({ region, onSubmit, initialData }: PCCCFormProps) {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      region,
      bulkPCCC: initialData || [{
        type: "New",
        region,
        pcccId: "",
        description: "",
        controllingArea: "",
        companyCode: "",
        responsiblePerson: "",
        userId: "",
        employmentNumber: "",
        functionalArea: "",
        comment: "",
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "bulkPCCC",
  });

  const handleSubmit = async (values: FormValues) => {
    await onSubmit(values.bulkPCCC);
  };

  const addPCCCItem = () => {
    append({
      type: "New",
      pcccId: "",
      description: "",
      controllingArea: "",
      companyCode: "",
      responsiblePerson: "",
      userId: "",
      employmentNumber: "",
      functionalArea: "",
      comment: "",
      region,
    });
  };

  const deleteSelectedItems = () => {
    const newSelectedRows = [...selectedRows].sort((a, b) => b - a);
    newSelectedRows.forEach((index) => remove(index));
    setSelectedRows([]);
  };

  const toggleRowSelection = (index: number) => {
    setSelectedRows((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const toggleAllRows = () => {
    setSelectedRows((prev) =>
      prev.length === fields.length - 1
        ? []
        : Array.from({ length: fields.length - 1 }, (_, i) => i + 1)
    );
  };

  const renderPCCCRow = (index: number, showSelect: boolean = true) => {
    return (
      <TableRow key={index}>
        {index > 0 && showSelect && (
          <TableCell>
            <input
              type="checkbox"
              checked={selectedRows.includes(index)}
              onChange={() => toggleRowSelection(index)}
              className="h-4 w-4 rounded border-gray-300"
            />
          </TableCell>
        )}
        <TableCell>
          <FormField
            control={form.control}
            name={`bulkPCCC.${index}.type`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <select
                    {...field}
                    className="w-full p-2 border rounded"
                  >
                    <option value="New">New</option>
                    <option value="Update">Update</option>
                    <option value="Lock">Lock</option>
                    <option value="Unlock">Unlock</option>
                    <option value="Close">Close</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
        <TableCell>
          <FormField
            control={form.control}
            name={`bulkPCCC.${index}.pcccId`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="PC/CC ID" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
        <TableCell>
          <FormField
            control={form.control}
            name={`bulkPCCC.${index}.description`}
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
            name={`bulkPCCC.${index}.controllingArea`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <select
                    {...field}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select Controlling Area</option>
                    {getControllingAreaOptions(region as RegionType).map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
        <TableCell>
          <FormField
            control={form.control}
            name={`bulkPCCC.${index}.companyCode`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="Company Code" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
        <TableCell>
          <FormField
            control={form.control}
            name={`bulkPCCC.${index}.responsiblePerson`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="Responsible Person" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
        <TableCell>
          <FormField
            control={form.control}
            name={`bulkPCCC.${index}.userId`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="User ID" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
        <TableCell>
          <FormField
            control={form.control}
            name={`bulkPCCC.${index}.employmentNumber`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="Employment Number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
        {region === "NL" && (
          <TableCell>
            <FormField
              control={form.control}
              name={`bulkPCCC.${index}.functionalArea`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <select
                      {...field}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select Functional Area</option>
                      {getFunctionalAreaOptions(region as RegionType).map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TableCell>
        )}
        <TableCell>
          <FormField
            control={form.control}
            name={`bulkPCCC.${index}.comment`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="Comment" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Main PC/CC Element</h3>
            </div>

            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Type</TableHead>
                    <TableHead className="w-[150px]">PC/CC ID</TableHead>
                    <TableHead className="w-[200px]">Description</TableHead>
                    <TableHead className="w-[180px]">Controlling Area</TableHead>
                    <TableHead className="w-[150px]">Company Code</TableHead>
                    <TableHead className="w-[200px]">Responsible Person</TableHead>
                    <TableHead className="w-[150px]">User ID</TableHead>
                    <TableHead className="w-[150px]">Employment Number</TableHead>
                    {region === "NL" && (
                      <TableHead className="w-[150px]">Functional Area</TableHead>
                    )}
                    <TableHead className="w-[200px]">Comment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renderPCCCRow(0, false)}
                </TableBody>
              </Table>
            </div>

            {fields.length > 1 && (
              <>
                <div className="flex justify-between items-center mb-4 mt-12">
                  <h3 className="text-lg font-medium">Additional PC/CC Elements</h3>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPCCCItem}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add PC/CC
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={deleteSelectedItems}
                      disabled={selectedRows.length === 0}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete Selected
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <input
                            type="checkbox"
                            checked={selectedRows.length === fields.length - 1}
                            onChange={toggleAllRows}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </TableHead>
                        <TableHead className="w-[120px]">Type</TableHead>
                        <TableHead className="w-[150px]">PC/CC ID</TableHead>
                        <TableHead className="w-[200px]">Description</TableHead>
                        <TableHead className="w-[180px]">Controlling Area</TableHead>
                        <TableHead className="w-[150px]">Company Code</TableHead>
                        <TableHead className="w-[200px]">Responsible Person</TableHead>
                        <TableHead className="w-[150px]">User ID</TableHead>
                        <TableHead className="w-[150px]">Employment Number</TableHead>
                        {region === "NL" && (
                          <TableHead className="w-[150px]">Functional Area</TableHead>
                        )}
                        <TableHead className="w-[200px]">Comment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.slice(1).map((field, index) => renderPCCCRow(index + 1))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}

            {fields.length === 1 && (
              <div className="flex justify-end mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPCCCItem}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add PC/CC
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Button type="submit" className="w-full">
          Submit Request
        </Button>
      </form>
    </Form>
  );
} 