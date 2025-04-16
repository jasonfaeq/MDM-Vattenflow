"use client";

import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export interface RadioOption {
  id: string;
  label: string;
  description?: string;
}

interface RadioGroupFormProps {
  title: string;
  description?: string;
  options: RadioOption[];
  defaultValue?: string;
  onSubmit: (value: string) => void;
  submitLabel?: string;
}

export function RadioGroupForm({
  title,
  description,
  options,
  defaultValue,
  onSubmit,
  submitLabel = "Submit",
}: RadioGroupFormProps) {
  const [selectedValue, setSelectedValue] = useState<string>(
    defaultValue || ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedValue) {
      onSubmit(selectedValue);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <RadioGroup
            value={selectedValue}
            onValueChange={setSelectedValue}
            className="space-y-3"
          >
            {options.map((option) => (
              <div key={option.id} className="flex items-start space-x-3">
                <RadioGroupItem value={option.id} id={option.id} />
                <div className="space-y-1">
                  <Label htmlFor={option.id} className="font-medium">
                    {option.label}
                  </Label>
                  {option.description && (
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={!selectedValue}>
            {submitLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
