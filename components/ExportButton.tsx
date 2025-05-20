import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { StoredWBSData } from "@/types";
import { toast } from "sonner";
import { useState } from "react";
import { getControllingAreaOptions, getFunctionalAreaOptions } from "@/components/forms/WBSForm";

export interface ExportButtonProps {
  wbsData: StoredWBSData[];
  requestName: string;
  submissionDate: string; // in YYYYMMDD format
}

export function ExportButton({ wbsData, requestName, submissionDate }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

      // Enrich WBS data with controllingAreaLabel and functionalAreaLabel
      const enrichedWBSData = wbsData.map(wbs => {
        const controllingAreaOption = getControllingAreaOptions(wbs.region).find(opt => opt.value === wbs.controllingArea);
        const functionalAreaOption = getFunctionalAreaOptions(wbs.region).find(opt => opt.value === wbs.functionalArea);
        return {
          ...wbs,
          controllingAreaLabel: controllingAreaOption ? controllingAreaOption.label : wbs.controllingArea,
          functionalAreaLabel: functionalAreaOption ? functionalAreaOption.label : wbs.functionalArea,
        };
      });

      // Group WBS elements by region
      const wbsByRegion = enrichedWBSData.reduce((acc, wbs) => {
        const region = wbs.region;
        if (!acc[region]) {
          acc[region] = [];
        }
        acc[region].push(wbs);
        return acc;
      }, {} as Record<string, typeof enrichedWBSData>);

      // Export each region's data separately
      const exportPromises = Object.entries(wbsByRegion).map(async ([region, regionData]) => {
        const response = await fetch(`${API_URL}/export`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ wbsData: regionData }),
        });

        if (!response.ok) {
          throw new Error(`Export failed for region ${region}`);
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

        return region;
      });

      // Wait for all exports to complete
      const completedRegions = await Promise.all(exportPromises);
      toast.success(`Export completed successfully for regions: ${completedRegions.join(', ')}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        onClick={handleExport}
        variant="outline"
        className="gap-2"
        disabled={loading}
      >
        <Download className="h-4 w-4" />
        {loading ? 'Exporting...' : 'Export to Excel'}
      </Button>
      {loading && (
        <div style={{ marginTop: 8, color: '#555', fontSize: 14 }}>
          Please wait while files are being exported, don&apos;t leave this page.
        </div>
      )}
    </div>
  );
} 