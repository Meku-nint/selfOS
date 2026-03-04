"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import { getAuthToken } from "../../lib/auth";
import { 
  Calendar,
  Flag,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Target,
  Zap,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Sparkles
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Task = {
  id: string;
  title: string;
  description?: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  dueDate: string | null;
  createdAt: string;
};

type TaskStats = {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  cancelled: number;
  urgentCount: number;
  completionRate: number;
  weeklyCompleted: number;
};

const priorityColors = {
  LOW: "bg-blue-100 text-blue-700 border-blue-200",
  MEDIUM: "bg-green-100 text-green-700 border-green-200",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200",
  URGENT: "bg-red-100 text-red-700 border-red-200"
};

const priorityIcons = {
  LOW: Flag,
  MEDIUM: Flag,
  HIGH: AlertCircle,
  URGENT: Zap
};

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
  COMPLETED: "bg-green-100 text-green-700 border-green-200",
  CANCELLED: "bg-gray-100 text-gray-700 border-gray-200"
};

const statusIcons = {
  PENDING: Clock,
  IN_PROGRESS: TrendingUp,
  COMPLETED: CheckCircle2,
  CANCELLED: X
};

const toInputDateTime = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const ITEMS_PER_PAGE = 5;

type FilterType = {
  status: string;
  priority: string;
  search: string;
};

export default function TodoPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("MEDIUM");
  const [dueDate, setDueDate] = useState("");

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<Task["priority"]>("MEDIUM");
  const [editStatus, setEditStatus] = useState<Task["status"]>("PENDING");
  const [editDueDate, setEditDueDate] = useState("");

  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterType>({
    status: "ALL",
    priority: "ALL",
    search: ""
  });

  // Sort configuration
  const [sortBy, setSortBy] = useState<"dueDate" | "priority" | "createdAt">("priority");
  const [sortOrder] = useState<"asc" | "desc">("desc");

  // Calculate task statistics
  const stats: TaskStats = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const completed = tasks.filter(t => t.status === "COMPLETED").length;
    const weeklyCompleted = tasks.filter(t => 
      t.status === "COMPLETED" && 
      new Date(t.createdAt) > oneWeekAgo
    ).length;

    return {
      total: tasks.length,
      completed,
      inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
      pending: tasks.filter(t => t.status === "PENDING").length,
      cancelled: tasks.filter(t => t.status === "CANCELLED").length,
      urgentCount: tasks.filter(t => t.priority === "URGENT" && t.status !== "COMPLETED").length,
      completionRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
      weeklyCompleted
    };
  }, [tasks]);

  // Intelligent sorting
  const sortedAndFilteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Apply filters
    if (filters.status !== "ALL") {
      filtered = filtered.filter(t => t.status === filters.status);
    }
    if (filters.priority !== "ALL") {
      filtered = filtered.filter(t => t.priority === filters.priority);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply intelligent sorting
    return filtered.sort((a, b) => {
      // First, sort by status (incomplete first)
      const statusOrder = { "COMPLETED": 1, "CANCELLED": 1, "IN_PROGRESS": 0, "PENDING": 0 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }

      // Then apply selected sort
      if (sortBy === "priority") {
        const priorityWeight = { "URGENT": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1 };
        const weightA = priorityWeight[a.priority];
        const weightB = priorityWeight[b.priority];
        return sortOrder === "desc" ? weightB - weightA : weightA - weightB;
      }
      
      if (sortBy === "dueDate") {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        const dateA = new Date(a.dueDate).getTime();
        const dateB = new Date(b.dueDate).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      }

      // Default sort by creation date
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [tasks, filters, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedAndFilteredTasks.length / ITEMS_PER_PAGE));

  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredTasks.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, sortedAndFilteredTasks]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Optimistic updates
  const optimisticUpdate = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  }, []);

  const optimisticDelete = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  const optimisticAdd = useCallback((newTask: Task) => {
    setTasks(prev => [newTask, ...prev]);
  }, []);

  const fetchTasks = async (token: string) => {
    const response = await fetch(`${API_URL}/api/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error("Failed to load tasks.");
    }

    const data = (await response.json()) as Task[];
    setTasks(data);
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setError("Please log in to see your tasks.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchTasks(token);
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
    setActionLoading("create");

    try {
      const token = getAuthToken();
      if (!token) throw new Error("Please log in to add tasks.");

      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const newTask: Task = {
        id: tempId,
        title,
        description,
        priority,
        status: "PENDING",
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        createdAt: new Date().toISOString()
      };
      optimisticAdd(newTask);

      const response = await fetch(`${API_URL}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null
        })
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setTasks(prev => prev.filter(t => t.id !== tempId));
        throw new Error("Failed to add task.");
      }

      const savedTask = await response.json();
      // Replace temp task with real one
      setTasks(prev => prev.map(t => t.id === tempId ? savedTask : t));

      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setDueDate("");
      setMessage("✨ Task added successfully!");
      setCurrentPage(1);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unknown error");
    } finally {
      setActionLoading(null);
    }
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditPriority(task.priority);
    setEditStatus(task.status);
    setEditDueDate(toInputDateTime(task.dueDate));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setEditPriority("MEDIUM");
    setEditStatus("PENDING");
    setEditDueDate("");
  };

  const handleUpdate = async (taskId: string) => {
    setMessage(null);
    setError(null);
    setActionLoading(`update-${taskId}`);

    const originalTask = tasks.find(t => t.id === taskId);
    if (!originalTask) return;

    try {
      const token = getAuthToken();
      if (!token) throw new Error("Please log in to update tasks.");

      // Optimistic update
      optimisticUpdate(taskId, {
        title: editTitle,
        description: editDescription,
        priority: editPriority,
        status: editStatus,
        dueDate: editDueDate ? new Date(editDueDate).toISOString() : null
      });

      const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          priority: editPriority,
          status: editStatus,
          dueDate: editDueDate ? new Date(editDueDate).toISOString() : null
        })
      });

      if (!response.ok) {
        // Revert optimistic update on error
        optimisticUpdate(taskId, originalTask);
        throw new Error("Failed to update task.");
      }

      setMessage("✅ Task updated successfully.");
      cancelEdit();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unknown error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (taskId: string) => {
    setMessage(null);
    setError(null);
    setActionLoading(`delete-${taskId}`);

    const originalTasks = [...tasks];

    try {
      const token = getAuthToken();
      if (!token) throw new Error("Please log in to delete tasks.");

      // Optimistic delete
      optimisticDelete(taskId);

      const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // Revert optimistic delete on error
        setTasks(originalTasks);
        throw new Error("Failed to delete task.");
      }

      setMessage("🗑️ Task deleted successfully.");
      setCurrentPage(1);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unknown error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleQuickStatusChange = async (taskId: string, newStatus: Task["status"]) => {
    setActionLoading(`status-${taskId}`);
    
    const originalTask = tasks.find(t => t.id === taskId);
    if (!originalTask) return;

    try {
      const token = getAuthToken();
      if (!token) throw new Error("Please log in to update tasks.");

      // Optimistic update
      optimisticUpdate(taskId, { status: newStatus });

      const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...originalTask,
          status: newStatus
        })
      });

      if (!response.ok) {
        // Revert optimistic update on error
        optimisticUpdate(taskId, { status: originalTask.status });
        throw new Error("Failed to update task status.");
      }

      setMessage(`✅ Task marked as ${newStatus.replace('_', ' ')}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unknown error");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header with Stats */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-stone-900 p-3 shadow-sm">
                <Target className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
                  Priority Dashboard
                </h1>
                <p className="mt-1 text-sm text-stone-600 md:text-base">
                  Plan clearly, execute daily, and track real progress.
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid w-full grid-cols-3 gap-2 sm:gap-3 lg:w-auto">
              <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-center sm:px-4">
                <div className="text-lg font-semibold text-stone-900 sm:text-2xl">{stats.completionRate}%</div>
                <div className="text-[11px] text-stone-500 sm:text-xs">Completion rate</div>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-center sm:px-4">
                <div className="text-lg font-semibold text-stone-900 sm:text-2xl">{stats.urgentCount}</div>
                <div className="text-[11px] text-stone-500 sm:text-xs">Urgent tasks</div>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-center sm:px-4">
                <div className="text-lg font-semibold text-stone-900 sm:text-2xl">{stats.weeklyCompleted}</div>
                <div className="text-[11px] text-stone-500 sm:text-xs">Completed this week</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 overflow-hidden rounded-full bg-stone-200">
            <div 
              className="h-2 bg-stone-900 transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
            <span>{stats.completed} of {stats.total} tasks done</span>
            <span>{stats.total - stats.completed} remaining</span>
          </div>
        </div>

        {/* Status Messages */}
        {loading && (
          <div className="mb-4 flex items-center gap-2 text-sm text-stone-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-700 border-t-transparent" />
            Loading your tasks...
          </div>
        )}
        
        {error && (
          <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600 border border-rose-200">
            {error}
          </div>
        )}
        
        {message && (
          <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-600 border border-emerald-200 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {message}
          </div>
        )}

        {/* Create Form */}
        <form
          onSubmit={handleCreate}
          className="mb-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="rounded-full bg-stone-100 p-2">
              <Plus className="h-4 w-4 text-stone-700" />
            </div>
            <h2 className="text-lg font-semibold text-stone-900">Create New Task</h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-700 focus:border-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all"
                placeholder="What needs to be done?"
              />
            </div>
            
            <div className="md:col-span-2">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-700 focus:border-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all"
                placeholder="Add details (optional)"
              />
            </div>
            
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Priority
              </label>
              <select
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as Task["priority"])
                }
                className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-700 focus:border-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-200"
              >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Due Date
              </label>
              <div className="relative mt-2">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-4 py-3 text-sm text-stone-700 focus:border-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-200"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={actionLoading === "create"}
              className="flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading === "create" ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Create Task
                </>
              )}
            </button>
          </div>
        </form>

        {/* Filters and Sorting */}
        <div className="mb-6 rounded-xl border border-stone-200 bg-white p-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-stone-700" />
              <span className="text-sm font-semibold text-stone-700">Filters & Sorting</span>
            </div>
            <ChevronRight className={`h-4 w-4 text-stone-400 transition-transform ${showFilters ? 'rotate-90' : ''}`} />
          </button>
          
          {showFilters && (
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                  Search
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                  placeholder="Search tasks..."
                />
              </div>
              
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                  Priority
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="URGENT">Urgent</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="priority">Priority (High to Low)</option>
                  <option value="dueDate">Due Date</option>
                  <option value="createdAt">Created Date</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {sortedAndFilteredTasks.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-white px-6 py-12 text-center">
              <Target className="mx-auto h-12 w-12 text-stone-300" />
              <p className="mt-4 text-sm text-stone-500">
                {filters.search || filters.status !== "ALL" || filters.priority !== "ALL"
                  ? "No tasks match your filters."
                  : "No tasks yet. Create your first task above!"}
              </p>
            </div>
          ) : (
            paginatedTasks.map((task) => {
              const PriorityIcon = priorityIcons[task.priority];
              const StatusIcon = statusIcons[task.status];
              const isEditing = editingId === task.id;
              const isLoading = actionLoading === `update-${task.id}` || 
                               actionLoading === `delete-${task.id}` ||
                               actionLoading === `status-${task.id}`;

              return (
                <div
                  key={task.id}
                  className={`group relative overflow-hidden rounded-2xl border transition-all ${
                    task.status === "COMPLETED" 
                      ? "border-green-200 bg-green-50/30" 
                      : task.priority === "URGENT"
                      ? "border-red-200 bg-red-50/30"
                      : "border-stone-200 bg-white"
                  } p-6 hover:shadow-md ${
                    task.priority === "URGENT" ? "hover:shadow-red-100/40" : "hover:shadow-stone-200"
                  }`}
                >
                  {/* Priority indicator line */}
                  <div className={`absolute left-0 top-0 h-full w-1 ${
                    task.priority === "URGENT" ? "bg-red-400" :
                    task.priority === "HIGH" ? "bg-orange-400" :
                    task.priority === "MEDIUM" ? "bg-green-400" :
                    "bg-blue-400"
                  }`} />

                  {isEditing ? (
                    <div className="space-y-4 pl-4">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm"
                        placeholder="Task title"
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={2}
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm"
                        placeholder="Description"
                      />
                      <div className="grid gap-4 md:grid-cols-3">
                        <select
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value as Task["priority"])}
                          className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as Task["status"])}
                          className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                        <input
                          type="datetime-local"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                          className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleUpdate(task.id)}
                          disabled={isLoading}
                          className="flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
                        >
                          {isLoading ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Save
                            </>
                          )}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={isLoading}
                          className="flex items-center gap-2 rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 pl-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          {/* Quick status toggle */}
                          <button
                            onClick={() => handleQuickStatusChange(
                              task.id, 
                              task.status === "COMPLETED" ? "PENDING" : "COMPLETED"
                            )}
                            disabled={isLoading}
                            className="mt-1"
                          >
                            <CheckCircle2 className={`h-5 w-5 ${
                              task.status === "COMPLETED" 
                                ? "text-green-600" 
                                : "text-stone-300 hover:text-green-600"
                            } transition-colors`} />
                          </button>
                          
                          <div className="flex-1">
                            <h3 className={`text-lg font-semibold ${
                              task.status === "COMPLETED" ? "text-stone-500 line-through" : "text-stone-900"
                            }`}>
                              {task.title}
                            </h3>
                            
                            {task.description && (
                              <p className={`mt-1 text-sm ${
                                task.status === "COMPLETED" ? "text-stone-400" : "text-stone-600"
                              }`}>
                                {task.description}
                              </p>
                            )}
                            
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs border ${
                                priorityColors[task.priority]
                              }`}>
                                <PriorityIcon className="h-3 w-3" />
                                {task.priority}
                              </span>
                              
                              <span className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs border ${
                                statusColors[task.status]
                              }`}>
                                <StatusIcon className="h-3 w-3" />
                                {task.status.replace('_', ' ')}
                              </span>
                              
                              {task.dueDate && (
                                <span className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs border ${
                                  new Date(task.dueDate) < new Date() && task.status !== "COMPLETED"
                                    ? "bg-red-100 text-red-700 border-red-200"
                                    : "bg-stone-100 text-stone-600 border-stone-200"
                                }`}>
                                  <Calendar className="h-3 w-3" />
                                  {new Date(task.dueDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 md:self-start">
                        <select
                          value={task.status}
                          onChange={(e) => handleQuickStatusChange(task.id, e.target.value as Task["status"])}
                          disabled={isLoading}
                          className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                        
                        <button
                          onClick={() => startEdit(task)}
                          disabled={isLoading}
                          className="rounded-lg border border-stone-300 p-2 text-stone-700 hover:bg-stone-100 disabled:opacity-50"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDelete(task.id)}
                          disabled={isLoading}
                          className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {sortedAndFilteredTasks.length > ITEMS_PER_PAGE && (
          <div className="mt-8 flex items-center justify-between border-t border-stone-200 pt-6">
            <p className="text-sm text-stone-500">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, sortedAndFilteredTasks.length)} of {sortedAndFilteredTasks.length} tasks
            </p>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`h-8 w-8 rounded-lg text-sm font-semibold transition-all ${
                      currentPage === i + 1
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Weekly Summary */}
        {tasks.length > 0 && (
          <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-900">
                <BarChart3 className="h-5 w-5 text-stone-700" />
                <h3 className="font-semibold">Weekly Snapshot</h3>
              </div>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                {stats.completionRate}% complete
              </span>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                <div className="text-2xl font-semibold text-stone-900">{stats.weeklyCompleted}</div>
                <div className="text-xs text-stone-500">Finished this week</div>
              </div>
              
              <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
                <div className="text-2xl font-bold text-rose-700">{stats.urgentCount}</div>
                <div className="text-xs text-rose-500">Urgent open items</div>
              </div>
              
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                <div className="text-2xl font-bold text-amber-700">{stats.total - stats.completed}</div>
                <div className="text-xs text-amber-600">Still pending</div>
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-stone-600">
              {stats.completionRate >= 70 ? (
                <Sparkles className="h-4 w-4 text-stone-700" />
              ) : stats.completionRate >= 40 ? (
                <TrendingUp className="h-4 w-4 text-stone-700" />
              ) : (
                <Clock className="h-4 w-4 text-stone-700" />
              )}
              <p className="text-sm">
                {stats.completionRate >= 70 
                  ? "Strong week. Keep this pace."
                  : stats.completionRate >= 40
                  ? "Momentum is building. Prioritize the urgent items next."
                  : "Start with one high-impact task to build rhythm."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}