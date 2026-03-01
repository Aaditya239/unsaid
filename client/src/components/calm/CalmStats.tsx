'use client';

import { motion } from 'framer-motion';
import { Clock, Heart, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CalmStats as CalmStatsType } from '@/lib/calm';

interface CalmStatsProps {
  stats: CalmStatsType | null;
  isLoading: boolean;
}

export const CalmStats = ({ stats, isLoading }: CalmStatsProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <motion.div
          className="w-8 h-8 border-3 border-cream-200 border-t-blush-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  if (!stats || stats.totalSessions === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-warm-500">
          Complete a session to see your calm journey stats
        </p>
      </div>
    );
  }

  const statCards = [
    {
      icon: Clock,
      label: 'Total Time',
      value: `${stats.totalMinutes} min`,
      color: 'from-blue-400 to-cyan-500',
    },
    {
      icon: Heart,
      label: 'Sessions',
      value: stats.totalSessions,
      color: 'from-blush-400 to-rose-500',
    },
    {
      icon: Target,
      label: 'Focus Sessions',
      value: stats.focusSessions,
      color: 'from-purple-400 to-pink-500',
    },
    {
      icon: TrendingUp,
      label: 'Avg Length',
      value: `${stats.averageSessionLength} min`,
      color: 'from-green-400 to-emerald-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-cream-200 shadow-soft"
          >
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center mb-3',
                `bg-gradient-to-r ${stat.color} text-white`
              )}
            >
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-serif font-semibold text-warm-800">
              {stat.value}
            </p>
            <p className="text-sm text-warm-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Favorite sounds */}
      {stats.favoriteSounds.length > 0 && (
        <div className="p-5 rounded-2xl bg-white/60 backdrop-blur-sm border border-cream-200 shadow-soft">
          <h4 className="font-semibold text-warm-800 mb-3">Favorite Sounds</h4>
          <div className="flex flex-wrap gap-2">
            {stats.favoriteSounds.slice(0, 3).map((item, index) => (
              <motion.span
                key={item.sound}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm',
                  index === 0
                    ? 'bg-blush-100 text-blush-700 font-medium'
                    : 'bg-cream-100 text-warm-600'
                )}
              >
                {item.sound} ({item.count})
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalmStats;