import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore, Task } from '@/stores/taskStore';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import dayjs from 'dayjs';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingTask?: Task;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, editingTask }) => {
    const { createTask, updateTask, selectedDate } = useTaskStore();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
    const [energyLevel, setEnergyLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
    const [time, setTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            if (editingTask) {
                setTitle(editingTask.title);
                setDescription(editingTask.description || '');
                setPriority(editingTask.priority);
                setEnergyLevel(editingTask.energyLevelRequired);
                if (editingTask.dueDate) {
                    const d = new Date(editingTask.dueDate);
                    setTime(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
                } else {
                    setTime('');
                }
            } else {
                setTitle('');
                setDescription('');
                setPriority('MEDIUM');
                setEnergyLevel('MEDIUM');
                setTime('');
            }
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, editingTask]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!title.trim() || isSubmitting) return;

        setIsSubmitting(true);

        // Convert time to Date object for selectedDate if provided
        let dueDate = undefined;
        if (time) {
            const [hours, minutes] = time.split(':');
            dueDate = new Date(selectedDate);
            dueDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        } else {
            // Default to selectedDate
            dueDate = new Date(selectedDate);
            dueDate.setHours(23, 59, 59, 0);
        }

        if (editingTask) {
            await updateTask(editingTask.id, {
                title: title.trim(),
                description: description.trim(),
                priority,
                energyLevelRequired: energyLevel,
                dueDate: dueDate.toISOString(),
                taskDate: dayjs(selectedDate).format('YYYY-MM-DD')
            });
        } else {
            await createTask({
                title: title.trim(),
                description: description.trim(),
                priority,
                energyLevelRequired: energyLevel,
                dueDate: dueDate.toISOString(), // Send as ISO string
                taskDate: dayjs(selectedDate).format('YYYY-MM-DD'),
                category: 'OTHER',
                recurring: 'NONE'
            });
        }

        setIsSubmitting(false);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-[20px]"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="relative w-full max-w-[480px] bg-[#141826]/85 border border-white/[0.08] rounded-[20px] p-7 shadow-2xl overflow-hidden"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-[20px] font-medium text-white">{editingTask ? 'Edit Task' : 'Add Task'}</h2>
                            <button onClick={onClose} className="p-2 -mr-2 text-white/40 hover:text-white/80 transition-colors rounded-full hover:bg-white/[0.05]">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <input
                                    ref={inputRef}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Task Title"
                                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-[12px] px-4 py-3.5 text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#0A84FF]/50 focus:bg-white/[0.05] transition-colors"
                                    maxLength={100}
                                    required
                                />
                            </div>

                            <div>
                                <input
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Notes (optional)"
                                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-[12px] px-4 py-3.5 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#0A84FF]/50 focus:bg-white/[0.05] transition-colors"
                                    maxLength={200}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[12px] font-medium text-white/50 mb-2 ml-1">Priority</label>
                                    <div className="flex bg-white/[0.03] border border-white/[0.06] rounded-[10px] p-1">
                                        {['LOW', 'MEDIUM', 'HIGH'].map((p) => (
                                            <button
                                                type="button"
                                                key={p}
                                                onClick={() => setPriority(p as any)}
                                                className={cn(
                                                    "flex-1 py-1.5 text-[12px] font-medium rounded-[6px] transition-colors",
                                                    priority === p ? "bg-white/[0.1] text-white shadow-sm" : "text-white/40 hover:text-white/70"
                                                )}
                                            >
                                                {p.charAt(0) + p.slice(1).toLowerCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[12px] font-medium text-white/50 mb-2 ml-1">Energy Required</label>
                                    <div className="flex bg-white/[0.03] border border-white/[0.06] rounded-[10px] p-1">
                                        {['LOW', 'MEDIUM', 'HIGH'].map((e) => (
                                            <button
                                                type="button"
                                                key={e}
                                                onClick={() => setEnergyLevel(e as any)}
                                                className={cn(
                                                    "flex-1 py-1.5 text-[12px] font-medium rounded-[6px] transition-colors",
                                                    energyLevel === e ? "bg-white/[0.1] text-white shadow-sm" : "text-white/40 hover:text-white/70"
                                                )}
                                            >
                                                {e.charAt(0) + e.slice(1).toLowerCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[12px] font-medium text-white/50 mb-2 ml-1">Time (Optional)</label>
                                <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-[12px] px-4 py-3 text-[14px] text-white focus:outline-none focus:border-[#0A84FF]/50 focus:bg-white/[0.05] transition-colors"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.05]">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 rounded-[14px] text-[14px] font-medium text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!title.trim() || isSubmitting}
                                    className="px-6 py-2.5 rounded-[14px] text-[14px] font-medium text-white bg-[#0A84FF] hover:bg-[#0A84FF]/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(10,132,255,0.3)]"
                                >
                                    {isSubmitting ? 'Saving...' : (editingTask ? 'Save Changes' : 'Add Task')}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
