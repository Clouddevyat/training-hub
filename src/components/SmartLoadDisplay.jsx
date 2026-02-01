import React from 'react';

const SmartLoadDisplay = ({ prescription, profile, theme, darkMode, currentWeek }) => {
  if (prescription.loadType !== 'bodyweight_percentage') return null;

  const weight = profile.weight || 225;
  let loadPercent = prescription.load;
  let extraInfo = null;

  if (prescription.progression) {
    for (const [weekRange, data] of Object.entries(prescription.progression)) {
      const match = weekRange.match(/Weeks? (\d+)-?(\d+)?/);
      if (match) {
        const start = parseInt(match[1]);
        const end = match[2] ? parseInt(match[2]) : start;
        if (currentWeek >= start && currentWeek <= end) {
          loadPercent = data.load;
          extraInfo = data;
          break;
        }
      }
    }
  }

  const loadWeight = loadPercent ? Math.round(weight * (loadPercent / 100)) : null;
  if (!loadWeight) return null;

  return (
    <div className={`p-4 ${darkMode ? 'bg-orange-900/30' : 'bg-orange-50'} rounded-lg`}>
      <p className={`text-xs font-medium ${darkMode ? 'text-amber-400' : 'text-orange-600'} uppercase mb-2`}>
        Load Target (Week {currentWeek})
      </p>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold font-mono ${theme.text}`}>{loadWeight} lbs</span>
        <span className={theme.textMuted}>({loadPercent}% of {weight} BW)</span>
      </div>
      {extraInfo?.steps && (
        <p className={`text-sm ${theme.textMuted} mt-1`}>Target: {extraInfo.steps} steps</p>
      )}
      {extraInfo?.duration && (
        <p className={`text-sm ${theme.textMuted} mt-1`}>Duration: {extraInfo.duration} min</p>
      )}
    </div>
  );
};

export default SmartLoadDisplay;
