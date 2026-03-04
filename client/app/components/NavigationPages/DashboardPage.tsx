"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAuthToken } from "../../lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

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
      return "bg-slate-200";
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

  const todayTasks = dashboard?.todayTasks || [];
  const weeklyProductivity = dashboard?.weeklyProductivity || [];
  const monthlyProductivity = dashboard?.monthlyProductivity || [];
  const resources = dashboard?.resources || { books: [], speakers: [] };
  const analytics = dashboard?.analytics || {
    tasksDone: 0,
    streakDays: 0,
    avgScore: 0
  };

  return (
    <div className="relative overflow-hidden bg-linear-to-b from-white to-red-50/30">

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>          
            <h1 className="mt-2 text-3xl font-semibold text-red-950 font-sans mx-2 text-center">
              Your momentum, at a glance
            </h1>
            <p className="mt-2 max-w-2xl text-base text-slate-600">
              Track what matters today, reflect on your patterns, and keep your
              focus clear.
            </p>
            {loading && (
              <p className="mt-2 text-sm text-slate-500">
                Loading dashboard...
              </p>
            )}
            {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
          </div>
          <div className="flex gap-1 justify-between sm:justify-start">
            <Link
              href="/todo"
              className=" border border-red-900 rounded bg-white px-2 py-2 text-sm font-medium text-black shadow-sm transition hover:border-slate-400 hover:text-slate-900"
            >
              Add task
            </Link>
            <Link
              href="/reminders"
              className="rounded border border-red-900 bg-white px-2 py-2 text-sm font-medium text-black shadow-sm transition hover:border-slate-400 hover:text-slate-900"
            >
              Add reminder
            </Link>
            <Link
              href="/journal"
              className="rounded bg-red-900 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-red-900/20 transition hover:bg-red-800"
            >
              Add journal entry
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[2.1fr_1fr]">
         <section className="rounded border border-blue-600/80 bg-white/80 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-all duration-300">
  {/* Header with refined styling */}
  <div className="flex items-center justify-between mb-6">
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-rose-600/60 animate-pulse"></div>
        <h2 className="text-lg font-light tracking-tight text-gray-950">
          Today&apos;s tasks
        </h2>
      </div>
      <p className="text-sm text-slate-500 font-light pl-4">
        Keep today light, but intentional.
      </p>
    </div>
    
    {/* Elegant counter */}
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-400 font-light">active</span>
      <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-red-50 text-red-600 font-medium text-sm">
        {todayTasks.length}
      </span>
    </div>
  </div>

  {/* Task list with refined styling */}
  <div className="space-y-2">
    {todayTasks.length === 0 ? (
      <div className="group relative py-12 px-4 text-center">
        <div className="absolute inset-0 bg-linear-to-br from-red-50/50 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative">
          <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <Link href="/todo" className="text-sm text-slate-500 font-light mb-2 inline-block hover:text-indigo-600 transition-colors">
            No tasks scheduled for today
          </Link>
          <p className="text-xs text-slate-400 font-light">Add a task to get started</p>
        </div>
      </div>
    ) : (
      todayTasks.map((task, index) => (
        <div
          key={task.id}
          className="group flex items-center justify-between p-4 rounded-xl bg-slate-50/50 hover:bg-white border border-slate-200/50 hover:border-indigo-200 transition-all duration-200"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {/* Task content */}
          <div className="flex items-start gap-3 flex-1">
            {/* Custom checkbox */}
            <div className="relative mt-0.5">
              <input type="checkbox" className="peer sr-only" />
              <div className="h-5 w-5 rounded-md border-2 border-slate-300 peer-checked:border-indigo-600 peer-checked:bg-indigo-600 transition-all cursor-pointer hover:border-indigo-400"></div>
              <svg className="absolute top-0.5 left-0.5 h-4 w-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div>
              <p className="text-sm font-medium text-slate-900 group-hover:text-indigo-700 transition-colors">
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-slate-500 font-light">
                  {formatTime(task.dueDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Status and actions */}
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-600">
              {formatStatus(task.status)}
            </span>
            
            {/* Quick actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))
    )}
  </div>

  {/* Add task button - only shows when tasks exist */}
  {todayTasks.length > 0 && (
    <div className="mt-4 pt-2 border-t border-slate-100">
      <button className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all group">
        <svg className="h-4 w-4 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
        <span className="font-light">Add new task</span>
      </button>
    </div>
  )}
</section>

        
        </div>

        <section className="mt-10 rounded border border-blue-600/80 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl text-center text-gray-900">
                Yearly focus heatmap
              </h2>
              <p className="text-sm text-slate-500">
                Every day you showed up gets a mark.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Less</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((level) => (
                  <span
                    key={`legend-${level}`}
                    className={`h-3 w-3 rounded-sm ${heatColor(level)}`}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <div className="min-w-180 grid ">
              <div className="mb-2 grid grid-cols-[repeat(52,1fr)] gap-1 text-[11px] text-slate-400">
                {monthLabels.map((month) => (
                  <span
                    key={month.label}
                    className="col-span-4 text-blue-600"
                    style={{ gridColumnStart: month.week + 1 }}
                  >
                    {month.label}
                  </span>
                ))}
              </div>
              <div className="flex items-start gap-3">
                <div className="grid grid-flow-col grid-rows-7 gap-1">
                  {heatLevels.map((level, index) => (
                    <span
                      key={`heat-${index}`}
                      className={`h-3 w-3 rounded-sm ${heatColor(level)}`}
                    />
                  ))}
                </div>
                <div className="text-xs font-semibold text-slate-400">
                  {currentYear}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <section className="rounded border border-blue-600/80 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Weekly productivity
            </h2>
            <p className="text-sm text-slate-500">Daily focus score.</p>
            <div className="mt-6 space-y-3">
              {weeklyProductivity.length === 0 ? (
                <p className="text-sm text-slate-500">No data yet.</p>
              ) : (
                weeklyProductivity.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{item.label}</span>
                      <span>{item.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded border border-blue-600/80 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Monthly productivity
            </h2>
            <p className="text-sm text-slate-500">Weekly focus score.</p>
            <div className="mt-6 space-y-4">
              {monthlyProductivity.length === 0 ? (
                <p className="text-sm text-slate-500">No data yet.</p>
              ) : (
                monthlyProductivity.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{item.label}</span>
                      <span>{item.value}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100">
                      <div
                        className="h-3 rounded-full bg-slate-900"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded border border-blue-600/80 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Analytics snapshot
            </h2>
            <p className="text-sm text-slate-500">Filled tasks and streaks.</p>
            <div className="mt-6 grid gap-4">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">
                  Tasks done
                </p>
                <p className="mt-2 text-3xl font-semibold text-emerald-800">
                  {analytics.tasksDone}
                </p>
                <p className="text-xs text-emerald-700">
                  Avg score {analytics.avgScore}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Streak days
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {analytics.streakDays}
                </p>
                <p className="text-xs text-slate-500">Current streak</p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              AI coach
            </h2>
            <p className="text-sm text-slate-500">
              Ask for focus, journaling prompts, or a reset plan.
            </p>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-700">
                Try: Give me a 25-minute focus sprint for my top task.
              </p>
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Ask the AI coach..."
                  className="w-full rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                />
                <button className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600">
                  Send
                </button>
              </div>
            </div>
          </section>

          <section className="rounded border border-blue-600  p-6">
            <h2 className="text-lg font-semibold text-slate-900">Resources</h2>
            <p className="text-sm text-slate-500">
              Motivational speakers and books.


            </p>
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Books
                </p>
                <div className="mt-3 space-y-3">
                  {resources.books.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No books saved yet.
                    </p>
                  ) : (
                    resources.books.map((book) => (
                      <div key={book.id} className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-sm font-semibold text-slate-900">
                          {book.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {book.author || "Unknown author"}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          {book.description || book.focus || ""}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Speakers
                </p>
                <div className="mt-3 space-y-2">
                  {resources.speakers.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No speakers saved yet.
                    </p>
                  ) : (
                    resources.speakers.map((speaker) => (
                      <div
                        key={speaker.id}
                        className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2"
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {speaker.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {speaker.focus || ""}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}