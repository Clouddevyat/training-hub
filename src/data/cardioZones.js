// Cardio Zone Templates and Session Types

export const CARDIO_ZONES = {
  zone1: { id: 'zone1', name: 'Zone 1 - Recovery', hrPercent: [50, 60], rpe: [1, 2], description: 'Very easy, full conversation' },
  zone2: { id: 'zone2', name: 'Zone 2 - Aerobic Base', hrPercent: [60, 70], rpe: [3, 4], description: 'Easy, can hold conversation' },
  zone3: { id: 'zone3', name: 'Zone 3 - Tempo', hrPercent: [70, 80], rpe: [5, 6], description: 'Comfortably hard, short sentences' },
  zone4: { id: 'zone4', name: 'Zone 4 - Threshold', hrPercent: [80, 90], rpe: [7, 8], description: 'Hard, few words at a time' },
  zone5: { id: 'zone5', name: 'Zone 5 - VO2 Max', hrPercent: [90, 100], rpe: [9, 10], description: 'Max effort, no talking' },
};

export const CARDIO_SESSION_TEMPLATES = {
  zone2Steady: { id: 'zone2Steady', name: 'Zone 2 Steady State', zone: 'zone2', structure: 'continuous', durationRange: [30, 90] },
  tempoIntervals: { id: 'tempoIntervals', name: 'Tempo Intervals', zone: 'zone3', structure: 'intervals', workRest: '5:2', durationRange: [30, 50] },
  thresholdIntervals: { id: 'thresholdIntervals', name: 'Threshold Intervals', zone: 'zone4', structure: 'intervals', workRest: '4:2', durationRange: [35, 50] },
  longSlow: { id: 'longSlow', name: 'Long Slow Distance', zone: 'zone2', structure: 'continuous', durationRange: [90, 240] },
  fartlek: { id: 'fartlek', name: 'Fartlek', zone: 'mixed', structure: 'fartlek', durationRange: [30, 60] },
  hillRepeats: { id: 'hillRepeats', name: 'Hill Repeats', zone: 'zone4', structure: 'intervals', durationRange: [30, 45] },
};

// Calculate heart rate zones based on max HR
export const calculateZones = (maxHR, aetHR, antHR) => {
  if (!maxHR) return null;
  return {
    zone1: { min: Math.round(maxHR * 0.50), max: Math.round(maxHR * 0.60), name: 'Recovery' },
    zone2: { min: Math.round(maxHR * 0.60), max: Math.round(maxHR * 0.70), name: 'Aerobic Base' },
    zone3: { min: Math.round(maxHR * 0.70), max: Math.round(maxHR * 0.80), name: 'Tempo' },
    zone4: { min: Math.round(maxHR * 0.80), max: Math.round(maxHR * 0.90), name: 'Threshold' },
    zone5: { min: Math.round(maxHR * 0.90), max: maxHR, name: 'VO2 Max' },
    aet: aetHR || Math.round(maxHR * 0.75),
    ant: antHR || Math.round(maxHR * 0.85),
  };
};

// Calculate load targets based on body weight
export const calculateLoadTargets = (weight) => {
  if (!weight) return null;
  return {
    light: Math.round(weight * 0.15),
    base: Math.round(weight * 0.20),
    standard: Math.round(weight * 0.25),
    peak: Math.round(weight * 0.30),
  };
};
