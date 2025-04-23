"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, CopyCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Region } from "@/types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";

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
} as const;

const baseWBSSchema = z.object({
  controllingArea: z.string().min(1, "Required"),
  companyCode: z.string().min(1, "Required"),
  projectName: z.string().min(1, "Required"),
  projectDefinition: z.string().min(1, "Required"),
  level: z.string().optional(),
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
  type: z.enum(["New", "Update", "Lock", "Unlock", "Close"]),
  region: z.string() as z.ZodType<Region>,
});

const formSchema = z.object({
  region: z.string() as z.ZodType<Region>,
  bulkWBS: z.array(baseWBSSchema).min(1, "At least one WBS item is required"),
});

type FormValues = z.infer<typeof formSchema>;
type WBSFormData = z.infer<typeof baseWBSSchema>;

interface WBSFormProps {
  region: Region;
  onSubmit: (data: WBSFormData[]) => Promise<void>;
}

type RegionType = "DE" | "NL" | "SE" | "PL";

const getControllingAreaOptions = (region: RegionType) => {
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
    case "PL":
      return [
        { value: "4000", label: "4000 Warsaw Systems" },
        { value: "4100", label: "4100 Krakow Development" },
        { value: "4200", label: "4200 Wrocław Engineering" },
        { value: "4300", label: "4300 Poznań Analytics" },
        { value: "4400", label: "4400 Gdańsk Maritime" },
      ];
    default:
      return [];
  }
};

const getFunctionalAreaOptions = (region: RegionType) => {
  switch (region) {
    case "DE":
      return [
        { value: "1001", label: "Production" },
        { value: "1002", label: "Quality Control" },
        { value: "1003", label: "Maintenance" },
      ];
    case "NL":
      return [
        { value: "2001", label: "Research" },
        { value: "2002", label: "Development" },
        { value: "2003", label: "Testing" },
      ];
    case "SE":
      return [
        { value: "3001", label: "Design" },
        { value: "3002", label: "Innovation" },
        { value: "3003", label: "Prototyping" },
      ];
    case "PL":
      return [
        { value: "4001", label: "Engineering" },
        { value: "4002", label: "Analysis" },
        { value: "4003", label: "Implementation" },
      ];
    default:
      return [];
  }
};

const getProjectSpecOptions = (region: RegionType) => {
  switch (region) {
    case "DE":
      return [
        { value: "DE_INV", label: "Industrial Investment" },
        { value: "DE_RD", label: "Research & Development" },
        { value: "DE_MAINT", label: "Industrial Maintenance" },
      ];
    case "NL":
      return [
        { value: "NL_TECH", label: "Technology Innovation" },
        { value: "NL_GREEN", label: "Green Energy" },
        { value: "NL_SMART", label: "Smart Solutions" },
      ];
    case "SE":
      return [
        { value: "SE_SUS", label: "Sustainable Projects" },
        { value: "SE_DIG", label: "Digital Transformation" },
        { value: "SE_INNOV", label: "Innovation Hub" },
      ];
    case "PL":
      return [
        { value: "PL_ENG", label: "Engineering Excellence" },
        { value: "PL_AUTO", label: "Automation Systems" },
        { value: "PL_IT", label: "IT Infrastructure" },
      ];
    default:
      return [];
  }
};

export default function WBSForm({ region, onSubmit }: WBSFormProps) {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [selectedFields, setSelectedFields] = useState<(keyof WBSFormData)[]>([]);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      region,
      bulkWBS: [
        {
          type: "New",
          controllingArea: "",
          companyCode: "",
          projectName: "",
          projectDefinition: "",
          level: "1",
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
  const controlledFields = fields.map((field, index) => {
    return {
      ...field,
      ...watchFieldArray[index],
    };
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      await onSubmit(values.bulkWBS as WBSFormData[]);
    } catch (error) {
      console.error("Error submitting WBS request:", error);
      throw error;
    }
  };

  const addWBSItem = () => {
    // Copy values from the main WBS
    const mainWBS = form.getValues('bulkWBS.0');
    append({
      ...mainWBS,
      projectName: "",
      projectDefinition: "",
    });
  };

  const deleteSelectedItems = () => {
    // Sort in descending order to avoid index shifting issues
    const sortedIndexes = [...selectedRows].sort((a, b) => b - a);
    sortedIndexes.forEach(index => {
      remove(index);
    });
    setSelectedRows([]);
  };

  const toggleRowSelection = (index: number) => {
    setSelectedRows(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const toggleAllRows = () => {
    if (selectedRows.length === fields.length - 1) {
      setSelectedRows([]);
    } else {
      setSelectedRows(fields.slice(1).map((_, i) => i + 1));
    }
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

  const matchData = () => {
    const mainWBS = form.getValues('bulkWBS.0');
    const currentValues = form.getValues().bulkWBS;
    
    const updatedBulkWBS = currentValues.map((item, index) => {
      if (index === 0 || !selectedRows.includes(index)) return item;
      
      const updates = selectedFields.reduce<{ [K in keyof WBSFormData]?: WBSFormData[K] }>((acc, field) => {
        const value = mainWBS[field];
        if (value !== undefined && value !== null) {
          acc[field] = value;
        }
        return acc;
      }, {}) as Partial<WBSFormData>;
      return {
        ...item,
        ...updates,
      };
    });
    
    form.setValue('bulkWBS', updatedBulkWBS);
    setIsMatchDialogOpen(false);
    setSelectedFields([]);
  };

  const renderWBSRow = (index: number, showSelect: boolean = true) => {
    const rowType = form.watch(`bulkWBS.${index}.type`);
    
    return (
    <TableRow key={fields[index].id} className={selectedRows.includes(index) ? "bg-muted/50" : ""}>
      {showSelect && (
        <TableCell>
          <Checkbox
            checked={selectedRows.includes(index)}
            onCheckedChange={() => toggleRowSelection(index)}
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
      {/* Always visible fields */}
      <TableCell>
        <FormField
          control={form.control}
          name={`bulkWBS.${index}.controllingArea`}
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
          name={`bulkWBS.${index}.companyCode`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input {...field} placeholder="Company code" />
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
                <Input {...field} placeholder="Project name" />
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
                <Input {...field} placeholder="Project definition" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>
      {rowType === "New" && (
        <>
          <TableCell>
            <FormField
              control={form.control}
              name={`bulkWBS.${index}.level`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <select
                      {...field}
                      className="w-full p-2 border rounded"
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
              name={`bulkWBS.${index}.responsiblePCCC`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} placeholder="Responsible PC/CC" />
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
                        <Input {...field} placeholder="Settlement rule %" />
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
                        <Input {...field} placeholder="Settlement rule goal" />
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
                    <Input {...field} placeholder="Responsible person" />
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
              name={`bulkWBS.${index}.employmentNumber`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} placeholder="Employment number" />
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
                name={`bulkWBS.${index}.functionalArea`}
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
              name={`bulkWBS.${index}.tgPhase`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} placeholder="TG Phase" />
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
          name={`bulkWBS.${index}.projectSpec`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <select
                  {...field}
                  className="w-full p-2 border rounded"
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
                <Input {...field} placeholder="Mother code" />
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
                <Input {...field} placeholder="Comment" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>
    </TableRow>
  )};

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
                    <TableHead className={tableStyles.type}>Type</TableHead>
                    <TableHead className={tableStyles.controllingArea}>Controlling Area</TableHead>
                    <TableHead className={tableStyles.companyCode}>Company Code</TableHead>
                    <TableHead className={tableStyles.projectName}>Project Name</TableHead>
                    <TableHead className={tableStyles.projectDefinition}>Project Definition</TableHead>
                    {form.watch('bulkWBS.0.type') === "New" && (
                      <>
                        <TableHead className={tableStyles.level}>Level</TableHead>
                        <TableHead className={tableStyles.responsiblePCCC}>Responsible PC/CC</TableHead>
                        <TableHead className={tableStyles.checkbox3Col}>Planning Element</TableHead>
                        <TableHead className={tableStyles.checkbox3Col}>Rubric Element</TableHead>
                        <TableHead className={tableStyles.checkbox3Col}>Billing Element</TableHead>
                        {region === "NL" && (
                          <>
                            <TableHead className={tableStyles.settlement}>Settlement Rule %</TableHead>
                            <TableHead className={tableStyles.settlement}>Settlement Rule Goal</TableHead>
                          </>
                        )}
                        <TableHead className={tableStyles.person}>Responsible Person</TableHead>
                        <TableHead className={tableStyles.person}>User ID</TableHead>
                        <TableHead className={tableStyles.person}>Employment Number</TableHead>
                        {region === "NL" && <TableHead className={tableStyles.functionalArea}>Functional Area</TableHead>}
                        <TableHead className={tableStyles.tgPhase}>TG Phase</TableHead>
                      </>
                    )}
                    <TableHead className={tableStyles.projectSpec}>Project Spec</TableHead>
                    <TableHead className={tableStyles.motherCode}>Mother Code</TableHead>
                    <TableHead className={tableStyles.comment}>Comment</TableHead>
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
                            onClick={matchData}
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
                        <TableHead className={tableStyles.type}>Type</TableHead>
                        <TableHead className={tableStyles.controllingArea}>Controlling Area</TableHead>
                        <TableHead className={tableStyles.companyCode}>Company Code</TableHead>
                        <TableHead className={tableStyles.projectName}>Project Name</TableHead>
                        <TableHead className={tableStyles.projectDefinition}>Project Definition</TableHead>
                        {controlledFields.some(field => field.type === "New") && (
                          <>
                            <TableHead className={tableStyles.level}>Level</TableHead>
                            <TableHead className={tableStyles.responsiblePCCC}>Responsible PC/CC</TableHead>
                            <TableHead className={tableStyles.checkbox3Col}>Planning Element</TableHead>
                            <TableHead className={tableStyles.checkbox3Col}>Rubric Element</TableHead>
                            <TableHead className={tableStyles.checkbox3Col}>Billing Element</TableHead>
                            {region === "NL" && (
                              <>
                                <TableHead className={tableStyles.settlement}>Settlement Rule %</TableHead>
                                <TableHead className={tableStyles.settlement}>Settlement Rule Goal</TableHead>
                              </>
                            )}
                            <TableHead className={tableStyles.person}>Responsible Person</TableHead>
                            <TableHead className={tableStyles.person}>User ID</TableHead>
                            <TableHead className={tableStyles.person}>Employment Number</TableHead>
                            {region === "NL" && <TableHead className={tableStyles.functionalArea}>Functional Area</TableHead>}
                            <TableHead className={tableStyles.tgPhase}>TG Phase</TableHead>
                          </>
                        )}
                        <TableHead className={tableStyles.projectSpec}>Project Spec</TableHead>
                        <TableHead className={tableStyles.motherCode}>Mother Code</TableHead>
                        <TableHead className={tableStyles.comment}>Comment</TableHead>
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
