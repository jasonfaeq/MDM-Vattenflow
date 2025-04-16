"use client";

import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Save, Trash2, Download } from "lucide-react";

interface Template {
  id: string;
  name: string;
  data: any;
  createdAt: Date;
  userId: string;
  requestType: string;
}

interface TemplatesProps {
  currentData: any;
  onLoadTemplate: (data: any) => void;
  requestType: string;
}

export default function Templates({
  currentData,
  onLoadTemplate,
  requestType,
}: TemplatesProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const templatesRef = collection(db, `users/${user.uid}/templates`);
      const snapshot = await getDocs(templatesRef);

      const templatesList = snapshot.docs
        .map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
            } as Template)
        )
        .filter((template) => template.requestType === requestType)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setTemplates(templatesList);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const saveAsTemplate = async () => {
    if (!user || !newTemplateName.trim()) return;

    try {
      const templatesRef = collection(db, `users/${user.uid}/templates`);
      await addDoc(templatesRef, {
        name: newTemplateName,
        data: currentData,
        requestType,
        userId: user.uid,
        createdAt: new Date(),
      });

      toast.success("Template saved successfully");
      setNewTemplateName("");
      setShowSaveDialog(false);
      fetchTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!user) return;

    try {
      const templateRef = doc(db, `users/${user.uid}/templates/${templateId}`);
      await deleteDoc(templateRef);

      toast.success("Template deleted");
      setTemplates(templates.filter((t) => t.id !== templateId));
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    }
  };

  const loadTemplate = (template: Template) => {
    onLoadTemplate(template.data);
    setShowTemplateDialog(false);
    toast.success(`Template "${template.name}" loaded`);
  };

  return (
    <div className="flex gap-2">
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save as Template
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save your current form data as a reusable template
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              placeholder="E.g., Standard WBS Request"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveAsTemplate} disabled={!newTemplateName.trim()}>
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Load Template
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Your Templates</DialogTitle>
            <DialogDescription>
              Load a previously saved template for {requestType} requests
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] mt-4">
            {templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">No templates found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Save a template first to see it here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map((template) => (
                  <Card key={template.id} className="overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base">
                        {template.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Created {template.createdAt.toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="p-4 pt-2 flex justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                      <Button size="sm" onClick={() => loadTemplate(template)}>
                        Use Template
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
