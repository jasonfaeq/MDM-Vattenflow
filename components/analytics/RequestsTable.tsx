import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RequestInsights } from "@/lib/gemini";

interface RequestsTableProps {
  insights: RequestInsights[];
}

export function RequestsTable({ insights }: RequestsTableProps) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Summary</TableHead>
            <TableHead>Trends</TableHead>
            <TableHead>Categories</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {insights.map((insight, index) => (
            <TableRow key={index}>
              <TableCell className="max-w-[200px] truncate">
                {insight.summary}
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {insight.trends.length} identified trends
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {insight.requestCategorization.byType.length} categories
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {insight.actionableInsights.length} actions
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
