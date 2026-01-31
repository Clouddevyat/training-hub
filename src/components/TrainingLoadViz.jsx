import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Mountain, Wind, AlertTriangle, Zap, Target } from 'lucide-react';

/**
 * Sparkline - Minimal inline trend visualization
 * High-altitude themed with gradient and glow effects
 */
const Sparkline = ({ data, color, height = 32, width = 80, showDots = false, theme, darkMode }) => {
  if (!data || data.length < 2) {
    return (
      <div
        className={`flex items-center justify-center ${theme?.textMuted || 'text-gray-500'}`}
        style={{ width, height }}
      >
        <span className="text-xs">--</span>
      </div>
    );
  }

  const padding = 4;
  const effectiveWidth = width - padding * 2;
  const effectiveHeight = height - padding * 2;

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * effectiveWidth;
    const y = padding + effectiveHeight - ((val - minVal) / range) * effectiveHeight;
    return { x, y, val };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Area fill path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

  const gradientId = `sparkline-gradient-${Math.random().toString(36).substr(2, 9)}`;
  const glowId = `sparkline-glow-${Math.random().toString(36).substr(2, 9)}`;

  // Trend indicator
  const trend = data[data.length - 1] - data[0];
  const trendPercent = ((trend / (data[0] || 1)) * 100).toFixed(0);

  return (
    <div className="relative">
      <svg width={width} height={height}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Area fill */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${glowId})`}
        />

        {/* End dot */}
        {showDots && (
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="3"
            fill={color}
            filter={`url(#${glowId})`}
          />
        )}
      </svg>
    </div>
  );
};

/**
 * TrainingLoadCard - ATL/CTL visualization with sparklines
 * High-altitude themed metrics display
 */
const TrainingLoadCard = ({
  atl,
  ctl,
  acr,
  atlHistory = [],
  ctlHistory = [],
  loadStatus,
  theme,
  darkMode
}) => {
  const statusConfig = useMemo(() => {
    const configs = {
      building: {
        icon: Mountain,
        color: '#3b82f6',
        bgClass: darkMode ? 'bg-blue-900/20' : 'bg-blue-50',
        borderClass: 'border-blue-500',
        label: 'Base Building',
        description: 'Establishing training foundation'
      },
      detraining: {
        icon: TrendingDown,
        color: '#eab308',
        bgClass: darkMode ? 'bg-yellow-900/20' : 'bg-yellow-50',
        borderClass: 'border-yellow-500',
        label: 'Detraining',
        description: 'Fitness declining - increase load'
      },
      optimal: {
        icon: Target,
        color: '#10b981',
        bgClass: darkMode ? 'bg-emerald-900/20' : 'bg-emerald-50',
        borderClass: 'border-emerald-500',
        label: 'Summit Zone',
        description: 'Optimal adaptation window'
      },
      caution: {
        icon: Wind,
        color: '#f97316',
        bgClass: darkMode ? 'bg-orange-900/20' : 'bg-orange-50',
        borderClass: 'border-orange-500',
        label: 'High Altitude',
        description: 'Pushing limits - monitor recovery'
      },
      overreaching: {
        icon: AlertTriangle,
        color: '#ef4444',
        bgClass: darkMode ? 'bg-red-900/20' : 'bg-red-50',
        borderClass: 'border-red-500',
        label: 'Death Zone',
        description: 'Injury risk - reduce load immediately'
      }
    };
    return configs[loadStatus] || configs.building;
  }, [loadStatus, darkMode]);

  const StatusIcon = statusConfig.icon;

  // Format ACR for display
  const formatACR = (value) => {
    if (!value || isNaN(value)) return '--';
    return value.toFixed(2);
  };

  return (
    <div className={`rounded-2xl border-l-4 ${statusConfig.borderClass} ${statusConfig.bgClass} p-4`}>
      {/* Header with status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${statusConfig.color}20` }}
          >
            <StatusIcon size={18} style={{ color: statusConfig.color }} />
          </div>
          <div>
            <h3 className={`font-semibold ${theme.text}`}>{statusConfig.label}</h3>
            <p className={`text-xs ${theme.textMuted}`}>{statusConfig.description}</p>
          </div>
        </div>

        {/* ACR Badge */}
        <div
          className="px-3 py-1.5 rounded-full font-mono font-bold text-sm"
          style={{
            backgroundColor: `${statusConfig.color}20`,
            color: statusConfig.color
          }}
        >
          {formatACR(acr)} ACR
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* ATL Card */}
        <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-800/50' : 'bg-white/70'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-medium ${theme.textMuted} uppercase tracking-wide`}>
              Acute (7d)
            </span>
            <Zap size={12} className="text-cyan-500" />
          </div>
          <div className="flex items-end justify-between">
            <span className={`text-2xl font-bold font-mono ${theme.text}`}>
              {Math.round(atl || 0)}
            </span>
            <Sparkline
              data={atlHistory}
              color="#06b6d4"
              height={28}
              width={60}
              showDots={true}
              theme={theme}
              darkMode={darkMode}
            />
          </div>
        </div>

        {/* CTL Card */}
        <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-800/50' : 'bg-white/70'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-medium ${theme.textMuted} uppercase tracking-wide`}>
              Chronic (28d)
            </span>
            <Mountain size={12} className="text-purple-500" />
          </div>
          <div className="flex items-end justify-between">
            <span className={`text-2xl font-bold font-mono ${theme.text}`}>
              {Math.round(ctl || 0)}
            </span>
            <Sparkline
              data={ctlHistory}
              color="#a855f7"
              height={28}
              width={60}
              showDots={true}
              theme={theme}
              darkMode={darkMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * LoadZoneMeter - Visual ACR zone indicator
 * Styled like an altitude/oxygen meter
 */
const LoadZoneMeter = ({ acr, theme, darkMode }) => {
  // Zone boundaries
  const zones = [
    { min: 0, max: 0.8, label: 'Detraining', color: '#eab308' },
    { min: 0.8, max: 1.3, label: 'Optimal', color: '#10b981' },
    { min: 1.3, max: 1.5, label: 'Caution', color: '#f97316' },
    { min: 1.5, max: 2.0, label: 'Danger', color: '#ef4444' },
  ];

  // Clamp ACR to displayable range
  const displayACR = Math.min(2.0, Math.max(0, acr || 0));
  const percentage = (displayACR / 2.0) * 100;

  // Find current zone
  const currentZone = zones.find(z => displayACR >= z.min && displayACR < z.max) || zones[zones.length - 1];

  return (
    <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-medium ${theme.textMuted} uppercase tracking-wide`}>
          Load Balance
        </span>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${currentZone.color}20`,
            color: currentZone.color
          }}
        >
          {currentZone.label}
        </span>
      </div>

      {/* Zone meter bar */}
      <div className="relative h-3 rounded-full overflow-hidden bg-gray-700/30">
        {/* Zone segments */}
        <div className="absolute inset-0 flex">
          {zones.map((zone, idx) => (
            <div
              key={idx}
              className="h-full"
              style={{
                width: `${((zone.max - zone.min) / 2.0) * 100}%`,
                backgroundColor: zone.color,
                opacity: 0.3
              }}
            />
          ))}
        </div>

        {/* Marker line */}
        <div
          className="absolute top-0 bottom-0 w-1 rounded-full transition-all duration-500"
          style={{
            left: `${percentage}%`,
            backgroundColor: currentZone.color,
            boxShadow: `0 0 8px ${currentZone.color}`
          }}
        />
      </div>

      {/* Zone labels */}
      <div className="flex justify-between mt-2">
        <span className={`text-[10px] ${theme.textMuted}`}>0.0</span>
        <span className={`text-[10px] ${theme.textMuted}`}>0.8</span>
        <span className={`text-[10px] ${theme.textMuted}`}>1.3</span>
        <span className={`text-[10px] ${theme.textMuted}`}>1.5</span>
        <span className={`text-[10px] ${theme.textMuted}`}>2.0</span>
      </div>
    </div>
  );
};

export { Sparkline, TrainingLoadCard, LoadZoneMeter };
export default TrainingLoadCard;
