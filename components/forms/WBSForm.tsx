"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Region, RegionType } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, CopyCheck } from "lucide-react";

// Add these CSS classes near the top of the file, after imports
const tableStyles = {
  table: "w-full table-fixed",
  tableContainer: "overflow-x-auto border rounded-lg",
  checkbox: "w-[50px] min-w-[50px] px-2",
  type: "w-[120px] min-w-[160px]",
  controllingArea: "w-[180px] min-w-[180px]",
  companyCode: "w-[150px] min-w-[150px]",
  projectName: "w-[250px] min-w-[250px]",
  projectDefinition: "w-[200px] min-w-[200px]",
  level: "w-[100px] min-w-[100px]",
  responsiblePCCC: "w-[160px] min-w-[160px]",
  checkbox3Col: "w-[120px] min-w-[120px]",
  settlement: "w-[150px] min-w-[150px]",
  person: "w-[200px] min-w-[200px]",
  functionalArea: "w-[150px] min-w-[150px]",
  tgPhase: "w-[120px] min-w-[120px]",
  projectSpec: "w-[150px] min-w-[150px]",
  motherCode: "w-[150px] min-w-[150px]",
  comment: "w-[200px] min-w-[200px]",
  projectType: "w-[120px] min-w-[120px]",
} as const;

// Define WBS type options as a union type
export type WbsTypeOptions =
  | "New"
  | "Update"
  | "Update + Lock"
  | "Update + Unlock"
  | "Lock (only)"
  | "Unlock (only)"
  | "Close (only)"
  | "Complete Technically (only)"
  | "Update + Close";

const baseWBSSchema = z.object({
  controllingArea: z.string().min(1, "Required"),
  companyCode: z.string().min(1, "Required"),
  projectName: z.string().min(1, "Required"),
  projectDefinition: z.string().min(1, "Required"),
  level: z.string().min(1, "Required"),
  projectType: z.string().min(1, "Required"),
  responsiblePCCC: z.string()
    .min(1, "Required")
    .regex(/^\d{8}$/, "Responsible PC/CC must be exactly 8 digits"),
  planningElement: z.boolean().optional(),
  rubricElement: z.boolean().optional(),
  billingElement: z.boolean().optional(),
  settlementRulePercent: z.string().optional(),
  settlementRuleGoal: z.string().optional(),
  responsiblePerson: z.string().optional(),
  userId: z.string().optional(),
  employmentNumber: z.string().optional(),
  functionalArea: z.string().optional(),
  tgPhase: z.string().optional(),
  projectSpec: z.string().optional(),
  motherCode: z.string().optional(),
  comment: z.string().optional(),
  type: z.enum([
    "New",
    "Update",
    "Update + Lock",
    "Update + Unlock",
    "Lock (only)",
    "Unlock (only)",
    "Close (only)",
    "Complete Technically (only)",
    "Update + Close"
  ]),
  region: z.enum(["DE", "NL", "SE", "DK", "UK"]) as z.ZodType<Region>,
}).superRefine((data, ctx) => {
  if (["SE", "DK", "UK"].includes(data.region) && (!data.functionalArea || data.functionalArea.trim() === "")) {
    ctx.addIssue({
      path: ["functionalArea"],
      code: z.ZodIssueCode.custom,
      message: "Functional Area is required for SE, DK, and UK.",
    });
  }
});

const formSchema = z.object({
  region: z.enum(["DE", "NL", "SE", "DK", "UK"]) as z.ZodType<Region>,
  bulkWBS: z.array(baseWBSSchema).min(1, "At least one WBS item is required"),
});

type FormValues = z.infer<typeof formSchema>;
type WBSFormData = z.infer<typeof baseWBSSchema>;

interface WBSFormProps {
  region: Region;
  onSubmit: (data: WBSFormData[]) => Promise<void>;
  initialData?: WBSFormData[];
}

// Export the helper functions
export const getControllingAreaOptions = (region: RegionType) => {
  switch (region) {
    case "DE":
      return [
        { value: "1000", label: "1000 Berlin Manufacturing" },
        { value: "1100", label: "1100 Hamburg Logistics" },
        { value: "1200", label: "1200 Munich Electronics" },
        { value: "1300", label: "1300 Frankfurt Services" },
        { value: "1400", label: "1400 Stuttgart Research" },
      ];
    case "NL":
      return [
        { value: "2000", label: "2000 Amsterdam Tech" },
        { value: "2100", label: "2100 Rotterdam Port" },
        { value: "2200", label: "2200 Eindhoven Innovation" },
        { value: "2300", label: "2300 Utrecht Digital" },
        { value: "2400", label: "2400 Groningen Energy" },
      ];
    case "SE":
      return [
        { value: "3000", label: "3000 Stockholm Solutions" },
        { value: "3100", label: "3100 Gothenburg Marine" },
        { value: "3200", label: "3200 Malmö Industries" },
        { value: "3300", label: "3300 Uppsala Research" },
        { value: "3400", label: "3400 Västerås Power" },
      ];
    case "DK":
      return [
        { value: "4000", label: "4000 Copenhagen Solutions" },
        { value: "4100", label: "4100 Aarhus Marine" },
        { value: "4200", label: "4200 Odense Industries" },
        { value: "4300", label: "4300 Aalborg Research" },
        { value: "4400", label: "4400 Esbjerg Power" },
      ];
    case "UK":
      return [
        { value: "5000", label: "5000 London Solutions" },
        { value: "5100", label: "5100 Manchester Marine" },
        { value: "5200", label: "5200 Birmingham Industries" },
        { value: "5300", label: "5300 Edinburgh Research" },
        { value: "5400", label: "5400 Glasgow Power" },
      ];
    default:
      return [];
  }
};

export const getFunctionalAreaOptions = (region: RegionType) => {
  switch (region) {
    case "DE":
      return [
        { value: "1001", label: "Production" },
        { value: "1002", label: "Quality Control" },
        { value: "1003", label: "Maintenance" },
      ];
    case "SE":
      return [
        { value: "3001", label: "Nordic Operations" },
        { value: "3002", label: "Nordic Development" },
        { value: "3003", label: "Nordic Support" },
      ];
    case "DK":
      return [
        { value: "4001", label: "Nordic Operations" },
        { value: "4002", label: "Nordic Development" },
        { value: "4003", label: "Nordic Support" },
      ];
    case "UK":
      return [
        { value: "5001", label: "Nordic Operations" },
        { value: "5002", label: "Nordic Development" },
        { value: "5003", label: "Nordic Support" },
      ];
    default:
      return [];
  }
};

export const getProjectSpecOptions = (region: RegionType) => {
  switch (region) {
    case "DE":
      return [
        { value: "ASSET", label: "Asset" },
        { value: "INTERNAL", label: "Internal" },
      ];
    case "NL":
      return [
        { value: "ASSET", label: "Asset" },
        { value: "INTERNAL", label: "Internal" },
      ];
    case "SE":
      return [
        { value: "ASSET", label: "Asset" },
        { value: "INTERNAL", label: "Internal" },
      ];
    case "DK":
      return [
        { value: "ASSET", label: "Asset" },
        { value: "INTERNAL", label: "Internal" },
      ];
    case "UK":
      return [
        { value: "ASSET", label: "Asset" },
        { value: "INTERNAL", label: "Internal" },
      ];
    default:
      return [];
  }
};

export const getProjectTypeOptions = (region: RegionType) => {
  if (region === "NL") {
    return [
      { value: "OPEX", label: "OPEX" },
      { value: "CAPEX", label: "CAPEX" },
    ];
  }
  return [
    { value: "Result", label: "Result" },
    { value: "Investment", label: "Investment" },
  ];
};

export default function WBSForm({ region, onSubmit, initialData }: WBSFormProps) {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [selectedFields, setSelectedFields] = useState<(keyof WBSFormData)[]>([]);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      region,
      bulkWBS: initialData || [
        {
          type: "New",
          controllingArea: "",
          companyCode: "",
          projectName: "",
          projectDefinition: "",
          level: "1",
          projectType: "",
          responsiblePCCC: "",
          planningElement: false,
          rubricElement: false,
          billingElement: false,
          settlementRulePercent: "",
          settlementRuleGoal: "",
          responsiblePerson: "",
          userId: "",
          employmentNumber: "",
          functionalArea: "",
          tgPhase: "",
          projectSpec: "",
          motherCode: "",
          comment: "",
          region,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "bulkWBS",
  });

  const watchFieldArray = form.watch("bulkWBS");

  const handleSubmit = async (values: FormValues) => {
    await onSubmit(values.bulkWBS);
  };

  const addWBSItem = () => {
    const newIndex = fields.length;
    // Copy all fields from main WBS except projectName and projectDefinition
    const mainWBS = watchFieldArray[0];
    const newWBS = mainWBS
      ? {
          ...mainWBS,
          type: mainWBS.type as WbsTypeOptions,
          projectName: "",
          projectDefinition: "",
        }
      : {
          type: "New" as WbsTypeOptions,
          controllingArea: "",
          companyCode: "",
          projectName: "",
          projectDefinition: "",
          level: "1",
          projectType: "",
          responsiblePCCC: "",
          planningElement: false,
          rubricElement: false,
          billingElement: false,
          settlementRulePercent: "",
          settlementRuleGoal: "",
          responsiblePerson: "",
          userId: "",
          employmentNumber: "",
          functionalArea: "",
          tgPhase: "",
          projectSpec: "",
          motherCode: "",
          comment: "",
          region,
        };
    append(newWBS);
    // Automatically select the newly added row
    setSelectedRows([...selectedRows, newIndex]);
  };

  const deleteSelectedItems = () => {
    const newSelectedRows = [...selectedRows].sort((a, b) => b - a);
    newSelectedRows.forEach((index) => remove(index));
    setSelectedRows([]);
  };

  const toggleAllRows = () => {
    setSelectedRows((prev) =>
      prev.length === fields.length - 1
        ? []
        : Array.from({ length: fields.length - 1 }, (_, i) => i + 1)
    );
  };

  const matchableFields: { field: keyof WBSFormData; label: string }[] = [
    { field: "type", label: "Type" },
    { field: "controllingArea", label: "Controlling Area" },
    { field: "companyCode", label: "Company Code" },
    { field: "level", label: "Level" },
    { field: "responsiblePCCC", label: "Responsible PC/CC" },
    { field: "planningElement", label: "Planning Element" },
    { field: "rubricElement", label: "Rubric Element" },
    { field: "billingElement", label: "Billing Element" },
    { field: "settlementRulePercent", label: "Settlement Rule %" },
    { field: "settlementRuleGoal", label: "Settlement Rule Goal" },
    { field: "responsiblePerson", label: "Responsible Person" },
    { field: "userId", label: "User ID" },
    { field: "employmentNumber", label: "Employment Number" },
    { field: "functionalArea", label: "Functional Area" },
    { field: "tgPhase", label: "TG Phase" },
    { field: "projectSpec", label: "Project Spec" },
    { field: "motherCode", label: "Mother Code" },
    { field: "comment", label: "Comment" },
  ];

  const toggleField = (field: keyof WBSFormData) => {
    setSelectedFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const handleMatchData = () => {
    // Ensure at least one additional row is selected
    if (selectedRows.length === 0) {
      console.error("No rows selected to match data.");
      return;
    }
  
    // Ensure at least one field is selected
    if (selectedFields.length === 0) {
      console.error("No fields selected for matching.");
      return;
    }
  
    // Use the Main WBS Element (first row) as the source
    const sourceRow = watchFieldArray[0];
    if (!sourceRow) {
      console.error("Main WBS Element not found.");
      return;
    }
  
    console.log("Source Row (Main WBS):", sourceRow);
    console.log("Selected Rows:", selectedRows);
    console.log("Selected Fields:", selectedFields);
  
    // Copy data from the Main WBS Element to the selected rows
    selectedRows.forEach((targetIndex) => {
      selectedFields.forEach((field) => {
        const value = sourceRow[field];
        console.log(`Copying field "${field}" with value "${value}" to row ${targetIndex}`);
        form.setValue(`bulkWBS.${targetIndex}.${field}`, value);
      });
    });
  
    // Clear selections and close the dialog
    setSelectedRows([]);
    setSelectedFields([]);
    setIsMatchDialogOpen(false);
  };
  

  const renderWBSRow = (index: number, showSelect: boolean = true) => {
    const row = watchFieldArray[index];
    if (!row) return null;

    return (
      <TableRow key={index}>
        {showSelect && (
          <TableCell className="w-[50px]">
            <Checkbox
              checked={selectedRows.includes(index)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedRows([...selectedRows, index]);
                } else {
                  setSelectedRows(selectedRows.filter((i) => i !== index));
                }
              }}
            />
          </TableCell>
        )}
        <TableCell>
          <FormField
            control={form.control}
            name={`bulkWBS.${index}.type`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <select
                    {...field}
                    className="w-full p-2 border rounded bg-input text-foreground border-input placeholder:text-muted-foreground"
                    autoComplete="off"
                  >
                    <option value="New">New</option>
                    <option value="Update">Update</option>
                    <option value="Update + Lock">Update + Lock</option>
                    <option value="Update + Unlock">Update + Unlock</option>
                    <option value="Lock (only)">Lock (only)</option>
                    <option value="Unlock (only)">Unlock (only)</option>
                    <option value="Close (only)">Close (only)</option>
                    <option value="Complete Technically (only)">Complete Technically (only)</option>
                    <option value="Update + Close">Update + Close</option>
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
            name={`bulkWBS.${index}.controllingArea`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <select
                    {...field}
                    className="w-full p-2 border rounded bg-input text-foreground border-input placeholder:text-muted-foreground"
                    autoComplete="off"
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
            name={`bulkWBS.${index}.companyCode`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="Company Code" autoComplete="off" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
        <TableCell>
          <FormField
            control={form.control}
            name={`bulkWBS.${index}.projectName`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="Project Name" autoComplete="off" maxLength={40}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
        <TableCell>
          <FormField
            control={form.control}
            name={`bulkWBS.${index}.projectDefinition`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="Project Definition" autoComplete="off" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
        <TableCell>
          <FormField
            control={form.control}
            name={`bulkWBS.${index}.level`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <select
                    {...field}
                    className="w-full p-2 border rounded bg-input text-foreground border-input placeholder:text-muted-foreground"
                    autoComplete="off"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
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
            name={`bulkWBS.${index}.projectType`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <select
                    {...field}
                    className="w-full p-2 border rounded bg-input text-foreground border-input placeholder:text-muted-foreground"
                    autoComplete="off"
                  >
                    <option value="">Select Project Type</option>
                    {getProjectTypeOptions(region as RegionType).map(option => (
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
            name={`bulkWBS.${index}.responsiblePCCC`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="Responsible PC/CC" autoComplete="off" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
        <TableCell>
          <FormField
            control={form.control}
            name={`bulkWBS.${index}.planningElement`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
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
            name={`bulkWBS.${index}.rubricElement`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
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
            name={`bulkWBS.${index}.billingElement`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
        {region === "NL" && (
          <>
            <TableCell>
              <FormField
                control={form.control}
                name={`bulkWBS.${index}.settlementRulePercent`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} placeholder="Settlement Rule %" autoComplete="off" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TableCell>
            <TableCell>
              <FormField
                control={form.control}
                name={`bulkWBS.${index}.settlementRuleGoal`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} placeholder="Settlement Rule Goal" autoComplete="off" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TableCell>
          </>
        )}
        <TableCell>
          <FormField
            control={form.control}
            name={`bulkWBS.${index}.responsiblePerson`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="Responsible Person" autoComplete="off" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
        <TableCell>
          <FormField
            control={form.control}
            name={`bulkWBS.${index}.userId`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="User ID" autoComplete="off" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
        <TableCell>
          <FormField
            control={form.control}
            name={`bulkWBS.${index}.employmentNumber`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="Employment Number" autoComplete="off" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
        {(region === "SE" || region === "DK" || region === "UK") && (
          <TableCell>
            <FormField
              control={form.control}
              name={`bulkWBS.${index}.functionalArea`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <select
                      {...field}
                      className="w-full p-2 border rounded bg-input text-foreground border-input placeholder:text-muted-foreground"
                      autoComplete="off"
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
            name={`bulkWBS.${index}.tgPhase`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="TG Phase" autoComplete="off" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
        <TableCell>
          <FormField
            control={form.control}
            name={`bulkWBS.${index}.projectSpec`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <select
                    {...field}
                    className="w-full p-2 border rounded bg-input text-foreground border-input placeholder:text-muted-foreground"
                    autoComplete="off"
                  >
                    <option value="">Select Project Spec</option>
                    {getProjectSpecOptions(region as RegionType).map(option => (
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
            name={`bulkWBS.${index}.motherCode`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="Mother Code" autoComplete="off" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
        <TableCell>
          <FormField
            control={form.control}
            name={`bulkWBS.${index}.comment`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="Comment" autoComplete="off" />
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
              <h3 className="text-lg font-medium">Main WBS Element</h3>
            </div>

            <div className={tableStyles.tableContainer}>
              <Table className={tableStyles.table}>
                <TableHeader>
                  <TableRow>
                    <TableHead className={`${tableStyles.type} text-center`}>Type</TableHead>
                    <TableHead className={`${tableStyles.controllingArea} text-center`}>Controlling Area</TableHead>
                    <TableHead className={`${tableStyles.companyCode} text-center`}>Company Code</TableHead>
                    <TableHead className={`${tableStyles.projectName} text-center`}>Project Name</TableHead>
                    <TableHead className={`${tableStyles.projectDefinition} text-center`}>Project Definition</TableHead>
                    <TableHead className={`${tableStyles.level} text-center`}>Level</TableHead>
                    <TableHead className={`${tableStyles.projectType} text-center`}>Project Type</TableHead>
                    <TableHead className={`${tableStyles.responsiblePCCC} text-center`}>Responsible PC/CC</TableHead>
                    <TableHead className={`${tableStyles.checkbox3Col} text-center`}>Planning Element</TableHead>
                    <TableHead className={`${tableStyles.checkbox3Col} text-center`}>Rubric Element</TableHead>
                    <TableHead className={`${tableStyles.checkbox3Col} text-center`}>Billing Element</TableHead>
                    {region === "NL" && (
                      <>
                        <TableHead className={`${tableStyles.settlement} text-center`}>Settlement Rule %</TableHead>
                        <TableHead className={`${tableStyles.settlement} text-center`}>Settlement Rule Goal</TableHead>
                      </>
                    )}
                    <TableHead className={`${tableStyles.person} text-center`}>Responsible Person</TableHead>
                    <TableHead className={`${tableStyles.person} text-center`}>User ID</TableHead>
                    <TableHead className={`${tableStyles.person} text-center`}>Employment Number</TableHead>
                    {(region === "SE" || region === "DK" || region === "UK") && <TableHead className={`${tableStyles.functionalArea} text-center`}>Functional Area</TableHead>}
                    <TableHead className={`${tableStyles.tgPhase} text-center`}>TG Phase</TableHead>
                    <TableHead className={`${tableStyles.projectSpec} text-center`}>Project Spec</TableHead>
                    <TableHead className={`${tableStyles.motherCode} text-center`}>Mother Code</TableHead>
                    <TableHead className={`${tableStyles.comment} text-center`}>Comment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renderWBSRow(0, false)}
                </TableBody>
              </Table>
            </div>

            {fields.length > 1 && (
              <>
                <div className="flex justify-between items-center mb-4 mt-12">
                  <h3 className="text-lg font-medium">Additional WBS Elements</h3>
                  <div className="flex gap-2">
                    <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                        >
                          <CopyCheck className="h-4 w-4 mr-2" /> Match Data from Main WBS
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Select Fields to Match</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 py-4">
                          <div className="flex items-center space-x-2 border-b pb-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const availableFields = matchableFields
                                  .filter(({ field }) => 
                                    region === "NL" || !field.toString().startsWith("settlement")
                                  )
                                  .map(({ field }) => field);
                                  
                                if (selectedFields.length === availableFields.length) {
                                  setSelectedFields([]);
                                } else {
                                  setSelectedFields(availableFields);
                                }
                              }}
                            >
                              {selectedFields.length === matchableFields.filter(({ field }) => 
                                region === "NL" || !field.toString().startsWith("settlement")
                              ).length ? "Deselect All" : "Select All"}
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {matchableFields.map(({ field, label }) => (
                              region === "NL" || !field.toString().startsWith("settlement") ? (
                                <div key={field} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={field}
                                    checked={selectedFields.includes(field)}
                                    onCheckedChange={() => toggleField(field)}
                                  />
                                  <label
                                    htmlFor={field}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {label}
                                  </label>
                                </div>
                              ) : null
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsMatchDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            onClick={handleMatchData}
                            disabled={selectedFields.length === 0}
                          >
                            Match Selected Fields
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addWBSItem}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add WBS
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

                <div className={tableStyles.tableContainer}>
                  <Table className={tableStyles.table}>
                    <TableHeader>
                      <TableRow>
                        <TableHead className={tableStyles.checkbox}>
                          <Checkbox
                            checked={selectedRows.length === fields.length - 1}
                            onCheckedChange={toggleAllRows}
                          />
                        </TableHead>
                        <TableHead className={`${tableStyles.type} text-center`}>Type</TableHead>
                        <TableHead className={`${tableStyles.controllingArea} text-center`}>Controlling Area</TableHead>
                        <TableHead className={`${tableStyles.companyCode} text-center`}>Company Code</TableHead>
                        <TableHead className={`${tableStyles.projectName} text-center`}>Project Name</TableHead>
                        <TableHead className={`${tableStyles.projectDefinition} text-center`}>Project Definition</TableHead>
                        <TableHead className={`${tableStyles.level} text-center`}>Level</TableHead>
                        <TableHead className={`${tableStyles.projectType} text-center`}>Project Type</TableHead>
                        <TableHead className={`${tableStyles.responsiblePCCC} text-center`}>Responsible PC/CC</TableHead>
                        <TableHead className={`${tableStyles.checkbox3Col} text-center`}>Planning Element</TableHead>
                        <TableHead className={`${tableStyles.checkbox3Col} text-center`}>Rubric Element</TableHead>
                        <TableHead className={`${tableStyles.checkbox3Col} text-center`}>Billing Element</TableHead>
                        {region === "NL" && (
                          <>
                            <TableHead className={`${tableStyles.settlement} text-center`}>Settlement Rule %</TableHead>
                            <TableHead className={`${tableStyles.settlement} text-center`}>Settlement Rule Goal</TableHead>
                          </>
                        )}
                        <TableHead className={`${tableStyles.person} text-center`}>Responsible Person</TableHead>
                        <TableHead className={`${tableStyles.person} text-center`}>User ID</TableHead>
                        <TableHead className={`${tableStyles.person} text-center`}>Employment Number</TableHead>
                        {(region === "SE" || region === "DK" || region === "UK") && <TableHead className={`${tableStyles.functionalArea} text-center`}>Functional Area</TableHead>}
                        <TableHead className={`${tableStyles.tgPhase} text-center`}>TG Phase</TableHead>
                        <TableHead className={`${tableStyles.projectSpec} text-center`}>Project Spec</TableHead>
                        <TableHead className={`${tableStyles.motherCode} text-center`}>Mother Code</TableHead>
                        <TableHead className={`${tableStyles.comment} text-center`}>Comment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.slice(1).map((field, index) => renderWBSRow(index + 1))}
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
                  onClick={addWBSItem}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add WBS
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
