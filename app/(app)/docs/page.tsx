"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FileText,
  Users,
  Settings,
  Database,
  Search,
  Clock,
  BrainCircuit,
  Workflow,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DocsPage() {
  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Documentation</h1>
        <p className="text-muted-foreground">
          Learn how to use the MDM system effectively
        </p>
      </div>

      <Tabs defaultValue="getting-started" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="getting-started" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                System Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The Master Data Management (MDM) system helps you manage and
                maintain organizational data efficiently. Here is what you need
                to know:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Alert>
                  <Users className="h-4 w-4" />
                  <AlertTitle>User Roles</AlertTitle>
                  <AlertDescription>
                    Different access levels for requesters, approvers, and
                    admins
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Workflow className="h-4 w-4" />
                  <AlertTitle>Request Flow</AlertTitle>
                  <AlertDescription>
                    Submit, review, approve/reject, and track requests
                  </AlertDescription>
                </Alert>
                <Alert>
                  <BrainCircuit className="h-4 w-4" />
                  <AlertTitle>AI Analytics</AlertTitle>
                  <AlertDescription>
                    Get insights and trends from your request data
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertTitle>Real-time Updates</AlertTitle>
                  <AlertDescription>
                    Track changes and status updates instantly
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Quick Start Guide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="step1">
                  <AccordionTrigger>1. Account Setup</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Sign in with your organization credentials</li>
                      <li>Complete your profile information</li>
                      <li>Set notification preferences</li>
                      <li>Review your access permissions</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="step2">
                  <AccordionTrigger>
                    2. Creating Your First Request
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Navigate to the request form</li>
                      <li>Fill in required information</li>
                      <li>Attach necessary documentation</li>
                      <li>Submit for review</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="step3">
                  <AccordionTrigger>3. Tracking Requests</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc list-inside space-y-2">
                      <li>View request status in dashboard</li>
                      <li>Receive email notifications</li>
                      <li>Review comments and feedback</li>
                      <li>Track approval progress</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Request Workflows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Profit Center Requests</h3>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Submit new PC request with required details</li>
                    <li>Regional manager review</li>
                    <li>Financial approval if needed</li>
                    <li>Final validation and activation</li>
                  </ol>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Cost Center Requests</h3>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Create CC request with budget information</li>
                    <li>Department head approval</li>
                    <li>Budget verification</li>
                    <li>System registration</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Approval Process
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>Standard approval flow:</p>
                <div className="relative">
                  <div className="absolute h-full w-px bg-border left-2 top-0" />
                  <ol className="space-y-4 relative">
                    <li className="pl-8">
                      <div className="absolute w-4 h-4 bg-primary rounded-full left-0" />
                      <h4 className="font-medium">Submission</h4>
                      <p className="text-sm text-muted-foreground">
                        Request created and submitted
                      </p>
                    </li>
                    <li className="pl-8">
                      <div className="absolute w-4 h-4 bg-primary rounded-full left-0" />
                      <h4 className="font-medium">Initial Review</h4>
                      <p className="text-sm text-muted-foreground">
                        Checked for completeness
                      </p>
                    </li>
                    <li className="pl-8">
                      <div className="absolute w-4 h-4 bg-primary rounded-full left-0" />
                      <h4 className="font-medium">Approval</h4>
                      <p className="text-sm text-muted-foreground">
                        Reviewed by authorized personnel
                      </p>
                    </li>
                    <li className="pl-8">
                      <div className="absolute w-4 h-4 bg-primary rounded-full left-0" />
                      <h4 className="font-medium">Implementation</h4>
                      <p className="text-sm text-muted-foreground">
                        Changes applied in system
                      </p>
                    </li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search & Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>• Advanced search capabilities</li>
                  <li>• Filter by status, type, date</li>
                  <li>• Save custom filters</li>
                  <li>• Export search results</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5" />
                  AI Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>• Request pattern analysis</li>
                  <li>• Trend identification</li>
                  <li>• Processing time insights</li>
                  <li>• Automated recommendations</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>• Bulk request handling</li>
                  <li>• Data validation rules</li>
                  <li>• Version control</li>
                  <li>• Audit trail</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Customization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li>• Custom workflow rules</li>
                  <li>• Notification settings</li>
                  <li>• Role permissions</li>
                  <li>• Report templates</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="faq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="faq1">
                  <AccordionTrigger>
                    How long does the approval process take?
                  </AccordionTrigger>
                  <AccordionContent>
                    {`The typical approval process takes 2-3 business days,
                    depending on the request type and complexity. Urgent
                    requests can be expedited by contacting your regional
                    manager.`}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq2">
                  <AccordionTrigger>
                    Can I modify a submitted request?
                  </AccordionTrigger>
                  <AccordionContent>
                    {`Yes, you can edit a request while it's in "Draft" or
                    "Submitted" status. Once it enters review, you'll need to
                    contact the reviewer for any changes.`}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq3">
                  <AccordionTrigger>
                    How do I track my request status?
                  </AccordionTrigger>
                  <AccordionContent>
                    {`You can track your request status in the dashboard under
                    "My Requests." You'll also receive email notifications for
                    any status changes or comments.`}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq4">
                  <AccordionTrigger>
                    What if my request is rejected?
                  </AccordionTrigger>
                  <AccordionContent>
                    {`If your request is rejected, you'll receive a notification
                    with the reason. You can revise and resubmit the request
                    addressing the feedback provided.`}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
