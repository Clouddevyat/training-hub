// Progression Models and Mesocycle Templates

export const PROGRESSION_MODELS = {
  custom: {
    id: 'custom',
    name: 'Custom',
    description: 'Manually set intensity/volume for each exercise',
    icon: '✏️',
    generateWeeks: (weeks) => {
      return Array.from({ length: weeks }, (_, i) => ({
        week: i + 1,
        intensity: null,
        sets: null,
        reps: null,
        rpe: null,
        isCustom: true,
      }));
    },
  },
  linear: {
    id: 'linear',
    name: 'Linear Periodization',
    description: 'Gradually increase intensity while maintaining volume',
    icon: '📈',
    generateWeeks: (weeks, startIntensity = 70) => {
      const endIntensity = Math.min(startIntensity + 20, 95);
      const increment = (endIntensity - startIntensity) / Math.max(weeks - 1, 1);
      return Array.from({ length: weeks }, (_, i) => {
        const isDeload = (i + 1) % 4 === 0;
        return {
          week: i + 1,
          intensity: isDeload ? Math.round(startIntensity * 0.85) : Math.round(startIntensity + (increment * i)),
          setsMultiplier: isDeload ? 0.5 : 1,
          rpeAdjust: isDeload ? -2 : 0,
          isDeload,
        };
      });
    },
  },
  undulatingDaily: {
    id: 'undulatingDaily',
    name: 'Daily Undulating (DUP)',
    description: 'Vary intensity and volume each training day',
    icon: '🌊',
    dayPatterns: [
      { name: 'Strength', sets: 5, reps: '3-5', intensity: 85, rpe: 8 },
      { name: 'Hypertrophy', sets: 4, reps: '8-12', intensity: 70, rpe: 7 },
      { name: 'Power', sets: 4, reps: '2-3', intensity: 75, rpe: 7, note: 'Explosive' },
    ],
    generateWeeks: (weeks, startIntensity = 70) => {
      return Array.from({ length: weeks }, (_, i) => {
        const isDeload = (i + 1) % 4 === 0;
        return {
          week: i + 1,
          pattern: 'DUP',
          focus: isDeload ? 'Deload' : 'Daily Undulating',
          intensity: isDeload ? Math.round(startIntensity * 0.8) : startIntensity,
          setsMultiplier: isDeload ? 0.6 : 1,
          rpeAdjust: isDeload ? -2 : 0,
          isDeload,
        };
      });
    },
  },
  undulatingWeekly: {
    id: 'undulatingWeekly',
    name: 'Weekly Undulating',
    description: 'Vary intensity each week (Volume → Intensity → Peak → Deload)',
    icon: '📊',
    generateWeeks: (weeks, startIntensity = 70) => {
      const pattern = [
        { focus: 'Volume', intensityAdjust: -5, setsMultiplier: 1, rpeAdjust: -1 },
        { focus: 'Intensity', intensityAdjust: 5, setsMultiplier: 1, rpeAdjust: 0 },
        { focus: 'Peak', intensityAdjust: 10, setsMultiplier: 1.25, rpeAdjust: 1 },
        { focus: 'Deload', intensityAdjust: -15, setsMultiplier: 0.5, rpeAdjust: -2, isDeload: true },
      ];
      return Array.from({ length: weeks }, (_, i) => {
        const p = pattern[i % pattern.length];
        return {
          week: i + 1,
          focus: p.focus,
          intensity: Math.round(startIntensity + p.intensityAdjust),
          setsMultiplier: p.setsMultiplier,
          rpeAdjust: p.rpeAdjust,
          isDeload: p.isDeload || false,
        };
      });
    },
  },
  block: {
    id: 'block',
    name: 'Block Periodization',
    description: 'Accumulation → Transmutation → Realization phases',
    icon: '🧱',
    generateWeeks: (weeks, startIntensity = 70) => {
      const accumWeeks = Math.ceil(weeks * 0.4);
      const transWeeks = Math.ceil(weeks * 0.35);

      return Array.from({ length: weeks }, (_, i) => {
        if (i < accumWeeks) {
          return { week: i + 1, phase: 'Accumulation', focus: 'Volume', intensity: startIntensity + (i * 2), setsMultiplier: 1.2, rpeAdjust: -1 };
        } else if (i < accumWeeks + transWeeks) {
          return { week: i + 1, phase: 'Transmutation', focus: 'Intensity', intensity: startIntensity + 10 + ((i - accumWeeks) * 3), setsMultiplier: 1, rpeAdjust: 0 };
        } else {
          const realIdx = i - accumWeeks - transWeeks;
          return { week: i + 1, phase: 'Realization', focus: 'Peak', intensity: startIntensity + 20 + (realIdx * 2), setsMultiplier: 0.75, rpeAdjust: 1 };
        }
      });
    },
  },
  maintenance: {
    id: 'maintenance',
    name: 'Maintenance',
    description: 'Preserve fitness with reduced volume',
    icon: '⚖️',
    generateWeeks: (weeks, startIntensity = 70) => {
      return Array.from({ length: weeks }, (_, i) => ({
        week: i + 1,
        intensity: startIntensity,
        setsMultiplier: 0.5,
        rpeAdjust: -1,
        note: 'Maintenance',
      }));
    },
  },
  conjugate: {
    id: 'conjugate',
    name: 'Conjugate/Westside',
    description: 'Max Effort & Dynamic Effort waves with weekly variation',
    icon: '🔀',
    generateWeeks: (weeks, startIntensity = 70) => {
      return Array.from({ length: weeks }, (_, i) => {
        const isDeload = (i + 1) % 4 === 0;
        const waveIntensity = [0, 5, 10, -10];
        return {
          week: i + 1,
          pattern: 'Conjugate',
          focus: isDeload ? 'Deload' : `Wave ${(i % 3) + 1}`,
          intensity: startIntensity + waveIntensity[i % 4],
          setsMultiplier: isDeload ? 0.5 : 1,
          rpeAdjust: isDeload ? -2 : (i % 3),
          isDeload,
        };
      });
    },
  },
};

// Mesocycle Templates
export const MESO_TEMPLATES = {
  hypertrophy: { id: 'hypertrophy', name: 'Hypertrophy', weeks: 4, icon: '💪', progression: 'linear', defaultSets: 4, defaultReps: '8-12', defaultIntensity: 65 },
  strength: { id: 'strength', name: 'Strength', weeks: 4, icon: '🏋️', progression: 'linear', defaultSets: 4, defaultReps: '4-6', defaultIntensity: 80 },
  power: { id: 'power', name: 'Power', weeks: 3, icon: '⚡', progression: 'undulatingDaily', defaultSets: 4, defaultReps: '2-4', defaultIntensity: 75 },
  peaking: { id: 'peaking', name: 'Peaking', weeks: 2, icon: '🎯', progression: 'block', defaultSets: 3, defaultReps: '1-3', defaultIntensity: 90 },
  deload: { id: 'deload', name: 'Deload', weeks: 1, icon: '😴', progression: 'maintenance', defaultSets: 2, defaultReps: '6-8', defaultIntensity: 60 },
  aerobicBase: { id: 'aerobicBase', name: 'Aerobic Base', weeks: 6, icon: '❤️', progression: 'linear', isCardioFocused: true },
  muscularEndurance: { id: 'muscularEndurance', name: 'Muscular Endurance', weeks: 4, icon: '🔥', progression: 'linear', defaultSets: 3, defaultReps: '15-20', defaultIntensity: 55 },
};
