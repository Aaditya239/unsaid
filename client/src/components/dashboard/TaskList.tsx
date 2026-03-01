import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Check,
  Clock,
  Zap,
  MoreHorizontal,
  Plus,
  Edit2,
  Trash2,
  Play,
  GripVertical,
  Atom,
  AlertCircle,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useTaskStore, Task } from "@/stores/taskStore";
import { cn } from "@/lib/utils";
import { CreateTaskModal } from "./CreateTaskModal";
import { EmotionalReflectionModal } from "./EmotionalReflectionModal";
import { MoodSuggestionPanel } from "./MoodSuggestionPanel";
import { InsightsCard } from "./InsightsCard";
import { EODSummaryCard } from "./EODSummaryCard";
import { AIDailyPlannerModal } from "./AIDailyPlannerModal";
import { TaskLoadBadge } from "./TaskLoadBadge";
import { ResistancePanel } from "./ResistancePanel";
import { WeeklyLetter } from "./WeeklyLetter";
import dayjs from "dayjs";

const PRIORITY_COLORS = {
  HIGH: "#F87171", // subtle red
  MEDIUM: "#FBBF24", // warm amber
  LOW: "#60A5FA", // soft blue
};

export const TaskCard: React.FC<{
  task: Task;
  onToggle: () => void;
  isCompleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStartFocus: () => void;
  onBreakdown: () => void;
  isDraggable?: boolean;
  isPastDate?: boolean;
  onCarryForward?: (action: 'today' | 'breakdown' | 'remove') => void;
}> = ({ task,
  onToggle,
  isCompleting,
  onEdit,
  onDelete,
  onStartFocus,
  onBreakdown,
  isDraggable = false,
  isPastDate = false,
  onCarryForward,
}) => {
    const hasSubTasks = !!(task.subTasks && task.subTasks.length > 0);
    const isHighPriority = task.priority === "HIGH";
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isBreakingDown, setIsBreakingDown] = useState(false);
    const [showCarryMenu, setShowCarryMenu] = useState(false);
    const { generateStepsForTask, updateSubtaskStatus } = useTaskStore();

    // Auto-expand when subtasks first appear (e.g. after AI breakdown)
    const prevSubTaskCount = useRef(task.subTasks?.length ?? 0);
    useEffect(() => {
      const curr = task.subTasks?.length ?? 0;
      if (curr > 0 && prevSubTaskCount.current === 0) {
        setIsExpanded(true);
      }
      prevSubTaskCount.current = curr;
    }, [task.subTasks?.length]);

    // Auto-complete parent when ALL subtasks become completed
    const didMountRef = useRef(false);
    useEffect(() => {
      if (!didMountRef.current) { didMountRef.current = true; return; }
      if (hasSubTasks && task.subTasks!.every(s => s.isCompleted) && !task.isCompleted) {
        onToggle();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [task.subTasks?.map(s => s.isCompleted).join(',')]);

    const isOverdue =
      task.dueDate &&
      new Date(task.dueDate).getTime() < Date.now() &&
      !task.isCompleted;

    return (
      <Reorder.Item
        value={task}
        id={task.id}
        dragListener={isDraggable}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: isCompleting ? 0 : 1,
          scale: isCompleting ? 0.95 : 1,
          y: 0,
        }}
        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn(
          "relative rounded-[16px] p-[14px] flex flex-col group transition-all duration-250 ease-out border border-transparent",
          task.isCompleted
            ? "opacity-50 bg-[rgba(255,255,255,0.03)]"
            : isOverdue
              ? "bg-red-500/5 border-red-500/10 hover:-translate-y-[2px] hover:bg-red-500/10 hover:border-red-500/20"
              : "bg-[rgba(255,255,255,0.03)] hover:-translate-y-[2px] hover:bg-[rgba(255,255,255,0.04)] shadow-sm",
        )}
      >
        <div className="flex items-center gap-3 pl-1 w-full relative">
          {/* Drag Handle */}
          {isDraggable && !task.isCompleted && (
            <div className="absolute -left-3 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity active:cursor-grabbing text-white/20 hover:text-white/50">
              <GripVertical className="w-4 h-4" />
            </div>
          )}

          {/* Checkbox */}
          <button
            onClick={onToggle}
            className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0",
              task.isCompleted
                ? "bg-[#34D399] border-[#34D399] text-black shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                : "border-white/20 hover:border-[#4F7CFF] bg-black/20",
            )}
          >
            <AnimatePresence>
              {task.isCompleted && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Check className="w-3.5 h-3.5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4
              className={cn(
                "text-[15px] font-medium transition-colors truncate flex items-center gap-2",
                task.isCompleted ? "text-white/40 line-through" : "text-white/90",
              )}
            >
              {/* Chevron toggle — only shown when subtasks exist */}
              {hasSubTasks && (
                <button
                  onClick={(e) => { e.stopPropagation(); setIsExpanded(ex => !ex); }}
                  className="shrink-0 flex items-center justify-center w-4 h-4 rounded-sm hover:bg-white/[0.06] transition-colors"
                  aria-label={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
                >
                  <ChevronRight
                    className="w-3 h-3 text-white/30 transition-transform duration-200"
                    style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                  />
                </button>
              )}
              {task.title}
              {!task.isCompleted && (
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: PRIORITY_COLORS[task.priority] || "#4F7CFF",
                    boxShadow: isHighPriority
                      ? "0 0 6px rgba(248,113,113,0.5)"
                      : "none"
                  }}
                />
              )}
            </h4>
            {task.description && (
              <p className="text-[12px] text-white/40 truncate mt-0.5">
                {task.description}
              </p>
            )}

            {/* Metadata Row */}
            <div className="flex items-center gap-3 mt-2 text-[11px] font-medium text-white/30 truncate">
              {isOverdue && !task.isCompleted && (
                <span className="flex items-center gap-1.5 text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />{" "}
                  Overdue
                </span>
              )}
              {task.dueDate && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(task.dueDate).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
              {task.category !== "OTHER" && (
                <span className="bg-white/[0.05] px-2 py-0.5 rounded-sm text-white/40 tracking-wider">
                  {task.category}
                </span>
              )}
              {task.energyLevelRequired === "HIGH" && (
                <span className="flex items-center gap-1 text-[#FBBF24]/70">
                  <Zap className="w-3 h-3" fill="currentColor" /> High Energy
                </span>
              )}
            </div>
          </div>

          {/* Action Menu & Focus Button */}
          {!task.isCompleted && (
            <div className="flex items-center shrink-0 ml-2 gap-2">
              {!showDeleteConfirm && (
                <>
                  {/* Break into steps — hidden once breakdown has been generated */}
                  {!task.parentTaskId && !task.breakdownGenerated && (
                  <button
                    onClick={async () => {
                      setIsBreakingDown(true);
                      try {
                        await generateStepsForTask(task.id);
                      } finally {
                        setIsBreakingDown(false);
                      }
                    }}
                    disabled={isBreakingDown}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#9C6BFF]/10 text-[#9C6BFF]/80 hover:bg-[#9C6BFF]/20 text-[11px] font-medium transition-all opacity-0 group-hover:opacity-100 border border-[#9C6BFF]/20 active:scale-95"
                  >
                    {isBreakingDown ? (
                      <div className="w-3 h-3 border border-[#9C6BFF]/40 border-t-[#9C6BFF] rounded-full animate-spin" />
                    ) : (
                      <Atom className="w-3 h-3" />
                    )}
                    <span className="hidden sm:inline">Steps</span>
                  </button>
                  )}

                  {/* Carry Forward badge (past dates only, incomplete tasks) */}
                  {isPastDate && onCarryForward && (
                    <div className="relative">
                      <button
                        onClick={() => setShowCarryMenu(!showCarryMenu)}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-amber-500/10 text-amber-400/70 hover:bg-amber-500/20 text-[11px] font-medium transition-all border border-amber-500/15"
                      >
                        <AlertCircle className="w-3 h-3" />
                        <ChevronRight className="w-3 h-3" />
                      </button>
                      <AnimatePresence>
                        {showCarryMenu && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.1 }}
                            className="absolute right-0 top-full mt-2 w-[160px] bg-[rgba(20,24,38,0.97)] border border-white/[0.08] rounded-[14px] shadow-[0_10px_30px_rgba(0,0,0,0.5)] py-1.5 z-20"
                          >
                            {(['Move to today', 'Break down', 'Remove'] as const).map((action) => (
                              <button
                                key={action}
                                onClick={() => {
                                  setShowCarryMenu(false);
                                  const map = { 'Move to today': 'today', 'Break down': 'breakdown', 'Remove': 'remove' } as const;
                                  onCarryForward(map[action]);
                                }}
                                className="w-full text-left px-4 py-2 text-[12px] text-white/70 hover:bg-white/[0.05] hover:text-white transition-colors"
                              >
                                {action}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Focus */}
                  <button
                    onClick={onStartFocus}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#4F7CFF]/10 text-[#4F7CFF] hover:bg-[#4F7CFF]/20 text-[12px] font-medium transition-all opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 border border-[#4F7CFF]/20"
                  >
                    <Play className="w-3.5 h-3.5" fill="currentColor" /> Focus
                  </button>
                </>
              )}
              {showDeleteConfirm ? (
                <div className="flex items-center gap-3 bg-[rgba(255,255,255,0.03)] backdrop-blur-md px-3 py-1.5 rounded-[18px] border border-white/[0.04]">
                  <span className="text-[12px] text-white/70">Are you sure you want to delete this task?</span>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-[12px] text-white/40 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      onDelete();
                    }}
                    className="text-[12px] text-[#F87171] opacity-90 hover:opacity-100 transition-opacity font-medium"
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent hover:bg-white/[0.06] transition-colors duration-200"
                  >
                    <MoreHorizontal className="w-5 h-5 text-white/40 hover:text-white/80" />
                  </button>
                  <AnimatePresence>
                    {isMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 top-full mt-2 w-[140px] bg-[rgba(20,24,38,0.95)] border border-white/[0.08] rounded-[14px] shadow-[0_10px_30px_rgba(0,0,0,0.4)] py-1.5 z-20"
                      >
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            onEdit();
                          }}
                          className="w-full text-left px-4 py-2 text-[13px] text-white/80 hover:bg-white/[0.05] hover:text-white transition-colors flex items-center gap-3"
                        >
                          <Edit2 className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            setShowDeleteConfirm(true);
                          }}
                          className="w-full text-left px-4 py-2 text-[13px] text-[#F87171]/90 hover:bg-white/[0.05] hover:text-[#F87171] transition-colors flex items-center gap-3"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Subtasks — animated collapsible */}
        <AnimatePresence initial={false}>
          {isExpanded && hasSubTasks && (
            <motion.div
              key="subtasks"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
              className="mt-2 pl-9 w-full"
            >
              <div className="space-y-1 border-l border-white/[0.06] pl-3 pt-1 pb-0.5">
                {task.subTasks!.map(subtask => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-2 py-1 group/sub"
                  >
                    {/* Subtask toggle circle */}
                    <button
                      onClick={() => updateSubtaskStatus(subtask.id, !subtask.isCompleted)}
                      className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200",
                        subtask.isCompleted
                          ? "bg-[#34D399]/80 border-[#34D399]/80 shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                          : "border-white/20 hover:border-white/40 bg-transparent",
                      )}
                    >
                      <AnimatePresence>
                        {subtask.isCompleted && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            <Check className="w-2 h-2 text-black" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>

                    {/* Subtask title */}
                    <span
                      className={cn(
                        "text-[12px] transition-all duration-200 select-none leading-tight",
                        subtask.isCompleted
                          ? "text-white/25 line-through"
                          : "text-white/55 group-hover/sub:text-white/70",
                      )}
                    >
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Reorder.Item>
    );
  };

export const TaskList: React.FC = () => {
  const {
    today,
    hiddenHighEnergyTasks,
    executionContext,
    dailyCapacity,
    tinyWins,
    isLoading,
    updateTaskStatus,
    updateSubtaskStatus,
    progress,
    updateTask,
    deleteTask,
    reorderTasks,
    analytics,
    fetchAnalytics,
    fetchExecutionContext,
    fetchTinyWins,
    selectedDate,
  } =
    useTaskStore();
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'Manual' | 'Priority' | 'Time' | 'Energy'>('Manual');
  const [focusSession, setFocusSession] = useState<{ active: boolean, taskId: string | null, minutesLeft: number }>({ active: false, taskId: null, minutesLeft: 0 });
  const [reflectionTaskId, setReflectionTaskId] = useState<string | null>(null);
  const [plannerOpen, setPlannerOpen] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    fetchExecutionContext(dayjs(selectedDate).format('YYYY-MM-DD'));
    fetchTinyWins(dayjs(selectedDate).format('YYYY-MM-DD'));
  }, [fetchAnalytics, fetchExecutionContext, fetchTinyWins, selectedDate]);

  useEffect(() => {
    const onMoodLogged = () => {
      useTaskStore.getState().fetchTasksForDate(useTaskStore.getState().selectedDate);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('mood:logged', onMoodLogged);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mood:logged', onMoodLogged);
      }
    };
  }, []);

  // Focus Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (focusSession.active && focusSession.minutesLeft > 0) {
      interval = setInterval(() => {
        setFocusSession(prev => ({ ...prev, minutesLeft: prev.minutesLeft - 1 }));
      }, 60000); // 1 minute per tick for testing we can scale down, but 60000 is realistic.
    } else if (focusSession.active && focusSession.minutesLeft <= 0 && focusSession.taskId) {
      // Focus ended
      setFocusSession(prev => ({ ...prev, active: false }));
      // Prompt user to mark complete or add minutes
      const confirmed = window.confirm("Focus session completed. Did you finish this task?");
      if (confirmed) {
        updateTaskStatus(focusSession.taskId, true);
      }

      // Add focus minutes to the task using updateTask backend logic implicitly if we tracked total elapsed.
      // But we just do a simple mark as done right now.
    }
    return () => clearInterval(interval);
  }, [focusSession, updateTaskStatus]);

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleToggle = async (id: string, currentlyCompleted: boolean) => {
    if (!currentlyCompleted) {
      setCompletingId(id);
      setTimeout(async () => {
        await updateTaskStatus(id, true);
        setCompletingId(null);
        // Cascade: mark all incomplete subtasks as done
        const task = today.find(t => t.id === id);
        if (task?.subTasks) {
          const incompleteSubtasks = task.subTasks.filter(s => !s.isCompleted);
          for (const sub of incompleteSubtasks) {
            await updateSubtaskStatus(sub.id, true);
          }
        }
        // Trigger post-completion reflection if feedback not yet given
        if (task && !task.emotionalFeedback) {
          setReflectionTaskId(id);
        }
      }, 500);
    } else {
      updateTaskStatus(id, false);
    }
  };

  const handleCarryForward = useCallback(async (task: Task, action: 'today' | 'breakdown' | 'remove') => {
    const { createTask, deleteTask: del, generateSubtasks, selectedDate } = useTaskStore.getState();
    if (action === 'today') {
      const todayStr = dayjs().format('YYYY-MM-DD');
      await createTask({ ...task, id: undefined, taskDate: todayStr, isCompleted: false } as Partial<Task>);
    } else if (action === 'breakdown') {
      const steps = await generateSubtasks(task.title, task.description || undefined);
      const todayStr = dayjs().format('YYYY-MM-DD');
      for (const step of steps) {
        await createTask({ title: step, taskDate: todayStr, priority: 'LOW', energyLevelRequired: 'LOW', category: 'OTHER', recurring: 'NONE' });
      }
      await del(task.id);
    } else {
      await del(task.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startFocus = (taskId: string) => {
    setFocusSession({ active: true, taskId, minutesLeft: 25 });
  };

  // Sort logic
  const sortedTasks = [...today].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;

    if (sortBy === 'Priority') {
      const pMap = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return pMap[b.priority] - pMap[a.priority];
    }
    if (sortBy === 'Time') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sortBy === 'Energy') {
      const eMap = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return eMap[b.energyLevelRequired] - eMap[a.energyLevelRequired];
    }
    return 0; // Manual relies on array order
  });

  const highPriorityIncompleteCount = today.filter(t => t.priority === 'HIGH' && !t.isCompleted).length;
  const isAllCompleted = today.length > 0 && today.every(t => t.isCompleted);

  const todayZero = new Date();
  todayZero.setHours(0, 0, 0, 0);
  const isSelectedDateToday = todayZero.getTime() === selectedDate.getTime();
  const isPastDate = selectedDate.getTime() < todayZero.getTime();

  const displayTitle = isSelectedDateToday
    ? "Today's Focus"
    : isPastDate
      ? `Tasks from ${selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
      : `Planned for ${selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;

  return (
    <div className="w-full h-full flex flex-col relative z-0">
      <div className="flex flex-col gap-4 mb-6 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[18px] font-medium text-white mb-1">
              {displayTitle}
            </h3>
            <p className="text-[13px] text-white/50">Stay intentional.</p>
          </div>

          <div className="flex items-center gap-2 relative group">
            {/* Cognitive Load Badge */}
            <TaskLoadBadge />

            {/* AI Daily Planner */}
            <button
              onClick={() => setPlannerOpen(true)}
              title="Plan my day"
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-[#9C6BFF] hover:bg-[#9C6BFF]/10 hover:border-[#9C6BFF]/20 transition-all"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (!isPastDate) setIsModalOpen(true);
              }}
              disabled={isPastDate}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                isPastDate
                  ? "bg-white/[0.02] border border-white/[0.05] text-white/20 cursor-not-allowed"
                  : "bg-white/[0.05] border border-white/[0.1] text-white/80 hover:bg-white/[0.1] hover:text-white active:scale-[0.97] hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]"
              )}
            >
              <Plus className="w-5 h-5" />
            </button>
            {isPastDate && (
              <div className="absolute top-[-36px] left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 bg-[rgba(20,24,38,0.95)] border border-white/[0.08] text-[11px] text-white/70 rounded-[8px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                You cannot add tasks to past dates.
              </div>
            )}
          </div>
        </div>

        {/* Smart Sorting Segmented Control */}
        <div className="flex items-center p-1 bg-white/[0.03] rounded-[12px] border border-white/[0.05] w-fit">
          {['Manual', 'Priority', 'Time', 'Energy'].map((option) => (
            <button
              key={option}
              onClick={() => setSortBy(option as any)}
              className={cn(
                "px-4 py-1.5 text-[12px] font-medium rounded-[8px] transition-all",
                sortBy === option ? "bg-[#4F7CFF]/20 text-white shadow-sm border border-[#4F7CFF]/30" : "text-white/40 hover:text-white/70"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {executionContext?.supportiveBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="px-5 py-3 bg-emerald-500/5 border border-emerald-500/10 rounded-[18px] backdrop-blur-sm flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            <p className="text-emerald-400/80 text-[13px] font-medium leading-relaxed">{executionContext.supportiveBanner}</p>
          </div>
        </motion.div>
      )}

      {dailyCapacity && (
        <div className="mb-8 px-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-col">
              <p className="text-[13px] font-semibold text-white/80 tracking-tight">Today's Emotional Capacity</p>
              {dailyCapacity.message && (
                <p className="text-[11px] text-white/40 font-medium italic mt-0.5">{dailyCapacity.message}</p>
              )}
            </div>
            <div className="text-right">
              <span className={cn(
                "text-[14px] font-bold tracking-tighter",
                dailyCapacity.percentage < 35 ? "text-amber-400" : "text-emerald-400"
              )}>
                {dailyCapacity.percentage}%
              </span>
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/[0.04] p-[1px] border border-white/[0.02]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dailyCapacity.percentage}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'h-full rounded-full shadow-lg',
                dailyCapacity.percentage < 35
                  ? 'bg-gradient-to-r from-amber-400 to-orange-400 shadow-amber-500/20'
                  : 'bg-gradient-to-r from-emerald-400 to-indigo-400 shadow-emerald-500/20'
              )}
            />
          </div>
        </div>
      )}

      {highPriorityIncompleteCount > 5 && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-4">
          <div className="px-4 py-2 bg-[#FBBF24]/10 border border-[#FBBF24]/20 rounded-[12px] flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#FBBF24] animate-pulse" />
            <p className="text-[#FBBF24]/90 text-[12px] font-medium">Your list is heavy today. Spacing effort can help.</p>
          </div>
        </motion.div>
      )}

      {/* Focus Session Banner */}
      <AnimatePresence>
        {focusSession.active && focusSession.taskId && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 bg-gradient-to-r from-[#4F7CFF]/20 to-[#9C6BFF]/20 border border-[#4F7CFF]/30 p-3 rounded-[14px] flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#4F7CFF]/30 flex items-center justify-center">
                <Play className="w-3.5 h-3.5 text-white" fill="currentColor" />
              </div>
              <div>
                <p className="text-white text-[13px] font-medium">Focus Session Active</p>
                <p className="text-[#4F7CFF] text-[12px] font-semibold">{focusSession.minutesLeft}m remaining</p>
              </div>
            </div>
            <button
              onClick={() => setFocusSession({ ...focusSession, active: false })}
              className="text-[12px] text-white/50 hover:text-white px-3 py-1.5 bg-white/5 rounded-full transition-colors"
            >
              Stop Focus
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {progress && progress.totalTasks > 0 && (
        <div className="mb-10 px-1 relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-col">
              <p className="text-[13px] font-semibold text-white/70 tracking-tight">
                Activity Progress
              </p>
              <p className="text-[11px] text-white/30 font-medium mt-0.5">
                {progress.completedTasks} of {progress.totalTasks} mindful tasks completed
              </p>
            </div>
            {isAllCompleted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20"
              >
                <p className="text-[10px] font-bold text-emerald-400 tracking-[0.1em] uppercase">
                  COMPLETE
                </p>
              </motion.div>
            )}
          </div>
          <div className={cn(
            "h-2 w-full rounded-full p-[1px] transition-colors duration-700",
            isAllCompleted ? "bg-emerald-500/5 border border-emerald-500/10" : "bg-white/[0.03] border border-white/[0.05]"
          )}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.completionRate}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "h-full rounded-full transition-all duration-700 shadow-xl",
                isAllCompleted
                  ? "bg-gradient-to-r from-emerald-400 to-teal-400 shadow-emerald-500/30"
                  : "bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 shadow-indigo-500/20"
              )}
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-8 custom-scrollbar pr-2 min-h-[300px] overflow-x-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDate.getTime()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="w-full h-full"
          >
            {isLoading && today.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center py-8"
              >
                <div className="w-5 h-5 border-2 border-[#4F7CFF]/30 border-t-[#4F7CFF] rounded-full animate-spin"></div>
              </motion.div>
            ) : today.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 bg-white/[0.02] rounded-[16px] border border-white/[0.04]"
              >
                <p className="text-white/40 text-[14px] mb-4">
                  {isSelectedDateToday ? "Start with one small step." : "No tasks planned for this day."}
                </p>
                {!isPastDate && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.1] transition-all cursor-pointer z-10"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </motion.div>
            ) : (
              <>
                <Reorder.Group
                  axis="y"
                  values={sortedTasks}
                  onReorder={(newOrder) => {
                    if (sortBy === 'Manual') {
                      reorderTasks(newOrder, 'today');
                    }
                  }}
                  className="space-y-3"
                >
                  <AnimatePresence mode="popLayout">
                    {sortedTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isDraggable={sortBy === 'Manual'}
                        isPastDate={isPastDate}
                        onToggle={() => handleToggle(task.id, task.isCompleted)}
                        isCompleting={completingId === task.id}
                        onEdit={() => handleEdit(task)}
                        onDelete={() => deleteTask(task.id)}
                        onStartFocus={() => startFocus(task.id)}
                        onBreakdown={() => { }}
                        onCarryForward={isPastDate ? (action) => handleCarryForward(task, action) : undefined}
                      />
                    ))}
                  </AnimatePresence>
                </Reorder.Group>

                {hiddenHighEnergyTasks.length > 0 && (
                  <div className="mt-4 rounded-[14px] border border-white/[0.08] bg-white/[0.02] p-3">
                    <p className="text-[12px] text-white/55 mb-2">High-energy tasks ({hiddenHighEnergyTasks.length}) are tucked away for now.</p>
                    <div className="space-y-1">
                      {hiddenHighEnergyTasks.slice(0, 3).map((task) => (
                        <p key={task.id} className="text-[12px] text-white/40">• {task.title}</p>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Weekly Analytics Module */}
      {analytics && (
        <div className="mt-6 mb-2 p-4 rounded-[16px] bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.04] shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
          <h4 className="text-[13px] font-medium text-white/50 uppercase tracking-widest mb-3">Weekly Rhythm</h4>
          <div className="flex gap-6">
            <div>
              <p className="text-[28px] font-light text-white leading-none">{analytics.totalCompletedThisWeek}</p>
              <p className="text-[11px] text-white/40 mt-1">Completed</p>
            </div>
            <div className="w-[1px] h-10 bg-white/[0.08]" />
            <div>
              <p className="text-[28px] font-light text-white leading-none">{analytics.totalFocusMinutes}<span className="text-[16px] text-white/40 ml-1">m</span></p>
              <p className="text-[11px] text-white/40 mt-1">Deep Focus</p>
            </div>
          </div>
        </div>
      )}

      {tinyWins.length > 0 && (
        <div className="mt-4 mb-1 p-4 rounded-[16px] bg-white/[0.02] border border-white/[0.05]">
          <h4 className="text-[12px] font-medium text-white/55 uppercase tracking-widest mb-2">Tiny Wins Today</h4>
          <div className="space-y-1.5">
            {tinyWins.map((win) => (
              <p key={win.id} className={cn('text-[12px]', win.done ? 'text-emerald-300/90' : 'text-white/45')}>
                {win.icon} {win.label}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Mood Suggestion */}
      <MoodSuggestionPanel />

      {/* Emotional Productivity Insights */}
      <InsightsCard />

      {/* End-of-Day Summary */}
      <EODSummaryCard />

      {/* Tasks stuck for 72+ hours */}
      <ResistancePanel />

      {/* Weekly Letter (visible Sat–Sun) */}
      <WeeklyLetter />

      {/* Create / Edit Task Modal */}
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(undefined);
        }}
        editingTask={editingTask}
      />

      {/* Post-completion Emotional Reflection */}
      <EmotionalReflectionModal
        taskId={reflectionTaskId}
        onClose={() => setReflectionTaskId(null)}
      />

      {/* AI Daily Planner */}
      <AIDailyPlannerModal
        isOpen={plannerOpen}
        onClose={() => setPlannerOpen(false)}
      />
    </div>
  );
};
