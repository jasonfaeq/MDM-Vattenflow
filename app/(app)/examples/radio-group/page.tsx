"use client";

import { useState } from "react";
import { RadioGroupForm, RadioOption } from "@/components/forms/RadioGroupForm";
import { toast } from "sonner";

export default function RadioGroupExamplePage() {
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const options: RadioOption[] = [
    {
      id: "option-1",
      label: "Option 1",
      description: "This is the first option with additional description",
    },
    {
      id: "option-2",
      label: "Option 2",
      description: "This is the second option with additional description",
    },
    {
      id: "option-3",
      label: "Option 3",
      description: "This is the third option with additional description",
    },
  ];

  const handleSubmit = (value: string) => {
    setSelectedValue(value);
    toast.success(`Selected: ${value}`);
  };

  return (
    <div className="container py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Radio Group Example</h1>
        <p className="text-muted-foreground">
          This is an example of how to use the RadioGroupForm component.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <RadioGroupForm
            title="Select an Option"
            description="Please choose one of the following options"
            options={options}
            onSubmit={handleSubmit}
            submitLabel="Save Selection"
          />
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="font-medium mb-4">Selected Value:</h2>
          {selectedValue ? (
            <pre className="bg-muted p-4 rounded-md">
              {JSON.stringify(
                options.find((opt) => opt.id === selectedValue),
                null,
                2
              )}
            </pre>
          ) : (
            <p className="text-muted-foreground">No option selected yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
