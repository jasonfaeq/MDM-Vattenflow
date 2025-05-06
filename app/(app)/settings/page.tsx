"use client";

import { useAuth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">User Information</h1>
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>
            Current user details from Firebase Authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Email:</span> {user?.email}
            </div>
            <div>
              <span className="font-medium">User ID:</span> {user?.uid}
            </div>
            <div>
              <span className="font-medium">Display Name:</span> {user?.displayName || "Not set"}
            </div>
            <div>
              <span className="font-medium">Current Role:</span> {user?.role || "Not set"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
