// Progression Models and Mesocycle Templates
// Each model defines HOW training progresses over time and which tracks it works with

// ============== HELPER FUNCTIONS ==============

// Parse rep range string to get base rep value
const parseReps = (reps) => {
  if (typeof reps === 'number') return reps;
  if (typeof reps !== 'string') return 8;
  const match = reps.match(/(\d+)/);
  return match ? parseInt(match[1]) : 8;
};

// Shift rep range by amount (e.g., "8-10" shifted by -2 becomes "6-8")
const shiftRepRange = (reps, shift) => {
  if (typeof reps === 'number') return Math.max(1, reps + shift);
  if (typeof reps !== 'string') return reps;

  if (reps.includes('-')) {
    const [low, high] = reps.split('-').map(n => parseInt(n.trim()));
    const newLow = Math.max(1, low + shift);
    const newHigh = Math.max(newLow, high + shift);
    return `${newLow}-${newHigh}`;
  }

  const base = parseInt(reps) || 8;
  return `${Math.max(1, base + shift)}`;
};

// ============== PROGRESSION MODELS ==============

export const PROGRESSION_MODELS = {
  // ============== CUSTOM ==============
  custom: {
    id: 'custom',
    name: 'Custom',
    description: 'Manually set intensity/volume for each exercise',
    icon: '✏️',
    compatibleTracks: ['strength', 'hypertrophy', 'power', 'endurance', 'peaking'],
    requiresSpecialTemplate: false,
    dayTypes: null,

    generateWeeks: (weeks, track = null) => {
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

  // ============== LINEAR PERIODIZATION ==============
  // Classic progressive overload: intensity increases, reps decrease
  linear: {
    id: 'linear',
    name: 'Linear Periodization',
    description: 'Gradually increase intensity while decreasing reps. Classic progressive overload.',
    icon: '📈',
    compatibleTracks: ['strength', 'hypertrophy', 'power', 'endurance', 'peaking'],
    requiresSpecialTemplate: false,
    dayTypes: null,

    // Rep progression patterns by track (indexed by week within 4-week block)
    repProgressions: {
      strength: [
        { repShift: 0, intensityAdd: 0 },    // Week 1: Base
        { repShift: -1, intensityAdd: 3 },   // Week 2: Build
        { repShift: -2, intensityAdd: 6 },   // Week 3: Peak
        { repShift: 0, intensityAdd: -12, isDeload: true }, // Week 4: Deload
      ],
      hypertrophy: [
        { repShift: 2, intensityAdd: 0 },     // Week 1: Higher reps
        { repShift: 0, intensityAdd: 3 },     // Week 2: Moderate
        { repShift: -2, intensityAdd: 6 },    // Week 3: Lower reps, higher intensity
        { repShift: 0, intensityAdd: -10, isDeload: true }, // Week 4: Deload
      ],
      power: [
        { repShift: 0, intensityAdd: 0 },     // Week 1: Base velocity work
        { repShift: 0, intensityAdd: 3 },     // Week 2: Slight intensity increase
        { repShift: -1, intensityAdd: 5 },    // Week 3: Peak power output
        { repShift: 0, intensityAdd: -10, isDeload: true }, // Week 4: Deload
      ],
      endurance: [
        { repShift: 0, intensityAdd: 0 },
        { repShift: -2, intensityAdd: 2 },
        { repShift: -4, intensityAdd: 4 },
        { repShift: 0, intensityAdd: -8, isDeload: true },
      ],
      peaking: [
        { repShift: 0, intensityAdd: 0 },     // Week 1: Openers
        { repShift: -1, intensityAdd: 3 },    // Week 2: Heavy singles/doubles
        { repShift: -1, intensityAdd: 5 },    // Week 3: Near-max
        { repShift: 0, intensityAdd: -15, isDeload: true }, // Week 4: Competition prep
      ],
    },

    generateWeeks: (weeks, track = null) => {
      const trackId = track?.id || track || 'strength';
      const progression = PROGRESSION_MODELS.linear.repProgressions[trackId] ||
                         PROGRESSION_MODELS.linear.repProgressions.strength;

      return Array.from({ length: weeks }, (_, i) => {
        const weekInBlock = i % 4;
        const blockNum = Math.floor(i / 4);
        const p = progression[weekInBlock];

        // Each 4-week block increases base intensity slightly
        const blockIntensityBoost = blockNum * 3;

        return {
          week: i + 1,
          repShift: p.repShift,
          intensityAdjust: p.intensityAdd + blockIntensityBoost,
          setsMultiplier: p.isDeload ? 0.5 : 1,
          rpeAdjust: p.isDeload ? -2 : (weekInBlock === 2 ? 1 : 0),
          isDeload: p.isDeload || false,
          focus: p.isDeload ? 'Deload' : ['Base', 'Build', 'Peak', 'Deload'][weekInBlock],
          blockNumber: blockNum + 1,
        };
      });
    },
  },

  // ============== DAILY UNDULATING PERIODIZATION (DUP) ==============
  // Different stimulus each training day: Strength, Hypertrophy, Power rotation
  undulatingDaily: {
    id: 'undulatingDaily',
    name: 'Daily Undulating (DUP)',
    description: 'Rotate between Strength, Hypertrophy, and Power focus each training day.',
    icon: '🌊',
    compatibleTracks: ['strength', 'hypertrophy', 'power'],
    requiresSpecialTemplate: false,

    // These day types get assigned to strength training days in the weekly template
    dayTypes: [
      {
        id: 'dup_strength',
        name: 'Strength',
        shortName: 'STR',
        color: 'red',
        sets: 5,
        reps: '3-5',
        intensity: 85,
        rpe: 8,
        description: 'Heavy weight, low reps, long rest'
      },
      {
        id: 'dup_hypertrophy',
        name: 'Hypertrophy',
        shortName: 'HYP',
        color: 'purple',
        sets: 4,
        reps: '8-12',
        intensity: 70,
        rpe: 7,
        description: 'Moderate weight, higher reps, muscle building'
      },
      {
        id: 'dup_power',
        name: 'Power',
        shortName: 'PWR',
        color: 'yellow',
        sets: 5,
        reps: '2-3',
        intensity: 75,
        rpe: 7,
        note: 'Explosive - focus on bar speed',
        description: 'Moderate weight, explosive movement, velocity focus'
      },
    ],

    generateWeeks: (weeks, track = null) => {
      return Array.from({ length: weeks }, (_, i) => {
        const isDeload = (i + 1) % 4 === 0;
        const weekInBlock = i % 4;

        return {
          week: i + 1,
          pattern: 'DUP',
          focus: isDeload ? 'Deload' : 'Daily Undulating',
          // DUP uses its dayTypes to determine per-day prescription
          // Week-level intensity is a baseline; each day type overrides
          intensityAdjust: isDeload ? -15 : (weekInBlock * 2), // Slight weekly progression
          setsMultiplier: isDeload ? 0.6 : 1,
          rpeAdjust: isDeload ? -2 : 0,
          isDeload,
          // dayTypeAssignments will be calculated when template is set
          useDayTypes: true,
        };
      });
    },

    // Helper: Assign day types to strength training days in a weekly template
    assignDayTypes: (weeklyTemplate) => {
      let strengthDayCount = 0;
      const dayTypes = PROGRESSION_MODELS.undulatingDaily.dayTypes;

      return weeklyTemplate.map(day => {
        if (day.type === 'strength' || day.type === 'muscular_endurance') {
          const typeIndex = strengthDayCount % dayTypes.length;
          strengthDayCount++;
          return {
            ...day,
            dupType: dayTypes[typeIndex],
          };
        }
        return day;
      });
    },
  },

  // ============== WEEKLY UNDULATING PERIODIZATION ==============
  // Different focus each week: Volume → Intensity → Peak → Deload
  undulatingWeekly: {
    id: 'undulatingWeekly',
    name: 'Weekly Undulating',
    description: 'Rotate weekly focus: Volume → Intensity → Peak → Deload',
    icon: '📊',
    compatibleTracks: ['strength', 'hypertrophy'],
    requiresSpecialTemplate: false,
    dayTypes: null,

    weekPatterns: [
      {
        focus: 'Volume',
        description: 'Higher volume, moderate intensity',
        intensityAdjust: -5,
        setsMultiplier: 1.25,
        repShift: 2,
        rpeAdjust: -1
      },
      {
        focus: 'Intensity',
        description: 'Moderate volume, higher intensity',
        intensityAdjust: 5,
        setsMultiplier: 1,
        repShift: -2,
        rpeAdjust: 0
      },
      {
        focus: 'Peak',
        description: 'Lower volume, highest intensity',
        intensityAdjust: 10,
        setsMultiplier: 0.85,
        repShift: -4,
        rpeAdjust: 1
      },
      {
        focus: 'Deload',
        description: 'Recovery week',
        intensityAdjust: -15,
        setsMultiplier: 0.5,
        repShift: 0,
        rpeAdjust: -2,
        isDeload: true
      },
    ],

    generateWeeks: (weeks, track = null) => {
      const patterns = PROGRESSION_MODELS.undulatingWeekly.weekPatterns;

      return Array.from({ length: weeks }, (_, i) => {
        const p = patterns[i % patterns.length];
        const cycleNum = Math.floor(i / 4);

        return {
          week: i + 1,
          focus: p.focus,
          focusDescription: p.description,
          intensityAdjust: p.intensityAdjust + (cycleNum * 2), // Slight progression each cycle
          setsMultiplier: p.setsMultiplier,
          repShift: p.repShift,
          rpeAdjust: p.rpeAdjust,
          isDeload: p.isDeload || false,
          cycleNumber: cycleNum + 1,
        };
      });
    },
  },

  // ============== BLOCK PERIODIZATION ==============
  // Distinct phases: Accumulation (volume) → Transmutation (intensity) → Realization (peak)
  // When selected, auto-generates 3 separate phases
  block: {
    id: 'block',
    name: 'Block Periodization',
    description: 'Auto-creates 3 phases: Accumulation → Transmutation → Realization',
    icon: '🧱',
    compatibleTracks: ['strength', 'peaking'],
    requiresSpecialTemplate: true,
    generatesMultiplePhases: true, // Flag indicating this model creates multiple phases
    dayTypes: null,

    blocks: [
      {
        id: 'accumulation',
        name: 'Accumulation',
        shortName: 'ACC',
        color: 'blue',
        percentage: 0.4, // 40% of total weeks
        description: 'Build work capacity with higher volume, moderate intensity. Include accessories.',
        characteristics: {
          intensityAdjust: -8,
          setsMultiplier: 1.3,
          repShift: 4,
          rpeAdjust: -1,
          includeAccessories: true,
        },
      },
      {
        id: 'transmutation',
        name: 'Transmutation',
        shortName: 'TRN',
        color: 'yellow',
        percentage: 0.35, // 35% of total weeks
        description: 'Increase specificity with moderate volume, higher intensity.',
        characteristics: {
          intensityAdjust: 0,
          setsMultiplier: 1,
          repShift: 0,
          rpeAdjust: 0,
          includeAccessories: true,
        },
      },
      {
        id: 'realization',
        name: 'Realization',
        shortName: 'REA',
        color: 'red',
        percentage: 0.25, // 25% of total weeks
        description: 'Peak for competition. Low volume, high intensity, competition lifts only.',
        characteristics: {
          intensityAdjust: 8,
          setsMultiplier: 0.7,
          repShift: -3,
          rpeAdjust: 1,
          includeAccessories: false, // Competition lifts only
        },
      },
    ],

    // Calculate week distribution for given total weeks
    getBlockWeeks: (totalWeeks) => {
      const blocks = PROGRESSION_MODELS.block.blocks;
      const accumWeeks = Math.max(1, Math.round(totalWeeks * blocks[0].percentage));
      const transWeeks = Math.max(1, Math.round(totalWeeks * blocks[1].percentage));
      const realWeeks = Math.max(1, totalWeeks - accumWeeks - transWeeks);
      return { accumWeeks, transWeeks, realWeeks };
    },

    // Generate weeks for a single block (used when creating individual phases)
    generateWeeksForBlock: (blockId, weeks, track = null) => {
      const block = PROGRESSION_MODELS.block.blocks.find(b => b.id === blockId);
      if (!block) return [];

      return Array.from({ length: weeks }, (_, i) => {
        const blockProgress = (i + 1) / weeks;
        const withinBlockIntensityAdd = Math.round(blockProgress * 5);

        return {
          week: i + 1,
          phase: block.name,
          phaseId: block.id,
          phaseColor: block.color,
          phaseDescription: block.description,
          weekInPhase: i + 1,
          totalPhaseWeeks: weeks,
          focus: block.name,
          intensityAdjust: block.characteristics.intensityAdjust + withinBlockIntensityAdd,
          setsMultiplier: block.characteristics.setsMultiplier,
          repShift: block.characteristics.repShift,
          rpeAdjust: block.characteristics.rpeAdjust,
          includeAccessories: block.characteristics.includeAccessories,
          isDeload: false,
        };
      });
    },

    // Legacy: Generate all weeks as single progression (for backwards compatibility)
    generateWeeks: (weeks, track = null) => {
      const { accumWeeks, transWeeks, realWeeks } = PROGRESSION_MODELS.block.getBlockWeeks(weeks);
      const blocks = PROGRESSION_MODELS.block.blocks;

      const allWeeks = [
        ...PROGRESSION_MODELS.block.generateWeeksForBlock('accumulation', accumWeeks, track),
        ...PROGRESSION_MODELS.block.generateWeeksForBlock('transmutation', transWeeks, track),
        ...PROGRESSION_MODELS.block.generateWeeksForBlock('realization', realWeeks, track),
      ];

      // Re-number weeks sequentially
      return allWeeks.map((w, i) => ({ ...w, week: i + 1 }));
    },
  },

  // ============== MAINTENANCE ==============
  // Preserve fitness with minimal training stress
  maintenance: {
    id: 'maintenance',
    name: 'Maintenance',
    description: 'Preserve fitness with reduced volume. Use during busy periods or active recovery.',
    icon: '⚖️',
    compatibleTracks: ['strength', 'hypertrophy', 'endurance'],
    requiresSpecialTemplate: false,
    dayTypes: null,

    generateWeeks: (weeks, track = null) => {
      return Array.from({ length: weeks }, (_, i) => ({
        week: i + 1,
        focus: 'Maintenance',
        intensityAdjust: 0, // Keep intensity to prevent detraining
        setsMultiplier: 0.5, // 50% volume
        repShift: 0,
        rpeAdjust: -1, // Don't push to failure
        isDeload: false,
        note: 'Maintenance - preserve gains with minimal fatigue',
      }));
    },
  },

  // ============== CONJUGATE / WESTSIDE ==============
  // Max Effort + Dynamic Effort training with exercise rotation
  conjugate: {
    id: 'conjugate',
    name: 'Conjugate/Westside',
    description: 'Max Effort and Dynamic Effort training with weekly exercise rotation.',
    icon: '🔀',
    compatibleTracks: ['strength', 'power'],
    requiresSpecialTemplate: true,

    // Conjugate requires specific day structure
    dayTypes: [
      {
        id: 'me_upper',
        name: 'Max Effort Upper',
        shortName: 'ME-U',
        color: 'red',
        description: 'Work up to 1-3RM on a pressing movement. Rotate lift weekly.',
        prescription: {
          mainLift: 'Work to 1-3RM',
          sets: null, // Not fixed - work up to max
          reps: '1-3',
          intensity: '90-100%',
          rpe: 10,
          note: 'Rotate exercise each week. Never repeat same variation within 3 weeks.',
        },
        suggestedExercises: ['bench_press', 'close_grip_bench', 'floor_press', 'incline_press', 'overhead_press'],
      },
      {
        id: 'me_lower',
        name: 'Max Effort Lower',
        shortName: 'ME-L',
        color: 'red',
        description: 'Work up to 1-3RM on squat or deadlift variation. Rotate lift weekly.',
        prescription: {
          mainLift: 'Work to 1-3RM',
          sets: null,
          reps: '1-3',
          intensity: '90-100%',
          rpe: 10,
          note: 'Rotate exercise each week. Never repeat same variation within 3 weeks.',
        },
        suggestedExercises: ['back_squat', 'front_squat', 'box_squat', 'conventional_deadlift', 'sumo_deadlift', 'rack_pull'],
      },
      {
        id: 'de_upper',
        name: 'Dynamic Effort Upper',
        shortName: 'DE-U',
        color: 'blue',
        description: 'Speed work on pressing. Move the bar as fast as possible.',
        prescription: {
          mainLift: 'Speed Bench',
          sets: 9,
          reps: 3,
          intensity: '50-60%',
          rpe: 7,
          note: 'Compensatory acceleration. Add bands/chains if available.',
          restPeriod: '45-60 sec',
        },
        suggestedExercises: ['bench_press'],
      },
      {
        id: 'de_lower',
        name: 'Dynamic Effort Lower',
        shortName: 'DE-L',
        color: 'blue',
        description: 'Speed work on squat/deadlift. Explosive concentric.',
        prescription: {
          mainLift: 'Speed Squat/Deadlift',
          sets: 10,
          reps: 2,
          intensity: '50-60%',
          rpe: 7,
          note: 'Compensatory acceleration. Box squats common. Add bands/chains if available.',
          restPeriod: '45-60 sec',
        },
        suggestedExercises: ['back_squat', 'box_squat', 'conventional_deadlift'],
      },
    ],

    // Suggested 4-day split for Conjugate
    suggestedSplit: {
      name: 'Conjugate 4-Day',
      days: [
        { dayName: 'ME Upper', conjugateType: 'me_upper', type: 'strength' },
        { dayName: 'ME Lower', conjugateType: 'me_lower', type: 'strength' },
        { dayName: 'Rest', type: 'recovery' },
        { dayName: 'DE Upper', conjugateType: 'de_upper', type: 'strength' },
        { dayName: 'DE Lower', conjugateType: 'de_lower', type: 'strength' },
        { dayName: 'Rest', type: 'recovery' },
        { dayName: 'Rest', type: 'recovery' },
      ],
    },

    generateWeeks: (weeks, track = null) => {
      return Array.from({ length: weeks }, (_, i) => {
        const isDeload = (i + 1) % 4 === 0;
        const waveWeek = (i % 3) + 1; // 3-week wave

        // Intensity waves for DE work (ME is always max effort)
        const deIntensityWave = {
          1: 50,
          2: 55,
          3: 60,
        };

        return {
          week: i + 1,
          pattern: 'Conjugate',
          focus: isDeload ? 'Deload' : `Wave ${waveWeek}`,
          waveWeek,
          meIntensity: isDeload ? 85 : 100, // ME always max unless deload
          deIntensity: isDeload ? 45 : deIntensityWave[waveWeek],
          setsMultiplier: isDeload ? 0.5 : 1,
          rpeAdjust: isDeload ? -2 : 0,
          isDeload,
          useConjugateDayTypes: true,
          note: isDeload
            ? 'Deload week - reduce ME to 85%, DE to 45%'
            : `Wave ${waveWeek}/3 - DE at ${deIntensityWave[waveWeek]}%`,
        };
      });
    },

    // Helper: Check if a template is compatible with Conjugate
    validateTemplate: (weeklyTemplate) => {
      const strengthDays = weeklyTemplate.filter(d => d.type === 'strength');
      if (strengthDays.length < 4) {
        return {
          valid: false,
          message: 'Conjugate requires at least 4 strength training days (ME Upper, ME Lower, DE Upper, DE Lower)',
        };
      }
      return { valid: true };
    },

    // Helper: Apply Conjugate day types to a template
    applyConjugateStructure: (weeklyTemplate) => {
      const dayTypes = PROGRESSION_MODELS.conjugate.dayTypes;
      let typeIndex = 0;

      return weeklyTemplate.map(day => {
        if (day.type === 'strength' && typeIndex < dayTypes.length) {
          const conjugateType = dayTypes[typeIndex];
          typeIndex++;
          return {
            ...day,
            conjugateType,
            session: conjugateType.name,
          };
        }
        return day;
      });
    },
  },
};

// ============== MESOCYCLE TEMPLATES ==============
// Pre-configured phase templates for quick setup

export const MESO_TEMPLATES = {
  hypertrophy: {
    id: 'hypertrophy',
    name: 'Hypertrophy',
    weeks: 4,
    icon: '💪',
    progression: 'linear',
    track: 'hypertrophy',
    defaultSets: 4,
    defaultReps: '8-12',
    defaultIntensity: 65,
    description: 'Build muscle with moderate weight and higher volume',
  },
  strength: {
    id: 'strength',
    name: 'Strength',
    weeks: 4,
    icon: '🏋️',
    progression: 'linear',
    track: 'strength',
    defaultSets: 4,
    defaultReps: '4-6',
    defaultIntensity: 80,
    description: 'Build maximal strength with heavy weight',
  },
  power: {
    id: 'power',
    name: 'Power',
    weeks: 3,
    icon: '⚡',
    progression: 'undulatingDaily',
    track: 'power',
    defaultSets: 4,
    defaultReps: '2-4',
    defaultIntensity: 75,
    description: 'Develop explosive power with DUP training',
  },
  peaking: {
    id: 'peaking',
    name: 'Peaking',
    weeks: 2,
    icon: '🎯',
    progression: 'linear',
    track: 'peaking',
    defaultSets: 3,
    defaultReps: '1-3',
    defaultIntensity: 90,
    description: 'Peak for competition with heavy singles/doubles',
  },
  deload: {
    id: 'deload',
    name: 'Deload',
    weeks: 1,
    icon: '😴',
    progression: 'maintenance',
    track: 'strength', // Can work with any
    defaultSets: 2,
    defaultReps: '6-8',
    defaultIntensity: 60,
    description: 'Active recovery with reduced volume',
  },
  aerobicBase: {
    id: 'aerobicBase',
    name: 'Aerobic Base',
    weeks: 6,
    icon: '❤️',
    progression: 'linear',
    track: 'endurance',
    isCardioFocused: true,
    description: 'Build aerobic capacity with zone 2 training',
  },
  muscularEndurance: {
    id: 'muscularEndurance',
    name: 'Muscular Endurance',
    weeks: 4,
    icon: '🔥',
    progression: 'linear',
    track: 'endurance',
    defaultSets: 3,
    defaultReps: '15-20',
    defaultIntensity: 55,
    description: 'Build work capacity with higher rep training',
  },
  strengthBlock: {
    id: 'strengthBlock',
    name: 'Strength Block (8wk)',
    weeks: 8,
    icon: '🧱',
    progression: 'block',
    track: 'strength',
    defaultSets: 4,
    defaultReps: '4-6',
    defaultIntensity: 80,
    description: 'Classic 8-week block: Accumulation → Transmutation → Realization',
  },
  conjugateCycle: {
    id: 'conjugateCycle',
    name: 'Conjugate Cycle',
    weeks: 4,
    icon: '🔀',
    progression: 'conjugate',
    track: 'strength',
    defaultSets: 4,
    defaultReps: '1-5',
    defaultIntensity: 75,
    description: 'Max Effort + Dynamic Effort training',
  },
};

// ============== UTILITY FUNCTIONS ==============

// Check if a progression model is compatible with a track
export const isModelCompatibleWithTrack = (modelId, trackId) => {
  const model = PROGRESSION_MODELS[modelId];
  if (!model) return false;
  return model.compatibleTracks.includes(trackId);
};

// Get compatible tracks for a model
export const getCompatibleTracks = (modelId) => {
  const model = PROGRESSION_MODELS[modelId];
  return model?.compatibleTracks || [];
};

// Get compatible models for a track
export const getCompatibleModels = (trackId) => {
  return Object.values(PROGRESSION_MODELS).filter(
    model => model.compatibleTracks.includes(trackId)
  );
};

// Apply rep shift to a base rep range
export const applyRepShift = (baseReps, shift) => {
  return shiftRepRange(baseReps, shift);
};

// Calculate final week values by merging track defaults with progression adjustments
export const calculateWeekValues = (weekProgression, track) => {
  const baseIntensity = track.baseIntensity || 70;
  const baseSets = track.baseSets || 4;
  const baseReps = track.baseReps || '8-10';
  const baseRpe = track.baseRpe || 7;

  const intensity = Math.min(100, Math.max(50, baseIntensity + (weekProgression.intensityAdjust || 0)));
  const sets = Math.max(1, Math.round(baseSets * (weekProgression.setsMultiplier || 1)));
  const reps = weekProgression.repShift ? applyRepShift(baseReps, weekProgression.repShift) : baseReps;
  const rpe = Math.min(10, Math.max(1, baseRpe + (weekProgression.rpeAdjust || 0)));

  return {
    ...weekProgression,
    intensity,
    sets,
    reps,
    rpe,
    track: track.id,
  };
};

// Generate block periodization phases (returns array of phase configs)
// This creates 3 separate phases: Accumulation, Transmutation, Realization
export const generateBlockPhases = (totalWeeks, trackId, startWeek = 1) => {
  const blockModel = PROGRESSION_MODELS.block;
  const { accumWeeks, transWeeks, realWeeks } = blockModel.getBlockWeeks(totalWeeks);

  const phases = [];
  let currentStartWeek = startWeek;

  // Accumulation Phase
  phases.push({
    id: `phase_block_accum_${Date.now()}`,
    name: 'Accumulation',
    weeks: accumWeeks,
    progression: 'block_accumulation', // Special marker
    blockId: 'accumulation',
    track: trackId,
    weeksRange: [currentStartWeek, currentStartWeek + accumWeeks - 1],
    weeklyProgression: blockModel.generateWeeksForBlock('accumulation', accumWeeks),
    blockInfo: blockModel.blocks[0],
  });
  currentStartWeek += accumWeeks;

  // Transmutation Phase
  phases.push({
    id: `phase_block_trans_${Date.now() + 1}`,
    name: 'Transmutation',
    weeks: transWeeks,
    progression: 'block_transmutation',
    blockId: 'transmutation',
    track: trackId,
    weeksRange: [currentStartWeek, currentStartWeek + transWeeks - 1],
    weeklyProgression: blockModel.generateWeeksForBlock('transmutation', transWeeks),
    blockInfo: blockModel.blocks[1],
  });
  currentStartWeek += transWeeks;

  // Realization Phase
  phases.push({
    id: `phase_block_real_${Date.now() + 2}`,
    name: 'Realization',
    weeks: realWeeks,
    progression: 'block_realization',
    blockId: 'realization',
    track: trackId,
    weeksRange: [currentStartWeek, currentStartWeek + realWeeks - 1],
    weeklyProgression: blockModel.generateWeeksForBlock('realization', realWeeks),
    blockInfo: blockModel.blocks[2],
  });

  return phases;
};
