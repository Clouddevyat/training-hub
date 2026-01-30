import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Dumbbell, TrendingUp, CheckCircle2, Circle, ChevronRight, 
  ChevronLeft, Play, Clock, Flame, Menu, X, Download, Upload,
  Settings, Activity, Mountain, Home, BarChart3, Trash2, Moon, Sun, 
  Plus, FileUp, User, Target, Zap, Award, Timer, Heart, Scale,
  ChevronDown, ChevronUp, Edit3, Save, X as XIcon, AlertTriangle,
  Battery, BatteryLow, BatteryMedium, BatteryFull, Bed, Brain,
  TrendingDown, Minus, ArrowRight, Flag, PlayCircle, StopCircle,
  RotateCcw, Info, LineChart, Hammer, Copy, RefreshCw, FileText, Library
} from 'lucide-react';
import { TemplateUploadView } from './TemplateUpload';
import { 
  generateWorkoutFromTemplate, 
  templateToProgram, 
  checkRequiredFields,
  getValidSubstitutes,
  EXERCISE_LIBRARY as TEMPLATE_EXERCISE_LIBRARY 
} from './TemplateEngine';

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

// ============== EXERCISE LIBRARY ==============
const MOVEMENT_PATTERNS = {
  hipHinge: { id: 'hipHinge', name: 'Hip Hinge', icon: '🏋️' },
  squat: { id: 'squat', name: 'Squat', icon: '🦵' },
  horizontalPush: { id: 'horizontalPush', name: 'Horizontal Push', icon: '💪' },
  horizontalPull: { id: 'horizontalPull', name: 'Horizontal Pull', icon: '🚣' },
  verticalPush: { id: 'verticalPush', name: 'Vertical Push', icon: '🙆' },
  verticalPull: { id: 'verticalPull', name: 'Vertical Pull', icon: '🧗' },
  carry: { id: 'carry', name: 'Carry', icon: '🎒' },
  lunge: { id: 'lunge', name: 'Lunge/Single Leg', icon: '🦿' },
  core: { id: 'core', name: 'Core', icon: '🎯' },
  cardio: { id: 'cardio', name: 'Cardio', icon: '❤️' },
  mobility: { id: 'mobility', name: 'Mobility', icon: '🧘' },
};

const EQUIPMENT_TYPES = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  kettlebell: 'Kettlebell',
  bodyweight: 'Bodyweight',
  machine: 'Machine',
  cable: 'Cable',
  bands: 'Bands',
  trapBar: 'Trap Bar',
  pullupBar: 'Pull-up Bar',
  bench: 'Bench',
  box: 'Box/Step',
  cardioMachine: 'Cardio Machine',
  none: 'None',
};

const EXERCISE_LIBRARY = {
  // === HIP HINGE ===
  trapBarDeadlift: { id: 'trapBarDeadlift', name: 'Trap Bar Deadlift', pattern: 'hipHinge', equipment: ['trapBar'], muscles: ['glutes', 'hamstrings', 'back', 'quads'], prKey: 'trapBarDeadlift' },
  conventionalDeadlift: { id: 'conventionalDeadlift', name: 'Conventional Deadlift', pattern: 'hipHinge', equipment: ['barbell'], muscles: ['glutes', 'hamstrings', 'back'] },
  romanianDeadlift: { id: 'romanianDeadlift', name: 'Romanian Deadlift', pattern: 'hipHinge', equipment: ['barbell', 'dumbbell'], muscles: ['hamstrings', 'glutes'] },
  kettlebellSwing: { id: 'kettlebellSwing', name: 'Kettlebell Swing', pattern: 'hipHinge', equipment: ['kettlebell'], muscles: ['glutes', 'hamstrings', 'core'] },
  hipThrust: { id: 'hipThrust', name: 'Hip Thrust', pattern: 'hipHinge', equipment: ['barbell', 'bench'], muscles: ['glutes'] },
  goodMorning: { id: 'goodMorning', name: 'Good Morning', pattern: 'hipHinge', equipment: ['barbell'], muscles: ['hamstrings', 'back'] },
  
  // === SQUAT ===
  backSquat: { id: 'backSquat', name: 'Back Squat', pattern: 'squat', equipment: ['barbell'], muscles: ['quads', 'glutes'], prKey: 'backSquat' },
  frontSquat: { id: 'frontSquat', name: 'Front Squat', pattern: 'squat', equipment: ['barbell'], muscles: ['quads', 'core'], prKey: 'frontSquat' },
  gobletSquat: { id: 'gobletSquat', name: 'Goblet Squat', pattern: 'squat', equipment: ['kettlebell', 'dumbbell'], muscles: ['quads', 'glutes'] },
  legPress: { id: 'legPress', name: 'Leg Press', pattern: 'squat', equipment: ['machine'], muscles: ['quads', 'glutes'] },
  hackSquat: { id: 'hackSquat', name: 'Hack Squat', pattern: 'squat', equipment: ['machine'], muscles: ['quads'] },
  
  // === LUNGE/SINGLE LEG ===
  boxStepUp: { id: 'boxStepUp', name: 'Box Step-Up', pattern: 'lunge', equipment: ['box', 'dumbbell'], muscles: ['quads', 'glutes'], prKey: 'boxStepUp' },
  walkingLunge: { id: 'walkingLunge', name: 'Walking Lunge', pattern: 'lunge', equipment: ['bodyweight', 'dumbbell'], muscles: ['quads', 'glutes'] },
  reverseLunge: { id: 'reverseLunge', name: 'Reverse Lunge', pattern: 'lunge', equipment: ['bodyweight', 'dumbbell', 'barbell'], muscles: ['quads', 'glutes'] },
  bulgarianSplitSquat: { id: 'bulgarianSplitSquat', name: 'Bulgarian Split Squat', pattern: 'lunge', equipment: ['bench', 'dumbbell'], muscles: ['quads', 'glutes'] },
  singleLegRDL: { id: 'singleLegRDL', name: 'Single Leg RDL', pattern: 'lunge', equipment: ['dumbbell', 'kettlebell'], muscles: ['hamstrings', 'glutes'] },
  
  // === HORIZONTAL PUSH ===
  benchPress: { id: 'benchPress', name: 'Bench Press', pattern: 'horizontalPush', equipment: ['barbell', 'bench'], muscles: ['chest', 'triceps', 'shoulders'], prKey: 'benchPress' },
  inclineBenchPress: { id: 'inclineBenchPress', name: 'Incline Bench Press', pattern: 'horizontalPush', equipment: ['barbell', 'bench'], muscles: ['chest', 'shoulders'] },
  dbBenchPress: { id: 'dbBenchPress', name: 'DB Bench Press', pattern: 'horizontalPush', equipment: ['dumbbell', 'bench'], muscles: ['chest', 'triceps'] },
  pushUp: { id: 'pushUp', name: 'Push-Up', pattern: 'horizontalPush', equipment: ['bodyweight'], muscles: ['chest', 'triceps', 'core'] },
  chestDip: { id: 'chestDip', name: 'Dip', pattern: 'horizontalPush', equipment: ['bodyweight'], muscles: ['chest', 'triceps'], prKey: 'weightedDip' },
  
  // === HORIZONTAL PULL ===
  barbellRow: { id: 'barbellRow', name: 'Barbell Row', pattern: 'horizontalPull', equipment: ['barbell'], muscles: ['back', 'biceps'] },
  dbRow: { id: 'dbRow', name: 'DB Row', pattern: 'horizontalPull', equipment: ['dumbbell', 'bench'], muscles: ['back', 'biceps'] },
  cableRow: { id: 'cableRow', name: 'Cable Row', pattern: 'horizontalPull', equipment: ['cable'], muscles: ['back', 'biceps'] },
  chestSupportedRow: { id: 'chestSupportedRow', name: 'Chest Supported Row', pattern: 'horizontalPull', equipment: ['dumbbell', 'bench'], muscles: ['back'] },
  invertedRow: { id: 'invertedRow', name: 'Inverted Row', pattern: 'horizontalPull', equipment: ['bodyweight', 'pullupBar'], muscles: ['back', 'biceps'] },
  
  // === VERTICAL PUSH ===
  overheadPress: { id: 'overheadPress', name: 'Overhead Press', pattern: 'verticalPush', equipment: ['barbell'], muscles: ['shoulders', 'triceps'], prKey: 'overheadPress' },
  dbShoulderPress: { id: 'dbShoulderPress', name: 'DB Shoulder Press', pattern: 'verticalPush', equipment: ['dumbbell'], muscles: ['shoulders', 'triceps'] },
  pushPress: { id: 'pushPress', name: 'Push Press', pattern: 'verticalPush', equipment: ['barbell'], muscles: ['shoulders', 'triceps', 'legs'] },
  arnoldPress: { id: 'arnoldPress', name: 'Arnold Press', pattern: 'verticalPush', equipment: ['dumbbell'], muscles: ['shoulders'] },
  pikePushUp: { id: 'pikePushUp', name: 'Pike Push-Up', pattern: 'verticalPush', equipment: ['bodyweight'], muscles: ['shoulders', 'triceps'] },
  
  // === VERTICAL PULL ===
  pullUp: { id: 'pullUp', name: 'Pull-Up', pattern: 'verticalPull', equipment: ['pullupBar'], muscles: ['back', 'biceps'], prKey: 'weightedPullUp' },
  chinUp: { id: 'chinUp', name: 'Chin-Up', pattern: 'verticalPull', equipment: ['pullupBar'], muscles: ['back', 'biceps'] },
  latPulldown: { id: 'latPulldown', name: 'Lat Pulldown', pattern: 'verticalPull', equipment: ['cable'], muscles: ['back', 'biceps'] },
  assistedPullUp: { id: 'assistedPullUp', name: 'Assisted Pull-Up', pattern: 'verticalPull', equipment: ['machine', 'bands'], muscles: ['back', 'biceps'] },
  
  // === CARRY ===
  farmerCarry: { id: 'farmerCarry', name: "Farmer's Carry", pattern: 'carry', equipment: ['dumbbell', 'kettlebell'], muscles: ['grip', 'core', 'traps'] },
  suitcaseCarry: { id: 'suitcaseCarry', name: 'Suitcase Carry', pattern: 'carry', equipment: ['dumbbell', 'kettlebell'], muscles: ['core', 'grip'] },
  ruckMarch: { id: 'ruckMarch', name: 'Ruck March', pattern: 'carry', equipment: ['none'], muscles: ['legs', 'core', 'back'] },
  sandbagCarry: { id: 'sandbagCarry', name: 'Sandbag Carry', pattern: 'carry', equipment: ['none'], muscles: ['full body'] },
  
  // === CORE ===
  plank: { id: 'plank', name: 'Plank', pattern: 'core', equipment: ['bodyweight'], muscles: ['core'] },
  deadBug: { id: 'deadBug', name: 'Dead Bug', pattern: 'core', equipment: ['bodyweight'], muscles: ['core'] },
  pallofPress: { id: 'pallofPress', name: 'Pallof Press', pattern: 'core', equipment: ['cable', 'bands'], muscles: ['core'] },
  hangingLegRaise: { id: 'hangingLegRaise', name: 'Hanging Leg Raise', pattern: 'core', equipment: ['pullupBar'], muscles: ['core'] },
  abWheel: { id: 'abWheel', name: 'Ab Wheel Rollout', pattern: 'core', equipment: ['none'], muscles: ['core'] },
  sidePlank: { id: 'sidePlank', name: 'Side Plank', pattern: 'core', equipment: ['bodyweight'], muscles: ['core'] },
  facePull: { id: 'facePull', name: 'Face Pull', pattern: 'core', equipment: ['cable', 'bands'], muscles: ['rear delts', 'rotator cuff'] },
  
  // === CARDIO ===
  run: { id: 'run', name: 'Run', pattern: 'cardio', equipment: ['none'], isCardio: true },
  hike: { id: 'hike', name: 'Hike', pattern: 'cardio', equipment: ['none'], isCardio: true },
  ruckHike: { id: 'ruckHike', name: 'Ruck Hike', pattern: 'cardio', equipment: ['none'], isCardio: true },
  bike: { id: 'bike', name: 'Bike', pattern: 'cardio', equipment: ['cardioMachine'], isCardio: true },
  rowErg: { id: 'rowErg', name: 'Row Erg', pattern: 'cardio', equipment: ['cardioMachine'], isCardio: true },
  swim: { id: 'swim', name: 'Swim', pattern: 'cardio', equipment: ['none'], isCardio: true },
  stairClimber: { id: 'stairClimber', name: 'Stair Climber', pattern: 'cardio', equipment: ['cardioMachine'], isCardio: true },
  
  // === MOBILITY ===
  pigeonPose: { id: 'pigeonPose', name: 'Pigeon Pose', pattern: 'mobility', equipment: ['bodyweight'], isMobility: true },
  worldsGreatestStretch: { id: 'worldsGreatestStretch', name: "World's Greatest Stretch", pattern: 'mobility', equipment: ['bodyweight'], isMobility: true },
  catCow: { id: 'catCow', name: 'Cat-Cow', pattern: 'mobility', equipment: ['bodyweight'], isMobility: true },
  thoracicRotation: { id: 'thoracicRotation', name: 'Thoracic Rotation', pattern: 'mobility', equipment: ['bodyweight'], isMobility: true },
  hipFlexorStretch: { id: 'hipFlexorStretch', name: 'Hip Flexor Stretch', pattern: 'mobility', equipment: ['bodyweight'], isMobility: true },
};

// ============== PROGRESSION MODELS ==============
const PROGRESSION_MODELS = {
  linear: {
    id: 'linear',
    name: 'Linear Periodization',
    description: 'Gradually increase intensity while maintaining volume',
    icon: '📈',
    generateWeeks: (weeks, startIntensity = 70) => {
      const increment = (90 - startIntensity) / (weeks - 1);
      return Array.from({ length: weeks }, (_, i) => {
        const isDeload = (i + 1) % 4 === 0;
        return {
          week: i + 1,
          intensity: isDeload ? startIntensity : Math.round(startIntensity + (increment * i)),
          sets: isDeload ? 2 : 4,
          reps: isDeload ? '8-10' : '4-6',
          rpe: isDeload ? 6 : 8,
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
    generateWeeks: (weeks) => {
      return Array.from({ length: weeks }, (_, i) => {
        const isDeload = (i + 1) % 4 === 0;
        return {
          week: i + 1,
          pattern: 'DUP',
          intensityMod: isDeload ? 0.8 : 1,
          volumeMod: isDeload ? 0.6 : 1,
          isDeload,
        };
      });
    },
  },
  undulatingWeekly: {
    id: 'undulatingWeekly',
    name: 'Weekly Undulating',
    description: 'Vary intensity and volume each week',
    icon: '📊',
    generateWeeks: (weeks) => {
      const pattern = [
        { focus: 'Volume', sets: 4, reps: '10-12', intensity: 65, rpe: 7 },
        { focus: 'Strength', sets: 4, reps: '5-6', intensity: 80, rpe: 8 },
        { focus: 'Peak', sets: 5, reps: '2-4', intensity: 88, rpe: 9 },
        { focus: 'Deload', sets: 2, reps: '8-10', intensity: 60, rpe: 5, isDeload: true },
      ];
      return Array.from({ length: weeks }, (_, i) => ({
        week: i + 1,
        ...pattern[i % pattern.length],
      }));
    },
  },
  block: {
    id: 'block',
    name: 'Block Periodization',
    description: 'Accumulation → Transmutation → Realization',
    icon: '🧱',
    generateWeeks: (weeks) => {
      const accumWeeks = Math.ceil(weeks * 0.4);
      const transWeeks = Math.ceil(weeks * 0.35);
      const realWeeks = weeks - accumWeeks - transWeeks;
      
      return Array.from({ length: weeks }, (_, i) => {
        if (i < accumWeeks) {
          return { week: i + 1, phase: 'Accumulation', sets: 4, reps: '8-12', intensity: 65 + (i * 2), rpe: 7, focus: 'Volume' };
        } else if (i < accumWeeks + transWeeks) {
          return { week: i + 1, phase: 'Transmutation', sets: 4, reps: '4-6', intensity: 78 + ((i - accumWeeks) * 3), rpe: 8, focus: 'Intensity' };
        } else {
          const realIdx = i - accumWeeks - transWeeks;
          return { week: i + 1, phase: 'Realization', sets: 3, reps: '1-3', intensity: 90 + (realIdx * 2), rpe: 9, focus: 'Peak' };
        }
      });
    },
  },
  maintenance: {
    id: 'maintenance',
    name: 'Maintenance',
    description: 'Preserve strength with minimal volume',
    icon: '⚖️',
    generateWeeks: (weeks) => {
      return Array.from({ length: weeks }, (_, i) => ({
        week: i + 1,
        sets: 2,
        reps: '3-5',
        intensity: 80,
        rpe: 7,
        note: 'Maintenance only',
      }));
    },
  },
};

// ============== CARDIO ZONE TEMPLATES ==============
const CARDIO_ZONES = {
  zone1: { id: 'zone1', name: 'Zone 1 - Recovery', hrPercent: [50, 60], rpe: [1, 2], description: 'Very easy, full conversation' },
  zone2: { id: 'zone2', name: 'Zone 2 - Aerobic Base', hrPercent: [60, 70], rpe: [3, 4], description: 'Easy, can hold conversation' },
  zone3: { id: 'zone3', name: 'Zone 3 - Tempo', hrPercent: [70, 80], rpe: [5, 6], description: 'Comfortably hard, short sentences' },
  zone4: { id: 'zone4', name: 'Zone 4 - Threshold', hrPercent: [80, 90], rpe: [7, 8], description: 'Hard, few words at a time' },
  zone5: { id: 'zone5', name: 'Zone 5 - VO2 Max', hrPercent: [90, 100], rpe: [9, 10], description: 'Max effort, no talking' },
};

const CARDIO_SESSION_TEMPLATES = {
  zone2Steady: { id: 'zone2Steady', name: 'Zone 2 Steady State', zone: 'zone2', structure: 'continuous', durationRange: [30, 90] },
  tempoIntervals: { id: 'tempoIntervals', name: 'Tempo Intervals', zone: 'zone3', structure: 'intervals', workRest: '5:2', durationRange: [30, 50] },
  thresholdIntervals: { id: 'thresholdIntervals', name: 'Threshold Intervals', zone: 'zone4', structure: 'intervals', workRest: '4:2', durationRange: [35, 50] },
  longSlow: { id: 'longSlow', name: 'Long Slow Distance', zone: 'zone2', structure: 'continuous', durationRange: [90, 240] },
  fartlek: { id: 'fartlek', name: 'Fartlek', zone: 'mixed', structure: 'fartlek', durationRange: [30, 60] },
  hillRepeats: { id: 'hillRepeats', name: 'Hill Repeats', zone: 'zone4', structure: 'intervals', durationRange: [30, 45] },
};

// ============== MESOCYCLE TEMPLATES ==============
const MESO_TEMPLATES = {
  hypertrophy: { id: 'hypertrophy', name: 'Hypertrophy', weeks: 4, icon: '💪', progression: 'linear', defaultSets: 4, defaultReps: '8-12', defaultIntensity: 65 },
  strength: { id: 'strength', name: 'Strength', weeks: 4, icon: '🏋️', progression: 'linear', defaultSets: 4, defaultReps: '4-6', defaultIntensity: 80 },
  power: { id: 'power', name: 'Power', weeks: 3, icon: '⚡', progression: 'undulatingDaily', defaultSets: 4, defaultReps: '2-4', defaultIntensity: 75 },
  peaking: { id: 'peaking', name: 'Peaking', weeks: 2, icon: '🎯', progression: 'block', defaultSets: 3, defaultReps: '1-3', defaultIntensity: 90 },
  deload: { id: 'deload', name: 'Deload', weeks: 1, icon: '😴', progression: 'maintenance', defaultSets: 2, defaultReps: '6-8', defaultIntensity: 60 },
  aerobicBase: { id: 'aerobicBase', name: 'Aerobic Base', weeks: 6, icon: '❤️', progression: 'linear', isCardioFocused: true },
  muscularEndurance: { id: 'muscularEndurance', name: 'Muscular Endurance', weeks: 4, icon: '🔥', progression: 'linear', defaultSets: 3, defaultReps: '15-20', defaultIntensity: 55 },
};

// Helper to get exercise swaps by movement pattern
const getExerciseSwaps = (exerciseId) => {
  const exercise = EXERCISE_LIBRARY[exerciseId];
  if (!exercise) return [];
  return Object.values(EXERCISE_LIBRARY)
    .filter(e => e.pattern === exercise.pattern && e.id !== exerciseId)
    .sort((a, b) => a.name.localeCompare(b.name));
};

// Helper to calculate working weight from 1RM and percentage
const calculateWorkingWeight = (oneRepMax, percentage, roundTo = 5) => {
  if (!oneRepMax || !percentage) return null;
  const weight = oneRepMax * (percentage / 100);
  return Math.round(weight / roundTo) * roundTo;
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
      logs: [...(prev.logs || []).filter(l => l.date !== todayKey), entry].slice(-90)
    }));
  };

  // Button-based rating selector
  const RatingButtons = ({ label, value, onChange, options }) => (
    <div className="space-y-2">
      <label className={`text-sm font-medium ${theme.text}`}>{label}</label>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-2 px-1 rounded-lg text-xs font-medium transition-all ${
              value === opt.value
                ? opt.color || 'bg-blue-500 text-white'
                : `${theme.cardAlt} ${theme.text} hover:opacity-80`
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
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

        <RatingButtons
          label="😴 Sleep Quality"
          value={formData.sleepQuality}
          onChange={(v) => setFormData(prev => ({ ...prev, sleepQuality: v }))}
          options={[
            { value: 1, label: 'Poor', color: 'bg-red-500 text-white' },
            { value: 2, label: 'Fair', color: 'bg-orange-500 text-white' },
            { value: 3, label: 'OK', color: 'bg-yellow-500 text-white' },
            { value: 4, label: 'Good', color: 'bg-lime-500 text-white' },
            { value: 5, label: 'Great', color: 'bg-green-500 text-white' },
          ]}
        />

        <div className="space-y-2">
          <label className={`text-sm font-medium ${theme.text}`}>🛏️ Hours of Sleep</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="3"
              max="12"
              step="0.5"
              value={formData.sleepHours}
              onChange={(e) => setFormData(prev => ({ ...prev, sleepHours: parseFloat(e.target.value) }))}
              className="flex-1"
            />
            <span className={`font-mono font-bold text-lg w-12 text-right ${theme.text}`}>{formData.sleepHours}h</span>
          </div>
        </div>

        <RatingButtons
          label="⚡ Energy Level"
          value={formData.energyLevel}
          onChange={(v) => setFormData(prev => ({ ...prev, energyLevel: v }))}
          options={[
            { value: 1, label: 'Dead', color: 'bg-red-500 text-white' },
            { value: 2, label: 'Low', color: 'bg-orange-500 text-white' },
            { value: 3, label: 'OK', color: 'bg-yellow-500 text-white' },
            { value: 4, label: 'Good', color: 'bg-lime-500 text-white' },
            { value: 5, label: 'High', color: 'bg-green-500 text-white' },
          ]}
        />

        <RatingButtons
          label="💪 Muscle Soreness"
          value={formData.soreness}
          onChange={(v) => setFormData(prev => ({ ...prev, soreness: v }))}
          options={[
            { value: 1, label: 'None', color: 'bg-green-500 text-white' },
            { value: 2, label: 'Light', color: 'bg-lime-500 text-white' },
            { value: 3, label: 'Mod', color: 'bg-yellow-500 text-white' },
            { value: 4, label: 'Heavy', color: 'bg-orange-500 text-white' },
            { value: 5, label: 'Severe', color: 'bg-red-500 text-white' },
          ]}
        />

        <RatingButtons
          label="🔥 Motivation"
          value={formData.motivation}
          onChange={(v) => setFormData(prev => ({ ...prev, motivation: v }))}
          options={[
            { value: 1, label: 'None', color: 'bg-red-500 text-white' },
            { value: 2, label: 'Low', color: 'bg-orange-500 text-white' },
            { value: 3, label: 'OK', color: 'bg-yellow-500 text-white' },
            { value: 4, label: 'Ready', color: 'bg-lime-500 text-white' },
            { value: 5, label: 'Fired Up', color: 'bg-green-500 text-white' },
          ]}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className={`text-sm font-medium ${theme.text}`}>❤️ Resting HR</label>
            <input
              type="number"
              placeholder={athleteProfile.benchmarks?.restingHR?.value || 'bpm'}
              value={formData.restingHR}
              onChange={(e) => setFormData(prev => ({ ...prev, restingHR: e.target.value }))}
              className={`w-full px-3 py-2 rounded-lg border ${theme.input} text-sm`}
            />
          </div>
          <div className="space-y-2">
            <label className={`text-sm font-medium ${theme.text}`}>📊 HRV</label>
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
          <label className={`text-sm font-medium ${theme.text}`}>📝 Notes</label>
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
  const [viewMode, setViewMode] = useState('tests'); // 'tests', 'history', 'compare'
  const [selectedTestHistory, setSelectedTestHistory] = useState(null);
  
  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerMode, setTimerMode] = useState('stopwatch'); // 'stopwatch' or 'countdown'
  const [countdownTarget, setCountdownTarget] = useState(3600); // 60 min default
  const [hrPrompts, setHrPrompts] = useState([]); // For AeT drift test intervals
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          const newTime = timerMode === 'stopwatch' ? prev + 1 : prev - 1;
          
          // Check for HR prompt intervals (AeT drift test)
          if (activeTest === 'aetDrift' && hrPrompts.length > 0) {
            const elapsed = timerMode === 'stopwatch' ? newTime : (countdownTarget - newTime);
            const promptTimes = [0, 900, 1800, 2700, 3600]; // 0, 15, 30, 45, 60 min in seconds
            const promptIndex = promptTimes.findIndex((t, i) => 
              elapsed >= t && elapsed < t + 5 && !testData[`hr${promptTimes[i]/60}`]
            );
            if (promptIndex >= 0 && promptIndex !== currentPromptIndex) {
              setCurrentPromptIndex(promptIndex);
              // Audio cue
              try {
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2JkpGLgXZwaGRobHaCi5GQi4N5cWxsbHN9h42Qj4mBd3Fsa21zfYeMj46Ig3dxa2tvdH6IjY+OiIF2cGprcHWAiY6PjomBdnBpa3B1gImOj46JgXZwaWtwd4GKj5CNiYF1b2lrcXiCi5GQjomAdW9oa3J4g4yRkI6JgHVvaGtzeIONkpGPioB0b2hrc3mEjpOSkYqAdG5na3R6hY+Uk5KLgHRuZ2t0e4WQlJSTi4B0bmdrdXyGkZWUk4uAdG5na3Z8hpKVlZSLgHRuZ2t2fIeSlpWUi4B0bWdrd32Il5aWlIt/dG1nanZ+iZiXl5WLf3Rtamp2foqZmJeVi350bWlqd3+LmpmYlYt+c21panl/jJuamJaLfnNtaWp5gI2cm5mWi35zbWhqeoGOnJuZlot+c2xoanqBj52cmpeLfnNsaGp7gpCenZubinxza2hqe4ORn56cnIt8c2tnanyCkqCfnJyKfHNraWp9g5Ohn5+ci3xzamlqfYOUoaCgnIt8c2lpan2ElKKhoJyLfHJpaWp+hZWioqGci3xyaWlqfoWWo6OhnIt8cmlpan+Gl6Sjo5yKe3Joamp/h5ikoqOci3tyaGlrfoeZpaOknIt7cmhpa3+HmqWjpJyLe3Joamp/iJulpKSci3tyaGpqf4mbpqWlnIt7cmhpa3+JnKampaSLe3JoaWqAiZ2mp6Wki3tyaGlqgIqdp6elpIt7cWhpa4CKnqenpqSLe3FoaWqAi5+oqKaki3txZ2lqgYugqammpIt7cWdoaoGLoKqpp6SLe3FnaWqBjKGqqaekintyZ2lqgY2iqqqop4p7cmdoaoKNoqqqqqeKe3JnaGqCjqOrq6qnintxZ2hqgo6jrKurp4p7cWdoaoOPpKysq6iKe3FnZ2qDj6WsrKuointxZ2dqg4+mrK2sq4p7cGdnaoSQpq2trKuKe3BnZ2qEkKaurqyrinthZ2drh5OpsLCxrYp7Y2Nla4iUqrGxsq+LfGJjZmuIlauxsbKvjHxiY2ZriJWssbKyr4x8YmNma4mWrbGys6+Me2FiZWuKl66ysr+Me2FiZWuKl66ysr+Me2FiZWuKl66ysr+Me2FiZWuKl62ysr+Me2FiZWuKl62ysr+Me2FiZWuKl62ysb+Me2FiZWuKl62ysb+Ke2FiZWuKl62ysb+Ke2FiZWuKl62ysb+Ke2FiZWuJl62ysb+Ke2FiZGuJl62ysb+Ke2FiZGuJl6yysb+Ke2FiZGuJl6yysb+Ke2FiZGuJlqyxsL+Ke2FiZGuJlqyxsL+Ke2FhZGuIlqyxsL+Ke2FhZGuIlqyxsL+Ke2FhZGuIlquxsL+Ie2FhZGuIlquxsL+Ie2FhZGuIlauwr7+Ie2FhZGuIlauwr7+Ie2BhZGuHlKuwr7+Ie2BhZGuHlKuwr7+Ie2BhZGuHlKuwr76Ie2BhZGuHlKuwr76Ie2BhZGuHlKuwr76Ie2BgZGuGk6qvr76Ie2BgZGuGk6qvr76Gd2BgZGuGk6qvr76Gd2BgZGuGk6qvr76Gd19gZGqFkqmvrr6Gd19gZGqFkqmvrr6Gd19gZGqFkqmvrr6Gd19gZGqFkqmurr6Gd19fZGqFkqmurr6Gd19fZGqFkqmurr6Gd19fZGqEkamurr6Gd19fZGqEkamurr6Fd19fZGqEkaiurb6Fd19fZGqEkaiurb6Fd19fY2qEkaiurb6Fd19fY2qEkaiurb6Fd19fY2qDkKitrb6Fd19fY2qDkKitrb6Fd19fY2qDkKitrb6Fd19fY2qDkKitrb6Fd19fY2qDkKitrb6Fd15fY2qDkKetrb6Fd15fY2qDj6etrb6Fd15fY2qCj6etrL6Fd15fY2qCj6etrL6Fd15fY2qCj6asrL6Fd15fY2qCj6asrL6Fd15fYmqCj6asrL6Fd15fYmqCj6asrL6Fd15fYmqBjqWsrL6Fd15fYmqBjqWsq76Fd15fYmqBjqWsq76Fd15fYmqBjqWsq76Fd15fYmqBjqWsq76FdV5fYmqAjaSrq72FdV5fYmqAjaSrq72FdV5fYml/jKSrq72FdV5fYml/jKSrq72FdV5fYml/jKOqq72FdV5fYml/jKOqq72FdV5fYml/jKOqq72DdF5fYWl+i6Oqq72DdF5fYWl+i6Oqqr2DdF5fYWl+i6Oqqr2DdF5fYWl+i6Oqqr2DdF1fYWl+i6Kqqr2DdF1fYWl+i6Kqqr2DdF1fYWl+i6Kqqr2DdF1fYWl+i6Kqqr2DdF1fYWh9iqGpqr2DdF1fYWh9iqGpqr2DdF1fYGh9iqGpqr2DdF1fYGh9iqGpqr2Dc11fYGh8iaGpqr2Dc11fYGh8iaGpqb2Dc11fYGh8iaGoqb2Dc11fYGh8iaGoqb2Dc11fYGh8iaGoqb2Dc11eX2h7iKCoqL2BcV1eX2h7iKCoqL2Bcl1eX2d7iKCoqL2BcV1eX2d7iJ+np72BcV1eX2d7iJ+np72BcV1eX2d7iJ+np72BcV1eXmd6h5+np72BcV1eXmd6h56mp72BcV1eXmd5hp6mp72BcV1eXmZ5hp6mp72AcF1eXmZ5hp6mp7x/cF1dXmZ5hp2lpr1/cF1dXmZ4hZ2lprt/cF1dXmV4hZ2lprx/cF1dXWV4hZykpbx/cF1dXWV4hZykpbx/cF1dXWV3hJykpbt/b11dXWV3hJujpLt/b11dXWR3hJujpLt/b11dXGR3g5ujpLt+b1xdXGR2g5ujpLt+b1xdXGR2g5uio7t+b1xdXGR2gpuio7t+b1xdXGN2gpuio7t+blxdW2N1gpuior1+blxcW2N1gZqhor1+blxcW2N1gZqhor19blxcW2J0gZqhob19blxcW2J0gJmhob19blxcWmJ0gJmgoL19blxcWmJzgJmgoL18bVtcWmJzf5igoL18bVtcWmFzf5ign718bVtcWmFyf5efn718bVtcWmFyfpefn718bVtbWWFyfpefnrx8bVtbWWFxfpaenrx8bVtbWWBxfpaenrt8bFpbWWBxfZaenrt8bFpbWWBwfZWdnbt8bFpbWWBwfZWdnbt8bFpaWF9vfZWdnbt7a1paWF9vfJSdnbt7a1paWF9vfJScnLp7a1paWF9ufJScnLp7a1paV15ue5Scm7p7a1paV15te5Scm7p7a1pZV15te5Sbm7p7allaV15te5Sbm7p6allaV15se5Sbm7p6allaV11seZObmrl6allaVl1seo+amrl6allaVl1seY+amrl6allaVl1seY+amrl6aVlZVlxrd4+amrl5aVlZVlxrd46Zmrh5aVlZVlxrdY6Zmrh5aFhZVlxqdY2Ymrh5aFhZVltqdI2YmLd4aFhZVltqdI2YmLd4aFhYVVtpc4yXl7d4aFhYVVtpcomXl7Z4aFhYVVppcomWlrZ4aFhYVVpocYiWlrZ3Z1hYVFpob4eVlbV3Z1hYVFpob4eVlbV3Z1hYVFlnb4aVlbV3Z1hXVFlmbYWUlLR2ZldXVFlmbYSUlLR2ZldXVFllbISUk7R2ZldXVFlka4OTk7R2ZldXVFlka4KTk7N1ZlZXVFhkaoKSk7N1ZlZWVFhjaYKSkrN1ZlZWVFhjZ4GRkbJ1ZlZWU1djZ4CRkbJ0ZVZWUldjZn+QkLF0ZVZVU1diZX6QkLF0ZVVVU1diZX2PkLB0ZFVVU1dhZH2Pj7BzZFVVUlZhYnyOj69zZFVVUlZhYXuOjq9zY1RUUlZgYHqNjq9yY1RUUVZgXXmNjK5yY1RUUVVgXHiMjK5yYlRUUVVfXHiLjK5yYlNTUFVeW3eLi61xYlNTUFVeWnWKi6xxYVNTT1ReWXSJiqdwYVJST1NdV3OIiqdwYVJST1NdV3OHiadwYVJST1NdV3OHiKZvYFJST1NcVXKGh6VvYFJRT1JcVHGFh6VvYFJRT1JbU3CFhqRuX1FQTlJbUnCDhaNuX1FQTlJaUnCChKNuX1FPTlFZUW+ChKJtXlFPTlFZT26Bg6JtXlBPTlFZT26AgaFsXlBPTVBYTW2Aga9sXlBOTVBXTGyAfq9sXU9OTVBWS2t/fr9rXU9NTE9VSWp+fb5rXU5NTE5URml9fL1qXE5MTE5TRWh8e71qXE5MS05SRGd7e7xpW01LS01SQmd6erxpW01LS01SQmV5erxpWk1LS0xRQWV4ebtpWkxKSktQQGR3eLpoWUxKSkpOP2N2d7lnWEtKSklNPmJ1drhmWEtJSUlMPGF0dbhmV0pJSUhMO2BzdbdlVkpISEhLOl9yc7ZlVkkISEdKOV5xcbVkVUgHR0dJOF1wcLRkVUcHRkZINlxvb7NjVEYGRkVHNltubrJiU0UGRURGNVptbLFhUkUFRERENG9KS2xrQUBAKClGRQAAAA==');
                audio.volume = 0.5;
                audio.play();
              } catch (e) {}
            }
          }
          
          // Stop at zero for countdown
          if (timerMode === 'countdown' && newTime <= 0) {
            setTimerRunning(false);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerMode, activeTest, hrPrompts, testData, currentPromptIndex, countdownTarget]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startTest = (testId) => {
    setActiveTest(testId);
    setTestData({});
    setTestInProgress(true);
    setTimerSeconds(0);
    setTimerRunning(false);
    setCurrentPromptIndex(0);
    
    // Set up HR prompts for AeT drift test
    if (testId === 'aetDrift') {
      setHrPrompts([
        { time: 0, label: 'Start', key: 'hr0' },
        { time: 900, label: '15 min', key: 'hr15' },
        { time: 1800, label: '30 min', key: 'hr30' },
        { time: 2700, label: '45 min', key: 'hr45' },
        { time: 3600, label: '60 min', key: 'hr60' }
      ]);
      setTimerMode('stopwatch');
      setCountdownTarget(3600);
    } else {
      setHrPrompts([]);
    }
  };

  const cancelTest = () => {
    setActiveTest(null);
    setTestData({});
    setTestInProgress(false);
    setTimerRunning(false);
    setTimerSeconds(0);
    setHrPrompts([]);
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
    const isAetTest = activeTest === 'aetDrift';
    const isFiveMile = activeTest === 'fiveMile';
    const isVerticalRate = activeTest === 'verticalRate';
    const showTimer = isAetTest || isFiveMile || isVerticalRate;
    
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className={`text-xl font-bold ${theme.text}`}>{test.icon} {test.name}</h2>
          <button onClick={cancelTest} className={`p-2 ${theme.textMuted} hover:${theme.text}`}><X size={24} /></button>
        </div>

        {/* Timer Section */}
        {showTimer && (
          <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
            <div className="text-center">
              <p className={`text-6xl font-mono font-bold ${theme.text} mb-4`}>{formatTime(timerSeconds)}</p>
              
              {/* Timer controls */}
              <div className="flex justify-center gap-4 mb-4">
                {!timerRunning ? (
                  <button 
                    onClick={() => setTimerRunning(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl"
                  >
                    <Play size={20} /> Start
                  </button>
                ) : (
                  <button 
                    onClick={() => setTimerRunning(false)}
                    className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl"
                  >
                    <StopCircle size={20} /> Pause
                  </button>
                )}
                <button 
                  onClick={() => { setTimerSeconds(0); setTimerRunning(false); }}
                  className={`flex items-center gap-2 px-6 py-3 ${theme.cardAlt} ${theme.text} font-semibold rounded-xl`}
                >
                  <RotateCcw size={20} /> Reset
                </button>
              </div>
              
              {/* AeT Drift Test HR Recording Intervals */}
              {isAetTest && (
                <div className={`mt-4 p-4 ${theme.cardAlt} rounded-xl`}>
                  <p className={`text-sm font-medium ${theme.text} mb-3`}>Record HR at each interval:</p>
                  <div className="grid grid-cols-5 gap-2">
                    {hrPrompts.map((prompt, idx) => {
                      const elapsed = timerSeconds;
                      const isActive = elapsed >= prompt.time && elapsed < prompt.time + 60;
                      const isPast = elapsed >= prompt.time + 60;
                      const hasValue = testData[prompt.key];
                      
                      return (
                        <div 
                          key={prompt.key}
                          className={`p-2 rounded-lg text-center transition-all ${
                            isActive && !hasValue 
                              ? 'bg-orange-500 text-white animate-pulse' 
                              : hasValue 
                                ? (darkMode ? 'bg-green-900/50' : 'bg-green-100')
                                : theme.card
                          }`}
                        >
                          <p className={`text-xs font-medium ${hasValue ? 'text-green-500' : isActive ? 'text-white' : theme.textMuted}`}>
                            {prompt.label}
                          </p>
                          {hasValue ? (
                            <p className={`font-mono font-bold text-green-500`}>{testData[prompt.key]}</p>
                          ) : (
                            <input
                              type="number"
                              placeholder="HR"
                              className={`w-full mt-1 px-2 py-1 rounded text-center text-sm ${theme.input} ${isActive ? 'ring-2 ring-orange-500' : ''}`}
                              value={testData[prompt.key] || ''}
                              onChange={(e) => setTestData(prev => ({ ...prev, [prompt.key]: e.target.value }))}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Live drift calculation */}
                  {testData.hr15 && testData.hr60 && (
                    <div className={`mt-4 p-3 ${parseFloat(test.calculateDrift(testData)) < 5 ? (darkMode ? 'bg-green-900/30' : 'bg-green-50') : (darkMode ? 'bg-red-900/30' : 'bg-red-50')} rounded-lg`}>
                      <p className={`text-sm ${theme.textMuted}`}>Cardiac Drift</p>
                      <p className={`text-3xl font-bold ${parseFloat(test.calculateDrift(testData)) < 5 ? 'text-green-500' : 'text-red-500'}`}>
                        {test.calculateDrift(testData)}%
                      </p>
                      <p className={`text-xs mt-1 ${parseFloat(test.calculateDrift(testData)) < 5 ? 'text-green-500' : 'text-red-500'}`}>
                        {parseFloat(test.calculateDrift(testData)) < 5 ? '✓ Strong aerobic base' : '✗ More base work needed'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 5-Mile: Quick time entry from timer */}
              {isFiveMile && timerSeconds > 0 && (
                <button
                  onClick={() => setTestData(prev => ({ ...prev, time: formatTime(timerSeconds) }))}
                  className={`mt-4 px-4 py-2 ${theme.cardAlt} rounded-lg text-sm ${theme.text}`}
                >
                  Use timer value: {formatTime(timerSeconds)}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Protocol */}
        <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
          <details className="group">
            <summary className={`font-semibold ${theme.text} cursor-pointer flex items-center justify-between`}>
              <span>Protocol</span>
              <ChevronDown size={18} className={`${theme.textMuted} group-open:rotate-180 transition-transform`} />
            </summary>
            <ol className="space-y-2 mt-3">
              {test.protocol.map((step, idx) => (
                <li key={idx} className={`flex gap-3 ${theme.text} text-sm`}>
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full ${theme.cardAlt} ${theme.textMuted} text-xs flex items-center justify-center`}>{idx + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </details>
          {test.notes && <p className={`mt-4 text-sm ${theme.textMuted} p-3 ${theme.cardAlt} rounded-lg`}>💡 {test.notes}</p>}
        </div>

        {/* Data Entry */}
        <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
          <h3 className={`font-semibold ${theme.text} mb-4`}>Record Results</h3>
          <div className="space-y-4">
            {test.metrics.filter(m => m.type !== 'calculated').map(metric => {
              // Skip HR fields for AeT test (handled in timer section)
              if (isAetTest && metric.key.startsWith('hr')) return null;
              
              return (
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
              );
            })}

            {/* Show calculated values */}
            {test.calculateDrift && testData.hr15 && testData.hr60 && !isAetTest && (
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
                <p className={`text-xs ${theme.textMuted} mt-1`}>
                  {test.calculateRate(testData) >= 1000 ? '✓ Target achieved (1000+ ft/hr)' : `${1000 - test.calculateRate(testData)} ft/hr to target`}
                </p>
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

  // History View Component
  const HistoryView = () => {
    const allResults = Object.entries(benchmarkResults).flatMap(([testId, results]) => 
      results.map(r => ({ ...r, testName: BENCHMARK_TESTS[testId]?.name, testIcon: BENCHMARK_TESTS[testId]?.icon }))
    ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold ${theme.text}`}>Test History</h3>
          <button onClick={() => setViewMode('tests')} className={`text-sm ${theme.textMuted}`}>← Back to Tests</button>
        </div>
        
        {allResults.length === 0 ? (
          <div className={`text-center py-8 ${theme.textMuted}`}>
            <Target size={48} className="mx-auto mb-3 opacity-50" />
            <p>No test results yet</p>
            <p className="text-sm">Complete a benchmark test to see your history</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allResults.slice(0, 20).map((result, idx) => (
              <div key={idx} className={`${theme.card} rounded-xl p-4`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{result.testIcon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-medium ${theme.text}`}>{result.testName}</h4>
                      <span className={`text-xs ${theme.textMuted}`}>{formatDateShort(result.date)}</span>
                    </div>
                    <div className={`flex flex-wrap gap-3 mt-2 text-sm`}>
                      {result.data.time && <span className={`font-mono ${theme.text}`}>⏱️ {result.data.time}</span>}
                      {result.data.drift && <span className={`font-mono ${parseFloat(result.data.drift) < 5 ? 'text-green-500' : 'text-red-500'}`}>📉 {result.data.drift}%</span>}
                      {result.data.rate && <span className={`font-mono ${theme.text}`}>⛰️ {result.data.rate} ft/hr</span>}
                      {result.data.maxHR && <span className={`font-mono ${theme.text}`}>❤️ {result.data.maxHR} bpm</span>}
                      {result.data.avgHR && <span className={`font-mono ${theme.text}`}>💓 avg {result.data.avgHR} bpm</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Compare View Component
  const CompareView = () => {
    const testOptions = Object.values(BENCHMARK_TESTS).filter(t => (benchmarkResults[t.id]?.length || 0) > 1);
    
    if (testOptions.length === 0) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold ${theme.text}`}>Progress Comparison</h3>
            <button onClick={() => setViewMode('tests')} className={`text-sm ${theme.textMuted}`}>← Back</button>
          </div>
          <div className={`text-center py-8 ${theme.textMuted}`}>
            <LineChart size={48} className="mx-auto mb-3 opacity-50" />
            <p>Need more data</p>
            <p className="text-sm">Complete the same test multiple times to compare progress</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold ${theme.text}`}>Progress Comparison</h3>
          <button onClick={() => setViewMode('tests')} className={`text-sm ${theme.textMuted}`}>← Back</button>
        </div>
        
        {testOptions.map(test => {
          const results = benchmarkResults[test.id] || [];
          const sortedResults = [...results].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          const first = sortedResults[0];
          const last = sortedResults[sortedResults.length - 1];
          
          // Calculate improvement
          let improvement = null;
          let improvementLabel = '';
          if (test.id === 'fiveMile' && first.data.time && last.data.time) {
            const parseTime = (t) => { const [m, s] = t.split(':').map(Number); return m * 60 + s; };
            const firstSec = parseTime(first.data.time);
            const lastSec = parseTime(last.data.time);
            improvement = firstSec - lastSec;
            improvementLabel = improvement > 0 ? `${Math.floor(improvement / 60)}:${(improvement % 60).toString().padStart(2, '0')} faster` : 'No improvement';
          } else if (test.id === 'aetDrift' && first.data.drift && last.data.drift) {
            improvement = parseFloat(first.data.drift) - parseFloat(last.data.drift);
            improvementLabel = improvement > 0 ? `${improvement.toFixed(1)}% better drift` : 'No improvement';
          } else if (test.id === 'verticalRate' && first.data.rate && last.data.rate) {
            improvement = last.data.rate - first.data.rate;
            improvementLabel = improvement > 0 ? `+${improvement} ft/hr` : 'No improvement';
          }

          return (
            <div key={test.id} className={`${theme.card} rounded-xl p-4`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{test.icon}</span>
                <div>
                  <h4 className={`font-medium ${theme.text}`}>{test.name}</h4>
                  <p className={`text-xs ${theme.textMuted}`}>{results.length} tests completed</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className={`p-3 ${theme.cardAlt} rounded-lg`}>
                  <p className={`text-xs ${theme.textMuted}`}>First</p>
                  <p className={`font-mono font-bold ${theme.text}`}>
                    {first.data.time || first.data.drift + '%' || first.data.rate || '—'}
                  </p>
                  <p className={`text-xs ${theme.textMuted}`}>{formatDateShort(first.date)}</p>
                </div>
                <div className={`p-3 ${improvement && improvement > 0 ? (darkMode ? 'bg-green-900/30' : 'bg-green-50') : theme.cardAlt} rounded-lg`}>
                  <p className={`text-xs ${theme.textMuted}`}>Change</p>
                  <p className={`font-mono font-bold ${improvement && improvement > 0 ? 'text-green-500' : theme.text}`}>
                    {improvementLabel || '—'}
                  </p>
                  <TrendingUp size={16} className={`mx-auto mt-1 ${improvement && improvement > 0 ? 'text-green-500' : theme.textMuted}`} />
                </div>
                <div className={`p-3 ${theme.cardAlt} rounded-lg`}>
                  <p className={`text-xs ${theme.textMuted}`}>Latest</p>
                  <p className={`font-mono font-bold ${theme.text}`}>
                    {last.data.time || last.data.drift + '%' || last.data.rate || '—'}
                  </p>
                  <p className={`text-xs ${theme.textMuted}`}>{formatDateShort(last.date)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Main return - check view mode
  if (viewMode === 'history') {
    return <div className="p-4"><HistoryView /></div>;
  }
  
  if (viewMode === 'compare') {
    return <div className="p-4"><CompareView /></div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-bold ${theme.text}`}>Benchmark Tests</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setViewMode('history')} 
            className={`p-2 ${theme.cardAlt} rounded-lg`}
            title="View History"
          >
            <Clock size={18} className={theme.textMuted} />
          </button>
          <button 
            onClick={() => setViewMode('compare')} 
            className={`p-2 ${theme.cardAlt} rounded-lg`}
            title="Compare Progress"
          >
            <LineChart size={18} className={theme.textMuted} />
          </button>
        </div>
      </div>
      <p className={`text-sm ${theme.textMuted}`}>Structured tests with guided protocols and auto-recording.</p>

      <div className="space-y-3">
        {Object.values(BENCHMARK_TESTS).map(test => {
          const lastResult = getLastResult(test.id);
          const resultCount = benchmarkResults[test.id]?.length || 0;
          return (
            <div key={test.id} className={`${theme.card} rounded-xl shadow-sm p-4`}>
              <div className="flex items-start gap-4">
                <span className="text-3xl">{test.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold ${theme.text}`}>{test.name}</h3>
                    {resultCount > 0 && (
                      <span className={`text-xs ${theme.textMuted} px-2 py-1 ${theme.cardAlt} rounded-full`}>
                        {resultCount} test{resultCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
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
                      {lastResult.data.drift && <span className={`ml-2 font-mono ${parseFloat(lastResult.data.drift) < 5 ? 'text-green-500' : 'text-red-500'}`}>{lastResult.data.drift}%</span>}
                      {lastResult.data.rate && <span className={`ml-2 font-mono ${theme.text}`}>{lastResult.data.rate} ft/hr</span>}
                      {lastResult.data.maxHR && <span className={`ml-2 font-mono ${theme.text}`}>{lastResult.data.maxHR} bpm</span>}
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

// ============== CHARTS & TRENDS COMPONENT ==============
const ChartsView = ({ workoutLogs, benchmarkResults, readiness, athleteProfile, theme, darkMode }) => {
  const [activeChart, setActiveChart] = useState('overview');
  const [timeRange, setTimeRange] = useState(30); // days

  // Filter data by time range
  const filterByRange = (items, dateKey = 'date') => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - timeRange);
    return items.filter(item => new Date(item[dateKey]) >= cutoff);
  };

  // SVG Line Chart Component
  const LineChart = ({ data, xKey, yKey, color = '#10b981', height = 150, showDots = true, yLabel = '', formatY = (v) => v }) => {
    if (!data || data.length < 2) {
      return (
        <div className={`h-[${height}px] flex items-center justify-center ${theme.textMuted}`}>
          <p className="text-sm">Need more data points</p>
        </div>
      );
    }

    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = 320;
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const yValues = data.map(d => d[yKey]).filter(v => v != null);
    const yMin = Math.min(...yValues) * 0.95;
    const yMax = Math.max(...yValues) * 1.05;
    const yRange = yMax - yMin || 1;

    const points = data.map((d, i) => ({
      x: padding.left + (i / (data.length - 1)) * chartWidth,
      y: padding.top + chartHeight - ((d[yKey] - yMin) / yRange) * chartHeight,
      value: d[yKey],
      label: d[xKey]
    }));

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = pathD + ` L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

    // Y-axis ticks
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(pct => ({
      value: yMin + pct * yRange,
      y: padding.top + chartHeight - pct * chartHeight
    }));

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line x1={padding.left} y1={tick.y} x2={width - padding.right} y2={tick.y} stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="1" />
            <text x={padding.left - 5} y={tick.y + 4} textAnchor="end" className={`text-[10px] ${darkMode ? 'fill-gray-500' : 'fill-gray-400'}`}>
              {formatY(Math.round(tick.value))}
            </text>
          </g>
        ))}
        
        {/* Area fill */}
        <path d={areaD} fill={color} fillOpacity="0.1" />
        
        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Dots */}
        {showDots && points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill={color} stroke={darkMode ? '#1f2937' : '#fff'} strokeWidth="2" />
        ))}
        
        {/* X-axis labels (first and last) */}
        <text x={padding.left} y={height - 5} textAnchor="start" className={`text-[10px] ${darkMode ? 'fill-gray-500' : 'fill-gray-400'}`}>
          {data[0]?.[xKey]?.slice(5) || ''}
        </text>
        <text x={width - padding.right} y={height - 5} textAnchor="end" className={`text-[10px] ${darkMode ? 'fill-gray-500' : 'fill-gray-400'}`}>
          {data[data.length - 1]?.[xKey]?.slice(5) || ''}
        </text>
        
        {/* Y-axis label */}
        {yLabel && (
          <text x={10} y={height / 2} textAnchor="middle" transform={`rotate(-90, 10, ${height / 2})`} className={`text-[10px] ${darkMode ? 'fill-gray-500' : 'fill-gray-400'}`}>
            {yLabel}
          </text>
        )}
      </svg>
    );
  };

  // Bar Chart Component
  const BarChart = ({ data, xKey, yKey, color = '#3b82f6', height = 150 }) => {
    if (!data || data.length === 0) {
      return <div className={`h-[${height}px] flex items-center justify-center ${theme.textMuted}`}><p className="text-sm">No data</p></div>;
    }

    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const width = 320;
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const yMax = Math.max(...data.map(d => d[yKey])) * 1.1 || 1;
    const barWidth = (chartWidth / data.length) * 0.7;
    const barGap = (chartWidth / data.length) * 0.3;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {data.map((d, i) => {
          const barHeight = (d[yKey] / yMax) * chartHeight;
          const x = padding.left + i * (barWidth + barGap) + barGap / 2;
          const y = padding.top + chartHeight - barHeight;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barWidth} height={barHeight} fill={color} rx="4" fillOpacity="0.8" />
              <text x={x + barWidth / 2} y={height - 5} textAnchor="middle" className={`text-[9px] ${darkMode ? 'fill-gray-500' : 'fill-gray-400'}`}>
                {d[xKey]?.slice(5, 10) || i}
              </text>
              <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" className={`text-[10px] font-medium ${darkMode ? 'fill-gray-300' : 'fill-gray-600'}`}>
                {d[yKey]}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  // Prepare workout volume data (weekly)
  const workoutVolumeData = useMemo(() => {
    const weeks = {};
    workoutLogs.forEach(log => {
      const date = new Date(log.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().slice(0, 10);
      if (!weeks[weekKey]) weeks[weekKey] = { week: weekKey, workouts: 0, duration: 0 };
      weeks[weekKey].workouts++;
      weeks[weekKey].duration += log.duration || 0;
    });
    return Object.values(weeks).sort((a, b) => a.week.localeCompare(b.week)).slice(-8);
  }, [workoutLogs]);

  // Prepare readiness trend data
  const readinessData = useMemo(() => {
    return filterByRange(readiness.logs || [], 'date')
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(r => ({ date: r.date, score: r.score, sleep: r.sleepHours }));
  }, [readiness.logs, timeRange]);

  // Prepare benchmark trends
  const benchmarkTrends = useMemo(() => {
    const trends = {};
    Object.entries(benchmarkResults).forEach(([testId, results]) => {
      if (results && results.length > 0) {
        trends[testId] = results
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          .map(r => ({
            date: r.date,
            ...r.data
          }));
      }
    });
    return trends;
  }, [benchmarkResults]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const recentLogs = filterByRange(workoutLogs, 'date');
    const recentReadiness = filterByRange(readiness.logs || [], 'date');
    
    return {
      totalWorkouts: recentLogs.length,
      totalDuration: recentLogs.reduce((sum, l) => sum + (l.duration || 0), 0),
      avgRPE: recentLogs.length > 0 ? (recentLogs.reduce((sum, l) => sum + (l.rpe || 5), 0) / recentLogs.length).toFixed(1) : '—',
      avgReadiness: recentReadiness.length > 0 ? (recentReadiness.reduce((sum, r) => sum + (r.score || 0), 0) / recentReadiness.length).toFixed(0) : '—',
      avgSleep: recentReadiness.length > 0 ? (recentReadiness.reduce((sum, r) => sum + (r.sleepHours || 0), 0) / recentReadiness.length).toFixed(1) : '—',
    };
  }, [workoutLogs, readiness.logs, timeRange]);

  // PR History from athlete profile
  const prHistory = useMemo(() => {
    return (athleteProfile.history || [])
      .filter(h => h.category === 'prs')
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
  }, [athleteProfile.history]);

  const chartOptions = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'readiness', label: 'Readiness', icon: '🔋' },
    { id: 'benchmarks', label: 'Benchmarks', icon: '🎯' },
    { id: 'strength', label: 'Strength', icon: '💪' },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-bold ${theme.text}`}>Charts & Trends</h2>
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(Number(e.target.value))}
          className={`px-3 py-1 rounded-lg text-sm ${theme.input}`}
        >
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
          <option value={365}>1 year</option>
        </select>
      </div>

      {/* Chart Type Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {chartOptions.map(opt => (
          <button
            key={opt.id}
            onClick={() => setActiveChart(opt.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeChart === opt.id 
                ? 'bg-blue-500 text-white' 
                : `${theme.cardAlt} ${theme.text}`
            }`}
          >
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeChart === 'overview' && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`${theme.card} rounded-xl p-4`}>
              <p className={`text-xs ${theme.textMuted}`}>Workouts</p>
              <p className={`text-2xl font-bold ${theme.text}`}>{stats.totalWorkouts}</p>
              <p className={`text-xs ${theme.textMuted}`}>last {timeRange} days</p>
            </div>
            <div className={`${theme.card} rounded-xl p-4`}>
              <p className={`text-xs ${theme.textMuted}`}>Total Time</p>
              <p className={`text-2xl font-bold ${theme.text}`}>{Math.round(stats.totalDuration / 60)}h</p>
              <p className={`text-xs ${theme.textMuted}`}>{stats.totalDuration} min</p>
            </div>
            <div className={`${theme.card} rounded-xl p-4`}>
              <p className={`text-xs ${theme.textMuted}`}>Avg RPE</p>
              <p className={`text-2xl font-bold ${theme.text}`}>{stats.avgRPE}</p>
              <p className={`text-xs ${theme.textMuted}`}>perceived effort</p>
            </div>
            <div className={`${theme.card} rounded-xl p-4`}>
              <p className={`text-xs ${theme.textMuted}`}>Avg Readiness</p>
              <p className={`text-2xl font-bold ${theme.text}`}>{stats.avgReadiness}</p>
              <p className={`text-xs ${theme.textMuted}`}>out of 100</p>
            </div>
          </div>

          {/* Weekly Volume Chart */}
          <div className={`${theme.card} rounded-xl p-4`}>
            <h3 className={`font-semibold ${theme.text} mb-3`}>Weekly Training Volume</h3>
            {workoutVolumeData.length > 0 ? (
              <BarChart data={workoutVolumeData} xKey="week" yKey="workouts" color="#3b82f6" height={160} />
            ) : (
              <div className={`h-32 flex items-center justify-center ${theme.textMuted}`}>
                <p className="text-sm">Complete workouts to see trends</p>
              </div>
            )}
          </div>

          {/* Recent PRs */}
          {prHistory.length > 0 && (
            <div className={`${theme.card} rounded-xl p-4`}>
              <h3 className={`font-semibold ${theme.text} mb-3`}>Recent PRs</h3>
              <div className="space-y-2">
                {prHistory.slice(0, 5).map((pr, i) => (
                  <div key={i} className={`flex items-center justify-between p-2 ${theme.cardAlt} rounded-lg`}>
                    <div>
                      <p className={`font-medium ${theme.text}`}>{PR_DISPLAY_NAMES[pr.key] || pr.key}</p>
                      <p className={`text-xs ${theme.textMuted}`}>{formatDateShort(pr.date?.slice(0, 10))}</p>
                    </div>
                    <p className={`font-mono font-bold text-green-500`}>{pr.value} lbs</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Readiness Charts */}
      {activeChart === 'readiness' && (
        <div className="space-y-4">
          <div className={`${theme.card} rounded-xl p-4`}>
            <h3 className={`font-semibold ${theme.text} mb-3`}>Readiness Score Trend</h3>
            <LineChart data={readinessData} xKey="date" yKey="score" color="#10b981" height={180} yLabel="Score" />
          </div>
          
          <div className={`${theme.card} rounded-xl p-4`}>
            <h3 className={`font-semibold ${theme.text} mb-3`}>Sleep Hours</h3>
            <LineChart data={readinessData} xKey="date" yKey="sleep" color="#8b5cf6" height={180} yLabel="Hours" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`${theme.card} rounded-xl p-4 text-center`}>
              <p className={`text-xs ${theme.textMuted}`}>Avg Sleep</p>
              <p className={`text-3xl font-bold ${theme.text}`}>{stats.avgSleep}h</p>
            </div>
            <div className={`${theme.card} rounded-xl p-4 text-center`}>
              <p className={`text-xs ${theme.textMuted}`}>Check-ins</p>
              <p className={`text-3xl font-bold ${theme.text}`}>{readinessData.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Benchmark Charts */}
      {activeChart === 'benchmarks' && (
        <div className="space-y-4">
          {/* 5-Mile Time */}
          {benchmarkTrends.fiveMile && benchmarkTrends.fiveMile.length > 0 && (
            <div className={`${theme.card} rounded-xl p-4`}>
              <h3 className={`font-semibold ${theme.text} mb-1`}>🏃 5-Mile Time</h3>
              <p className={`text-xs ${theme.textMuted} mb-3`}>{benchmarkTrends.fiveMile.length} tests recorded</p>
              <div className="flex items-end justify-between mb-4">
                {benchmarkTrends.fiveMile.map((t, i) => (
                  <div key={i} className="text-center flex-1">
                    <p className={`font-mono font-bold ${i === benchmarkTrends.fiveMile.length - 1 ? 'text-green-500 text-lg' : theme.text}`}>
                      {t.time || '—'}
                    </p>
                    <p className={`text-xs ${theme.textMuted}`}>{formatDateShort(t.date)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AeT Drift */}
          {benchmarkTrends.aetDrift && benchmarkTrends.aetDrift.length > 0 && (
            <div className={`${theme.card} rounded-xl p-4`}>
              <h3 className={`font-semibold ${theme.text} mb-1`}>💓 Cardiac Drift</h3>
              <p className={`text-xs ${theme.textMuted} mb-3`}>Target: &lt;5%</p>
              <div className="space-y-2">
                {benchmarkTrends.aetDrift.map((t, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 ${theme.cardAlt} rounded-lg`}>
                    <span className={`text-sm ${theme.textMuted}`}>{formatDateShort(t.date)}</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-24 h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                        <div 
                          className={`h-full ${parseFloat(t.drift) < 5 ? 'bg-green-500' : parseFloat(t.drift) < 10 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(parseFloat(t.drift) * 10, 100)}%` }}
                        />
                      </div>
                      <span className={`font-mono font-bold ${parseFloat(t.drift) < 5 ? 'text-green-500' : 'text-red-500'}`}>
                        {t.drift}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vertical Rate */}
          {benchmarkTrends.verticalRate && benchmarkTrends.verticalRate.length > 0 && (
            <div className={`${theme.card} rounded-xl p-4`}>
              <h3 className={`font-semibold ${theme.text} mb-1`}>⛰️ Vertical Rate</h3>
              <p className={`text-xs ${theme.textMuted} mb-3`}>Target: 1000 ft/hr @ 25% BW</p>
              <div className="space-y-2">
                {benchmarkTrends.verticalRate.map((t, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 ${theme.cardAlt} rounded-lg`}>
                    <div>
                      <span className={`text-sm ${theme.textMuted}`}>{formatDateShort(t.date)}</span>
                      {t.load && <span className={`text-xs ${theme.textMuted} ml-2`}>@ {t.load} lbs</span>}
                    </div>
                    <span className={`font-mono font-bold ${t.rate >= 1000 ? 'text-green-500' : theme.text}`}>
                      {t.rate} ft/hr
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(benchmarkTrends).length === 0 && (
            <div className={`${theme.card} rounded-xl p-8 text-center`}>
              <Target size={48} className={`mx-auto ${theme.textMuted} mb-4`} />
              <p className={theme.textMuted}>No benchmark data yet</p>
              <p className={`text-sm ${theme.textMuted}`}>Complete tests to track progress</p>
            </div>
          )}
        </div>
      )}

      {/* Strength Charts */}
      {activeChart === 'strength' && (
        <div className="space-y-4">
          {/* Current PRs */}
          <div className={`${theme.card} rounded-xl p-4`}>
            <h3 className={`font-semibold ${theme.text} mb-3`}>Current PRs</h3>
            <div className="space-y-2">
              {Object.entries(athleteProfile.prs || {}).filter(([_, v]) => v?.value).map(([key, pr]) => (
                <div key={key} className={`flex items-center justify-between p-3 ${theme.cardAlt} rounded-lg`}>
                  <div>
                    <p className={`font-medium ${theme.text}`}>{PR_DISPLAY_NAMES[key] || key}</p>
                    {pr.date && <p className={`text-xs ${theme.textMuted}`}>{formatDateShort(pr.date)}</p>}
                  </div>
                  <p className={`font-mono font-bold text-lg ${theme.text}`}>{pr.value} <span className={`text-sm ${theme.textMuted}`}>{pr.unit}</span></p>
                </div>
              ))}
              {Object.values(athleteProfile.prs || {}).filter(v => v?.value).length === 0 && (
                <p className={`text-center py-4 ${theme.textMuted}`}>No PRs recorded yet</p>
              )}
            </div>
          </div>

          {/* PR Timeline */}
          {prHistory.length > 0 && (
            <div className={`${theme.card} rounded-xl p-4`}>
              <h3 className={`font-semibold ${theme.text} mb-3`}>PR History</h3>
              <div className="space-y-2">
                {prHistory.map((pr, i) => (
                  <div key={i} className={`flex items-center gap-3 p-2 ${theme.cardAlt} rounded-lg`}>
                    <div className={`w-2 h-2 rounded-full bg-green-500`} />
                    <div className="flex-1">
                      <p className={`text-sm ${theme.text}`}>{PR_DISPLAY_NAMES[pr.key] || pr.key}</p>
                      <p className={`text-xs ${theme.textMuted}`}>{formatDateShort(pr.date?.slice(0, 10))}</p>
                    </div>
                    <p className={`font-mono font-bold text-green-500`}>{pr.value} lbs</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strength Standards */}
          <div className={`${theme.card} rounded-xl p-4`}>
            <h3 className={`font-semibold ${theme.text} mb-3`}>Program Standards</h3>
            <p className={`text-xs ${theme.textMuted} mb-3`}>Based on {athleteProfile.weight || 225} lb bodyweight</p>
            <div className="space-y-3">
              {[
                { lift: 'Trap Bar Deadlift', target: 2.0, current: athleteProfile.prs?.trapBarDeadlift?.value },
                { lift: 'Back Squat', target: 1.5, current: athleteProfile.prs?.backSquat?.value },
                { lift: 'Bench Press', target: 1.25, current: athleteProfile.prs?.benchPress?.value },
                { lift: 'Weighted Pull-up', target: 0.5, current: athleteProfile.prs?.weightedPullUp?.value },
              ].map((item, i) => {
                const targetLbs = Math.round((athleteProfile.weight || 225) * item.target);
                const progress = item.current ? Math.min((item.current / targetLbs) * 100, 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={theme.text}>{item.lift}</span>
                      <span className={theme.textMuted}>{item.current || 0} / {targetLbs} lbs</span>
                    </div>
                    <div className={`h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                      <div 
                        className={`h-full ${progress >= 100 ? 'bg-green-500' : 'bg-blue-500'} transition-all`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
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

// ============== PROGRAM BUILDER COMPONENT ==============
const ProgramBuilderView = ({ customPrograms, setCustomPrograms, theme }) => {
  const [step, setStep] = useState('type');
  const [programType, setProgramType] = useState(null);
  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [programIcon, setProgramIcon] = useState('🏋️');
  const [phases, setPhases] = useState([]);
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [showExercisePicker, setShowExercisePicker] = useState(null);
  const [showSwapPicker, setShowSwapPicker] = useState(null);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseWeeks, setNewPhaseWeeks] = useState(4);
  const [newPhaseProgression, setNewPhaseProgression] = useState('linear');
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exerciseFilter, setExerciseFilter] = useState('all');

  const ICONS = ['🏋️', '💪', '🏃', '⛰️', '🔥', '⚡', '🎯', '🧗', '🚴', '🏊', '❄️', '🌲'];
  const SESSION_TYPES = [
    { id: 'strength', name: 'Strength', icon: '🏋️' },
    { id: 'cardio', name: 'Cardio', icon: '❤️' },
    { id: 'muscular_endurance', name: 'Muscular Endurance', icon: '🔥' },
    { id: 'mobility', name: 'Mobility', icon: '🧘' },
    { id: 'recovery', name: 'Recovery/Off', icon: '😴' },
  ];

  const currentPhase = phases[currentPhaseIdx];
  const totalWeeks = phases.reduce((sum, p) => sum + p.weeks, 0);

  const addPhase = () => {
    if (!newPhaseName) return;
    const startWeek = phases.reduce((sum, p) => sum + p.weeks, 0) + 1;
    const endWeek = startWeek + newPhaseWeeks - 1;
    const progressionModel = PROGRESSION_MODELS[newPhaseProgression];
    const weeklyProgression = progressionModel.generateWeeks(newPhaseWeeks);
    setPhases(prev => [...prev, {
      id: `phase_${Date.now()}`,
      name: newPhaseName,
      weeks: newPhaseWeeks,
      progression: newPhaseProgression,
      weeksRange: [startWeek, endWeek],
      weeklyProgression,
      weeklyTemplate: Array(7).fill(null).map((_, i) => ({ day: i + 1, dayName: `Day ${i + 1}`, session: '', type: 'recovery', exercises: [], duration: 60, cardioZone: 'zone2', cardioActivity: 'run' })),
    }]);
    setNewPhaseName('');
    setNewPhaseWeeks(4);
  };

  const removePhase = (idx) => setPhases(prev => prev.filter((_, i) => i !== idx));

  const updateDay = (dayIdx, updates) => {
    setPhases(prev => prev.map((ph, i) => i === currentPhaseIdx ? {
      ...ph, weeklyTemplate: ph.weeklyTemplate.map((d, di) => di === dayIdx ? { ...d, ...updates } : d)
    } : ph));
  };

  const addExercise = (dayIdx) => {
    const day = currentPhase.weeklyTemplate[dayIdx];
    updateDay(dayIdx, { exercises: [...(day.exercises || []), { id: `ex_${Date.now()}`, exerciseId: null, name: '', sets: 3, reps: '8-10', intensity: 70, rpe: 7, rest: '2 min' }] });
  };

  const updateExercise = (dayIdx, exIdx, updates) => {
    const day = currentPhase.weeklyTemplate[dayIdx];
    updateDay(dayIdx, { exercises: day.exercises.map((ex, i) => i === exIdx ? { ...ex, ...updates } : ex) });
  };

  const removeExercise = (dayIdx, exIdx) => {
    const day = currentPhase.weeklyTemplate[dayIdx];
    updateDay(dayIdx, { exercises: day.exercises.filter((_, i) => i !== exIdx) });
  };

  const selectExercise = (exerciseId) => {
    const { dayIdx, exerciseIdx } = showExercisePicker;
    const exercise = EXERCISE_LIBRARY[exerciseId];
    updateExercise(dayIdx, exerciseIdx, { exerciseId, name: exercise.name, prKey: exercise.prKey || null });
    setShowExercisePicker(null);
    setExerciseSearch('');
    setExerciseFilter('all');
  };

  const selectSwap = (exerciseId) => {
    const { dayIdx, exerciseIdx } = showSwapPicker;
    const exercise = EXERCISE_LIBRARY[exerciseId];
    updateExercise(dayIdx, exerciseIdx, { exerciseId, name: exercise.name, prKey: exercise.prKey || null });
    setShowSwapPicker(null);
  };

  const saveProgram = () => {
    const finalProgram = {
      id: `custom_${Date.now()}`,
      name: programName,
      description: programDescription,
      icon: programIcon,
      phases: phases.map(phase => ({
        id: phase.id, name: phase.name, weeks: phase.weeksRange,
        description: `${PROGRESSION_MODELS[phase.progression].name} progression`,
        weeklyTemplate: phase.weeklyTemplate.map(day => ({
          day: day.day, dayName: day.dayName, session: day.session, type: day.type, duration: day.duration || 60,
          prescription: day.type === 'cardio' ? { hrZone: day.cardioZone || 'zone2', description: CARDIO_ZONES[day.cardioZone || 'zone2']?.description } : { exercises: (day.exercises || []).map(ex => ({ name: ex.name, sets: ex.sets, reps: ex.reps, percentage: ex.intensity, rpe: ex.rpe, rest: ex.rest, prKey: ex.prKey })) },
        })),
      })),
    };
    setCustomPrograms(prev => ({ ...prev, [finalProgram.id]: finalProgram }));
    setStep('type'); setProgramType(null); setProgramName(''); setProgramDescription(''); setProgramIcon('🏋️'); setPhases([]); setCurrentPhaseIdx(0);
  };

  const filteredExercises = Object.values(EXERCISE_LIBRARY).filter(e => !e.isCardio && !e.isMobility).filter(e => exerciseFilter === 'all' || e.pattern === exerciseFilter).filter(e => e.name.toLowerCase().includes(exerciseSearch.toLowerCase()));

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-6">
        {['type', 'details', 'phases', 'template', 'review'].map((s, i) => (
          <div key={s} className={`h-2 flex-1 rounded-full ${['type', 'details', 'phases', 'template', 'review'].indexOf(step) >= i ? 'bg-blue-500' : theme.cardAlt}`} />
        ))}
      </div>

      {step === 'type' && (
        <div className="space-y-4">
          <h3 className={`text-lg font-bold ${theme.text}`}>What do you want to build?</h3>
          <button onClick={() => { setProgramType('meso'); setStep('details'); }} className={`w-full ${theme.card} rounded-xl p-5 text-left border-2 ${theme.border} hover:border-blue-500`}>
            <div className="flex items-center gap-4"><span className="text-3xl">📦</span><div><p className={`font-bold ${theme.text}`}>Mesocycle</p><p className={`text-sm ${theme.textMuted}`}>Single training block (3-8 weeks)</p></div></div>
          </button>
          <button onClick={() => { setProgramType('macro'); setStep('details'); }} className={`w-full ${theme.card} rounded-xl p-5 text-left border-2 ${theme.border} hover:border-blue-500`}>
            <div className="flex items-center gap-4"><span className="text-3xl">📅</span><div><p className={`font-bold ${theme.text}`}>Macrocycle</p><p className={`text-sm ${theme.textMuted}`}>Multiple mesocycles (12-52 weeks)</p></div></div>
          </button>
        </div>
      )}

      {step === 'details' && (
        <div className="space-y-4">
          <h3 className={`text-lg font-bold ${theme.text}`}>Program Details</h3>
          <div><label className={`block text-sm font-medium ${theme.text} mb-2`}>Program Name</label><input type="text" value={programName} onChange={(e) => setProgramName(e.target.value)} placeholder="e.g., Pre-Season Strength" className={`w-full p-3 rounded-lg ${theme.input} border`} /></div>
          <div><label className={`block text-sm font-medium ${theme.text} mb-2`}>Description</label><textarea value={programDescription} onChange={(e) => setProgramDescription(e.target.value)} placeholder="Brief description..." rows={2} className={`w-full p-3 rounded-lg ${theme.input} border`} /></div>
          <div><label className={`block text-sm font-medium ${theme.text} mb-2`}>Icon</label><div className="flex flex-wrap gap-2">{ICONS.map(icon => (<button key={icon} onClick={() => setProgramIcon(icon)} className={`text-2xl p-2 rounded-lg ${programIcon === icon ? 'bg-blue-500' : theme.cardAlt}`}>{icon}</button>))}</div></div>
          <button onClick={() => setStep('phases')} disabled={!programName} className={`w-full py-3 rounded-xl font-medium ${programName ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'}`}>Next: Add {programType === 'meso' ? 'Phase' : 'Mesocycles'}</button>
        </div>
      )}

      {step === 'phases' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between"><h3 className={`text-lg font-bold ${theme.text}`}>{programType === 'meso' ? 'Phase Setup' : 'Mesocycles'}</h3><span className={`text-sm ${theme.textMuted}`}>{totalWeeks} weeks total</span></div>
          {phases.map((phase, idx) => (
            <div key={phase.id} className={`${theme.card} rounded-xl p-4`}>
              <div className="flex items-center justify-between">
                <div><p className={`font-medium ${theme.text}`}>{phase.name}</p><p className={`text-sm ${theme.textMuted}`}>Weeks {phase.weeksRange[0]}-{phase.weeksRange[1]} • {PROGRESSION_MODELS[phase.progression].name}</p></div>
                <div className="flex gap-2"><button onClick={() => { setCurrentPhaseIdx(idx); setStep('template'); }} className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm">Edit Days</button><button onClick={() => removePhase(idx)} className="px-3 py-1 bg-red-500/20 text-red-500 rounded-lg text-sm"><Trash2 size={16} /></button></div>
              </div>
            </div>
          ))}
          <div className={`${theme.card} rounded-xl p-4 space-y-4 border-2 border-dashed ${theme.border}`}>
            <p className={`font-medium ${theme.text}`}>Add {programType === 'meso' ? 'Phase' : 'Mesocycle'}</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={`block text-xs ${theme.textMuted} mb-1`}>Name</label><input type="text" value={newPhaseName} onChange={(e) => setNewPhaseName(e.target.value)} placeholder="e.g., Accumulation" className={`w-full p-2 rounded-lg ${theme.input} border text-sm`} /></div>
              <div><label className={`block text-xs ${theme.textMuted} mb-1`}>Weeks</label><input type="number" value={newPhaseWeeks} onChange={(e) => setNewPhaseWeeks(Math.max(1, parseInt(e.target.value) || 1))} min={1} max={12} className={`w-full p-2 rounded-lg ${theme.input} border text-sm`} /></div>
            </div>
            <div><label className={`block text-xs ${theme.textMuted} mb-2`}>Progression Model</label>
              <div className="grid grid-cols-2 gap-2">{Object.values(PROGRESSION_MODELS).map(model => (<button key={model.id} onClick={() => setNewPhaseProgression(model.id)} className={`p-3 rounded-lg text-left ${newPhaseProgression === model.id ? 'bg-blue-500 text-white' : theme.cardAlt}`}><span className="text-lg mr-2">{model.icon}</span><span className="text-sm font-medium">{model.name}</span></button>))}</div>
              <p className={`text-xs ${theme.textMuted} mt-2`}>{PROGRESSION_MODELS[newPhaseProgression].description}</p>
            </div>
            <button onClick={addPhase} disabled={!newPhaseName} className={`w-full py-2 rounded-lg font-medium ${newPhaseName ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'}`}><Plus size={18} className="inline mr-1" /> Add Phase</button>
          </div>
          {phases.length > 0 && (<button onClick={() => setStep('review')} className="w-full py-3 rounded-xl font-medium bg-blue-500 text-white">Review & Save Program</button>)}
        </div>
      )}

      {step === 'template' && currentPhase && (
        <div className="space-y-4">
          <div className="flex items-center justify-between"><button onClick={() => setStep('phases')} className={theme.textMuted}><ChevronLeft size={20} className="inline" /> Back</button><h3 className={`font-bold ${theme.text}`}>{currentPhase.name}</h3><span className={`text-sm ${theme.textMuted}`}>Week 1 of {currentPhase.weeks}</span></div>
          <p className={`text-sm ${theme.textMuted}`}>Build Week 1 template. Exercises auto-propagate to all {currentPhase.weeks} weeks with {PROGRESSION_MODELS[currentPhase.progression].name} progression.</p>
          {currentPhase.weeklyTemplate.map((day, dayIdx) => (
            <div key={day.day} className={`${theme.card} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-3">
                <input type="text" value={day.dayName} onChange={(e) => updateDay(dayIdx, { dayName: e.target.value })} className={`font-medium ${theme.text} bg-transparent border-b ${theme.border} w-24`} />
                <select value={day.type} onChange={(e) => updateDay(dayIdx, { type: e.target.value, session: SESSION_TYPES.find(s => s.id === e.target.value)?.name || '' })} className={`p-2 rounded-lg ${theme.input} text-sm`}>{SESSION_TYPES.map(t => (<option key={t.id} value={t.id}>{t.icon} {t.name}</option>))}</select>
              </div>
              {day.type !== 'recovery' && (
                <>
                  <input type="text" value={day.session} onChange={(e) => updateDay(dayIdx, { session: e.target.value })} placeholder="Session name (e.g., Upper Body A)" className={`w-full p-2 rounded-lg ${theme.input} border text-sm mb-3`} />
                  {day.type === 'cardio' ? (
                    <div className="space-y-2">
                      <select value={day.cardioZone || 'zone2'} onChange={(e) => updateDay(dayIdx, { cardioZone: e.target.value })} className={`w-full p-2 rounded-lg ${theme.input} text-sm`}>{Object.values(CARDIO_ZONES).map(z => (<option key={z.id} value={z.id}>{z.name}</option>))}</select>
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className={`text-xs ${theme.textMuted}`}>Duration (min)</label><input type="number" value={day.duration || 45} onChange={(e) => updateDay(dayIdx, { duration: parseInt(e.target.value) || 30 })} className={`w-full p-2 rounded-lg ${theme.input} text-sm`} /></div>
                        <div><label className={`text-xs ${theme.textMuted}`}>Activity</label><select value={day.cardioActivity || 'run'} onChange={(e) => updateDay(dayIdx, { cardioActivity: e.target.value })} className={`w-full p-2 rounded-lg ${theme.input} text-sm`}>{Object.values(EXERCISE_LIBRARY).filter(e => e.isCardio).map(e => (<option key={e.id} value={e.id}>{e.name}</option>))}</select></div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(day.exercises || []).map((ex, exIdx) => (
                        <div key={ex.id} className={`${theme.cardAlt} rounded-lg p-3`}>
                          <div className="flex items-center justify-between mb-2">
                            <button onClick={() => setShowExercisePicker({ dayIdx, exerciseIdx: exIdx })} className={`text-sm font-medium ${ex.exerciseId ? theme.text : 'text-blue-500'}`}>{ex.exerciseId ? EXERCISE_LIBRARY[ex.exerciseId]?.name || ex.name : '+ Select Exercise'}</button>
                            <div className="flex gap-1">{ex.exerciseId && (<button onClick={() => setShowSwapPicker({ dayIdx, exerciseIdx: exIdx, currentExerciseId: ex.exerciseId })} className={`p-1 ${theme.textMuted} hover:text-blue-500`} title="Swap"><RotateCcw size={14} /></button>)}<button onClick={() => removeExercise(dayIdx, exIdx)} className="p-1 text-red-500"><Trash2 size={14} /></button></div>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            <div><label className={theme.textMuted}>Sets</label><input type="number" value={ex.sets} onChange={(e) => updateExercise(dayIdx, exIdx, { sets: parseInt(e.target.value) || 3 })} className={`w-full p-1 rounded ${theme.input}`} /></div>
                            <div><label className={theme.textMuted}>Reps</label><input type="text" value={ex.reps} onChange={(e) => updateExercise(dayIdx, exIdx, { reps: e.target.value })} className={`w-full p-1 rounded ${theme.input}`} /></div>
                            <div><label className={theme.textMuted}>%1RM</label><input type="number" value={ex.intensity} onChange={(e) => updateExercise(dayIdx, exIdx, { intensity: parseInt(e.target.value) || 70 })} className={`w-full p-1 rounded ${theme.input}`} /></div>
                            <div><label className={theme.textMuted}>RPE</label><input type="number" value={ex.rpe} onChange={(e) => updateExercise(dayIdx, exIdx, { rpe: parseInt(e.target.value) || 7 })} min={1} max={10} className={`w-full p-1 rounded ${theme.input}`} /></div>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => addExercise(dayIdx)} className={`w-full py-2 border-2 border-dashed ${theme.border} rounded-lg text-sm ${theme.textMuted}`}><Plus size={16} className="inline mr-1" /> Add Exercise</button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          <button onClick={() => setStep('phases')} className="w-full py-3 rounded-xl font-medium bg-blue-500 text-white">Save Template</button>
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-4">
          <h3 className={`text-lg font-bold ${theme.text}`}>Review Program</h3>
          <div className={`${theme.card} rounded-xl p-5`}>
            <div className="flex items-center gap-3 mb-4"><span className="text-4xl">{programIcon}</span><div><h4 className={`text-xl font-bold ${theme.text}`}>{programName}</h4><p className={`text-sm ${theme.textMuted}`}>{programDescription}</p></div></div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className={`${theme.cardAlt} rounded-lg p-3 text-center`}><p className={`text-2xl font-bold ${theme.text}`}>{totalWeeks}</p><p className={`text-xs ${theme.textMuted}`}>Total Weeks</p></div>
              <div className={`${theme.cardAlt} rounded-lg p-3 text-center`}><p className={`text-2xl font-bold ${theme.text}`}>{phases.length}</p><p className={`text-xs ${theme.textMuted}`}>Phases</p></div>
            </div>
            {phases.map((phase) => (<div key={phase.id} className={`${theme.cardAlt} rounded-lg p-3 mb-2`}><div className="flex justify-between items-center"><div><p className={`font-medium ${theme.text}`}>{phase.name}</p><p className={`text-xs ${theme.textMuted}`}>Weeks {phase.weeksRange[0]}-{phase.weeksRange[1]} • {PROGRESSION_MODELS[phase.progression].name}</p></div><p className={`text-sm ${theme.textMuted}`}>{phase.weeks} wks</p></div></div>))}
          </div>
          <div className="flex gap-3"><button onClick={() => setStep('phases')} className={`flex-1 py-3 rounded-xl font-medium ${theme.cardAlt} ${theme.text}`}>Edit</button><button onClick={saveProgram} className="flex-1 py-3 rounded-xl font-medium bg-green-500 text-white">Save Program</button></div>
        </div>
      )}

      {showExercisePicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className={`${theme.bg} w-full rounded-t-2xl p-4 max-h-[80vh] overflow-auto`}>
            <div className="flex items-center justify-between mb-4"><h3 className={`font-bold ${theme.text}`}>Select Exercise</h3><button onClick={() => { setShowExercisePicker(null); setExerciseSearch(''); setExerciseFilter('all'); }}><X size={24} className={theme.text} /></button></div>
            <input type="text" placeholder="Search exercises..." value={exerciseSearch} onChange={(e) => setExerciseSearch(e.target.value)} className={`w-full p-3 rounded-lg ${theme.input} border mb-3`} />
            <div className="flex flex-wrap gap-2 mb-4"><button onClick={() => setExerciseFilter('all')} className={`px-3 py-1 rounded-full text-sm ${exerciseFilter === 'all' ? 'bg-blue-500 text-white' : theme.cardAlt}`}>All</button>{Object.values(MOVEMENT_PATTERNS).filter(p => p.id !== 'cardio' && p.id !== 'mobility').map(pattern => (<button key={pattern.id} onClick={() => setExerciseFilter(pattern.id)} className={`px-3 py-1 rounded-full text-sm ${exerciseFilter === pattern.id ? 'bg-blue-500 text-white' : theme.cardAlt}`}>{pattern.icon} {pattern.name}</button>))}</div>
            <div className="space-y-2 max-h-[40vh] overflow-auto">{filteredExercises.map(ex => (<button key={ex.id} onClick={() => selectExercise(ex.id)} className={`w-full p-3 ${theme.card} rounded-lg text-left`}><p className={`font-medium ${theme.text}`}>{ex.name}</p><p className={`text-xs ${theme.textMuted}`}>{MOVEMENT_PATTERNS[ex.pattern]?.name} • {ex.equipment.join(', ')}</p></button>))}</div>
          </div>
        </div>
      )}

      {showSwapPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className={`${theme.bg} w-full rounded-t-2xl p-4 max-h-[70vh] overflow-auto`}>
            <div className="flex items-center justify-between mb-4"><div><h3 className={`font-bold ${theme.text}`}>Swap Exercise</h3><p className={`text-sm ${theme.textMuted}`}>Same pattern: {MOVEMENT_PATTERNS[EXERCISE_LIBRARY[showSwapPicker.currentExerciseId]?.pattern]?.name}</p></div><button onClick={() => setShowSwapPicker(null)}><X size={24} className={theme.text} /></button></div>
            <div className="space-y-2">{getExerciseSwaps(showSwapPicker.currentExerciseId).map(ex => (<button key={ex.id} onClick={() => selectSwap(ex.id)} className={`w-full p-3 ${theme.card} rounded-lg text-left`}><p className={`font-medium ${theme.text}`}>{ex.name}</p><p className={`text-xs ${theme.textMuted}`}>Equipment: {ex.equipment.join(', ')}</p></button>))}</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============== PROGRAM OVERVIEW VIEW ==============
const ProgramOverviewView = ({ programId, program, templateData, onClose, onActivate, isActive, theme }) => {
  const [expandedPhase, setExpandedPhase] = useState(null);
  const [expandedBlock, setExpandedBlock] = useState(null);

  if (!program) return null;

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const getTypeColor = (type) => {
    const colors = {
      strength: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      aerobic: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      cardio: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      conditioning: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      threshold: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      long_effort: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      recovery: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      rest: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      muscular_endurance: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  };

  // Get detours if this is a block-based template
  const availableDetours = program.availableDetours || {};
  const hasDetours = (availableDetours.specialty?.length > 0) || (availableDetours.life?.length > 0);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-auto">
      <div className={`${theme.bg} min-h-full md:min-h-0 md:max-w-2xl md:mx-auto md:my-8 md:rounded-2xl`}>
        {/* Header */}
        <div className={`sticky top-0 ${theme.card} border-b ${theme.border} p-4 flex items-center justify-between z-10`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{program.icon}</span>
            <div>
              <h2 className={`font-bold text-lg ${theme.text}`}>{program.name}</h2>
              {program.isTemplate && (
                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs rounded-full">Template</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${theme.cardAlt}`}>
            <X size={24} className={theme.text} />
          </button>
        </div>

        <div className="p-4 space-y-6 pb-24">
          {/* Description */}
          <p className={`${theme.textMuted}`}>{program.description}</p>

          {/* Global Rules if present */}
          {program.globalRules && Object.keys(program.globalRules).length > 0 && (
            <div className={`${theme.card} rounded-xl p-4`}>
              <h3 className={`font-semibold ${theme.text} mb-2`}>📋 Program Rules</h3>
              <ul className={`text-sm ${theme.textMuted} space-y-1`}>
                {program.globalRules.deload_every_4th_week && <li>• Deload every 4th week</li>}
                {program.globalRules.one_specialty_at_a_time && <li>• One specialty block at a time</li>}
                {program.globalRules.always_return_to_base && <li>• Always return to base after specialty blocks</li>}
              </ul>
            </div>
          )}

          {/* Quarterly Testing if present */}
          {program.quarterlyTesting && (
            <div className={`${theme.card} rounded-xl p-4`}>
              <h3 className={`font-semibold ${theme.text} mb-2`}>📊 Quarterly Testing</h3>
              <ul className={`text-sm ${theme.textMuted} space-y-1`}>
                {program.quarterlyTesting.tests?.map((test, i) => (
                  <li key={i}>• <span className="font-medium">{test.name}</span>: {test.protocol}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Main Phases */}
          <div>
            <h3 className={`font-semibold ${theme.text} mb-3`}>
              {hasDetours ? '🔄 Main Cycle' : '📅 Phases'}
            </h3>
            <div className="space-y-3">
              {program.phases?.map((phase, idx) => (
                <div key={phase.id} className={`${theme.card} rounded-xl overflow-hidden`}>
                  <button
                    onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        idx === 0 ? 'bg-blue-500 text-white' :
                        idx === 1 ? 'bg-green-500 text-white' :
                        idx === 2 ? 'bg-orange-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>{idx + 1}</span>
                      <div>
                        <p className={`font-semibold ${theme.text}`}>{phase.name}</p>
                        <p className={`text-sm ${theme.textMuted}`}>
                          Weeks {phase.weeks[0]}-{phase.weeks[1]} ({phase.weeks[1] - phase.weeks[0] + 1} weeks)
                        </p>
                      </div>
                    </div>
                    {expandedPhase === phase.id ? <ChevronUp size={20} className={theme.textMuted} /> : <ChevronDown size={20} className={theme.textMuted} />}
                  </button>

                  {expandedPhase === phase.id && (
                    <div className={`px-4 pb-4 border-t ${theme.border}`}>
                      {phase.description && (
                        <p className={`text-sm ${theme.textMuted} mt-3 mb-4`}>{phase.description}</p>
                      )}

                      {/* Exit Criteria */}
                      {phase.exitCriteria?.length > 0 && (
                        <div className="mb-4">
                          <p className={`text-xs font-semibold ${theme.textMuted} uppercase mb-2`}>Exit Criteria</p>
                          <ul className={`text-sm ${theme.text} space-y-1`}>
                            {phase.exitCriteria.map((c, i) => <li key={i} className="flex items-start gap-2"><Target size={14} className="text-green-500 mt-0.5 flex-shrink-0" />{c}</li>)}
                          </ul>
                        </div>
                      )}

                      {/* Weekly Template */}
                      <p className={`text-xs font-semibold ${theme.textMuted} uppercase mb-2`}>Weekly Template</p>
                      <div className="space-y-2">
                        {phase.weeklyTemplate?.map((day, i) => (
                          <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${theme.cardAlt}`}>
                            <span className={`text-xs font-medium w-12 ${theme.textMuted}`}>{dayNames[i]?.slice(0, 3)}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(day.type)}`}>
                              {day.type?.replace('_', ' ')}
                            </span>
                            <span className={`text-sm ${theme.text} flex-1`}>{day.session || day.name}</span>
                            {day.duration > 0 && <span className={`text-xs ${theme.textMuted}`}>{day.duration}m</span>}
                          </div>
                        ))}
                      </div>

                      {/* Benchmarks */}
                      {phase.benchmarks?.length > 0 && (
                        <div className="mt-4">
                          <p className={`text-xs font-semibold ${theme.textMuted} uppercase mb-2`}>Benchmarks</p>
                          <div className="flex flex-wrap gap-2">
                            {phase.benchmarks.map((b, i) => (
                              <span key={i} className={`px-2 py-1 rounded-lg text-xs ${theme.cardAlt} ${theme.text}`}>
                                {b.name}: {b.target}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Specialty Blocks */}
          {availableDetours.specialty?.length > 0 && (
            <div>
              <h3 className={`font-semibold ${theme.text} mb-3`}>⚡ Specialty Blocks</h3>
              <p className={`text-sm ${theme.textMuted} mb-3`}>Inject when specific demands arise, then return to main cycle.</p>
              <div className="space-y-3">
                {availableDetours.specialty.map(block => (
                  <div key={block.id} className={`${theme.card} rounded-xl overflow-hidden border-l-4 border-orange-500`}>
                    <button
                      onClick={() => setExpandedBlock(expandedBlock === block.id ? null : block.id)}
                      className="w-full p-4 flex items-center justify-between text-left"
                    >
                      <div>
                        <p className={`font-semibold ${theme.text}`}>{block.name}</p>
                        <p className={`text-sm ${theme.textMuted}`}>
                          {block.duration?.min}-{block.duration?.max} {block.duration?.unit}
                        </p>
                      </div>
                      {expandedBlock === block.id ? <ChevronUp size={20} className={theme.textMuted} /> : <ChevronDown size={20} className={theme.textMuted} />}
                    </button>
                    
                    {expandedBlock === block.id && (
                      <div className={`px-4 pb-4 border-t ${theme.border} space-y-3`}>
                        {block.when_to_use?.length > 0 && (
                          <div className="mt-3">
                            <p className={`text-xs font-semibold ${theme.textMuted} uppercase mb-1`}>When to Use</p>
                            <ul className={`text-sm ${theme.text}`}>
                              {block.when_to_use.map((w, i) => <li key={i}>• {w}</li>)}
                            </ul>
                          </div>
                        )}
                        {block.sacrifice?.length > 0 && (
                          <div>
                            <p className={`text-xs font-semibold text-red-500 uppercase mb-1`}>⚠️ Sacrifices</p>
                            <ul className={`text-sm text-red-600 dark:text-red-400`}>
                              {block.sacrifice.map((s, i) => <li key={i}>• {s}</li>)}
                            </ul>
                          </div>
                        )}
                        {block.exit_criteria?.length > 0 && (
                          <div>
                            <p className={`text-xs font-semibold ${theme.textMuted} uppercase mb-1`}>Exit Criteria</p>
                            <ul className={`text-sm ${theme.text}`}>
                              {block.exit_criteria.map((e, i) => <li key={i}>✓ {e}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Life Blocks */}
          {availableDetours.life?.length > 0 && (
            <div>
              <h3 className={`font-semibold ${theme.text} mb-3`}>🛡️ Life Blocks</h3>
              <p className={`text-sm ${theme.textMuted} mb-3`}>Situational responses for injuries, burnout, deployment, etc.</p>
              <div className="space-y-3">
                {availableDetours.life.map(block => (
                  <div key={block.id} className={`${theme.card} rounded-xl overflow-hidden border-l-4 border-green-500`}>
                    <button
                      onClick={() => setExpandedBlock(expandedBlock === `life_${block.id}` ? null : `life_${block.id}`)}
                      className="w-full p-4 flex items-center justify-between text-left"
                    >
                      <div>
                        <p className={`font-semibold ${theme.text}`}>{block.name}</p>
                        <p className={`text-sm ${theme.textMuted}`}>
                          {block.duration?.min}-{block.duration?.max} {block.duration?.unit}
                        </p>
                      </div>
                      {expandedBlock === `life_${block.id}` ? <ChevronUp size={20} className={theme.textMuted} /> : <ChevronDown size={20} className={theme.textMuted} />}
                    </button>
                    
                    {expandedBlock === `life_${block.id}` && (
                      <div className={`px-4 pb-4 border-t ${theme.border} space-y-3`}>
                        {block.when_to_use?.length > 0 && (
                          <div className="mt-3">
                            <p className={`text-xs font-semibold ${theme.textMuted} uppercase mb-1`}>When to Use</p>
                            <ul className={`text-sm ${theme.text}`}>
                              {block.when_to_use.map((w, i) => <li key={i}>• {w}</li>)}
                            </ul>
                          </div>
                        )}
                        {block.exit_criteria?.length > 0 && (
                          <div>
                            <p className={`text-xs font-semibold ${theme.textMuted} uppercase mb-1`}>Exit Criteria</p>
                            <ul className={`text-sm ${theme.text}`}>
                              {block.exit_criteria.map((e, i) => <li key={i}>✓ {e}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div className={`fixed bottom-0 left-0 right-0 md:relative ${theme.card} border-t ${theme.border} p-4`}>
          <div className="max-w-2xl mx-auto flex gap-3">
            <button onClick={onClose} className={`flex-1 py-3 rounded-xl font-medium ${theme.cardAlt} ${theme.text}`}>
              Close
            </button>
            {isActive ? (
              <span className="flex-1 py-3 rounded-xl font-medium text-center text-green-500 bg-green-50 dark:bg-green-900/20">
                ✓ Active
              </span>
            ) : (
              <button onClick={onActivate} className="flex-1 py-3 rounded-xl font-medium bg-blue-500 text-white hover:bg-blue-600">
                Activate Program
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============== DETOUR PICKER VIEW ==============
const DetourPickerView = ({ program, onSelect, onClose, theme }) => {
  const [expandedBlock, setExpandedBlock] = useState(null);
  
  if (!program?.availableDetours) return null;
  
  const { specialty = [], life = [] } = program.availableDetours;
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-auto">
      <div className={`${theme.bg} min-h-full md:min-h-0 md:max-w-lg md:mx-auto md:my-8 md:rounded-2xl`}>
        {/* Header */}
        <div className={`sticky top-0 ${theme.card} border-b ${theme.border} p-4 flex items-center justify-between z-10`}>
          <div>
            <h2 className={`font-bold text-lg ${theme.text}`}>Take a Detour</h2>
            <p className={`text-sm ${theme.textMuted}`}>Inject a block, then return to main cycle</p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${theme.cardAlt}`}>
            <X size={24} className={theme.text} />
          </button>
        </div>

        <div className="p-4 space-y-6 pb-8">
          {/* Specialty Blocks */}
          {specialty.length > 0 && (
            <div>
              <h3 className={`font-semibold ${theme.text} mb-3 flex items-center gap-2`}>
                <Zap size={18} className="text-orange-500" />
                Specialty Blocks
              </h3>
              <p className={`text-sm ${theme.textMuted} mb-3`}>
                Focused training when specific demands arise.
              </p>
              <div className="space-y-3">
                {specialty.map(block => (
                  <div key={block.id} className={`${theme.card} rounded-xl overflow-hidden border-l-4 border-orange-500`}>
                    <button
                      onClick={() => setExpandedBlock(expandedBlock === block.id ? null : block.id)}
                      className="w-full p-4 flex items-center justify-between text-left"
                    >
                      <div>
                        <p className={`font-semibold ${theme.text}`}>{block.name}</p>
                        <p className={`text-sm ${theme.textMuted}`}>
                          {block.duration?.min}-{block.duration?.max} {block.duration?.unit}
                        </p>
                      </div>
                      {expandedBlock === block.id ? <ChevronUp size={20} className={theme.textMuted} /> : <ChevronDown size={20} className={theme.textMuted} />}
                    </button>
                    
                    {expandedBlock === block.id && (
                      <div className={`px-4 pb-4 border-t ${theme.border} space-y-3`}>
                        {block.when_to_use?.length > 0 && (
                          <div className="mt-3">
                            <p className={`text-xs font-semibold ${theme.textMuted} uppercase mb-1`}>When to Use</p>
                            <ul className={`text-sm ${theme.text}`}>
                              {block.when_to_use.map((w, i) => <li key={i}>• {w}</li>)}
                            </ul>
                          </div>
                        )}
                        {block.sacrifice?.length > 0 && (
                          <div>
                            <p className={`text-xs font-semibold text-red-500 uppercase mb-1`}>⚠️ Sacrifices</p>
                            <ul className={`text-sm text-red-600 dark:text-red-400`}>
                              {block.sacrifice.map((s, i) => <li key={i}>• {s}</li>)}
                            </ul>
                          </div>
                        )}
                        {block.exit_criteria?.length > 0 && (
                          <div>
                            <p className={`text-xs font-semibold ${theme.textMuted} uppercase mb-1`}>Exit When</p>
                            <ul className={`text-sm ${theme.text}`}>
                              {block.exit_criteria.map((e, i) => <li key={i}>✓ {e}</li>)}
                            </ul>
                          </div>
                        )}
                        <button
                          onClick={() => onSelect(block.id, 'specialty')}
                          className="w-full mt-2 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium"
                        >
                          Start {block.name}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Life Blocks */}
          {life.length > 0 && (
            <div>
              <h3 className={`font-semibold ${theme.text} mb-3 flex items-center gap-2`}>
                <Heart size={18} className="text-green-500" />
                Life Blocks
              </h3>
              <p className={`text-sm ${theme.textMuted} mb-3`}>
                Adaptive responses for injuries, burnout, deployment, etc.
              </p>
              <div className="space-y-3">
                {life.map(block => (
                  <div key={block.id} className={`${theme.card} rounded-xl overflow-hidden border-l-4 border-green-500`}>
                    <button
                      onClick={() => setExpandedBlock(expandedBlock === `life_${block.id}` ? null : `life_${block.id}`)}
                      className="w-full p-4 flex items-center justify-between text-left"
                    >
                      <div>
                        <p className={`font-semibold ${theme.text}`}>{block.name}</p>
                        <p className={`text-sm ${theme.textMuted}`}>
                          {block.duration?.min}-{block.duration?.max} {block.duration?.unit}
                        </p>
                      </div>
                      {expandedBlock === `life_${block.id}` ? <ChevronUp size={20} className={theme.textMuted} /> : <ChevronDown size={20} className={theme.textMuted} />}
                    </button>
                    
                    {expandedBlock === `life_${block.id}` && (
                      <div className={`px-4 pb-4 border-t ${theme.border} space-y-3`}>
                        {block.when_to_use?.length > 0 && (
                          <div className="mt-3">
                            <p className={`text-xs font-semibold ${theme.textMuted} uppercase mb-1`}>When to Use</p>
                            <ul className={`text-sm ${theme.text}`}>
                              {block.when_to_use.map((w, i) => <li key={i}>• {w}</li>)}
                            </ul>
                          </div>
                        )}
                        {block.exit_criteria?.length > 0 && (
                          <div>
                            <p className={`text-xs font-semibold ${theme.textMuted} uppercase mb-1`}>Exit When</p>
                            <ul className={`text-sm ${theme.text}`}>
                              {block.exit_criteria.map((e, i) => <li key={i}>✓ {e}</li>)}
                            </ul>
                          </div>
                        )}
                        {block.notes?.length > 0 && (
                          <div>
                            <p className={`text-xs font-semibold ${theme.textMuted} uppercase mb-1`}>Notes</p>
                            <ul className={`text-sm ${theme.text}`}>
                              {block.notes.map((n, i) => <li key={i}>• {n}</li>)}
                            </ul>
                          </div>
                        )}
                        <button
                          onClick={() => onSelect(block.id, 'life')}
                          className="w-full mt-2 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium"
                        >
                          Start {block.name}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
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
  const [programTemplates, setProgramTemplates] = useLocalStorage('trainingHub_programTemplates', {});
  const [programState, setProgramState] = useLocalStorage('trainingHub_programState', { 
    currentProgram: 'combatAlpinist', 
    currentWeek: 1, 
    currentDay: 1, 
    startDate: getTodayKey(),
    // Detour tracking
    activeDetour: null, // { blockId, blockType, weekInDetour, returnToWeek, startedAt }
  });
  const [workoutLogs, setWorkoutLogs] = useLocalStorage('trainingHub_workoutLogs', []);
  const [exerciseCompletion, setExerciseCompletion] = useState({});
  const [workoutData, setWorkoutData] = useState({ duration: 0, rpe: 5, notes: '', newPRs: {} });
  const [showProgramUpload, setShowProgramUpload] = useState(false);
  const [showTemplateUpload, setShowTemplateUpload] = useState(false);
  const [viewingProgramId, setViewingProgramId] = useState(null); // For program overview
  const [showDetourPicker, setShowDetourPicker] = useState(false); // For detour selection
  
  // Offline status
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Convert uploaded templates to programs with auto-propagated values
  const templatePrograms = useMemo(() => {
    const programs = {};
    Object.entries(programTemplates).forEach(([id, templateData]) => {
      if (templateData.program) {
        programs[id] = templateData.program;
      }
    });
    return programs;
  }, [programTemplates, athleteProfile]);

  const allPrograms = { ...DEFAULT_PROGRAMS, ...templatePrograms, ...customPrograms };
  const program = allPrograms[programState.currentProgram];
  
  // Check if we're in a detour block
  const activeDetour = programState.activeDetour;
  const detourBlock = useMemo(() => {
    if (!activeDetour || !program?.availableDetours) return null;
    const { blockId, blockType } = activeDetour;
    const blocks = program.availableDetours[blockType] || [];
    return blocks.find(b => b.id === blockId);
  }, [activeDetour, program?.availableDetours]);

  // Get current phase - either from detour or main cycle
  const phase = useMemo(() => {
    if (detourBlock) {
      // In a detour - use detour block's template
      return {
        ...detourBlock,
        weeks: [1, detourBlock.duration?.max || 8], // Detours use their own week count
        weeklyTemplate: detourBlock.weeklyTemplate || []
      };
    }
    // Normal main cycle phase
    return program?.phases?.find(p => programState.currentWeek >= p.weeks[0] && programState.currentWeek <= p.weeks[1]);
  }, [detourBlock, program?.phases, programState.currentWeek]);

  // Current week number (detour week or main cycle week)
  const currentWeekNum = activeDetour ? activeDetour.weekInDetour : programState.currentWeek;
  
  // Today's readiness - MUST be defined before todayWorkout useMemo
  const todayReadiness = readiness.logs?.find(l => l.date === getTodayKey());
  const readinessScore = todayReadiness?.score;
  const readinessInfo = readinessScore ? getReadinessLabel(readinessScore) : null;

  // Generate today's workout with auto-propagated values
  const todayWorkoutRaw = phase?.weeklyTemplate?.find(w => w.day === programState.currentDay);
  const todayWorkout = useMemo(() => {
    if (!todayWorkoutRaw) return null;
    // If it's a template-based program, apply auto-propagation
    if (program?.isTemplate) {
      return generateWorkoutFromTemplate(todayWorkoutRaw, athleteProfile, currentWeekNum, readinessScore);
    }
    return todayWorkoutRaw;
  }, [todayWorkoutRaw, athleteProfile, currentWeekNum, readinessScore, program?.isTemplate]);

  // Check if program has available detours
  const hasDetours = program?.availableDetours && 
    ((program.availableDetours.specialty?.length > 0) || (program.availableDetours.life?.length > 0));

  // Start a detour
  const startDetour = (blockId, blockType) => {
    setProgramState(prev => ({
      ...prev,
      activeDetour: {
        blockId,
        blockType,
        weekInDetour: 1,
        returnToWeek: prev.currentWeek,
        returnToDay: prev.currentDay,
        startedAt: getTodayKey()
      },
      currentDay: 1 // Reset to day 1 of detour
    }));
    setShowDetourPicker(false);
  };

  // End detour and return to main cycle
  const endDetour = () => {
    if (!activeDetour) return;
    setProgramState(prev => ({
      ...prev,
      currentWeek: prev.activeDetour.returnToWeek,
      currentDay: 1, // Start fresh on return
      activeDetour: null
    }));
  };

  // Advance day (handles both main cycle and detour)
  const advanceDay = () => {
    if (activeDetour) {
      // In detour - check if we need to advance detour week
      const maxDetourWeek = detourBlock?.duration?.max || 8;
      if (programState.currentDay >= 7) {
        if (activeDetour.weekInDetour >= maxDetourWeek) {
          // Detour complete - prompt to return (but don't auto-return)
          setProgramState(prev => ({
            ...prev,
            currentDay: 1,
            activeDetour: { ...prev.activeDetour, weekInDetour: prev.activeDetour.weekInDetour + 1 }
          }));
        } else {
          setProgramState(prev => ({
            ...prev,
            currentDay: 1,
            activeDetour: { ...prev.activeDetour, weekInDetour: prev.activeDetour.weekInDetour + 1 }
          }));
        }
      } else {
        setProgramState(prev => ({ ...prev, currentDay: prev.currentDay + 1 }));
      }
    } else {
      // Normal main cycle advancement
      const maxWeek = program?.phases?.[program.phases.length - 1]?.weeks?.[1] || 40;
      if (programState.currentDay >= 7) {
        setProgramState(prev => ({ ...prev, currentDay: 1, currentWeek: Math.min(prev.currentWeek + 1, maxWeek) }));
      } else {
        setProgramState(prev => ({ ...prev, currentDay: prev.currentDay + 1 }));
      }
    }
  };

  // Handle template upload
  const handleTemplateUpload = ({ template, program, profileCheck }) => {
    setProgramTemplates(prev => ({
      ...prev,
      [template.meta.id]: {
        template,
        program,
        profileCheck,
        uploadedAt: new Date().toISOString()
      }
    }));
    setShowTemplateUpload(false);
  };

  // Delete a template
  const deleteTemplate = (templateId) => {
    setProgramTemplates(prev => {
      const updated = { ...prev };
      delete updated[templateId];
      return updated;
    });
    // If currently using this template, switch to default
    if (programState.currentProgram === templateId) {
      setProgramState(prev => ({ ...prev, currentProgram: 'combatAlpinist', currentWeek: 1, currentDay: 1 }));
    }
  };

  useEffect(() => { if (todayWorkout) setWorkoutData(prev => ({ ...prev, duration: todayWorkout.duration })); }, [todayWorkout?.session]);

  const thisWeekLogs = workoutLogs.filter(log => log.week === (activeDetour ? activeDetour.weekInDetour : programState.currentWeek) && log.programId === programState.currentProgram);
  const completedThisWeek = thisWeekLogs.filter(log => log.completed).length;
  const toggleExercise = (name) => setExerciseCompletion(prev => ({ ...prev, [name]: !prev[name] }));

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
    const newLog = { 
      id: Date.now(), 
      date: getTodayKey(), 
      week: activeDetour ? activeDetour.weekInDetour : programState.currentWeek, 
      day: programState.currentDay, 
      phase: phase?.name, 
      session: todayWorkout?.session, 
      type: todayWorkout?.type, 
      programId: programState.currentProgram, 
      prescribed: todayWorkout?.duration, 
      actual: workoutData.duration, 
      rpe: workoutData.rpe, 
      notes: workoutData.notes, 
      prsHit: workoutData.newPRs, 
      readinessScore, 
      completed: true,
      // Track if this was a detour workout
      detour: activeDetour ? { blockId: activeDetour.blockId, blockType: activeDetour.blockType } : null
    };
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

  return (
    <div className={`min-h-screen ${theme.bg}`}>
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-amber-500 text-amber-950 text-center py-1 text-sm font-medium">
          📴 Offline Mode — Data saves locally
        </div>
      )}
      
      {/* Header */}
      <header className={`${theme.header} text-white p-4 sticky top-0 z-50`}>
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⛰️</span>
            <h1 className="text-lg font-bold">Training Hub <span className="text-xs font-normal opacity-50">v2.1</span></h1>
          </div>
          <div className="flex items-center gap-2">
            {readinessScore && (
              <div className={`px-2 py-1 rounded-lg ${readinessScore >= 70 ? 'bg-green-500/20' : readinessScore >= 50 ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
                <span className={`text-sm font-bold ${getReadinessColor(readinessScore)}`}>{readinessScore}</span>
              </div>
            )}
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-slate-700 rounded-lg">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 hover:bg-slate-700 rounded-lg">{menuOpen ? <X size={24} /> : <Menu size={24} />}</button>
          </div>
        </div>
        {menuOpen && (
          <nav className={`absolute top-full left-0 right-0 ${theme.header} border-t border-slate-700 p-4 shadow-lg`}>
            <div className="max-w-2xl mx-auto flex flex-col gap-2">
              {[{ id: 'dashboard', label: 'Dashboard', icon: Home }, { id: 'readiness', label: 'Readiness Check', icon: Battery }, { id: 'workout', label: "Today's Workout", icon: Play }, { id: 'charts', label: 'Charts & Trends', icon: LineChart }, { id: 'profile', label: 'Athlete Profile', icon: User }, { id: 'benchmarks', label: 'Benchmark Tests', icon: Flag }, { id: 'log', label: 'Workout Log', icon: Calendar }, { id: 'progress', label: 'Progress & Data', icon: BarChart3 }, { id: 'programs', label: 'Programs', icon: FileUp }, { id: 'settings', label: 'Settings', icon: Settings }].map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => { setCurrentView(id); setMenuOpen(false); }} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${currentView === id ? 'bg-slate-600' : 'hover:bg-slate-700'}`}><Icon size={20} /><span>{label}</span></button>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="max-w-2xl mx-auto pb-24">
        {/* DASHBOARD */}
        {currentView === 'dashboard' && (
          <div className="p-4 space-y-4">
            {/* Active Detour Banner */}
            {activeDetour && detourBlock && (
              <div className={`p-4 rounded-xl border-2 ${activeDetour.blockType === 'specialty' ? 'border-orange-500 bg-orange-500/10' : 'border-green-500 bg-green-500/10'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs uppercase font-semibold ${activeDetour.blockType === 'specialty' ? 'text-orange-500' : 'text-green-500'}`}>
                      {activeDetour.blockType === 'specialty' ? '⚡ Specialty Block' : '🛡️ Life Block'}
                    </p>
                    <p className={`font-bold ${theme.text}`}>{detourBlock.name}</p>
                    <p className={`text-sm ${theme.textMuted}`}>Week {activeDetour.weekInDetour} of {detourBlock.duration?.max || '?'}</p>
                  </div>
                  <button 
                    onClick={endDetour}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${theme.cardAlt} ${theme.text}`}
                  >
                    End & Return
                  </button>
                </div>
                {detourBlock.exit_criteria?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-current/20">
                    <p className={`text-xs ${theme.textMuted} mb-1`}>Exit when:</p>
                    <p className={`text-sm ${theme.text}`}>{detourBlock.exit_criteria[0]}</p>
                  </div>
                )}
              </div>
            )}

            {!todayReadiness && (
              <button onClick={() => setCurrentView('readiness')} className={`w-full p-4 ${darkMode ? 'bg-amber-900/30 border-amber-700' : 'bg-amber-50 border-amber-200'} border rounded-xl flex items-center gap-3`}>
                <Battery className={darkMode ? 'text-amber-400' : 'text-amber-600'} size={24} />
                <div className="text-left flex-1"><p className={`font-medium ${theme.text}`}>Complete Readiness Check</p><p className={`text-sm ${theme.textMuted}`}>Log how you feel to optimize training</p></div>
                <ChevronRight className={theme.textMuted} />
              </button>
            )}
            {todayReadiness && (
              <div className={`${theme.card} rounded-xl shadow-sm p-4 flex items-center justify-between`}>
                <div><p className={`text-xs ${theme.textMuted} uppercase`}>Today's Readiness</p><p className={`text-2xl font-bold ${getReadinessColor(readinessScore)}`}>{readinessScore} <span className="text-sm font-normal">{readinessInfo?.text}</span></p></div>
                <button onClick={() => setCurrentView('readiness')} className={`p-2 ${theme.cardAlt} rounded-lg`}><Edit3 size={18} className={theme.textMuted} /></button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className={`${theme.card} rounded-xl shadow-sm p-4`}><p className={`text-xs ${theme.textMuted} uppercase`}>Acute (7d)</p><p className={`text-2xl font-bold ${theme.text}`}>{acuteLoad}<span className={`text-sm ${theme.textMuted} ml-1`}>min</span></p></div>
              <div className={`${theme.card} rounded-xl shadow-sm p-4`}><p className={`text-xs ${theme.textMuted} uppercase`}>A:C Ratio</p><p className={`text-2xl font-bold ${loadRatio !== '-' && loadRatio > 1.5 ? 'text-red-500' : loadRatio !== '-' && loadRatio < 0.8 ? 'text-amber-500' : 'text-green-500'}`}>{loadRatio}</p></div>
            </div>
            <button onClick={() => setCurrentView('charts')} className={`w-full ${theme.card} rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow`}>
              <div className="flex items-center gap-3">
                <LineChart size={20} className="text-blue-500" />
                <div className="text-left">
                  <p className={`font-medium ${theme.text}`}>Charts & Trends</p>
                  <p className={`text-xs ${theme.textMuted}`}>View progress visualization</p>
                </div>
              </div>
              <ChevronRight className={theme.textMuted} />
            </button>
            <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className={`text-xs ${theme.textMuted} uppercase`}>{program?.name}</p>
                  <h2 className={`text-lg font-bold ${theme.text}`}>{phase?.name} {activeDetour ? '' : 'Phase'}</h2>
                </div>
                <div className="flex items-center gap-2">
                  {/* Detour Button - only show if program has detours and not already in one */}
                  {hasDetours && !activeDetour && (
                    <button 
                      onClick={() => setShowDetourPicker(true)}
                      className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium rounded-lg"
                    >
                      Detour
                    </button>
                  )}
                  <span className="text-3xl">{program?.icon}</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className={`text-center p-2 ${theme.cardAlt} rounded-lg`}><p className={`text-xl font-bold ${theme.text}`}>{activeDetour ? activeDetour.weekInDetour : programState.currentWeek}</p><p className={`text-xs ${theme.textMuted}`}>Week</p></div>
                <div className={`text-center p-2 ${theme.cardAlt} rounded-lg`}><p className={`text-xl font-bold ${theme.text}`}>{programState.currentDay}</p><p className={`text-xs ${theme.textMuted}`}>Day</p></div>
                <div className={`text-center p-2 ${theme.cardAlt} rounded-lg`}><p className={`text-xl font-bold ${theme.text}`}>{completedThisWeek}/7</p><p className={`text-xs ${theme.textMuted}`}>Done</p></div>
                <div className={`text-center p-2 ${theme.cardAlt} rounded-lg`}><p className={`text-xl font-bold ${theme.text}`}>{workoutLogs.filter(l => l.programId === programState.currentProgram).length}</p><p className={`text-xs ${theme.textMuted}`}>Total</p></div>
              </div>
            </div>
            {todayWorkout && (
              <button onClick={() => setCurrentView('workout')} className={`w-full text-left rounded-xl shadow-sm p-5 border-l-4 ${getTypeBorder(todayWorkout.type)} ${theme.card} hover:shadow-md transition-shadow`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs ${theme.textMuted} uppercase`}>Day {programState.currentDay}</p>
                    <h3 className={`text-xl font-bold ${theme.text} mt-1`}>{todayWorkout.session}</h3>
                    <div className={`flex items-center gap-3 mt-2 text-sm ${theme.textMuted}`}>
                      <span className="flex items-center gap-1"><Clock size={14} />{todayWorkout.duration} min</span>
                      <span className={`px-2 py-0.5 rounded text-xs text-white ${getTypeColor(todayWorkout.type, darkMode)}`}>{todayWorkout.type.replace('_', ' ')}</span>
                      {todayLog?.completed && <span className="flex items-center gap-1 text-green-500"><CheckCircle2 size={14} />Done</span>}
                    </div>
                    {readinessScore && readinessScore < 55 && todayWorkout.type !== 'recovery' && <p className={`text-xs ${darkMode ? 'text-amber-400' : 'text-amber-600'} mt-2`}>⚠️ {readinessInfo?.recommendation}</p>}
                  </div>
                  <ChevronRight size={24} className={theme.textMuted} />
                </div>
              </button>
            )}
            <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
              <h3 className={`font-semibold ${theme.text} mb-3`}>This Week</h3>
              <div className="space-y-2">
                {phase?.weeklyTemplate?.map((w, idx) => {
                  const isCurrent = w.day === programState.currentDay;
                  const logged = thisWeekLogs.find(l => l.day === w.day && l.completed);
                  return (
                    <div key={idx} className={`flex items-center gap-3 p-2 rounded-lg ${isCurrent ? (darkMode ? 'bg-blue-900/40 border border-blue-700' : 'bg-blue-50 border border-blue-200') : theme.cardAlt}`}>
                      {logged ? <CheckCircle2 size={18} className="text-green-500" /> : <Circle size={18} className={theme.textSubtle} />}
                      <span className={`flex-1 text-sm font-medium ${theme.text} truncate`}>{w.session || w.name}</span>
                      <span className={`text-xs ${theme.textMuted}`}>D{w.day}</span>
                      <span className={`text-xs ${theme.textMuted}`}>{w.duration || 0}m</span>
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

        {/* CHARTS VIEW */}
        {currentView === 'charts' && <ChartsView workoutLogs={workoutLogs} benchmarkResults={benchmarkResults} readiness={readiness} athleteProfile={athleteProfile} theme={theme} darkMode={darkMode} />}

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
              <div className="flex gap-2">
                <button onClick={() => setShowTemplateUpload(true)} className="flex items-center gap-2 px-3 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-sm font-medium text-white"><Library size={16} />Template</button>
                <button onClick={() => setCurrentView('programBuilder')} className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-sm font-medium text-white"><Plus size={16} />Build</button>
              </div>
            </div>

            {/* Template Programs Section */}
            {Object.keys(programTemplates).length > 0 && (
              <div className="space-y-3">
                <h3 className={`text-sm font-semibold ${theme.textMuted} uppercase tracking-wide`}>Templates</h3>
                {Object.entries(programTemplates).map(([id, data]) => (
                  <div key={id} className={`${theme.card} rounded-xl shadow-sm p-4 border-l-4 border-purple-500 ${programState.currentProgram === id ? 'ring-2 ring-blue-500' : ''}`}>
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{data.program?.icon || '📋'}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`font-semibold ${theme.text}`}>{data.program?.name}</p>
                          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs rounded-full">Template</span>
                        </div>
                        <p className={`text-sm ${theme.textMuted} mt-1`}>{data.program?.description}</p>
                        {data.profileCheck && !data.profileCheck.complete && (
                          <p className="text-xs text-orange-500 mt-1">⚠️ Profile {data.profileCheck.percentComplete}% complete</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => setViewingProgramId(id)} className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium">View</button>
                      {programState.currentProgram === id ? (
                        <span className="flex-1 text-center py-2 text-green-500 font-medium text-sm">Active</span>
                      ) : (
                        <button onClick={() => setProgramState(prev => ({ ...prev, currentProgram: id, currentWeek: 1, currentDay: 1 }))} className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium">Activate</button>
                      )}
                      <button onClick={() => { if (confirm(`Delete template "${data.program?.name}"?`)) deleteTemplate(id); }} className="px-3 py-2 bg-red-500/10 text-red-500 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Built-in & Custom Programs Section */}
            <div className="space-y-3">
              <h3 className={`text-sm font-semibold ${theme.textMuted} uppercase tracking-wide`}>Programs</h3>
              {Object.values({ ...DEFAULT_PROGRAMS, ...customPrograms }).map(prog => (
                <div key={prog.id} className={`${theme.card} rounded-xl shadow-sm p-4 ${programState.currentProgram === prog.id ? 'ring-2 ring-blue-500' : ''}`}>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{prog.icon}</span>
                    <div className="flex-1">
                      <p className={`font-semibold ${theme.text}`}>{prog.name}</p>
                      <p className={`text-sm ${theme.textMuted} mt-1`}>{prog.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => setViewingProgramId(prog.id)} className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium">View</button>
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

        {/* PROGRAM BUILDER VIEW */}
        {currentView === 'programBuilder' && (
          <div>
            <div className="p-4 border-b ${theme.border}">
              <button onClick={() => setCurrentView('programs')} className={`flex items-center gap-2 ${theme.textMuted}`}>
                <ChevronLeft size={20} /> Back to Programs
              </button>
            </div>
            <ProgramBuilderView
              customPrograms={customPrograms}
              setCustomPrograms={setCustomPrograms}
              athleteProfile={athleteProfile}
              theme={theme}
              darkMode={darkMode}
            />
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

      {/* Template Upload Modal */}
      {showTemplateUpload && (
        <TemplateUploadView
          onUpload={handleTemplateUpload}
          onClose={() => setShowTemplateUpload(false)}
          athleteProfile={athleteProfile}
          existingTemplates={programTemplates}
          theme={theme}
        />
      )}

      {/* Program Overview Modal */}
      {viewingProgramId && (
        <ProgramOverviewView
          programId={viewingProgramId}
          program={allPrograms[viewingProgramId]}
          templateData={programTemplates[viewingProgramId]}
          onClose={() => setViewingProgramId(null)}
          onActivate={() => {
            setProgramState(prev => ({ ...prev, currentProgram: viewingProgramId, currentWeek: 1, currentDay: 1 }));
            setViewingProgramId(null);
          }}
          isActive={programState.currentProgram === viewingProgramId}
          theme={theme}
        />
      )}

      {/* Detour Picker Modal */}
      {showDetourPicker && (
        <DetourPickerView
          program={program}
          onSelect={startDetour}
          onClose={() => setShowDetourPicker(false)}
          theme={theme}
        />
      )}

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
// Build 1769743122
