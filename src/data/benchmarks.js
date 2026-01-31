// Benchmark Tests and Athlete Profile Defaults

// Default athlete profile structure
export const DEFAULT_ATHLETE_PROFILE = {
  name: '',
  age: null,
  weight: 225,
  height: 74,
  // Available equipment at user's gym (for smart substitutions)
  availableEquipment: [
    'barbell', 'dumbbell', 'kettlebell', 'pullupBar', 'bench',
    'cable', 'machine', 'bodyweight', 'bands'
  ],
  prs: {
    trapBarDeadlift: { value: null, date: null, unit: 'lbs' },
    backSquat: { value: null, date: null, unit: 'lbs' },
    frontSquat: { value: null, date: null, unit: 'lbs' },
    benchPress: { value: null, date: null, unit: 'lbs' },
    overheadPress: { value: null, date: null, unit: 'lbs' },
    weightedPullUp: { value: null, date: null, unit: 'lbs', note: 'Added weight' },
    weightedDip: { value: null, date: null, unit: 'lbs', note: 'Added weight' },
    boxStepUp: { value: null, date: null, unit: 'lbs', note: 'Per hand DB' },
  },
  benchmarks: {
    fiveMileTime: { value: null, date: null, unit: 'min:sec' },
    aerobicThresholdHR: { value: null, date: null, unit: 'bpm' },
    anaerobicThresholdHR: { value: null, date: null, unit: 'bpm' },
    maxHR: { value: null, date: null, unit: 'bpm' },
    restingHR: { value: null, date: null, unit: 'bpm' },
    hrvBaseline: { value: null, date: null, unit: 'ms' },
    verticalRate: { value: null, date: null, unit: 'ft/hr', note: 'At 25% BW' },
    vo2max: { value: null, date: null, unit: 'ml/kg/min' },
  },
  history: [],
  lastUpdated: null,
};

// Readiness check defaults
export const DEFAULT_READINESS = {
  logs: [], // Array of { date, sleepQuality, sleepHours, energyLevel, musclesoreness, motivation, restingHR, hrv, notes, score }
};

// Display name mappings
export const PR_DISPLAY_NAMES = {
  trapBarDeadlift: 'Trap Bar Deadlift',
  backSquat: 'Back Squat',
  frontSquat: 'Front Squat',
  benchPress: 'Bench Press',
  overheadPress: 'Overhead Press',
  weightedPullUp: 'Weighted Pull-Up',
  weightedDip: 'Weighted Dip',
  boxStepUp: 'Box Step-Up',
};

export const BENCHMARK_DISPLAY_NAMES = {
  fiveMileTime: '5-Mile Time',
  aerobicThresholdHR: 'Aerobic Threshold HR',
  anaerobicThresholdHR: 'Anaerobic Threshold HR',
  maxHR: 'Max Heart Rate',
  restingHR: 'Resting HR',
  hrvBaseline: 'HRV Baseline',
  verticalRate: 'Vertical Rate',
  vo2max: 'VO2 Max',
  aetDrift: 'AeT Drift %',
};

// Benchmark test protocols
export const BENCHMARK_TESTS = {
  fiveMile: {
    id: 'fiveMile',
    name: '5-Mile Time Trial',
    icon: '🏃',
    duration: '30-40 min',
    frequency: 6,
    category: 'aerobic',
    description: 'All-out 5-mile effort to track aerobic progress',
    protocol: [
      'Ensure adequate rest (no hard training 48 hrs prior)',
      'Warm up: 10-15 min easy jog + dynamic stretches + 2-3 strides',
      'Find flat, measurable course (track ideal)',
      'Start GPS/timer',
      'Run at maximum sustainable pace',
      'Record total time immediately',
      'Cool down: 10 min easy jog'
    ],
    metrics: [
      { key: 'time', label: 'Total Time', type: 'time', unit: 'min:sec' },
      { key: 'avgHR', label: 'Average HR', type: 'number', unit: 'bpm' },
      { key: 'maxHR', label: 'Max HR', type: 'number', unit: 'bpm' },
      { key: 'avgPace', label: 'Avg Pace', type: 'pace', unit: 'min/mile' },
    ],
    targetKey: 'fiveMileTime',
    notes: 'Goal progression: 36:00 → 34:00 → 32:00',
    benchmarkTargets: { excellent: '32:00', good: '35:00', passing: '40:00' }
  },
  aetDrift: {
    id: 'aetDrift',
    name: 'Aerobic Threshold (AeT) Drift Test',
    icon: '💓',
    duration: '60 min',
    frequency: 3,
    category: 'aerobic',
    description: 'Measure cardiac drift to assess aerobic base fitness',
    protocol: [
      'Warm up: 15 min building to AeT pace',
      'Set treadmill/pace to maintain AeT HR (or best guess ~75% max)',
      'Run for 60 minutes at CONSTANT PACE',
      'Record HR at 0, 15, 30, 45, 60 min marks',
      'Calculate drift: (HR at 60min - HR at 15min) / HR at 15min × 100',
      'Pass: <5% drift. Fail: >5% drift means more base needed'
    ],
    metrics: [
      { key: 'pace', label: 'Constant Pace', type: 'pace', unit: 'min/mile' },
      { key: 'hr15', label: 'HR at 15 min', type: 'number', unit: 'bpm' },
      { key: 'hr30', label: 'HR at 30 min', type: 'number', unit: 'bpm' },
      { key: 'hr45', label: 'HR at 45 min', type: 'number', unit: 'bpm' },
      { key: 'hr60', label: 'HR at 60 min', type: 'number', unit: 'bpm' },
      { key: 'drift', label: 'Drift %', type: 'calculated', unit: '%' },
    ],
    calculateDrift: (data) => {
      if (data.hr15 && data.hr60) {
        return (((data.hr60 - data.hr15) / data.hr15) * 100).toFixed(1);
      }
      return null;
    },
    targetKey: 'aetDrift',
    notes: '<5% = strong aerobic base. 5-10% = adequate. >10% = needs work',
    benchmarkTargets: { excellent: '<3%', good: '<5%', passing: '<10%' }
  },
  anaerobicThreshold: {
    id: 'anaerobicThreshold',
    name: 'Anaerobic Threshold (AnT) Test',
    icon: '🔥',
    duration: '30-35 min',
    frequency: 6,
    category: 'aerobic',
    description: '30-minute time trial to find sustainable threshold pace and HR',
    protocol: [
      'Warm up: 15 min progressive (easy → moderate)',
      'Find flat course or treadmill',
      'Start timer and run at HARDEST SUSTAINABLE PACE for 30 minutes',
      'This should feel like a hard tempo - uncomfortable but maintainable',
      'Record average HR for final 20 minutes (ignore first 10 min)',
      'This HR is your Anaerobic Threshold',
      'Cool down: 10 min easy'
    ],
    metrics: [
      { key: 'distance', label: 'Distance', type: 'number', unit: 'miles' },
      { key: 'avgHRLast20', label: 'Avg HR (last 20 min)', type: 'number', unit: 'bpm' },
      { key: 'avgPace', label: 'Avg Pace', type: 'pace', unit: 'min/mile' },
      { key: 'maxHR', label: 'Max HR', type: 'number', unit: 'bpm' },
    ],
    targetKey: 'anaerobicThresholdHR',
    notes: 'AnT HR typically 85-90% of max. Compare to AeT to find your gap.',
    benchmarkTargets: { excellent: '<10% gap from AeT', good: '<15% gap', passing: '<20% gap' }
  },
  verticalRate: {
    id: 'verticalRate',
    name: 'Vertical Rate Test',
    icon: '⛰️',
    duration: '60 min',
    frequency: 3,
    category: 'mountaineering',
    description: 'Measure uphill hiking efficiency under load',
    protocol: [
      'Load pack to 25% bodyweight',
      'Find sustained climb or use treadmill at 15% grade',
      'Warm up: 10 min easy hiking',
      'Start timer and elevation tracking',
      'Hike at maximum sustainable pace for 60 min',
      'Maintain Zone 2-3 HR if possible',
      'Record total vertical feet gained',
      'Calculate rate: vertical feet / time in hours'
    ],
    metrics: [
      { key: 'load', label: 'Pack Weight', type: 'number', unit: 'lbs' },
      { key: 'loadPercent', label: 'Load % BW', type: 'calculated', unit: '%' },
      { key: 'verticalFeet', label: 'Vertical Gain', type: 'number', unit: 'ft' },
      { key: 'duration', label: 'Duration', type: 'number', unit: 'min' },
      { key: 'avgHR', label: 'Average HR', type: 'number', unit: 'bpm' },
      { key: 'rate', label: 'Vertical Rate', type: 'calculated', unit: 'ft/hr' },
    ],
    calculateRate: (data) => {
      if (data.verticalFeet && data.duration) {
        return Math.round((data.verticalFeet / data.duration) * 60);
      }
      return null;
    },
    targetKey: 'verticalRate',
    notes: 'Target: 1000 ft/hr at 25% BW while staying in Zone 2',
    benchmarkTargets: { excellent: '>1200 ft/hr', good: '>1000 ft/hr', passing: '>800 ft/hr' }
  },
  ruckMarch: {
    id: 'ruckMarch',
    name: '3-Mile Ruck March',
    icon: '🎒',
    duration: '35-50 min',
    frequency: 3,
    category: 'mountaineering',
    description: 'Loaded 3-mile march for tactical/mountain fitness baseline',
    protocol: [
      'Load pack to 35 lbs (or specified weight)',
      'Find flat to rolling terrain',
      'Warm up: 5 min easy walk',
      'Start timer',
      'Move as fast as possible - run/walk as needed',
      'Maintain good posture, no shuffling',
      'Record total time at 3 miles',
      'Note conditions (terrain, weather)'
    ],
    metrics: [
      { key: 'load', label: 'Pack Weight', type: 'number', unit: 'lbs' },
      { key: 'time', label: 'Total Time', type: 'time', unit: 'min:sec' },
      { key: 'avgHR', label: 'Average HR', type: 'number', unit: 'bpm' },
      { key: 'terrain', label: 'Terrain', type: 'select', options: ['Flat', 'Rolling', 'Hilly', 'Trail'] },
      { key: 'pace', label: 'Pace', type: 'calculated', unit: 'min/mile' },
    ],
    calculatePace: (data) => {
      if (data.time) {
        const [mins, secs] = data.time.split(':').map(Number);
        const totalMins = mins + (secs || 0) / 60;
        return (totalMins / 3).toFixed(2);
      }
      return null;
    },
    targetKey: 'ruckMarchTime',
    notes: 'Selection standard: 3 miles in 45 min with 35 lbs',
    benchmarkTargets: { excellent: '<36:00', good: '<42:00', passing: '<45:00' }
  },
  maxHR: {
    id: 'maxHR',
    name: 'Max Heart Rate Test',
    icon: '❤️‍🔥',
    duration: '20-25 min',
    frequency: 12,
    category: 'baseline',
    description: 'Find true max HR for accurate zone calculation',
    protocol: [
      'Ensure full recovery and no fatigue',
      'Warm up: 15 min progressive (easy → moderate → hard)',
      'Find a hill or set treadmill to 6-8% grade',
      'Run 3 × 2 min at increasing max effort:',
      '  - Interval 1: Hard (90% effort)',
      '  - Interval 2: Very Hard (95% effort)',
      '  - Interval 3: ALL OUT (100% effort)',
      '1 min recovery between intervals',
      'Record highest HR achieved',
      'Cool down: 10 min easy'
    ],
    metrics: [
      { key: 'maxHR', label: 'Max HR Achieved', type: 'number', unit: 'bpm' },
      { key: 'method', label: 'Method', type: 'select', options: ['Hill repeats', 'Treadmill', 'Track', 'Other'] },
    ],
    targetKey: 'maxHR',
    notes: 'This will be uncomfortable. Have this number dialed before starting a program.'
  },
  strengthTest: {
    id: 'strengthTest',
    name: 'Strength Testing Session',
    icon: '🏋️',
    duration: '90 min',
    frequency: 6,
    category: 'strength',
    description: 'Establish or re-test 1RM for program calculations',
    protocol: [
      'Full rest day before testing',
      'Extended warm-up: 15 min cardio + mobility',
      'For each lift, pyramid up:',
      '  - 10 reps @ 50%',
      '  - 5 reps @ 70%',
      '  - 3 reps @ 80%',
      '  - 1 rep @ 90%',
      '  - Attempt new 1RM',
      'Rest 3-5 min between max attempts',
      'Test in order: Deadlift → Squat → Bench/Press → Pull-up → Dip',
      'Stop if form breaks down'
    ],
    metrics: [
      { key: 'trapBarDeadlift', label: 'Trap Bar Deadlift', type: 'number', unit: 'lbs' },
      { key: 'backSquat', label: 'Back Squat', type: 'number', unit: 'lbs' },
      { key: 'benchPress', label: 'Bench Press', type: 'number', unit: 'lbs' },
      { key: 'overheadPress', label: 'Overhead Press', type: 'number', unit: 'lbs' },
      { key: 'weightedPullUp', label: 'Weighted Pull-up', type: 'number', unit: 'lbs added' },
      { key: 'weightedDip', label: 'Weighted Dip', type: 'number', unit: 'lbs added' },
    ],
    targetKey: 'prs',
    notes: 'Not every lift needs testing every time. Focus on program-relevant lifts.'
  },
  meCapacity: {
    id: 'meCapacity',
    name: 'Muscular Endurance Capacity Test',
    icon: '🔄',
    duration: '30-45 min',
    frequency: 3,
    category: 'muscular_endurance',
    description: 'Max step-ups in 20 minutes to benchmark ME fitness',
    protocol: [
      'Set up 20" box with dumbbells (start at 20% BW total)',
      'Warm up: 5 min easy step-ups + mobility',
      'Start 20-minute timer',
      'Perform continuous alternating step-ups',
      'Pace: 1 step every 2 seconds (30/min) or faster',
      'Count total steps (each foot = 1 step)',
      'Stop if form breaks or pace drops significantly',
      'Record total steps and any stops'
    ],
    metrics: [
      { key: 'load', label: 'Total DB Weight', type: 'number', unit: 'lbs' },
      { key: 'loadPercent', label: 'Load % BW', type: 'calculated', unit: '%' },
      { key: 'totalSteps', label: 'Total Steps', type: 'number', unit: 'steps' },
      { key: 'duration', label: 'Actual Duration', type: 'number', unit: 'min' },
      { key: 'avgHR', label: 'Average HR', type: 'number', unit: 'bpm' },
      { key: 'stepsPerMin', label: 'Steps/min', type: 'calculated', unit: 'spm' },
    ],
    calculateStepsPerMin: (data) => {
      if (data.totalSteps && data.duration) {
        return (data.totalSteps / data.duration).toFixed(1);
      }
      return null;
    },
    targetKey: 'meCapacity',
    notes: 'Target: 600 steps @ 20% BW for Conversion phase exit',
    benchmarkTargets: { excellent: '>700 steps', good: '>600 steps', passing: '>500 steps' }
  },
  gripEndurance: {
    id: 'gripEndurance',
    name: 'Grip Strength & Endurance',
    icon: '✊',
    duration: '15 min',
    frequency: 3,
    category: 'strength',
    description: 'Dead hang and farmer carry to test grip for loaded carries',
    protocol: [
      'Test 1: Dead Hang',
      '  - Hang from pull-up bar with overhand grip',
      '  - Time until failure (hands release)',
      '',
      'Rest 5 minutes',
      '',
      'Test 2: Farmer Carry',
      '  - Load 50% bodyweight total (25% each hand)',
      '  - Walk until grip fails',
      '  - Record distance or time'
    ],
    metrics: [
      { key: 'deadHangTime', label: 'Dead Hang Time', type: 'number', unit: 'sec' },
      { key: 'farmerWeight', label: 'Farmer Carry Weight (total)', type: 'number', unit: 'lbs' },
      { key: 'farmerDistance', label: 'Farmer Carry Distance', type: 'number', unit: 'ft' },
      { key: 'farmerTime', label: 'Farmer Carry Time', type: 'number', unit: 'sec' },
    ],
    targetKey: 'gripEndurance',
    notes: 'Dead hang >90 sec and farmer carry 200+ ft at 50% BW = solid grip',
    benchmarkTargets: { excellent: '>120s hang', good: '>90s hang', passing: '>60s hang' }
  },
  workCapacity: {
    id: 'workCapacity',
    name: 'Work Capacity Test',
    icon: '⚡',
    duration: '20 min',
    frequency: 6,
    category: 'conditioning',
    description: 'Timed circuit to measure overall work capacity',
    protocol: [
      'Complete the following for time:',
      '',
      '5 Rounds:',
      '  - 10 Box Jumps (20")',
      '  - 10 Push-ups',
      '  - 10 KB Swings (53/35 lbs)',
      '  - 10 Air Squats',
      '  - 200m Run',
      '',
      'Minimal rest between movements',
      'Record total time',
      'Note any scaling or modifications'
    ],
    metrics: [
      { key: 'totalTime', label: 'Total Time', type: 'time', unit: 'min:sec' },
      { key: 'kbWeight', label: 'KB Weight', type: 'number', unit: 'lbs' },
      { key: 'avgHR', label: 'Average HR', type: 'number', unit: 'bpm' },
      { key: 'maxHR', label: 'Max HR', type: 'number', unit: 'bpm' },
      { key: 'scaled', label: 'Scaled?', type: 'select', options: ['Rx', 'Scaled', 'Modified'] },
    ],
    targetKey: 'workCapacity',
    notes: 'Rx target: <18 minutes. Tests anaerobic endurance and recovery.',
    benchmarkTargets: { excellent: '<15:00', good: '<18:00', passing: '<22:00' }
  },
  bodyComp: {
    id: 'bodyComp',
    name: 'Body Composition Check',
    icon: '📏',
    duration: '5 min',
    frequency: 1,
    category: 'baseline',
    description: 'Track weight and basic measurements for trends',
    protocol: [
      'Weigh first thing in morning, after bathroom',
      'Same scale, same conditions each time',
      'Optional measurements (relaxed, not flexed):',
      '  - Waist at navel',
      '  - Chest at nipple line',
      '  - Thigh at midpoint',
      'Note any significant changes in diet or training'
    ],
    metrics: [
      { key: 'weight', label: 'Body Weight', type: 'number', unit: 'lbs' },
      { key: 'waist', label: 'Waist', type: 'number', unit: 'in' },
      { key: 'chest', label: 'Chest', type: 'number', unit: 'in' },
      { key: 'thigh', label: 'Thigh', type: 'number', unit: 'in' },
      { key: 'notes', label: 'Notes', type: 'text', unit: '' },
    ],
    targetKey: 'bodyComp',
    notes: 'Track trends, not daily fluctuations. Weekly weigh-ins are enough.'
  }
};
