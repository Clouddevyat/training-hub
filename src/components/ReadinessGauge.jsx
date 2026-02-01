import React, { useMemo } from 'react';
import { Mountain, Wind, Thermometer, Brain, Battery, Moon } from 'lucide-react';

/**
 * ReadinessGauge - High-altitude themed circular gauge visualization
 * Displays readiness score with mountain/altitude aesthetic
 */
const ReadinessGauge = ({
  score,
  readinessData,
  theme,
  darkMode,
  size = 'large' // 'small', 'medium', 'large'
}) => {
  const dimensions = {
    small: { width: 120, height: 120, strokeWidth: 8, fontSize: 'text-2xl' },
    medium: { width: 160, height: 160, strokeWidth: 10, fontSize: 'text-3xl' },
    large: { width: 200, height: 200, strokeWidth: 12, fontSize: 'text-4xl' }
  };

  const dim = dimensions[size] || dimensions.large;
  const radius = (dim.width - dim.strokeWidth) / 2 - 10;
  const centerX = dim.width / 2;
  const centerY = dim.height / 2;

  // Arc spans from -135deg to +135deg (270 degrees total)
  const startAngle = -225;
  const endAngle = 45;
  const totalAngle = 270;

  const polarToCartesian = (cx, cy, r, angleInDegrees) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians)
    };
  };

  const describeArc = (cx, cy, r, startAng, endAng) => {
    const start = polarToCartesian(cx, cy, r, endAng);
    const end = polarToCartesian(cx, cy, r, startAng);
    const largeArcFlag = endAng - startAng <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  const scoreAngle = useMemo(() => {
    const clampedScore = Math.max(0, Math.min(100, score || 0));
    return startAngle + (clampedScore / 100) * totalAngle;
  }, [score]);

  // Color zones for the gauge - Meridian Cairn palette
  const getScoreColor = (s) => {
    if (s >= 85) return { main: '#5A8B5E', glow: '#7A8B6F', label: 'Summit Ready' }; // Nominal/Sage - optimal
    if (s >= 70) return { main: '#4A7A9B', glow: '#6B9BB8', label: 'Base Camp' }; // Info - good state
    if (s >= 55) return { main: '#C4883A', glow: '#D4A05A', label: 'Acclimatizing' }; // Amber - adjusting
    if (s >= 40) return { main: '#B47A2E', glow: '#C4883A', label: 'Thin Air' }; // Amber dark - struggling
    return { main: '#C45A3A', glow: '#D47A5A', label: 'Altitude Sick' }; // Critical - danger zone
  };

  const colors = getScoreColor(score || 0);

  // Factor breakdown with altitude-themed icons - Meridian Cairn colors
  const factors = useMemo(() => {
    if (!readinessData) return [];
    return [
      {
        icon: Moon,
        label: 'Sleep',
        value: readinessData.sleepQuality,
        max: 5,
        color: readinessData.sleepQuality >= 4 ? '#5A8B5E' : readinessData.sleepQuality >= 3 ? '#C4883A' : '#C45A3A'
      },
      {
        icon: Battery,
        label: 'Energy',
        value: readinessData.energyLevel,
        max: 5,
        color: readinessData.energyLevel >= 4 ? '#5A8B5E' : readinessData.energyLevel >= 3 ? '#C4883A' : '#C45A3A'
      },
      {
        icon: Thermometer,
        label: 'Soreness',
        value: readinessData.soreness ? 6 - readinessData.soreness : null, // Inverted
        max: 5,
        color: readinessData.soreness <= 2 ? '#5A8B5E' : readinessData.soreness <= 3 ? '#C4883A' : '#C45A3A'
      },
      {
        icon: Brain,
        label: 'Drive',
        value: readinessData.motivation,
        max: 5,
        color: readinessData.motivation >= 4 ? '#5A8B5E' : readinessData.motivation >= 3 ? '#C4883A' : '#C45A3A'
      },
    ].filter(f => f.value != null);
  }, [readinessData]);

  // Gradient definitions for high-tech look
  const gradientId = `gauge-gradient-${size}`;
  const glowId = `gauge-glow-${size}`;

  return (
    <div className="flex flex-col items-center">
      {/* Main Gauge */}
      <div className="relative">
        <svg width={dim.width} height={dim.height} className="transform -rotate-0">
          <defs>
            {/* Gradient for the progress arc */}
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.main} stopOpacity="0.6" />
              <stop offset="50%" stopColor={colors.main} />
              <stop offset="100%" stopColor={colors.glow} />
            </linearGradient>

            {/* Glow filter for high-tech effect */}
            <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Mountain silhouette pattern */}
            <pattern id="mountain-pattern" patternUnits="userSpaceOnUse" width="40" height="20">
              <path
                d="M0 20 L10 8 L15 12 L25 4 L30 10 L40 20 Z"
                fill={darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}
              />
            </pattern>
          </defs>

          {/* Background circle with mountain pattern */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius - 15}
            fill="url(#mountain-pattern)"
            className={darkMode ? 'opacity-50' : 'opacity-30'}
          />

          {/* Track (background arc) */}
          <path
            d={describeArc(centerX, centerY, radius, startAngle, endAngle)}
            fill="none"
            stroke={darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
            strokeWidth={dim.strokeWidth}
            strokeLinecap="round"
          />

          {/* Tick marks for altitude feel */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const tickAngle = startAngle + (tick / 100) * totalAngle;
            const innerPoint = polarToCartesian(centerX, centerY, radius - dim.strokeWidth - 4, tickAngle);
            const outerPoint = polarToCartesian(centerX, centerY, radius + 4, tickAngle);
            return (
              <line
                key={tick}
                x1={innerPoint.x}
                y1={innerPoint.y}
                x2={outerPoint.x}
                y2={outerPoint.y}
                stroke={darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}

          {/* Progress arc with glow */}
          {score > 0 && (
            <path
              d={describeArc(centerX, centerY, radius, startAngle, scoreAngle)}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={dim.strokeWidth}
              strokeLinecap="round"
              filter={`url(#${glowId})`}
              className="transition-all duration-700 ease-out"
            />
          )}

          {/* Center content background */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius - dim.strokeWidth - 12}
            fill={darkMode ? 'rgba(17,24,39,0.8)' : 'rgba(255,255,255,0.9)'}
          />
        </svg>

        {/* Center content overlay */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ paddingBottom: size === 'large' ? '20px' : '10px' }}
        >
          {/* Mountain icon at top */}
          <Mountain
            size={size === 'large' ? 20 : 14}
            className={`mb-1 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}
            style={{ color: colors.main }}
          />

          {/* Score */}
          <span
            className={`${dim.fontSize} font-bold font-mono tracking-tight`}
            style={{ color: colors.main }}
          >
            {score || 0}
          </span>

          {/* Label */}
          <span
            className={`text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}
            style={{ fontSize: size === 'small' ? '8px' : '10px' }}
          >
            {colors.label}
          </span>
        </div>
      </div>

      {/* Factor breakdown - only show on medium/large */}
      {size !== 'small' && factors.length > 0 && (
        <div className="flex gap-3 mt-4">
          {factors.map((factor, idx) => {
            const Icon = factor.icon;
            const percentage = (factor.value / factor.max) * 100;
            return (
              <div
                key={idx}
                className={`flex flex-col items-center p-2 rounded-lg ${
                  darkMode ? 'bg-slate-800/50' : 'bg-slate-100/80'
                }`}
                style={{ minWidth: '52px' }}
              >
                <Icon size={14} style={{ color: factor.color }} />
                <div className="w-full h-1 rounded-full bg-slate-700/30 mt-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: factor.color
                    }}
                  />
                </div>
                <span className={`text-[9px] mt-1 ${theme.textMuted} uppercase`}>
                  {factor.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReadinessGauge;
