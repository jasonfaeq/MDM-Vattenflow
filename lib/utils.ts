import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

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
