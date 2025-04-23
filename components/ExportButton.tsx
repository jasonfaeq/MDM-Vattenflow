import { Button } from "@/components/ui/button";
import { exportToExcel } from "@/utils/excelExport";
import { Download } from "lucide-react";
import { WBSElement } from "@/types";

interface ExportButtonProps {
  wbsData: WBSElement[];
  region: string;
}

export function ExportButton({ wbsData, region }: ExportButtonProps) {
  const handleExport = () => {
    try {
      exportToExcel(wbsData, region);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      // You might want to add proper error handling/notification here
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