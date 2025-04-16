"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc,
  setDoc,
  Timestamp,
  limit,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Request } from "@/types";
import { analyzeRequestsWithGemini, RequestInsights } from "@/lib/gemini";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { toast } from "sonner";
import {
  BrainCircuit,
  TrendingUp,
  Users,
  Clock,
  Activity,
  Download,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
];

interface SavedAnalytics {
  id: string;
  insights: RequestInsights;
  timestamp: Timestamp;
  requestCount: number;
  trends: {
    daily: any[];
    weekly: any[];
    monthly: any[];
  };
  performance: {
    averageProcessingTime: number;
    completionRate: number;
    rejectionRate: number;
  };
  rawData?: {
    requests: Request[];
    timeRange: string;
  };
}

interface TimelineMetrics {
  timestamp: string;
  count: number;
  approved: number;
  rejected: number;
  pending: number;
}

export default function AnalyticsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<RequestInsights | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [savingAnalytics, setSavingAnalytics] = useState(false);
  const [savedAnalytics, setSavedAnalytics] = useState<SavedAnalytics | null>(
    null
  );
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [timelineData, setTimelineData] = useState<TimelineMetrics[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    averageProcessingTime: 0,
    completionRate: 0,
    rejectionRate: 0,
    totalRequests: 0,
  });

  useEffect(() => {
    fetchRequests();
    fetchLastAnalytics();
  }, [timeRange]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));

      const q = query(
        collection(db, "requests"),
        where("createdAt", ">=", Timestamp.fromDate(daysAgo)),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const requestsList: Request[] = [];
      querySnapshot.forEach((doc) => {
        requestsList.push({ id: doc.id, ...doc.data() } as Request);
      });

      setRequests(requestsList);
      calculateMetrics(requestsList);
      generateTimelineData(requestsList);

      // If we don't have any insights loaded yet, try to load saved ones
      if (!insights && savedAnalytics) {
        setInsights(savedAnalytics.insights);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load request data");
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (requestsList: Request[]) => {
    const total = requestsList.length;
    const completed = requestsList.filter(
      (r) => r.status === "Completed"
    ).length;
    const rejected = requestsList.filter((r) => r.status === "Rejected").length;

    const processingTimes = requestsList
      .filter((r) => r.status === "Completed" && r.createdAt && r.updatedAt)
      .map((r) => {
        const start = r.createdAt.toDate();
        const end = r.updatedAt.toDate();
        return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
      });

    const avgProcessingTime =
      processingTimes.length > 0
        ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
        : 0;

    setPerformanceMetrics({
      averageProcessingTime: avgProcessingTime,
      completionRate: (completed / total) * 100,
      rejectionRate: (rejected / total) * 100,
      totalRequests: total,
    });
  };

  const generateTimelineData = (requestsList: Request[]) => {
    const timeline: { [key: string]: TimelineMetrics } = {};

    requestsList.forEach((request) => {
      const date = request.createdAt.toDate().toISOString().split("T")[0];
      if (!timeline[date]) {
        timeline[date] = {
          timestamp: date,
          count: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
        };
      }

      timeline[date].count++;
      if (request.status === "Completed") timeline[date].approved++;
      else if (request.status === "Rejected") timeline[date].rejected++;
      else timeline[date].pending++;
    });

    setTimelineData(
      Object.values(timeline).sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    );
  };

  const fetchLastAnalytics = async () => {
    setLoadingSaved(true);
    try {
      const analyticsRef = doc(db, "analytics", "latest");
      const analyticsDoc = await getDoc(analyticsRef);

      if (analyticsDoc.exists()) {
        const savedData = analyticsDoc.data() as SavedAnalytics;
        setSavedAnalytics(savedData);

        // Automatically load the saved insights when the page loads
        setInsights(savedData.insights);

        // If raw data exists, restore the complete state
        if (savedData.rawData) {
          setRequests(savedData.rawData.requests);
          calculateMetrics(savedData.rawData.requests);
          generateTimelineData(savedData.rawData.requests);

          // Only update timeRange if it's different from current
          if (timeRange !== savedData.rawData.timeRange) {
            setTimeRange(savedData.rawData.timeRange);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching saved analytics:", error);
      toast.error("Failed to load saved analytics");
    } finally {
      setLoadingSaved(false);
    }
  };

  const analyzeData = async () => {
    if (requests.length === 0) {
      toast.warning("No request data available to analyze");
      return;
    }

    setAnalyzing(true);
    try {
      const analyticsInsights = await analyzeRequestsWithGemini(requests);
      setInsights(analyticsInsights);
      toast.success("Analysis completed successfully");

      // Save the analysis with raw data for regeneration
      saveAnalytics(analyticsInsights, true);
    } catch (error) {
      console.error("Error analyzing data:", error);
      toast.error("Failed to analyze data with Gemini AI");
    } finally {
      setAnalyzing(false);
    }
  };

  const saveAnalytics = async (
    insightsToSave: RequestInsights,
    includeRawData: boolean = false
  ) => {
    if (!insightsToSave) return;

    setSavingAnalytics(true);
    try {
      const analytics: SavedAnalytics = {
        id: "latest",
        insights: insightsToSave,
        timestamp: Timestamp.now(),
        requestCount: requests.length,
        trends: {
          daily: [],
          weekly: [],
          monthly: [],
        },
        performance: {
          averageProcessingTime: performanceMetrics.averageProcessingTime,
          completionRate: performanceMetrics.completionRate,
          rejectionRate: performanceMetrics.rejectionRate,
        },
      };

      // Include raw data if specified
      if (includeRawData) {
        analytics.rawData = {
          requests: requests,
          timeRange: timeRange,
        };
      }

      await setDoc(doc(db, "analytics", "latest"), analytics);
      setSavedAnalytics(analytics);
      toast.success("Analytics saved successfully");
    } catch (error) {
      console.error("Error saving analytics:", error);
      toast.error("Failed to save analytics");
    } finally {
      setSavingAnalytics(false);
    }
  };

  const regenerateAnalysis = async () => {
    if (!savedAnalytics?.rawData?.requests) {
      toast.error("No raw data available for regeneration");
      return;
    }

    setAnalyzing(true);
    try {
      const analyticsInsights = await analyzeRequestsWithGemini(
        savedAnalytics.rawData.requests
      );
      setInsights(analyticsInsights);
      toast.success("Analysis regenerated successfully");

      // Save the new analysis with raw data
      saveAnalytics(analyticsInsights, true);
    } catch (error) {
      console.error("Error regenerating analysis:", error);
      toast.error("Failed to regenerate analysis");
    } finally {
      setAnalyzing(false);
    }
  };

  const exportAnalyticsToJSON = () => {
    if (!insights) return;

    const dataStr = JSON.stringify(insights, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(
      dataStr
    )}`;

    const exportFileDefaultName = `mdm-analytics-${
      new Date().toISOString().split("T")[0]
    }.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  // Custom label renderers for charts with TypeScript type definitions
  const renderPieLabel = ({
    name,
    percent,
  }: {
    name: string;
    percent: number;
  }) => {
    return `${name} ${(percent * 100).toFixed(0)}%`;
  };

  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return "Unknown";
    try {
      return new Date(timestamp.toDate()).toLocaleString();
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            AI-powered insights and analytics for MDM requests
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={analyzeData} disabled={analyzing}>
            <BrainCircuit className="mr-2 h-4 w-4" />
            {analyzing ? "Analyzing..." : "Analyze with AI"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics.totalRequests}
            </div>
            <p className="text-xs text-muted-foreground">
              in the last {timeRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics.completionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              requests completed successfully
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Processing Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics.averageProcessingTime.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">
              average completion time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rejection Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics.rejectionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">of total requests</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Request Timeline</CardTitle>
            <CardDescription>
              Request volume and status over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="approved"
                    stackId="1"
                    stroke="#4ade80"
                    fill="#4ade80"
                  />
                  <Area
                    type="monotone"
                    dataKey="rejected"
                    stackId="1"
                    stroke="#f87171"
                    fill="#f87171"
                  />
                  <Area
                    type="monotone"
                    dataKey="pending"
                    stackId="1"
                    stroke="#fbbf24"
                    fill="#fbbf24"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Distribution</CardTitle>
            <CardDescription>
              Distribution by request type and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={requests.reduce((acc, curr) => {
                      const existing = acc.find(
                        (item) => item.name === curr.requestType
                      );
                      if (existing) {
                        existing.value++;
                      } else {
                        acc.push({ name: curr.requestType, value: 1 });
                      }
                      return acc;
                    }, [] as { name: string; value: number }[])}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderPieLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {requests.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {insights && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>AI Insights</CardTitle>
                <CardDescription>
                  Generated insights from request patterns
                </CardDescription>
              </div>
              <Button variant="outline" onClick={exportAnalyticsToJSON}>
                <Download className="mr-2 h-4 w-4" />
                Export Insights
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.summary && (
              <div>
                <h3 className="font-semibold mb-2">Summary</h3>
                <p className="text-sm text-muted-foreground">
                  {insights.summary}
                </p>
              </div>
            )}
            {insights.trends && (
              <div>
                <h3 className="font-semibold mb-2">Trends</h3>
                <ul className="list-disc list-inside space-y-1">
                  {insights.trends.map((trendItem, index: number) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      {trendItem.trend}: {trendItem.description}
                      {trendItem.recommendation && (
                        <span className="block ml-4 text-xs text-blue-600">
                          Recommendation: {trendItem.recommendation}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {insights.requestCategorization && (
              <div>
                <h3 className="font-semibold mb-2">Request Categorization</h3>
                <p className="text-sm text-muted-foreground">
                  {insights.requestCategorization.byType.map((type) => (
                    <span key={type.type}>
                      {type.type}: {type.count} ({type.percentage.toFixed(1)}%)
                    </span>
                  ))}
                </p>
              </div>
            )}
            {insights.requestCategorization && (
              <div>
                <h3 className="font-semibold mb-2">
                  Request Region Distribution
                </h3>
                <p className="text-sm text-muted-foreground">
                  {insights.requestCategorization.byRegion.map((region) => (
                    <span key={region.region}>
                      {region.region}: {region.count} (
                      {region.percentage.toFixed(1)}%)
                    </span>
                  ))}
                </p>
              </div>
            )}
            {insights.requestCategorization && (
              <div>
                <h3 className="font-semibold mb-2">
                  Request Status Distribution
                </h3>
                <p className="text-sm text-muted-foreground">
                  {insights.requestCategorization.byStatus.map((status) => (
                    <span key={status.status}>
                      {status.status}: {status.count} (
                      {status.percentage.toFixed(1)}%)
                    </span>
                  ))}
                </p>
              </div>
            )}
            {insights.actionableInsights && (
              <div>
                <h3 className="font-semibold mb-2">Actionable Insights</h3>
                <ul className="list-disc list-inside space-y-1">
                  {insights.actionableInsights.map((insight, index: number) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Last analyzed: {formatDate(savedAnalytics?.timestamp)}
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
