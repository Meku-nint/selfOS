"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Flame, Gauge } from "lucide-react";
import { getAuthToken } from "../../lib/auth";

function normalizeBaseUrl(rawUrl: string | undefined, fallbackUrl: string, protocol: "http" | "https" = "https") {
  const value = (rawUrl || "").trim();
  const fallback = (fallbackUrl || "").trim();
  const resolved = value || fallback;

  if (!resolved) return "";

  const withProtocol = /^https?:\/\//i.test(resolved)
    ? resolved
    : `${protocol}://${resolved}`;

  return withProtocol.replace(/\/+$/, "");
}

const API_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL, "http://localhost:4000", "https");

const monthLabels = [
  { label: "Jan", week: 0 },
  { label: "Feb", week: 4 },
  { label: "Mar", week: 8 },
  { label: "Apr", week: 13 },
  { label: "May", week: 17 },
  { label: "Jun", week: 21 },
  { label: "Jul", week: 26 },
  { label: "Aug", week: 30 },
  { label: "Sep", week: 35 },
  { label: "Oct", week: 39 },
  { label: "Nov", week: 43 },
  { label: "Dec", week: 48 },
];

type DashboardTask = {
  id: string;
  title: string;
  status: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string | null;
};

type ResourceItem = {
  id: string;
  type: string;
  title: string;
  author?: string | null;
  focus?: string | null;
  description?: string | null;
  url?: string | null;
};

type QuoteItem = {
  id: string;
  text: string;
  author?: string | null;
  source?: string | null;
};

type HeatmapEntry = {
  date: string;
  score: number;
};

type ProductivityPoint = {
  label: string;
  value: number;
};

type DashboardData = {
  todayTasks: DashboardTask[];
  quote: QuoteItem | null;
  resources: {
    books: ResourceItem[];
    speakers: ResourceItem[];
  };
  heatmap: HeatmapEntry[];
  weeklyProductivity: ProductivityPoint[];
  monthlyProductivity: ProductivityPoint[];
  analytics: {
    tasksDone: number;
    streakDays: number;
    avgScore: number;
  };
};

const heatColor = (level: number) => {
  switch (level) {
    case 0:
      return "bg-stone-200";
    case 1:
      return "bg-emerald-200";
    case 2:
      return "bg-emerald-400";
    case 3:
      return "bg-emerald-600";
    default:
      return "bg-emerald-800";
  }
};

const formatStatus = (status: string) =>
  status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const priorityWeight = (priority?: string) => {
  switch (priority) {
    case "URGENT":
      return 4;
    case "HIGH":
      return 3;
    case "MEDIUM":
      return 2;
    case "LOW":
      return 1;
    default:
      return 2;
  }
};

const formatTime = (value: string | null) => {
  if (!value) return "No due time";
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

const getHeatLevels = (heatmap: HeatmapEntry[]) => {
  const map = new Map(heatmap.map((item) => [item.date, item.score]));
  const levels: number[] = [];
  const today = new Date();

  for (let i = 363; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    const score = Math.min(1, Math.max(0, map.get(key) || 0));
    levels.push(Math.min(4, Math.floor(score * 5)));
  }

  return levels;
};

export default function DashboardPage() {
  const currentYear = new Date().getFullYear();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (token: string) => {
    const response = await fetch(`${API_URL}/api/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to load dashboard.");
    }

    const data = (await response.json()) as DashboardData;
    setDashboard(data);
  }, []);

  const refreshData = useCallback(async (token: string) => {
    try {
      setLoading(true);
      setError(null);
      await fetchDashboard(token);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [fetchDashboard]);

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      setError("Please log in to see your dashboard.");
      setLoading(false);
      return;
    }

    refreshData(token);
  }, [refreshData]);

  const heatLevels = useMemo(
    () => getHeatLevels(dashboard?.heatmap || []),
    [dashboard?.heatmap]
  );

  const todayTasks = useMemo(() => dashboard?.todayTasks || [], [dashboard?.todayTasks]);
  const sortedTodayTasks = useMemo(() => {
    return [...todayTasks].sort((a, b) => {
      const priorityDiff = priorityWeight(b.priority) - priorityWeight(a.priority);
      if (priorityDiff !== 0) return priorityDiff;

      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [todayTasks]);

  const highPriorityCount = useMemo(
    () => todayTasks.filter((task) => task.priority === "HIGH" || task.priority === "URGENT").length,
    [todayTasks]
  );
  const weeklyProductivity = dashboard?.weeklyProductivity || [];
  const monthlyProductivity = dashboard?.monthlyProductivity || [];
  const resources = dashboard?.resources || { books: [], speakers: [] };
  const analytics = dashboard?.analytics || {
    tasksDone: 0,
    streakDays: 0,
    avgScore: 0
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">Your personal command center</h1>
            <p className="mt-2 max-w-2xl text-sm text-stone-600">
           Run your life with clarity, focus, and consistent progress.            </p>
            {loading && <p className="mt-2 text-sm text-stone-500">Loading dashboard...</p>}
            {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/todo"
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
            >
              Manage tasks
            </Link>
            <Link
              href="/reminders"
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
            >
              Reminders
            </Link>
            <Link
              href="/journal"
              className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800"
            >
              Journal entry
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" strokeWidth={1.75} />
              <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Completed tasks</p>
            </div>
            <p className="mt-2 text-3xl font-semibold text-stone-900">{analytics.tasksDone}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-600" strokeWidth={1.75} />
              <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Focus streak</p>
            </div>
            <p className="mt-2 text-3xl font-semibold text-stone-900">{analytics.streakDays}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-slate-600" strokeWidth={1.75} />
              <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Focus score</p>
            </div>
            <p className="mt-2 text-3xl font-semibold text-stone-900">{analytics.avgScore}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">Today&apos;s tasks</h2>
                <p className="text-sm text-stone-500">Focus on what matters most today.</p>
              </div>
              <span className="rounded-xl bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                {todayTasks.length} active
              </span>
            </div>
            {highPriorityCount > 0 && (
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-rose-700">
                {highPriorityCount} high-priority task{highPriorityCount > 1 ? "s" : ""} need focus
              </p>
            )}

            <div className="mt-5 space-y-2">
              {todayTasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-10 text-center">
                  <p className="text-sm text-stone-500">No tasks scheduled for today.</p>
                  <Link href="/todo" className="mt-3 inline-block text-sm font-medium text-stone-900 hover:underline">
                    Add your first task
                  </Link>
                </div>
              ) : (
                sortedTodayTasks.map((task) => {
                  const isHighPriority = task.priority === "HIGH" || task.priority === "URGENT";
                  const isUrgent = task.priority === "URGENT";

                  return (
                  <div
                    key={task.id}
                    className={`rounded-xl px-4 py-3 ${
                      isUrgent
                        ? "border border-rose-300 bg-rose-50"
                        : isHighPriority
                        ? "border border-amber-300 bg-amber-50"
                        : "border border-stone-200 bg-stone-50"
                    }`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className={`text-sm ${isHighPriority ? "font-semibold text-stone-950" : "font-medium text-stone-900"}`}>
                        {task.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {task.priority && (
                          <span
                            className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                              isUrgent
                                ? "border border-rose-300 bg-rose-100 text-rose-800"
                                : isHighPriority
                                ? "border border-amber-300 bg-amber-100 text-amber-800"
                                : "border border-stone-300 bg-white text-stone-600"
                            }`}
                          >
                            {task.priority}
                          </span>
                        )}
                        <span className="w-fit rounded-full border border-stone-300 bg-white px-2.5 py-1 text-xs text-stone-600">
                          {formatStatus(task.status)}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-stone-500">Due: {formatTime(task.dueDate)}</p>
                  </div>
                )})
              )}
            </div>

            <div className="mt-5 border-t border-stone-200 pt-4">
              <Link href="/todo" className="text-sm font-medium text-stone-700 hover:text-stone-900 hover:underline">
                Open full task list
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900">Resources</h2>
            <p className="text-sm text-stone-500">Books and speakers for focused growth.</p>

            <div className="mt-5 space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Books</p>
                <div className="mt-3 space-y-3">
                  {resources.books.length === 0 ? (
                    <p className="text-sm text-stone-500">No books saved yet.</p>
                  ) : (
                    resources.books.map((book) => (
                      <div key={book.id} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                        <p className="text-sm font-medium text-stone-900">{book.title}</p>
                        <p className="text-xs text-stone-500">{book.author || "Unknown author"}</p>
                        {(book.description || book.focus) && (
                          <p className="mt-1 text-xs text-stone-600">{book.description || book.focus}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Speakers</p>
                <div className="mt-3 space-y-2">
                  {resources.speakers.length === 0 ? (
                    <p className="text-sm text-stone-500">No speakers saved yet.</p>
                  ) : (
                    resources.speakers.map((speaker) => (
                      <div key={speaker.id} className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                        <p className="text-sm font-medium text-stone-900">{speaker.title}</p>
                        <p className="text-xs text-stone-500">{speaker.focus || ""}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-stone-900">Yearly focus heatmap</h2>
              <p className="text-sm text-stone-500">Every day you showed up gets a mark.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <span>Less</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((level) => (
                  <span key={`legend-${level}`} className={`h-3 w-3 rounded-sm ${heatColor(level)}`} />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <div className="min-w-180 grid">
              <div className="mb-2 grid grid-cols-[repeat(52,1fr)] gap-1 text-[11px] text-stone-400">
                {monthLabels.map((month) => (
                  <span
                    key={month.label}
                    className="col-span-4 text-stone-500"
                    style={{ gridColumnStart: month.week + 1 }}
                  >
                    {month.label}
                  </span>
                ))}
              </div>
              <div className="flex items-start gap-3">
                <div className="grid grid-flow-col grid-rows-7 gap-1">
                  {heatLevels.map((level, index) => (
                    <span key={`heat-${index}`} className={`h-3 w-3 rounded-sm ${heatColor(level)}`} />
                  ))}
                </div>
                <div className="text-xs font-semibold text-stone-400">{currentYear}</div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900">Weekly productivity</h2>
            <p className="text-sm text-stone-500">See how focused you were each day.</p>
            <div className="mt-5 space-y-3">
              {weeklyProductivity.length === 0 ? (
                <p className="text-sm text-stone-500">No data yet.</p>
              ) : (
                weeklyProductivity.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-stone-500">
                      <span>{item.label}</span>
                      <span>{item.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-stone-200">
                      <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900">Monthly productivity</h2>
            <p className="text-sm text-stone-500">Your focus performance by week</p>
            <div className="mt-5 space-y-3">
              {monthlyProductivity.length === 0 ? (
                <p className="text-sm text-stone-500">No data yet.</p>
              ) : (
                monthlyProductivity.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-stone-500">
                      <span>{item.label}</span>
                      <span>{item.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-stone-200">
                      <div className="h-2 rounded-full bg-stone-900" style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900">AI coach</h2>
          <p className="text-sm text-stone-500">Ask for focus prompts, journaling ideas, or a reset plan.</p>
          <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm text-stone-700">Try: Give me a 25-minute focus sprint for my top task.</p>
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Ask the AI coach..."
                className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700 focus:border-stone-700 focus:outline-none"
              />
              <button className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-stone-800">
                Send
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
