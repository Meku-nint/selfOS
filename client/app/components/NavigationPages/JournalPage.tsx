"use client";

import { useEffect, useMemo, useState } from "react";
import { getAuthToken } from "../../lib/auth";
import { 
  BookOpen, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X,
  Calendar,
  Tag,
  Smile,
  ChevronLeft,
  ChevronRight,
  Search
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const JOURNAL_API = `${API_URL}/api/journal`;

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

const ENTRIES_PER_PAGE = 5;

// Mood color mapping
const moodColors = {
  1: "bg-red-100 text-red-700 border-red-200",
  2: "bg-orange-100 text-orange-700 border-orange-200",
  3: "bg-yellow-100 text-yellow-700 border-yellow-200",
  4: "bg-lime-100 text-lime-700 border-lime-200",
  5: "bg-green-100 text-green-700 border-green-200",
};

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
  const [currentPage, setCurrentPage] = useState(1);
  const [filterTitle, setFilterTitle] = useState("");
  const [filterMood, setFilterMood] = useState("ALL");
  const [filterDate, setFilterDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        throw new Error("Please log in to view your journal.");
      }

      const response = await fetch(JOURNAL_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch entries");
      const data = await response.json();
      setEntries(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Please log in to add journal entries.");
      }

      const response = await fetch(JOURNAL_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title || null,
          content,
          mood: mood ? parseInt(mood) : null,
          tags: parseTags(tags),
        }),
      });

      if (!response.ok) throw new Error("Failed to create entry");
      const newEntry = await response.json();
      setEntries([newEntry, ...entries]);
      setTitle("");
      setContent("");
      setMood("");
      setTags("");
      setMessage("Entry created successfully!");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const startEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setEditTitle(entry.title || "");
    setEditContent(entry.content);
    setEditMood(entry.mood?.toString() || "");
    setEditTags(entry.tags.join(", "));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
    setEditMood("");
    setEditTags("");
  };

  const handleUpdate = async (id: string) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Please log in to update journal entries.");
      }

      const response = await fetch(`${JOURNAL_API}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editTitle || null,
          content: editContent,
          mood: editMood ? parseInt(editMood) : null,
          tags: parseTags(editTags),
        }),
      });

      if (!response.ok) throw new Error("Failed to update entry");
      const updatedEntry = await response.json();
      setEntries(entries.map((e) => (e.id === id ? updatedEntry : e)));
      cancelEdit();
      setMessage("Entry updated successfully!");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Please log in to delete journal entries.");
      }

      const response = await fetch(`${JOURNAL_API}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to delete entry");
      setEntries(entries.filter((e) => e.id !== id));
      setMessage("Entry deleted successfully!");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const titleMatch = entry.title
        ?.toLowerCase()
        .includes(filterTitle.toLowerCase()) || false;
      const moodMatch =
        filterMood === "ALL" || entry.mood?.toString() === filterMood;
      const dateMatch =
        !filterDate ||
        new Date(entry.createdAt).toDateString() ===
          new Date(filterDate).toDateString();
      return titleMatch && moodMatch && dateMatch;
    });
  }, [entries, filterTitle, filterMood, filterDate]);

  const totalPages = Math.ceil(filteredEntries.length / ENTRIES_PER_PAGE);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * ENTRIES_PER_PAGE,
    currentPage * ENTRIES_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Header Section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-100 p-3">
              <BookOpen className="h-8 w-8 text-amber-700" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-800 to-orange-800 bg-clip-text text-transparent">
                Journal
              </h1>
              <p className="text-slate-600">
                Write daily reflections and track your mood journey
              </p>
            </div>
          </div>
          
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              Loading entries...
            </div>
          )}
          
          {error && (
            <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600 border border-rose-200">
              {error}
            </div>
          )}
          
          {message && (
            <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-600 border border-emerald-200">
              {message}
            </div>
          )}
        </div>

        {/* New Entry Form */}
        <form
          onSubmit={handleCreate}
          className="mt-8 rounded-2xl border border-amber-200 bg-white/80 backdrop-blur-sm p-6 shadow-lg shadow-amber-100/50"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="rounded-full bg-amber-100 p-2">
              <Plus className="h-4 w-4 text-amber-700" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">New Reflection</h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Title
              </label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all"
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
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all"
                placeholder="Write your thoughts, feelings, and reflections..."
              />
            </div>
            
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Mood (1-5)
              </label>
              <div className="relative mt-2">
                <Smile className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={mood}
                  onChange={(event) => setMood(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-3 text-sm text-slate-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all"
                  placeholder="3"
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Tags
              </label>
              <div className="relative mt-2">
                <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-3 text-sm text-slate-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all"
                  placeholder="focus, gratitude, goals"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:from-amber-700 hover:to-orange-700 hover:shadow-lg hover:shadow-amber-200/50 active:scale-95"
            >
              Save entry
            </button>
          </div>
        </form>

        {/* Filters Section */}
        <div className="mt-6 rounded-xl border border-amber-200 bg-white/60 backdrop-blur-sm p-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold text-slate-700">Filters</span>
            </div>
            <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${showFilters ? 'rotate-90' : ''}`} />
          </button>
          
          {showFilters && (
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Filter by title
                </label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={filterTitle}
                    onChange={(event) => setFilterTitle(event.target.value)}
                    className="w-full rounded-lg border border-amber-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                    placeholder="Search by title..."
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Filter by mood
                </label>
                <select
                  value={filterMood}
                  onChange={(event) => setFilterMood(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                >
                  <option value="ALL">All moods</option>
                  <option value="1">😢 1 - Very Low</option>
                  <option value="2">😕 2 - Low</option>
                  <option value="3">😐 3 - Neutral</option>
                  <option value="4">🙂 4 - Good</option>
                  <option value="5">😊 5 - Excellent</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Filter by date
                </label>
                <div className="relative mt-2">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(event) => setFilterDate(event.target.value)}
                    className="w-full rounded-lg border border-amber-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Entries List */}
        <div className="mt-8 space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-white/50 px-6 py-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-amber-300" />
              <p className="mt-4 text-sm text-slate-500">
                No journal entries match your filters.
              </p>
            </div>
          ) : (
            paginatedEntries.map((entry) => (
              <div
                key={entry.id}
                className="group relative overflow-hidden rounded-2xl border border-amber-200 bg-white/80 backdrop-blur-sm p-6 transition-all hover:shadow-lg hover:shadow-amber-100/50"
              >
                {/* Decorative gradient line */}
                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-400 to-orange-400" />
                
                {editingId === entry.id ? (
                  <div className="space-y-4 pl-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Title
                      </label>
                      <input
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
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
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                      />
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Mood (1-5)
                        </label>
                        <div className="relative">
                          <Smile className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type="number"
                            min={1}
                            max={5}
                            value={editMood}
                            onChange={(event) => setEditMood(event.target.value)}
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm text-slate-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Tags
                        </label>
                        <div className="relative">
                          <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            value={editTags}
                            onChange={(event) => setEditTags(event.target.value)}
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm text-slate-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleUpdate(entry.id)}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-emerald-600 hover:to-green-600 hover:shadow-lg hover:shadow-emerald-200/50 active:scale-95"
                      >
                        <Save className="h-4 w-4" />
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 pl-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {entry.title || "Untitled entry"}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                        {entry.content}
                      </p>
                      
                      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                        <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">
                          <Calendar className="h-3 w-3" />
                          {new Date(entry.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                        
                        {entry.mood && (
                          <span className={`flex items-center gap-1 rounded-full px-3 py-1.5 border ${
                            moodColors[entry.mood as keyof typeof moodColors] || 
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            <Smile className="h-3 w-3" />
                            Mood {entry.mood}
                          </span>
                        )}
                        
                        {entry.tags.map((tag) => (
                          <span
                            key={`${entry.id}-${tag}`}
                            className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-amber-700 border border-amber-200"
                          >
                            <Tag className="h-3 w-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 md:self-start">
                      <button
                        type="button"
                        onClick={() => startEdit(entry)}
                        className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:border-amber-400 hover:bg-amber-50"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        className="flex items-center gap-1 rounded-xl border border-rose-200 bg-white/70 px-4 py-2 text-sm font-semibold text-rose-600 transition-all hover:border-rose-400 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredEntries.length > ENTRIES_PER_PAGE && (
          <div className="mt-8 flex items-center justify-between border-t border-amber-200 pt-6">
            
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:border-amber-400 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`h-8 w-8 rounded-lg text-sm font-semibold transition-all ${
                      currentPage === i + 1
                        ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white'
                        : 'text-slate-600 hover:bg-amber-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:border-amber-400 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}