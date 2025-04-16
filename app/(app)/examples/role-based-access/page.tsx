"use client";

import { useAuth } from "@/lib/auth";
import { RadioGroupForm, RadioOption } from "@/components/forms/RadioGroupForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";

export default function RoleBasedAccessPage() {
  const { user, loading } = useAuth();
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  // Get user access level based on role
  const getUserAccessLevel = () => {
    if (!user) return 0;

    switch (user.role) {
      case "MDM":
        return 3; // Admin level
      case "Controller":
        return 1; // Basic level
      default:
        return 0; // No access
    }
  };

  const userAccessLevel = getUserAccessLevel();

  const actions: (RadioOption & { requiredLevel: number })[] = [
    {
      id: "view-data",
      label: "View Data",
      description: "Basic level action - all authenticated users can do this",
      requiredLevel: 1,
    },
    {
      id: "approve-requests",
      label: "Approve Requests",
      description: "Mid level action - requires higher privileges",
      requiredLevel: 2,
    },
    {
      id: "manage-users",
      label: "Manage Users",
      description: "High level action - requires MDM role",
      requiredLevel: 3,
    },
  ];

  const getAccessibleOptions = () => {
    return actions
      .filter((action) => userAccessLevel >= action.requiredLevel)
      .map(({ requiredLevel, ...rest }) => rest);
  };

  const getInaccessibleOptions = () => {
    return actions
      .filter((action) => userAccessLevel < action.requiredLevel)
      .map(({ requiredLevel, ...rest }) => rest);
  };

  const handleActionSelect = (value: string) => {
    setSelectedAction(value);
    toast.success(`Action performed: ${value}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p>Loading user data...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            You need to sign in to see role-based access controls.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Please sign in to continue.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Role-Based Access Control</h1>
        <p className="text-muted-foreground">
          This example demonstrates how to implement role-based access controls
          using the AuthContext.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current User</CardTitle>
          <CardDescription>Your current access level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">Display Name:</div>
            <div>{user.displayName || "Not set"}</div>
            <div className="font-medium">Email:</div>
            <div>{user.email}</div>
            <div className="font-medium">Role:</div>
            <div className="font-semibold">{user.role}</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-lg font-medium mb-4">Available Actions</h2>
          <p className="text-sm text-muted-foreground mb-4">
            These actions are available based on your current role ({user.role}
            ).
          </p>

          {getAccessibleOptions().length > 0 ? (
            <RadioGroupForm
              title="Select an Action"
              description="Choose an action to perform"
              options={getAccessibleOptions()}
              onSubmit={handleActionSelect}
              submitLabel="Perform Action"
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p>No actions available for your role.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <h2 className="text-lg font-medium mb-4">Restricted Actions</h2>
          <p className="text-sm text-muted-foreground mb-4">
            These actions require a higher role level than your current role (
            {user.role}).
          </p>

          {getInaccessibleOptions().length > 0 ? (
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="text-base">Restricted Actions</CardTitle>
                <CardDescription>
                  You don't have permission to perform these actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {getInaccessibleOptions().map((option) => (
                  <div
                    key={option.id}
                    className="p-3 bg-muted rounded-md opacity-70"
                  >
                    <h3 className="font-medium">{option.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p>You have access to all available actions.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {selectedAction && (
        <Card className="bg-primary/5 border-primary/30">
          <CardHeader>
            <CardTitle>Action Performed</CardTitle>
            <CardDescription>
              You successfully performed an action
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Action ID: <span className="font-mono">{selectedAction}</span>
            </p>
            <p>
              Action:{" "}
              <span className="font-medium">
                {actions.find((a) => a.id === selectedAction)?.label}
              </span>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
