"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Flag,
  Plus,
  Trash2,
} from "lucide-react";

type GoalType = "SHORT_TERM" | "LONG_TERM";

type Milestone = {
  id: string;
  title: string;
  completed: boolean;
};

type Goal = {
  id: string;
  title: string;
  description: string;
  type: GoalType;
  targetDate: string;
  progress: number;
  completed: boolean;
  milestones: Milestone[];
  createdAt: string;
};

const STORAGE_KEY = "selfos.goals.v1";

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as Goal[];
    } catch {
      return [];
    }
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<GoalType>("SHORT_TERM");
  const [targetDate, setTargetDate] = useState("");
  const [milestoneInput, setMilestoneInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  }, [goals]);

  const stats = useMemo(() => {
    const total = goals.length;
    const completed = goals.filter((goal) => goal.completed).length;
    const active = total - completed;
    const avgProgress =
      total > 0
        ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / total)
        : 0;
    return { total, completed, active, avgProgress };
  }, [goals]);

  const createGoal = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !targetDate) return;

    const milestones: Milestone[] = milestoneInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item, index) => ({
        id: `ms-${Date.now()}-${index}`,
        title: item,
        completed: false,
      }));

    const goal: Goal = {
      id: `goal-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      type,
      targetDate,
      progress: 0,
      completed: false,
      milestones,
      createdAt: new Date().toISOString(),
    };

    setGoals((prev) => [goal, ...prev]);
    setTitle("");
    setDescription("");
    setType("SHORT_TERM");
    setTargetDate("");
    setMilestoneInput("");
    setMessage("Goal created successfully.");
    setTimeout(() => setMessage(null), 2000);
  };

  const updateProgress = (goalId: string, delta: number) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== goalId) return goal;
        const next = Math.min(100, Math.max(0, goal.progress + delta));
        return {
          ...goal,
          progress: next,
          completed: next === 100,
        };
      })
    );
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== goalId) return goal;

        const milestones = goal.milestones.map((milestone) =>
          milestone.id === milestoneId
            ? { ...milestone, completed: !milestone.completed }
            : milestone
        );

        const completedCount = milestones.filter((m) => m.completed).length;
        const progress =
          milestones.length > 0
            ? Math.round((completedCount / milestones.length) * 100)
            : goal.progress;

        return {
          ...goal,
          milestones,
          progress,
          completed: progress === 100,
        };
      })
    );
  };

  const removeGoal = (goalId: string) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 via-white to-teal-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">Goal Planner</h1>
            <p className="mt-1 text-slate-600">
              Build short-term and long-term goals with practical milestones.
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 md:w-auto">
            <StatCard label="Total" value={stats.total} />
            <StatCard label="Active" value={stats.active} />
            <StatCard label="Done" value={stats.completed} />
            <StatCard label="Avg Progress" value={`${stats.avgProgress}%`} />
          </div>
        </div>

        {message && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <form
          onSubmit={createGoal}
          className="mb-8 rounded-2xl border border-emerald-100 bg-white/80 p-6 shadow-lg shadow-emerald-100/50"
        >
          <div className="mb-5 flex items-center gap-2">
            <Plus className="h-4 w-4 text-emerald-700" />
            <h2 className="text-lg font-semibold text-slate-900">Create Goal</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
              placeholder="Goal title"
            />

            <input
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
              required
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
            />

            <select
              value={type}
              onChange={(event) => setType(event.target.value as GoalType)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
            >
              <option value="SHORT_TERM">Short-term</option>
              <option value="LONG_TERM">Long-term</option>
            </select>

            <input
              value={milestoneInput}
              onChange={(event) => setMilestoneInput(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
              placeholder="Milestones (comma separated)"
            />

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
              placeholder="Describe this goal"
            />
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-emerald-700 hover:to-teal-700"
            >
              Add Goal
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {goals.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-white/50 px-6 py-10 text-center text-slate-500">
              No goals yet. Create your first one above.
            </div>
          ) : (
            goals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-2xl border border-emerald-100 bg-white/80 p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">{goal.title}</h3>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                        {goal.type === "SHORT_TERM" ? "Short-term" : "Long-term"}
                      </span>
                      {goal.completed && (
                        <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs text-teal-700">
                          Completed
                        </span>
                      )}
                    </div>

                    {goal.description && (
                      <p className="mt-1 text-sm text-slate-600">{goal.description}</p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5">
                        <Calendar className="h-3 w-3" />
                        Target {new Date(goal.targetDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5">
                        <Flag className="h-3 w-3" />
                        {goal.milestones.length} milestones
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                        <span>Progress</span>
                        <span>{goal.progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full bg-linear-to-r from-emerald-500 to-teal-500 transition-all"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                    </div>

                    {goal.milestones.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {goal.milestones.map((milestone) => (
                          <label
                            key={milestone.id}
                            className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={milestone.completed}
                              onChange={() => toggleMilestone(goal.id, milestone.id)}
                            />
                            <span className={milestone.completed ? "line-through text-slate-400" : ""}>
                              {milestone.title}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 md:ml-4 md:flex-col">
                    <button
                      type="button"
                      onClick={() => updateProgress(goal.id, 10)}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
                    >
                      +10%
                    </button>
                    <button
                      type="button"
                      onClick={() => updateProgress(goal.id, -10)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
                    >
                      -10%
                    </button>
                    <button
                      type="button"
                      onClick={() => updateProgress(goal.id, goal.progress === 100 ? -100 : 100)}
                      className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700"
                    >
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {goal.progress === 100 ? "Reopen" : "Complete"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeGoal(goal.id)}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-emerald-100 bg-white/70 px-3 py-2 text-center">
      <p className="text-lg font-bold text-emerald-700">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}
