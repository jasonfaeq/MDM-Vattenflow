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
import { Plus, Trash2, Info } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

// Add these CSS classes near the top of the file, after imports
const tableStyles = {
  table: "w-full table-fixed",
  tableContainer: "overflow-x-auto border rounded-lg",
  checkbox: "w-[50px] min-w-[50px] px-2",
  region: "w-[100px] min-w-[100px]",
  type: "w-[120px] min-w-[120px]",
  controllingArea: "w-[220px] min-w-[180px]",
  companyCode: "w-[200px] min-w-[150px]",
  projectName: "w-[250px] min-w-[250px]",
  projectDefinition: "w-[220px] min-w-[200px]",
  level: "w-[140px] min-w-[140px]",
  responsiblePCCC: "w-[180px] min-w-[160px]",
  investmentProfile: "w-[180px] min-w-[160px]",
  checkbox3Col: "w-[140px] min-w-[120px]",
  settlement: "w-[150px] min-w-[150px]",
  person: "w-[180px] min-w-[200px]",
  functionalArea: "w-[220px] min-w-[150px]",
  tgPhase: "w-[140px] min-w-[120px]",
  projectSpec: "w-[180px] min-w-[150px]",
  motherCode: "w-[180px] min-w-[150px]",
  comment: "w-[200px] min-w-[200px]",
  projectType: "w-[180px] min-w-[120px]",
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

// Define the base WBS schema with proper types
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
  region: z.enum(["DE", "NL", "SE", "DK", "UK"]),
  projectProfile: z.string().optional(),
  tm1Project: z.string().optional(),
}).superRefine((data, ctx) => {
  const region = data.region as Region;
  if (["SE", "DK", "UK"].includes(region) && (!data.functionalArea || data.functionalArea.trim() === "")) {
    ctx.addIssue({
      path: ["functionalArea"],
      code: z.ZodIssueCode.custom,
      message: "Functional Area is required for SE, DK, and UK.",
    });
  }
});

const formSchema = z.object({
  bulkWBS: z.array(baseWBSSchema).min(1, "At least one WBS item is required"),
});

type FormValues = z.infer<typeof formSchema>;
type WBSFormData = z.infer<typeof baseWBSSchema>;

interface WBSFormProps {
  onSubmit: (data: WBSFormData[]) => Promise<void>;
  initialData?: WBSFormData[];
  requestName?: string;
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

// Field descriptions for tooltips
const fieldDescriptions: Record<string, string> = {
  region: "Region / Language: English = standard + Netherlands, Sweden (Germany not yet). Mandatory.",
  type: "Kind of Change (Type): Choose from list (e.g., New, Update, Lock, etc.). Mandatory.",
  system: "System: Standard = KIS (choose from list). Mandatory.",
  controllingArea: "Controlling Area: Choose from list per country. Mandatory.",
  companyCode: "Company Code: 4 digits. Mandatory.",
  projectName: "Project Name: Maximum 40 letters. Mandatory.",
  projectDefinition: "Project Definition: Level 1: aa.00000000; Level 2-5: aa.00000000.0000. Mandatory.",
  level: "Level: Level of the WBS element (1-5). Mandatory.",
  projectType: "Project Type: Only NL & NO. #N/A for others.",
  investmentProfile: "Investment Profile: Only NL: for CAPEX. Optional.",
  responsibleProfitCenter: "Responsible Profit Center: 8 digits = 4 company code + 4 varying digits. Mandatory.",
  responsibleCostCenter: "Responsible Cost Center: 8 digits = 4 company code + 4 varying digits. Mandatory.",
  planningElement: "Planning Element: You can only plan costs on a project that has been designated as a planning element. Mandatory.",
  rubricElement: "Rubric Element: If you set this indicator, the project will be defined as an account assignment element. Actual postings can be made. Mandatory.",
  billingElement: "Billing Element: If you want to maintain a billing plan for a project, you must set this indicator. If you have maintained a billing plan for the project, you cannot change this indicator. Mandatory.",
  settlementRulePercent: "Settlement Rule %: Enter settlement percent (%) in this column. Total sum must be 100%. Mandatory for OPEX project.",
  settlementRuleGoal: "Settlement Rule Goal: Enter project or internal order = goal of the settlement. Mandatory for OPEX project.",
  projectProfile: "Project Profile: In case you know, provide; otherwise added by MDM. Mandatory.",
  tm1Project: "TM1 Project: TM1 project (user field). Optional.",
  responsiblePerson: "Responsible Person: Name of manager or other responsible person. #N/A.",
  userId: "User ID: Only if new responsible person (to update project info). #N/A.",
  employmentNumber: "Employment Number: Only if new responsible person (to update project info). #N/A.",
  functionalArea: "Functional Area: Only Nordic: Choose from list (Only for CC); processed by Vattenfall. Mandatory.",
  tgPhase: "TG Phase: TG phase (user field). Optional.",
  projectSpec: "Project Spec (Project Specification): Project specification. If left blank, time recording is not possible. Mandatory for BA Wind.",
  motherCode: "Mother Code: WBS element mandatory if cross border recharging via Octopus is required. Mandatory for BA Wind.",
  comment: "Comment: User field. Optional.",
};

export default function WBSForm({ onSubmit, initialData, requestName }: WBSFormProps) {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [selectedFields, setSelectedFields] = useState<(keyof WBSFormData)[]>([]);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [isTutorialDialogOpen, setIsTutorialDialogOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bulkWBS: initialData || [
        {
          type: "New",
          controllingArea: "",
          companyCode: "",
          projectName: "",
          projectDefinition: "",
          level: "",
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
          region: "DE",
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
    console.log("Form submission triggered with values:", values);
    try {
      await onSubmit(values.bulkWBS);
      console.log("Form submitted successfully");
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const addWBSItem = () => {
    const newIndex = fields.length;
    const mainWBS = watchFieldArray[0];
    const newWBS = mainWBS
      ? {
          ...mainWBS,
          type: mainWBS.type as WbsTypeOptions,
          projectName: "",
          projectDefinition: "",
          system: mainWBS.system,
          level: mainWBS.level || "",
          region: mainWBS.region as RegionType,
        }
      : {
          type: "New" as WbsTypeOptions,
          controllingArea: "",
          companyCode: "",
          projectName: "",
          projectDefinition: "",
          level: "",
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
          region: "DE" as RegionType,
          system: "",
          projectProfile: "",
          tm1Project: "",
        };
    append(newWBS);
    setSelectedRows([...selectedRows, newIndex]);
  };

  const deleteSelectedItems = () => {
    const newSelectedRows = [...selectedRows].sort((a, b) => b - a);
    newSelectedRows.forEach((index) => remove(index));
    setSelectedRows([]);
  };

  const toggleField = (field: keyof WBSFormData) => {
    setSelectedFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const handleMatchData = () => {
    if (selectedRows.length === 0) {
      console.error("No rows selected to match data.");
      return;
    }
  
    if (selectedFields.length === 0) {
      console.error("No fields selected for matching.");
      return;
    }
  
    const sourceRow = watchFieldArray[0];
    if (!sourceRow) {
      console.error("Main WBS Element not found.");
      return;
    }
  
    console.log("Source Row (Main WBS):", sourceRow);
    console.log("Selected Rows:", selectedRows);
    console.log("Selected Fields:", selectedFields);
  
    selectedRows.forEach((targetIndex) => {
      selectedFields.forEach((field) => {
        const value = sourceRow[field];
        console.log(`Copying field "${field}" with value "${value}" to row ${targetIndex}`);
        form.setValue(`bulkWBS.${targetIndex}.${field}`, value);
      });
    });
  
    setSelectedRows([]);
    setSelectedFields([]);
    setIsMatchDialogOpen(false);
  };
  
  const mainRegion = watchFieldArray[0]?.region;

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

  const renderWBSRow = (index: number) => {
    const row = watchFieldArray[index];
    if (!row) return null;
    return <>
      <TableCell>
        <FormField
          control={form.control}
          name={`bulkWBS.${index}.region`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <select
                  {...field}
                  className="w-full p-2 border rounded bg-input text-foreground border-input placeholder:text-muted-foreground"
                  autoComplete="off"
                >
                  <option value="">Select Region</option>
                  <option value="DE">DE</option>
                  <option value="NL">NL</option>
                  <option value="SE">SE</option>
                  <option value="DK">DK</option>
                  <option value="UK">UK</option>
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
                  {getControllingAreaOptions(row.region as RegionType).map(option => (
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
                  <option value="">Select Level</option>
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
                  {getProjectTypeOptions(row.region as RegionType).map(option => (
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
                <div className="flex items-center justify-center group">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="scale-125 group-hover:scale-150 transition-transform duration-150 cursor-pointer"
                  />
                </div>
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
                <div className="flex items-center justify-center group">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="scale-125 group-hover:scale-150 transition-transform duration-150 cursor-pointer"
                  />
                </div>
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
                <div className="flex items-center justify-center group">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="scale-125 group-hover:scale-150 transition-transform duration-150 cursor-pointer"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>
      <TableCell>
        <FormField
          control={form.control}
          name={`bulkWBS.${index}.settlementRulePercent`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Settlement Rule %"
                  autoComplete="off"
                  disabled={row.region !== "NL"}
                  className={row.region !== "NL" ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''}
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
          name={`bulkWBS.${index}.settlementRuleGoal`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Settlement Rule Goal"
                  autoComplete="off"
                  disabled={row.region !== "NL"}
                  className={row.region !== "NL" ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''}
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
      <TableCell>
        <FormField
          control={form.control}
          name={`bulkWBS.${index}.functionalArea`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <select
                  {...field}
                  className={`w-full p-2 border rounded bg-input text-foreground border-input placeholder:text-muted-foreground ${!(row.region === "SE" || row.region === "DK" || row.region === "UK") ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''}`}
                  autoComplete="off"
                  disabled={!(row.region === "SE" || row.region === "DK" || row.region === "UK")}
                >
                  <option value="">Select Functional Area</option>
                  {getFunctionalAreaOptions(row.region as RegionType).map(option => (
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
                  {getProjectSpecOptions(row.region as RegionType).map(option => (
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
    </>;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit, (errors) => {
        console.log("Form validation errors:", errors);
      })} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Request Name: {requestName || "Main WBS Element"}</h3>
              <div className="flex gap-2">

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
                      <p className="mb-2"><span className="font-semibold">e.g.:</span> Tick Rubrick and Billing elements on the main WBS element and click <span className="font-semibold">Match Data from Main WBS</span> to copy the data to all additional WBS elements.</p>
                      <p className="mb-2">Once all required fields are filled, click <span className="font-semibold">Submit Request</span> to send your WBS request for processing. The form will automatically check for required fields and notify you if any are missing.</p>
                      <p className="text-muted-foreground">For more information about each field, hover over the <span className="font-semibold">i</span> icon.</p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className={tableStyles.tableContainer}>
              <Table className={tableStyles.table}>
                <TableHeader>
                  <TableRow>
                    <TableHead className={tableStyles.checkbox}></TableHead>
                    {[
                      { key: "region", label: "Region", className: `${tableStyles.region} text-center` },
                      { key: "type", label: "Type", className: `${tableStyles.type} text-center` },
                      { key: "system", label: "System", className: `${tableStyles.system} text-center` },
                      { key: "controllingArea", label: "Controlling Area", className: `${tableStyles.controllingArea} text-center` },
                      { key: "companyCode", label: "Company Code", className: `${tableStyles.companyCode} text-center` },
                      { key: "projectName", label: "Project Name", className: `${tableStyles.projectName} text-center` },
                      { key: "projectDefinition", label: "Project Definition", className: `${tableStyles.projectDefinition} text-center` },
                      { key: "level", label: "Level", className: `${tableStyles.level} text-center` },
                      { key: "projectType", label: "Project Type", className: `${tableStyles.projectType} text-center` },
                      { key: "investmentProfile", label: "Investment Profile", className: `${tableStyles.investmentProfile} text-center` },
                      { key: "responsibleProfitCenter", label: "Responsible Profit Center", className: `${tableStyles.responsiblePCCC} text-center` },
                      { key: "responsibleCostCenter", label: "Responsible Cost Center", className: `${tableStyles.responsiblePCCC} text-center` },
                      { key: "planningElement", label: "Planning Element", className: `${tableStyles.checkbox3Col} text-center` },
                      { key: "rubricElement", label: "Rubric Element", className: `${tableStyles.checkbox3Col} text-center` },
                      { key: "billingElement", label: "Billing Element", className: `${tableStyles.checkbox3Col} text-center` },
                      { key: "settlementRulePercent", label: "Settlement Rule %", className: `${tableStyles.settlement} text-center` },
                      { key: "settlementRuleGoal", label: "Settlement Rule Goal", className: `${tableStyles.settlement} text-center` },
                      { key: "projectProfile", label: "Project Profile", className: `${tableStyles.projectProfile} text-center` },
                      { key: "tm1Project", label: "TM1 Project", className: `${tableStyles.tm1Project} text-center` },
                      { key: "responsiblePerson", label: "Responsible Person", className: `${tableStyles.person} text-center` },
                      { key: "userId", label: "User ID", className: `${tableStyles.person} text-center` },
                      { key: "employmentNumber", label: "Employment Number", className: `${tableStyles.person} text-center` },
                      { key: "functionalArea", label: "Functional Area", className: `${tableStyles.functionalArea} text-center` },
                      { key: "tgPhase", label: "TG Phase", className: `${tableStyles.tgPhase} text-center` },
                      { key: "projectSpec", label: "Project Spec", className: `${tableStyles.projectSpec} text-center` },
                      { key: "motherCode", label: "Mother Code", className: `${tableStyles.motherCode} text-center` },
                      { key: "comment", label: "Comment", className: `${tableStyles.comment} text-center` },
                    ].map(({ key, label, className }) => (
                      <TableHead key={key} className={className}>
                        <div className="flex items-center justify-center gap-1">
                          <span>{label}</span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button type="button" className="text-muted-foreground hover:text-primary focus:outline-none flex items-center justify-center bg-transparent p-0" tabIndex={0}>
                                <Info className="h-4 w-4" aria-label={`${label} Info`} />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="max-w-xs text-sm">
                              {fieldDescriptions[key]}
                            </PopoverContent>
                          </Popover>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell className={tableStyles.checkbox}>
                        {index > 0 && (
                          <div className="flex items-center justify-center group">
                            <Checkbox
                              checked={selectedRows.includes(index)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedRows([...selectedRows, index]);
                                } else {
                                  setSelectedRows(selectedRows.filter((i) => i !== index));
                                }
                              }}
                              className="scale-125 group-hover:scale-150 transition-transform duration-150 cursor-pointer"
                            />
                          </div>
                        )}
                      </TableCell>
                      {renderWBSRow(index)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex gap-2 mt-4">
              <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                  >
                    Match Data from 1st WBS
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
                              mainRegion === "NL" || !field.toString().startsWith("settlement")
                            )
                            .map(({ field }) => field);
                          if (selectedFields.length === availableFields.length) {
                            setSelectedFields([]);
                          } else {
                            setSelectedFields(availableFields);
                          }
                        }}
                      >
                        {selectedFields.length === matchableFields.filter(({ field }: { field: keyof WBSFormData }) => 
                          mainRegion === "NL" || !field.toString().startsWith("settlement")
                        ).length ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {matchableFields.map(({ field, label }: { field: keyof WBSFormData; label: string }) => (
                        mainRegion === "NL" || !field.toString().startsWith("settlement") ? (
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
          </CardContent>
        </Card>

        <Button type="submit" className="w-full">
          Submit Request
        </Button>
      </form>
    </Form>
  );
}
