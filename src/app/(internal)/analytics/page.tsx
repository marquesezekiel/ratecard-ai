"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { trackEvent } from "@/lib/analytics";
import {
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle,
  ArrowUpDown,
  Gift,
  Loader2,
} from "lucide-react";

interface AnalyticsData {
  totalOutcomes: number;
  acceptanceRate: number;
  avgNegotiationDelta: number;
  giftConversionRate: number;
  byStatus: Record<string, number>;
  byPlatform: Array<{ platform: string; count: number; avgRate: number }>;
  overTime: Array<{ date: string; accepted: number; rejected: number }>;
}

// Chart colors with good contrast for accessibility
const CHART_COLORS = {
  accepted: "#10b981", // green-500
  negotiated: "#3b82f6", // blue-500
  rejected: "#ef4444", // red-500
  ghosted: "#f59e0b", // amber-500
  pending: "#6b7280", // gray-500
  gift_accepted: "#8b5cf6", // violet-500
  gift_converted: "#06b6d4", // cyan-500
};

const STATUS_LABELS: Record<string, string> = {
  accepted: "Accepted",
  negotiated: "Negotiated",
  rejected: "Rejected",
  ghosted: "Ghosted",
  pending: "Pending",
  gift_accepted: "Gift Accepted",
  gift_converted: "Gift Converted",
};

const DATE_RANGE_OPTIONS = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "all", label: "All Time" },
];

const PLATFORM_OPTIONS = [
  { value: "all", label: "All Platforms" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "twitter", label: "Twitter/X" },
];

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("30d");
  const [platform, setPlatform] = useState("all");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (dateRange !== "all") params.set("dateRange", dateRange);
      if (platform !== "all") params.set("platform", platform);

      const response = await fetch(`/api/internal/analytics?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch analytics");
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, platform]);

  // Track dashboard view on mount
  useEffect(() => {
    trackEvent("internal_dashboard_view", { admin: true });
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Track filter changes
  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    trackEvent("internal_filter_change", { filter: "dateRange", value });
  };

  const handlePlatformChange = (value: string) => {
    setPlatform(value);
    trackEvent("internal_filter_change", { filter: "platform", value });
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <Card>
          <CardContent className="py-10">
            <p className="text-center text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Transform status data for pie chart
  const statusData = data
    ? Object.entries(data.byStatus)
        .map(([name, value]) => ({
          name: STATUS_LABELS[name] || name,
          value,
          fill: CHART_COLORS[name as keyof typeof CHART_COLORS] || "#6b7280",
        }))
        .filter((item) => item.value > 0)
    : [];

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>

        <div className="flex gap-3" role="group" aria-label="Dashboard filters">
          <Select
            value={dateRange}
            onValueChange={handleDateRangeChange}
            disabled={isLoading}
          >
            <SelectTrigger
              className="w-[150px]"
              aria-label="Select date range"
            >
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={platform}
            onValueChange={handlePlatformChange}
            disabled={isLoading}
          >
            <SelectTrigger
              className="w-[150px]"
              aria-label="Select platform filter"
            >
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              {PLATFORM_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Main Content */}
      {!isLoading && data && (
        <>
          {/* Key Metrics */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            role="region"
            aria-label="Key metrics"
          >
            <MetricCard
              title="Total Outcomes"
              value={data.totalOutcomes}
              icon={<Users className="h-4 w-4" />}
              description="Deal outcomes tracked"
            />
            <MetricCard
              title="Acceptance Rate"
              value={`${Math.round(data.acceptanceRate * 100)}%`}
              icon={<CheckCircle className="h-4 w-4" />}
              description="Of closed deals accepted"
              trend={
                data.acceptanceRate > 0.5
                  ? "positive"
                  : data.acceptanceRate < 0.3
                    ? "negative"
                    : "neutral"
              }
            />
            <MetricCard
              title="Avg Negotiation Delta"
              value={`${data.avgNegotiationDelta > 0 ? "+" : ""}${Math.round(data.avgNegotiationDelta)}%`}
              icon={<ArrowUpDown className="h-4 w-4" />}
              description="Change from initial offer"
              trend={
                data.avgNegotiationDelta > 0
                  ? "positive"
                  : data.avgNegotiationDelta < 0
                    ? "negative"
                    : "neutral"
              }
            />
            <MetricCard
              title="Gift Conversion"
              value={`${Math.round(data.giftConversionRate * 100)}%`}
              icon={<Gift className="h-4 w-4" />}
              description="Gifts converted to paid"
              trend={
                data.giftConversionRate > 0.15
                  ? "positive"
                  : data.giftConversionRate < 0.05
                    ? "negative"
                    : "neutral"
              }
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Outcomes by Status - Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Outcomes by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  aria-label="Pie chart showing distribution of deal outcomes by status"
                  role="img"
                >
                  {statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, percent }) =>
                            `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                          }
                          labelLine={{ stroke: "#888" }}
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No outcome data available
                    </div>
                  )}
                </div>
                {/* Accessible description for screen readers */}
                <p className="sr-only">
                  Distribution of outcomes:{" "}
                  {statusData
                    .map((d) => `${d.name}: ${d.value}`)
                    .join(", ")}
                </p>
              </CardContent>
            </Card>

            {/* Average Rate by Platform - Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Average Rate by Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  aria-label="Bar chart showing average rates across different platforms"
                  role="img"
                >
                  {data.byPlatform.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data.byPlatform}>
                        <XAxis
                          dataKey="platform"
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                          tickLine={{ stroke: "hsl(var(--border))" }}
                        />
                        <YAxis
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                          tickLine={{ stroke: "hsl(var(--border))" }}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                          formatter={(value) => [`$${value}`, "Avg Rate"]}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar
                          dataKey="avgRate"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                          name="Average Rate"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No platform data available
                    </div>
                  )}
                </div>
                <p className="sr-only">
                  Average rates by platform:{" "}
                  {data.byPlatform
                    .map((p) => `${p.platform}: $${p.avgRate}`)
                    .join(", ")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Acceptance Over Time - Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Outcomes Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                aria-label="Line chart showing accepted and rejected deals over time"
                role="img"
              >
                {data.overTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.overTime}>
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        tickLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <YAxis
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        tickLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="accepted"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Accepted"
                        dot={{ fill: "#10b981", strokeWidth: 0 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="rejected"
                        stroke="#ef4444"
                        strokeWidth={2}
                        name="Rejected"
                        dot={{ fill: "#ef4444", strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No time series data available
                  </div>
                )}
              </div>
              <p className="sr-only">
                Outcomes over time:{" "}
                {data.overTime
                  .map(
                    (d) =>
                      `${d.date}: ${d.accepted} accepted, ${d.rejected} rejected`
                  )
                  .join("; ")}
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!isLoading && data && data.totalOutcomes === 0 && (
        <Card>
          <CardContent className="py-10">
            <p className="text-center text-muted-foreground">
              No outcome data available for the selected filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Metric Card Component
 */
function MetricCard({
  title,
  value,
  icon,
  description,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  trend?: "positive" | "negative" | "neutral";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground" aria-hidden="true">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold font-mono">{value}</div>
          {trend && (
            <div
              className={
                trend === "positive"
                  ? "text-green-500"
                  : trend === "negative"
                    ? "text-red-500"
                    : "text-muted-foreground"
              }
              aria-hidden="true"
            >
              {trend === "positive" ? (
                <TrendingUp className="h-4 w-4" />
              ) : trend === "negative" ? (
                <TrendingDown className="h-4 w-4" />
              ) : null}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
