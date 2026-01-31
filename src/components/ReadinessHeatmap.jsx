import React, { useMemo } from 'react';
import { Calendar, Mountain } from 'lucide-react';

/**
 * ReadinessHeatmap - GitHub-style contribution graph for readiness
 * High-altitude themed with elevation color coding
 */
const ReadinessHeatmap = ({
  readinessHistory = {},
  weeks = 6,
  theme,
  darkMode
}) => {
  // Generate calendar data for the heatmap
  const calendarData = useMemo(() => {
    const today = new Date();
    const data = [];
    const totalDays = weeks * 7;

    for (let i = totalDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const dayData = readinessHistory[dateKey];

      data.push({
        date: dateKey,
        dayOfWeek: date.getDay(),
        score: dayData?.score || null,
        isToday: i === 0,
        weekIndex: Math.floor((totalDays - 1 - i) / 7),
        dayName: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()]
      });
    }

    return data;
  }, [readinessHistory, weeks]);

  // Group by weeks for grid layout
  const weekGroups = useMemo(() => {
    const groups = [];
    for (let w = 0; w < weeks; w++) {
      groups.push(calendarData.filter(d => d.weekIndex === w));
    }
    return groups;
  }, [calendarData, weeks]);

  // Altitude-themed color scale
  const getScoreColor = (score) => {
    if (score === null) return darkMode ? 'bg-gray-800' : 'bg-gray-200';
    if (score >= 85) return 'bg-emerald-500'; // Summit
    if (score >= 70) return 'bg-cyan-500';    // High camp
    if (score >= 55) return 'bg-amber-500';   // Base camp
    if (score >= 40) return 'bg-orange-500';  // Foothills
    return 'bg-red-500';                       // Valley
  };

  const getScoreOpacity = (score) => {
    if (score === null) return 'opacity-30';
    if (score >= 85) return 'opacity-100';
    if (score >= 70) return 'opacity-90';
    if (score >= 55) return 'opacity-80';
    if (score >= 40) return 'opacity-70';
    return 'opacity-60';
  };

  // Stats calculation
  const stats = useMemo(() => {
    const validScores = calendarData
      .filter(d => d.score !== null)
      .map(d => d.score);

    if (validScores.length === 0) return null;

    return {
      average: Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length),
      highest: Math.max(...validScores),
      lowest: Math.min(...validScores),
      checkIns: validScores.length,
      streak: calculateStreak(calendarData)
    };
  }, [calendarData]);

  function calculateStreak(data) {
    let streak = 0;
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].score !== null) streak++;
      else break;
    }
    return streak;
  }

  return (
    <div className={`rounded-2xl ${darkMode ? 'bg-gray-800/30' : 'bg-gray-50'} p-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${darkMode ? 'bg-cyan-900/30' : 'bg-cyan-100'}`}>
            <Calendar size={18} className="text-cyan-500" />
          </div>
          <div>
            <h3 className={`font-semibold ${theme.text}`}>Readiness Map</h3>
            <p className={`text-xs ${theme.textMuted}`}>Last {weeks} weeks</p>
          </div>
        </div>

        {stats && (
          <div className="flex items-center gap-1 text-xs">
            <Mountain size={12} className="text-emerald-500" />
            <span className={theme.textMuted}>Avg:</span>
            <span className={`font-bold ${theme.text}`}>{stats.average}</span>
          </div>
        )}
      </div>

      {/* Heatmap Grid */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-2">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <div
              key={idx}
              className={`w-3 h-5 flex items-center justify-center text-[9px] ${theme.textMuted}`}
            >
              {idx % 2 === 1 ? day : ''}
            </div>
          ))}
        </div>

        {/* Week columns */}
        {weekGroups.map((week, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-1">
            {[0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => {
              const dayData = week.find(d => d.dayOfWeek === dayOfWeek);
              if (!dayData) {
                return <div key={dayOfWeek} className="w-5 h-5" />;
              }

              return (
                <div
                  key={dayOfWeek}
                  className={`w-5 h-5 rounded-sm ${getScoreColor(dayData.score)} ${getScoreOpacity(dayData.score)}
                    transition-all duration-200 hover:scale-125 hover:z-10 cursor-pointer
                    ${dayData.isToday ? 'ring-2 ring-cyan-400 ring-offset-1' : ''}`}
                  style={{
                    ringOffsetColor: darkMode ? '#1f2937' : '#f9fafb'
                  }}
                  title={`${dayData.date}: ${dayData.score !== null ? dayData.score : 'No data'}`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] ${theme.textMuted}`}>Low</span>
          <div className="flex gap-0.5">
            {['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-cyan-500', 'bg-emerald-500'].map((color, idx) => (
              <div
                key={idx}
                className={`w-3 h-3 rounded-sm ${color}`}
                style={{ opacity: 0.6 + idx * 0.1 }}
              />
            ))}
          </div>
          <span className={`text-[10px] ${theme.textMuted}`}>Summit</span>
        </div>

        {stats && (
          <div className="flex gap-3 text-[10px]">
            <span className={theme.textMuted}>
              <span className="font-medium text-emerald-500">{stats.checkIns}</span> check-ins
            </span>
            <span className={theme.textMuted}>
              <span className="font-medium text-cyan-500">{stats.streak}</span> day streak
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadinessHeatmap;
