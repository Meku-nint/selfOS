"use client";

import { useEffect, useState } from "react";
import { getAuthToken } from "../../lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type JournalEntry = {
  id: string; 
  title?: string | null;
  content: string;
  mood?: number | null;
  tags: string[];
  createdAt: string;
};

const parseTags = (value: string) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [tags, setTags] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editMood, setEditMood] = useState("");
  const [editTags, setEditTags] = useState("");

  const fetchEntries = async (token: string) => {
    const response = await fetch(`${API_URL}/api/journal`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error("Failed to load journal entries.");
    }

    const data = (await response.json()) as JournalEntry[];
    setEntries(data);
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setError("Please log in to view your journal.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchEntries(token);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) throw new Error("Please log in to add journal entries.");

      const response = await fetch(`${API_URL}/api/journal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title || null,
          content,
          mood: mood ? Number(mood) : null,
          tags: parseTags(tags)
        })
      });

      if (!response.ok) {
        throw new Error("Failed to add journal entry.");
      }

      setTitle("");
      setContent("");
      setMood("");
      setTags("");
      setMessage("Entry saved.");
      await fetchEntries(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unknown error");
    }
  };

  const startEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setEditTitle(entry.title || "");
    setEditContent(entry.content);
    setEditMood(entry.mood ? String(entry.mood) : "");
    setEditTags(entry.tags.join(", "));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
    setEditMood("");
    setEditTags("");
  };

  const handleUpdate = async (entryId: string) => {
    setMessage(null);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) throw new Error("Please log in to update journal entries.");

      const response = await fetch(`${API_URL}/api/journal/${entryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editTitle || null,
          content: editContent,
          mood: editMood ? Number(editMood) : null,
          tags: parseTags(editTags)
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update journal entry.");
      }

      setMessage("Entry updated.");
      cancelEdit();
      await fetchEntries(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unknown error");
    }
  };

  const handleDelete = async (entryId: string) => {
    setMessage(null);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) throw new Error("Please log in to delete journal entries.");

      const response = await fetch(`${API_URL}/api/journal/${entryId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error("Failed to delete journal entry.");
      }

      setMessage("Entry deleted.");
      await fetchEntries(token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unknown error");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900">Journal</h1>
        <p className="text-slate-600">
          Write daily reflections and track your mood.
        </p>
        {loading && <p className="text-sm text-slate-500">Loading entries...</p>}
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {message && <p className="text-sm text-emerald-600">{message}</p>}
      </div>

      <form
        onSubmit={handleCreate}
        className="mt-8 rounded border border-indigo-200 bg-white p-6"
      >
        <h2 className="text-lg font-semibold text-slate-900">New entry</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Title
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              placeholder="Optional title"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Entry
            </label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              required
              rows={4}
              className="mt-2 w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              placeholder="Write a short reflection"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Mood (1-5)
            </label>
            <input
              type="number"
              min={1}
              max={5}
              value={mood}
              onChange={(event) => setMood(event.target.value)}
              className="mt-2 w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              placeholder="3"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Tags
            </label>
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              className="mt-2 w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              placeholder="focus, gratitude"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Save entry
          </button>
        </div>
      </form>

      <div className="mt-8 grid gap-4">
        {entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            No journal entries yet.
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-3xl border border-slate-200 bg-white p-5"
            >
              {editingId === entry.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Title
                    </label>
                    <input
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Entry
                    </label>
                    <textarea
                      value={editContent}
                      onChange={(event) => setEditContent(event.target.value)}
                      rows={4}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Mood (1-5)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={editMood}
                        onChange={(event) => setEditMood(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Tags
                      </label>
                      <input
                        value={editTags}
                        onChange={(event) => setEditTags(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleUpdate(entry.id)}
                      className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {entry.title || "Untitled entry"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {entry.content}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                      {entry.mood && (
                        <span className="rounded-full bg-slate-100 px-3 py-1">
                          Mood {entry.mood}
                        </span>
                      )}
                      {entry.tags.map((tag) => (
                        <span
                          key={`${entry.id}-${tag}`}
                          className="rounded-full bg-slate-100 px-3 py-1"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(entry)}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:border-rose-300"
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
    </div>
  );
}
