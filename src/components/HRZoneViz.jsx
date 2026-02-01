import React, { useMemo } from 'react';
import { Heart, Mountain, Wind, Flame, Zap, Activity } from 'lucide-react';
import { calculateZones } from '../data';

/**
 * HRZoneViz - High-altitude themed heart rate zone visualization
 * Shows all 5 zones with current target highlighted
 */
const HRZoneViz = ({
  targetZone,
  profile,
  theme,
  darkMode,
  compact = false
}) => {
  const zones = useMemo(() => {
    return calculateZones(
      profile?.benchmarks?.maxHR?.value,
      profile?.benchmarks?.aerobicThresholdHR?.value,
      profile?.benchmarks?.anaerobicThresholdHR?.value
    );
  }, [profile]);

  if (!zones) return null;

  // Zone configuration with altitude theme
  const zoneConfig = [
    {
      key: 1,
      name: 'Recovery',
      altitudeName: 'Sea Level',
      icon: Wind,
      color: '#94a3b8',
      gradient: ['#64748b', '#94a3b8'],
      description: 'Active recovery, easy breathing'
    },
    {
      key: 2,
      name: 'Aerobic',
      altitudeName: 'Foothills',
      icon: Mountain,
      color: '#22c55e',
      gradient: ['#16a34a', '#4ade80'],
      description: 'Fat burning, conversational pace'
    },
    {
      key: 3,
      name: 'Tempo',
      altitudeName: 'Base Camp',
      icon: Activity,
      color: '#eab308',
      gradient: ['#ca8a04', '#facc15'],
      description: 'Threshold work, controlled effort'
    },
    {
      key: 4,
      name: 'Threshold',
      altitudeName: 'High Camp',
      icon: Flame,
      color: '#f97316',
      gradient: ['#ea580c', '#fb923c'],
      description: 'Lactate threshold, hard effort'
    },
    {
      key: 5,
      name: 'VO2 Max',
      altitudeName: 'Death Zone',
      icon: Zap,
      color: '#ef4444',
      gradient: ['#dc2626', '#f87171'],
      description: 'Maximum effort, unsustainable'
    }
  ];

  // Get zone data with HR ranges
  const zoneData = zoneConfig.map(config => {
    const zoneInfo = zones[config.key];
    return {
      ...config,
      min: zoneInfo?.min || 0,
      max: zoneInfo?.max || 0,
      isTarget: targetZone === config.key
    };
  });

  const maxHR = profile?.benchmarks?.maxHR?.value || 200;

  if (compact) {
    // Compact horizontal bar view
    return (
      <div className={`p-3 rounded-xl ${darkMode ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Heart size={14} className="text-critical" />
            <span className={`text-xs font-medium ${theme.textMuted} uppercase`}>
              Target Zone
            </span>
          </div>
          {targetZone && zoneData[targetZone - 1] && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${zoneData[targetZone - 1].color}20`,
                color: zoneData[targetZone - 1].color
              }}
            >
              Z{targetZone}: {zoneData[targetZone - 1].min}-{zoneData[targetZone - 1].max} bpm
            </span>
          )}
        </div>

        {/* Zone bar */}
        <div className="flex h-6 rounded-lg overflow-hidden">
          {zoneData.map((zone, idx) => {
            const widthPercent = ((zone.max - zone.min) / maxHR) * 100;
            const Icon = zone.icon;
            return (
              <div
                key={zone.key}
                className={`relative flex items-center justify-center transition-all duration-300 ${
                  zone.isTarget ? 'ring-2 ring-white ring-offset-1 z-10' : ''
                }`}
                style={{
                  width: `${Math.max(widthPercent, 15)}%`,
                  background: `linear-gradient(135deg, ${zone.gradient[0]}, ${zone.gradient[1]})`,
                  opacity: zone.isTarget ? 1 : 0.5
                }}
              >
                {zone.isTarget && (
                  <Icon size={14} className="text-white drop-shadow-md" />
                )}
              </div>
            );
          })}
        </div>

        {/* Zone labels */}
        <div className="flex justify-between mt-1.5">
          {zoneData.map(zone => (
            <span
              key={zone.key}
              className={`text-[10px] font-mono ${
                zone.isTarget ? 'font-bold' : ''
              }`}
              style={{ color: zone.isTarget ? zone.color : theme.textMuted }}
            >
              Z{zone.key}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // Full view with all zone details
  return (
    <div className={`rounded-2xl ${darkMode ? 'bg-slate-800/30' : 'bg-gray-50'} p-4`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-lg ${darkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
          <Heart size={18} className="text-critical" />
        </div>
        <div>
          <h3 className={`font-semibold ${theme.text}`}>Heart Rate Zones</h3>
          <p className={`text-xs ${theme.textMuted}`}>
            Based on Max HR: {maxHR} bpm
          </p>
        </div>
      </div>

      {/* Visual zone bar */}
      <div className="mb-4">
        <div className="flex h-8 rounded-xl overflow-hidden shadow-inner">
          {zoneData.map((zone) => {
            const widthPercent = ((zone.max - zone.min) / maxHR) * 100;
            return (
              <div
                key={zone.key}
                className={`relative flex items-center justify-center transition-all duration-500 ${
                  zone.isTarget ? 'scale-y-110 z-10' : ''
                }`}
                style={{
                  width: `${Math.max(widthPercent, 12)}%`,
                  background: `linear-gradient(180deg, ${zone.gradient[1]}, ${zone.gradient[0]})`,
                  opacity: zone.isTarget ? 1 : 0.6,
                  boxShadow: zone.isTarget ? `0 0 20px ${zone.color}` : 'none'
                }}
              >
                <span className="text-white text-xs font-bold drop-shadow-md">
                  Z{zone.key}
                </span>
              </div>
            );
          })}
        </div>

        {/* HR scale */}
        <div className="flex justify-between mt-1 px-1">
          {zoneData.map((zone, idx) => (
            <span key={zone.key} className={`text-[10px] font-mono ${theme.textMuted}`}>
              {zone.min}
            </span>
          ))}
          <span className={`text-[10px] font-mono ${theme.textMuted}`}>
            {maxHR}
          </span>
        </div>
      </div>

      {/* Zone list */}
      <div className="space-y-2">
        {zoneData.map((zone) => {
          const Icon = zone.icon;
          return (
            <div
              key={zone.key}
              className={`flex items-center p-2.5 rounded-xl transition-all duration-300 ${
                zone.isTarget
                  ? darkMode
                    ? 'bg-slate-700/70 ring-2'
                    : 'bg-white ring-2 shadow-md'
                  : darkMode
                    ? 'bg-slate-800/30'
                    : 'bg-white/50'
              }`}
              style={{
                ringColor: zone.isTarget ? zone.color : 'transparent'
              }}
            >
              {/* Zone indicator */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                style={{
                  background: `linear-gradient(135deg, ${zone.gradient[0]}, ${zone.gradient[1]})`,
                  opacity: zone.isTarget ? 1 : 0.7
                }}
              >
                <Icon size={18} className="text-white" />
              </div>

              {/* Zone info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${theme.text}`}>
                    Zone {zone.key}
                  </span>
                  <span className={`text-xs ${theme.textMuted}`}>
                    {zone.altitudeName}
                  </span>
                </div>
                <p className={`text-xs ${theme.textMuted} truncate`}>
                  {zone.description}
                </p>
              </div>

              {/* HR range */}
              <div className="text-right ml-2">
                <span
                  className="font-mono font-bold"
                  style={{ color: zone.isTarget ? zone.color : theme.text }}
                >
                  {zone.min}-{zone.max}
                </span>
                <span className={`text-xs ${theme.textMuted} ml-1`}>bpm</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HRZoneViz;
