import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Request } from "@/types";
import { format } from "date-fns";
import * as Papa from "papaparse";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format timestamp to readable date
export function formatTimestamp(
  timestamp: any,
  formatString: string = "dd MMM yyyy, HH:mm"
) {
  if (!timestamp) return "N/A";
  try {
    return format(timestamp.toDate(), formatString);
  } catch (error) {
    return "Invalid date";
  }
}

// Export requests to CSV
export function exportRequestsToCSV(
  requests: Request[],
  filename: string = "mdm-requests.csv"
) {
  // Transform the requests into a CSV-friendly format
  const csvData = requests.map((request) => {
    // Get the requester's name from the first history entry
    const requesterName =
      request.history.length > 0 ? request.history[0].changedByUserName : "";

    // Base data for all request types with index signature to allow dynamic property addition
    const baseData: Record<string, string> = {
      "Request ID": request.id || "",
      "Request Type": request.requestType,
      Region: request.region,
      Status: request.status,
      "Requester Email": request.requesterEmail,
      "Requester Name": requesterName,
      "Created Date": formatTimestamp(request.createdAt, "yyyy-MM-dd"),
      "Last Updated": formatTimestamp(request.updatedAt, "yyyy-MM-dd"),
    };

    // Add fields from submittedData if it's a simple object
    if (!Array.isArray(request.submittedData)) {
      Object.entries(request.submittedData).forEach(([key, value]) => {
        // Format dates
        if (value instanceof Date) {
          baseData[`${key.charAt(0).toUpperCase() + key.slice(1)}`] = format(
            value,
            "yyyy-MM-dd"
          );
        } else if (typeof value === "string" || typeof value === "number") {
          baseData[`${key.charAt(0).toUpperCase() + key.slice(1)}`] =
            String(value);
        }
      });
    } else {
      // If it's bulk data, just note the count
      baseData["Bulk Items"] = request.submittedData.length.toString();
    }

    return baseData;
  });

  // Convert to CSV
  const csv = Papa.unparse(csvData);

  // Create and download the file
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export a single request to CSV (for individual request export)
export function exportSingleRequestToCSV(request: Request) {
  const filename = `request-${request.id}-${request.requestType}.csv`;
  exportRequestsToCSV([request], filename);
}
