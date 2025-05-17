import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { StoredWBSData } from "@/types";
import { toast } from "sonner";
import type { RegionType } from "@/types";

export interface ExportButtonProps {
  wbsData: StoredWBSData[];
  region: RegionType;
  requestName: string;
  submissionDate: string; // in YYYYMMDD format
}

export function ExportButton({ wbsData, region, requestName, submissionDate }: ExportButtonProps) {
  const handleExport = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

      const response = await fetch(`${API_URL}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wbsData }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Format: MDM WBS YYYYMMDD REGION - REQUESTNAME.xlsm
      link.download = `MDM WBS ${submissionDate} ${region} - ${requestName}.xlsm`;
      
      // Trigger the download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Export completed successfully');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export data');
    }
  };

  return (
    <Button
      onClick={handleExport}
      variant="outline"
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Export to Excel
    </Button>
  );
} 