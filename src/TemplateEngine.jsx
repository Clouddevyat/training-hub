// ============== TEMPLATE ENGINE ==============
// Handles JSON template upload, validation, and auto-propagation

// Schema version for compatibility checking
export const TEMPLATE_SCHEMA_VERSION = '1.0';

// ============== EXERCISE LIBRARY ==============
// Master list of exercises with movement patterns for slot-based substitution
export const EXERCISE_LIBRARY = {
  // HINGE MOVEMENTS
  trap_bar_deadlift: {
    id: 'trap_bar_deadlift',
    name: 'Trap Bar Deadlift',
    pattern: 'hinge',
    equipment: ['trap_bar'],
    prKey: 'trapBarDeadlift',
    muscles: ['glutes', 'hamstrings', 'quads', 'back']
  },
  conventional_deadlift: {
    id: 'conventional_deadlift',
    name: 'Conventional Deadlift',
    pattern: 'hinge',
    equipment: ['barbell'],
    prKey: 'conventionalDeadlift',
    muscles: ['glutes', 'hamstrings', 'back']
  },
  sumo_deadlift: {
    id: 'sumo_deadlift',
    name: 'Sumo Deadlift',
    pattern: 'hinge',
    equipment: ['barbell'],
    prKey: 'sumoDeadlift',
    muscles: ['glutes', 'adductors', 'quads']
  },
  romanian_deadlift: {
    id: 'romanian_deadlift',
    name: 'Romanian Deadlift',
    pattern: 'hinge',
    equipment: ['barbell', 'dumbbells'],
    prKey: 'romanianDeadlift',
    muscles: ['hamstrings', 'glutes', 'back']
  },
  rack_pull: {
    id: 'rack_pull',
    name: 'Rack Pull',
    pattern: 'hinge',
    equipment: ['barbell', 'rack'],
    prKey: 'rackPull',
    muscles: ['back', 'glutes', 'traps']
  },
  kettlebell_swing: {
    id: 'kettlebell_swing',
    name: 'Kettlebell Swing',
    pattern: 'hinge_power',
    equipment: ['kettlebell'],
    prKey: null,
    muscles: ['glutes', 'hamstrings', 'core']
  },

  // SQUAT MOVEMENTS
  back_squat: {
    id: 'back_squat',
    name: 'Back Squat',
    pattern: 'squat',
    equipment: ['barbell', 'rack'],
    prKey: 'backSquat',
    muscles: ['quads', 'glutes', 'core']
  },
  front_squat: {
    id: 'front_squat',
    name: 'Front Squat',
    pattern: 'squat',
    equipment: ['barbell', 'rack'],
    prKey: 'frontSquat',
    muscles: ['quads', 'core', 'upper_back']
  },
  goblet_squat: {
    id: 'goblet_squat',
    name: 'Goblet Squat',
    pattern: 'squat',
    equipment: ['kettlebell', 'dumbbell'],
    prKey: null,
    muscles: ['quads', 'glutes', 'core']
  },

  // SINGLE LEG MOVEMENTS
  box_step_up: {
    id: 'box_step_up',
    name: 'Box Step-Up',
    pattern: 'single_leg',
    equipment: ['box', 'dumbbells'],
    prKey: 'boxStepUp',
    muscles: ['quads', 'glutes']
  },
  bulgarian_split_squat: {
    id: 'bulgarian_split_squat',
    name: 'Bulgarian Split Squat',
    pattern: 'single_leg',
    equipment: ['bench', 'dumbbells'],
    prKey: 'bulgarianSplitSquat',
    muscles: ['quads', 'glutes', 'hip_flexors']
  },
  walking_lunge: {
    id: 'walking_lunge',
    name: 'Walking Lunge',
    pattern: 'single_leg',
    equipment: ['dumbbells', 'bodyweight'],
    prKey: null,
    muscles: ['quads', 'glutes', 'hamstrings']
  },
  rear_foot_elevated_split_squat: {
    id: 'rear_foot_elevated_split_squat',
    name: 'Rear Foot Elevated Split Squat',
    pattern: 'single_leg',
    equipment: ['bench', 'dumbbells'],
    prKey: null,
    muscles: ['quads', 'glutes']
  },

  // HORIZONTAL PUSH
  bench_press: {
    id: 'bench_press',
    name: 'Bench Press',
    pattern: 'horizontal_push',
    equipment: ['barbell', 'bench'],
    prKey: 'benchPress',
    muscles: ['chest', 'shoulders', 'triceps']
  },
  dumbbell_bench_press: {
    id: 'dumbbell_bench_press',
    name: 'Dumbbell Bench Press',
    pattern: 'horizontal_push',
    equipment: ['dumbbells', 'bench'],
    prKey: 'dbBenchPress',
    muscles: ['chest', 'shoulders', 'triceps']
  },
  push_up: {
    id: 'push_up',
    name: 'Push-Up',
    pattern: 'horizontal_push',
    equipment: ['bodyweight'],
    prKey: null,
    muscles: ['chest', 'shoulders', 'triceps', 'core']
  },
  dip: {
    id: 'dip',
    name: 'Dip',
    pattern: 'horizontal_push',
    equipment: ['dip_bars'],
    prKey: 'weightedDip',
    muscles: ['chest', 'triceps', 'shoulders']
  },

  // VERTICAL PUSH
  overhead_press: {
    id: 'overhead_press',
    name: 'Overhead Press',
    pattern: 'vertical_push',
    equipment: ['barbell'],
    prKey: 'overheadPress',
    muscles: ['shoulders', 'triceps', 'core']
  },
  dumbbell_press: {
    id: 'dumbbell_press',
    name: 'Dumbbell Shoulder Press',
    pattern: 'vertical_push',
    equipment: ['dumbbells'],
    prKey: 'dbShoulderPress',
    muscles: ['shoulders', 'triceps']
  },
  push_press: {
    id: 'push_press',
    name: 'Push Press',
    pattern: 'vertical_push_power',
    equipment: ['barbell'],
    prKey: 'pushPress',
    muscles: ['shoulders', 'triceps', 'legs']
  },

  // HORIZONTAL PULL
  barbell_row: {
    id: 'barbell_row',
    name: 'Barbell Row',
    pattern: 'horizontal_pull',
    equipment: ['barbell'],
    prKey: 'barbellRow',
    muscles: ['lats', 'rhomboids', 'biceps']
  },
  dumbbell_row: {
    id: 'dumbbell_row',
    name: 'Dumbbell Row',
    pattern: 'horizontal_pull',
    equipment: ['dumbbells', 'bench'],
    prKey: null,
    muscles: ['lats', 'rhomboids', 'biceps']
  },
  cable_row: {
    id: 'cable_row',
    name: 'Cable Row',
    pattern: 'horizontal_pull',
    equipment: ['cable_machine'],
    prKey: null,
    muscles: ['lats', 'rhomboids', 'biceps']
  },

  // VERTICAL PULL
  pull_up: {
    id: 'pull_up',
    name: 'Pull-Up',
    pattern: 'vertical_pull',
    equipment: ['pull_up_bar'],
    prKey: 'weightedPullUp',
    muscles: ['lats', 'biceps', 'forearms']
  },
  chin_up: {
    id: 'chin_up',
    name: 'Chin-Up',
    pattern: 'vertical_pull',
    equipment: ['pull_up_bar'],
    prKey: 'weightedChinUp',
    muscles: ['lats', 'biceps']
  },
  lat_pulldown: {
    id: 'lat_pulldown',
    name: 'Lat Pulldown',
    pattern: 'vertical_pull',
    equipment: ['cable_machine'],
    prKey: null,
    muscles: ['lats', 'biceps']
  },

  // CARRY
  farmers_carry: {
    id: 'farmers_carry',
    name: "Farmer's Carry",
    pattern: 'carry',
    equipment: ['dumbbells', 'kettlebells', 'farmers_handles'],
    prKey: 'farmersCarry',
    muscles: ['grip', 'traps', 'core']
  },
  sandbag_carry: {
    id: 'sandbag_carry',
    name: 'Sandbag Carry',
    pattern: 'carry',
    equipment: ['sandbag'],
    prKey: null,
    muscles: ['full_body', 'grip', 'core']
  },
  ruck: {
    id: 'ruck',
    name: 'Ruck',
    pattern: 'carry_endurance',
    equipment: ['pack'],
    prKey: null,
    muscles: ['legs', 'back', 'core']
  },

  // CORE
  pallof_press: {
    id: 'pallof_press',
    name: 'Pallof Press',
    pattern: 'core_anti_rotation',
    equipment: ['cable_machine', 'band'],
    prKey: null,
    muscles: ['core', 'obliques']
  },
  plank: {
    id: 'plank',
    name: 'Plank',
    pattern: 'core_stability',
    equipment: ['bodyweight'],
    prKey: null,
    muscles: ['core']
  },
  dead_bug: {
    id: 'dead_bug',
    name: 'Dead Bug',
    pattern: 'core_stability',
    equipment: ['bodyweight'],
    prKey: null,
    muscles: ['core', 'hip_flexors']
  },

  // ACCESSORIES
  face_pull: {
    id: 'face_pull',
    name: 'Face Pull',
    pattern: 'accessory_pull',
    equipment: ['cable_machine', 'band'],
    prKey: null,
    muscles: ['rear_delts', 'rotator_cuff']
  },
  hammer_curl: {
    id: 'hammer_curl',
    name: 'Hammer Curl',
    pattern: 'accessory_bicep',
    equipment: ['dumbbells'],
    prKey: null,
    muscles: ['biceps', 'brachialis']
  },
  tricep_pushdown: {
    id: 'tricep_pushdown',
    name: 'Tricep Pushdown',
    pattern: 'accessory_tricep',
    equipment: ['cable_machine', 'band'],
    prKey: null,
    muscles: ['triceps']
  },
  dead_hang: {
    id: 'dead_hang',
    name: 'Dead Hang',
    pattern: 'accessory_grip',
    equipment: ['pull_up_bar'],
    prKey: null,
    muscles: ['grip', 'lats', 'shoulders']
  },

  // CARDIO / AEROBIC
  easy_run: {
    id: 'easy_run',
    name: 'Easy Run',
    pattern: 'aerobic',
    equipment: [],
    prKey: null,
    muscles: ['legs', 'cardiovascular']
  },
  tempo_run: {
    id: 'tempo_run',
    name: 'Tempo Run',
    pattern: 'threshold',
    equipment: [],
    prKey: null,
    muscles: ['legs', 'cardiovascular']
  },
  intervals: {
    id: 'intervals',
    name: 'Interval Training',
    pattern: 'anaerobic',
    equipment: [],
    prKey: null,
    muscles: ['legs', 'cardiovascular']
  },
  hike: {
    id: 'hike',
    name: 'Hike',
    pattern: 'aerobic',
    equipment: [],
    prKey: null,
    muscles: ['legs', 'cardiovascular']
  },
  bike: {
    id: 'bike',
    name: 'Bike/Cycle',
    pattern: 'aerobic',
    equipment: ['bike'],
    prKey: null,
    muscles: ['legs', 'cardiovascular']
  },
  row_erg: {
    id: 'row_erg',
    name: 'Row Ergometer',
    pattern: 'aerobic',
    equipment: ['rowing_machine'],
    prKey: null,
    muscles: ['full_body', 'cardiovascular']
  },
  stairmaster: {
    id: 'stairmaster',
    name: 'Stairmaster',
    pattern: 'aerobic_vertical',
    equipment: ['stairmaster'],
    prKey: null,
    muscles: ['legs', 'cardiovascular']
  },

  // CLIMBING
  rope_climb: {
    id: 'rope_climb',
    name: 'Rope Climb',
    pattern: 'climbing',
    equipment: ['rope'],
    prKey: null,
    muscles: ['lats', 'biceps', 'grip', 'core']
  }
};

// Get exercises by movement pattern
export const getExercisesByPattern = (pattern) => {
  return Object.values(EXERCISE_LIBRARY).filter(ex => ex.pattern === pattern);
};

// Get valid substitutes for an exercise
export const getValidSubstitutes = (exerciseId, allowed = [], forbidden = []) => {
  const exercise = EXERCISE_LIBRARY[exerciseId];
  if (!exercise) return [];
  
  return Object.values(EXERCISE_LIBRARY)
    .filter(ex => {
      // Same pattern
      if (ex.pattern !== exercise.pattern) return false;
      // Not the same exercise
      if (ex.id === exerciseId) return false;
      // If allowed list exists, must be in it
      if (allowed.length > 0 && !allowed.includes(ex.id)) return false;
      // Must not be in forbidden list
      if (forbidden.includes(ex.id)) return false;
      return true;
    });
};



// ============== TEMPLATE VALIDATION ==============
export const validateTemplate = (template) => {
  const errors = [];
  const warnings = [];

  // Check required meta fields
  if (!template.meta) {
    errors.push('Missing "meta" section');
  } else {
    if (!template.meta.id) errors.push('Missing meta.id');
    if (!template.meta.name) errors.push('Missing meta.name');
    if (!template.meta.type) warnings.push('Missing meta.type - defaulting to "standalone"');
  }

  // Check for blocks or phases
  if (!template.blocks && !template.phases) {
    errors.push('Template must have either "blocks" (for block systems) or "phases" (for standalone programs)');
  }

  // Validate blocks if present
  if (template.blocks) {
    if (template.blocks.main_cycle) {
      template.blocks.main_cycle.forEach((block, i) => {
        if (!block.id) errors.push(`blocks.main_cycle[${i}] missing id`);
        if (!block.name) errors.push(`blocks.main_cycle[${i}] missing name`);
        if (!block.week_template && !block.progression_by_week) {
          warnings.push(`blocks.main_cycle[${i}] has no week_template or progression_by_week`);
        }
      });
    }
    if (template.blocks.specialty) {
      template.blocks.specialty.forEach((block, i) => {
        if (!block.id) errors.push(`blocks.specialty[${i}] missing id`);
        if (!block.return_to) warnings.push(`blocks.specialty[${i}] has no return_to - will default to block_a`);
      });
    }
    if (template.blocks.life) {
      template.blocks.life.forEach((block, i) => {
        if (!block.id) errors.push(`blocks.life[${i}] missing id`);
      });
    }
  }

  // Validate phases if present (standalone program)
  if (template.phases) {
    template.phases.forEach((phase, i) => {
      if (!phase.id) errors.push(`phases[${i}] missing id`);
      if (!phase.name) errors.push(`phases[${i}] missing name`);
      if (!phase.weeks || phase.weeks.length !== 2) {
        errors.push(`phases[${i}] missing or invalid weeks array (should be [start, end])`);
      }
    });
  }

  // Validate exercise references in slots
  const validateSlots = (slots, path) => {
    if (!slots) return;
    slots.forEach((slot, i) => {
      if (slot.exercise_id && !EXERCISE_LIBRARY[slot.exercise_id]) {
        warnings.push(`${path}[${i}].exercise_id "${slot.exercise_id}" not in exercise library`);
      }
      if (slot.default && !EXERCISE_LIBRARY[slot.default]) {
        warnings.push(`${path}[${i}].default "${slot.default}" not in exercise library`);
      }
    });
  };

  // Check for intensity expressions
  const validateIntensityExpression = (expr, path) => {
    if (!expr) return;
    const validPatterns = [
      /^\d+(\.\d+)?$/,  // Plain number
      /^\d+(\.\d+)?\s*\*\s*(1rm\.\w+|bodyweight|bw)/i,  // Percentage calc
      /^zone_?\d$/i,  // Zone reference
      /^(below|above|at)\s+(aet|ant|max)_hr$/i,  // HR reference
      /^rpe\s*\d+(-\d+)?$/i  // RPE reference
    ];
    
    const isValid = validPatterns.some(p => p.test(expr.toString().trim()));
    if (!isValid && typeof expr === 'string' && expr.includes('*')) {
      // It's a calculation expression, check if it references valid profile fields
      const validRefs = ['1rm.', 'bodyweight', 'bw', 'max_hr', 'aet_hr', 'ant_hr'];
      const hasValidRef = validRefs.some(ref => expr.toLowerCase().includes(ref));
      if (!hasValidRef) {
        warnings.push(`${path} intensity expression "${expr}" may reference unknown profile field`);
      }
    }
  };

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

// ============== EXPRESSION EVALUATOR ==============
// Safely evaluate intensity/load expressions against athlete profile
export const evaluateExpression = (expression, athleteProfile) => {
  if (!expression) return null;
  
  // If it's already a number, return it
  if (typeof expression === 'number') return expression;
  
  const expr = expression.toString().trim().toLowerCase();
  
  // Plain percentage like "85" or "0.85"
  if (/^\d+(\.\d+)?$/.test(expr)) {
    const num = parseFloat(expr);
    return num > 1 ? num : num * 100; // Convert decimals to percentages
  }

  // Zone reference
  if (/^zone_?\d$/i.test(expr)) {
    return expr; // Return as-is for zone-based work
  }

  // HR reference
  if (/^(below|above|at)\s+(aet|ant|max)_hr$/i.test(expr)) {
    return expr; // Return as-is for HR-based work
  }

  // RPE reference
  if (/^rpe\s*\d+(-\d+)?$/i.test(expr)) {
    return expr; // Return as-is
  }

  // Calculation expression like "0.85 * 1rm.trap_bar" or "0.20 * bodyweight"
  const calcMatch = expr.match(/^(\d+(?:\.\d+)?)\s*\*\s*(.+)$/);
  if (calcMatch) {
    const multiplier = parseFloat(calcMatch[1]);
    const reference = calcMatch[2].trim();
    
    // Bodyweight reference
    if (reference === 'bodyweight' || reference === 'bw') {
      const bw = athleteProfile?.weight;
      if (bw) {
        return Math.round(multiplier * bw);
      }
      return `${Math.round(multiplier * 100)}% BW`;
    }

    // 1RM reference
    if (reference.startsWith('1rm.')) {
      const prKey = reference.replace('1rm.', '');
      // Map common template keys to profile keys
      const keyMap = {
        'trap_bar': 'trapBarDeadlift',
        'trap_bar_deadlift': 'trapBarDeadlift',
        'squat': 'backSquat',
        'back_squat': 'backSquat',
        'front_squat': 'frontSquat',
        'bench': 'benchPress',
        'bench_press': 'benchPress',
        'press': 'overheadPress',
        'overhead_press': 'overheadPress',
        'weighted_pullup': 'weightedPullUp',
        'weighted_pull_up': 'weightedPullUp',
        'pullup': 'weightedPullUp',
        'deadlift': 'trapBarDeadlift',
        'dip': 'weightedDip',
        'weighted_dip': 'weightedDip'
      };
      
      const mappedKey = keyMap[prKey] || prKey;
      const prValue = athleteProfile?.prs?.[mappedKey]?.value;
      
      if (prValue) {
        // Round to nearest 5
        return Math.round((multiplier * prValue) / 5) * 5;
      }
      return `${Math.round(multiplier * 100)}% 1RM`;
    }

    // HR reference in calculation
    if (reference === 'max_hr') {
      const maxHR = athleteProfile?.benchmarks?.maxHR?.value;
      if (maxHR) return Math.round(multiplier * maxHR);
      return `${Math.round(multiplier * 100)}% Max HR`;
    }
  }

  // If we can't parse it, return as-is
  return expression;
};

// ============== WORKOUT GENERATOR ==============
// Generate concrete workout from template slot
export const generateWorkoutFromTemplate = (templateWorkout, athleteProfile, week, readinessScore) => {
  if (!templateWorkout) return null;

  const workout = {
    ...templateWorkout,
    exercises: [],
    generatedAt: new Date().toISOString(),
    weekNumber: week
  };

  // Apply readiness modifiers
  let volumeModifier = 1.0;
  if (readinessScore !== undefined && readinessScore !== null) {
    if (readinessScore < 40) {
      volumeModifier = 0.5; // Red light - cut volume in half
      workout.readinessAdjustment = 'Volume reduced 50% due to low readiness';
    } else if (readinessScore < 70) {
      volumeModifier = 0.75; // Yellow light - reduce by 25%
      workout.readinessAdjustment = 'Volume reduced 25% due to moderate readiness';
    }
  }

  // Process exercises/slots
  if (templateWorkout.exercises) {
    workout.exercises = templateWorkout.exercises.map(ex => {
      const generated = { ...ex };

      // Calculate working weight if percentage and prKey exist
      if (ex.percentage && ex.prKey) {
        const prValue = athleteProfile?.prs?.[ex.prKey]?.value;
        if (prValue) {
          generated.workingWeight = Math.round((ex.percentage / 100) * prValue / 5) * 5;
          generated.workingWeightDisplay = `${generated.workingWeight} lbs`;
        } else {
          generated.workingWeightDisplay = `${ex.percentage}% 1RM`;
        }
      }

      // Evaluate intensity expressions
      if (ex.intensity) {
        generated.calculatedIntensity = evaluateExpression(ex.intensity, athleteProfile);
      }

      // Calculate load for carries/ME work
      if (ex.loadType === 'bodyweight_percentage' && ex.load !== undefined) {
        const bw = athleteProfile?.weight;
        if (bw) {
          generated.calculatedLoad = Math.round(bw * (ex.load / 100));
          generated.loadDisplay = `${generated.calculatedLoad} lbs (${ex.load}% BW)`;
        } else {
          generated.loadDisplay = `${ex.load}% BW`;
        }
      }

      // Apply volume modifier to sets
      if (ex.sets && volumeModifier < 1) {
        generated.originalSets = ex.sets;
        generated.sets = Math.max(1, Math.round(ex.sets * volumeModifier));
      }

      return generated;
    });
  }

  // Process prescription if present (for cardio/ME work)
  if (templateWorkout.prescription) {
    workout.prescription = { ...templateWorkout.prescription };

    // Handle progression rules
    if (workout.prescription.progression) {
      const prog = workout.prescription.progression;
      // Find which week range we're in
      for (const [range, values] of Object.entries(prog)) {
        const weekMatch = range.match(/weeks?\s*(\d+)(?:\s*-\s*(\d+))?/i);
        if (weekMatch) {
          const startWeek = parseInt(weekMatch[1]);
          const endWeek = weekMatch[2] ? parseInt(weekMatch[2]) : startWeek;
          if (week >= startWeek && week <= endWeek) {
            workout.prescription.currentProgression = values;
            // Apply calculated load if present
            if (values.load !== undefined) {
              const bw = athleteProfile?.weight;
              if (bw) {
                workout.prescription.calculatedLoad = Math.round(bw * (values.load / 100));
                workout.prescription.loadDisplay = `${workout.prescription.calculatedLoad} lbs (${values.load}% BW)`;
              }
            }
            break;
          }
        }
      }
    }

    // Process exercises within prescription
    if (workout.prescription.exercises) {
      workout.prescription.exercises = workout.prescription.exercises.map(ex => {
        const generated = { ...ex };
        if (ex.percentage && ex.prKey) {
          const prValue = athleteProfile?.prs?.[ex.prKey]?.value;
          if (prValue) {
            generated.workingWeight = Math.round((ex.percentage / 100) * prValue / 5) * 5;
          }
        }
        return generated;
      });
    }
  }

  return workout;
};



// ============== BLOCK SYSTEM MANAGER ==============
// Handles block-based training systems (Main Cycle + Detours)

export const getBlockById = (template, blockId) => {
  if (!template?.blocks) return null;
  
  // Search all block categories
  const allBlocks = [
    ...(template.blocks.main_cycle || []),
    ...(template.blocks.specialty || []),
    ...(template.blocks.life || [])
  ];
  
  return allBlocks.find(b => b.id === blockId);
};

export const getNextBlockInCycle = (template, currentBlockId) => {
  if (!template?.blocks?.main_cycle) return null;
  
  const mainCycle = template.blocks.main_cycle;
  const currentIndex = mainCycle.findIndex(b => b.id === currentBlockId);
  
  if (currentIndex === -1) {
    // Not in main cycle, return to block_a (or first block)
    return mainCycle[0];
  }
  
  // Move to next block, or cycle back to start
  const nextIndex = (currentIndex + 1) % mainCycle.length;
  return mainCycle[nextIndex];
};

export const checkExitCriteria = (block, athleteProfile, benchmarkResults) => {
  if (!block?.exit_criteria) return { met: true, remaining: [] };
  
  const remaining = [];
  
  block.exit_criteria.forEach(criterion => {
    // For now, just track them - actual evaluation would need structured criteria
    // This is a simplified version that returns all criteria as remaining
    remaining.push(criterion);
  });
  
  return {
    met: remaining.length === 0,
    remaining
  };
};

export const getBlockSacrifices = (block) => {
  return block?.sacrifice || block?.sacrifices || [];
};

export const getBlockWhenToUse = (block) => {
  return block?.when_to_use || [];
};

// ============== TEMPLATE CONVERSION ==============
// Convert a template into the app's internal program format

export const templateToProgram = (template, athleteProfile) => {
  if (!template) return null;

  const program = {
    id: template.meta.id,
    name: template.meta.name,
    description: template.meta.description || '',
    icon: template.meta.icon || '📋',
    isTemplate: true,
    templateVersion: template.meta.version || '1.0',
    sourceTemplate: template.meta.id,
    phases: []
  };

  // Handle block-based systems
  if (template.blocks) {
    // Convert main cycle blocks to phases
    if (template.blocks.main_cycle) {
      let weekCounter = 1;
      template.blocks.main_cycle.forEach(block => {
        const minWeeks = block.duration?.min || 4;
        const maxWeeks = block.duration?.max || 8;
        const defaultWeeks = Math.round((minWeeks + maxWeeks) / 2);
        
        const phase = {
          id: block.id,
          name: block.name,
          weeks: [weekCounter, weekCounter + defaultWeeks - 1],
          description: block.description || '',
          type: block.type || 'main',
          exitCriteria: block.exit_criteria || [],
          guardrails: block.guardrails || {},
          deloadWeek: block.deload_week || 4,
          weeklyTemplate: convertWeekTemplate(block.week_template, athleteProfile)
        };
        
        program.phases.push(phase);
        weekCounter += defaultWeeks;
      });
    }

    // Store specialty and life blocks as available detours
    program.availableDetours = {
      specialty: (template.blocks.specialty || []).map(b => ({
        ...b,
        weeklyTemplate: convertWeekTemplate(b.week_template, athleteProfile)
      })),
      life: (template.blocks.life || []).map(b => ({
        ...b,
        weeklyTemplate: b.progression_by_week 
          ? convertProgressionByWeek(b.progression_by_week)
          : convertWeekTemplate(b.week_template, athleteProfile)
      }))
    };

    // Store global rules
    program.globalRules = template.global_rules || {};
    
    // Store quarterly testing
    program.quarterlyTesting = template.quarterly_testing || null;
  }
  // Handle standalone programs (like Combat Alpinist)
  else if (template.phases) {
    program.phases = template.phases.map(phase => ({
      id: phase.id,
      name: phase.name,
      weeks: phase.weeks,
      description: phase.description || '',
      benchmarks: phase.benchmarks || [],
      guardrails: phase.guardrails || {},
      weeklyTemplate: convertWeekTemplate(phase.week_template, athleteProfile)
    }));
  }

  return program;
};

// Convert template week_template to app's weeklyTemplate format
const convertWeekTemplate = (weekTemplate, athleteProfile) => {
  if (!weekTemplate) return [];

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const result = [];

  dayOrder.forEach((dayName, index) => {
    const templateDay = weekTemplate[dayName];
    if (!templateDay) {
      // Add rest day if not specified
      result.push({
        day: index + 1,
        dayName: `Day ${index + 1}`,
        session: 'Rest',
        type: 'rest',
        duration: 0,
        prescription: { description: 'Complete rest' }
      });
      return;
    }

    const day = {
      day: index + 1,
      dayName: `Day ${index + 1}`,
      session: templateDay.name || templateDay.session || dayName,
      type: templateDay.type || 'strength',
      duration: templateDay.duration || 60,
      prescription: {}
    };

    // Convert exercises/slots
    if (templateDay.exercises) {
      day.prescription.exercises = templateDay.exercises.map(ex => {
        const converted = {
          name: ex.name || EXERCISE_LIBRARY[ex.exercise_id]?.name || EXERCISE_LIBRARY[ex.default]?.name || ex.slot,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          prKey: ex.pr_key || EXERCISE_LIBRARY[ex.exercise_id]?.prKey || EXERCISE_LIBRARY[ex.default]?.prKey,
          percentage: null,
          slot: ex.slot || null,
          allowedSubs: ex.allowed || [],
          forbiddenSubs: ex.forbidden || [],
          locked: ex.locked || false
        };

        // Parse intensity to percentage if possible
        if (ex.intensity) {
          const intensityStr = ex.intensity.toString();
          const percentMatch = intensityStr.match(/^(\d+(?:\.\d+)?)\s*\*\s*1rm/i);
          if (percentMatch) {
            converted.percentage = Math.round(parseFloat(percentMatch[1]) * 100);
          } else if (/^\d+(\.\d+)?$/.test(intensityStr)) {
            const num = parseFloat(intensityStr);
            converted.percentage = num > 1 ? num : Math.round(num * 100);
          }
          converted.intensityExpression = ex.intensity;
        }

        return converted;
      });
    }

    // Copy other prescription fields
    if (templateDay.description) day.prescription.description = templateDay.description;
    if (templateDay.warmup) day.prescription.warmup = templateDay.warmup;
    if (templateDay.cooldown) day.prescription.cooldown = templateDay.cooldown;
    if (templateDay.hrZone) day.prescription.hrZone = templateDay.hrZone;
    if (templateDay.notes) day.prescription.notes = templateDay.notes;
    if (templateDay.duration) day.prescription.duration = templateDay.duration;
    if (templateDay.progression) day.prescription.progression = templateDay.progression;

    result.push(day);
  });

  return result;
};

// Convert progression_by_week (for life blocks like post-injury)
const convertProgressionByWeek = (progressionByWeek) => {
  // Life blocks with progression_by_week don't have fixed daily templates
  // Return a simplified structure
  return Object.entries(progressionByWeek).map(([range, data], index) => ({
    day: index + 1,
    dayName: `Weeks ${range}`,
    session: data.focus,
    type: 'adaptive',
    duration: 0,
    prescription: {
      description: data.focus,
      loading: data.loading,
      notes: data.notes || []
    }
  }));
};

// ============== PROFILE FIELD CHECKER ==============
// Check if athlete profile has required fields for a template

export const checkRequiredFields = (template, athleteProfile) => {
  const required = template.required_profile_fields || [];
  const missing = [];
  const present = [];

  required.forEach(field => {
    const value = getProfileField(athleteProfile, field);
    if (value === null || value === undefined) {
      missing.push(field);
    } else {
      present.push({ field, value });
    }
  });

  return {
    complete: missing.length === 0,
    missing,
    present,
    percentComplete: required.length > 0 
      ? Math.round((present.length / required.length) * 100)
      : 100
  };
};

// Get a value from athlete profile using dot notation
const getProfileField = (profile, field) => {
  if (!profile || !field) return null;

  // Handle special mappings
  const fieldMap = {
    'bodyweight': 'weight',
    'bw': 'weight',
    '1rm.squat': 'prs.backSquat.value',
    '1rm.back_squat': 'prs.backSquat.value',
    '1rm.deadlift': 'prs.trapBarDeadlift.value',
    '1rm.trap_bar': 'prs.trapBarDeadlift.value',
    '1rm.trap_bar_deadlift': 'prs.trapBarDeadlift.value',
    '1rm.bench': 'prs.benchPress.value',
    '1rm.bench_press': 'prs.benchPress.value',
    '1rm.press': 'prs.overheadPress.value',
    '1rm.overhead_press': 'prs.overheadPress.value',
    '1rm.weighted_pullup': 'prs.weightedPullUp.value',
    '1rm.weighted_pull_up': 'prs.weightedPullUp.value',
    'max_hr': 'benchmarks.maxHR.value',
    'aet_hr': 'benchmarks.aerobicThresholdHR.value',
    'ant_hr': 'benchmarks.anaerobicThresholdHR.value',
    'resting_hr': 'benchmarks.restingHR.value'
  };

  const mappedField = fieldMap[field.toLowerCase()] || field;
  const parts = mappedField.split('.');
  
  let value = profile;
  for (const part of parts) {
    if (value === null || value === undefined) return null;
    value = value[part];
  }

  return value;
};

// ============== EQUIPMENT CHECKER ==============
export const checkEquipmentAvailability = (template, availableEquipment = []) => {
  const required = template.equipment_required || [];
  const missing = required.filter(eq => !availableEquipment.includes(eq));
  
  return {
    complete: missing.length === 0,
    missing,
    available: required.filter(eq => availableEquipment.includes(eq))
  };
};

