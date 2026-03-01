'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Check, Trash2, CheckCheck, Inbox } from 'lucide-react';
import api from '@/lib/api';
import { formatDistanceToNow, format } from 'date-fns';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ThemedPage, ThemedNav } from '@/components/themed/ThemedPage';

interface Notification {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationsPage() {
    return (
        <ProtectedRoute>
            <NotificationsContent />
        </ProtectedRoute>
    );
}

function NotificationsContent() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.data.notifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllRead = async () => {
        try {
            await api.post('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.isRead)
        : notifications;

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Group by date
    const grouped = filteredNotifications.reduce<Record<string, Notification[]>>((acc, n) => {
        const dateKey = format(new Date(n.createdAt), 'yyyy-MM-dd');
        const label = isToday(n.createdAt) ? 'Today' :
            isYesterday(n.createdAt) ? 'Yesterday' :
                format(new Date(n.createdAt), 'MMMM d, yyyy');
        if (!acc[label]) acc[label] = [];
        acc[label].push(n);
        return acc;
    }, {});

    return (
        <ThemedPage className="pb-20">

            {/* Header */}
            <ThemedNav>
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <button onClick={() => router.push('/dashboard')} className="p-2 -ml-2 text-white/60 hover:text-white transition-colors flex items-center gap-2">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-[15px]">Dashboard</span>
                    </button>
                    <h1 className="text-[17px] font-medium text-white tracking-wide">Notifications</h1>
                    {unreadCount > 0 ? (
                        <button onClick={markAllRead} className="text-xs text-[#4F7CFF] hover:text-[#6B93FF] transition-colors flex items-center gap-1">
                            <CheckCheck className="w-4 h-4" /> Read All
                        </button>
                    ) : (
                        <div className="w-16"></div>
                    )}
                </div>
            </ThemedNav>

            <main className="relative z-10 max-w-2xl mx-auto px-6 pt-6">

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 mb-8 p-1 bg-white/[0.03] border border-white/5 rounded-2xl">
                    <button
                        onClick={() => setFilter('all')}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${filter === 'all'
                            ? 'bg-white/[0.06] text-white border border-white/10'
                            : 'text-white/40 hover:text-white/60'
                            }`}
                    >
                        All ({notifications.length})
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${filter === 'unread'
                            ? 'bg-[#4F7CFF]/10 text-[#4F7CFF] border border-[#4F7CFF]/20'
                            : 'text-white/40 hover:text-white/60'
                            }`}
                    >
                        Unread ({unreadCount})
                    </button>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-[#4F7CFF] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredNotifications.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center mb-6">
                            <Inbox className="w-10 h-10 text-white/10" />
                        </div>
                        <h3 className="text-white/60 text-lg font-medium mb-2">
                            {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
                        </h3>
                        <p className="text-white/30 text-sm max-w-xs">
                            {filter === 'unread'
                                ? "You've read all your notifications. Nice job staying on top of things!"
                                : "Your notifications will appear here when you start receiving reminders and check-ins."
                            }
                        </p>
                    </div>
                )}

                {/* Grouped Notifications */}
                {!loading && Object.entries(grouped).map(([dateLabel, items]) => (
                    <div key={dateLabel} className="mb-8">
                        <h3 className="text-xs uppercase tracking-[0.2em] text-white/30 font-bold mb-3 px-2">{dateLabel}</h3>
                        <div className="space-y-2">
                            {items.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-5 rounded-2xl border transition-all group cursor-pointer ${!notification.isRead
                                        ? 'bg-[#4F7CFF]/[0.03] border-[#4F7CFF]/10 hover:border-[#4F7CFF]/20'
                                        : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03]'
                                        }`}
                                    onClick={() => !notification.isRead && markAsRead(notification.id)}
                                >
                                    <div className="flex gap-4 items-start">
                                        {/* Unread indicator */}
                                        <div className="mt-1.5 shrink-0">
                                            {!notification.isRead ? (
                                                <div className="w-3 h-3 rounded-full bg-[#4F7CFF] shadow-[0_0_12px_rgba(79,124,255,0.5)]"></div>
                                            ) : (
                                                <div className="w-3 h-3 rounded-full bg-white/5"></div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <h4 className={`text-[15px] font-medium ${!notification.isRead ? 'text-white' : 'text-white/50'}`}>
                                                    {notification.title}
                                                </h4>
                                                <span className="text-[11px] text-white/20 whitespace-nowrap shrink-0">
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className={`text-sm leading-relaxed ${!notification.isRead ? 'text-white/60' : 'text-white/30'}`}>
                                                {notification.message}
                                            </p>

                                            {!notification.isRead && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                                                    className="mt-3 text-xs text-[#4F7CFF] hover:text-[#6B93FF] opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1"
                                                >
                                                    <Check className="w-3 h-3" /> Mark as read
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </main>
        </ThemedPage>
    );
}

function isToday(dateStr: string): boolean {
    const d = new Date(dateStr);
    const t = new Date();
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

function isYesterday(dateStr: string): boolean {
    const d = new Date(dateStr);
    const t = new Date();
    t.setDate(t.getDate() - 1);
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}
