"use client";

import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";

export default function AuthTestPage() {
  const { user, signOut, refreshUser, loading } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshUser = async () => {
    setIsRefreshing(true);
    try {
      await refreshUser();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="container py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Authentication Test</h1>
        <p className="text-muted-foreground">
          This page demonstrates the use of the AuthContext.
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Current authenticated user details</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <p>Loading user data...</p>
            </div>
          ) : user ? (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <p className="font-medium">User ID:</p>
                <p className="col-span-2 text-muted-foreground">{user.uid}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <p className="font-medium">Email:</p>
                <p className="col-span-2 text-muted-foreground">{user.email}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <p className="font-medium">Display Name:</p>
                <p className="col-span-2 text-muted-foreground">
                  {user.displayName || "Not set"}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <p className="font-medium">Role:</p>
                <p className="col-span-2 text-muted-foreground">{user.role}</p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-muted rounded-md">
              <p className="text-center">Not logged in</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start space-y-2 sm:flex-row sm:justify-between sm:space-y-0">
          {user ? (
            <>
              <Button
                variant="outline"
                onClick={handleRefreshUser}
                disabled={isRefreshing}
              >
                {isRefreshing ? "Refreshing..." : "Refresh User"}
              </Button>
              <Button
                variant="destructive"
                onClick={signOut}
                disabled={loading}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              onClick={() => (window.location.href = "/login")}
              disabled={loading}
              className="w-full"
            >
              Sign In
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
