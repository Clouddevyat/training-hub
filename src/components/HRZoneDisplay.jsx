import React from 'react';
import { calculateZones } from '../data';

const HRZoneDisplay = ({ hrZone, profile, theme, darkMode }) => {
  const zones = calculateZones(
    profile.benchmarks?.maxHR?.value,
    profile.benchmarks?.aerobicThresholdHR?.value,
    profile.benchmarks?.anaerobicThresholdHR?.value
  );

  if (!zones || !hrZone) return null;
  const zone = zones[hrZone];
  if (!zone) return null;

  return (
    <div className={`p-3 ${darkMode ? 'bg-green-900/30' : 'bg-green-50'} rounded-lg flex items-center justify-between`}>
      <div>
        <p className={`text-xs font-medium ${darkMode ? 'text-sage-400' : 'text-sage-600'} uppercase`}>Target HR</p>
        <p className={`font-medium ${theme.text}`}>{zone.name}</p>
      </div>
      <div className="text-right">
        <span className={`text-xl font-bold font-mono ${theme.text}`}>{zone.min}-{zone.max}</span>
        <span className={`text-sm ${theme.textMuted} ml-1`}>bpm</span>
      </div>
    </div>
  );
};

export default HRZoneDisplay;
