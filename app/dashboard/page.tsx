"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Users, BookOpen, CheckCircle, TrendingUp, Filter } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Tooltip,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { dashboardApi } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

type RangeKey = "daily" | "week" | "month" | "year"

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
]

export default function DashboardOverview() {
  const [range, setRange] = useState<RangeKey>("daily")
  const [filterOpen, setFilterOpen] = useState(false)

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["dashboard-overview", range],
    queryFn: () => dashboardApi.getOverview(range),
  })

  const rangeLabel = useMemo(
    () => RANGE_OPTIONS.find((x) => x.key === range)?.label ?? "Daily",
    [range]
  )

  if (isLoading) return <DashboardSkeleton />
  if (isError) {
    return (
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Unable to load dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>There was a problem fetching the latest dashboard data.</p>
          <p className="text-xs">{error instanceof Error ? error.message : "Unknown error"}</p>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    )
  }

  const overview = data?.data

  if (!overview) {
    return (
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>No dashboard data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>The dashboard API returned no data.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Reload
          </Button>
        </CardContent>
      </Card>
    )
  }

  const stats = [
    { label: "Total User", value: overview.cards?.totalUsers ?? 0, icon: Users, color: "bg-blue-100 text-blue-600" },
    {
      label: "Total Quizzes",
      value: overview.cards?.totalQuizzes ?? 0,
      icon: BookOpen,
      color: "bg-blue-200 text-blue-700",
    },
    {
      label: "Active Subscription",
      value: overview.cards?.activeSubscriptions ?? 0,
      icon: CheckCircle,
      color: "bg-purple-100 text-purple-600",
    },
    {
      label: "Total Revenue",
      value: `$${overview.cards?.totalRevenueEstimateMonthly ?? 0}`,
      icon: TrendingUp,
      color: "bg-orange-100 text-orange-600",
    },
  ]

  const quizAttendance = overview.quizAttendance?.byWeekday ?? []
  const surveySubscription = overview.surveySubscription
  const userJoiningOverview = overview.userJoiningOverview?.byMonth ?? []

  const pieData = [
    { name: "Free", value: surveySubscription?.freeUsers ?? 0, color: "hsl(var(--chart-2))" },
    { name: "Premium", value: surveySubscription?.premiumUsers ?? 0, color: "hsl(var(--chart-1))" },
  ]

  const applyRange = (next: RangeKey) => {
    setRange(next)       // ✅ apply filter
    setFilterOpen(false) // ✅ close popup
  }

  return (
    <div className="space-y-8">
      {/* Header + Filter Button */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back to your admin panel {isFetching ? "(updating...)" : ""}
          </p>
        </div>

        {/* ✅ Filter button + dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={() => setFilterOpen((v) => !v)}
          >
            <Filter className="w-4 h-4" />
            Filter: {rangeLabel}
          </Button>

          {filterOpen && (
            <>
              {/* click outside to close */}
              <button
                aria-label="Close filter"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setFilterOpen(false)}
              />

              {/* dropdown box */}
              <div className="absolute right-0 mt-2 z-50 w-[180px] rounded-xl border bg-muted/30 p-3 shadow">
                <div className="space-y-2">
                  {RANGE_OPTIONS.map((opt) => {
                    const active = range === opt.key
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => applyRange(opt.key)}
                        className={[
                          "w-full rounded-lg px-4 py-3 text-left",
                          "flex items-center justify-between",
                          "border transition",
                          active
                            ? "bg-[#0A408A] text-white border-white/20"
                            : "bg-[#0A408A] text-white/90 border-white/20 opacity-90 hover:opacity-100",
                        ].join(" ")}
                      >
                        <span className="text-sm font-medium">{opt.label}</span>
                        <span
                          className={[
                            "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                            active ? "border-white" : "border-white/80",
                          ].join(" ")}
                        >
                          {active ? <span className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Quiz Attendance</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quizAttendance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40}>
                  {quizAttendance.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 4 ? "hsl(var(--primary))" : index % 2 === 0 ? "#FFD66B" : "#A5C2FF"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Survey Subscription</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip />
                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="flex gap-4 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-2))]" />
                <span>Free: {surveySubscription?.freeUsers ?? 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-1))]" />
                <span>Premium: {surveySubscription?.premiumUsers ?? 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Joining Overview</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={userJoiningOverview}>
              <defs>
                <linearGradient id="colorJoined" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorJoined)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <Skeleton className="col-span-2 h-[350px] w-full" />
        <Skeleton className="h-[350px] w-full" />
      </div>
      <Skeleton className="h-[450px] w-full" />
    </div>
  )
}
