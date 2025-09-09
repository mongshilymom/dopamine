import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { format, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, Clock, Target, TrendingUp, Award } from 'lucide-react';
import { useAppStore } from '../stores/app';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface StatisticsProps {
  className?: string;
}

export const Statistics: React.FC<StatisticsProps> = ({ className = '' }) => {
  const {
    recentSessions,
    sinceWakeStats,
    profile,
    loadRecentSessions,
    loadSinceWakeStats
  } = useAppStore();

  const [chartData, setChartData] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any>(null);

  useEffect(() => {
    loadRecentSessions();
    loadSinceWakeStats();
  }, [loadRecentSessions, loadSinceWakeStats]);

  // Process session data for daily focus time chart
  useEffect(() => {
    if (recentSessions.length > 0) {
      // Group sessions by date
      const sessionsByDate = recentSessions.reduce((acc, session) => {
        const date = format(new Date(session.started_at), 'yyyy-MM-dd');
        if (!acc[date]) {
          acc[date] = { focus: 0, break: 0, total: 0 };
        }

        const duration = session.actual_duration || 0;
        if (session.session_type === 'focus') {
          acc[date].focus += duration;
        } else {
          acc[date].break += duration;
        }
        acc[date].total += duration;

        return acc;
      }, {} as Record<string, { focus: number; break: number; total: number }>);

      // Generate last 7 days data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), i);
        const dateKey = format(date, 'yyyy-MM-dd');
        const dayData = sessionsByDate[dateKey] || { focus: 0, break: 0, total: 0 };

        return {
          date: format(date, 'MM/dd', { locale: ko }),
          focus: dayData.focus,
          break: dayData.break,
          total: dayData.total
        };
      }).reverse();

      setChartData({
        labels: last7Days.map(d => d.date),
        datasets: [
          {
            label: '집중 시간',
            data: last7Days.map(d => d.focus),
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: '휴식 시간',
            data: last7Days.map(d => d.break),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      });

      // Weekly summary for bar chart
      const weeklyTotal = last7Days.reduce((acc, day) => ({
        focus: acc.focus + day.focus,
        break: acc.break + day.break,
        total: acc.total + day.total
      }), { focus: 0, break: 0, total: 0 });

      setWeeklyData({
        labels: ['이번 주'],
        datasets: [
          {
            label: '집중 시간 (분)',
            data: [weeklyTotal.focus],
            backgroundColor: 'rgba(239, 68, 68, 0.8)'
          },
          {
            label: '휴식 시간 (분)',
            data: [weeklyTotal.break],
            backgroundColor: 'rgba(34, 197, 94, 0.8)'
          }
        ]
      });
    }
  }, [recentSessions]);

  const chartOptions = {
    responsive: true,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y}분`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: '날짜'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: '시간 (분)'
        },
        beginAtZero: true
      }
    }
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: '시간 (분)'
        }
      }
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          집중 통계
        </h2>
        <p className="text-gray-600">
          당신의 집중 패턴과 성과를 한눈에 확인하세요
        </p>
      </div>

      {/* Today's Stats */}
      {sinceWakeStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200"
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">
              오늘의 집중 현황
            </h3>
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              {format(new Date(sinceWakeStats.wake_time), 'HH:mm')} 기준
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {sinceWakeStats.sessions_count}
              </div>
              <div className="text-sm text-blue-700">총 세션</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {sinceWakeStats.completed_sessions}
              </div>
              <div className="text-sm text-green-700">완료 세션</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(sinceWakeStats.total_minutes)}분
              </div>
              <div className="text-sm text-purple-700">집중 시간</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {sinceWakeStats.tasks_completed}
              </div>
              <div className="text-sm text-orange-700">완료 작업</div>
            </div>
          </div>

          {sinceWakeStats.sessions_count > 0 && (
            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <div className="text-sm text-blue-800">
                완료율: {Math.round((sinceWakeStats.completed_sessions / sinceWakeStats.sessions_count) * 100)}%
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-gray-900">평균 집중 시간</h4>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {recentSessions.length > 0
              ? Math.round(
                  recentSessions
                    .filter(s => s.session_type === 'focus' && s.actual_duration)
                    .reduce((sum, s) => sum + (s.actual_duration || 0), 0) /
                  Math.max(1, recentSessions.filter(s => s.session_type === 'focus' && s.actual_duration).length)
                )
              : 0
            }분
          </div>
          <p className="text-sm text-gray-600">최근 집중 세션 기준</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <Target className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-gray-900">완료율</h4>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {recentSessions.length > 0
              ? Math.round(
                  (recentSessions.filter(s => s.completion_reason === 'completed').length /
                   recentSessions.length) * 100
                )
              : 0
            }%
          </div>
          <p className="text-sm text-gray-600">최근 세션 완료율</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-gray-900">연속 달성</h4>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {profile?.current_streak || 0}일
          </div>
          <p className="text-sm text-gray-600">현재 연속 기록</p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Focus Time Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            일별 집중 시간 추이
          </h4>
          {chartData ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>아직 데이터가 없습니다</p>
                <p className="text-sm">집중 세션을 시작해보세요!</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Weekly Summary */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            이번 주 요약
          </h4>
          {weeklyData ? (
            <Bar data={weeklyData} options={barOptions} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Award className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>주간 데이터 준비 중</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Achievements Preview */}
      {profile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200"
        >
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-purple-900">
              성취 및 보상
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {profile.total_points}
              </div>
              <div className="text-sm text-purple-700">총 포인트</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">
                {profile.badges_earned?.length || 0}
              </div>
              <div className="text-sm text-pink-700">획득 배지</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {profile.current_streak}
              </div>
              <div className="text-sm text-indigo-700">현재 연속</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {profile.longest_streak}
              </div>
              <div className="text-sm text-orange-700">최고 연속</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tips for Improvement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
      >
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          💡 집중력 향상 팁
        </h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h5 className="font-medium text-gray-800">효과적인 집중을 위해:</h5>
            <ul className="text-gray-600 space-y-1">
              <li>• 같은 시간대에 집중 세션 시작하기</li>
              <li>• If-Then 계획으로 구체적인 목표 설정</li>
              <li>• 방해 요소 미리 정리하기</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h5 className="font-medium text-gray-800">지속 가능한 습관:</h5>
            <ul className="text-gray-600 space-y-1">
              <li>• 짧은 세션부터 시작하여 점진적 확장</li>
              <li>• 휴식 시간을 제대로 활용하기</li>
              <li>• 성취한 것들을 기록하고 축하하기</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Statistics;
