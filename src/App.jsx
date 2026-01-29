import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Dumbbell, TrendingUp, CheckCircle2, Circle, ChevronRight, 
  ChevronLeft, Play, Clock, Flame, Menu, X, Download, Upload,
  Settings, Activity, Mountain, Home, BarChart3, Trash2, Moon, Sun, 
  Plus, FileUp, User, Target, Zap, Award, Timer, Heart, Scale,
  ChevronDown, ChevronUp, Edit3, Save, X as XIcon, AlertTriangle,
  Battery, BatteryLow, BatteryMedium, BatteryFull, Bed, Brain,
  TrendingDown, Minus, ArrowRight, Flag, PlayCircle, StopCircle,
  RotateCcw, Info, LineChart
} from 'lucide-react';

// ============== STORAGE HOOK ==============
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) { return initialValue; }
  });
  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) { console.error(error); }
  };
  return [storedValue, setValue];
};

// ============== ATHLETE PROFILE DEFAULTS ==============
const DEFAULT_ATHLETE_PROFILE = {
  name: '',
  age: null,
  weight: 225,
  height: 74,
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

// ============== READINESS CHECK DEFAULTS ==============
const DEFAULT_READINESS = {
  // Daily check-in data
  logs: [], // Array of { date, sleepQuality, sleepHours, energyLevel, musclesoreness, motivation, restingHR, hrv, notes, score }
};

// ============== BENCHMARK TEST PROTOCOLS ==============
const BENCHMARK_TESTS = {
  fiveMile: {
    id: 'fiveMile',
    name: '5-Mile Time Trial',
    icon: '🏃',
    duration: '30-40 min',
    frequency: 'Every 4-8 weeks',
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
    notes: 'Goal progression: 36:00 → 34:00 → 32:00'
  },
  aetDrift: {
    id: 'aetDrift',
    name: 'Aerobic Threshold (AeT) Drift Test',
    icon: '💓',
    duration: '60 min',
    frequency: 'Every 4 weeks',
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
    notes: '<5% = strong aerobic base. 5-10% = adequate. >10% = needs work'
  },
  verticalRate: {
    id: 'verticalRate',
    name: 'Vertical Rate Test',
    icon: '⛰️',
    duration: '60 min',
    frequency: 'Every 4 weeks (Conversion/Specificity phases)',
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
    notes: 'Target: 1000 ft/hr at 25% BW while staying in Zone 2'
  },
  maxHR: {
    id: 'maxHR',
    name: 'Max Heart Rate Test',
    icon: '❤️‍🔥',
    duration: '20-25 min',
    frequency: 'Once per training cycle (or if zones feel off)',
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
      { key: 'method', label: 'Method', type: 'text', unit: '' },
    ],
    targetKey: 'maxHR',
    notes: 'This will be uncomfortable. Have this number dialed before starting a program.'
  },
  strengthTest: {
    id: 'strengthTest',
    name: 'Strength Testing Session',
    icon: '🏋️',
    duration: '90 min',
    frequency: 'Every 8-12 weeks or between programs',
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
  }
};

// ============== UTILITY FUNCTIONS ==============
const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
const formatDateShort = (date) => date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-';
const getTodayKey = () => new Date().toISOString().split('T')[0];

const getTypeColor = (type, dark) => {
  const colors = { 
    strength: dark ? 'bg-red-600' : 'bg-red-500', 
    cardio: dark ? 'bg-blue-600' : 'bg-blue-500', 
    muscular_endurance: dark ? 'bg-orange-600' : 'bg-orange-500', 
    recovery: dark ? 'bg-green-600' : 'bg-green-500', 
    long_effort: dark ? 'bg-purple-600' : 'bg-purple-500' 
  };
  return colors[type] || (dark ? 'bg-gray-600' : 'bg-gray-500');
};

const getTypeBorder = (type) => ({ 
  strength: 'border-red-500', 
  cardio: 'border-blue-500', 
  muscular_endurance: 'border-orange-500', 
  recovery: 'border-green-500', 
  long_effort: 'border-purple-500' 
}[type] || 'border-gray-500');

const getTypeIcon = (type) => ({ 
  strength: Dumbbell, 
  cardio: Activity, 
  muscular_endurance: Flame, 
  recovery: Circle, 
  long_effort: Mountain 
}[type] || Circle);

const calculateZones = (maxHR, aetHR, antHR) => {
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

const calculateLoadTargets = (weight) => {
  if (!weight) return null;
  return {
    light: Math.round(weight * 0.15),
    base: Math.round(weight * 0.20),
    standard: Math.round(weight * 0.25),
    peak: Math.round(weight * 0.30),
  };
};

const calculateWorkingWeight = (prValue, percentage) => {
  if (!prValue || !percentage) return null;
  return Math.round(prValue * (percentage / 100) / 5) * 5;
};

// Calculate readiness score from check-in data
const calculateReadinessScore = (data) => {
  if (!data) return null;
  
  let score = 0;
  let factors = 0;
  
  // Sleep quality (1-5) → 0-25 points
  if (data.sleepQuality) {
    score += (data.sleepQuality / 5) * 25;
    factors++;
  }
  
  // Sleep hours (optimal 7-9) → 0-25 points
  if (data.sleepHours) {
    if (data.sleepHours >= 7 && data.sleepHours <= 9) score += 25;
    else if (data.sleepHours >= 6 && data.sleepHours < 7) score += 18;
    else if (data.sleepHours > 9 && data.sleepHours <= 10) score += 20;
    else if (data.sleepHours >= 5 && data.sleepHours < 6) score += 10;
    else score += 5;
    factors++;
  }
  
  // Energy level (1-5) → 0-20 points
  if (data.energyLevel) {
    score += (data.energyLevel / 5) * 20;
    factors++;
  }
  
  // Muscle soreness (1-5, inverted - 1 is best) → 0-15 points
  if (data.soreness) {
    score += ((6 - data.soreness) / 5) * 15;
    factors++;
  }
  
  // Motivation (1-5) → 0-15 points
  if (data.motivation) {
    score += (data.motivation / 5) * 15;
    factors++;
  }
  
  // HRV (compared to baseline) - bonus/penalty
  // This would need baseline comparison
  
  return factors > 0 ? Math.round(score) : null;
};

const getReadinessColor = (score) => {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
};

const getReadinessLabel = (score) => {
  if (score >= 85) return { text: 'Fully Ready', icon: BatteryFull, recommendation: 'Green light for hard training' };
  if (score >= 70) return { text: 'Good', icon: BatteryMedium, recommendation: 'Proceed as planned' };
  if (score >= 55) return { text: 'Moderate', icon: BatteryMedium, recommendation: 'Consider reducing intensity 10-15%' };
  if (score >= 40) return { text: 'Low', icon: BatteryLow, recommendation: 'Reduce volume/intensity or swap for recovery' };
  return { text: 'Recovery Needed', icon: Battery, recommendation: 'Active recovery or rest day recommended' };
};

const PR_DISPLAY_NAMES = {
  trapBarDeadlift: 'Trap Bar Deadlift',
  backSquat: 'Back Squat',
  frontSquat: 'Front Squat',
  benchPress: 'Bench Press',
  overheadPress: 'Overhead Press',
  weightedPullUp: 'Weighted Pull-Up',
  weightedDip: 'Weighted Dip',
  boxStepUp: 'Box Step-Up',
};

const BENCHMARK_DISPLAY_NAMES = {
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

// ============== DEFAULT PROGRAM ==============
const DEFAULT_PROGRAMS = {
  combatAlpinist: {
    id: 'combatAlpinist',
    name: 'Combat Alpinist',
    description: 'Integrated mountaineering protocol',
    icon: '⛰️',
    isDefault: true,
    phases: [
      {
        id: 'foundation', name: 'Foundation', weeks: [1, 16],
        description: 'Build aerobic engine, maintain strength. 80% Zone 1-2.',
        weeklyTemplate: [
          { day: 1, dayName: 'Day 1', session: 'Strength A', type: 'strength', duration: 60, prescription: { warmup: '10 min easy cardio + dynamic stretching', exercises: [ { name: 'Trap Bar Deadlift', sets: 4, reps: '3-5', rest: '3 min', prKey: 'trapBarDeadlift', percentage: 85 }, { name: 'Box Step-Up (each leg)', sets: 4, reps: '3-5', rest: '3 min', prKey: 'boxStepUp', percentage: 100 }, { name: 'Weighted Pull-Up', sets: 4, reps: '3-5', rest: '3 min', prKey: 'weightedPullUp', percentage: 85 }, { name: 'Dip', sets: 4, reps: '3-5', rest: '3 min', prKey: 'weightedDip', percentage: 85 } ], cooldown: '5 min walk + static stretching', intensity: '85% 1RM - leave 1-2 reps in tank' } },
          { day: 2, dayName: 'Day 2', session: 'Zone 2 Run', type: 'cardio', duration: 70, prescription: { description: 'Easy conversational pace', hrZone: 'zone2', notes: ['Nasal breathing preferred', 'If HR drifts up, slow down'], intensity: 'Zone 2' } },
          { day: 3, dayName: 'Day 3', session: 'Zone 2 + Mobility', type: 'cardio', duration: 55, prescription: { description: '30-40 min easy aerobic + 15-20 min mobility', hrZone: 'zone2', exercises: [ { name: 'Pigeon Pose', duration: '2 min each side' }, { name: 'Cat-Cow', reps: 20 }, { name: 'Thread the Needle', reps: '10 each side' }, { name: "Child's Pose", duration: '2 min' }, { name: "World's Greatest Stretch", reps: '5 each side' } ], intensity: 'Zone 1-2' } },
          { day: 4, dayName: 'Day 4', session: 'Threshold Intervals', type: 'cardio', duration: 45, prescription: { warmup: '10 min easy jog', mainSet: '4 x 8 min at Aerobic Threshold', recovery: '2 min easy jog between', hrZone: 'zone3', cooldown: '5-10 min easy jog', intensity: 'Zone 3-4', notes: ['Comfortably hard', 'HR at AeT'] } },
          { day: 5, dayName: 'Day 5', session: 'Strength B', type: 'strength', duration: 60, prescription: { warmup: '10 min easy cardio + dynamic stretching', exercises: [ { name: 'Trap Bar Deadlift', sets: 4, reps: '3-5', rest: '3 min', prKey: 'trapBarDeadlift', percentage: 85 }, { name: 'Box Step-Up (each leg)', sets: 4, reps: '3-5', rest: '3 min', prKey: 'boxStepUp', percentage: 100 }, { name: 'Weighted Pull-Up', sets: 4, reps: '3-5', rest: '3 min', prKey: 'weightedPullUp', percentage: 85 }, { name: 'Dip', sets: 4, reps: '3-5', rest: '3 min', prKey: 'weightedDip', percentage: 85 } ], accessory: [ { name: 'Face Pulls', sets: 2, reps: 15 }, { name: 'Pallof Press', sets: 2, reps: 15 } ], cooldown: '5 min walk', intensity: '85% 1RM' } },
          { day: 6, dayName: 'Day 6', session: 'Long Aerobic', type: 'long_effort', duration: 150, prescription: { description: 'Long Zone 1-2 effort', hrZone: 'zone2', options: ['Long hike', 'Long run', 'Combo'], nutrition: '30-60g carbs/hr after first hour', hydration: '16-24 oz/hr', intensity: 'Zone 1-2', progression: { 'Weeks 1-4': '2 hours', 'Weeks 5-8': '2.5 hours', 'Weeks 9-12': '2.5-3 hours', 'Weeks 13-16': '3+ hours' } } },
          { day: 7, dayName: 'Day 7', session: 'Active Recovery', type: 'recovery', duration: 30, prescription: { description: 'Very easy movement or complete rest', hrZone: 'zone1', options: ['Easy walk', 'Light yoga', 'Swimming', 'Foam rolling'], intensity: 'Zone 1 or rest', notes: ['This is NOT a workout'] } }
        ],
        benchmarks: [ { name: 'AeT HR Drift', target: '<5%', key: 'aetDrift' }, { name: '5-Mile Run', target: '<36:00', key: 'fiveMileTime' }, { name: 'Strength', target: 'Maintained', key: 'strengthMaintenance' } ]
      },
      {
        id: 'conversion', name: 'Conversion', weeks: [17, 28],
        description: 'Convert strength to muscular endurance.',
        weeklyTemplate: [
          { day: 1, dayName: 'Day 1', session: 'Strength (Reduced)', type: 'strength', duration: 45, prescription: { warmup: '10 min easy cardio', exercises: [ { name: 'Trap Bar Deadlift', sets: 3, reps: '3-5', rest: '3 min', prKey: 'trapBarDeadlift', percentage: 85 }, { name: 'Box Step-Up', sets: 3, reps: '3-5', rest: '3 min', prKey: 'boxStepUp', percentage: 100 }, { name: 'Weighted Pull-Up', sets: 3, reps: '3-5', rest: '3 min', prKey: 'weightedPullUp', percentage: 85 }, { name: 'Dip', sets: 3, reps: '3-5', rest: '3 min', prKey: 'weightedDip', percentage: 85 } ], intensity: 'Maintenance only' } },
          { day: 2, dayName: 'Day 2', session: 'Zone 2 Run', type: 'cardio', duration: 60, prescription: { description: 'Easy recovery-pace run', hrZone: 'zone2', intensity: 'Zone 2' } },
          { day: 3, dayName: 'Day 3', session: 'Gym ME Session', type: 'muscular_endurance', duration: 70, prescription: { warmup: '10 min easy cardio', description: 'Continuous circuit, minimal rest', exercises: [ { name: 'Box Step-Up' }, { name: 'Walking Lunge' }, { name: 'Split Squat' }, { name: 'Heel Touch' } ], tempo: '1 rep every 2 seconds', loadType: 'bodyweight_percentage', progression: { 'Weeks 17-20': { load: 0, steps: 400 }, 'Weeks 21-24': { load: 10, steps: 500 }, 'Weeks 25-28': { load: 20, steps: 600 } } } },
          { day: 4, dayName: 'Day 4', session: 'Zone 2 + Mobility', type: 'cardio', duration: 45, prescription: { description: '30 min easy + 15 min mobility', hrZone: 'zone2' } },
          { day: 5, dayName: 'Day 5', session: 'Threshold Intervals', type: 'cardio', duration: 45, prescription: { warmup: '10 min building', mainSet: '5 x 6 min at tempo', recovery: '2 min jog', hrZone: 'zone3', cooldown: '5-10 min easy' } },
          { day: 6, dayName: 'Day 6', session: 'Outdoor ME (Water Jug)', type: 'muscular_endurance', duration: 90, prescription: { description: 'THE WATER JUG PROTOCOL', steps: ['Fill pack to target weight', 'Find steep terrain 30%+', 'Hike up 60-90 min', 'DUMP WATER at top', 'Descend empty'], loadType: 'bodyweight_percentage', progression: { 'Weeks 17-20': { load: 15, duration: 60 }, 'Weeks 21-24': { load: 20, duration: 75 }, 'Weeks 25-28': { load: 25, duration: 90 } } } },
          { day: 7, dayName: 'Day 7', session: 'Active Recovery', type: 'recovery', duration: 30, prescription: { description: 'Easy movement or rest', hrZone: 'zone1' } }
        ],
        benchmarks: [ { name: 'Gym ME', target: '600 steps @ 20% BW', key: 'gymME' }, { name: '5-Mile', target: '<34:00', key: 'fiveMileTime' }, { name: 'AeT/AnT Gap', target: '<12%', key: 'thresholdGap' } ]
      },
      {
        id: 'specificity', name: 'Specificity', weeks: [29, 40],
        description: 'Expedition simulation. Peak loads.',
        weeklyTemplate: [
          { day: 1, dayName: 'Day 1', session: 'Strength (Minimal)', type: 'strength', duration: 40, prescription: { exercises: [ { name: 'Trap Bar Deadlift', sets: 3, reps: '3-5', rest: '3 min', prKey: 'trapBarDeadlift', percentage: 82 }, { name: 'Weighted Pull-Up', sets: 3, reps: '3-5', rest: '3 min', prKey: 'weightedPullUp', percentage: 82 } ], intensity: '80-85% 1RM' } },
          { day: 2, dayName: 'Day 2', session: 'Zone 2 Run', type: 'cardio', duration: 55, prescription: { description: 'Easy recovery', hrZone: 'zone2' } },
          { day: 3, dayName: 'Day 3', session: 'Peak ME Session', type: 'muscular_endurance', duration: 75, prescription: { description: 'Circuit at peak load', target: '800-1000 steps', loadType: 'bodyweight_percentage', load: 25, tempo: '1 step/2 sec' } },
          { day: 4, dayName: 'Day 4', session: 'Off or Mobility', type: 'recovery', duration: 30, prescription: { description: 'TRUE RECOVERY - needed for sawtooth', options: ['Complete rest', 'Light mobility'] } },
          { day: 5, dayName: 'Day 5', session: 'Tempo Run', type: 'cardio', duration: 45, prescription: { warmup: '10 min building', mainSet: '3 x 1 mile at goal pace', recovery: '2-3 min jog', cooldown: '10 min easy', intensity: 'Goal 5-mile pace (6:24/mi for 32:00)' } },
          { day: 6, dayName: 'Day 6', session: 'Sawtooth Day 1', type: 'long_effort', duration: 300, prescription: { description: 'LONG LOADED EFFORT', loadType: 'bodyweight_percentage', load: 27, duration: '4-6 hours', benchmark: '1000 ft/hr in Zone 2', nutrition: '60-90g carbs/hr', hydration: '16-24 oz/hr' } },
          { day: 7, dayName: 'Day 7', session: 'Sawtooth Day 2', type: 'long_effort', duration: 150, prescription: { description: 'BACK-TO-BACK fatigue resistance', loadType: 'bodyweight_percentage', load: 15, duration: '2-3 hours', hrZone: 'zone2' } }
        ],
        benchmarks: [ { name: 'Vertical Rate', target: '1000 ft/hr @ 25% BW', key: 'verticalRate' }, { name: '5-Mile', target: '<32:00', key: 'fiveMileTime' }, { name: 'AeT/AnT Gap', target: '<10%', key: 'thresholdGap' } ]
      }
    ]
  }
};

// ============== READINESS CHECK COMPONENT ==============
const ReadinessCheckView = ({ readiness, setReadiness, athleteProfile, theme, darkMode }) => {
  const todayKey = getTodayKey();
  const todayCheck = readiness.logs?.find(l => l.date === todayKey);
  const [formData, setFormData] = useState(todayCheck || {
    sleepQuality: 3,
    sleepHours: 7,
    energyLevel: 3,
    soreness: 3,
    motivation: 3,
    restingHR: '',
    hrv: '',
    notes: ''
  });

  useEffect(() => {
    if (todayCheck) setFormData(todayCheck);
  }, [todayCheck]);

  const score = calculateReadinessScore(formData);
  const readinessInfo = score ? getReadinessLabel(score) : null;

  const saveCheck = () => {
    const entry = {
      ...formData,
      date: todayKey,
      score: calculateReadinessScore(formData),
      timestamp: new Date().toISOString()
    };
    setReadiness(prev => ({
      ...prev,
      logs: [...(prev.logs || []).filter(l => l.date !== todayKey), entry].slice(-90) // Keep 90 days
    }));
  };

  const SliderInput = ({ label, value, onChange, min = 1, max = 5, labels }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className={`text-sm font-medium ${theme.text}`}>{label}</label>
        <span className={`font-mono font-bold ${theme.text}`}>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      {labels && (
        <div className={`flex justify-between text-xs ${theme.textMuted}`}>
          {labels.map((l, i) => <span key={i}>{l}</span>)}
        </div>
      )}
    </div>
  );

  // Get last 7 days of data for mini chart
  const last7Days = [...(readiness.logs || [])].filter(l => {
    const d = new Date(l.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-bold ${theme.text}`}>Readiness Check</h2>
        <span className={`text-sm ${theme.textMuted}`}>{formatDateShort(todayKey)}</span>
      </div>

      {/* Score Display */}
      {score && (
        <div className={`${theme.card} rounded-xl shadow-sm p-5 text-center`}>
          <div className={`text-5xl font-bold ${getReadinessColor(score)}`}>{score}</div>
          <div className={`flex items-center justify-center gap-2 mt-2 ${theme.text}`}>
            {readinessInfo && React.createElement(readinessInfo.icon, { size: 20 })}
            <span className="font-medium">{readinessInfo?.text}</span>
          </div>
          <p className={`text-sm ${theme.textMuted} mt-2`}>{readinessInfo?.recommendation}</p>
        </div>
      )}

      {/* 7-Day Trend */}
      {last7Days.length > 1 && (
        <div className={`${theme.card} rounded-xl shadow-sm p-4`}>
          <h3 className={`text-sm font-medium ${theme.textMuted} mb-3`}>7-Day Trend</h3>
          <div className="flex items-end justify-between h-16 gap-1">
            {last7Days.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className={`w-full rounded-t ${day.score >= 70 ? 'bg-green-500' : day.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ height: `${(day.score / 100) * 100}%`, minHeight: '4px' }}
                />
                <span className={`text-xs ${theme.textMuted}`}>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Check-in Form */}
      <div className={`${theme.card} rounded-xl shadow-sm p-5 space-y-5`}>
        <h3 className={`font-semibold ${theme.text}`}>Daily Check-in</h3>

        <SliderInput
          label="😴 Sleep Quality"
          value={formData.sleepQuality}
          onChange={(v) => setFormData(prev => ({ ...prev, sleepQuality: v }))}
          labels={['Poor', '', 'OK', '', 'Great']}
        />

        <div className="space-y-2">
          <label className={`text-sm font-medium ${theme.text}`}>🛏️ Hours of Sleep</label>
          <input
            type="number"
            step="0.5"
            min="0"
            max="14"
            value={formData.sleepHours}
            onChange={(e) => setFormData(prev => ({ ...prev, sleepHours: parseFloat(e.target.value) || 0 }))}
            className={`w-full px-4 py-2 rounded-lg border ${theme.input}`}
          />
        </div>

        <SliderInput
          label="⚡ Energy Level"
          value={formData.energyLevel}
          onChange={(v) => setFormData(prev => ({ ...prev, energyLevel: v }))}
          labels={['Exhausted', '', 'Normal', '', 'Energized']}
        />

        <SliderInput
          label="💪 Muscle Soreness"
          value={formData.soreness}
          onChange={(v) => setFormData(prev => ({ ...prev, soreness: v }))}
          labels={['None', '', 'Moderate', '', 'Severe']}
        />

        <SliderInput
          label="🔥 Motivation"
          value={formData.motivation}
          onChange={(v) => setFormData(prev => ({ ...prev, motivation: v }))}
          labels={['None', '', 'OK', '', 'High']}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className={`text-sm font-medium ${theme.text}`}>❤️ Resting HR (opt)</label>
            <input
              type="number"
              placeholder={athleteProfile.benchmarks?.restingHR?.value || 'bpm'}
              value={formData.restingHR}
              onChange={(e) => setFormData(prev => ({ ...prev, restingHR: e.target.value }))}
              className={`w-full px-3 py-2 rounded-lg border ${theme.input} text-sm`}
            />
          </div>
          <div className="space-y-2">
            <label className={`text-sm font-medium ${theme.text}`}>📊 HRV (opt)</label>
            <input
              type="number"
              placeholder={athleteProfile.benchmarks?.hrvBaseline?.value || 'ms'}
              value={formData.hrv}
              onChange={(e) => setFormData(prev => ({ ...prev, hrv: e.target.value }))}
              className={`w-full px-3 py-2 rounded-lg border ${theme.input} text-sm`}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className={`text-sm font-medium ${theme.text}`}>📝 Notes (optional)</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="How do you feel? Anything notable?"
            rows={2}
            className={`w-full px-4 py-2 rounded-lg border ${theme.input} resize-none`}
          />
        </div>

        <button
          onClick={saveCheck}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {todayCheck ? 'Update Check-in' : 'Save Check-in'}
        </button>
      </div>
    </div>
  );
};

// ============== BENCHMARK TESTS COMPONENT ==============
const BenchmarkTestsView = ({ athleteProfile, setAthleteProfile, benchmarkResults, setBenchmarkResults, theme, darkMode }) => {
  const [activeTest, setActiveTest] = useState(null);
  const [testData, setTestData] = useState({});
  const [testInProgress, setTestInProgress] = useState(false);

  const startTest = (testId) => {
    setActiveTest(testId);
    setTestData({});
    setTestInProgress(true);
  };

  const cancelTest = () => {
    setActiveTest(null);
    setTestData({});
    setTestInProgress(false);
  };

  const saveTestResult = () => {
    const test = BENCHMARK_TESTS[activeTest];
    if (!test) return;

    // Calculate derived values
    let finalData = { ...testData };
    if (test.calculateDrift && testData.hr15 && testData.hr60) {
      finalData.drift = test.calculateDrift(testData);
    }
    if (test.calculateRate && testData.verticalFeet && testData.duration) {
      finalData.rate = test.calculateRate(testData);
    }

    // Save to benchmark results
    const result = {
      testId: activeTest,
      date: getTodayKey(),
      timestamp: new Date().toISOString(),
      data: finalData
    };

    setBenchmarkResults(prev => ({
      ...prev,
      [activeTest]: [...(prev[activeTest] || []), result].slice(-20) // Keep last 20 results per test
    }));

    // Update athlete profile if applicable
    if (test.targetKey) {
      setAthleteProfile(prev => {
        const updated = { ...prev, history: [...(prev.history || [])] };
        
        if (test.targetKey === 'prs') {
          // Strength test - update multiple PRs
          updated.prs = { ...updated.prs };
          for (const [key, value] of Object.entries(finalData)) {
            if (value && PR_DISPLAY_NAMES[key]) {
              if (!updated.prs[key]?.value || value > updated.prs[key].value) {
                updated.prs[key] = { ...updated.prs[key], value, date: getTodayKey() };
                updated.history.push({ category: 'prs', key, value, date: new Date().toISOString() });
              }
            }
          }
        } else if (test.targetKey === 'maxHR' && finalData.maxHR) {
          updated.benchmarks = { ...updated.benchmarks };
          updated.benchmarks.maxHR = { value: finalData.maxHR, date: getTodayKey(), unit: 'bpm' };
          updated.history.push({ category: 'benchmarks', key: 'maxHR', value: finalData.maxHR, date: new Date().toISOString() });
        } else if (test.targetKey === 'fiveMileTime' && finalData.time) {
          updated.benchmarks = { ...updated.benchmarks };
          updated.benchmarks.fiveMileTime = { value: finalData.time, date: getTodayKey(), unit: 'min:sec' };
          updated.history.push({ category: 'benchmarks', key: 'fiveMileTime', value: finalData.time, date: new Date().toISOString() });
        } else if (test.targetKey === 'verticalRate' && finalData.rate) {
          updated.benchmarks = { ...updated.benchmarks };
          updated.benchmarks.verticalRate = { value: finalData.rate, date: getTodayKey(), unit: 'ft/hr' };
          updated.history.push({ category: 'benchmarks', key: 'verticalRate', value: finalData.rate, date: new Date().toISOString() });
        } else if (test.targetKey === 'aetDrift' && finalData.drift) {
          updated.benchmarks = { ...updated.benchmarks };
          updated.benchmarks.aetDrift = { value: finalData.drift, date: getTodayKey(), unit: '%' };
          updated.history.push({ category: 'benchmarks', key: 'aetDrift', value: finalData.drift, date: new Date().toISOString() });
        }

        updated.lastUpdated = new Date().toISOString();
        return updated;
      });
    }

    setActiveTest(null);
    setTestData({});
    setTestInProgress(false);
  };

  const getLastResult = (testId) => {
    const results = benchmarkResults[testId];
    return results && results.length > 0 ? results[results.length - 1] : null;
  };

  if (activeTest && testInProgress) {
    const test = BENCHMARK_TESTS[activeTest];
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className={`text-xl font-bold ${theme.text}`}>{test.icon} {test.name}</h2>
          <button onClick={cancelTest} className={`p-2 ${theme.textMuted} hover:${theme.text}`}><X size={24} /></button>
        </div>

        {/* Protocol */}
        <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
          <h3 className={`font-semibold ${theme.text} mb-3`}>Protocol</h3>
          <ol className="space-y-2">
            {test.protocol.map((step, idx) => (
              <li key={idx} className={`flex gap-3 ${theme.text} text-sm`}>
                <span className={`flex-shrink-0 w-6 h-6 rounded-full ${theme.cardAlt} ${theme.textMuted} text-xs flex items-center justify-center`}>{idx + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          {test.notes && <p className={`mt-4 text-sm ${theme.textMuted} p-3 ${theme.cardAlt} rounded-lg`}>💡 {test.notes}</p>}
        </div>

        {/* Data Entry */}
        <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
          <h3 className={`font-semibold ${theme.text} mb-4`}>Record Results</h3>
          <div className="space-y-4">
            {test.metrics.filter(m => m.type !== 'calculated').map(metric => (
              <div key={metric.key} className="space-y-2">
                <label className={`text-sm font-medium ${theme.text}`}>{metric.label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type={metric.type === 'time' || metric.type === 'pace' ? 'text' : 'number'}
                    placeholder={metric.type === 'time' ? '32:00' : metric.type === 'pace' ? '6:24' : ''}
                    value={testData[metric.key] || ''}
                    onChange={(e) => setTestData(prev => ({ ...prev, [metric.key]: e.target.value }))}
                    className={`flex-1 px-4 py-2 rounded-lg border ${theme.input}`}
                  />
                  <span className={`text-sm ${theme.textMuted} w-16`}>{metric.unit}</span>
                </div>
              </div>
            ))}

            {/* Show calculated values */}
            {test.calculateDrift && testData.hr15 && testData.hr60 && (
              <div className={`p-4 ${darkMode ? 'bg-green-900/30' : 'bg-green-50'} rounded-lg`}>
                <p className={`text-sm ${theme.textMuted}`}>Calculated Drift</p>
                <p className={`text-2xl font-bold ${parseFloat(test.calculateDrift(testData)) < 5 ? 'text-green-500' : 'text-red-500'}`}>
                  {test.calculateDrift(testData)}%
                </p>
                <p className={`text-xs ${theme.textMuted} mt-1`}>
                  {parseFloat(test.calculateDrift(testData)) < 5 ? '✓ Passing (<5%)' : '✗ Needs work (>5%)'}
                </p>
              </div>
            )}

            {test.calculateRate && testData.verticalFeet && testData.duration && (
              <div className={`p-4 ${darkMode ? 'bg-purple-900/30' : 'bg-purple-50'} rounded-lg`}>
                <p className={`text-sm ${theme.textMuted}`}>Calculated Rate</p>
                <p className={`text-2xl font-bold ${theme.text}`}>{test.calculateRate(testData)} ft/hr</p>
              </div>
            )}
          </div>

          <button
            onClick={saveTestResult}
            className="w-full mt-6 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Save size={20} /> Save Results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className={`text-xl font-bold ${theme.text}`}>Benchmark Tests</h2>
      <p className={`text-sm ${theme.textMuted}`}>Structured tests to track fitness progress and update your profile.</p>

      <div className="space-y-3">
        {Object.values(BENCHMARK_TESTS).map(test => {
          const lastResult = getLastResult(test.id);
          return (
            <div key={test.id} className={`${theme.card} rounded-xl shadow-sm p-4`}>
              <div className="flex items-start gap-4">
                <span className="text-3xl">{test.icon}</span>
                <div className="flex-1">
                  <h3 className={`font-semibold ${theme.text}`}>{test.name}</h3>
                  <p className={`text-sm ${theme.textMuted} mt-1`}>{test.description}</p>
                  <div className={`flex gap-4 mt-2 text-xs ${theme.textMuted}`}>
                    <span>⏱️ {test.duration}</span>
                    <span>🔄 {test.frequency}</span>
                  </div>
                  {lastResult && (
                    <div className={`mt-3 p-2 ${theme.cardAlt} rounded-lg text-sm`}>
                      <span className={theme.textMuted}>Last: </span>
                      <span className={`font-medium ${theme.text}`}>{formatDateShort(lastResult.date)}</span>
                      {lastResult.data.time && <span className={`ml-2 font-mono ${theme.text}`}>{lastResult.data.time}</span>}
                      {lastResult.data.drift && <span className={`ml-2 font-mono ${lastResult.data.drift < 5 ? 'text-green-500' : 'text-red-500'}`}>{lastResult.data.drift}%</span>}
                      {lastResult.data.rate && <span className={`ml-2 font-mono ${theme.text}`}>{lastResult.data.rate} ft/hr</span>}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => startTest(test.id)}
                className={`w-full mt-4 py-2 ${theme.cardAlt} hover:opacity-80 rounded-lg text-sm font-medium ${theme.text} flex items-center justify-center gap-2`}
              >
                <PlayCircle size={18} /> Start Test
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============== ATHLETE PROFILE COMPONENT ==============
const AthleteProfileView = ({ profile, setProfile, theme, darkMode }) => {
  const [editMode, setEditMode] = useState(null);
  const [tempValue, setTempValue] = useState('');

  const startEdit = (category, key, currentValue) => {
    setEditMode({ category, key });
    setTempValue(currentValue || '');
  };

  const saveEdit = () => {
    if (!editMode) return;
    const { category, key } = editMode;
    const newValue = tempValue === '' ? null : (isNaN(tempValue) ? tempValue : Number(tempValue));
    
    setProfile(prev => {
      const updated = { ...prev };
      if (category === 'basic') {
        updated[key] = newValue;
      } else if (category === 'prs' || category === 'benchmarks') {
        updated[category] = { ...updated[category], [key]: { ...updated[category][key], value: newValue, date: newValue ? getTodayKey() : null } };
        if (newValue) {
          updated.history = [...(updated.history || []), { category, key, value: newValue, date: new Date().toISOString() }].slice(-100);
        }
      }
      updated.lastUpdated = new Date().toISOString();
      return updated;
    });
    setEditMode(null);
    setTempValue('');
  };

  const zones = useMemo(() => calculateZones(profile.benchmarks?.maxHR?.value, profile.benchmarks?.aerobicThresholdHR?.value, profile.benchmarks?.anaerobicThresholdHR?.value), [profile.benchmarks?.maxHR?.value]);
  const loadTargets = useMemo(() => calculateLoadTargets(profile.weight), [profile.weight]);

  const EditableField = ({ category, fieldKey, value, unit, note }) => {
    const isEditing = editMode?.category === category && editMode?.key === fieldKey;
    return (
      <div className={`flex items-center justify-between p-3 ${theme.cardAlt} rounded-lg`}>
        <div className="flex-1">
          <p className={`text-sm ${theme.text}`}>{category === 'prs' ? PR_DISPLAY_NAMES[fieldKey] : category === 'benchmarks' ? BENCHMARK_DISPLAY_NAMES[fieldKey] : fieldKey}</p>
          {note && <p className={`text-xs ${theme.textMuted}`}>{note}</p>}
        </div>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input type={unit === 'min:sec' ? 'text' : 'number'} value={tempValue} onChange={(e) => setTempValue(e.target.value)} placeholder={unit === 'min:sec' ? '32:00' : '0'} className={`w-24 px-2 py-1 rounded ${theme.input} text-right text-sm`} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') { setEditMode(null); setTempValue(''); }}} />
            <span className={`text-xs ${theme.textMuted}`}>{unit}</span>
            <button onClick={saveEdit} className="p-1 text-green-500"><CheckCircle2 size={18} /></button>
            <button onClick={() => { setEditMode(null); setTempValue(''); }} className="p-1 text-red-500"><XIcon size={18} /></button>
          </div>
        ) : (
          <button onClick={() => startEdit(category, fieldKey, value)} className="flex items-center gap-2 group">
            <span className={`font-mono ${value ? theme.text : theme.textMuted}`}>{value || '—'}</span>
            <span className={`text-xs ${theme.textMuted}`}>{unit}</span>
            <Edit3 size={14} className={`${theme.textMuted} opacity-0 group-hover:opacity-100`} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className={`text-xl font-bold ${theme.text}`}>Athlete Profile</h2>

      <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
        <h3 className={`font-semibold ${theme.text} mb-4`}>Basic Info</h3>
        <div className="space-y-2">
          <EditableField category="basic" fieldKey="weight" value={profile.weight} unit="lbs" />
          <EditableField category="basic" fieldKey="age" value={profile.age} unit="years" />
        </div>
        {loadTargets && (
          <div className={`mt-4 p-3 ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'} rounded-lg`}>
            <p className={`text-xs font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'} mb-2`}>LOAD TARGETS</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              {Object.entries(loadTargets).map(([key, val]) => (
                <div key={key}><p className={`font-mono font-bold ${theme.text}`}>{val}</p><p className={`text-xs ${theme.textMuted}`}>{key === 'light' ? '15%' : key === 'base' ? '20%' : key === 'standard' ? '25%' : '30%'}</p></div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
        <h3 className={`font-semibold ${theme.text} mb-4`}>Strength PRs (1RM)</h3>
        <div className="space-y-2">
          {Object.entries(profile.prs || {}).map(([key, data]) => (
            <EditableField key={key} category="prs" fieldKey={key} value={data?.value} unit={data?.unit || 'lbs'} note={data?.note} />
          ))}
        </div>
      </div>

      <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
        <h3 className={`font-semibold ${theme.text} mb-4`}>Cardio Benchmarks</h3>
        <div className="space-y-2">
          {Object.entries(profile.benchmarks || {}).map(([key, data]) => (
            <EditableField key={key} category="benchmarks" fieldKey={key} value={data?.value} unit={data?.unit || 'bpm'} note={data?.note} />
          ))}
        </div>
        {zones && (
          <div className={`mt-4 p-3 ${darkMode ? 'bg-green-900/30' : 'bg-green-50'} rounded-lg`}>
            <p className={`text-xs font-medium ${darkMode ? 'text-green-400' : 'text-green-600'} mb-2`}>HR ZONES</p>
            <div className="space-y-1">
              {Object.entries(zones).filter(([k]) => k.startsWith('zone')).map(([key, zone]) => (
                <div key={key} className="flex justify-between text-sm"><span className={theme.textMuted}>{key.replace('zone', 'Z')} - {zone.name}</span><span className={`font-mono ${theme.text}`}>{zone.min}-{zone.max}</span></div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============== SMART EXERCISE COMPONENT ==============
const SmartExercise = ({ exercise, profile, theme, darkMode, isComplete, onToggle }) => {
  const workingWeight = exercise.prKey && exercise.percentage && profile.prs?.[exercise.prKey]?.value
    ? calculateWorkingWeight(profile.prs[exercise.prKey].value, exercise.percentage) : null;
  const prValue = exercise.prKey ? profile.prs?.[exercise.prKey]?.value : null;

  return (
    <button onClick={onToggle} className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${isComplete ? 'bg-green-500/20 border-green-500' : `${theme.cardAlt} ${darkMode ? 'border-gray-600' : 'border-slate-200'}`}`}>
      {isComplete ? <CheckCircle2 size={24} className="text-green-500" /> : <Circle size={24} className={theme.textMuted} />}
      <div className="flex-1">
        <p className={`font-medium ${theme.text}`}>{exercise.name}</p>
        <div className={`flex flex-wrap gap-x-4 gap-y-1 text-sm ${theme.textMuted} mt-1`}>
          {exercise.sets && <span>{exercise.sets} sets</span>}
          {exercise.reps && <span>× {exercise.reps}</span>}
          {exercise.duration && <span>{exercise.duration}</span>}
          {exercise.rest && <span className={theme.textSubtle}>Rest: {exercise.rest}</span>}
        </div>
        {workingWeight && (
          <div className="mt-2 flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-sm font-mono font-bold ${darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>{workingWeight} lbs</span>
            <span className={`text-xs ${theme.textMuted}`}>({exercise.percentage}% of {prValue})</span>
          </div>
        )}
        {exercise.prKey && !prValue && (
          <div className={`mt-2 flex items-center gap-1 text-xs ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
            <AlertTriangle size={12} /><span>Set {PR_DISPLAY_NAMES[exercise.prKey]} PR in Profile</span>
          </div>
        )}
      </div>
    </button>
  );
};

// ============== HR ZONE & LOAD DISPLAYS ==============
const HRZoneDisplay = ({ hrZone, profile, theme, darkMode }) => {
  const zones = calculateZones(profile.benchmarks?.maxHR?.value, profile.benchmarks?.aerobicThresholdHR?.value, profile.benchmarks?.anaerobicThresholdHR?.value);
  if (!zones || !hrZone) return null;
  const zone = zones[hrZone];
  if (!zone) return null;
  return (
    <div className={`p-3 ${darkMode ? 'bg-green-900/30' : 'bg-green-50'} rounded-lg flex items-center justify-between`}>
      <div><p className={`text-xs font-medium ${darkMode ? 'text-green-400' : 'text-green-600'} uppercase`}>Target HR</p><p className={`font-medium ${theme.text}`}>{zone.name}</p></div>
      <div className="text-right"><span className={`text-xl font-bold font-mono ${theme.text}`}>{zone.min}-{zone.max}</span><span className={`text-sm ${theme.textMuted} ml-1`}>bpm</span></div>
    </div>
  );
};

const SmartLoadDisplay = ({ prescription, profile, theme, darkMode, currentWeek }) => {
  if (prescription.loadType !== 'bodyweight_percentage') return null;
  const weight = profile.weight || 225;
  let loadPercent = prescription.load;
  let extraInfo = null;
  if (prescription.progression) {
    for (const [weekRange, data] of Object.entries(prescription.progression)) {
      const match = weekRange.match(/Weeks? (\d+)-?(\d+)?/);
      if (match) {
        const start = parseInt(match[1]), end = match[2] ? parseInt(match[2]) : start;
        if (currentWeek >= start && currentWeek <= end) { loadPercent = data.load; extraInfo = data; break; }
      }
    }
  }
  const loadWeight = loadPercent ? Math.round(weight * (loadPercent / 100)) : null;
  if (!loadWeight) return null;
  return (
    <div className={`p-4 ${darkMode ? 'bg-orange-900/30' : 'bg-orange-50'} rounded-lg`}>
      <p className={`text-xs font-medium ${darkMode ? 'text-orange-400' : 'text-orange-600'} uppercase mb-2`}>Load Target (Week {currentWeek})</p>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold font-mono ${theme.text}`}>{loadWeight} lbs</span>
        <span className={theme.textMuted}>({loadPercent}% of {weight} BW)</span>
      </div>
      {extraInfo?.steps && <p className={`text-sm ${theme.textMuted} mt-1`}>Target: {extraInfo.steps} steps</p>}
      {extraInfo?.duration && <p className={`text-sm ${theme.textMuted} mt-1`}>Duration: {extraInfo.duration} min</p>}
    </div>
  );
};

// ============== MAIN APP ==============
export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useLocalStorage('trainingHub_darkMode', window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [athleteProfile, setAthleteProfile] = useLocalStorage('trainingHub_athleteProfile', DEFAULT_ATHLETE_PROFILE);
  const [readiness, setReadiness] = useLocalStorage('trainingHub_readiness', DEFAULT_READINESS);
  const [benchmarkResults, setBenchmarkResults] = useLocalStorage('trainingHub_benchmarkResults', {});
  const [customPrograms, setCustomPrograms] = useLocalStorage('trainingHub_customPrograms', {});
  const [programState, setProgramState] = useLocalStorage('trainingHub_programState', { currentProgram: 'combatAlpinist', currentWeek: 1, currentDay: 1, startDate: getTodayKey() });
  const [workoutLogs, setWorkoutLogs] = useLocalStorage('trainingHub_workoutLogs', []);
  const [exerciseCompletion, setExerciseCompletion] = useState({});
  const [workoutData, setWorkoutData] = useState({ duration: 0, rpe: 5, notes: '', newPRs: {} });
  const [showProgramUpload, setShowProgramUpload] = useState(false);

  const allPrograms = { ...DEFAULT_PROGRAMS, ...customPrograms };
  const program = allPrograms[programState.currentProgram];
  const phase = program?.phases.find(p => programState.currentWeek >= p.weeks[0] && programState.currentWeek <= p.weeks[1]);
  const todayWorkout = phase?.weeklyTemplate.find(w => w.day === programState.currentDay);

  // Today's readiness
  const todayReadiness = readiness.logs?.find(l => l.date === getTodayKey());
  const readinessScore = todayReadiness?.score;
  const readinessInfo = readinessScore ? getReadinessLabel(readinessScore) : null;

  useEffect(() => { if (todayWorkout) setWorkoutData(prev => ({ ...prev, duration: todayWorkout.duration })); }, [todayWorkout?.session]);

  const thisWeekLogs = workoutLogs.filter(log => log.week === programState.currentWeek && log.programId === programState.currentProgram);
  const completedThisWeek = thisWeekLogs.filter(log => log.completed).length;
  const toggleExercise = (name) => setExerciseCompletion(prev => ({ ...prev, [name]: !prev[name] }));

  const advanceDay = () => {
    const maxWeek = program?.phases[program.phases.length - 1]?.weeks[1] || 40;
    if (programState.currentDay >= 7) {
      setProgramState(prev => ({ ...prev, currentDay: 1, currentWeek: Math.min(prev.currentWeek + 1, maxWeek) }));
    } else {
      setProgramState(prev => ({ ...prev, currentDay: prev.currentDay + 1 }));
    }
  };

  const completeWorkout = () => {
    if (Object.keys(workoutData.newPRs || {}).length > 0) {
      setAthleteProfile(prev => {
        const updated = { ...prev, prs: { ...prev.prs }, history: [...(prev.history || [])] };
        for (const [key, value] of Object.entries(workoutData.newPRs)) {
          if (value && (!updated.prs[key]?.value || value > updated.prs[key].value)) {
            updated.prs[key] = { ...updated.prs[key], value, date: getTodayKey() };
            updated.history.push({ category: 'prs', key, value, date: new Date().toISOString() });
          }
        }
        updated.lastUpdated = new Date().toISOString();
        return updated;
      });
    }
    const newLog = { id: Date.now(), date: getTodayKey(), week: programState.currentWeek, day: programState.currentDay, phase: phase?.name, session: todayWorkout.session, type: todayWorkout.type, programId: programState.currentProgram, prescribed: todayWorkout.duration, actual: workoutData.duration, rpe: workoutData.rpe, notes: workoutData.notes, prsHit: workoutData.newPRs, readinessScore, completed: true };
    setWorkoutLogs(prev => [...prev.filter(log => !(log.date === newLog.date && log.session === newLog.session && log.programId === newLog.programId)), newLog]);
    setExerciseCompletion({});
    setWorkoutData({ duration: todayWorkout?.duration || 0, rpe: 5, notes: '', newPRs: {} });
    advanceDay();
  };

  const exportData = () => {
    const data = { athleteProfile, readiness, benchmarkResults, programState, workoutLogs, customPrograms, darkMode, exportedAt: new Date().toISOString(), version: '3.0' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `training-hub-backup-${getTodayKey()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result);
          if (data.athleteProfile) setAthleteProfile(data.athleteProfile);
          if (data.readiness) setReadiness(data.readiness);
          if (data.benchmarkResults) setBenchmarkResults(data.benchmarkResults);
          if (data.programState) setProgramState(data.programState);
          if (data.workoutLogs) setWorkoutLogs(data.workoutLogs);
          if (data.customPrograms) setCustomPrograms(data.customPrograms);
          if (data.darkMode !== undefined) setDarkMode(data.darkMode);
          alert('Data imported!');
        } catch (err) { alert('Error importing data.'); }
      };
      reader.readAsText(file);
    }
  };

  const importProgram = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const programData = JSON.parse(event.target?.result);
          if (!programData.id || !programData.name || !programData.phases) { alert('Invalid format.'); return; }
          const newId = programData.id + '_' + Date.now();
          setCustomPrograms(prev => ({ ...prev, [newId]: { ...programData, id: newId, isDefault: false } }));
          alert(`Program "${programData.name}" imported!`);
          setShowProgramUpload(false);
        } catch (err) { alert('Error.'); }
      };
      reader.readAsText(file);
    }
  };

  const todayLog = workoutLogs.find(log => log.week === programState.currentWeek && log.day === programState.currentDay && log.programId === programState.currentProgram && log.completed);

  // Training load
  const last7DaysLogs = workoutLogs.filter(log => { const d = new Date(log.date); const w = new Date(); w.setDate(w.getDate() - 7); return d >= w && log.completed; });
  const acuteLoad = last7DaysLogs.reduce((sum, log) => sum + (log.actual || 0), 0);
  const last28DaysLogs = workoutLogs.filter(log => { const d = new Date(log.date); const m = new Date(); m.setDate(m.getDate() - 28); return d >= m && log.completed; });
  const chronicLoad = last28DaysLogs.length > 0 ? Math.round(last28DaysLogs.reduce((sum, log) => sum + (log.actual || 0), 0) / 4) : 0;
  const loadRatio = chronicLoad > 0 ? (acuteLoad / chronicLoad).toFixed(2) : '-';

  const theme = {
    bg: darkMode ? 'bg-gray-900' : 'bg-slate-100',
    card: darkMode ? 'bg-gray-800' : 'bg-white',
    cardAlt: darkMode ? 'bg-gray-700' : 'bg-slate-50',
    text: darkMode ? 'text-gray-100' : 'text-slate-800',
    textMuted: darkMode ? 'text-gray-400' : 'text-slate-500',
    textSubtle: darkMode ? 'text-gray-500' : 'text-slate-400',
    border: darkMode ? 'border-gray-700' : 'border-slate-200',
    input: darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-slate-200 text-slate-800',
    header: darkMode ? 'bg-gray-800' : 'bg-slate-800',
    nav: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200',
  };
                      </span>
                      <span className={`text-xs ${theme.textMuted}`}>D{w.day}</span>
                      <span className={`text-xs ${theme.textMuted}`}>{w.duration}m</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* READINESS VIEW */}
        {currentView === 'readiness' && (
          <ReadinessCheckView readiness={readiness} setReadiness={setReadiness} athleteProfile={athleteProfile} theme={theme} darkMode={darkMode} />
        )}

        {/* WORKOUT VIEW */}
        {currentView === 'workout' && todayWorkout && (
          <div className="p-4 space-y-4">
            <div className={`${getTypeColor(todayWorkout.type, darkMode)} rounded-xl p-5 text-white`}>
              <p className="text-sm opacity-80 uppercase">Week {programState.currentWeek} • Day {programState.currentDay}</p>
              <h2 className="text-2xl font-bold mt-1">{todayWorkout.session}</h2>
              <div className="flex items-center gap-4 mt-3 text-sm opacity-90">
                <span className="flex items-center gap-1"><Clock size={16} />{todayWorkout.duration} min</span>
                <span className="capitalize">{todayWorkout.type.replace('_', ' ')}</span>
              </div>
              {todayLog?.completed && <div className="mt-4 bg-white/20 rounded-lg p-3 flex items-center gap-2"><CheckCircle2 size={18} /><span>Completed</span></div>}
            </div>

            {/* Readiness Warning */}
            {readinessScore && readinessScore < 55 && todayWorkout.type !== 'recovery' && (
              <div className={`p-4 ${darkMode ? 'bg-amber-900/30 border-amber-700' : 'bg-amber-50 border-amber-200'} border rounded-xl`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className={darkMode ? 'text-amber-400' : 'text-amber-600'} size={20} />
                  <span className={`font-medium ${theme.text}`}>Low Readiness ({readinessScore})</span>
                </div>
                <p className={`text-sm ${theme.textMuted}`}>{readinessInfo?.recommendation}</p>
              </div>
            )}

            {/* HR Zone */}
            {todayWorkout.prescription.hrZone && <HRZoneDisplay hrZone={todayWorkout.prescription.hrZone} profile={athleteProfile} theme={theme} darkMode={darkMode} />}

            {/* Load Target */}
            <SmartLoadDisplay prescription={todayWorkout.prescription} profile={athleteProfile} theme={theme} darkMode={darkMode} currentWeek={programState.currentWeek} />

            <div className={`${theme.card} rounded-xl shadow-sm overflow-hidden`}>
              {todayWorkout.prescription.warmup && <div className={`p-4 border-b ${theme.border}`}><p className={`text-xs font-medium ${theme.textMuted} uppercase mb-2`}>Warm-up</p><p className={theme.text}>{todayWorkout.prescription.warmup}</p></div>}
              {todayWorkout.prescription.description && <div className={`p-4 border-b ${theme.border}`}><p className={`text-xs font-medium ${theme.textMuted} uppercase mb-2`}>Overview</p><p className={theme.text}>{todayWorkout.prescription.description}</p></div>}
              {todayWorkout.prescription.mainSet && <div className={`p-4 border-b ${theme.border} ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}><p className="text-xs font-medium text-blue-500 uppercase mb-2">Main Set</p><p className={`text-lg font-semibold ${theme.text}`}>{todayWorkout.prescription.mainSet}</p>{todayWorkout.prescription.recovery && <p className={`${theme.textMuted} mt-1`}>Recovery: {todayWorkout.prescription.recovery}</p>}</div>}
              
              {todayWorkout.prescription.exercises && (
                <div className={`p-4 border-b ${theme.border}`}>
                  <p className={`text-xs font-medium ${theme.textMuted} uppercase mb-3`}>Exercises</p>
                  <div className="space-y-2">
                    {todayWorkout.prescription.exercises.map((ex, idx) => (
                      <SmartExercise key={idx} exercise={ex} profile={athleteProfile} theme={theme} darkMode={darkMode} isComplete={exerciseCompletion[ex.name]} onToggle={() => toggleExercise(ex.name)} />
                    ))}
                  </div>
                </div>
              )}

              {todayWorkout.prescription.accessory && (
                <div className={`p-4 border-b ${theme.border}`}>
                  <p className={`text-xs font-medium ${theme.textMuted} uppercase mb-3`}>Accessory</p>
                  <div className="space-y-2">
                    {todayWorkout.prescription.accessory.map((ex, idx) => (
                      <div key={idx} className={`p-3 ${theme.cardAlt} rounded-lg`}>
                        <p className={`font-medium ${theme.text}`}>{ex.name}</p>
                        <p className={`text-sm ${theme.textMuted}`}>{ex.sets} × {ex.reps}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {todayWorkout.prescription.steps && <div className={`p-4 border-b ${theme.border}`}><p className={`text-xs font-medium ${theme.textMuted} uppercase mb-3`}>Protocol</p><ol className="space-y-2">{todayWorkout.prescription.steps.map((step, idx) => <li key={idx} className={`flex gap-3 ${theme.text} text-sm`}><span className={`flex-shrink-0 w-6 h-6 rounded-full ${theme.cardAlt} ${theme.textMuted} text-xs flex items-center justify-center`}>{idx + 1}</span>{step}</li>)}</ol></div>}
              {todayWorkout.prescription.options && <div className={`p-4 border-b ${theme.border}`}><p className={`text-xs font-medium ${theme.textMuted} uppercase mb-2`}>Options</p><ul className="space-y-1">{todayWorkout.prescription.options.map((opt, idx) => <li key={idx} className={`text-sm ${theme.textMuted}`}>• {opt}</li>)}</ul></div>}
              {todayWorkout.prescription.notes && <div className={`p-4 border-b ${theme.border}`}><p className={`text-xs font-medium ${theme.textMuted} uppercase mb-2`}>Notes</p><ul className="space-y-1">{(Array.isArray(todayWorkout.prescription.notes) ? todayWorkout.prescription.notes : [todayWorkout.prescription.notes]).map((note, idx) => <li key={idx} className={`text-sm ${theme.textMuted}`}>• {note}</li>)}</ul></div>}
              {todayWorkout.prescription.cooldown && <div className={`p-4 border-b ${theme.border}`}><p className={`text-xs font-medium ${theme.textMuted} uppercase mb-2`}>Cool-down</p><p className={theme.text}>{todayWorkout.prescription.cooldown}</p></div>}
              {todayWorkout.prescription.intensity && <div className={`p-4 ${darkMode ? 'bg-gray-700' : 'bg-slate-800'} text-white`}><p className="text-xs uppercase opacity-70 mb-1">Intensity</p><p className="font-semibold">{todayWorkout.prescription.intensity}</p></div>}
            </div>

            {/* Log Form */}
            <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
              <h3 className={`font-semibold ${theme.text} mb-4`}>Log Workout</h3>
              <div className="space-y-4">
                <div><label className={`block text-sm font-medium ${theme.textMuted} mb-2`}>Duration (min)</label><input type="number" value={workoutData.duration} onChange={(e) => setWorkoutData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))} className={`w-full px-4 py-3 rounded-xl border ${theme.input}`} /></div>
                <div><label className={`block text-sm font-medium ${theme.textMuted} mb-2`}>RPE: {workoutData.rpe}/10</label><input type="range" min="1" max="10" value={workoutData.rpe} onChange={(e) => setWorkoutData(prev => ({ ...prev, rpe: parseInt(e.target.value) }))} className="w-full" /></div>
                
                {todayWorkout.type === 'strength' && todayWorkout.prescription.exercises?.some(e => e.prKey) && (
                  <div className={`p-4 ${darkMode ? 'bg-amber-900/20' : 'bg-amber-50'} rounded-xl`}>
                    <p className={`text-xs font-medium ${darkMode ? 'text-amber-400' : 'text-amber-700'} uppercase mb-3`}>Hit a new PR?</p>
                    <div className="space-y-2">
                      {todayWorkout.prescription.exercises.filter(e => e.prKey).map(ex => (
                        <div key={ex.prKey} className="flex items-center gap-2">
                          <span className={`text-sm ${theme.text} flex-1`}>{PR_DISPLAY_NAMES[ex.prKey]}</span>
                          <input type="number" placeholder={athleteProfile.prs?.[ex.prKey]?.value || 'PR'} value={workoutData.newPRs?.[ex.prKey] || ''} onChange={(e) => setWorkoutData(prev => ({ ...prev, newPRs: { ...prev.newPRs, [ex.prKey]: e.target.value ? Number(e.target.value) : null } }))} className={`w-24 px-2 py-1 rounded ${theme.input} text-right text-sm`} />
                          <span className={`text-xs ${theme.textMuted}`}>lbs</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div><label className={`block text-sm font-medium ${theme.textMuted} mb-2`}>Notes</label><textarea value={workoutData.notes} onChange={(e) => setWorkoutData(prev => ({ ...prev, notes: e.target.value }))} placeholder="How did it feel?" rows={2} className={`w-full px-4 py-3 rounded-xl border ${theme.input} resize-none`} /></div>
                <button onClick={completeWorkout} className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2"><CheckCircle2 size={20} />{todayLog?.completed ? 'Update & Next' : 'Complete & Next Day'}</button>
              </div>
            </div>
          </div>
        )}
        {currentView === 'workout' && !todayWorkout && <div className="p-4"><div className={`${theme.card} rounded-xl shadow-sm p-8 text-center`}><Circle size={48} className={`mx-auto ${theme.textMuted} mb-4`} /><h2 className={`text-xl font-semibold ${theme.text}`}>No Workout</h2></div></div>}

        {/* PROFILE VIEW */}
        {currentView === 'profile' && <AthleteProfileView profile={athleteProfile} setProfile={setAthleteProfile} theme={theme} darkMode={darkMode} />}

        {/* BENCHMARK TESTS VIEW */}
        {currentView === 'benchmarks' && <BenchmarkTestsView athleteProfile={athleteProfile} setAthleteProfile={setAthleteProfile} benchmarkResults={benchmarkResults} setBenchmarkResults={setBenchmarkResults} theme={theme} darkMode={darkMode} />}

        {/* LOG VIEW */}
        {currentView === 'log' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between"><h2 className={`text-xl font-bold ${theme.text}`}>Workout Log</h2><span className={`text-sm ${theme.textMuted}`}>{workoutLogs.length} total</span></div>
            {workoutLogs.length === 0 ? <div className={`${theme.card} rounded-xl shadow-sm p-8 text-center`}><Calendar size={48} className={`mx-auto ${theme.textMuted} mb-4`} /><p className={theme.textMuted}>No workouts logged yet.</p></div> : (
              <div className="space-y-3">
                {[...workoutLogs].reverse().slice(0, 50).map(log => (
                  <div key={log.id} className={`${theme.card} rounded-xl shadow-sm p-4 border-l-4 ${getTypeBorder(log.type)}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-semibold ${theme.text}`}>{log.session}</p>
                        <p className={`text-sm ${theme.textMuted}`}>{formatDate(log.date)} • W{log.week}D{log.day}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {log.readinessScore && <span className={`text-xs px-2 py-1 rounded ${log.readinessScore >= 70 ? 'bg-green-500/20 text-green-500' : log.readinessScore >= 50 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'}`}>{log.readinessScore}</span>}
                        <CheckCircle2 size={20} className="text-green-500" />
                      </div>
                    </div>
                    <div className={`flex gap-4 mt-2 text-sm ${theme.textMuted}`}><span>{log.actual}m</span><span>RPE {log.rpe}</span></div>
                    {log.prsHit && Object.keys(log.prsHit).filter(k => log.prsHit[k]).length > 0 && (
                      <div className={`mt-2 flex items-center gap-2 text-xs ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                        <Award size={14} /><span>PR: {Object.entries(log.prsHit).filter(([,v]) => v).map(([k, v]) => `${PR_DISPLAY_NAMES[k]} ${v}`).join(', ')}</span>
                      </div>
                    )}
                    {log.notes && <p className={`mt-2 text-sm ${theme.textMuted} ${theme.cardAlt} rounded p-2`}>{log.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROGRESS VIEW */}
        {currentView === 'progress' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-bold ${theme.text}`}>Progress & Data</h2>
              <button onClick={exportData} className={`flex items-center gap-2 px-3 py-2 ${theme.cardAlt} rounded-lg text-sm font-medium ${theme.text}`}><Download size={16} />Export</button>
            </div>

            {/* Training Load */}
            <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
              <h3 className={`font-semibold ${theme.text} mb-4`}>Training Load</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className={`p-3 ${theme.cardAlt} rounded-lg text-center`}><p className={`text-2xl font-bold ${theme.text}`}>{acuteLoad}</p><p className={`text-xs ${theme.textMuted}`}>Acute (7d)</p></div>
                <div className={`p-3 ${theme.cardAlt} rounded-lg text-center`}><p className={`text-2xl font-bold ${theme.text}`}>{chronicLoad}</p><p className={`text-xs ${theme.textMuted}`}>Chronic (28d)</p></div>
                <div className={`p-3 ${theme.cardAlt} rounded-lg text-center`}><p className={`text-2xl font-bold ${loadRatio !== '-' && loadRatio > 1.5 ? 'text-red-500' : loadRatio !== '-' && loadRatio < 0.8 ? 'text-amber-500' : 'text-green-500'}`}>{loadRatio}</p><p className={`text-xs ${theme.textMuted}`}>A:C Ratio</p></div>
              </div>
            </div>

            {/* Volume by Type */}
            <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
              <h3 className={`font-semibold ${theme.text} mb-4`}>Volume by Type</h3>
              {workoutLogs.length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(workoutLogs.reduce((acc, log) => { acc[log.type] = (acc[log.type] || 0) + (log.actual || 0); return acc; }, {})).sort((a, b) => b[1] - a[1]).map(([type, mins]) => (
                    <div key={type} className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${getTypeColor(type, darkMode)} flex items-center justify-center`}>{React.createElement(getTypeIcon(type), { size: 20, className: 'text-white' })}</div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1"><span className={`capitalize ${theme.text}`}>{type.replace('_', ' ')}</span><span className={theme.textMuted}>{Math.round(mins / 60)}h {mins % 60}m</span></div>
                        <div className={`h-2 ${theme.cardAlt} rounded-full overflow-hidden`}><div className={`h-full ${getTypeColor(type, darkMode)}`} style={{ width: `${(mins / workoutLogs.reduce((s, l) => s + (l.actual || 0), 0)) * 100}%` }} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className={theme.textMuted}>No data yet</p>}
            </div>

            {/* Readiness Trend */}
            {readiness.logs?.length > 0 && (
              <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
                <h3 className={`font-semibold ${theme.text} mb-4`}>Readiness (Last 14 Days)</h3>
                <div className="flex items-end justify-between h-20 gap-1">
                  {[...readiness.logs].slice(-14).map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`w-full rounded-t ${day.score >= 70 ? 'bg-green-500' : day.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ height: `${(day.score / 100) * 100}%`, minHeight: '4px' }} />
                    </div>
                  ))}
                </div>
                <div className={`flex justify-between text-xs ${theme.textMuted} mt-2`}>
                  <span>14 days ago</span><span>Today</span>
                </div>
              </div>
            )}

            {/* PR History */}
            {athleteProfile.history?.filter(h => h.category === 'prs').length > 0 && (
              <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
                <h3 className={`font-semibold ${theme.text} mb-4`}>PR History</h3>
                <div className="space-y-2">
                  {[...athleteProfile.history].filter(h => h.category === 'prs').reverse().slice(0, 10).map((pr, idx) => (
                    <div key={idx} className={`flex justify-between items-center p-2 ${theme.cardAlt} rounded`}>
                      <div className="flex items-center gap-2"><Award size={16} className={darkMode ? 'text-amber-400' : 'text-amber-600'} /><span className={theme.text}>{PR_DISPLAY_NAMES[pr.key]}</span></div>
                      <div className="text-right"><span className={`font-mono font-bold ${theme.text}`}>{pr.value} lbs</span><span className={`text-xs ${theme.textMuted} ml-2`}>{formatDateShort(pr.date)}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROGRAMS VIEW */}
        {currentView === 'programs' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-bold ${theme.text}`}>Programs</h2>
              <button onClick={() => setShowProgramUpload(true)} className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium text-white"><Plus size={16} />Add</button>
            </div>

            {showProgramUpload && (
              <div className={`${theme.card} rounded-xl shadow-sm p-5 border-2 border-dashed ${theme.border}`}>
                <h3 className={`font-semibold ${theme.text} mb-3`}>Import Program</h3>
                <label className="block">
                  <span className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${theme.cardAlt} rounded-xl text-sm font-medium ${theme.text} cursor-pointer border ${theme.border}`}><FileUp size={18} />Select File (.json)</span>
                  <input type="file" accept=".json" onChange={importProgram} className="hidden" />
                </label>
                <button onClick={() => setShowProgramUpload(false)} className={`w-full mt-3 text-sm ${theme.textMuted}`}>Cancel</button>
              </div>
            )}

            <div className="space-y-3">
              {Object.values(allPrograms).map(prog => (
                <div key={prog.id} className={`${theme.card} rounded-xl shadow-sm p-4 ${programState.currentProgram === prog.id ? 'ring-2 ring-blue-500' : ''}`}>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{prog.icon}</span>
                    <div className="flex-1">
                      <p className={`font-semibold ${theme.text}`}>{prog.name}</p>
                      <p className={`text-sm ${theme.textMuted} mt-1`}>{prog.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    {programState.currentProgram === prog.id ? (
                      <span className="flex-1 text-center py-2 text-green-500 font-medium text-sm">Active</span>
                    ) : (
                      <button onClick={() => setProgramState(prev => ({ ...prev, currentProgram: prog.id, currentWeek: 1, currentDay: 1 }))} className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium">Switch</button>
                    )}
                    {!prog.isDefault && (
                      <button onClick={() => { if (confirm(`Delete "${prog.name}"?`)) { setCustomPrograms(prev => { const u = { ...prev }; delete u[prog.id]; return u; }); if (programState.currentProgram === prog.id) setProgramState(prev => ({ ...prev, currentProgram: 'combatAlpinist' })); }}} className="px-3 py-2 bg-red-500/10 text-red-500 rounded-lg"><Trash2 size={16} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SETTINGS VIEW */}
        {currentView === 'settings' && (
          <div className="p-4 space-y-4">
            <h2 className={`text-xl font-bold ${theme.text}`}>Settings</h2>
            
            <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
              <div className="flex items-center justify-between">
                <div><h3 className={`font-semibold ${theme.text}`}>Dark Mode</h3></div>
                <button onClick={() => setDarkMode(!darkMode)} className={`w-14 h-8 rounded-full transition-colors ${darkMode ? 'bg-blue-500' : 'bg-slate-300'} relative`}>
                  <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${darkMode ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
              <h3 className={`font-semibold ${theme.text} mb-4`}>Program Position</h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm ${theme.textMuted} mb-2`}>Week</label>
                  <div className="flex items-center justify-center gap-4">
                    <button onClick={() => setProgramState(prev => ({ ...prev, currentWeek: Math.max(1, prev.currentWeek - 1) }))} className={`p-2 rounded-lg ${theme.cardAlt}`}><ChevronLeft size={20} className={theme.text} /></button>
                    <span className={`text-2xl font-bold ${theme.text} w-16 text-center`}>{programState.currentWeek}</span>
                    <button onClick={() => setProgramState(prev => ({ ...prev, currentWeek: Math.min(40, prev.currentWeek + 1) }))} className={`p-2 rounded-lg ${theme.cardAlt}`}><ChevronRight size={20} className={theme.text} /></button>
                  </div>
                </div>
                <div>
                  <label className={`block text-sm ${theme.textMuted} mb-2`}>Day</label>
                  <div className="flex items-center justify-center gap-4">
                    <button onClick={() => setProgramState(prev => ({ ...prev, currentDay: Math.max(1, prev.currentDay - 1) }))} className={`p-2 rounded-lg ${theme.cardAlt}`}><ChevronLeft size={20} className={theme.text} /></button>
                    <span className={`text-2xl font-bold ${theme.text} w-16 text-center`}>{programState.currentDay}</span>
                    <button onClick={() => setProgramState(prev => ({ ...prev, currentDay: Math.min(7, prev.currentDay + 1) }))} className={`p-2 rounded-lg ${theme.cardAlt}`}><ChevronRight size={20} className={theme.text} /></button>
                  </div>
                </div>
              </div>
            </div>

            <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
              <h3 className={`font-semibold ${theme.text} mb-4`}>Data</h3>
              <div className="space-y-3">
                <button onClick={exportData} className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${theme.cardAlt} rounded-xl text-sm font-medium ${theme.text}`}><Download size={18} />Export All Data</button>
                <label className="block"><span className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${theme.cardAlt} rounded-xl text-sm font-medium ${theme.text} cursor-pointer`}><Upload size={18} />Import Data</span><input type="file" accept=".json" onChange={importData} className="hidden" /></label>
                <button onClick={() => { if (confirm('Clear all logs?')) setWorkoutLogs([]); }} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 rounded-xl text-sm font-medium text-red-500"><Trash2 size={18} />Clear Logs</button>
                <button onClick={() => { if (confirm('Reset readiness data?')) setReadiness(DEFAULT_READINESS); }} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 rounded-xl text-sm font-medium text-red-500"><Trash2 size={18} />Clear Readiness</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className={`fixed bottom-0 left-0 right-0 ${theme.nav} border-t px-4 py-2 safe-area-pb`}>
        <div className="max-w-2xl mx-auto flex justify-around">
          {[
            { id: 'dashboard', icon: Home, label: 'Home' },
            { id: 'readiness', icon: Battery, label: 'Ready' },
            { id: 'workout', icon: Play, label: 'Workout' },
            { id: 'profile', icon: User, label: 'Profile' },
            { id: 'progress', icon: BarChart3, label: 'Data' }
          ].map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setCurrentView(id)} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${currentView === id ? 'text-blue-500' : theme.textMuted}`}>
              <Icon size={24} /><span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
