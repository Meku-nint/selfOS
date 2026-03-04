"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

type TaskOption = {
  id: string;
  title: string;
};

type Reminder = {
  id: string;
  title: string;
  message: string;
  scheduledAt: string;
  type: "NOTIFICATION" | "EMAIL" | "BOTH";
  isSent: boolean;
  task?: {
    id: string;
    title: string;
    dueDate: string | null;
  };
};

const toInputDateTime = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const ITEMS_PER_PAGE = 5;

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [taskId, setTaskId] = useState("");
  const [title, setTitle] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [type, setType] = useState<Reminder["type"]>("NOTIFICATION");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editScheduledAt, setEditScheduledAt] = useState("");
  const [editType, setEditType] = useState<Reminder["type"]>("NOTIFICATION");
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(reminders.length / ITEMS_PER_PAGE));

  const paginatedReminders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return reminders.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, reminders]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const fetchReminders = useCallback(async (token: string) => {
    const response = await fetch(`${API_URL}/api/reminders`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error("Failed to load reminders.");
    }

    const data = (await response.json()) as Reminder[];
    setReminders(data);
  }, []);

  const fetchTasks = useCallback(async (token: string) => {
    const response = await fetch(`${API_URL}/api/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as TaskOption[];
    setTasks(data.map((task) => ({ id: task.id, title: task.title })));
  }, []);

  const refreshData = useCallback(async (token: string) => {
    await Promise.all([fetchReminders(token), fetchTasks(token)]);
  }, [fetchReminders, fetchTasks]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setError("Please log in to manage reminders.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        await refreshData(token);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [refreshData]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) throw new Error("Please log in to add reminders.");

      const response = await fetch(`${API_URL}/api/reminders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          taskId,
          title,
          message: reminderMessage,
          scheduledAt: new Date(scheduledAt).toISOString(),
          type
        })
      });

      if (!response.ok) {
        throw new Error("Failed to add reminder.");
      }

      setTaskId("");
      setTitle("");
      setReminderMessage("");
      setScheduledAt("");
      setType("NOTIFICATION");
      setMessage("Reminder added.");
      setCurrentPage(1);
      await refreshData(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unknown error");
    }
  };

  const startEdit = (reminder: Reminder) => {
    setEditingId(reminder.id);
    setEditTitle(reminder.title);
    setEditMessage(reminder.message);
    setEditScheduledAt(toInputDateTime(reminder.scheduledAt));
    setEditType(reminder.type);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditMessage("");
    setEditScheduledAt("");
    setEditType("NOTIFICATION");
  };

  const handleUpdate = async (reminderId: string) => {
    setMessage(null);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) throw new Error("Please log in to update reminders.");

      const response = await fetch(`${API_URL}/api/reminders/${reminderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editTitle,
          message: editMessage,
          scheduledAt: new Date(editScheduledAt).toISOString(),
          type: editType
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update reminder.");
      }

      setMessage("Reminder updated.");
      cancelEdit();
      await refreshData(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unknown error");
    }
  };

  const handleDelete = async (reminderId: string) => {
    setMessage(null);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) throw new Error("Please log in to delete reminders.");

      const response = await fetch(`${API_URL}/api/reminders/${reminderId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to delete reminder.");
      }

      setMessage("Reminder deleted.");
      setCurrentPage(1);
      await refreshData(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unknown error");
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Reminders</h1>
          <p className="text-stone-600">Schedule focused reminders linked to your tasks.</p>
          {loading && <p className="text-sm text-stone-500">Loading reminders...</p>}
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <form
          onSubmit={handleCreate}
          className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-stone-900">Add reminder</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Task
              </label>
              <select
                value={taskId}
                onChange={(event) => setTaskId(event.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-stone-500 focus:outline-none"
              >
                <option value="">Select a task</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Title
              </label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-stone-500 focus:outline-none"
                placeholder="Check in on the task"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Message
              </label>
              <input
                value={reminderMessage}
                onChange={(event) => setReminderMessage(event.target.value)}
                className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-stone-500 focus:outline-none"
                placeholder="Optional message"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Schedule time
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-stone-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Type
              </label>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as Reminder["type"])}
                className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-stone-500 focus:outline-none"
              >
                <option value="NOTIFICATION">Notification</option>
                <option value="EMAIL">Email</option>
                <option value="BOTH">Both</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 rounded-lg bg-stone-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            Add reminder
          </button>
        </form>

        <div className="mt-8 grid gap-4">
          {reminders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-6 text-center text-sm text-stone-500">
              No reminders yet. Schedule one above.
            </div>
          ) : (
            paginatedReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
              >
                {editingId === reminder.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                        Title
                      </label>
                      <input
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                        className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-stone-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                        Message
                      </label>
                      <input
                        value={editMessage}
                        onChange={(event) => setEditMessage(event.target.value)}
                        className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-stone-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                          Schedule time
                        </label>
                        <input
                          type="datetime-local"
                          value={editScheduledAt}
                          onChange={(event) => setEditScheduledAt(event.target.value)}
                          className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-stone-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                          Type
                        </label>
                        <select
                          value={editType}
                          onChange={(event) => setEditType(event.target.value as Reminder["type"])}
                          className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-stone-500 focus:outline-none"
                        >
                          <option value="NOTIFICATION">Notification</option>
                          <option value="EMAIL">Email</option>
                          <option value="BOTH">Both</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleUpdate(reminder.id)}
                        className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-stone-900">
                        {reminder.title}
                      </h3>
                      <p className="mt-1 text-sm text-stone-600">
                        {reminder.message}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-600">
                        <span className="rounded-full border border-stone-200 bg-stone-100 px-3 py-1">
                          {reminder.type.toLowerCase()}
                        </span>
                        <span className="rounded-full border border-stone-200 bg-stone-100 px-3 py-1">
                          {new Date(reminder.scheduledAt).toLocaleString()}
                        </span>
                        {reminder.task && (
                          <span className="rounded-full border border-stone-200 bg-stone-100 px-3 py-1">
                            Task: {reminder.task.title}
                          </span>
                        )}
                        <span
                          className={`rounded-full border px-3 py-1 ${
                            reminder.isSent
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                          }`}
                        >
                          {reminder.isSent ? "Sent" : "Pending"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(reminder)}
                        className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(reminder.id)}
                        className="rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {reminders.length > ITEMS_PER_PAGE && (
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-stone-500">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
