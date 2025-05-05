"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/lib/auth";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to sign in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/10 relative">
      {/* Logo Section */}
      <div className="absolute top-10 flex flex-col items-center w-full select-none">
        <div className="flex items-center gap-3 mb-2">
          {/* Orange/Blue Circle */}
          <span className="inline-block w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-blue-600 shadow-lg border-2 border-white" />
          <span className="text-3xl font-extrabold tracking-tight text-primary drop-shadow-sm">VATTEN <span className="text-blue-700">FLOW</span></span>
        </div>
        <span className="text-muted-foreground text-sm tracking-wide">Master Data Management</span>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md shadow-2xl border-0 rounded-2xl bg-card/90 backdrop-blur-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Sign in to Vattenflow</CardTitle>
          <CardDescription>
            Enter your credentials to access the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@vattenfall.com" {...field} autoComplete="email" className="rounded-lg px-4 py-2 border focus:ring-2 focus:ring-blue-500 bg-input text-foreground" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} autoComplete="current-password" className="rounded-lg px-4 py-2 border focus:ring-2 focus:ring-blue-500 bg-input text-foreground" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full py-2 rounded-lg text-lg font-semibold shadow-md bg-gradient-to-r from-blue-700 to-yellow-400 hover:from-blue-800 hover:to-yellow-500 transition-colors duration-200" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center border-t pt-4 gap-2 bg-card/60 rounded-b-2xl">
          <p className="text-sm text-muted-foreground">
            For account requests, please contact the MDM team
          </p>
        </CardFooter>
      </Card>
      {/* Subtle background accent */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-yellow-200 via-blue-200 to-transparent dark:from-blue-900 dark:via-yellow-900 dark:to-transparent rounded-full opacity-30 blur-3xl" />
      </div>
    </div>
  );
}
