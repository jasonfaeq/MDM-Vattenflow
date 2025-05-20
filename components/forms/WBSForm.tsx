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
  controllingArea: "w-[220px] min-w-[180px]",
  companyCode: "w-[200px] min-w-[150px]",
  projectName: "w-[250px] min-w-[250px]",
  projectDefinition: "w-[220px] min-w-[200px]",
  level: "w-[100px] min-w-[100px]",
  responsiblePCCC: "w-[180px] min-w-[160px]",
  investmentProfile: "w-[180px] min-w-[160px]",
  checkbox3Col: "w-[120px] min-w-[120px]",
  settlement: "w-[150px] min-w-[150px]",
  person: "w-[200px] min-w-[200px]",
  functionalArea: "w-[150px] min-w-[150px]",
  tgPhase: "w-[120px] min-w-[120px]",
  projectSpec: "w-[150px] min-w-[150px]",
  motherCode: "w-[150px] min-w-[150px]",
  comment: "w-[200px] min-w-[200px]",
  projectType: "w-[120px] min-w-[120px]",
  system: "w-[140px] min-w-[120px]",
  projectProfile: "w-[160px] min-w-[160px]",
  tm1Project: "w-[150px] min-w-[150px]",
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
  investmentProfile: z.string().optional(),
  responsibleProfitCenter: z.string()
    .min(1, "Required")
    .regex(/^\d{8}$/, "Responsible Profit Center must be exactly 8 digits"),
  responsibleCostCenter: z.string()
    .min(1, "Required")
    .regex(/^\d{8}$/, "Responsible Cost Center must be exactly 8 digits"),
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
  system: z.string().optional(),
  region: z.enum(["DE", "NL", "SE", "DK", "UK"]) as z.ZodType<Region>,
  projectProfile: z.string().optional(),
  tm1Project: z.string().optional(),
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
        { value: "6000", label: "6000 Vattenfall Holding" },
        { value: "6010", label: "6010 Waste" },
        { value: "6017", label: "6017 Holding Beteiligungen" },
        { value: "6018", label: "6018 Kernkraftwerke" },
        { value: "6100", label: "6100 Heat Beteiligungen" },
        { value: "6200", label: "6200 Service Unit" },
        { value: "6204", label: "6204 VASA" },
        { value: "6205", label: "6205 Windkraft GmbH" },
        { value: "6250", label: "6250 Distribution" },
        { value: "6300", label: "6300 Wärme AG" },
        { value: "6500", label: "6500 Sales" },
      ];
    case "NL":
      return [
        { value: "5000", label: "5000 CO-gebied Vattenfall NL" },
        { value: "5002", label: "5002 CO-gebied Netbeheer" },
        { value: "5003", label: "5003 CO-gebied overig" },
      ];
    case "SE":
    case "DK":
    case "UK":
      return [
        { value: "1XX", label: "1XX SLR within Vattenfall AB" },
        { value: "2036", label: "2036 Vf Services Nordic AB" },
        { value: "2052", label: "2052 Vf BusinessServicesNord." },
        { value: "207X", label: "207X Nuclear plant D21" },
        { value: "20XX", label: "20XX Subsidiary EUR" },
        { value: "21XX", label: "21XX Vattenfall Hydro" },
        { value: "22XX", label: "22XX Subsidiary SEK" },
        { value: "23XX", label: "23XX Subsidiary GBP" },
        { value: "2453", label: "2453 Forsmarks Kraftgrupp AB" },
        { value: "2460", label: "2460 Vattenfall Nuclear Fuel A" },
        { value: "25XX", label: "25XX Business Area Grid" },
        { value: "298X", label: "298X Subsidiary DKK" },
        { value: "3100", label: "3100 Associated company SEK" },
        { value: "3300", label: "3300 Associated company Euro" },
        { value: "8120", label: "8120 VAB Mega Branch Norway" },
        { value: "9901", label: "9901 External companies DK" },
      ];
    default:
      return [];
  }
};

export const getFunctionalAreaOptions = (region: RegionType) => {
  switch (region) {
    case "SE":
    case "DK":
    case "UK":
      return [
        { value: "4010", label: "4010 OPC Oper & mainte" },
        { value: "4015", label: "4015 MAC Maint/distr" },
        { value: "4017", label: "4017 MAC Maint/distri extra" },
        { value: "4018", label: "4018 MAC Breakdown" },
        { value: "4020", label: "4020 Fuel" },
        { value: "4030", label: "4030 Fees and taxes" },
        { value: "4125", label: "4125 Bilateral purchase," },
        { value: "4135", label: "4135 Bilateral purchase," },
        { value: "4200", label: "4200 Transmission costs" },
        { value: "4220", label: "4220 Purch. for re-sel gas/oil" },
        { value: "4230", label: "4230 CON Cost of contr work" },
        { value: "4235", label: "4235 ECW Cost of consulting" },
        { value: "4240", label: "4240 ODC Other direct costs" },
        { value: "4280", label: "4280 COP Cost of other produc" },
        { value: "4285", label: "4285 ODC Oth operating expe" },
        { value: "4400", label: "4400 COP Thermal purchase" },
        { value: "4510", label: "4510 RAD Research & Develop" },
        { value: "4511", label: "4511 RAD R&D Renewable teknik" },
        { value: "4513", label: "4513 RAD Other R&D" },
        { value: "4515", label: "4515 RAD R&D new prod & serv" },
        { value: "4520", label: "4520 SEO Selling expen" },
        { value: "4522", label: "4522 CMR Cost Measur/repor" },
        { value: "4525", label: "4525 ADM Admin exp" },
        { value: "1810", label: "1810 INV Investments" },
        { value: "1810M", label: "1810 INV Maint. Invest" },
        { value: "1850", label: "1850 Expand Investments" },
      ];
    case "DE":
      return [
        { value: "1001", label: "Production" },
        { value: "1002", label: "Quality Control" },
        { value: "1003", label: "Maintenance" },
      ];
    case "NL":
      return [];
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
        { value: "DEPARTMENT", label: "Department" },
      ];
    case "NL":
      return [
        { value: "ASSET", label: "Asset" },
        { value: "INTERNAL", label: "Internal" },
        { value: "DEPARTMENT", label: "Department" },
      ];
    case "SE":
      return [
        { value: "ASSET", label: "Asset" },
        { value: "INTERNAL", label: "Internal" },
        { value: "DEPARTMENT", label: "Department" },
      ];
    case "DK":
      return [
        { value: "ASSET", label: "Asset" },
        { value: "INTERNAL", label: "Internal" },
        { value: "DEPARTMENT", label: "Department" },
      ];
    case "UK":
      return [
        { value: "ASSET", label: "Asset" },
        { value: "INTERNAL", label: "Internal" },
        { value: "DEPARTMENT", label: "Department" },
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
      { value: "COMBI", label: "COMBI" },
    ];
  }
  return [
    { value: "Result", label: "Result" },
    { value: "Investment", label: "Investment" },
  ];
};

// Helper to get region label
const getRegionLabel = (region: RegionType) => {
  switch (region) {
    case "NL":
      return "Netherlands";
    case "DE":
      return "Germany";
    case "SE":
    case "DK":
    case "UK":
      return "Nordics";
    default:
      return region;
  }
};

export default function WBSForm({ region, onSubmit, initialData }: WBSFormProps) {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [selectedFields, setSelectedFields] = useState<(keyof WBSFormData)[]>([]);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [isTutorialDialogOpen, setIsTutorialDialogOpen] = useState(false);

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
          investmentProfile: "",
          responsibleProfitCenter: "",
          responsibleCostCenter: "",
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
          system: "",
          projectProfile: "",
          tm1Project: "",
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
          // Copy system from main, but always set level to '2'
          system: mainWBS.system,
          level: "2",
        }
      : {
          type: "New" as WbsTypeOptions,
          controllingArea: "",
          companyCode: "",
          projectName: "",
          projectDefinition: "",
          level: "2",
          projectType: "",
          responsibleProfitCenter: "",
          responsibleCostCenter: "",
          investmentProfile: "",
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
          system: "",
          projectProfile: "",
          tm1Project: "",
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
    { field: "investmentProfile", label: "Investment Profile" },
    { field: "responsibleProfitCenter", label: "Responsible Profit Center" },
    { field: "responsibleCostCenter", label: "Responsible Cost Center" },
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
    { field: "projectProfile", label: "Project Profile" },
    { field: "tm1Project", label: "TM1 Project" },
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
          <Input
            value={getRegionLabel(region as RegionType)}
            disabled
            className="bg-muted text-muted-foreground cursor-not-allowed"
          />
        </TableCell>
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
            name={`bulkWBS.${index}.system`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <select
                    {...field}
                    className="w-full p-2 border rounded bg-input text-foreground border-input placeholder:text-muted-foreground"
                    autoComplete="off"
                  >
                    <option value="">Choose</option>
                    <option value="KIS">KIS</option>
                    <option value="K1Q">K1Q</option>
                    <option value="D20">D20</option>
                    <option value="D21">D21</option>
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
            name={`bulkWBS.${index}.investmentProfile`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="Investment Profile" autoComplete="off" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
        <TableCell>
          <FormField
            control={form.control}
            name={`bulkWBS.${index}.responsibleProfitCenter`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="Responsible Profit Center" autoComplete="off" maxLength={8} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
        <TableCell>
          <FormField
            control={form.control}
            name={`bulkWBS.${index}.responsibleCostCenter`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="Responsible Cost Center" autoComplete="off" maxLength={8} />
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
            name={`bulkWBS.${index}.projectProfile`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="Project Profile" autoComplete="off" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
        <TableCell>
          <FormField
            control={form.control}
            name={`bulkWBS.${index}.tm1Project`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="TM1 Project" autoComplete="off" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
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
              <div className="flex gap-2">

                <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsInfoDialogOpen(true)}
                    >
                      WBS Field Information
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="backdrop-blur-sm" style={{ width: 600, height: 600, maxWidth: '90vw', maxHeight: '90vh', borderRadius: 16, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center' }}>
                    <DialogHeader>
                      <DialogTitle>WBS Field Information</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 w-full overflow-y-auto" style={{ flex: 1 }}>
                      <p className="mb-4">Anything marked with an asterisk (*) in the table is mandatory.</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Region / Language:</strong> English = standard + Netherlands, Sweden (Germany not yet). <em>Mandatory</em></li>
                        <li><strong>Kind of Change (Type):</strong> Choose from list (e.g., New, Update, Lock, etc.). <em>Mandatory</em></li>
                        <li><strong>System:</strong> Standard = KIS (choose from list). <em>Mandatory</em></li>
                        <li><strong>Controlling Area:</strong> Choose from list per country. <em>Mandatory</em></li>
                        <li><strong>Company Code:</strong> 4 digits. <em>Mandatory</em></li>
                        <li><strong>Project Name:</strong> Maximum 40 letters. <em>Mandatory</em></li>
                        <li><strong>Project Definition:</strong> Level 1: aa.00000000; Level 2-5: aa.00000000.0000. <em>Mandatory</em></li>
                        <li><strong>Level:</strong> Level of the WBS element (1-5). <em>Mandatory</em></li>
                        <li><strong>Project Type:</strong> Only NL & NO. <em>#N/A for others</em></li>
                        <li><strong>Investment Profile:</strong> Only NL: for CAPEX. <em>Optional</em></li>
                        <li><strong>Responsible Profit Center:</strong> 8 digits = 4 company code + 4 varying digits. <em>Mandatory</em></li>
                        <li><strong>Responsible Cost Center:</strong> 8 digits = 4 company code + 4 varying digits. <em>Mandatory</em></li>
                        <li><strong>Planning Element:</strong> You can only plan costs on a project that has been designated as a planning element. <em>Mandatory</em></li>
                        <li><strong>Rubric Element:</strong> If you set this indicator, the project will be defined as an account assignment element. Actual postings can be made. <em>Mandatory</em></li>
                        <li><strong>Billing Element:</strong> If you want to maintain a billing plan for a project, you must set this indicator. If you have maintained a billing plan for the project, you cannot change this indicator. <em>Mandatory</em></li>
                        <li><strong>Settlement Rule %:</strong> Enter settlement percent (%) in this column. Total sum must be 100%. <em>Mandatory for OPEX project</em></li>
                        <li><strong>Settlement Rule Goal:</strong> Enter project or internal order = goal of the settlement. <em>Mandatory for OPEX project</em></li>
                        <li><strong>Project Profile:</strong> In case you know, provide; otherwise added by MDM. <em>Mandatory</em></li>
                        <li><strong>Responsible Person:</strong> Name of manager or other responsible person. <em>#N/A</em></li>
                        <li><strong>User ID:</strong> Only if new responsible person (to update project info). <em>#N/A</em></li>
                        <li><strong>Employment Number:</strong> Only if new responsible person (to update project info). <em>#N/A</em></li>
                        <li><strong>Functional Area:</strong> Only Nordic: Choose from list (Only for CC); processed by Vattenfall. <em>Mandatory</em></li>
                        <li><strong>Comment:</strong> User field. <em>Optional</em></li>
                        <li><strong>TM1 Project:</strong> TM1 project (user field). <em>Optional</em></li>
                        <li><strong>TG Phase:</strong> TG phase (user field). <em>Optional</em></li>
                        <li><strong>Project Spec (Project Specification):</strong> Project specification. If left blank, time recording is not possible. <em>Mandatory for BA Wind</em></li>
                        <li><strong>Mother Code:</strong> WBS element mandatory if cross border recharging via Octopus is required. <em>Mandatory for BA Wind</em></li>
                        <li><strong>Ins Program:</strong> Inv Program - only for project. <em>Only for BA Wind</em></li>
                        <li><strong>Position ID:</strong> Position ID - only for project. <em>Only for BA Wind</em></li>
                        <li><strong>Room:</strong> Mandatory for VNX. <em>Only for BU C&S Germany</em></li>
                      </ul>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={isTutorialDialogOpen} onOpenChange={setIsTutorialDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsTutorialDialogOpen(true)}
                    >
                      Request Form Tutorial
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="backdrop-blur-sm" style={{ width: 600, height: 600, maxWidth: '90vw', maxHeight: '90vh', borderRadius: 16, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center' }}>
                    <DialogHeader>
                      <DialogTitle>How to Use the WBS Request App</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 w-full overflow-y-auto" style={{ flex: 1 }}>
                      <h2 className="text-lg font-semibold mb-2">Step-by-Step Tutorial</h2>
                      <ol className="list-decimal pl-6 space-y-2 mb-4">
                        <li>
                          <strong>Fill in the Main WBS Element</strong> at the top of the form. This is the primary element for your request.
                        </li>
                        <li>
                          If there are <strong>other elements</strong> in your request that require changes, click on <span className="font-semibold">Add WBS</span>.
                        </li>
                        <li>
                          The new WBS element will <strong>copy the data</strong> you have already entered in the Main WBS Element, except for some fields.
                        </li>
                        <li>
                          <span className="font-semibold">Please pay attention to:</span>
                          <ul className="list-disc pl-6 mt-1">
                            <li>Inputting a <strong>different Project Name</strong> and <strong>Project Definition</strong> for each additional WBS element.</li>
                            <li>Possible changes in <strong>Level</strong> or <strong>Planning/Rubric/Billing elements</strong>.</li>
                            <li>Updating the <strong>Mother Code</strong> if required.</li>
                          </ul>
                        </li>
                      </ol>
                      <p className="mb-2">You can use the <span className="font-semibold">Match Data from Main WBS</span> button to quickly copy selected fields from the main element to additional WBS elements.</p>
                      <p className="mb-2">Once all required fields are filled, click <span className="font-semibold">Submit Request</span> to send your WBS request for processing.</p>
                      <p className="text-muted-foreground">For more information about each field, use the <span className="font-semibold">WBS Field Information</span> button.</p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className={tableStyles.tableContainer}>
              <Table className={tableStyles.table}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px] min-w-[120px] text-center">Region (*)</TableHead>
                    <TableHead className={`${tableStyles.type} text-center`}>Type (*)</TableHead>
                    <TableHead className={`${tableStyles.system} text-center`}>System (*)</TableHead>
                    <TableHead className={`${tableStyles.controllingArea} text-center`}>Controlling Area (*)</TableHead>
                    <TableHead className={`${tableStyles.companyCode} text-center`}>Company Code (*)</TableHead>
                    <TableHead className={`${tableStyles.projectName} text-center`}>Project Name (*)</TableHead>
                    <TableHead className={`${tableStyles.projectDefinition} text-center`}>Project Definition (*)</TableHead>
                    <TableHead className={`${tableStyles.level} text-center`}>Level (*)</TableHead>
                    <TableHead className={`${tableStyles.projectType} text-center`}>Project Type (*)</TableHead>
                    <TableHead className={`${tableStyles.investmentProfile} text-center`}>Investment Profile</TableHead>
                    <TableHead className={`${tableStyles.responsiblePCCC} text-center`}>Responsible Profit Center (*)</TableHead>
                    <TableHead className={`${tableStyles.responsiblePCCC} text-center`}>Responsible Cost Center (*)</TableHead>
                    <TableHead className={`${tableStyles.checkbox3Col} text-center`}>Planning Element</TableHead>
                    <TableHead className={`${tableStyles.checkbox3Col} text-center`}>Rubric Element</TableHead>
                    <TableHead className={`${tableStyles.checkbox3Col} text-center`}>Billing Element</TableHead>
                    {region === "NL" && (
                      <>
                        <TableHead className={`${tableStyles.settlement} text-center`}>Settlement Rule % (*)</TableHead>
                        <TableHead className={`${tableStyles.settlement} text-center`}>Settlement Rule Goal (*)</TableHead>
                      </>
                    )}
                    <TableHead className={`${tableStyles.projectProfile} text-center`}>Project Profile</TableHead>
                    <TableHead className={`${tableStyles.tm1Project} text-center`}>TM1 Project</TableHead>
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
                        <TableHead className="w-[120px] min-w-[120px] text-center">Region</TableHead>
                        <TableHead className={`${tableStyles.type} text-center`}>Type</TableHead>
                        <TableHead className={`${tableStyles.system} text-center`}>System</TableHead>
                        <TableHead className={`${tableStyles.controllingArea} text-center`}>Controlling Area</TableHead>
                        <TableHead className={`${tableStyles.companyCode} text-center`}>Company Code</TableHead>
                        <TableHead className={`${tableStyles.projectName} text-center`}>Project Name</TableHead>
                        <TableHead className={`${tableStyles.projectDefinition} text-center`}>Project Definition</TableHead>
                        <TableHead className={`${tableStyles.level} text-center`}>Level</TableHead>
                        <TableHead className={`${tableStyles.projectType} text-center`}>Project Type</TableHead>
                        <TableHead className={`${tableStyles.investmentProfile} text-center`}>Investment Profile</TableHead>
                        <TableHead className={`${tableStyles.responsiblePCCC} text-center`}>Responsible Profit Center</TableHead>
                        <TableHead className={`${tableStyles.responsiblePCCC} text-center`}>Responsible Cost Center</TableHead>
                        <TableHead className={`${tableStyles.checkbox3Col} text-center`}>Planning Element</TableHead>
                        <TableHead className={`${tableStyles.checkbox3Col} text-center`}>Rubric Element</TableHead>
                        <TableHead className={`${tableStyles.checkbox3Col} text-center`}>Billing Element</TableHead>
                        {region === "NL" && (
                          <>
                            <TableHead className={`${tableStyles.settlement} text-center`}>Settlement Rule %</TableHead>
                            <TableHead className={`${tableStyles.settlement} text-center`}>Settlement Rule Goal</TableHead>
                          </>
                        )}
                        <TableHead className={`${tableStyles.projectProfile} text-center`}>Project Profile</TableHead>
                        <TableHead className={`${tableStyles.tm1Project} text-center`}>TM1 Project</TableHead>
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
