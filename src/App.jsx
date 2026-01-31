import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Calendar, Dumbbell, TrendingUp, CheckCircle2, Circle, ChevronRight,
  ChevronLeft, Play, Clock, Flame, Menu, X, Download, Upload,
  Settings, Activity, Mountain, Home, BarChart3, Trash2, Moon, Sun,
  Plus, FileUp, User, Target, Zap, Award, Timer, Heart, Scale,
  ChevronDown, ChevronUp, Edit3, Save, X as XIcon, AlertTriangle,
  Battery, BatteryLow, BatteryMedium, BatteryFull, Bed, Brain,
  TrendingDown, Minus, ArrowRight, Flag, PlayCircle, StopCircle,
  RotateCcw, Info, LineChart, Hammer, Copy, RefreshCw, FileText, Library,
  Cloud, CloudOff, Loader, GitBranch, Key, Fingerprint, LogOut, UserCircle, Sparkles,
  Check
} from 'lucide-react';
import { TemplateUploadView } from './TemplateUpload';
import { useSyncedStorage, useSyncStatus, loadFromCloud, syncAllToCloud, loadWithSyncCode, getCurrentDeviceId, setSyncCode } from './useCloudSync';
import { useAuth, isBiometricAvailable, getSavedProfile } from './useAuth';
import {
  generateWorkoutFromTemplate,
  templateToProgram,
  checkRequiredFields,
  getValidSubstitutes,
  EXERCISE_LIBRARY as TEMPLATE_EXERCISE_LIBRARY
} from './TemplateEngine';

// Import high-altitude themed visualization components
import {
  ReadinessGauge,
  TrainingLoadCard,
  LoadZoneMeter,
  HRZoneViz,
  ReadinessHeatmap
} from './components';

// Import extracted data modules
import {
  MOVEMENT_PATTERNS,
  EQUIPMENT_TYPES,
  EXERCISE_LIBRARY,
  PHASE_CATEGORY_RECOMMENDATIONS,
  DEFAULT_ATHLETE_PROFILE,
  DEFAULT_READINESS,
  PR_DISPLAY_NAMES,
  BENCHMARK_DISPLAY_NAMES,
  BENCHMARK_TESTS,
  PROGRESSION_MODELS,
  MESO_TEMPLATES,
  CARDIO_ZONES,
  CARDIO_SESSION_TEMPLATES,
  calculateZones,
  calculateLoadTargets,
  UNIVERSAL_DETOURS,
  isModelCompatibleWithTrack,
  getCompatibleModels,
  calculateWeekValues,
  applyRepShift,
  generateBlockPhases,
} from './data';

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

// DEFAULT_ATHLETE_PROFILE - imported from ./data
// DEFAULT_READINESS - imported from ./data

// BENCHMARK_TESTS - imported from ./data

// ============== UTILITY FUNCTIONS ==============
// Parse YYYY-MM-DD string as local date (not UTC) to avoid timezone rollback issues
// e.g., "2025-01-31" should be Jan 31 local time, not Dec 31 in PST
const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
const formatDateShort = (dateStr) => {
  if (!dateStr) return '-';
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
// Use local timezone for date key (YYYY-MM-DD format)
const getTodayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

// calculateZones, calculateLoadTargets - imported from ./data

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

// ============== TRAINING LOAD SYSTEM ==============
// Type multipliers for training stress calculation
const LOAD_TYPE_MULTIPLIERS = {
  strength: 1.2,        // High CNS load
  threshold: 1.3,       // High cardiovascular stress
  muscular_endurance: 1.3,
  long_effort: 0.8,     // Volume but lower intensity
  long_aerobic: 0.8,
  cardio: 0.6,          // Easy/moderate cardio
  aerobic: 0.6,
  recovery: 0.3,        // Active recovery
  rest: 0,
};

// Calculate load for a single workout
const calculateWorkoutLoad = (workout) => {
  if (!workout || !workout.completed) return 0;
  
  const duration = workout.actual || workout.duration || workout.actualDuration || 60;
  const rpe = workout.rpe || 5;
  const type = workout.type || 'cardio';
  const typeMultiplier = LOAD_TYPE_MULTIPLIERS[type] || 0.7;
  
  // Load = Duration × RPE × Type Multiplier
  // Normalized so a 60-min moderate (RPE 5) strength session = ~360 load
  return Math.round(duration * rpe * typeMultiplier);
};

// Calculate Acute Training Load (ATL) - 7 day rolling sum
const calculateATL = (workoutLogs, asOfDate = new Date()) => {
  const cutoff = new Date(asOfDate);
  cutoff.setDate(cutoff.getDate() - 7);
  
  const recentLogs = workoutLogs.filter(log => {
    const logDate = new Date(log.date);
    return logDate >= cutoff && logDate <= asOfDate && log.completed;
  });
  
  return recentLogs.reduce((sum, log) => sum + calculateWorkoutLoad(log), 0);
};

// Calculate Chronic Training Load (CTL) - 28 day rolling average (per day)
const calculateCTL = (workoutLogs, asOfDate = new Date()) => {
  const cutoff = new Date(asOfDate);
  cutoff.setDate(cutoff.getDate() - 28);
  
  const monthLogs = workoutLogs.filter(log => {
    const logDate = new Date(log.date);
    return logDate >= cutoff && logDate <= asOfDate && log.completed;
  });
  
  const totalLoad = monthLogs.reduce((sum, log) => sum + calculateWorkoutLoad(log), 0);
  return Math.round(totalLoad / 28); // Average per day
};

// Calculate Acute:Chronic Ratio (ACR)
const calculateACR = (workoutLogs, asOfDate = new Date()) => {
  const atl = calculateATL(workoutLogs, asOfDate);
  const ctl = calculateCTL(workoutLogs, asOfDate);
  
  if (ctl === 0) return atl > 0 ? 2.0 : 1.0; // No baseline yet
  
  // ATL is 7-day sum, CTL is daily average, so normalize ATL to daily
  const atlDaily = atl / 7;
  return Number((atlDaily / ctl).toFixed(2));
};

// Get training load status and recommendations
const getLoadStatus = (acr, atl, ctl) => {
  // Check if we have enough data
  if (ctl < 50) {
    return {
      zone: 'building',
      color: 'blue',
      label: 'Building Baseline',
      description: 'Not enough training history yet. Keep logging workouts.',
      recommendation: 'Continue training as programmed',
      icon: '📊'
    };
  }
  
  if (acr < 0.8) {
    return {
      zone: 'detraining',
      color: 'yellow',
      label: 'Detraining Risk',
      description: 'Training load dropping. You may be losing fitness.',
      recommendation: 'Increase training volume or intensity if recovered',
      icon: '📉'
    };
  }
  
  if (acr <= 1.3) {
    return {
      zone: 'optimal',
      color: 'green',
      label: 'Optimal Zone',
      description: 'Training load is balanced. Good adaptation stimulus.',
      recommendation: 'Continue as planned. You\'re in the sweet spot.',
      icon: '✅'
    };
  }
  
  if (acr <= 1.5) {
    return {
      zone: 'caution',
      color: 'orange',
      label: 'Caution',
      description: 'Ramping up quickly. Monitor recovery closely.',
      recommendation: 'Consider an easier day soon. Watch for fatigue signs.',
      icon: '⚠️'
    };
  }
  
  return {
    zone: 'danger',
    color: 'red',
    label: 'Overreach Warning',
    description: 'High injury/burnout risk. Acute load far exceeds chronic.',
    recommendation: 'Strongly recommend recovery day. Reduce intensity.',
    icon: '🚨'
  };
};

// Calculate load-adjusted readiness (combines subjective readiness with objective load)
const calculateLoadAdjustedReadiness = (baseReadiness, acr, loadStatus) => {
  if (!baseReadiness) return null;
  
  let adjustment = 0;
  
  // Penalize high ACR
  if (acr > 1.5) adjustment -= 15;
  else if (acr > 1.3) adjustment -= 8;
  else if (acr < 0.8) adjustment += 5; // Slight boost if undertrained
  
  // Factor in load zone
  if (loadStatus.zone === 'danger') adjustment -= 10;
  else if (loadStatus.zone === 'caution') adjustment -= 5;
  
  return Math.max(0, Math.min(100, baseReadiness + adjustment));
};

// Get historical load data for charting
const getLoadHistory = (workoutLogs, days = 28) => {
  const history = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    
    const dayLog = workoutLogs.find(l => l.date === dateKey && l.completed);
    const dayLoad = dayLog ? calculateWorkoutLoad(dayLog) : 0;
    
    history.push({
      date: dateKey,
      load: dayLoad,
      atl: calculateATL(workoutLogs, date),
      ctl: calculateCTL(workoutLogs, date),
      acr: calculateACR(workoutLogs, date)
    });
  }
  
  return history;
};

// PR_DISPLAY_NAMES, BENCHMARK_DISPLAY_NAMES - imported from ./data

// ============== PROGRESSION ANALYSIS SYSTEM ==============
const analyzeProgressionForExercise = (exerciseName, workoutLogs, profile, weeks = 4) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - (weeks * 7));
  
  // Normalize name for matching
  const normalizeForMatch = (name) => {
    if (!name) return '';
    return name.toLowerCase().replace(/weighted\s*/i, '').replace(/[-\s]+/g, '_').trim();
  };
  const normalizedName = normalizeForMatch(exerciseName);
  
  // Find all instances of this exercise
  const exerciseInstances = workoutLogs
    .filter(log => log.completed && log.exerciseData && new Date(log.date) >= cutoffDate)
    .flatMap(log => 
      (log.exerciseData || [])
        .filter(ex => normalizeForMatch(ex.name) === normalizedName)
        .map(ex => ({
          ...ex,
          date: log.date,
          sessionRpe: log.rpe,
          sessionNotes: log.notes
        }))
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  
  if (exerciseInstances.length < 3) {
    return { recommendation: null, reason: 'Not enough data', instances: exerciseInstances.length };
  }
  
  // Analyze patterns
  const completedCount = exerciseInstances.filter(ex => ex.completed).length;
  const completionRate = completedCount / exerciseInstances.length;
  const avgRpe = exerciseInstances.reduce((sum, ex) => sum + (ex.sessionRpe || 5), 0) / exerciseInstances.length;
  const weights = exerciseInstances.filter(ex => ex.weight).map(ex => ex.weight);
  const latestWeight = weights.length > 0 ? weights[weights.length - 1] : null;
  const avgWeight = weights.length > 0 ? Math.round(weights.reduce((a, b) => a + b, 0) / weights.length) : null;
  
  // Check for PR key and current PR
  const prKey = exerciseInstances[0]?.prKey;
  const currentPR = prKey ? profile.prs?.[prKey]?.value : null;
  
  // Generate recommendation
  let recommendation = null;
  let confidence = 'medium';
  let suggestedAction = null;
  
  if (completionRate >= 0.9 && avgRpe <= 7) {
    // Crushing it - ready to progress
    recommendation = 'increase';
    confidence = avgRpe <= 6 ? 'high' : 'medium';
    if (currentPR && latestWeight) {
      // Suggest 2.5-5% increase
      const increase = avgRpe <= 6 ? 0.05 : 0.025;
      suggestedAction = {
        type: 'increase_percentage',
        amount: Math.round(increase * 100),
        newWeight: Math.round(latestWeight * (1 + increase))
      };
    }
  } else if (completionRate < 0.7 || avgRpe >= 9) {
    // Struggling - suggest regression
    recommendation = 'decrease';
    confidence = avgRpe >= 9.5 ? 'high' : 'medium';
    if (latestWeight) {
      suggestedAction = {
        type: 'decrease_percentage',
        amount: 5,
        newWeight: Math.round(latestWeight * 0.95)
      };
    }
  } else if (completionRate >= 0.8 && avgRpe >= 7.5 && avgRpe <= 8.5) {
    // Good challenge level - hold steady
    recommendation = 'maintain';
    confidence = 'high';
  }
  
  return {
    recommendation,
    confidence,
    suggestedAction,
    stats: {
      instances: exerciseInstances.length,
      completionRate: Math.round(completionRate * 100),
      avgRpe: avgRpe.toFixed(1),
      latestWeight,
      avgWeight,
      currentPR
    }
  };
};

const analyzeAllProgressions = (workoutLogs, profile, todayExercises = []) => {
  const analyses = [];
  
  // Analyze exercises from today's workout that have PR keys
  todayExercises.forEach(ex => {
    if (ex.prKey) {
      const analysis = analyzeProgressionForExercise(ex.name, workoutLogs, profile);
      if (analysis.recommendation) {
        analyses.push({
          exerciseName: ex.name,
          prKey: ex.prKey,
          ...analysis
        });
      }
    }
  });
  
  return analyses;
};

// ============== LIMITING FACTORS ANALYSIS ==============
const analyzeLimitingFactors = (workoutLogs, benchmarkResults, readiness, athleteProfile) => {
  const factors = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. SLEEP ANALYSIS
  const recentReadiness = (readiness.logs || []).filter(l => new Date(l.date) >= thirtyDaysAgo);
  if (recentReadiness.length >= 7) {
    const avgSleep = recentReadiness.reduce((sum, l) => sum + (l.sleepHours || 0), 0) / recentReadiness.length;
    const avgSleepQuality = recentReadiness.reduce((sum, l) => sum + (l.sleepQuality || 3), 0) / recentReadiness.length;

    if (avgSleep < 6.5) {
      factors.push({
        id: 'sleep_duration',
        category: 'recovery',
        severity: avgSleep < 6 ? 'high' : 'medium',
        icon: '😴',
        title: 'Sleep Duration',
        metric: `${avgSleep.toFixed(1)} hrs avg`,
        target: '7+ hrs',
        insight: `Averaging ${avgSleep.toFixed(1)} hours. Sleep is the #1 recovery factor.`,
        action: 'Prioritize 7+ hours nightly. This alone could unlock gains.'
      });
    }
    if (avgSleepQuality < 3) {
      factors.push({
        id: 'sleep_quality',
        category: 'recovery',
        severity: 'medium',
        icon: '🛏️',
        title: 'Sleep Quality',
        metric: `${avgSleepQuality.toFixed(1)}/5 avg`,
        target: '4+/5',
        insight: 'Poor sleep quality limits recovery even with adequate hours.',
        action: 'Address sleep hygiene: dark room, consistent schedule, no screens before bed.'
      });
    }
  }

  // 2. TRAINING CONSISTENCY
  const recentLogs = workoutLogs.filter(l => new Date(l.date) >= thirtyDaysAgo && l.completed);
  const workoutsPerWeek = (recentLogs.length / 4.3).toFixed(1);
  const skippedDays = workoutLogs.filter(l => new Date(l.date) >= thirtyDaysAgo && !l.completed).length;

  if (parseFloat(workoutsPerWeek) < 4) {
    factors.push({
      id: 'consistency',
      category: 'training',
      severity: parseFloat(workoutsPerWeek) < 3 ? 'high' : 'medium',
      icon: '📅',
      title: 'Training Consistency',
      metric: `${workoutsPerWeek} sessions/week`,
      target: '5-6 sessions/week',
      insight: 'Consistency beats intensity. You may be leaving gains on the table.',
      action: 'Aim for 5-6 sessions/week. Even short sessions count.'
    });
  }

  // 3. BENCHMARK STALENESS
  const benchmarkChecks = [
    { key: 'fiveMile', name: '5-Mile Run', months: 2 },
    { key: 'aetDrift', name: 'AeT Drift Test', months: 2 },
    { key: 'strengthTest', name: 'Strength Test', months: 3 },
  ];

  benchmarkChecks.forEach(({ key, name, months }) => {
    const results = benchmarkResults[key] || [];
    const lastTest = results[results.length - 1];
    if (lastTest) {
      const testDate = new Date(lastTest.date);
      const daysSince = Math.floor((now - testDate) / (1000 * 60 * 60 * 24));
      if (daysSince > months * 30) {
        factors.push({
          id: `stale_${key}`,
          category: 'testing',
          severity: 'low',
          icon: '🧪',
          title: `${name} Overdue`,
          metric: `${daysSince} days ago`,
          target: `Every ${months} months`,
          insight: `Last tested ${Math.floor(daysSince / 30)} months ago. Time to retest.`,
          action: `Schedule a ${name} to track progress.`
        });
      }
    }
  });

  // 4. AEROBIC BASE (if we have AeT drift data)
  const aetResults = benchmarkResults.aetDrift || [];
  if (aetResults.length > 0) {
    const lastDrift = aetResults[aetResults.length - 1];
    const drift = parseFloat(lastDrift.drift);
    if (drift > 5) {
      factors.push({
        id: 'aerobic_base',
        category: 'fitness',
        severity: drift > 10 ? 'high' : 'medium',
        icon: '❤️',
        title: 'Aerobic Base',
        metric: `${drift.toFixed(1)}% drift`,
        target: '<5% drift',
        insight: 'High cardiac drift indicates weak aerobic base. This limits all endurance work.',
        action: 'More Zone 2. Less intensity until drift improves.'
      });
    }
  }

  // 5. STRENGTH BALANCE (check if any PR is lagging)
  const prs = athleteProfile.prs || {};
  const prEntries = Object.entries(prs).filter(([k, v]) => v?.value);
  if (prEntries.length >= 3) {
    // Check for stale PRs (no improvement in 3+ months)
    prEntries.forEach(([key, data]) => {
      if (data.date) {
        const prDate = new Date(data.date);
        const daysSince = Math.floor((now - prDate) / (1000 * 60 * 60 * 24));
        if (daysSince > 90) {
          const prName = {
            trapBarDeadlift: 'Trap Bar Deadlift',
            backSquat: 'Back Squat',
            benchPress: 'Bench Press',
            overheadPress: 'Overhead Press',
            weightedPullUp: 'Weighted Pull-Up',
          }[key] || key;
          factors.push({
            id: `stale_pr_${key}`,
            category: 'strength',
            severity: 'low',
            icon: '🏋️',
            title: `${prName} Plateau`,
            metric: `${data.value} lbs (${Math.floor(daysSince / 30)}mo ago)`,
            target: 'Progressive overload',
            insight: `No PR improvement in ${Math.floor(daysSince / 30)} months.`,
            action: 'Consider a strength emphasis block or technique work.'
          });
        }
      }
    });
  }

  // 6. READINESS TREND
  if (recentReadiness.length >= 14) {
    const firstHalf = recentReadiness.slice(0, Math.floor(recentReadiness.length / 2));
    const secondHalf = recentReadiness.slice(Math.floor(recentReadiness.length / 2));
    const avgFirst = firstHalf.reduce((s, l) => s + (l.score || 50), 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((s, l) => s + (l.score || 50), 0) / secondHalf.length;

    if (avgSecond < avgFirst - 10) {
      factors.push({
        id: 'readiness_declining',
        category: 'recovery',
        severity: 'medium',
        icon: '📉',
        title: 'Readiness Declining',
        metric: `${avgSecond.toFixed(0)} avg (was ${avgFirst.toFixed(0)})`,
        target: 'Stable or improving',
        insight: 'Your readiness scores are trending down. Fatigue accumulating.',
        action: 'Consider a deload week or extra recovery day.'
      });
    }
  }

  // Sort by severity
  const severityOrder = { high: 0, medium: 1, low: 2 };
  factors.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return factors;
};

// ============== PROGRESSION LOGIC WITH MEMORY ==============
const analyzeProgressionOpportunities = (workoutLogs, athleteProfile) => {
  const opportunities = [];
  const now = new Date();
  const sixWeeksAgo = new Date(now);
  sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);

  // Get all logs from the last 6 weeks with exercise data
  const recentLogs = workoutLogs.filter(l =>
    new Date(l.date) >= sixWeeksAgo &&
    l.completed &&
    l.exerciseData?.length > 0
  );

  if (recentLogs.length < 3) return opportunities;

  // Build exercise history map: { exerciseName: [{ date, weight, rpe, sets, reps }] }
  const exerciseHistory = {};

  recentLogs.forEach(log => {
    log.exerciseData?.forEach(ex => {
      if (!ex.completed) return;

      const key = ex.swappedTo || ex.name;
      if (!exerciseHistory[key]) exerciseHistory[key] = [];

      // Get actual performance from set data if available
      const setData = ex.setData || [];
      const completedSets = setData.filter(s => s.completed);

      if (completedSets.length > 0) {
        // Use actual logged data
        const avgWeight = completedSets
          .filter(s => s.actualWeight)
          .reduce((sum, s, _, arr) => sum + s.actualWeight / arr.length, 0);
        const avgRpe = completedSets
          .filter(s => s.rpe)
          .reduce((sum, s, _, arr) => sum + s.rpe / arr.length, 0);

        if (avgWeight > 0) {
          exerciseHistory[key].push({
            date: log.date,
            weight: avgWeight,
            rpe: avgRpe || log.rpe || 7,
            sets: completedSets.length,
            reps: ex.reps,
            prKey: ex.prKey
          });
        }
      } else if (ex.weight) {
        // Fallback to prescribed weight
        exerciseHistory[key].push({
          date: log.date,
          weight: ex.weight,
          rpe: log.rpe || 7,
          sets: parseInt(ex.sets) || 3,
          reps: ex.reps,
          prKey: ex.prKey
        });
      }
    });
  });

  // Analyze each exercise for progression opportunities
  Object.entries(exerciseHistory).forEach(([exerciseName, history]) => {
    if (history.length < 2) return;

    // Sort by date
    history.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Get recent sessions (last 3-4)
    const recent = history.slice(-4);
    if (recent.length < 2) return;

    // Check for consistent weight with low RPE (ready to progress)
    const weights = recent.map(h => h.weight);
    const rpes = recent.map(h => h.rpe);
    const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
    const avgRpe = rpes.filter(r => r > 0).reduce((a, b, _, arr) => a + b / arr.length, 0);
    const weightVariance = Math.max(...weights) - Math.min(...weights);
    const isConsistent = weightVariance < avgWeight * 0.05; // Less than 5% variance

    // Pattern: Same weight, RPE consistently low = ready to progress
    if (isConsistent && avgRpe > 0 && avgRpe <= 7 && recent.length >= 3) {
      const prKey = recent[0].prKey;
      const currentPR = prKey ? athleteProfile.prs?.[prKey]?.value : null;
      const percentOfPR = currentPR ? Math.round((avgWeight / currentPR) * 100) : null;

      opportunities.push({
        type: 'ready_to_progress',
        priority: 'high',
        icon: '📈',
        exercise: exerciseName,
        message: `${recent.length} sessions at ${Math.round(avgWeight)} lbs, RPE ${avgRpe.toFixed(1)}. Ready to add weight.`,
        recommendation: `Try ${Math.round(avgWeight * 1.025)} lbs (+2.5%) next session.`,
        metric: percentOfPR ? `Currently ${percentOfPR}% of 1RM` : null,
        data: { avgWeight, avgRpe, sessions: recent.length }
      });
    }

    // Pattern: High RPE or declining performance = consider deload
    if (avgRpe >= 9 && recent.length >= 2) {
      opportunities.push({
        type: 'high_fatigue',
        priority: 'medium',
        icon: '⚠️',
        exercise: exerciseName,
        message: `RPE averaging ${avgRpe.toFixed(1)} - grinding through sets.`,
        recommendation: 'Consider a 10% deload or extra rest day.',
        data: { avgWeight, avgRpe, sessions: recent.length }
      });
    }

    // Pattern: Weight increasing, RPE stable = good progression
    if (history.length >= 4) {
      const firstHalf = history.slice(0, Math.floor(history.length / 2));
      const secondHalf = history.slice(Math.floor(history.length / 2));
      const avgFirst = firstHalf.reduce((s, h) => s + h.weight, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((s, h) => s + h.weight, 0) / secondHalf.length;
      const rpeFirst = firstHalf.filter(h => h.rpe > 0).reduce((s, h, _, a) => s + h.rpe / a.length, 0);
      const rpeSecond = secondHalf.filter(h => h.rpe > 0).reduce((s, h, _, a) => s + h.rpe / a.length, 0);

      const weightIncrease = ((avgSecond - avgFirst) / avgFirst) * 100;

      if (weightIncrease > 5 && Math.abs(rpeSecond - rpeFirst) < 1) {
        opportunities.push({
          type: 'progressing_well',
          priority: 'low',
          icon: '✅',
          exercise: exerciseName,
          message: `+${weightIncrease.toFixed(0)}% over last ${history.length} sessions with stable effort.`,
          recommendation: 'Keep current approach - it\'s working.',
          data: { weightIncrease, avgRpe: rpeSecond }
        });
      }

      // Plateau detection
      if (weightIncrease < 2 && history.length >= 4) {
        const weekSpan = Math.round((new Date(history[history.length - 1].date) - new Date(history[0].date)) / (7 * 24 * 60 * 60 * 1000));
        if (weekSpan >= 3) {
          opportunities.push({
            type: 'plateau',
            priority: 'medium',
            icon: '🔄',
            exercise: exerciseName,
            message: `Same weight for ${weekSpan} weeks.`,
            recommendation: 'Try: rep PR, pause reps, tempo change, or exercise variation.',
            data: { weekSpan, avgWeight: avgSecond }
          });
        }
      }
    }
  });

  // Sort: high priority first, then medium, then low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  opportunities.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Limit to top actionable items
  return opportunities.slice(0, 5);
};

// MOVEMENT_PATTERNS, EQUIPMENT_TYPES, EXERCISE_LIBRARY - imported from ./data

// UNIVERSAL_DETOURS - imported from ./data

// PROGRESSION_MODELS - imported from ./data

// CARDIO_ZONES, CARDIO_SESSION_TEMPLATES, MESO_TEMPLATES - imported from ./data

// Helper to get exercise swaps by movement pattern (uses merged library with custom exercises)
const getExerciseSwaps = (exerciseId, customExercises = {}) => {
  const allExercises = { ...EXERCISE_LIBRARY, ...customExercises };
  const exercise = allExercises[exerciseId];
  if (!exercise) return [];
  return Object.values(allExercises)
    .filter(e => e.pattern === exercise.pattern && e.id !== exerciseId)
    .sort((a, b) => a.name.localeCompare(b.name));
};

// Get merged exercise library (built-in + custom)
const getMergedExerciseLibrary = (customExercises = {}) => {
  return { ...EXERCISE_LIBRARY, ...customExercises };
};

// ============== SMART SUBSTITUTION SYSTEM ==============
// Load adjustment factors when swapping between exercise types
const SWAP_LOAD_ADJUSTMENTS = {
  // When going FROM barbell TO other equipment
  barbell: { dumbbell: 0.40, kettlebell: 0.35, machine: 0.85, cable: 0.70, bodyweight: null },
  // When going FROM dumbbell TO other equipment (per hand → total)
  dumbbell: { barbell: 2.2, kettlebell: 0.85, machine: 1.8, cable: 1.5, bodyweight: null },
  // When going FROM machine TO other equipment
  machine: { barbell: 0.70, dumbbell: 0.35, kettlebell: 0.30, cable: 0.80, bodyweight: null },
  // Kettlebell to others
  kettlebell: { barbell: 2.5, dumbbell: 1.15, machine: 2.2, cable: 1.8, bodyweight: null },
  // Cable to others
  cable: { barbell: 1.3, dumbbell: 0.60, machine: 1.2, kettlebell: 0.55, bodyweight: null },
};

// Get smart substitutions with scoring
const getSmartSubstitutions = (originalExercise, customExercises = {}, availableEquipment = [], workoutLogs = []) => {
  const allExercises = { ...EXERCISE_LIBRARY, ...customExercises };

  // Find exercises with same movement pattern
  const alternatives = Object.values(allExercises)
    .filter(ex => ex.pattern === originalExercise.pattern && ex.id !== originalExercise.id);

  // Build recently used map from workout history (last 60 days)
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const recentUsage = {};

  workoutLogs
    .filter(log => new Date(log.date) >= sixtyDaysAgo && log.exerciseData)
    .forEach(log => {
      log.exerciseData.forEach(ex => {
        const name = ex.swappedTo || ex.name;
        // Find matching exercise ID
        const matchingEx = Object.values(allExercises).find(e =>
          e.name === name || e.id === name
        );
        if (matchingEx) {
          recentUsage[matchingEx.id] = (recentUsage[matchingEx.id] || 0) + 1;
        }
      });
    });

  // Score and categorize alternatives
  const scored = alternatives.map(ex => {
    let score = 0;
    const flags = [];

    // Check equipment availability
    const requiredEquipment = ex.equipment || [];
    const hasAllEquipment = requiredEquipment.every(eq =>
      availableEquipment.includes(eq) || eq === 'bodyweight' || eq === 'none'
    );
    const missingEquipment = requiredEquipment.filter(eq =>
      !availableEquipment.includes(eq) && eq !== 'bodyweight' && eq !== 'none'
    );

    if (hasAllEquipment) {
      score += 50;
      flags.push('available');
    } else {
      flags.push('missing_equipment');
    }

    // Bonus for recently used (user is familiar with it)
    if (recentUsage[ex.id]) {
      score += Math.min(recentUsage[ex.id] * 10, 30);
      flags.push('recently_used');
    }

    // Bonus for having PR tracking (can use percentage-based loading)
    if (ex.prKey) {
      score += 15;
      flags.push('has_pr');
    }

    // Bonus for similar equipment type (easier load translation)
    const originalEquip = originalExercise.equipment?.[0];
    const newEquip = ex.equipment?.[0];
    if (originalEquip && newEquip && originalEquip === newEquip) {
      score += 20;
      flags.push('same_equipment');
    }

    // Calculate load adjustment factor
    let loadAdjustment = null;
    if (originalEquip && newEquip && SWAP_LOAD_ADJUSTMENTS[originalEquip]?.[newEquip]) {
      loadAdjustment = SWAP_LOAD_ADJUSTMENTS[originalEquip][newEquip];
    }

    return {
      ...ex,
      score,
      flags,
      missingEquipment,
      hasAllEquipment,
      recentUsageCount: recentUsage[ex.id] || 0,
      loadAdjustment,
    };
  });

  // Sort: available equipment first, then by score
  scored.sort((a, b) => {
    if (a.hasAllEquipment && !b.hasAllEquipment) return -1;
    if (!a.hasAllEquipment && b.hasAllEquipment) return 1;
    return b.score - a.score;
  });

  // Group into categories
  const recentlyUsed = scored.filter(ex => ex.recentUsageCount > 0 && ex.hasAllEquipment).slice(0, 3);
  const recommended = scored.filter(ex => ex.hasAllEquipment && !recentlyUsed.includes(ex));
  const unavailable = scored.filter(ex => !ex.hasAllEquipment);

  return { recentlyUsed, recommended, unavailable, all: scored };
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
    description: 'Integrated mountaineering protocol - 40 week periodized program',
    icon: '⛰️',
    isDefault: true,
    isTemplate: false,
    globalRules: {
      deload_every_4th_week: true,
      one_specialty_at_a_time: true,
      always_return_to_base: true
    },
    quarterlyTesting: {
      frequency: 'every_12_weeks',
      tests: [
        { name: 'AeT Drift Test', protocol: '60 min @ AeT HR, measure drift', track: ['hr_drift_percent'] },
        { name: '5-Mile Run', protocol: 'All-out effort on flat terrain', track: ['time'] },
        { name: 'Strength Check', protocol: 'Trap bar deadlift to heavy single', track: ['weight'] },
        { name: 'Loaded Carry', protocol: '25% BW pack, max distance in 60 min', track: ['distance', 'vert'] }
      ]
    },
    availableDetours: {
      specialty: [
        {
          id: 'strength_emphasis',
          name: 'Strength Emphasis',
          type: 'specialty',
          duration: { min: 4, max: 6, unit: 'weeks' },
          when_to_use: [
            'Strength numbers have dropped >10%',
            'Feeling weak on heavy carries',
            'Pre-expedition strength peak needed',
            'Coming off long aerobic focus'
          ],
          sacrifice: [
            'Long aerobic sessions reduced to maintenance',
            'ME work paused',
            'Expect temporary cardio regression'
          ],
          exit_criteria: [
            'Hit target strength numbers',
            'Completed 4-6 weeks',
            'Ready to rebuild aerobic base'
          ],
          return_to: 'foundation',
          weeklyTemplate: [
            { day: 1, session: 'Heavy Lower', type: 'strength', duration: 75, prescription: { exercises: [{ name: 'Trap Bar Deadlift', sets: 5, reps: '3', percentage: 87 }, { name: 'Back Squat', sets: 4, reps: '5', percentage: 82 }, { name: 'Bulgarian Split Squat', sets: 3, reps: '8' }] } },
            { day: 2, session: 'Zone 2 (Short)', type: 'cardio', duration: 40, prescription: { hrZone: 'zone2', description: 'Maintenance only' } },
            { day: 3, session: 'Heavy Upper', type: 'strength', duration: 70, prescription: { exercises: [{ name: 'Weighted Pull-Up', sets: 5, reps: '3', percentage: 90 }, { name: 'Overhead Press', sets: 4, reps: '5', percentage: 80 }, { name: 'Barbell Row', sets: 4, reps: '6' }] } },
            { day: 4, session: 'Active Recovery', type: 'recovery', duration: 30, prescription: { description: 'Mobility and light movement' } },
            { day: 5, session: 'Power + Accessories', type: 'strength', duration: 60, prescription: { exercises: [{ name: 'Trap Bar Deadlift', sets: 3, reps: '2', percentage: 90 }, { name: 'Weighted Dip', sets: 4, reps: '5' }, { name: 'Farmer Carry', sets: 4, reps: '40m' }] } },
            { day: 6, session: 'Easy Hike', type: 'cardio', duration: 90, prescription: { hrZone: 'zone2', description: 'Unloaded, conversational pace' } },
            { day: 7, session: 'Rest', type: 'recovery', duration: 0, prescription: { description: 'Complete rest' } }
          ]
        },
        {
          id: 'running_emphasis',
          name: 'Running Emphasis',
          type: 'specialty',
          duration: { min: 4, max: 8, unit: 'weeks' },
          when_to_use: [
            '5-mile time has regressed',
            'Preparing for running-heavy selection',
            'AeT/AnT gap too wide (>15%)',
            'Need speed work before event'
          ],
          sacrifice: [
            'Heavy strength work reduced',
            'Long loaded carries paused',
            'Upper body maintenance only'
          ],
          exit_criteria: [
            '5-mile goal time achieved',
            'AeT/AnT gap <12%',
            'Completed 4-8 weeks'
          ],
          return_to: 'foundation',
          weeklyTemplate: [
            { day: 1, session: 'Tempo Run', type: 'cardio', duration: 50, prescription: { warmup: '10 min easy', mainSet: '20-30 min at tempo', cooldown: '10 min easy', hrZone: 'zone3' } },
            { day: 2, session: 'Strength (Maintenance)', type: 'strength', duration: 45, prescription: { exercises: [{ name: 'Trap Bar Deadlift', sets: 3, reps: '5', percentage: 80 }, { name: 'Weighted Pull-Up', sets: 3, reps: '5' }] } },
            { day: 3, session: 'Easy Run', type: 'cardio', duration: 45, prescription: { hrZone: 'zone2', description: 'Recovery pace' } },
            { day: 4, session: 'Interval Session', type: 'cardio', duration: 55, prescription: { warmup: '15 min', mainSet: '6 x 800m at 5K pace', recovery: '400m jog', cooldown: '10 min' } },
            { day: 5, session: 'Easy Run + Strides', type: 'cardio', duration: 40, prescription: { description: '30 min easy + 6 x 100m strides' } },
            { day: 6, session: 'Long Run', type: 'long_effort', duration: 90, prescription: { hrZone: 'zone2', description: '75-90 min progressive' } },
            { day: 7, session: 'Rest', type: 'recovery', duration: 0, prescription: { description: 'Complete rest' } }
          ]
        },
        {
          id: 'me_emphasis',
          name: 'Muscular Endurance Peak',
          type: 'specialty',
          duration: { min: 3, max: 5, unit: 'weeks' },
          when_to_use: [
            'Event requiring sustained loaded effort',
            'Need to peak ME before expedition',
            'Testing max loaded capacity'
          ],
          sacrifice: [
            'Max strength work paused',
            'Running volume reduced',
            'High fatigue accumulation expected'
          ],
          exit_criteria: [
            'Hit target step count at target load',
            'Event completed',
            'Completed 3-5 weeks'
          ],
          return_to: 'foundation',
          weeklyTemplate: [
            { day: 1, session: 'Gym ME Circuit', type: 'muscular_endurance', duration: 70, prescription: { description: '600-800 steps at 20-25% BW', tempo: '1 step/2 sec' } },
            { day: 2, session: 'Zone 2', type: 'cardio', duration: 45, prescription: { hrZone: 'zone2' } },
            { day: 3, session: 'Outdoor ME (Water Jug)', type: 'muscular_endurance', duration: 90, prescription: { description: 'Loaded uphill, dump water, descend empty', load: '20-25% BW' } },
            { day: 4, session: 'Recovery', type: 'recovery', duration: 30 },
            { day: 5, session: 'Strength (Light)', type: 'strength', duration: 40, prescription: { exercises: [{ name: 'Trap Bar Deadlift', sets: 2, reps: '5', percentage: 75 }] } },
            { day: 6, session: 'Peak ME Test', type: 'muscular_endurance', duration: 120, prescription: { description: 'Max steps at target load, or long loaded hike' } },
            { day: 7, session: 'Rest', type: 'recovery', duration: 0 }
          ]
        },
        {
          id: 'hypertrophy',
          name: 'Hypertrophy Block',
          icon: '🏋️',
          type: 'specialty',
          category: 'strength',
          duration: { min: 4, max: 8, unit: 'weeks' },
          description: 'Build muscle mass and work capacity',
          when_to_use: ['Need more muscle mass', 'Building base before strength', 'After extended cut'],
          sacrifice: ['Max strength temporarily lower', 'Cardio capacity may drop', 'Higher calorie needs'],
          exit_criteria: ['Gained target weight', 'All lifts show rep improvements', 'Work capacity increased'],
          return_to: 'foundation',
          weeklyTemplate: [
            { day: 1, session: 'Upper Hypertrophy', type: 'strength', duration: 60 },
            { day: 2, session: 'Lower Hypertrophy', type: 'strength', duration: 60 },
            { day: 3, session: 'Cardio', type: 'cardio', duration: 40 },
            { day: 4, session: 'Push Focus', type: 'strength', duration: 55 },
            { day: 5, session: 'Pull Focus', type: 'strength', duration: 55 },
            { day: 6, session: 'Legs + Cardio', type: 'strength', duration: 60 },
            { day: 7, session: 'Rest', type: 'recovery', duration: 0 }
          ]
        },
        {
          id: 'power_speed',
          name: 'Power & Speed',
          icon: '⚡',
          type: 'specialty',
          category: 'performance',
          duration: { min: 3, max: 6, unit: 'weeks' },
          description: 'Develop explosive power and speed',
          when_to_use: ['Pre-competition peaking', 'Converting strength to power', 'Speed improvement needed'],
          sacrifice: ['Endurance capacity drops', 'Muscle mass may not increase', 'Higher CNS fatigue'],
          exit_criteria: ['Vertical jump improved', 'Sprint times faster', 'Power output tests improved'],
          return_to: 'foundation',
          weeklyTemplate: [
            { day: 1, session: 'Lower Power', type: 'strength', duration: 50 },
            { day: 2, session: 'Sprint Intervals', type: 'cardio', duration: 40 },
            { day: 3, session: 'Upper Power', type: 'strength', duration: 50 },
            { day: 4, session: 'Recovery', type: 'recovery', duration: 30 },
            { day: 5, session: 'Plyometrics + Agility', type: 'strength', duration: 45 },
            { day: 6, session: 'Easy Cardio', type: 'cardio', duration: 45 },
            { day: 7, session: 'Rest', type: 'recovery', duration: 0 }
          ]
        },
        {
          id: 'grip_forearm',
          name: 'Grip & Forearm Focus',
          icon: '🤚',
          type: 'specialty',
          category: 'strength',
          duration: { min: 3, max: 6, unit: 'weeks' },
          description: 'Build crushing grip strength and forearm endurance',
          when_to_use: ['Grip limiting deadlift', 'Climbing goals', 'Tactical/rescue applications'],
          sacrifice: ['Upper body volume reduced', 'May affect pulling exercises short-term'],
          exit_criteria: ['Grip tests improved 15%+', 'Dead hang time doubled', 'No longer limiting main lifts'],
          return_to: 'foundation',
          weeklyTemplate: [
            { day: 1, session: 'Heavy Pulls + Grip', type: 'strength', duration: 60 },
            { day: 2, session: 'Cardio', type: 'cardio', duration: 40 },
            { day: 3, session: 'Forearm Hypertrophy', type: 'strength', duration: 45 },
            { day: 4, session: 'Recovery', type: 'recovery', duration: 30 },
            { day: 5, session: 'Grip Endurance + Carries', type: 'strength', duration: 55 },
            { day: 6, session: 'Easy Cardio', type: 'cardio', duration: 45 },
            { day: 7, session: 'Rest', type: 'recovery', duration: 0 }
          ]
        },
        {
          id: 'core_stability',
          name: 'Core & Stability',
          icon: '🎯',
          type: 'specialty',
          category: 'strength',
          duration: { min: 3, max: 5, unit: 'weeks' },
          description: 'Build trunk stability and anti-rotation strength',
          when_to_use: ['Core limiting compound lifts', 'Back pain history', 'Pre-heavy lifting cycle'],
          sacrifice: ['Main lift progression slowed', 'Less overall volume'],
          exit_criteria: ['Plank tests improved', 'Core no longer limiting factor', 'Back feels stronger'],
          return_to: 'foundation',
          weeklyTemplate: [
            { day: 1, session: 'Anti-Extension + Lower', type: 'strength', duration: 55 },
            { day: 2, session: 'Cardio', type: 'cardio', duration: 40 },
            { day: 3, session: 'Anti-Rotation + Upper', type: 'strength', duration: 55 },
            { day: 4, session: 'Mobility + Recovery', type: 'recovery', duration: 30 },
            { day: 5, session: 'Loaded Carries + Full Body', type: 'strength', duration: 50 },
            { day: 6, session: 'Easy Cardio', type: 'cardio', duration: 45 },
            { day: 7, session: 'Rest', type: 'recovery', duration: 0 }
          ]
        },
        {
          id: 'mobility_flexibility',
          name: 'Mobility & Flexibility',
          icon: '🧘',
          type: 'specialty',
          category: 'recovery',
          duration: { min: 2, max: 4, unit: 'weeks' },
          description: 'Improve range of motion and movement quality',
          when_to_use: ['ROM limiting lifts', 'Feeling stiff/immobile', 'After injury recovery'],
          sacrifice: ['Strength gains paused', 'Less training volume overall'],
          exit_criteria: ['Target ROM achieved', 'Movement quality improved', 'No compensation patterns'],
          return_to: 'foundation',
          weeklyTemplate: [
            { day: 1, session: 'Lower Body Mobility + Light Strength', type: 'strength', duration: 50 },
            { day: 2, session: 'Yoga/Stretch Flow', type: 'recovery', duration: 45 },
            { day: 3, session: 'Upper Body Mobility + Light Strength', type: 'strength', duration: 50 },
            { day: 4, session: 'Active Recovery', type: 'recovery', duration: 30 },
            { day: 5, session: 'Full Body Movement', type: 'strength', duration: 45 },
            { day: 6, session: 'Long Stretch Session', type: 'recovery', duration: 60 },
            { day: 7, session: 'Rest', type: 'recovery', duration: 0 }
          ]
        },
        {
          id: 'conditioning_gpp',
          name: 'Conditioning/GPP',
          icon: '🔥',
          type: 'specialty',
          category: 'cardio',
          duration: { min: 3, max: 6, unit: 'weeks' },
          description: 'Build general physical preparedness and work capacity',
          when_to_use: ['Work capacity is limiting', 'Pre-season conditioning', 'Base building phase'],
          sacrifice: ['Max strength maintenance only', 'Specific skills not trained'],
          exit_criteria: ['Conditioning tests improved', 'Recovery between sets faster', 'Can handle more volume'],
          return_to: 'foundation',
          weeklyTemplate: [
            { day: 1, session: 'Circuit Training', type: 'muscular_endurance', duration: 50 },
            { day: 2, session: 'Intervals', type: 'cardio', duration: 45 },
            { day: 3, session: 'Strength Maintenance', type: 'strength', duration: 45 },
            { day: 4, session: 'Easy Cardio', type: 'cardio', duration: 40 },
            { day: 5, session: 'Mixed Modal', type: 'muscular_endurance', duration: 55 },
            { day: 6, session: 'Long Slow Distance', type: 'cardio', duration: 60 },
            { day: 7, session: 'Rest', type: 'recovery', duration: 0 }
          ]
        },
        {
          id: 'swimming_focus',
          name: 'Swimming Focus',
          icon: '🏊',
          type: 'specialty',
          category: 'cardio',
          duration: { min: 4, max: 8, unit: 'weeks' },
          description: 'Improve swimming technique and water fitness',
          when_to_use: ['Swim test coming up', 'Triathlon prep', 'Cross-training variety'],
          sacrifice: ['Running volume reduced', 'Strength maintenance only'],
          exit_criteria: ['Swim test improved', 'Technique comfort achieved', 'Target distance/pace met'],
          return_to: 'foundation',
          weeklyTemplate: [
            { day: 1, session: 'Technique Swim', type: 'cardio', duration: 45 },
            { day: 2, session: 'Strength Maintenance', type: 'strength', duration: 40 },
            { day: 3, session: 'Interval Swim', type: 'cardio', duration: 50 },
            { day: 4, session: 'Recovery', type: 'recovery', duration: 30 },
            { day: 5, session: 'Easy Swim + Drills', type: 'cardio', duration: 40 },
            { day: 6, session: 'Long Swim', type: 'cardio', duration: 60 },
            { day: 7, session: 'Rest', type: 'recovery', duration: 0 }
          ]
        }
      ],
      life: [
        {
          id: 'post_injury',
          name: 'Post-Injury Return',
          type: 'life',
          duration: { min: 2, max: 8, unit: 'weeks' },
          when_to_use: [
            'Returning from injury',
            'Medical clearance received',
            'Pain-free in daily activities'
          ],
          exit_criteria: [
            'Full ROM restored',
            'No pain during training',
            'Cleared for full intensity'
          ],
          notes: [
            'Start at 50% of previous volume',
            'Progress 10-15% per week if asymptomatic',
            'Prioritize movement quality over load'
          ],
          return_to: 'foundation',
          weeklyTemplate: [
            { day: 1, session: 'Movement Assessment', type: 'strength', duration: 45, prescription: { description: 'Light load, assess ROM and pain' } },
            { day: 2, session: 'Easy Cardio', type: 'cardio', duration: 30, prescription: { hrZone: 'zone1', description: 'Walking or cycling' } },
            { day: 3, session: 'Rehab + Light Strength', type: 'strength', duration: 40, prescription: { description: 'Focus on weak links' } },
            { day: 4, session: 'Rest or Mobility', type: 'recovery', duration: 20 },
            { day: 5, session: 'Progressive Load Test', type: 'strength', duration: 45, prescription: { description: 'Gradually increase load, stop at discomfort' } },
            { day: 6, session: 'Easy Hike', type: 'cardio', duration: 60, prescription: { hrZone: 'zone1', description: 'Unloaded, flat terrain' } },
            { day: 7, session: 'Rest', type: 'recovery', duration: 0 }
          ]
        },
        {
          id: 'mental_reset',
          name: 'Mental Reset',
          type: 'life',
          duration: { min: 1, max: 3, unit: 'weeks' },
          when_to_use: [
            'Burnout symptoms present',
            'Motivation at zero',
            'Life stress overwhelming',
            'Dreading every workout'
          ],
          exit_criteria: [
            'Excitement to train returns',
            'Stress levels manageable',
            'Completed minimum 1 week'
          ],
          notes: [
            'No structured training required',
            'Move only if it feels good',
            'Focus on sleep and nutrition',
            'Social activity encouraged'
          ],
          return_to: 'foundation',
          weeklyTemplate: [
            { day: 1, session: 'Optional Movement', type: 'recovery', duration: 30, prescription: { description: 'Only if desired - walk, swim, play' } },
            { day: 2, session: 'Optional Movement', type: 'recovery', duration: 30, prescription: { description: 'No obligation' } },
            { day: 3, session: 'Optional Movement', type: 'recovery', duration: 30, prescription: { description: 'Listen to your body' } },
            { day: 4, session: 'Optional Movement', type: 'recovery', duration: 30, prescription: { description: 'Rest if needed' } },
            { day: 5, session: 'Optional Movement', type: 'recovery', duration: 30, prescription: { description: 'Enjoy movement' } },
            { day: 6, session: 'Optional Movement', type: 'recovery', duration: 30, prescription: { description: 'Outdoor time encouraged' } },
            { day: 7, session: 'Rest', type: 'recovery', duration: 0 }
          ]
        },
        {
          id: 'field_maintenance',
          name: 'Field/Deployment Maintenance',
          type: 'life',
          duration: { min: 1, max: 52, unit: 'weeks' },
          when_to_use: [
            'Deployed with limited equipment',
            'Extended field exercise',
            'Travel with minimal gym access'
          ],
          exit_criteria: [
            'Return to normal training environment',
            'Full equipment access restored'
          ],
          notes: [
            'Maintain what you can',
            'Bodyweight + running focus',
            'Accept some detraining'
          ],
          return_to: 'foundation',
          weeklyTemplate: [
            { day: 1, session: 'Bodyweight Strength', type: 'strength', duration: 30, prescription: { exercises: [{ name: 'Push-ups', sets: 4, reps: 'max' }, { name: 'Pull-ups', sets: 4, reps: 'max' }, { name: 'Lunges', sets: 3, reps: '20' }, { name: 'Plank', sets: 3, reps: '60s' }] } },
            { day: 2, session: 'Run', type: 'cardio', duration: 30, prescription: { description: 'Easy to moderate' } },
            { day: 3, session: 'Bodyweight Circuit', type: 'conditioning', duration: 25, prescription: { description: 'AMRAP style' } },
            { day: 4, session: 'Rest or Walk', type: 'recovery', duration: 20 },
            { day: 5, session: 'Bodyweight Strength', type: 'strength', duration: 30, prescription: { description: 'Same as Day 1' } },
            { day: 6, session: 'Long Walk/Ruck', type: 'cardio', duration: 60, prescription: { description: 'Whatever load available' } },
            { day: 7, session: 'Rest', type: 'recovery', duration: 0 }
          ]
        },
        {
          id: 'taper',
          name: 'Pre-Event Taper',
          type: 'life',
          duration: { min: 1, max: 2, unit: 'weeks' },
          when_to_use: [
            '1-2 weeks before major event',
            'Selection course starting',
            'Expedition departure'
          ],
          exit_criteria: [
            'Event begins'
          ],
          notes: [
            'Reduce volume 40-60%',
            'Maintain intensity on key sessions',
            'Prioritize sleep and nutrition',
            'Stay sharp, arrive fresh'
          ],
          return_to: 'foundation',
          weeklyTemplate: [
            { day: 1, session: 'Light Strength', type: 'strength', duration: 35, prescription: { description: '60% volume, maintain intensity' } },
            { day: 2, session: 'Easy Run', type: 'cardio', duration: 25, prescription: { hrZone: 'zone2' } },
            { day: 3, session: 'Short Intervals', type: 'cardio', duration: 30, prescription: { description: '4 x 2 min hard, stay sharp' } },
            { day: 4, session: 'Rest', type: 'recovery', duration: 0 },
            { day: 5, session: 'Shakeout', type: 'cardio', duration: 20, prescription: { description: 'Easy movement + strides' } },
            { day: 6, session: 'Rest', type: 'recovery', duration: 0 },
            { day: 7, session: 'Event or Travel', type: 'recovery', duration: 0 }
          ]
        },
        {
          id: 'deload_week',
          name: 'Deload Week',
          icon: '😌',
          type: 'life',
          category: 'recovery',
          duration: { min: 1, max: 1, unit: 'weeks' },
          description: 'Planned recovery week to reduce fatigue',
          when_to_use: ['After 3-4 hard weeks', 'Feeling run down', 'Performance declining'],
          exit_criteria: ['Feel refreshed', 'Week completed', 'Ready for hard training'],
          return_to: 'foundation',
          weeklyTemplate: [
            { day: 1, session: 'Light Strength (50%)', type: 'strength', duration: 35 },
            { day: 2, session: 'Easy Zone 2', type: 'cardio', duration: 30 },
            { day: 3, session: 'Mobility Focus', type: 'recovery', duration: 30 },
            { day: 4, session: 'Light Strength (50%)', type: 'strength', duration: 35 },
            { day: 5, session: 'Easy Zone 2', type: 'cardio', duration: 30 },
            { day: 6, session: 'Light Activity', type: 'recovery', duration: 45 },
            { day: 7, session: 'Rest', type: 'recovery', duration: 0 }
          ]
        },
        {
          id: 'sick_return',
          name: 'Return from Illness',
          icon: '🤒',
          type: 'life',
          category: 'recovery',
          duration: { min: 1, max: 2, unit: 'weeks' },
          description: 'Gradual return after being sick',
          when_to_use: ['Recovering from illness', 'Post-flu/cold', 'Energy still low'],
          exit_criteria: ['Energy back to normal', 'No symptoms for 3+ days', 'Can complete easy workout'],
          return_to: 'foundation',
          weeklyTemplate: [
            { day: 1, session: 'Walk Only', type: 'cardio', duration: 20 },
            { day: 2, session: 'Light Movement', type: 'recovery', duration: 25 },
            { day: 3, session: 'Easy Cardio', type: 'cardio', duration: 30 },
            { day: 4, session: 'Rest', type: 'recovery', duration: 0 },
            { day: 5, session: 'Light Strength', type: 'strength', duration: 30 },
            { day: 6, session: 'Easy Cardio', type: 'cardio', duration: 35 },
            { day: 7, session: 'Rest', type: 'recovery', duration: 0 }
          ]
        },
        {
          id: 'busy_schedule',
          name: 'Busy Schedule Mode',
          icon: '📅',
          type: 'life',
          category: 'situational',
          duration: { min: 1, max: 8, unit: 'weeks' },
          description: 'Maintain fitness with minimal time investment',
          when_to_use: ['Work deadline crunch', 'Family obligations', 'Limited training time'],
          exit_criteria: ['Schedule freed up', 'Can return to normal training', 'Busy period ended'],
          return_to: 'foundation',
          weeklyTemplate: [
            { day: 1, session: 'Full Body (30 min)', type: 'strength', duration: 30 },
            { day: 2, session: 'Rest or Walk', type: 'recovery', duration: 20 },
            { day: 3, session: 'Intervals (20 min)', type: 'cardio', duration: 20 },
            { day: 4, session: 'Rest', type: 'recovery', duration: 0 },
            { day: 5, session: 'Full Body (30 min)', type: 'strength', duration: 30 },
            { day: 6, session: 'Easy Cardio', type: 'cardio', duration: 25 },
            { day: 7, session: 'Rest', type: 'recovery', duration: 0 }
          ]
        },
        {
          id: 'weight_cut',
          name: 'Weight Cut Protocol',
          icon: '⚖️',
          type: 'life',
          category: 'performance',
          duration: { min: 2, max: 8, unit: 'weeks' },
          description: 'Preserve muscle while cutting weight',
          when_to_use: ['Making weight for competition', 'Planned fat loss phase', 'Pre-selection cut'],
          exit_criteria: ['Target weight reached', 'Competition completed', 'Cut phase ended'],
          return_to: 'foundation',
          weeklyTemplate: [
            { day: 1, session: 'Heavy Strength (Low Volume)', type: 'strength', duration: 45 },
            { day: 2, session: 'LISS Cardio', type: 'cardio', duration: 40 },
            { day: 3, session: 'Full Body Maintenance', type: 'strength', duration: 40 },
            { day: 4, session: 'Light Cardio or Rest', type: 'recovery', duration: 30 },
            { day: 5, session: 'Heavy Strength (Low Volume)', type: 'strength', duration: 45 },
            { day: 6, session: 'LISS Cardio', type: 'cardio', duration: 45 },
            { day: 7, session: 'Rest', type: 'recovery', duration: 0 }
          ]
        },
        {
          id: 'new_parent',
          name: 'New Parent Mode',
          icon: '👶',
          type: 'life',
          category: 'situational',
          duration: { min: 4, max: 24, unit: 'weeks' },
          description: 'Flexible training for sleep-deprived new parents',
          when_to_use: ['New baby at home', 'Sleep deprived', 'Unpredictable schedule'],
          exit_criteria: ['Sleep improving', 'Schedule more predictable', 'Ready for more structure'],
          return_to: 'foundation',
          weeklyTemplate: [
            { day: 1, session: 'When Possible - Strength', type: 'strength', duration: 30 },
            { day: 2, session: 'When Possible - Walk', type: 'cardio', duration: 20 },
            { day: 3, session: 'Rest as Needed', type: 'recovery', duration: 0 },
            { day: 4, session: 'When Possible - Strength', type: 'strength', duration: 30 },
            { day: 5, session: 'Rest as Needed', type: 'recovery', duration: 0 },
            { day: 6, session: 'When Possible - Any Activity', type: 'cardio', duration: 30 },
            { day: 7, session: 'Rest', type: 'recovery', duration: 0 }
          ]
        }
      ]
    },
    phases: [
      {
        id: 'foundation', name: 'Foundation', weeks: [1, 16],
        description: 'Build aerobic engine, maintain strength. 80% Zone 1-2.',
        exitCriteria: ['AeT HR drift <5%', '5-mile under 36:00', 'Strength maintained'],
        weeklyTemplate: [
          { day: 1, session: 'Strength A', type: 'strength', duration: 60, prescription: { warmup: '10 min easy cardio + dynamic stretching', exercises: [{ name: 'Trap Bar Deadlift', sets: 4, reps: '3-5', rest: '3 min', prKey: 'trapBarDeadlift', percentage: 85 }, { name: 'Box Step-Up', sets: 4, reps: '3-5 each', rest: '3 min', prKey: 'boxStepUp', percentage: 100 }, { name: 'Weighted Pull-Up', sets: 4, reps: '3-5', rest: '3 min', prKey: 'weightedPullUp', percentage: 85 }, { name: 'Dip', sets: 4, reps: '3-5', rest: '3 min', prKey: 'weightedDip', percentage: 85 }], cooldown: '5 min walk', intensity: '85% 1RM' } },
          { day: 2, session: 'Zone 2 Run', type: 'cardio', duration: 70, prescription: { description: 'Easy conversational pace', hrZone: 'zone2', notes: ['Nasal breathing preferred', 'If HR drifts up, slow down'] } },
          { day: 3, session: 'Zone 2 + Mobility', type: 'cardio', duration: 55, prescription: { description: '30-40 min easy + 15-20 min mobility', hrZone: 'zone2' } },
          { day: 4, session: 'Threshold Intervals', type: 'cardio', duration: 45, prescription: { warmup: '10 min easy', mainSet: '4 x 8 min at AeT', recovery: '2 min jog', hrZone: 'zone3', cooldown: '5-10 min easy' } },
          { day: 5, session: 'Strength B', type: 'strength', duration: 60, prescription: { warmup: '10 min easy cardio', exercises: [{ name: 'Trap Bar Deadlift', sets: 4, reps: '3-5', prKey: 'trapBarDeadlift', percentage: 85 }, { name: 'Box Step-Up', sets: 4, reps: '3-5 each', prKey: 'boxStepUp', percentage: 100 }, { name: 'Weighted Pull-Up', sets: 4, reps: '3-5', prKey: 'weightedPullUp', percentage: 85 }, { name: 'Dip', sets: 4, reps: '3-5', prKey: 'weightedDip', percentage: 85 }], accessory: [{ name: 'Face Pulls', sets: 2, reps: 15 }, { name: 'Pallof Press', sets: 2, reps: 15 }], cooldown: '5 min walk' } },
          { day: 6, session: 'Long Aerobic', type: 'long_effort', duration: 150, prescription: { description: 'Long Zone 1-2 effort', hrZone: 'zone2', options: ['Long hike', 'Long run', 'Combo'], nutrition: '30-60g carbs/hr after first hour' } },
          { day: 7, session: 'Active Recovery', type: 'recovery', duration: 30, prescription: { description: 'Very easy movement or complete rest', options: ['Easy walk', 'Light yoga', 'Swimming', 'Foam rolling'] } }
        ],
        benchmarks: [{ name: 'AeT HR Drift', target: '<5%' }, { name: '5-Mile Run', target: '<36:00' }, { name: 'Strength', target: 'Maintained' }]
      },
      {
        id: 'conversion', name: 'Conversion', weeks: [17, 28],
        description: 'Convert strength to muscular endurance. Introduce loaded carries.',
        exitCriteria: ['600 steps @ 20% BW', '5-mile under 34:00', 'AeT/AnT gap <12%'],
        weeklyTemplate: [
          { day: 1, session: 'Strength (Reduced)', type: 'strength', duration: 45, prescription: { warmup: '10 min easy', exercises: [{ name: 'Trap Bar Deadlift', sets: 3, reps: '3-5', prKey: 'trapBarDeadlift', percentage: 85 }, { name: 'Box Step-Up', sets: 3, reps: '3-5 each', prKey: 'boxStepUp', percentage: 100 }, { name: 'Weighted Pull-Up', sets: 3, reps: '3-5', prKey: 'weightedPullUp', percentage: 85 }, { name: 'Dip', sets: 3, reps: '3-5', prKey: 'weightedDip', percentage: 85 }], intensity: 'Maintenance only' } },
          { day: 2, session: 'Zone 2 Run', type: 'cardio', duration: 60, prescription: { description: 'Easy recovery-pace run', hrZone: 'zone2' } },
          { day: 3, session: 'Gym ME Session', type: 'muscular_endurance', duration: 70, prescription: { warmup: '10 min easy', description: 'Continuous circuit, minimal rest', exercises: [{ name: 'Box Step-Up' }, { name: 'Walking Lunge' }, { name: 'Split Squat' }, { name: 'Heel Touch' }], tempo: '1 rep every 2 seconds' } },
          { day: 4, session: 'Zone 2 + Mobility', type: 'cardio', duration: 45, prescription: { description: '30 min easy + 15 min mobility', hrZone: 'zone2' } },
          { day: 5, session: 'Threshold Intervals', type: 'cardio', duration: 45, prescription: { warmup: '10 min building', mainSet: '5 x 6 min at tempo', recovery: '2 min jog', hrZone: 'zone3', cooldown: '5-10 min easy' } },
          { day: 6, session: 'Outdoor ME (Water Jug)', type: 'muscular_endurance', duration: 90, prescription: { description: 'THE WATER JUG PROTOCOL', steps: ['Fill pack to target weight', 'Find steep terrain 30%+', 'Hike up 60-90 min', 'DUMP WATER at top', 'Descend empty'] } },
          { day: 7, session: 'Active Recovery', type: 'recovery', duration: 30, prescription: { description: 'Easy movement or rest', hrZone: 'zone1' } }
        ],
        benchmarks: [{ name: 'Gym ME', target: '600 steps @ 20% BW' }, { name: '5-Mile', target: '<34:00' }, { name: 'AeT/AnT Gap', target: '<12%' }]
      },
      {
        id: 'specificity', name: 'Specificity', weeks: [29, 40],
        description: 'Expedition simulation. Peak loads. Sawtooth training.',
        exitCriteria: ['1000 ft/hr @ 25% BW', '5-mile under 32:00', 'AeT/AnT gap <10%'],
        weeklyTemplate: [
          { day: 1, session: 'Strength (Minimal)', type: 'strength', duration: 40, prescription: { exercises: [{ name: 'Trap Bar Deadlift', sets: 3, reps: '3-5', prKey: 'trapBarDeadlift', percentage: 82 }, { name: 'Weighted Pull-Up', sets: 3, reps: '3-5', prKey: 'weightedPullUp', percentage: 82 }], intensity: '80-85% 1RM' } },
          { day: 2, session: 'Zone 2 Run', type: 'cardio', duration: 55, prescription: { description: 'Easy recovery', hrZone: 'zone2' } },
          { day: 3, session: 'Peak ME Session', type: 'muscular_endurance', duration: 75, prescription: { description: 'Circuit at peak load', target: '800-1000 steps', load: '25% BW', tempo: '1 step/2 sec' } },
          { day: 4, session: 'Off or Mobility', type: 'recovery', duration: 30, prescription: { description: 'TRUE RECOVERY - needed for sawtooth', options: ['Complete rest', 'Light mobility'] } },
          { day: 5, session: 'Tempo Run', type: 'cardio', duration: 45, prescription: { warmup: '10 min building', mainSet: '3 x 1 mile at goal pace', recovery: '2-3 min jog', cooldown: '10 min easy' } },
          { day: 6, session: 'Sawtooth Day 1', type: 'long_effort', duration: 300, prescription: { description: 'LONG LOADED EFFORT', load: '27% BW', duration: '4-6 hours', benchmark: '1000 ft/hr in Zone 2', nutrition: '60-90g carbs/hr' } },
          { day: 7, session: 'Sawtooth Day 2', type: 'long_effort', duration: 150, prescription: { description: 'BACK-TO-BACK fatigue resistance', load: '15% BW', duration: '2-3 hours', hrZone: 'zone2' } }
        ],
        benchmarks: [{ name: 'Vertical Rate', target: '1000 ft/hr @ 25% BW' }, { name: '5-Mile', target: '<32:00' }, { name: 'AeT/AnT Gap', target: '<10%' }]
      }
    ]
  }
};

// ============== READINESS CHECK COMPONENT ==============
const ReadinessCheckView = ({ readiness, setReadiness, athleteProfile, theme, darkMode }) => {
  // Always get fresh date on each render - no stale state
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
  // Track if today's check has been saved (vs just viewing defaults)
  const [isSaved, setIsSaved] = useState(!!todayCheck);

  // Reset form when date changes
  useEffect(() => {
    const newTodayCheck = readiness.logs?.find(l => l.date === todayKey);
    if (newTodayCheck) {
      setFormData(newTodayCheck);
      setIsSaved(true);
    } else {
      // Reset to defaults for new day
      setFormData({
        sleepQuality: 3,
        sleepHours: 7,
        energyLevel: 3,
        soreness: 3,
        motivation: 3,
        restingHR: '',
        hrv: '',
        notes: ''
      });
      setIsSaved(false);
    }
  }, [todayKey, readiness.logs]);

  const score = calculateReadinessScore(formData);
  const readinessInfo = score ? getReadinessLabel(score) : null;
  // Only show the big score display if today's check has been saved
  const showSavedScore = isSaved && score;

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
    setIsSaved(true);
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

      {/* Score Display - only show if today's check has been saved */}
      {showSavedScore ? (
        <div className={`${theme.card} rounded-xl shadow-sm p-5 text-center`}>
          <div className={`text-5xl font-bold ${getReadinessColor(score)}`}>{score}</div>
          <div className={`flex items-center justify-center gap-2 mt-2 ${theme.text}`}>
            {readinessInfo && React.createElement(readinessInfo.icon, { size: 20 })}
            <span className="font-medium">{readinessInfo?.text}</span>
          </div>
          <p className={`text-sm ${theme.textMuted} mt-2`}>{readinessInfo?.recommendation}</p>
        </div>
      ) : (
        <div className={`${theme.card} rounded-xl shadow-sm p-5 text-center`}>
          <div className={`text-2xl font-medium ${theme.textMuted}`}>No check-in yet</div>
          <p className={`text-sm ${theme.textMuted} mt-2`}>Complete your daily check-in below</p>
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
                <span className={`text-xs ${theme.textMuted}`}>{parseLocalDate(day.date).toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}</span>
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
    if (test.calculatePace && testData.time) {
      finalData.pace = test.calculatePace(testData);
    }
    if (test.calculateStepsPerMin && testData.totalSteps && testData.duration) {
      finalData.stepsPerMin = test.calculateStepsPerMin(testData);
    }
    // Calculate load percent if we have load and athlete weight
    if (testData.load && athleteProfile?.weight) {
      finalData.loadPercent = ((testData.load / athleteProfile.weight) * 100).toFixed(1);
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
              if (!updated.prs[key]?.value || Number(value) > updated.prs[key].value) {
                updated.prs[key] = { ...updated.prs[key], value: Number(value), date: getTodayKey() };
                updated.history.push({ category: 'prs', key, value: Number(value), date: new Date().toISOString() });
              }
            }
          }
        } else if (test.targetKey === 'maxHR' && finalData.maxHR) {
          updated.benchmarks = { ...updated.benchmarks };
          updated.benchmarks.maxHR = { value: Number(finalData.maxHR), date: getTodayKey(), unit: 'bpm' };
          updated.history.push({ category: 'benchmarks', key: 'maxHR', value: finalData.maxHR, date: new Date().toISOString() });
        } else if (test.targetKey === 'fiveMileTime' && finalData.time) {
          updated.benchmarks = { ...updated.benchmarks };
          updated.benchmarks.fiveMileTime = { value: finalData.time, date: getTodayKey(), unit: 'min:sec' };
          updated.history.push({ category: 'benchmarks', key: 'fiveMileTime', value: finalData.time, date: new Date().toISOString() });
        } else if (test.targetKey === 'verticalRate' && finalData.rate) {
          updated.benchmarks = { ...updated.benchmarks };
          updated.benchmarks.verticalRate = { value: Number(finalData.rate), date: getTodayKey(), unit: 'ft/hr' };
          updated.history.push({ category: 'benchmarks', key: 'verticalRate', value: finalData.rate, date: new Date().toISOString() });
        } else if (test.targetKey === 'aetDrift' && finalData.drift) {
          updated.benchmarks = { ...updated.benchmarks };
          updated.benchmarks.aetDrift = { value: Number(finalData.drift), date: getTodayKey(), unit: '%' };
          updated.history.push({ category: 'benchmarks', key: 'aetDrift', value: finalData.drift, date: new Date().toISOString() });
        } else if (test.targetKey === 'anaerobicThresholdHR' && finalData.avgHRLast20) {
          updated.benchmarks = { ...updated.benchmarks };
          updated.benchmarks.anaerobicThresholdHR = { value: Number(finalData.avgHRLast20), date: getTodayKey(), unit: 'bpm' };
          updated.history.push({ category: 'benchmarks', key: 'anaerobicThresholdHR', value: finalData.avgHRLast20, date: new Date().toISOString() });
        } else if (test.targetKey === 'ruckMarchTime' && finalData.time) {
          updated.benchmarks = { ...updated.benchmarks };
          updated.benchmarks.ruckMarchTime = { value: finalData.time, date: getTodayKey(), unit: 'min:sec' };
          updated.history.push({ category: 'benchmarks', key: 'ruckMarchTime', value: finalData.time, date: new Date().toISOString() });
        } else if (test.targetKey === 'meCapacity' && finalData.totalSteps) {
          updated.benchmarks = { ...updated.benchmarks };
          updated.benchmarks.meCapacity = { value: Number(finalData.totalSteps), date: getTodayKey(), unit: 'steps', load: finalData.loadPercent };
          updated.history.push({ category: 'benchmarks', key: 'meCapacity', value: finalData.totalSteps, date: new Date().toISOString() });
        } else if (test.targetKey === 'gripEndurance' && finalData.deadHangTime) {
          updated.benchmarks = { ...updated.benchmarks };
          updated.benchmarks.gripEndurance = { value: Number(finalData.deadHangTime), date: getTodayKey(), unit: 'sec' };
          updated.history.push({ category: 'benchmarks', key: 'gripEndurance', value: finalData.deadHangTime, date: new Date().toISOString() });
        } else if (test.targetKey === 'workCapacity' && finalData.totalTime) {
          updated.benchmarks = { ...updated.benchmarks };
          updated.benchmarks.workCapacity = { value: finalData.totalTime, date: getTodayKey(), unit: 'min:sec' };
          updated.history.push({ category: 'benchmarks', key: 'workCapacity', value: finalData.totalTime, date: new Date().toISOString() });
        } else if (test.targetKey === 'bodyComp' && finalData.weight) {
          // Update athlete weight in profile
          updated.weight = Number(finalData.weight);
          updated.history.push({ category: 'bodyComp', key: 'weight', value: finalData.weight, date: new Date().toISOString() });
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
                  className={`flex items-center gap-2 px-6 py-3 ${theme.btnSecondary} font-semibold rounded-xl`}
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
                  className={`mt-4 px-4 py-2 ${theme.btnSecondary} rounded-lg text-sm font-medium`}
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
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full ${theme.badge} text-xs font-medium flex items-center justify-center`}>{idx + 1}</span>
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

  // Calculate if test is due
  const isTestDue = (testId) => {
    const test = BENCHMARK_TESTS[testId];
    const lastResult = getLastResult(testId);
    if (!lastResult || !test.frequency) return true;
    
    const lastDate = new Date(lastResult.date);
    const now = new Date();
    const monthsElapsed = (now.getFullYear() - lastDate.getFullYear()) * 12 + (now.getMonth() - lastDate.getMonth());
    return monthsElapsed >= test.frequency;
  };

  // Get tests by category
  const getTestsByCategory = () => {
    const categories = {
      baseline: { name: 'Baseline', icon: '📊', tests: [] },
      aerobic: { name: 'Aerobic Fitness', icon: '🫀', tests: [] },
      mountaineering: { name: 'Mountaineering', icon: '⛰️', tests: [] },
      strength: { name: 'Strength', icon: '💪', tests: [] },
      muscular_endurance: { name: 'Muscular Endurance', icon: '🔄', tests: [] },
      conditioning: { name: 'Work Capacity', icon: '⚡', tests: [] },
    };
    
    Object.values(BENCHMARK_TESTS).forEach(test => {
      if (categories[test.category]) {
        categories[test.category].tests.push(test);
      }
    });
    
    return Object.entries(categories).filter(([_, cat]) => cat.tests.length > 0);
  };

  // Get overdue tests count
  const overdueTests = Object.keys(BENCHMARK_TESTS).filter(id => isTestDue(id)).length;

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
      
      {/* Due tests alert */}
      {overdueTests > 0 && (
        <div className={`p-3 ${darkMode ? 'bg-amber-900/30 border-amber-700' : 'bg-amber-50 border-amber-200'} border rounded-xl flex items-center gap-3`}>
          <AlertTriangle className={darkMode ? 'text-amber-400' : 'text-amber-600'} size={20} />
          <div>
            <p className={`text-sm font-medium ${theme.text}`}>{overdueTests} test{overdueTests > 1 ? 's' : ''} due</p>
            <p className={`text-xs ${theme.textMuted}`}>Schedule your benchmark tests for accurate programming</p>
          </div>
        </div>
      )}

      {/* Tests by category */}
      {getTestsByCategory().map(([catId, category]) => (
        <div key={catId} className="space-y-3">
          <h3 className={`text-sm font-semibold ${theme.textMuted} uppercase flex items-center gap-2`}>
            <span>{category.icon}</span> {category.name}
          </h3>
          
          {category.tests.map(test => {
            const lastResult = getLastResult(test.id);
            const resultCount = benchmarkResults[test.id]?.length || 0;
            const isDue = isTestDue(test.id);
            
            return (
              <div key={test.id} className={`${theme.card} rounded-xl shadow-sm p-4 ${isDue ? (darkMode ? 'ring-1 ring-amber-500/50' : 'ring-1 ring-amber-300') : ''}`}>
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{test.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-semibold ${theme.text}`}>{test.name}</h3>
                      <div className="flex items-center gap-2">
                        {isDue && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                            Due
                          </span>
                        )}
                        {resultCount > 0 && (
                          <span className={`text-xs ${theme.textMuted} px-2 py-0.5 ${theme.cardAlt} rounded-full`}>
                            {resultCount}×
                          </span>
                        )}
                      </div>
                    </div>
                    <p className={`text-sm ${theme.textMuted} mt-1`}>{test.description}</p>
                    <div className={`flex flex-wrap gap-3 mt-2 text-xs ${theme.textMuted}`}>
                      <span>⏱️ {test.duration}</span>
                      <span>🔄 Every {test.frequency} mo</span>
                      {test.benchmarkTargets && (
                        <span className="text-green-500">✓ {test.benchmarkTargets.good}</span>
                      )}
                    </div>
                    {lastResult && (
                      <div className={`mt-3 p-2 ${theme.cardAlt} rounded-lg text-sm flex flex-wrap items-center gap-2`}>
                        <span className={theme.textMuted}>Last:</span>
                        <span className={`font-medium ${theme.text}`}>{formatDateShort(lastResult.date)}</span>
                        {lastResult.data.time && <span className={`font-mono ${theme.text}`}>⏱️ {lastResult.data.time}</span>}
                        {lastResult.data.drift && <span className={`font-mono ${parseFloat(lastResult.data.drift) < 5 ? 'text-green-500' : 'text-red-500'}`}>📉 {lastResult.data.drift}%</span>}
                        {lastResult.data.rate && <span className={`font-mono ${theme.text}`}>⛰️ {lastResult.data.rate} ft/hr</span>}
                        {lastResult.data.maxHR && <span className={`font-mono ${theme.text}`}>❤️ {lastResult.data.maxHR}</span>}
                        {lastResult.data.totalSteps && <span className={`font-mono ${theme.text}`}>🔄 {lastResult.data.totalSteps} steps</span>}
                        {lastResult.data.deadHangTime && <span className={`font-mono ${theme.text}`}>✊ {lastResult.data.deadHangTime}s hang</span>}
                        {lastResult.data.totalTime && <span className={`font-mono ${theme.text}`}>⚡ {lastResult.data.totalTime}</span>}
                        {lastResult.data.weight && <span className={`font-mono ${theme.text}`}>⚖️ {lastResult.data.weight} lbs</span>}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => startTest(test.id)}
                  className={`w-full mt-4 py-2 ${isDue ? 'bg-blue-500 hover:bg-blue-600 text-white' : `${theme.cardAlt} ${theme.text}`} hover:opacity-90 rounded-lg text-sm font-medium flex items-center justify-center gap-2`}
                >
                  <PlayCircle size={18} /> {isDue ? 'Start Test (Due)' : 'Start Test'}
                </button>
              </div>
            );
          })}
        </div>
      ))}
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
  const SVGLineChart = ({ data, xKey, yKey, color = '#10b981', height = 150, showDots = true, yLabel = '', formatY = (v) => v }) => {
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

    const gradientId = `line-gradient-${yKey}`;
    const glowId = `line-glow-${yKey}`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Altitude gradient for area fill */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
          {/* Glow filter for line */}
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines - styled as contour lines */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={padding.left} y1={tick.y} x2={width - padding.right} y2={tick.y}
              stroke={darkMode ? '#374151' : '#e5e7eb'}
              strokeWidth="1"
              strokeDasharray={i === 0 ? "0" : "4 4"}
              opacity={0.5}
            />
            <text x={padding.left - 5} y={tick.y + 4} textAnchor="end" className={`text-[10px] ${darkMode ? 'fill-gray-500' : 'fill-gray-400'}`}>
              {formatY(Math.round(tick.value))}
            </text>
          </g>
        ))}

        {/* Area fill with gradient */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* Line with glow effect */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${glowId})`} />

        {/* Summit dots - larger at peaks */}
        {showDots && points.map((p, i) => {
          const isPeak = (i > 0 && i < points.length - 1 && p.y <= points[i-1].y && p.y <= points[i+1].y);
          const isValley = (i > 0 && i < points.length - 1 && p.y >= points[i-1].y && p.y >= points[i+1].y);
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={isPeak ? 5 : isValley ? 3 : 4}
              fill={isPeak ? '#10b981' : color}
              stroke={darkMode ? '#1f2937' : '#fff'}
              strokeWidth="2"
              filter={isPeak ? `url(#${glowId})` : undefined}
            />
          );
        })}

        {/* X-axis labels */}
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

  // Bar Chart Component - Mountain peak style
  const BarChart = ({ data, xKey, yKey, color = '#06b6d4', height = 150 }) => {
    if (!data || data.length === 0) {
      return <div className={`h-[${height}px] flex items-center justify-center ${theme.textMuted}`}><p className="text-sm">No data</p></div>;
    }

    const padding = { top: 25, right: 20, bottom: 40, left: 40 };
    const width = 320;
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const values = data.map(d => d[yKey]);
    const yMax = Math.max(...values) * 1.1 || 1;
    const maxIdx = values.indexOf(Math.max(...values));
    const barWidth = (chartWidth / data.length) * 0.7;
    const barGap = (chartWidth / data.length) * 0.3;

    const barGradientId = 'bar-gradient';

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={barGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.5" />
          </linearGradient>
          <filter id="bar-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {data.map((d, i) => {
          const barHeight = (d[yKey] / yMax) * chartHeight;
          const x = padding.left + i * (barWidth + barGap) + barGap / 2;
          const y = padding.top + chartHeight - barHeight;
          const isMax = i === maxIdx && d[yKey] > 0;

          return (
            <g key={i}>
              {/* Bar with gradient */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={`url(#${barGradientId})`}
                rx="4"
                filter={isMax ? 'url(#bar-glow)' : undefined}
              />
              {/* Peak marker for highest */}
              {isMax && (
                <polygon
                  points={`${x + barWidth/2},${y - 8} ${x + barWidth/2 - 6},${y} ${x + barWidth/2 + 6},${y}`}
                  fill="#10b981"
                />
              )}
              {/* Value label */}
              <text
                x={x + barWidth / 2}
                y={y - (isMax ? 12 : 5)}
                textAnchor="middle"
                className={`text-[10px] font-medium ${isMax ? 'fill-emerald-400' : darkMode ? 'fill-gray-300' : 'fill-gray-600'}`}
              >
                {d[yKey]}
              </text>
              {/* X label */}
              <text x={x + barWidth / 2} y={height - 5} textAnchor="middle" className={`text-[9px] ${darkMode ? 'fill-gray-500' : 'fill-gray-400'}`}>
                {d[xKey]?.slice(5, 10) || i}
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
            <SVGLineChart data={readinessData} xKey="date" yKey="score" color="#10b981" height={180} yLabel="Score" />
          </div>
          
          <div className={`${theme.card} rounded-xl p-4`}>
            <h3 className={`font-semibold ${theme.text} mb-3`}>Sleep Hours</h3>
            <SVGLineChart data={readinessData} xKey="date" yKey="sleep" color="#8b5cf6" height={180} yLabel="Hours" />
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

          {/* Strength Standards - Summit Progress */}
          <div className={`${theme.card} rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <Mountain size={18} className="text-cyan-500" />
              <h3 className={`font-semibold ${theme.text}`}>Summit Standards</h3>
            </div>
            <p className={`text-xs ${theme.textMuted} mb-4`}>Based on {athleteProfile.weight || 225} lb bodyweight</p>
            <div className="space-y-4">
              {[
                { lift: 'Trap Bar Deadlift', target: 2.0, current: athleteProfile.prs?.trapBarDeadlift?.value, color: '#ef4444' },
                { lift: 'Back Squat', target: 1.5, current: athleteProfile.prs?.backSquat?.value, color: '#f97316' },
                { lift: 'Bench Press', target: 1.25, current: athleteProfile.prs?.benchPress?.value, color: '#06b6d4' },
                { lift: 'Weighted Pull-up', target: 0.5, current: athleteProfile.prs?.weightedPullUp?.value, color: '#8b5cf6' },
              ].map((item, i) => {
                const targetLbs = Math.round((athleteProfile.weight || 225) * item.target);
                const progress = item.current ? Math.min((item.current / targetLbs) * 100, 100) : 0;
                const summited = progress >= 100;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className={`font-medium ${theme.text}`}>{item.lift}</span>
                      <span className={summited ? 'text-emerald-500 font-semibold' : theme.textMuted}>
                        {summited ? '⛰️ ' : ''}{item.current || 0} / {targetLbs} lbs
                      </span>
                    </div>
                    <div className={`relative h-3 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                      {/* Progress bar with gradient */}
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progress}%`,
                          background: summited
                            ? 'linear-gradient(90deg, #10b981, #34d399)'
                            : `linear-gradient(90deg, ${item.color}99, ${item.color})`,
                          boxShadow: summited ? '0 0 10px #10b981' : `0 0 6px ${item.color}50`
                        }}
                      />
                      {/* Milestone markers */}
                      {[25, 50, 75].map(mark => (
                        <div
                          key={mark}
                          className={`absolute top-0 bottom-0 w-px ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}
                          style={{ left: `${mark}%` }}
                        />
                      ))}
                      {/* Summit flag at 100% */}
                      <div className={`absolute top-0 bottom-0 right-0 w-0.5 ${progress >= 100 ? 'bg-emerald-400' : darkMode ? 'bg-gray-500' : 'bg-gray-400'}`} />
                    </div>
                    {/* Progress percentage */}
                    <div className="flex justify-end mt-1">
                      <span className={`text-[10px] font-mono ${summited ? 'text-emerald-500' : theme.textMuted}`}>
                        {Math.round(progress)}%
                      </span>
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

      {/* Equipment Section for Smart Substitutions */}
      <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
        <h3 className={`font-semibold ${theme.text} mb-2`}>My Gym Equipment</h3>
        <p className={`text-xs ${theme.textMuted} mb-4`}>Select what's available. Used for smart exercise swaps.</p>
        <div className="flex flex-wrap gap-2">
          {['barbell', 'dumbbell', 'kettlebell', 'pullupBar', 'bench', 'cable', 'machine', 'trapBar', 'box', 'bands'].map(eq => {
            const isSelected = (profile.availableEquipment || []).includes(eq);
            return (
              <button
                key={eq}
                onClick={() => {
                  setProfile(prev => {
                    const current = prev.availableEquipment || [];
                    const updated = isSelected
                      ? current.filter(e => e !== eq)
                      : [...current, eq];
                    return { ...prev, availableEquipment: updated, lastUpdated: new Date().toISOString() };
                  });
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-500 text-white'
                    : `${theme.cardAlt} ${theme.text} opacity-60`
                }`}
              >
                {EQUIPMENT_TYPES[eq] || eq}
              </button>
            );
          })}
        </div>
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

// ============== RPE DESCRIPTIONS ==============
const RPE_DESCRIPTIONS = {
  6: { label: 'Light', reps: '4+', description: 'Could do 4+ more reps' },
  7: { label: 'Moderate', reps: '3', description: 'Could do 3 more reps' },
  8: { label: 'Hard', reps: '2', description: 'Could do 2 more reps' },
  9: { label: 'Very Hard', reps: '1', description: 'Could do 1 more rep' },
  10: { label: 'Max', reps: '0', description: 'Max effort / failure' }
};

// ============== SET PERFORMANCE MODAL ==============
const SetPerformanceModal = ({ isOpen, onClose, setData, setIdx, onSave, previousSet, targetWeight, theme, darkMode }) => {
  const [weight, setWeightState] = useState('');
  const [reps, setRepsState] = useState('');
  const [rpe, setRpe] = useState('');

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialWeight = setData?.actualWeight || setData?.plannedWeight || targetWeight || '';
      const initialReps = setData?.actualReps || setData?.reps || '';
      const initialRpe = setData?.rpe || '';
      setWeightState(initialWeight !== '' ? Number(initialWeight) : '');
      setRepsState(initialReps !== '' ? Number(initialReps) : '');
      setRpe(initialRpe !== '' ? Number(initialRpe) : '');
    }
  }, [isOpen, setData, targetWeight]);

  if (!isOpen) return null;

  const adjustWeight = (delta) => {
    setWeightState(prev => {
      const current = typeof prev === 'number' ? prev : (parseFloat(prev) || 0);
      return Math.max(0, current + delta);
    });
  };

  const adjustReps = (delta) => {
    setRepsState(prev => {
      const current = typeof prev === 'number' ? prev : (parseInt(prev) || 0);
      return Math.max(0, current + delta);
    });
  };

  const handleSave = () => {
    onSave({
      actualWeight: weight,
      actualReps: reps,
      rpe: rpe,
      completed: true
    });
    onClose();
  };

  const handleClear = () => {
    onSave({
      actualWeight: '',
      actualReps: '',
      rpe: '',
      completed: false
    });
    onClose();
  };

  const copyFromPrevious = () => {
    if (previousSet) {
      const prevWeight = previousSet.actualWeight || previousSet.plannedWeight || '';
      const prevReps = previousSet.actualReps || previousSet.reps || '';
      setWeightState(prevWeight !== '' ? Number(prevWeight) : '');
      setRepsState(prevReps !== '' ? Number(prevReps) : '');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className={`${theme.bg} w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 space-y-6`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className={`text-xl font-bold ${theme.text}`}>Performance</h3>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className={`p-2 rounded-full ${theme.cardAlt} active:scale-95 transition-transform`}
          >
            <X size={20} className={theme.textMuted} />
          </button>
        </div>

        {/* Weight */}
        <div className={`p-4 rounded-xl ${theme.cardAlt}`}>
          <p className="text-red-500 text-sm font-medium text-center mb-2">Weight</p>
          <div className="flex items-center justify-between">
            <button
              onClick={() => adjustWeight(-5)}
              className={`w-14 h-14 rounded-full border-2 border-red-500/50 flex items-center justify-center ${theme.text}`}
            >
              <Minus size={24} />
            </button>
            <div className="text-center flex items-baseline justify-center">
              <input
                type="number"
                inputMode="decimal"
                value={weight === '' ? '' : weight}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setWeightState('');
                  } else {
                    const num = parseFloat(val);
                    if (!isNaN(num) && num >= 0) {
                      setWeightState(num);
                    }
                  }
                }}
                placeholder="0"
                className={`text-5xl font-bold ${theme.text} bg-transparent text-center w-28 outline-none focus:ring-2 focus:ring-red-500/50 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
              />
              <span className={`text-xl ${theme.textMuted} ml-1`}>lb</span>
            </div>
            <button
              onClick={() => adjustWeight(5)}
              className={`w-14 h-14 rounded-full border-2 border-red-500/50 flex items-center justify-center ${theme.text}`}
            >
              <Plus size={24} />
            </button>
          </div>
          {targetWeight && (
            <p className={`text-center text-xs ${theme.textMuted} mt-2`}>Target: {targetWeight} lb</p>
          )}
        </div>

        {/* Reps */}
        <div className={`p-4 rounded-xl ${theme.cardAlt}`}>
          <p className="text-red-500 text-sm font-medium text-center mb-2">Reps</p>
          <div className="flex items-center justify-between">
            <button
              onClick={() => adjustReps(-1)}
              className={`w-14 h-14 rounded-full border-2 border-red-500/50 flex items-center justify-center ${theme.text}`}
            >
              <Minus size={24} />
            </button>
            <span className={`text-5xl font-bold ${theme.text}`}>{reps || '0'}</span>
            <button
              onClick={() => adjustReps(1)}
              className={`w-14 h-14 rounded-full border-2 border-red-500/50 flex items-center justify-center ${theme.text}`}
            >
              <Plus size={24} />
            </button>
          </div>
        </div>

        {/* RPE */}
        <div className={`p-4 rounded-xl ${theme.cardAlt}`}>
          <p className="text-red-500 text-sm font-medium text-center mb-3">Rate of Perceived Exertion</p>
          <div className="flex justify-center gap-2 mb-2">
            {[6, 7, 8, 9, 10].map(value => (
              <button
                key={value}
                onClick={() => setRpe(value)}
                className={`w-12 h-12 rounded-lg font-bold text-lg transition-all ${
                  rpe === value
                    ? 'bg-blue-500 text-white'
                    : `${darkMode ? 'bg-gray-700' : 'bg-gray-200'} ${theme.text}`
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          {rpe && RPE_DESCRIPTIONS[rpe] && (
            <p className={`text-center text-sm ${theme.textMuted}`}>
              {RPE_DESCRIPTIONS[rpe].description}
            </p>
          )}
        </div>

        {/* Copy from previous */}
        {previousSet && setIdx > 0 && (
          <button
            onClick={copyFromPrevious}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl ${theme.cardAlt} ${theme.text} text-sm font-medium`}
          >
            <Copy size={16} /> Copy from Set {setIdx}
          </button>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleClear}
            className={`flex-1 py-4 rounded-xl font-semibold ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
          >
            Clear
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-4 rounded-xl font-semibold bg-red-500 text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// ============== SMART EXERCISE COMPONENT ==============
const SmartExercise = ({ exercise, profile, theme, darkMode, isComplete, onToggle, onSwap, swappedTo, onShowHistory, setData, onSetDataChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingSet, setEditingSet] = useState(null); // { setIdx, data }
  const displayExercise = swappedTo ? EXERCISE_LIBRARY[swappedTo] : null;
  const displayName = displayExercise?.name || exercise.name;

  const workingWeight = exercise.prKey && exercise.percentage && profile.prs?.[exercise.prKey]?.value
    ? calculateWorkingWeight(profile.prs[exercise.prKey].value, exercise.percentage) : null;
  const prValue = exercise.prKey ? profile.prs?.[exercise.prKey]?.value : null;

  // Find the pattern for this exercise - improved lookup with name normalization
  const normalizeExerciseName = (name) => {
    if (!name) return '';
    return name.toLowerCase()
      .replace(/weighted\s*/i, '')  // Remove "weighted" prefix
      .replace(/[-\s]+/g, '_')      // Convert spaces/hyphens to underscores
      .replace(/_+/g, '_')          // Collapse multiple underscores
      .replace(/^_|_$/g, '');       // Trim leading/trailing underscores
  };

  const normalizedName = normalizeExerciseName(exercise.name);
  const originalExerciseId = Object.keys(EXERCISE_LIBRARY).find(k => {
    const libEx = EXERCISE_LIBRARY[k];
    return k === normalizedName ||
           normalizeExerciseName(libEx.name) === normalizedName ||
           libEx.name === exercise.name;
  });
  const exerciseData = EXERCISE_LIBRARY[originalExerciseId];
  const pattern = exerciseData?.pattern;
  const patternInfo = MOVEMENT_PATTERNS[pattern];

  // Parse number of sets
  const numSets = parseInt(exercise.sets) || 3;

  // Get set data for this exercise (or initialize)
  const currentSetData = setData || Array(numSets).fill(null).map((_, i) => ({
    completed: false,
    plannedWeight: workingWeight || '',
    actualWeight: '',
    rpe: ''
  }));

  // Calculate completion percentage
  const completedSets = currentSetData.filter(s => s.completed).length;
  const completionPercent = Math.round((completedSets / numSets) * 100);
  const allSetsComplete = completedSets === numSets;

  // Handle set completion toggle
  const toggleSet = (setIdx) => {
    const newSetData = [...currentSetData];
    newSetData[setIdx] = { ...newSetData[setIdx], completed: !newSetData[setIdx].completed };
    onSetDataChange?.(exercise.name, newSetData);
    // Also update the overall toggle if all complete
    if (newSetData.every(s => s.completed) && !isComplete) {
      onToggle?.();
    }
  };

  // Handle set data update
  const updateSetData = (setIdx, field, value) => {
    const newSetData = [...currentSetData];
    newSetData[setIdx] = { ...newSetData[setIdx], [field]: value };
    onSetDataChange?.(exercise.name, newSetData);
  };

  // Get pattern icon
  const getPatternIcon = (p) => {
    const icons = {
      hinge: '🏋️', squat: '🦵', lunge: '🚶', push: '💪', pull: '🎯',
      vertical_push: '⬆️', vertical_pull: '⬇️', carry: '🧳', rotation: '🔄', core: '🎯'
    };
    return icons[p] || '💪';
  };

  return (
    <div className={`rounded-xl overflow-hidden transition-all duration-300 ${
      allSetsComplete
        ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/10 ring-2 ring-emerald-500/50'
        : `${theme.cardAlt} ring-1 ${darkMode ? 'ring-white/10' : 'ring-black/5'}`
    }`}>
      {/* Header - Collapsible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center gap-3 p-4 text-left transition-all active:scale-[0.99]`}
      >
        {/* Pattern icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
          allSetsComplete
            ? 'bg-emerald-500/20'
            : darkMode ? 'bg-gray-700' : 'bg-gray-100'
        }`}>
          {allSetsComplete ? <CheckCircle2 size={20} className="text-emerald-500" /> : getPatternIcon(pattern)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-semibold ${allSetsComplete ? 'text-emerald-500' : theme.text}`}>{displayName}</p>
            {swappedTo && (
              <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded-full font-medium">
                swapped
              </span>
            )}
          </div>
          <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm mt-1`}>
            {exercise.sets && <span className={`font-medium ${theme.textMuted}`}>{exercise.sets}×{exercise.reps || '—'}</span>}
            {workingWeight && (
              <span className="font-mono font-bold text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded-md text-xs">
                {workingWeight} lb
              </span>
            )}
            {exercise.duration && <span className={theme.textMuted}>{exercise.duration}</span>}
          </div>
        </div>

        {/* Set progress dots */}
        <div className="flex-shrink-0 flex items-center gap-1.5">
          {currentSetData.map((set, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                set.completed
                  ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                  : darkMode ? 'bg-gray-600' : 'bg-gray-300'
              }`}
            />
          ))}
          <ChevronRight
            size={18}
            className={`ml-1 transition-transform duration-300 ${theme.textMuted} ${isExpanded ? 'rotate-90' : ''}`}
          />
        </div>
      </button>

      {/* Expanded Content - Sets */}
      {isExpanded && (
        <div className={`border-t ${theme.border} p-4 space-y-3`}>
          {/* Info row */}
          <div className={`flex flex-wrap gap-2 text-xs ${theme.textMuted} mb-2`}>
            {workingWeight && (
              <span className={`px-2 py-1 rounded ${darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                Target: {workingWeight} lbs ({exercise.percentage}% of {prValue})
              </span>
            )}
            {exercise.rest && <span className={`px-2 py-1 rounded ${theme.cardAlt}`}>Rest: {exercise.rest}</span>}
            {exercise.tempo && <span className={`px-2 py-1 rounded ${theme.cardAlt}`}>Tempo: {exercise.tempo}</span>}
          </div>

          {exercise.progressionNote && (
            <div className={`flex items-center gap-1 text-xs ${darkMode ? 'text-purple-400' : 'text-purple-600'} mb-2`}>
              <TrendingUp size={12} /><span>{exercise.progressionNote}</span>
            </div>
          )}

          {exercise.prKey && !prValue && (
            <div className={`flex items-center gap-1 text-xs ${darkMode ? 'text-amber-400' : 'text-amber-600'} mb-2`}>
              <AlertTriangle size={12} /><span>Set {PR_DISPLAY_NAMES[exercise.prKey]} PR in Profile</span>
            </div>
          )}

          {/* Set rows - Tap to edit */}
          <div className="space-y-2">
            {currentSetData.map((set, setIdx) => (
              <button
                key={setIdx}
                onClick={() => setEditingSet({ setIdx, data: set })}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left active:scale-[0.98] ${
                  set.completed
                    ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/10 ring-1 ring-emerald-500/30'
                    : `${darkMode ? 'bg-gray-800/50' : 'bg-white'} ring-1 ${darkMode ? 'ring-white/5' : 'ring-black/5'} hover:ring-cyan-500/30`
                }`}
              >
                {/* Set number */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${
                  set.completed
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : `${darkMode ? 'bg-gray-700' : 'bg-gray-100'} ${theme.text}`
                }`}>
                  {set.completed ? <Check size={16} strokeWidth={3} /> : setIdx + 1}
                </div>

                {/* Set details */}
                <div className="flex-1">
                  {set.completed || set.actualWeight ? (
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-lg font-bold font-mono ${set.completed ? 'text-emerald-500' : theme.text}`}>
                        {set.actualWeight || set.plannedWeight || workingWeight || '—'}
                        <span className="text-sm font-normal ml-1">lb</span>
                      </span>
                      {set.actualReps && (
                        <span className={`text-sm ${theme.textMuted}`}>× {set.actualReps}</span>
                      )}
                      {set.rpe && (
                        <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                          set.rpe >= 9 ? 'bg-red-500/20 text-red-400' :
                          set.rpe >= 7 ? 'bg-amber-500/20 text-amber-400' :
                          'bg-cyan-500/20 text-cyan-400'
                        }`}>
                          RPE {set.rpe}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${theme.textMuted}`}>Tap to log</span>
                      {workingWeight && (
                        <span className="text-xs font-mono text-cyan-500/70">• {workingWeight} lb target</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Chevron */}
                <ChevronRight size={20} className={theme.textMuted} />
              </button>
            ))}
          </div>

          {/* Performance Modal */}
          <SetPerformanceModal
            isOpen={editingSet !== null}
            onClose={() => setEditingSet(null)}
            setData={editingSet?.data}
            setIdx={editingSet?.setIdx}
            previousSet={editingSet?.setIdx > 0 ? currentSetData[editingSet.setIdx - 1] : null}
            targetWeight={workingWeight}
            theme={theme}
            darkMode={darkMode}
            onSave={(newData) => {
              if (editingSet !== null) {
                const newSetData = [...currentSetData];
                newSetData[editingSet.setIdx] = { ...newSetData[editingSet.setIdx], ...newData };
                onSetDataChange?.(exercise.name, newSetData);
                // Check if all sets are now complete
                if (newSetData.every(s => s.completed) && !isComplete) {
                  onToggle?.();
                }
              }
            }}
          />

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            {onShowHistory && (
              <button
                onClick={() => onShowHistory(exercise)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg ${theme.btnSecondary} text-sm font-medium`}
              >
                <Clock size={14} /> History
              </button>
            )}
            {pattern && onSwap && (
              <button
                onClick={() => onSwap({ name: exercise.name, pattern, originalId: originalExerciseId })}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg ${theme.btnSecondary} text-sm font-medium`}
              >
                <RefreshCw size={14} /> Swap
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============== EXERCISE HISTORY MODAL ==============
const ExerciseHistoryModal = ({ exercise, workoutLogs, profile, onClose, theme, darkMode }) => {
  // Normalize exercise name for matching
  const normalizeForMatch = (name) => {
    if (!name) return '';
    return name.toLowerCase().replace(/weighted\s*/i, '').replace(/[-\s]+/g, '_').trim();
  };
  
  const exerciseName = exercise?.name;
  const normalizedName = normalizeForMatch(exerciseName);
  
  // Find all logs that contain this exercise
  const exerciseHistory = workoutLogs
    .filter(log => log.completed && log.exerciseData)
    .flatMap(log => {
      const matchingExercises = (log.exerciseData || []).filter(ex => 
        normalizeForMatch(ex.name) === normalizedName || 
        ex.name === exerciseName
      );
      return matchingExercises.map(ex => ({
        ...ex,
        date: log.date,
        session: log.session,
        rpe: log.rpe
      }));
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 15);

  // Get PR info if this exercise has a prKey
  const prKey = exercise?.prKey;
  const currentPR = prKey ? profile.prs?.[prKey]?.value : null;
  const prDate = prKey ? profile.prs?.[prKey]?.date : null;
  
  // Calculate stats
  const weights = exerciseHistory.filter(h => h.weight).map(h => h.weight);
  const maxWeight = weights.length > 0 ? Math.max(...weights) : null;
  const avgWeight = weights.length > 0 ? Math.round(weights.reduce((a, b) => a + b, 0) / weights.length) : null;
  const totalSessions = exerciseHistory.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className={`${theme.card} rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`p-4 border-b ${theme.border} flex items-center justify-between`}>
          <div>
            <h2 className={`text-lg font-bold ${theme.text}`}>{exerciseName}</h2>
            <p className={`text-sm ${theme.textMuted}`}>Exercise History</p>
          </div>
          <button onClick={onClose} className={`p-2 ${theme.cardAlt} rounded-lg`}>
            <X size={20} className={theme.text} />
          </button>
        </div>

        {/* Stats Summary */}
        <div className={`p-4 border-b ${theme.border} grid grid-cols-3 gap-3`}>
          <div className={`${theme.cardAlt} rounded-lg p-3 text-center`}>
            <p className={`text-2xl font-bold ${theme.text}`}>{totalSessions}</p>
            <p className={`text-xs ${theme.textMuted}`}>Sessions</p>
          </div>
          {maxWeight && (
            <div className={`${theme.cardAlt} rounded-lg p-3 text-center`}>
              <p className={`text-2xl font-bold ${theme.text}`}>{maxWeight}</p>
              <p className={`text-xs ${theme.textMuted}`}>Max (lbs)</p>
            </div>
          )}
          {currentPR && (
            <div className={`${darkMode ? 'bg-amber-900/30' : 'bg-amber-50'} rounded-lg p-3 text-center`}>
              <p className={`text-2xl font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>{currentPR}</p>
              <p className={`text-xs ${theme.textMuted}`}>PR (lbs)</p>
            </div>
          )}
          {avgWeight && !currentPR && (
            <div className={`${theme.cardAlt} rounded-lg p-3 text-center`}>
              <p className={`text-2xl font-bold ${theme.text}`}>{avgWeight}</p>
              <p className={`text-xs ${theme.textMuted}`}>Avg (lbs)</p>
            </div>
          )}
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4">
          {exerciseHistory.length === 0 ? (
            <div className="text-center py-8">
              <Dumbbell size={48} className={`mx-auto ${theme.textMuted} mb-3 opacity-50`} />
              <p className={theme.textMuted}>No history yet</p>
              <p className={`text-sm ${theme.textSubtle} mt-1`}>Complete workouts with this exercise to build history</p>
            </div>
          ) : (
            <div className="space-y-2">
              {exerciseHistory.map((entry, idx) => (
                <div key={idx} className={`${theme.cardAlt} rounded-lg p-3`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${theme.text}`}>
                      {parseLocalDate(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className={`text-xs ${theme.textMuted}`}>{entry.session}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {entry.weight && (
                      <span className={`font-mono font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        {entry.weight} lbs
                      </span>
                    )}
                    {entry.sets && entry.reps && (
                      <span className={theme.textMuted}>{entry.sets} × {entry.reps}</span>
                    )}
                    {entry.rpe && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        entry.rpe >= 9 ? 'bg-red-500/20 text-red-500' :
                        entry.rpe >= 7 ? 'bg-amber-500/20 text-amber-500' :
                        'bg-green-500/20 text-green-500'
                      }`}>RPE {entry.rpe}</span>
                    )}
                  </div>
                  {entry.notes && (
                    <p className={`text-xs ${theme.textMuted} mt-1 italic`}>{entry.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${theme.border}`}>
          <button
            onClick={onClose}
            className={`w-full py-3 ${theme.btnSecondary} rounded-xl font-medium`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ============== ADD CUSTOM EXERCISE MODAL ==============
const AddCustomExerciseModal = ({ onClose, onSave, editExercise, theme, darkMode }) => {
  const [name, setName] = useState(editExercise?.name || '');
  const [pattern, setPattern] = useState(editExercise?.pattern || 'accessory');
  const [equipment, setEquipment] = useState(editExercise?.equipment || []);
  const [muscles, setMuscles] = useState(editExercise?.muscles || []);
  const [isCardio, setIsCardio] = useState(editExercise?.isCardio || false);
  const [isMobility, setIsMobility] = useState(editExercise?.isMobility || false);

  const MUSCLE_OPTIONS = [
    'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
    'quads', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors',
    'core', 'obliques', 'traps', 'rear delts', 'rotator cuff', 'grip', 'full body'
  ];

  const EQUIPMENT_OPTIONS = [
    'barbell', 'dumbbell', 'kettlebell', 'machine', 'cable', 'bodyweight',
    'pullupBar', 'bench', 'box', 'bands', 'trapBar', 'cardioMachine', 'none'
  ];

  const EQUIPMENT_DISPLAY_NAMES = {
    barbell: 'Barbell',
    dumbbell: 'Dumbbell',
    kettlebell: 'Kettlebell',
    machine: 'Machine',
    cable: 'Cable',
    bodyweight: 'Bodyweight',
    pullupBar: 'Pull-up Bar',
    bench: 'Bench',
    box: 'Box',
    bands: 'Bands',
    trapBar: 'Trap Bar',
    cardioMachine: 'Cardio Machine',
    none: 'None'
  };

  const toggleEquipment = (eq) => {
    setEquipment(prev => prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq]);
  };

  const toggleMuscle = (muscle) => {
    setMuscles(prev => prev.includes(muscle) ? prev.filter(m => m !== muscle) : [...prev, muscle]);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const id = editExercise?.id || `custom_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    const exercise = {
      id,
      name: name.trim(),
      pattern,
      equipment: equipment.length > 0 ? equipment : ['none'],
      muscles: muscles.length > 0 ? muscles : ['full body'],
      isCardio,
      isMobility,
      isCustom: true
    };
    onSave(id, exercise);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className={`${theme.card} rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className={`p-4 border-b ${theme.border} flex items-center justify-between`}>
          <h2 className={`text-lg font-bold ${theme.text}`}>{editExercise ? 'Edit Exercise' : 'Add Custom Exercise'}</h2>
          <button onClick={onClose} className={`p-2 ${theme.cardAlt} rounded-lg`}><X size={20} className={theme.text} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className={`block text-sm font-medium ${theme.textMuted} mb-2`}>Exercise Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Landmine Row" className={`w-full px-4 py-3 rounded-xl border ${theme.input}`} />
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme.textMuted} mb-2`}>Movement Pattern</label>
            <select value={pattern} onChange={(e) => setPattern(e.target.value)} className={`w-full px-4 py-3 rounded-xl border ${theme.input}`}>
              {Object.entries(MOVEMENT_PATTERNS).map(([key, val]) => (
                <option key={key} value={key}>{val.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isCardio} onChange={(e) => setIsCardio(e.target.checked)} className="rounded" />
              <span className={`text-sm ${theme.text}`}>Cardio</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isMobility} onChange={(e) => setIsMobility(e.target.checked)} className="rounded" />
              <span className={`text-sm ${theme.text}`}>Mobility</span>
            </label>
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme.text} mb-2`}>Equipment</label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map(eq => (
                <button key={eq} onClick={() => toggleEquipment(eq)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${equipment.includes(eq) ? 'bg-blue-500 text-white' : theme.chip}`}>
                  {EQUIPMENT_DISPLAY_NAMES[eq] || eq}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme.text} mb-2`}>Target Muscles</label>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_OPTIONS.map(muscle => (
                <button key={muscle} onClick={() => toggleMuscle(muscle)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${muscles.includes(muscle) ? 'bg-green-500 text-white' : theme.chip}`}>
                  {muscle}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={`p-4 border-t ${theme.border} flex gap-3`}>
          <button onClick={onClose} className={`flex-1 py-3 ${theme.btnSecondary} rounded-xl font-medium`}>Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()} className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 rounded-xl font-medium text-white">
            {editExercise ? 'Update' : 'Add Exercise'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============== ONBOARDING COMPONENT ==============
const OnboardingFlow = ({ onComplete, theme, darkMode }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: '⛰️',
      title: 'Welcome to Training Hub',
      subtitle: 'Your complete training companion',
      content: 'Built for serious athletes who demand precision periodization, intelligent load management, and field-ready reliability.',
      features: ['40-week periodized programs', 'Smart load tracking', 'Works offline'],
    },
    {
      icon: '📊',
      title: 'Daily Readiness',
      subtitle: 'Train smarter, not just harder',
      content: 'Check in each morning to track sleep, energy, and recovery. The app adjusts recommendations based on your readiness score.',
      features: ['Sleep & HRV tracking', 'Auto-adjusted intensity', 'Injury prevention'],
    },
    {
      icon: '🏋️',
      title: 'Program Builder',
      subtitle: 'Create or customize programs',
      content: 'Build mesocycles and macrocycles with intelligent periodization. Choose from multiple progression models and training splits.',
      features: ['Phase-based periodization', 'Exercise swapping', '150+ exercises'],
    },
    {
      icon: '📈',
      title: 'Track Progress',
      subtitle: 'Data-driven gains',
      content: 'Log every workout with set-by-set tracking. Monitor training load, spot trends, and see when to push or recover.',
      features: ['PR tracking', 'Load analytics (ATL/CTL)', 'Progress insights'],
    },
    {
      icon: '🧪',
      title: 'Benchmark Tests',
      subtitle: 'Know where you stand',
      content: '14 specialized tests from 5-mile runs to grip endurance. Establish baselines and track improvements over time.',
      features: ['Aerobic & anaerobic tests', 'Strength standards', 'Field assessments'],
    },
  ];

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}>
      <div className={`w-full max-w-md ${theme.card} rounded-2xl overflow-hidden`}>
        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-6 pb-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? 'w-8 bg-blue-500' : i < step ? 'w-2 bg-blue-500/50' : 'w-2 bg-gray-600/50'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-8 text-center">
          <div className="text-6xl mb-4">{currentStep.icon}</div>
          <h2 className={`text-2xl font-bold ${theme.text} mb-2`}>{currentStep.title}</h2>
          <p className="text-blue-400 font-medium mb-4">{currentStep.subtitle}</p>
          <p className={`${theme.textMuted} mb-6`}>{currentStep.content}</p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {currentStep.features.map((feature, i) => (
              <span key={i} className={`px-3 py-1.5 rounded-full text-sm ${theme.chip}`}>
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className={`px-6 pb-6 flex gap-3`}>
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className={`flex-1 py-3 rounded-xl font-medium ${theme.btnSecondary}`}
            >
              Back
            </button>
          )}
          <button
            onClick={() => {
              if (isLast) {
                onComplete();
              } else {
                setStep(step + 1);
              }
            }}
            className={`flex-1 py-3 rounded-xl font-medium bg-blue-500 hover:bg-blue-600 text-white ${step === 0 ? 'w-full' : ''}`}
          >
            {isLast ? "Let's Go!" : 'Next'}
          </button>
        </div>

        {/* Skip */}
        {!isLast && (
          <div className="pb-4 text-center">
            <button onClick={onComplete} className={`text-sm ${theme.textMuted} hover:${theme.text}`}>
              Skip intro
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============== PROGRESSION INSIGHTS COMPONENT ==============
const ProgressionInsights = ({ analyses, profile, setAthleteProfile, theme, darkMode }) => {
  if (!analyses || analyses.length === 0) return null;
  
  const actionableAnalyses = analyses.filter(a => a.recommendation === 'increase' || a.recommendation === 'decrease');
  if (actionableAnalyses.length === 0) return null;
  
  const applyProgression = (analysis) => {
    if (!analysis.suggestedAction || !analysis.prKey) return;
    
    // Update PR if this is an increase and we have a suggested new weight
    if (analysis.recommendation === 'increase' && analysis.suggestedAction.newWeight) {
      const currentPR = profile.prs?.[analysis.prKey]?.value;
      // Only update if new weight would be higher than current PR
      if (!currentPR || analysis.suggestedAction.newWeight > currentPR) {
        setAthleteProfile(prev => ({
          ...prev,
          prs: {
            ...prev.prs,
            [analysis.prKey]: {
              ...prev.prs?.[analysis.prKey],
              value: analysis.suggestedAction.newWeight,
              date: new Date().toISOString().split('T')[0],
              note: 'Auto-adjusted based on progression'
            }
          },
          history: [
            ...(prev.history || []),
            {
              category: 'prs',
              key: analysis.prKey,
              value: analysis.suggestedAction.newWeight,
              date: new Date().toISOString(),
              note: 'Progression adjustment'
            }
          ]
        }));
      }
    }
  };
  
  return (
    <div className={`${theme.card} rounded-xl shadow-sm p-4 border-l-4 ${
      actionableAnalyses.some(a => a.recommendation === 'increase') 
        ? 'border-green-500' 
        : 'border-amber-500'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={18} className={darkMode ? 'text-purple-400' : 'text-purple-600'} />
        <h3 className={`font-semibold ${theme.text}`}>Progression Insights</h3>
      </div>
      <div className="space-y-3">
        {actionableAnalyses.slice(0, 3).map((analysis, idx) => (
          <div key={idx} className={`p-3 ${theme.cardAlt} rounded-lg`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className={`font-medium ${theme.text}`}>{analysis.exerciseName}</p>
                <p className={`text-sm ${theme.textMuted} mt-1`}>
                  {analysis.recommendation === 'increase' ? (
                    <>
                      <span className="text-green-500">↑ Ready to progress</span>
                      {analysis.stats.avgRpe && <span className="ml-2">Avg RPE: {analysis.stats.avgRpe}</span>}
                    </>
                  ) : (
                    <>
                      <span className="text-amber-500">↓ Consider reducing</span>
                      {analysis.stats.completionRate && <span className="ml-2">{analysis.stats.completionRate}% completion</span>}
                    </>
                  )}
                </p>
                {analysis.suggestedAction && (
                  <p className={`text-xs ${theme.textMuted} mt-1`}>
                    Suggested: {analysis.suggestedAction.newWeight} lbs 
                    ({analysis.recommendation === 'increase' ? '+' : '-'}{analysis.suggestedAction.amount}%)
                  </p>
                )}
              </div>
              {analysis.suggestedAction && analysis.recommendation === 'increase' && (
                <button
                  onClick={() => applyProgression(analysis)}
                  className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg font-medium"
                >
                  Apply
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className={`text-xs ${theme.textMuted} mt-3`}>
        Based on last 4 weeks of training data
      </p>
    </div>
  );
};

// ============== HR ZONE & LOAD DISPLAYS ==============
// HRZoneDisplay - Uses new HRZoneViz component in compact mode for workout view
const HRZoneDisplay = ({ hrZone, profile, theme, darkMode }) => {
  return (
    <HRZoneViz
      targetZone={hrZone}
      profile={profile}
      theme={theme}
      darkMode={darkMode}
      compact={true}
    />
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
const ProgramBuilderView = ({ customPrograms, setCustomPrograms, customExercises, athleteProfile, theme }) => {
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
  const [newPhaseTrack, setNewPhaseTrack] = useState('strength');
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exerciseFilter, setExerciseFilter] = useState('all');
  // NEW: Edit mode state
  const [editingProgramId, setEditingProgramId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  // NEW: Preview and copy day state
  const [showPreview, setShowPreview] = useState(false);
  const [previewWeek, setPreviewWeek] = useState(1);
  const [showCopyDayPicker, setShowCopyDayPicker] = useState(null); // { sourceDayIdx: number }
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('all');
  const [muscleFilter, setMuscleFilter] = useState('all');
  const [showSplitPicker, setShowSplitPicker] = useState(false);
  const [showCalendarPreview, setShowCalendarPreview] = useState(false);
  const [showWeekOverride, setShowWeekOverride] = useState(null); // { phaseIdx, weekNum }
  const [showConditionalEditor, setShowConditionalEditor] = useState(null); // { dayIdx, exIdx }

  const ICONS = ['🏋️', '💪', '🏃', '⛰️', '🔥', '⚡', '🎯', '🧗', '🚴', '🏊', '❄️', '🌲'];
  const SESSION_TYPES = [
    { id: 'strength', name: 'Strength', icon: '🏋️' },
    { id: 'cardio', name: 'Cardio', icon: '❤️' },
    { id: 'muscular_endurance', name: 'Muscular Endurance', icon: '🔥' },
    { id: 'mobility', name: 'Mobility', icon: '🧘' },
    { id: 'recovery', name: 'Recovery/Off', icon: '😴' },
  ];
  
  const WARMUP_TEMPLATES = [
    { id: 'none', name: 'None', description: '', duration: 0 },
    { id: 'general', name: 'General (5 min)', description: '5 min light cardio, dynamic stretches', duration: 5 },
    { id: 'upper', name: 'Upper Body (8 min)', description: 'Band pull-aparts, arm circles, cat-cow, thoracic rotations', duration: 8 },
    { id: 'lower', name: 'Lower Body (8 min)', description: 'Leg swings, hip circles, goblet squats, glute bridges', duration: 8 },
    { id: 'full', name: 'Full Body (10 min)', description: 'Light cardio, world\'s greatest stretch, inchworms, jumping jacks', duration: 10 },
    { id: 'cardio', name: 'Cardio Prep (5 min)', description: '5 min easy pace building to workout intensity', duration: 5 },
  ];
  
  const COOLDOWN_TEMPLATES = [
    { id: 'none', name: 'None', description: '', duration: 0 },
    { id: 'quick', name: 'Quick (3 min)', description: 'Light walking, deep breaths', duration: 3 },
    { id: 'stretch', name: 'Static Stretch (5 min)', description: 'Hold major muscle stretches 30s each', duration: 5 },
    { id: 'mobility', name: 'Mobility Flow (8 min)', description: '90/90 stretch, pigeon, couch stretch, foam roll', duration: 8 },
    { id: 'yoga', name: 'Yoga Cool-down (10 min)', description: 'Child\'s pose, downward dog, supine twist, savasana', duration: 10 },
  ];

  // Training Tracks - define the rep/intensity scheme for the phase
  const TRAINING_TRACKS = {
    hypertrophy: {
      id: 'hypertrophy',
      name: 'Hypertrophy',
      icon: '💪',
      description: 'Build muscle mass with moderate weight, higher reps',
      baseReps: '8-12',
      baseSets: 4,
      baseIntensity: 67,
      intensityRange: [65, 75],
      baseRpe: 7,
      color: 'purple',
    },
    strength: {
      id: 'strength',
      name: 'Strength',
      icon: '🏋️',
      description: 'Build maximal strength with heavy weight, lower reps',
      baseReps: '4-6',
      baseSets: 4,
      baseIntensity: 82,
      intensityRange: [80, 92],
      baseRpe: 8,
      color: 'red',
    },
    power: {
      id: 'power',
      name: 'Power',
      icon: '⚡',
      description: 'Explosive strength with moderate weight, low reps',
      baseReps: '2-4',
      baseSets: 5,
      baseIntensity: 78,
      intensityRange: [70, 85],
      baseRpe: 8,
      color: 'yellow',
    },
    endurance: {
      id: 'endurance',
      name: 'Muscular Endurance',
      icon: '🔥',
      description: 'Build work capacity with lighter weight, high reps',
      baseReps: '15-20',
      baseSets: 3,
      baseIntensity: 55,
      intensityRange: [50, 65],
      baseRpe: 7,
      color: 'orange',
    },
    peaking: {
      id: 'peaking',
      name: 'Peaking',
      icon: '🎯',
      description: 'Peak strength for competition with very heavy singles/doubles',
      baseReps: '1-3',
      baseSets: 5,
      baseIntensity: 90,
      intensityRange: [88, 100],
      baseRpe: 9,
      color: 'blue',
    },
  };

  // Training Split Templates
  const SPLIT_TEMPLATES = [
    { 
      id: 'ppl', 
      name: 'Push/Pull/Legs', 
      icon: '💪',
      description: '6 days: Push, Pull, Legs, Push, Pull, Legs, Rest',
      days: [
        { dayName: 'Push A', session: 'Chest, Shoulders, Triceps', type: 'strength', warmup: 'upper' },
        { dayName: 'Pull A', session: 'Back, Biceps, Rear Delts', type: 'strength', warmup: 'upper' },
        { dayName: 'Legs A', session: 'Quads, Hamstrings, Glutes', type: 'strength', warmup: 'lower' },
        { dayName: 'Push B', session: 'Chest, Shoulders, Triceps', type: 'strength', warmup: 'upper' },
        { dayName: 'Pull B', session: 'Back, Biceps, Rear Delts', type: 'strength', warmup: 'upper' },
        { dayName: 'Legs B', session: 'Quads, Hamstrings, Glutes', type: 'strength', warmup: 'lower' },
        { dayName: 'Rest', session: '', type: 'recovery', warmup: 'none' },
      ]
    },
    { 
      id: 'upper_lower', 
      name: 'Upper/Lower', 
      icon: '🔄',
      description: '4 days: Upper, Lower, Rest, Upper, Lower, Rest, Rest',
      days: [
        { dayName: 'Upper A', session: 'Chest, Back, Shoulders, Arms', type: 'strength', warmup: 'upper' },
        { dayName: 'Lower A', session: 'Quads, Hamstrings, Glutes, Calves', type: 'strength', warmup: 'lower' },
        { dayName: 'Rest', session: '', type: 'recovery', warmup: 'none' },
        { dayName: 'Upper B', session: 'Chest, Back, Shoulders, Arms', type: 'strength', warmup: 'upper' },
        { dayName: 'Lower B', session: 'Quads, Hamstrings, Glutes, Calves', type: 'strength', warmup: 'lower' },
        { dayName: 'Cardio', session: 'Zone 2 Aerobic', type: 'cardio', warmup: 'cardio' },
        { dayName: 'Rest', session: '', type: 'recovery', warmup: 'none' },
      ]
    },
    { 
      id: 'full_body', 
      name: 'Full Body 3x', 
      icon: '🏋️',
      description: '3 days: Full Body, Rest, Full Body, Rest, Full Body, Rest, Rest',
      days: [
        { dayName: 'Full Body A', session: 'Squat, Press, Pull', type: 'strength', warmup: 'full' },
        { dayName: 'Cardio', session: 'Zone 2 Aerobic', type: 'cardio', warmup: 'cardio' },
        { dayName: 'Full Body B', session: 'Hinge, Press, Pull', type: 'strength', warmup: 'full' },
        { dayName: 'Rest', session: '', type: 'recovery', warmup: 'none' },
        { dayName: 'Full Body C', session: 'Lunge, Press, Pull', type: 'strength', warmup: 'full' },
        { dayName: 'Cardio', session: 'Zone 2 Aerobic', type: 'cardio', warmup: 'cardio' },
        { dayName: 'Rest', session: '', type: 'recovery', warmup: 'none' },
      ]
    },
    { 
      id: 'tactical', 
      name: 'Tactical/Hybrid', 
      icon: '⚔️',
      description: '5 days: Strength, Cardio, Strength, Cardio, Strength, Ruck, Rest',
      days: [
        { dayName: 'Strength A', session: 'Lower Body Focus', type: 'strength', warmup: 'lower' },
        { dayName: 'Endurance', session: 'Zone 2 Run/Bike', type: 'cardio', warmup: 'cardio' },
        { dayName: 'Strength B', session: 'Upper Body Focus', type: 'strength', warmup: 'upper' },
        { dayName: 'Intervals', session: 'High Intensity Intervals', type: 'cardio', warmup: 'cardio' },
        { dayName: 'Strength C', session: 'Full Body Power', type: 'strength', warmup: 'full' },
        { dayName: 'Ruck', session: 'Loaded March', type: 'muscular_endurance', warmup: 'general' },
        { dayName: 'Rest', session: '', type: 'recovery', warmup: 'none' },
      ]
    },
  ];

  const currentPhase = phases[currentPhaseIdx];
  const totalWeeks = phases.reduce((sum, p) => sum + p.weeks, 0);

  // Check if selected model and track are compatible
  const isCompatibleCombo = isModelCompatibleWithTrack(newPhaseProgression, newPhaseTrack);

  // Get compatible models for the selected track
  const compatibleModelsForTrack = getCompatibleModels(newPhaseTrack);

  const addPhase = () => {
    if (!newPhaseName) return;
    if (!isCompatibleCombo) {
      console.warn(`Model ${newPhaseProgression} is not compatible with track ${newPhaseTrack}`);
      return;
    }

    const startWeek = phases.reduce((sum, p) => sum + p.weeks, 0) + 1;
    const progressionModel = PROGRESSION_MODELS[newPhaseProgression];
    const track = TRAINING_TRACKS[newPhaseTrack];

    // Create base weekly template (shared by all phase types)
    const createBaseTemplate = () => Array(7).fill(null).map((_, i) => ({
      day: i + 1,
      dayName: `Day ${i + 1}`,
      session: '',
      type: 'recovery',
      exercises: [],
      duration: 60,
      cardioZone: 'zone2',
      cardioActivity: 'run',
      warmup: 'none',
      cooldown: 'none',
    }));

    // BLOCK PERIODIZATION: Generate 3 separate phases
    if (newPhaseProgression === 'block') {
      const blockPhases = generateBlockPhases(newPhaseWeeks, newPhaseTrack, startWeek);

      const newPhases = blockPhases.map((blockPhase, idx) => {
        // Calculate week values with track
        const weeklyProgression = blockPhase.weeklyProgression.map(week =>
          calculateWeekValues(week, track)
        );

        return {
          id: blockPhase.id,
          name: blockPhase.name,
          weeks: blockPhase.weeks,
          progression: blockPhase.progression,
          blockId: blockPhase.blockId,
          track: newPhaseTrack,
          weeksRange: blockPhase.weeksRange,
          weeklyProgression,
          weeklyTemplate: createBaseTemplate(),
          weekOverrides: {},
          blockInfo: blockPhase.blockInfo, // Store block characteristics for UI
        };
      });

      setPhases(prev => [...prev, ...newPhases]);
      setNewPhaseName('');
      setNewPhaseWeeks(4);
      return;
    }

    // CONJUGATE: Apply suggested split
    let weeklyTemplate = createBaseTemplate();
    if (newPhaseProgression === 'conjugate' && progressionModel.suggestedSplit) {
      weeklyTemplate = progressionModel.suggestedSplit.days.map((day, i) => ({
        day: i + 1,
        dayName: day.dayName,
        session: day.conjugateType ? PROGRESSION_MODELS.conjugate.dayTypes.find(t => t.id === day.conjugateType)?.name || '' : '',
        type: day.type,
        exercises: [],
        duration: 60,
        cardioZone: 'zone2',
        cardioActivity: 'run',
        warmup: day.type === 'strength' ? 'full' : 'none',
        cooldown: 'none',
        conjugateType: day.conjugateType ? PROGRESSION_MODELS.conjugate.dayTypes.find(t => t.id === day.conjugateType) : null,
      }));
    }

    // STANDARD PHASES: Generate weekly progression
    const rawProgression = progressionModel.generateWeeks(newPhaseWeeks, track);
    const weeklyProgression = rawProgression.map(week => calculateWeekValues(week, track));

    const endWeek = startWeek + newPhaseWeeks - 1;

    setPhases(prev => [...prev, {
      id: `phase_${Date.now()}`,
      name: newPhaseName,
      weeks: newPhaseWeeks,
      progression: newPhaseProgression,
      track: newPhaseTrack,
      weeksRange: [startWeek, endWeek],
      weeklyProgression,
      weeklyTemplate,
      weekOverrides: {},
    }]);
    setNewPhaseName('');
    setNewPhaseWeeks(4);
  };

  // Apply DUP day types when a split template is applied (for DUP phases)
  const applyDupDayTypes = (template) => {
    if (currentPhase?.progression !== 'undulatingDaily') return template;
    return PROGRESSION_MODELS.undulatingDaily.assignDayTypes(template);
  };

  const removePhase = (idx) => setPhases(prev => prev.filter((_, i) => i !== idx));

  // Apply a training split template to the current phase
  const applySplitTemplate = (splitId) => {
    const split = SPLIT_TEMPLATES.find(s => s.id === splitId);
    if (!split || !currentPhase) return;

    let newTemplate = split.days.map((day, i) => ({
      day: i + 1,
      dayName: day.dayName,
      session: day.session,
      type: day.type,
      exercises: [],
      duration: 60,
      cardioZone: 'zone2',
      cardioActivity: 'run',
      warmup: day.warmup || 'none',
      cooldown: 'none',
    }));

    // If this is a DUP phase, apply day type assignments
    if (currentPhase.progression === 'undulatingDaily') {
      newTemplate = PROGRESSION_MODELS.undulatingDaily.assignDayTypes(newTemplate);
    }

    // If this is a Conjugate phase and not using the built-in split, apply structure
    if (currentPhase.progression === 'conjugate') {
      newTemplate = PROGRESSION_MODELS.conjugate.applyConjugateStructure(newTemplate);
    }

    setPhases(prev => prev.map((ph, i) => i === currentPhaseIdx ? { ...ph, weeklyTemplate: newTemplate } : ph));
    setShowSplitPicker(false);
  };

  // Calculate weekly volume per muscle group for current phase
  const getVolumeByMuscle = () => {
    if (!currentPhase) return {};
    
    const volume = {};
    currentPhase.weeklyTemplate.forEach(day => {
      if (day.type === 'recovery' || day.type === 'cardio') return;
      
      (day.exercises || []).forEach(ex => {
        const exerciseData = EXERCISE_LIBRARY[ex.exerciseId];
        if (!exerciseData?.muscles) return;
        
        const sets = ex.sets || 0;
        exerciseData.muscles.forEach(muscle => {
          volume[muscle] = (volume[muscle] || 0) + sets;
        });
      });
    });
    
    return volume;
  };

  // Calculate target weight from PR and percentage
  const getTargetWeight = (exerciseId, percentage) => {
    if (!exerciseId || !percentage) return null;
    
    const exercise = EXERCISE_LIBRARY[exerciseId];
    const prKey = exercise?.prKey;
    if (!prKey) return null;
    
    const pr = athleteProfile.prs?.[prKey];
    if (!pr?.value) return null;
    
    const targetWeight = Math.round((pr.value * percentage) / 100 / 5) * 5; // Round to nearest 5
    return { weight: targetWeight, pr: pr.value, unit: pr.unit || 'lbs' };
  };

  // Set a week override for a specific day
  const setWeekOverride = (phaseIdx, weekNum, dayIdx, overrides) => {
    setPhases(prev => prev.map((ph, i) => {
      if (i !== phaseIdx) return ph;
      const newOverrides = { ...ph.weekOverrides };
      if (!newOverrides[weekNum]) newOverrides[weekNum] = {};
      newOverrides[weekNum][dayIdx] = { ...(newOverrides[weekNum][dayIdx] || {}), ...overrides };
      return { ...ph, weekOverrides: newOverrides };
    }));
  };

  // Clear a week override
  const clearWeekOverride = (phaseIdx, weekNum, dayIdx) => {
    setPhases(prev => prev.map((ph, i) => {
      if (i !== phaseIdx) return ph;
      const newOverrides = { ...ph.weekOverrides };
      if (newOverrides[weekNum]) {
        delete newOverrides[weekNum][dayIdx];
        if (Object.keys(newOverrides[weekNum]).length === 0) delete newOverrides[weekNum];
      }
      return { ...ph, weekOverrides: newOverrides };
    }));
  };

  // Check if a week has any overrides
  const hasWeekOverrides = (phase, weekNum) => {
    return phase?.weekOverrides?.[weekNum] && Object.keys(phase.weekOverrides[weekNum]).length > 0;
  };

  // Get day data with overrides applied
  const getDayWithOverrides = (phase, weekNum, dayIdx) => {
    const baseDay = phase.weeklyTemplate[dayIdx];
    const override = phase?.weekOverrides?.[weekNum]?.[dayIdx];
    if (!override) return baseDay;
    return { ...baseDay, ...override };
  };

  // Duplicate a phase
  const duplicatePhase = (idx) => {
    const sourcePhase = phases[idx];
    const newPhase = {
      ...sourcePhase,
      id: `phase_${Date.now()}`,
      name: `${sourcePhase.name} (Copy)`,
      weeklyTemplate: sourcePhase.weeklyTemplate.map(day => ({
        ...day,
        exercises: (day.exercises || []).map(ex => ({
          ...ex,
          id: `ex_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        })),
      })),
    };
    setPhases(prev => [...prev, newPhase]);
  };

  // Load a program into the editor for editing or duplicating
  const loadProgramForEdit = (programId, isDuplicate = false) => {
    const program = customPrograms[programId];
    if (!program) return;
    
    // Set basic info
    setProgramName(isDuplicate ? `${program.name} (Copy)` : program.name);
    setProgramDescription(program.description || '');
    setProgramIcon(program.icon || '🏋️');
    setProgramType(program.phases?.length > 1 ? 'macro' : 'meso');
    
    // Convert saved phases back to editable format
    const editablePhases = (program.phases || []).map((phase, idx) => {
      // Determine progression model from description or default to linear
      let progression = 'linear';
      if (phase.description?.includes('Undulating')) progression = 'undulatingDaily';
      if (phase.description?.includes('Block')) progression = 'block';
      
      const phaseWeeks = phase.weeks ? (phase.weeks[1] - phase.weeks[0] + 1) : 4;
      
      return {
        id: isDuplicate ? `phase_${Date.now()}_${idx}` : phase.id || `phase_${idx}`,
        name: phase.name,
        weeks: phaseWeeks,
        progression,
        weeksRange: phase.weeks || [1, phaseWeeks],
        weeklyProgression: PROGRESSION_MODELS[progression].generateWeeks(phaseWeeks),
        weeklyTemplate: (phase.weeklyTemplate || []).map((day, dayIdx) => ({
          day: day.day || dayIdx + 1,
          dayName: day.dayName || `Day ${dayIdx + 1}`,
          session: day.session || '',
          type: day.type || 'recovery',
          duration: day.duration || 60,
          cardioZone: day.prescription?.hrZone || 'zone2',
          cardioActivity: 'run',
          warmup: day.warmup || 'none',
          cooldown: day.cooldown || 'none',
          exercises: (day.prescription?.exercises || []).map((ex, exIdx) => ({
            id: `ex_${Date.now()}_${dayIdx}_${exIdx}`,
            exerciseId: Object.keys(EXERCISE_LIBRARY).find(k => EXERCISE_LIBRARY[k].name === ex.name) || null,
            name: ex.name,
            sets: ex.sets || 3,
            reps: ex.reps || '8-10',
            isAmrap: ex.isAmrap || false,
            intensity: ex.percentage || 70,
            rpe: ex.rpe || 7,
            rest: ex.rest || '90',
            tempo: ex.tempo || '',
            notes: ex.notes || '',
            prKey: ex.prKey || null,
            groupId: ex.groupId || null,
            groupType: ex.groupType || null,
            conditional: ex.conditional || null,
          })),
        })),
        weekOverrides: phase.weekOverrides || {},
      };
    });
    
    setPhases(editablePhases);
    setCurrentPhaseIdx(0);
    setEditingProgramId(isDuplicate ? null : programId);
    setStep('details');
  };

  // Delete a custom program
  const deleteProgram = (programId) => {
    setCustomPrograms(prev => {
      const updated = { ...prev };
      delete updated[programId];
      return updated;
    });
    setShowDeleteConfirm(null);
  };

  // Reset editor to initial state
  const resetEditor = () => {
    setStep('type');
    setProgramType(null);
    setProgramName('');
    setProgramDescription('');
    setProgramIcon('🏋️');
    setPhases([]);
    setCurrentPhaseIdx(0);
    setEditingProgramId(null);
    setShowPreview(false);
  };

  // Export a program to JSON
  const exportProgram = (programId) => {
    const program = customPrograms[programId];
    if (!program) return;
    
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      program: program,
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${program.name.replace(/[^a-z0-9]/gi, '_')}_program.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import a program from JSON
  const importProgram = () => {
    try {
      setImportError('');
      const data = JSON.parse(importText);
      
      // Validate structure
      if (!data.program || !data.program.name) {
        throw new Error('Invalid program file: missing program data');
      }
      
      // Create new program with fresh ID
      const importedProgram = {
        ...data.program,
        id: `custom_${Date.now()}`,
        name: `${data.program.name} (Imported)`,
      };
      
      setCustomPrograms(prev => ({ ...prev, [importedProgram.id]: importedProgram }));
      setShowImportModal(false);
      setImportText('');
    } catch (err) {
      setImportError(err.message || 'Failed to parse JSON');
    }
  };

  // Handle file upload for import
  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setImportText(event.target?.result || '');
      setImportError('');
    };
    reader.onerror = () => setImportError('Failed to read file');
    reader.readAsText(file);
  };

  // Copy a day's template to another day
  const copyDayTo = (sourceDayIdx, targetDayIdx) => {
    const sourceDay = currentPhase.weeklyTemplate[sourceDayIdx];
    updateDay(targetDayIdx, {
      session: sourceDay.session,
      type: sourceDay.type,
      duration: sourceDay.duration,
      cardioZone: sourceDay.cardioZone,
      cardioActivity: sourceDay.cardioActivity,
      exercises: (sourceDay.exercises || []).map(ex => ({
        ...ex,
        id: `ex_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      })),
    });
    setShowCopyDayPicker(null);
  };

  // Generate preview data for a specific week
  const getPreviewWeekData = (weekNum) => {
    // Find which phase this week belongs to
    let phaseForWeek = null;
    let weekInPhase = 1;

    for (const phase of phases) {
      if (weekNum >= phase.weeksRange[0] && weekNum <= phase.weeksRange[1]) {
        phaseForWeek = phase;
        weekInPhase = weekNum - phase.weeksRange[0] + 1;
        break;
      }
    }

    if (!phaseForWeek) return null;

    // Get progression data for this week and track defaults
    const weekProgression = phaseForWeek.weeklyProgression?.[weekInPhase - 1] || {};
    const track = TRAINING_TRACKS[phaseForWeek.track] || TRAINING_TRACKS.strength;

    // Apply progression to template
    return {
      phase: phaseForWeek,
      weekNum,
      weekInPhase,
      progression: weekProgression,
      track: track,
      days: phaseForWeek.weeklyTemplate.map(day => {
        if (day.type === 'recovery' || day.type === 'rest') {
          return { ...day, adjustedExercises: [] };
        }

        const adjustedExercises = (day.exercises || []).map(ex => {
          // Use week progression values, falling back to track defaults
          return {
            ...ex,
            adjustedIntensity: weekProgression.intensity || track.baseIntensity,
            adjustedSets: weekProgression.sets || track.baseSets,
            adjustedReps: weekProgression.reps || track.baseReps,
            adjustedRpe: weekProgression.rpe || track.baseRpe,
          };
        });

        return { ...day, adjustedExercises };
      }),
    };
  };

  const updateDay = (dayIdx, updates) => {
    setPhases(prev => prev.map((ph, i) => i === currentPhaseIdx ? {
      ...ph, weeklyTemplate: ph.weeklyTemplate.map((d, di) => di === dayIdx ? { ...d, ...updates } : d)
    } : ph));
  };

  const addExercise = (dayIdx, groupId = null) => {
    const day = currentPhase.weeklyTemplate[dayIdx];
    // Get defaults from the phase's track and periodization model (week 1)
    const track = TRAINING_TRACKS[currentPhase.track] || TRAINING_TRACKS.strength;
    const weekOneProgression = currentPhase.weeklyProgression?.[0] || {};

    // Use track defaults, then periodization overrides if available
    const defaultSets = weekOneProgression.sets || track.baseSets;
    const defaultReps = weekOneProgression.reps || track.baseReps;
    const defaultIntensity = weekOneProgression.intensity || track.baseIntensity;
    const defaultRpe = weekOneProgression.rpe || track.baseRpe;

    updateDay(dayIdx, { exercises: [...(day.exercises || []), { id: `ex_${Date.now()}`, exerciseId: null, name: '', sets: defaultSets, reps: defaultReps, isAmrap: false, intensity: defaultIntensity, rpe: defaultRpe, rest: '90', tempo: '', notes: '', groupId: groupId, groupType: null, conditional: null }] });
  };

  // Create a new superset/circuit group
  const createExerciseGroup = (dayIdx, exIdx, groupType) => {
    const groupId = `group_${Date.now()}`;
    updateExercise(dayIdx, exIdx, { groupId, groupType });
  };

  // Add exercise to existing group
  const addToGroup = (dayIdx, groupId, groupType) => {
    const day = currentPhase.weeklyTemplate[dayIdx];
    const newExercise = { 
      id: `ex_${Date.now()}`, 
      exerciseId: null, 
      name: '', 
      sets: 3, 
      reps: '8-10', 
      intensity: 70, 
      rpe: 7, 
      rest: '0', // No rest between grouped exercises
      tempo: '', 
      notes: '', 
      groupId, 
      groupType 
    };
    
    // Find last exercise in this group and insert after it
    const lastGroupIdx = day.exercises.reduce((last, ex, idx) => ex.groupId === groupId ? idx : last, -1);
    const newExercises = [...day.exercises];
    newExercises.splice(lastGroupIdx + 1, 0, newExercise);
    updateDay(dayIdx, { exercises: newExercises });
  };

  // Remove exercise from group (but keep exercise)
  const removeFromGroup = (dayIdx, exIdx) => {
    updateExercise(dayIdx, exIdx, { groupId: null, groupType: null, rest: '90' });
  };

  // Get grouped exercises for display
  const getGroupedExercises = (exercises) => {
    const groups = [];
    const processed = new Set();
    
    exercises.forEach((ex, idx) => {
      if (processed.has(idx)) return;
      
      if (ex.groupId) {
        // Find all exercises in this group
        const groupExercises = exercises
          .map((e, i) => ({ ...e, originalIndex: i }))
          .filter(e => e.groupId === ex.groupId);
        
        groupExercises.forEach(e => processed.add(e.originalIndex));
        groups.push({
          type: 'group',
          groupId: ex.groupId,
          groupType: ex.groupType,
          exercises: groupExercises,
        });
      } else {
        processed.add(idx);
        groups.push({
          type: 'single',
          exercise: ex,
          originalIndex: idx,
        });
      }
    });
    
    return groups;
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
    setEquipmentFilter('all');
  };

  const selectSwap = (exerciseId) => {
    const { dayIdx, exerciseIdx } = showSwapPicker;
    const exercise = EXERCISE_LIBRARY[exerciseId];
    updateExercise(dayIdx, exerciseIdx, { exerciseId, name: exercise.name, prKey: exercise.prKey || null });
    setShowSwapPicker(null);
  };

  const saveProgram = () => {
    const finalProgram = {
      id: editingProgramId || `custom_${Date.now()}`,
      name: programName,
      description: programDescription,
      icon: programIcon,
      phases: phases.map(phase => ({
        id: phase.id, name: phase.name, weeks: phase.weeksRange,
        description: `${PROGRESSION_MODELS[phase.progression].name} progression`,
        weekOverrides: phase.weekOverrides || {},
        weeklyTemplate: phase.weeklyTemplate.map(day => ({
          day: day.day, dayName: day.dayName, session: day.session, type: day.type, duration: day.duration || 60, warmup: day.warmup || 'none', cooldown: day.cooldown || 'none',
          prescription: day.type === 'cardio' ? { hrZone: day.cardioZone || 'zone2', description: CARDIO_ZONES[day.cardioZone || 'zone2']?.description } : { exercises: (day.exercises || []).map(ex => ({ name: ex.name, sets: ex.sets, reps: ex.reps, isAmrap: ex.isAmrap, percentage: ex.intensity, rpe: ex.rpe, rest: ex.rest, tempo: ex.tempo, notes: ex.notes, prKey: ex.prKey, groupId: ex.groupId, groupType: ex.groupType, conditional: ex.conditional })) },
        })),
      })),
    };
    setCustomPrograms(prev => ({ ...prev, [finalProgram.id]: finalProgram }));
    resetEditor();
  };

  // Get unique equipment from all exercises
  const EQUIPMENT_OPTIONS = [...new Set(Object.values(EXERCISE_LIBRARY).filter(e => !e.isCardio && !e.isMobility).flatMap(e => e.equipment))].sort();
  
  // Get suggested patterns, muscles, and categories based on session name/type and block phase
  const getSuggestedPatternsAndMuscles = () => {
    if (!showExercisePicker) return { patterns: null, muscles: null, categories: null };
    const day = currentPhase?.weeklyTemplate?.[showExercisePicker.dayIdx];
    if (!day) return { patterns: null, muscles: null, categories: null };

    const sessionLower = (day.session || '').toLowerCase();
    const dayNameLower = (day.dayName || '').toLowerCase();
    const combined = `${sessionLower} ${dayNameLower}`;

    // Get recommended categories based on block phase type (accumulation/transmutation/realization)
    const blockId = currentPhase?.blockId;
    const recommendedCategories = blockId ? PHASE_CATEGORY_RECOMMENDATIONS[blockId] : null;

    // Map session keywords to movement patterns and muscles
    // Push movements (chest, shoulders, triceps)
    if (combined.includes('push') || combined.includes('chest') || combined.includes('tricep') || combined.includes('press')) {
      return { patterns: ['horizontalPush', 'verticalPush', 'accessory'], muscles: ['chest', 'shoulders', 'triceps'], categories: recommendedCategories };
    }
    // Pull movements (back, biceps, rear delts)
    if (combined.includes('pull') || combined.includes('back') || combined.includes('bicep') || combined.includes('row')) {
      return { patterns: ['horizontalPull', 'verticalPull', 'accessory'], muscles: ['back', 'biceps', 'rear delts'], categories: recommendedCategories };
    }
    // Lower body
    if (combined.includes('leg') || combined.includes('lower') || combined.includes('quad') || combined.includes('ham') || combined.includes('glute')) {
      return { patterns: ['squat', 'hipHinge', 'lunge', 'accessory'], muscles: ['quads', 'hamstrings', 'glutes', 'calves'], categories: recommendedCategories };
    }
    // Upper body (both push and pull)
    if (combined.includes('upper')) {
      return { patterns: ['horizontalPush', 'verticalPush', 'horizontalPull', 'verticalPull', 'accessory'], muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'], categories: recommendedCategories };
    }
    // Full body
    if (combined.includes('full body') || combined.includes('total') || combined.includes('full-body')) {
      return { patterns: null, muscles: null, categories: recommendedCategories }; // Show all
    }
    // Power/explosive
    if (combined.includes('power') || combined.includes('explosive') || combined.includes('plyometric')) {
      return { patterns: ['squat', 'hipHinge', 'carry', 'accessory'], muscles: ['glutes', 'quads', 'hamstrings', 'core'], categories: recommendedCategories };
    }
    // Shoulder focus
    if (combined.includes('shoulder') || combined.includes('delt')) {
      return { patterns: ['verticalPush', 'horizontalPull', 'accessory'], muscles: ['shoulders', 'rear delts', 'traps'], categories: recommendedCategories };
    }
    // Core/Abs
    if (combined.includes('core') || combined.includes('ab')) {
      return { patterns: ['core', 'accessory', 'carry'], muscles: ['core', 'obliques'], categories: recommendedCategories };
    }
    // Arms focus
    if (combined.includes('arm')) {
      return { patterns: ['accessory', 'horizontalPush', 'horizontalPull'], muscles: ['biceps', 'triceps', 'forearms'], categories: recommendedCategories };
    }
    // Strength (default compound movements)
    if (combined.includes('strength')) {
      return { patterns: ['squat', 'hipHinge', 'horizontalPush', 'verticalPush', 'horizontalPull', 'verticalPull'], muscles: null, categories: recommendedCategories };
    }
    // ME/Circuits
    if (combined.includes('circuit') || combined.includes('me ') || combined.includes('muscular endurance')) {
      return { patterns: ['squat', 'hipHinge', 'lunge', 'horizontalPush', 'horizontalPull', 'carry'], muscles: null, categories: recommendedCategories };
    }
    return { patterns: null, muscles: null, categories: recommendedCategories };
  };

  const { patterns: suggestedPatterns, muscles: suggestedMuscles, categories: suggestedCategories } = getSuggestedPatternsAndMuscles();

  // Merge built-in and custom exercises
  const allExercisesForPicker = { ...EXERCISE_LIBRARY, ...customPrograms };

  // Get unique muscle options from all exercises
  const MUSCLE_FILTER_OPTIONS = [...new Set(Object.values(EXERCISE_LIBRARY).filter(e => !e.isCardio && !e.isMobility).flatMap(e => e.muscles || []))].sort();

  const filteredExercises = Object.values({ ...EXERCISE_LIBRARY, ...customExercises })
    .filter(e => !e.isCardio && !e.isMobility)
    .filter(e => exerciseFilter === 'all' || e.pattern === exerciseFilter)
    .filter(e => equipmentFilter === 'all' || e.equipment.includes(equipmentFilter))
    .filter(e => muscleFilter === 'all' || e.muscles?.includes(muscleFilter))
    .filter(e => e.name.toLowerCase().includes(exerciseSearch.toLowerCase()))
    .sort((a, b) => {
      // If we have suggested patterns/muscles and filters are 'all', sort suggested first
      if (exerciseFilter === 'all') {
        let aScore = 0, bScore = 0;
        // Pattern match
        if (suggestedPatterns) {
          if (suggestedPatterns.includes(a.pattern)) aScore += 2;
          if (suggestedPatterns.includes(b.pattern)) bScore += 2;
        }
        // Muscle match
        if (suggestedMuscles && muscleFilter === 'all') {
          const aMuscleMatch = a.muscles?.some(m => suggestedMuscles.includes(m));
          const bMuscleMatch = b.muscles?.some(m => suggestedMuscles.includes(m));
          if (aMuscleMatch) aScore += 1;
          if (bMuscleMatch) bScore += 1;
        }
        // Category match for block periodization phases (competition lifts first in Realization, etc.)
        if (suggestedCategories) {
          const aCatIdx = suggestedCategories.indexOf(a.category);
          const bCatIdx = suggestedCategories.indexOf(b.category);
          // Lower index = higher priority (competition is first for realization)
          if (aCatIdx !== -1 && bCatIdx === -1) aScore += 3;
          else if (bCatIdx !== -1 && aCatIdx === -1) bScore += 3;
          else if (aCatIdx !== -1 && bCatIdx !== -1) {
            // Both have recommended categories - prefer earlier in list
            if (aCatIdx < bCatIdx) aScore += 1;
            else if (bCatIdx < aCatIdx) bScore += 1;
          }
        }
        if (aScore !== bScore) return bScore - aScore;
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-6">
        {['type', 'details', 'phases', 'template', 'review'].map((s, i) => (
          <div key={s} className={`h-2 flex-1 rounded-full ${['type', 'details', 'phases', 'template', 'review'].indexOf(step) >= i ? 'bg-blue-500' : theme.cardAlt}`} />
        ))}
      </div>

      {step === 'type' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-bold ${theme.text}`}>What do you want to do?</h3>
            <button
              onClick={() => setShowImportModal(true)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${theme.btnSecondary} text-sm font-medium`}
            >
              <Upload size={14} /> Import
            </button>
          </div>
          
          {/* Create New Options */}
          <button onClick={() => { setProgramType('meso'); setStep('details'); }} className={`w-full ${theme.card} rounded-xl p-5 text-left border-2 ${theme.border} hover:border-blue-500`}>
            <div className="flex items-center gap-4"><span className="text-3xl">📦</span><div><p className={`font-bold ${theme.text}`}>New Mesocycle</p><p className={`text-sm ${theme.textMuted}`}>Single training block (3-8 weeks)</p></div></div>
          </button>
          <button onClick={() => { setProgramType('macro'); setStep('details'); }} className={`w-full ${theme.card} rounded-xl p-5 text-left border-2 ${theme.border} hover:border-blue-500`}>
            <div className="flex items-center gap-4"><span className="text-3xl">📅</span><div><p className={`font-bold ${theme.text}`}>New Macrocycle</p><p className={`text-sm ${theme.textMuted}`}>Multiple mesocycles (12-52 weeks)</p></div></div>
          </button>
          
          {/* Manage Existing Programs - only show if there are custom programs */}
          {Object.keys(customPrograms).length > 0 && (
            <>
              <div className={`border-t ${theme.border} my-4`} />
              <h4 className={`font-medium ${theme.text}`}>Your Custom Programs</h4>
              <div className="space-y-2">
                {Object.values(customPrograms).map(prog => (
                  <div key={prog.id} className={`${theme.card} rounded-xl p-4 border ${theme.border}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{prog.icon}</span>
                        <div>
                          <p className={`font-medium ${theme.text}`}>{prog.name}</p>
                          <p className={`text-xs ${theme.textMuted}`}>
                            {prog.phases?.length || 0} phase{prog.phases?.length !== 1 ? 's' : ''} • 
                            {prog.phases?.reduce((sum, p) => sum + (p.weeks?.[1] - p.weeks?.[0] + 1 || 0), 0) || 0} weeks
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => loadProgramForEdit(prog.id, false)} 
                          className={`p-2 rounded-lg ${theme.cardAlt} hover:bg-blue-500/20`}
                          title="Edit"
                        >
                          <Edit3 size={16} className="text-blue-500" />
                        </button>
                        <button 
                          onClick={() => loadProgramForEdit(prog.id, true)} 
                          className={`p-2 rounded-lg ${theme.cardAlt} hover:bg-purple-500/20`}
                          title="Duplicate"
                        >
                          <Copy size={16} className="text-purple-500" />
                        </button>
                        <button 
                          onClick={() => exportProgram(prog.id)} 
                          className={`p-2 rounded-lg ${theme.cardAlt} hover:bg-green-500/20`}
                          title="Export"
                        >
                          <Download size={16} className="text-green-500" />
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(prog.id)} 
                          className={`p-2 rounded-lg ${theme.cardAlt} hover:bg-red-500/20`}
                          title="Delete"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(null)}>
          <div className={`${theme.card} rounded-2xl p-5 max-w-sm w-full`} onClick={e => e.stopPropagation()}>
            <h3 className={`font-bold text-lg ${theme.text} mb-2`}>Delete Program?</h3>
            <p className={`${theme.textMuted} mb-4`}>
              Are you sure you want to delete "{customPrograms[showDeleteConfirm]?.name}"? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(null)} 
                className={`flex-1 py-2 rounded-lg ${theme.cardAlt} ${theme.text}`}
              >
                Cancel
              </button>
              <button 
                onClick={() => deleteProgram(showDeleteConfirm)} 
                className="flex-1 py-2 rounded-lg bg-red-500 text-white font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowImportModal(false); setImportText(''); setImportError(''); }}>
          <div className={`${theme.card} rounded-2xl p-5 max-w-md w-full`} onClick={e => e.stopPropagation()}>
            <h3 className={`font-bold text-lg ${theme.text} mb-2`}>Import Program</h3>
            <p className={`text-sm ${theme.textMuted} mb-4`}>
              Upload a .json file or paste the program JSON below.
            </p>
            
            {/* File Upload */}
            <label className={`block w-full py-3 px-4 mb-3 rounded-lg border-2 border-dashed ${theme.border} text-center cursor-pointer hover:border-blue-500`}>
              <input 
                type="file" 
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
              <Upload size={20} className={`mx-auto mb-1 ${theme.textMuted}`} />
              <span className={`text-sm ${theme.textMuted}`}>Click to upload .json file</span>
            </label>
            
            {/* Or paste JSON */}
            <textarea 
              value={importText} 
              onChange={(e) => { setImportText(e.target.value); setImportError(''); }}
              placeholder='{"version": 1, "program": {...}}'
              rows={5}
              className={`w-full p-3 rounded-lg ${theme.input} border text-sm font-mono mb-3`}
            />
            
            {importError && (
              <p className="text-red-500 text-sm mb-3">{importError}</p>
            )}
            
            <div className="flex gap-3">
              <button 
                onClick={() => { setShowImportModal(false); setImportText(''); setImportError(''); }} 
                className={`flex-1 py-2 rounded-lg ${theme.cardAlt} ${theme.text}`}
              >
                Cancel
              </button>
              <button 
                onClick={importProgram}
                disabled={!importText.trim()}
                className={`flex-1 py-2 rounded-lg font-medium ${importText.trim() ? 'bg-blue-500 text-white' : theme.btnDisabled}`}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'details' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setStep('type')} className={`flex items-center gap-1 ${theme.textMuted}`}>
              <ChevronLeft size={20} /> Back
            </button>
            <h3 className={`text-lg font-bold ${theme.text}`}>
              {editingProgramId ? 'Edit Program' : 'Program Details'}
            </h3>
            <button onClick={resetEditor} className={`text-sm ${theme.textMuted}`}>Cancel</button>
          </div>
          {editingProgramId && (
            <div className={`${theme.cardAlt} rounded-lg p-2 text-center`}>
              <p className={`text-xs ${theme.textMuted}`}>✏️ Editing existing program</p>
            </div>
          )}
          <div><label className={`block text-sm font-medium ${theme.text} mb-2`}>Program Name</label><input type="text" value={programName} onChange={(e) => setProgramName(e.target.value)} placeholder="e.g., Pre-Season Strength" className={`w-full p-3 rounded-lg ${theme.input} border`} /></div>
          <div><label className={`block text-sm font-medium ${theme.text} mb-2`}>Description</label><textarea value={programDescription} onChange={(e) => setProgramDescription(e.target.value)} placeholder="Brief description..." rows={2} className={`w-full p-3 rounded-lg ${theme.input} border`} /></div>
          <div><label className={`block text-sm font-medium ${theme.text} mb-2`}>Icon</label><div className="flex flex-wrap gap-2">{ICONS.map(icon => (<button key={icon} onClick={() => setProgramIcon(icon)} className={`text-2xl p-2 rounded-lg ${programIcon === icon ? 'bg-blue-500' : theme.cardAlt}`}>{icon}</button>))}</div></div>
          <button onClick={() => setStep('phases')} disabled={!programName} className={`w-full py-3 rounded-xl font-medium ${programName ? 'bg-blue-500 text-white' : theme.btnDisabled}`}>Next: {editingProgramId ? 'Edit' : 'Add'} Phases</button>
        </div>
      )}

      {step === 'phases' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setStep('details')} className={`flex items-center gap-1 ${theme.textMuted}`}>
              <ChevronLeft size={20} /> Back
            </button>
            <h3 className={`text-lg font-bold ${theme.text}`}>{programType === 'meso' ? 'Phase Setup' : 'Mesocycles'}</h3>
            <span className={`text-sm ${theme.textMuted}`}>{totalWeeks} weeks total</span>
          </div>
          {phases.map((phase, idx) => (
            <div key={phase.id} className={`${theme.card} rounded-xl p-4 ${phase.blockInfo ? `border-l-4 border-${phase.blockInfo.color}-500` : ''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`font-medium ${theme.text}`}>{phase.name}</p>
                    {phase.blockInfo && (
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-${phase.blockInfo.color}-500/20 text-${phase.blockInfo.color}-400`}>
                        🧱 {phase.blockInfo.shortName}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${theme.textMuted}`}>
                    Weeks {phase.weeksRange[0]}-{phase.weeksRange[1]} •
                    {phase.blockInfo ? ` Block Periodization` : ` ${PROGRESSION_MODELS[phase.progression]?.name || 'Custom'}`}
                  </p>
                  {phase.blockInfo?.description && (
                    <p className={`text-xs ${theme.textMuted} mt-1 italic`}>{phase.blockInfo.description}</p>
                  )}
                  {phase.track && TRAINING_TRACKS[phase.track] && (
                    <p className={`text-xs ${theme.textMuted} mt-1`}>
                      {TRAINING_TRACKS[phase.track].icon} {TRAINING_TRACKS[phase.track].name}: {TRAINING_TRACKS[phase.track].baseReps} @ {TRAINING_TRACKS[phase.track].baseIntensity}%
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setCurrentPhaseIdx(idx); setStep('template'); }} className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium shadow-md">
                    <Edit3 size={14} /> Edit Days
                  </button>
                  <button onClick={() => duplicatePhase(idx)} className={`p-2 rounded-lg ${theme.cardAlt} hover:bg-purple-500/20`} title="Duplicate Phase"><Copy size={16} className="text-purple-500" /></button>
                  <button onClick={() => removePhase(idx)} className={`p-2 rounded-lg ${theme.cardAlt} hover:bg-red-500/20`} title="Delete Phase"><Trash2 size={16} className="text-red-500" /></button>
                </div>
              </div>
            </div>
          ))}
          <div className={`${theme.card} rounded-xl p-4 space-y-4 border-2 border-dashed ${theme.border}`}>
            <p className={`font-medium ${theme.text}`}>Add {programType === 'meso' ? 'Phase' : 'Mesocycle'}</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={`block text-xs ${theme.textMuted} mb-1`}>Name</label><input type="text" value={newPhaseName} onChange={(e) => setNewPhaseName(e.target.value)} placeholder="e.g., Accumulation" className={`w-full p-2 rounded-lg ${theme.input} border text-sm`} /></div>
              <div><label className={`block text-xs ${theme.textMuted} mb-1`}>Weeks</label><input type="number" value={newPhaseWeeks} onChange={(e) => setNewPhaseWeeks(Math.max(1, parseInt(e.target.value) || 1))} min={1} max={12} className={`w-full p-2 rounded-lg ${theme.input} border text-sm`} /></div>
            </div>

            {/* Training Track Selector */}
            <div>
              <label className={`block text-xs ${theme.textMuted} mb-2`}>Training Track</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.values(TRAINING_TRACKS).map(track => (
                  <button
                    key={track.id}
                    onClick={() => setNewPhaseTrack(track.id)}
                    className={`p-2 rounded-lg text-left border-2 ${newPhaseTrack === track.id ? `border-${track.color}-500 bg-${track.color}-500/20` : `border-transparent ${theme.cardAlt}`}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{track.icon}</span>
                      <span className={`text-sm font-medium ${theme.text}`}>{track.name}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className={`mt-2 p-2 rounded-lg ${theme.cardAlt}`}>
                <p className={`text-xs ${theme.textMuted}`}>{TRAINING_TRACKS[newPhaseTrack].description}</p>
                <p className={`text-xs ${theme.text} mt-1`}>
                  <span className="font-medium">Defaults:</span> {TRAINING_TRACKS[newPhaseTrack].baseSets} sets × {TRAINING_TRACKS[newPhaseTrack].baseReps} reps @ {TRAINING_TRACKS[newPhaseTrack].baseIntensity}% • RPE {TRAINING_TRACKS[newPhaseTrack].baseRpe}
                </p>
              </div>
            </div>

            {/* Progression Model Selector */}
            <div>
              <label className={`block text-xs ${theme.text} mb-2`}>Progression Model</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(PROGRESSION_MODELS).map(model => {
                  const isCompatible = model.compatibleTracks?.includes(newPhaseTrack) ?? true;
                  return (
                    <button
                      key={model.id}
                      onClick={() => isCompatible && setNewPhaseProgression(model.id)}
                      disabled={!isCompatible}
                      className={`p-3 rounded-lg text-left relative ${
                        !isCompatible
                          ? 'opacity-40 cursor-not-allowed ' + theme.cardAlt
                          : newPhaseProgression === model.id
                            ? 'bg-blue-500 text-white'
                            : theme.chip
                      }`}
                    >
                      <span className="text-lg mr-2">{model.icon}</span>
                      <span className="text-sm font-medium">{model.name}</span>
                      {!isCompatible && (
                        <span className="absolute top-1 right-1 text-xs text-red-400">✗</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className={`text-xs ${theme.textMuted} mt-2`}>{PROGRESSION_MODELS[newPhaseProgression].description}</p>

              {/* Model-specific info */}
              {newPhaseProgression === 'undulatingDaily' && (
                <div className={`mt-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/30`}>
                  <p className={`text-xs text-blue-400 font-medium mb-1`}>🌊 DUP Day Types</p>
                  <div className="flex flex-wrap gap-1">
                    {PROGRESSION_MODELS.undulatingDaily.dayTypes.map(dt => (
                      <span key={dt.id} className={`text-xs px-2 py-0.5 rounded-full bg-${dt.color}-500/20 text-${dt.color}-400`}>
                        {dt.shortName}: {dt.reps} @ {dt.intensity}%
                      </span>
                    ))}
                  </div>
                  <p className={`text-xs ${theme.textMuted} mt-1`}>Each strength day rotates through these focuses</p>
                </div>
              )}

              {newPhaseProgression === 'block' && (
                <div className={`mt-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30`}>
                  <p className={`text-xs text-yellow-400 font-medium mb-1`}>🧱 Creates 3 Separate Phases ({newPhaseWeeks} weeks total)</p>
                  <div className="flex flex-wrap gap-1">
                    {(() => {
                      const { accumWeeks, transWeeks, realWeeks } = PROGRESSION_MODELS.block.getBlockWeeks(newPhaseWeeks);
                      return [
                        { ...PROGRESSION_MODELS.block.blocks[0], weeks: accumWeeks },
                        { ...PROGRESSION_MODELS.block.blocks[1], weeks: transWeeks },
                        { ...PROGRESSION_MODELS.block.blocks[2], weeks: realWeeks },
                      ].map(b => (
                        <span key={b.id} className={`text-xs px-2 py-0.5 rounded-full bg-${b.color}-500/20 text-${b.color}-400`}>
                          {b.name}: {b.weeks}wk
                        </span>
                      ));
                    })()}
                  </div>
                  <p className={`text-xs ${theme.textMuted} mt-1`}>Each phase can have its own weekly template and exercises</p>
                </div>
              )}

              {newPhaseProgression === 'conjugate' && (
                <div className={`mt-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/30`}>
                  <p className={`text-xs text-purple-400 font-medium mb-1`}>🔀 Conjugate Structure</p>
                  <div className="flex flex-wrap gap-1">
                    {PROGRESSION_MODELS.conjugate.dayTypes.map(dt => (
                      <span key={dt.id} className={`text-xs px-2 py-0.5 rounded-full bg-${dt.color}-500/20 text-${dt.color}-400`}>
                        {dt.shortName}
                      </span>
                    ))}
                  </div>
                  <p className={`text-xs ${theme.textMuted} mt-1`}>4-day split will be auto-configured</p>
                </div>
              )}
            </div>

            {/* Compatibility warning */}
            {!isCompatibleCombo && (
              <div className={`p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2`}>
                <AlertTriangle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className={`text-sm text-red-400 font-medium`}>Incompatible Combination</p>
                  <p className={`text-xs ${theme.textMuted}`}>
                    {PROGRESSION_MODELS[newPhaseProgression].name} doesn't work with {TRAINING_TRACKS[newPhaseTrack].name} track.
                    Try: {compatibleModelsForTrack.map(m => m.name).join(', ')}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={addPhase}
              disabled={!newPhaseName || !isCompatibleCombo}
              className={`w-full py-2 rounded-lg font-medium ${newPhaseName && isCompatibleCombo ? 'bg-green-500 text-white' : theme.btnDisabled}`}
            >
              <Plus size={18} className="inline mr-1" /> Add Phase
            </button>
          </div>
          {phases.length > 0 && (<button onClick={() => setStep('review')} className="w-full py-3 rounded-xl font-medium bg-blue-500 text-white">Review & Save Program</button>)}
        </div>
      )}

      {step === 'template' && currentPhase && (
        <div className="space-y-4">
          <div className="flex items-center justify-between"><button onClick={() => setStep('phases')} className={theme.textMuted}><ChevronLeft size={20} className="inline" /> Back</button><h3 className={`font-bold ${theme.text}`}>{currentPhase.name}</h3><span className={`text-sm ${theme.textMuted}`}>Week 1 of {currentPhase.weeks}</span></div>
          
          {/* Quick Actions: Split Template + Volume Summary */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowSplitPicker(true)}
              className="flex-1 py-2.5 px-4 rounded-lg bg-gray-600/50 hover:bg-gray-500/50 text-gray-200 text-sm font-medium flex items-center justify-center gap-2"
            >
              <Library size={16} className="text-blue-400" /> Apply Split Template
            </button>
          </div>
          
          {/* Volume Tracking Summary */}
          {(() => {
            const volume = getVolumeByMuscle();
            const muscleList = Object.entries(volume).sort((a, b) => b[1] - a[1]);
            if (muscleList.length === 0) return null;
            
            return (
              <div className={`${theme.cardAlt} rounded-lg p-3`}>
                <p className={`text-xs font-medium ${theme.textMuted} mb-2`}>📊 Weekly Volume (sets per muscle)</p>
                <div className="flex flex-wrap gap-2">
                  {muscleList.map(([muscle, sets]) => (
                    <span key={muscle} className={`text-xs px-2 py-1 rounded-full ${
                      sets < 10 ? 'bg-yellow-500/20 text-yellow-500' : 
                      sets > 20 ? 'bg-red-500/20 text-red-500' : 
                      'bg-green-500/20 text-green-500'
                    }`}>
                      {muscle}: {sets}
                    </span>
                  ))}
                </div>
                <p className={`text-xs ${theme.textMuted} mt-2`}>
                  🟢 10-20 optimal | 🟡 &lt;10 low | 🔴 &gt;20 high
                </p>
              </div>
            );
          })()}
          
          <p className={`text-sm ${theme.textMuted}`}>Build Week 1 template. Exercises auto-propagate to all {currentPhase.weeks} weeks with {PROGRESSION_MODELS[currentPhase.progression]?.name || 'Custom'} progression.</p>

          {/* Track & Periodization Info Banner */}
          {currentPhase.weeklyProgression?.[0] && (
            <div className={`${theme.cardAlt} rounded-lg p-3 border-l-4 border-blue-500`}>
              <div className="flex items-center gap-2 mb-2">
                {currentPhase.track && TRAINING_TRACKS[currentPhase.track] && (
                  <span className={`text-xs px-2 py-1 rounded-full bg-${TRAINING_TRACKS[currentPhase.track].color}-500/20 text-${TRAINING_TRACKS[currentPhase.track].color}-400 font-medium`}>
                    {TRAINING_TRACKS[currentPhase.track].icon} {TRAINING_TRACKS[currentPhase.track].name}
                  </span>
                )}
                <span className={`text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 font-medium`}>
                  {PROGRESSION_MODELS[currentPhase.progression]?.icon} {PROGRESSION_MODELS[currentPhase.progression]?.name || 'Custom'}
                </span>
              </div>
              <p className={`text-xs font-medium ${theme.text} mb-1`}>Week 1 Defaults</p>
              <div className="flex flex-wrap gap-3 text-xs">
                {currentPhase.weeklyProgression[0].sets && (
                  <span className={theme.textMuted}>Sets: <span className="text-blue-500 font-medium">{currentPhase.weeklyProgression[0].sets}</span></span>
                )}
                {currentPhase.weeklyProgression[0].reps && (
                  <span className={theme.textMuted}>Reps: <span className="text-blue-500 font-medium">{currentPhase.weeklyProgression[0].reps}</span></span>
                )}
                {currentPhase.weeklyProgression[0].intensity && (
                  <span className={theme.textMuted}>Intensity: <span className="text-blue-500 font-medium">{currentPhase.weeklyProgression[0].intensity}%</span></span>
                )}
                {currentPhase.weeklyProgression[0].rpe && (
                  <span className={theme.textMuted}>RPE: <span className="text-blue-500 font-medium">{currentPhase.weeklyProgression[0].rpe}</span></span>
                )}
                {currentPhase.weeklyProgression[0].focus && (
                  <span className={theme.textMuted}>Focus: <span className="text-purple-500 font-medium">{currentPhase.weeklyProgression[0].focus}</span></span>
                )}
              </div>
              <p className={`text-xs ${theme.textMuted} mt-1 italic`}>New exercises use these defaults. Weeks auto-progress per model.</p>
            </div>
          )}
          {currentPhase.weeklyTemplate.map((day, dayIdx) => (
            <div key={day.day} className={`${theme.card} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <input type="text" value={day.dayName} onChange={(e) => updateDay(dayIdx, { dayName: e.target.value })} className={`font-medium ${theme.text} bg-transparent border-b ${theme.border} w-24`} />
                  {/* DUP Day Type Badge */}
                  {day.dupType && (
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-${day.dupType.color}-500/20 text-${day.dupType.color}-400 font-medium`}>
                      {day.dupType.shortName}
                    </span>
                  )}
                  {/* Conjugate Day Type Badge */}
                  {day.conjugateType && (
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-${day.conjugateType.color}-500/20 text-${day.conjugateType.color}-400 font-medium`}>
                      {day.conjugateType.shortName}
                    </span>
                  )}
                  {/* Copy Day Button */}
                  {(day.type !== 'recovery' && (day.exercises?.length > 0 || day.type === 'cardio')) && (
                    <button
                      onClick={() => setShowCopyDayPicker({ sourceDayIdx: dayIdx })}
                      className={`p-1 rounded ${theme.cardAlt} hover:bg-blue-500/20`}
                      title="Copy to another day"
                    >
                      <Copy size={14} className="text-blue-500" />
                    </button>
                  )}
                </div>
                <select value={day.type} onChange={(e) => updateDay(dayIdx, { type: e.target.value, session: SESSION_TYPES.find(s => s.id === e.target.value)?.name || '' })} className={`p-2 rounded-lg ${theme.input} text-sm`}>{SESSION_TYPES.map(t => (<option key={t.id} value={t.id}>{t.icon} {t.name}</option>))}</select>
              </div>
              {/* DUP/Conjugate Day Info Banner */}
              {(day.dupType || day.conjugateType) && day.type === 'strength' && (
                <div className={`mb-3 p-2 rounded-lg ${day.dupType ? `bg-${day.dupType.color}-500/10` : `bg-${day.conjugateType.color}-500/10`} border border-dashed ${day.dupType ? `border-${day.dupType.color}-500/30` : `border-${day.conjugateType.color}-500/30`}`}>
                  {day.dupType && (
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium text-${day.dupType.color}-400`}>
                        {day.dupType.name} Focus
                      </span>
                      <span className={`text-xs ${theme.textMuted}`}>
                        {day.dupType.sets}×{day.dupType.reps} @ {day.dupType.intensity}% RPE {day.dupType.rpe}
                      </span>
                    </div>
                  )}
                  {day.conjugateType && (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium text-${day.conjugateType.color}-400`}>
                          {day.conjugateType.name}
                        </span>
                        <span className={`text-xs ${theme.textMuted}`}>
                          {day.conjugateType.prescription?.mainLift || ''}
                        </span>
                      </div>
                      {day.conjugateType.prescription?.note && (
                        <p className={`text-xs ${theme.textMuted} mt-1 italic`}>{day.conjugateType.prescription.note}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              {day.type !== 'recovery' && (
                <>
                  <input type="text" value={day.session} onChange={(e) => updateDay(dayIdx, { session: e.target.value })} placeholder="Session name (e.g., Upper Body A)" className={`w-full p-2 rounded-lg ${theme.input} border text-sm mb-3`} />
                  
                  {/* Warmup/Cooldown selectors */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className={`text-xs ${theme.textMuted}`}>Warm-up</label>
                      <select 
                        value={day.warmup || 'none'} 
                        onChange={(e) => updateDay(dayIdx, { warmup: e.target.value })}
                        className={`w-full p-1.5 rounded-lg ${theme.input} text-xs`}
                      >
                        {WARMUP_TEMPLATES.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={`text-xs ${theme.textMuted}`}>Cool-down</label>
                      <select 
                        value={day.cooldown || 'none'} 
                        onChange={(e) => updateDay(dayIdx, { cooldown: e.target.value })}
                        className={`w-full p-1.5 rounded-lg ${theme.input} text-xs`}
                      >
                        {COOLDOWN_TEMPLATES.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
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
                      {(day.exercises || []).map((ex, exIdx) => {
                        const isInGroup = ex.groupId;
                        const isFirstInGroup = isInGroup && (exIdx === 0 || day.exercises[exIdx - 1]?.groupId !== ex.groupId);
                        const isLastInGroup = isInGroup && (exIdx === day.exercises.length - 1 || day.exercises[exIdx + 1]?.groupId !== ex.groupId);
                        const groupColor = ex.groupType === 'superset' ? 'border-l-orange-500' : ex.groupType === 'circuit' ? 'border-l-purple-500' : '';
                        
                        return (
                          <div key={ex.id} className={`${theme.cardAlt} rounded-lg p-3 ${isInGroup ? `border-l-4 ${groupColor}` : ''} ${isInGroup && !isLastInGroup ? 'mb-0 rounded-b-none' : ''} ${isInGroup && !isFirstInGroup ? 'mt-0 rounded-t-none border-t border-dashed' : ''}`}>
                            {/* Group Header */}
                            {isFirstInGroup && (
                              <div className={`text-xs font-medium mb-2 flex items-center justify-between ${ex.groupType === 'superset' ? 'text-orange-500' : 'text-purple-500'}`}>
                                <span>{ex.groupType === 'superset' ? '⚡ Superset' : '🔄 Circuit'}</span>
                                <button onClick={() => removeFromGroup(dayIdx, exIdx)} className="text-xs opacity-70 hover:opacity-100">Remove grouping</button>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between mb-2">
                              <button onClick={() => setShowExercisePicker({ dayIdx, exerciseIdx: exIdx })} className={`text-sm font-medium ${ex.exerciseId ? theme.text : 'text-blue-500'}`}>{ex.exerciseId ? EXERCISE_LIBRARY[ex.exerciseId]?.name || ex.name : '+ Select Exercise'}</button>
                              <div className="flex gap-1">
                                {ex.exerciseId && !isInGroup && (
                                  <>
                                    <button onClick={() => createExerciseGroup(dayIdx, exIdx, 'superset')} className={`p-1 ${theme.iconMuted} hover:text-orange-500`} title="Start Superset"><Zap size={14} /></button>
                                    <button onClick={() => createExerciseGroup(dayIdx, exIdx, 'circuit')} className={`p-1 ${theme.iconMuted} hover:text-purple-500`} title="Start Circuit"><RefreshCw size={14} /></button>
                                  </>
                                )}
                                {ex.exerciseId && (
                                  <button
                                    onClick={() => setShowConditionalEditor({ dayIdx, exIdx })}
                                    className={`p-1 ${ex.conditional ? 'text-yellow-500' : theme.iconMuted} hover:text-yellow-500`}
                                    title="Conditional Logic"
                                  >
                                    <GitBranch size={14} />
                                  </button>
                                )}
                                {ex.exerciseId && (<button onClick={() => setShowSwapPicker({ dayIdx, exerciseIdx: exIdx, currentExerciseId: ex.exerciseId })} className={`p-1 ${theme.iconMuted} hover:text-blue-500`} title="Swap"><RotateCcw size={14} /></button>)}
                                <button onClick={() => removeExercise(dayIdx, exIdx)} className="p-1 text-red-500"><Trash2 size={14} /></button>
                              </div>
                            </div>
                            
                            {/* Conditional Badge */}
                            {ex.conditional && (
                              <div className="mb-2 text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded flex items-center gap-1">
                                <GitBranch size={12} />
                                <span>If {ex.conditional.condition}: {ex.conditional.action}</span>
                              </div>
                            )}
                            {/* Row 1: Sets, Reps, %1RM, RPE */}
                            <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                              <div><label className={theme.textMuted}>Sets</label><input type="number" value={ex.sets} onChange={(e) => updateExercise(dayIdx, exIdx, { sets: parseInt(e.target.value) || 3 })} className={`w-full p-1 rounded ${theme.input}`} /></div>
                              <div>
                                <label className={theme.textMuted}>Reps</label>
                                <div className="flex gap-1">
                                  {ex.isAmrap ? (
                                    <span className={`flex-1 p-1 rounded ${theme.input} text-center font-medium text-green-500`}>AMRAP</span>
                                  ) : (
                                    <input type="text" value={ex.reps} onChange={(e) => updateExercise(dayIdx, exIdx, { reps: e.target.value })} className={`flex-1 p-1 rounded ${theme.input} min-w-0`} />
                                  )}
                                  <button 
                                    onClick={() => updateExercise(dayIdx, exIdx, { isAmrap: !ex.isAmrap })}
                                    className={`px-1 rounded text-[10px] font-bold ${ex.isAmrap ? 'bg-green-500 text-white' : theme.cardAlt}`}
                                    title="As Many Reps As Possible"
                                  >
                                    ∞
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className={theme.textMuted}>%1RM</label>
                                <input type="number" value={ex.intensity} onChange={(e) => updateExercise(dayIdx, exIdx, { intensity: parseInt(e.target.value) || 70 })} className={`w-full p-1 rounded ${theme.input}`} />
                                {(() => {
                                  const target = getTargetWeight(ex.exerciseId, ex.intensity);
                                  if (!target) return null;
                                  return (
                                    <p className="text-[10px] text-green-500 mt-0.5 font-medium">
                                      ≈ {target.weight} {target.unit}
                                    </p>
                                  );
                                })()}
                              </div>
                              <div><label className={theme.textMuted}>RPE</label><input type="number" value={ex.rpe} onChange={(e) => updateExercise(dayIdx, exIdx, { rpe: parseInt(e.target.value) || 7 })} min={1} max={10} className={`w-full p-1 rounded ${theme.input}`} /></div>
                            </div>
                            {/* Row 2: Tempo, Rest, Notes */}
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <label className={theme.textMuted}>Tempo</label>
                                <input 
                                  type="text" 
                                  value={ex.tempo || ''} 
                                  onChange={(e) => updateExercise(dayIdx, exIdx, { tempo: e.target.value })} 
                                  placeholder="3-1-2-0"
                                  className={`w-full p-1 rounded ${theme.input}`} 
                                />
                              </div>
                              <div>
                                <label className={theme.textMuted}>Rest {isInGroup && !isLastInGroup ? '(between)' : ''}</label>
                                <select 
                                  value={ex.rest || '90'} 
                                  onChange={(e) => updateExercise(dayIdx, exIdx, { rest: e.target.value })}
                                  className={`w-full p-1 rounded ${theme.input}`}
                                >
                                  <option value="0">None</option>
                                  <option value="30">30s</option>
                                  <option value="45">45s</option>
                                  <option value="60">60s</option>
                                  <option value="90">90s</option>
                                  <option value="120">2 min</option>
                                  <option value="180">3 min</option>
                                  <option value="240">4 min</option>
                                  <option value="300">5 min</option>
                                </select>
                              </div>
                              <div>
                                <label className={theme.textMuted}>Notes</label>
                                <input 
                                  type="text" 
                                  value={ex.notes || ''} 
                                  onChange={(e) => updateExercise(dayIdx, exIdx, { notes: e.target.value })} 
                                  placeholder="Cues..."
                                  className={`w-full p-1 rounded ${theme.input}`} 
                                />
                              </div>
                            </div>
                            
                            {/* Add to group button */}
                            {isLastInGroup && (
                              <button 
                                onClick={() => addToGroup(dayIdx, ex.groupId, ex.groupType)}
                                className={`w-full mt-2 py-1 text-xs border border-dashed rounded ${ex.groupType === 'superset' ? 'border-orange-500/50 text-orange-500' : 'border-purple-500/50 text-purple-500'}`}
                              >
                                + Add to {ex.groupType}
                              </button>
                            )}
                          </div>
                        );
                      })}
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
          <div className="flex items-center justify-between">
            <button onClick={() => setStep('phases')} className={`flex items-center gap-1 ${theme.textMuted}`}>
              <ChevronLeft size={20} /> Back
            </button>
            <h3 className={`text-lg font-bold ${theme.text}`}>Review Program</h3>
            <button onClick={resetEditor} className={`text-sm ${theme.textMuted}`}>Cancel</button>
          </div>
          {editingProgramId && (
            <div className={`${theme.cardAlt} rounded-lg p-2 text-center`}>
              <p className={`text-xs ${theme.textMuted}`}>✏️ Updating existing program</p>
            </div>
          )}
          <div className={`${theme.card} rounded-xl p-5`}>
            <div className="flex items-center gap-3 mb-4"><span className="text-4xl">{programIcon}</span><div><h4 className={`text-xl font-bold ${theme.text}`}>{programName}</h4><p className={`text-sm ${theme.textMuted}`}>{programDescription}</p></div></div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className={`${theme.cardAlt} rounded-lg p-3 text-center`}><p className={`text-2xl font-bold ${theme.text}`}>{totalWeeks}</p><p className={`text-xs ${theme.textMuted}`}>Total Weeks</p></div>
              <div className={`${theme.cardAlt} rounded-lg p-3 text-center`}><p className={`text-2xl font-bold ${theme.text}`}>{phases.length}</p><p className={`text-xs ${theme.textMuted}`}>Phases</p></div>
            </div>
            {phases.map((phase) => (<div key={phase.id} className={`${theme.cardAlt} rounded-lg p-3 mb-2`}><div className="flex justify-between items-center"><div><p className={`font-medium ${theme.text}`}>{phase.name}</p><p className={`text-xs ${theme.textMuted}`}>Weeks {phase.weeksRange[0]}-{phase.weeksRange[1]} • {PROGRESSION_MODELS[phase.progression].name}</p></div><p className={`text-sm ${theme.textMuted}`}>{phase.weeks} wks</p></div></div>))}
          </div>
          
          {/* Preview Buttons */}
          <div className="flex gap-2">
            <button 
              onClick={() => { setPreviewWeek(1); setShowPreview(true); }} 
              className={`flex-1 py-3 rounded-xl font-medium ${theme.card} ${theme.text} border ${theme.border} flex items-center justify-center gap-2`}
            >
              <Play size={18} /> Week View
            </button>
            <button 
              onClick={() => setShowCalendarPreview(true)} 
              className={`flex-1 py-3 rounded-xl font-medium ${theme.card} ${theme.text} border ${theme.border} flex items-center justify-center gap-2`}
            >
              <Calendar size={18} /> Calendar View
            </button>
          </div>
          
          <div className="flex gap-3">
            <button onClick={() => setStep('phases')} className={`flex-1 py-3 rounded-xl font-medium ${theme.cardAlt} ${theme.text}`}>Edit</button>
            <button onClick={saveProgram} className="flex-1 py-3 rounded-xl font-medium bg-green-500 text-white">
              {editingProgramId ? 'Update Program' : 'Save Program'}
            </button>
          </div>
        </div>
      )}

      {showExercisePicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className={`${theme.bg} w-full rounded-t-2xl p-4 max-h-[80vh] overflow-auto`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`font-bold ${theme.text}`}>Select Exercise</h3>
                {suggestedPatterns && (
                  <p className={`text-xs text-blue-500`}>
                    ★ Suggested for {currentPhase?.weeklyTemplate?.[showExercisePicker.dayIdx]?.session || currentPhase?.weeklyTemplate?.[showExercisePicker.dayIdx]?.dayName}
                  </p>
                )}
              </div>
              <button onClick={() => { setShowExercisePicker(null); setExerciseSearch(''); setExerciseFilter('all'); setEquipmentFilter('all'); setMuscleFilter('all'); }}><X size={24} className={theme.text} /></button>
            </div>
            <input type="text" placeholder="Search exercises..." value={exerciseSearch} onChange={(e) => setExerciseSearch(e.target.value)} className={`w-full p-3 rounded-lg ${theme.input} border mb-3`} />

            {/* Movement Pattern Filter */}
            <div className="flex flex-wrap gap-2 mb-3">
              <button onClick={() => setExerciseFilter('all')} className={`px-3 py-1.5 rounded-full text-sm font-medium ${exerciseFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-600/50 text-gray-200 hover:bg-gray-500/50'}`}>All</button>
              {Object.values(MOVEMENT_PATTERNS).filter(p => p.id !== 'cardio' && p.id !== 'mobility').map(pattern => (
                <button key={pattern.id} onClick={() => setExerciseFilter(pattern.id)} className={`px-3 py-1.5 rounded-full text-sm font-medium ${exerciseFilter === pattern.id ? 'bg-blue-500 text-white' : 'bg-gray-600/50 text-gray-200 hover:bg-gray-500/50'}`}>{pattern.icon} {pattern.name}</button>
              ))}
            </div>

            {/* Muscle Group Filter */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`text-sm font-medium ${theme.text} self-center mr-1`}>Muscles:</span>
              <button onClick={() => setMuscleFilter('all')} className={`px-2.5 py-1 rounded-full text-xs font-medium ${muscleFilter === 'all' ? 'bg-purple-500 text-white' : 'bg-gray-600/50 text-gray-200 hover:bg-gray-500/50'}`}>All</button>
              {suggestedMuscles && suggestedMuscles.map(muscle => (
                <button key={muscle} onClick={() => setMuscleFilter(muscle)} className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${muscleFilter === muscle ? 'bg-purple-500 text-white' : 'bg-purple-500/30 text-purple-300 hover:bg-purple-500/40'}`}>★ {muscle}</button>
              ))}
              {MUSCLE_FILTER_OPTIONS.filter(m => !suggestedMuscles?.includes(m)).slice(0, 12).map(muscle => (
                <button key={muscle} onClick={() => setMuscleFilter(muscle)} className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${muscleFilter === muscle ? 'bg-purple-500 text-white' : 'bg-gray-600/50 text-gray-200 hover:bg-gray-500/50'}`}>{muscle}</button>
              ))}
            </div>

            {/* Equipment Filter */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`text-sm font-medium ${theme.text} self-center mr-1`}>Equipment:</span>
              <button onClick={() => setEquipmentFilter('all')} className={`px-2.5 py-1 rounded-full text-xs font-medium ${equipmentFilter === 'all' ? 'bg-green-500 text-white' : 'bg-gray-600/50 text-gray-200 hover:bg-gray-500/50'}`}>All</button>
              {EQUIPMENT_OPTIONS.map(eq => (
                <button key={eq} onClick={() => setEquipmentFilter(eq)} className={`px-2.5 py-1 rounded-full text-xs font-medium ${equipmentFilter === eq ? 'bg-green-500 text-white' : 'bg-gray-600/50 text-gray-200 hover:bg-gray-500/50'}`}>{eq}</button>
              ))}
            </div>

            <div className="space-y-2 max-h-[40vh] overflow-auto">
              {filteredExercises.length === 0 ? (
                <p className={`text-center py-4 ${theme.textMuted}`}>No exercises match your filters</p>
              ) : (
                filteredExercises.map(ex => {
                  const isSuggested = suggestedPatterns?.includes(ex.pattern) || (suggestedMuscles && ex.muscles?.some(m => suggestedMuscles.includes(m)));
                  const isRecommendedCategory = suggestedCategories && suggestedCategories.includes(ex.category);
                  const categoryPriority = suggestedCategories?.indexOf(ex.category);
                  const isTopCategory = categoryPriority === 0; // First in recommended list (e.g., competition in Realization)
                  return (
                    <button key={ex.id} onClick={() => selectExercise(ex.id)} className={`w-full p-3 ${theme.card} rounded-lg text-left hover:bg-gray-700/50 ${isSuggested ? 'border-l-4 border-blue-500' : ''} ${isTopCategory ? 'border-l-4 border-yellow-500' : ''} ${ex.isCustom ? 'border-r-4 border-green-500' : ''}`}>
                      <p className={`font-medium ${theme.text} flex items-center gap-1`}>
                        {isSuggested && !isTopCategory && <span className="text-blue-400">★</span>}
                        {isTopCategory && <span className="text-yellow-400">★</span>}
                        <span>{ex.name}</span>
                        {ex.isCustom && <span className="ml-2 text-xs text-green-400">(Custom)</span>}
                        {isTopCategory && currentPhase?.blockId && (
                          <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                            {ex.category === 'competition' ? '🏆 Competition' : ex.category === 'gpp' ? '🔧 GPP' : ex.category}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-400">{MOVEMENT_PATTERNS[ex.pattern]?.name} • {ex.muscles?.slice(0, 3).join(', ')}</p>
                    </button>
                  );
                })
              )}
            </div>
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

      {/* Split Template Picker Modal */}
      {showSplitPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSplitPicker(false)}>
          <div className={`${theme.card} rounded-2xl p-5 max-w-md w-full max-h-[80vh] overflow-auto`} onClick={e => e.stopPropagation()}>
            <h3 className={`font-bold text-lg ${theme.text} mb-2`}>Apply Training Split</h3>
            <p className={`text-sm ${theme.textMuted} mb-4`}>
              Choose a split template. This will replace your current day structure.
            </p>
            <div className="space-y-3">
              {SPLIT_TEMPLATES.map(split => (
                <button
                  key={split.id}
                  onClick={() => applySplitTemplate(split.id)}
                  className={`w-full p-4 ${theme.cardAlt} rounded-xl text-left hover:border-blue-500 border-2 border-transparent`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{split.icon}</span>
                    <div>
                      <p className={`font-bold ${theme.text}`}>{split.name}</p>
                      <p className={`text-xs ${theme.textMuted}`}>{split.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {split.days.map((day, i) => (
                      <span key={i} className={`text-xs px-2 py-0.5 rounded ${
                        day.type === 'strength' ? 'bg-blue-500/20 text-blue-400' :
                        day.type === 'cardio' ? 'bg-red-500/20 text-red-400' :
                        day.type === 'muscular_endurance' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {day.dayName}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowSplitPicker(false)} 
              className={`w-full mt-4 py-2 rounded-lg ${theme.cardAlt} ${theme.text}`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Copy Day Picker Modal */}
      {showCopyDayPicker && currentPhase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCopyDayPicker(null)}>
          <div className={`${theme.card} rounded-2xl p-5 max-w-sm w-full`} onClick={e => e.stopPropagation()}>
            <h3 className={`font-bold text-lg ${theme.text} mb-2`}>Copy Day To...</h3>
            <p className={`text-sm ${theme.textMuted} mb-4`}>
              Copy "{currentPhase.weeklyTemplate[showCopyDayPicker.sourceDayIdx]?.dayName}" to:
            </p>
            <div className="space-y-2">
              {currentPhase.weeklyTemplate.map((day, idx) => (
                idx !== showCopyDayPicker.sourceDayIdx && (
                  <button
                    key={idx}
                    onClick={() => copyDayTo(showCopyDayPicker.sourceDayIdx, idx)}
                    className={`w-full p-3 ${theme.cardAlt} rounded-lg text-left hover:bg-blue-500/20`}
                  >
                    <p className={`font-medium ${theme.text}`}>{day.dayName}</p>
                    <p className={`text-xs ${theme.textMuted}`}>
                      {day.type === 'recovery' ? 'Rest Day' : day.session || 'Empty'}
                    </p>
                  </button>
                )
              ))}
            </div>
            <button 
              onClick={() => setShowCopyDayPicker(null)} 
              className={`w-full mt-4 py-2 rounded-lg ${theme.cardAlt} ${theme.text}`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Program Preview Modal */}
      {showPreview && phases.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-auto">
          <div className={`${theme.bg} min-h-full md:min-h-0 md:max-w-2xl md:mx-auto md:my-8 md:rounded-2xl`}>
            {/* Header */}
            <div className={`sticky top-0 ${theme.card} border-b ${theme.border} p-4 flex items-center justify-between z-10`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{programIcon}</span>
                <div>
                  <h2 className={`font-bold ${theme.text}`}>{programName}</h2>
                  <p className={`text-xs ${theme.textMuted}`}>Preview Mode</p>
                </div>
              </div>
              <button onClick={() => setShowPreview(false)} className={`p-2 rounded-lg ${theme.cardAlt}`}>
                <X size={24} className={theme.text} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Week Navigation */}
              <div className={`${theme.card} rounded-xl p-3 flex items-center justify-between`}>
                <button
                  onClick={() => setPreviewWeek(Math.max(1, previewWeek - 1))}
                  disabled={previewWeek <= 1}
                  className={`p-2 rounded-lg ${theme.cardAlt} disabled:opacity-30`}
                >
                  <ChevronLeft size={20} className={theme.text} />
                </button>
                <div className="text-center">
                  <p className={`font-bold ${theme.text}`}>Week {previewWeek}</p>
                  <p className={`text-xs ${theme.textMuted}`}>
                    {getPreviewWeekData(previewWeek)?.phase?.name || 'Unknown Phase'}
                    {getPreviewWeekData(previewWeek)?.progression?.isDeload && ' (Deload)'}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewWeek(Math.min(totalWeeks, previewWeek + 1))}
                  disabled={previewWeek >= totalWeeks}
                  className={`p-2 rounded-lg ${theme.cardAlt} disabled:opacity-30`}
                >
                  <ChevronRight size={20} className={theme.text} />
                </button>
              </div>

              {/* Week Preview */}
              {(() => {
                const weekData = getPreviewWeekData(previewWeek);
                if (!weekData) return <p className={theme.textMuted}>No data for this week</p>;
                
                return (
                  <div className="space-y-3">
                    {/* Progression Info */}
                    <div className={`${theme.cardAlt} rounded-lg p-3`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-xs ${theme.textMuted}`}>Week {weekData.weekInPhase} of {weekData.phase.weeks} in {weekData.phase.name}</p>
                        {weekData.track && (
                          <span className={`text-xs px-2 py-0.5 rounded-full bg-${weekData.track.color}-500/20 text-${weekData.track.color}-400`}>
                            {weekData.track.icon} {weekData.track.name}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className={theme.text}>Intensity: <span className="text-blue-400">{weekData.progression.intensity || weekData.track?.baseIntensity}%</span></span>
                        <span className={theme.text}>Sets: <span className="text-blue-400">{weekData.progression.sets || weekData.track?.baseSets}</span></span>
                        <span className={theme.text}>Reps: <span className="text-blue-400">{weekData.progression.reps || weekData.track?.baseReps}</span></span>
                        {(weekData.progression.rpe || weekData.track?.baseRpe) && (
                          <span className={theme.text}>RPE: <span className="text-blue-400">{weekData.progression.rpe || weekData.track?.baseRpe}</span></span>
                        )}
                        {weekData.progression.focus && (
                          <span className={theme.text}>Focus: <span className="text-purple-400">{weekData.progression.focus}</span></span>
                        )}
                        {weekData.progression.isDeload && (
                          <span className="text-green-400 font-medium">🔄 Deload Week</span>
                        )}
                      </div>
                      {/* Block periodization phase info */}
                      {weekData.progression.phase && (
                        <div className={`mt-2 pt-2 border-t ${theme.border}`}>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full bg-${weekData.progression.phaseColor || 'blue'}-500/20 text-${weekData.progression.phaseColor || 'blue'}-400 font-medium`}>
                              {weekData.progression.phase}
                            </span>
                            <span className={`text-xs ${theme.textMuted}`}>
                              Week {weekData.progression.weekInPhase}/{weekData.progression.totalPhaseWeeks}
                            </span>
                          </div>
                          {weekData.progression.phaseDescription && (
                            <p className={`text-xs ${theme.textMuted} mt-1`}>{weekData.progression.phaseDescription}</p>
                          )}
                        </div>
                      )}
                      {/* Conjugate wave info */}
                      {weekData.progression.pattern === 'Conjugate' && weekData.progression.note && (
                        <p className={`text-xs ${theme.textMuted} mt-2 italic`}>{weekData.progression.note}</p>
                      )}
                    </div>

                    {/* Days */}
                    {weekData.days.map((day, idx) => (
                      <div key={idx} className={`${theme.card} rounded-xl p-4`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className={`font-medium ${theme.text}`}>{day.dayName}</h4>
                            {/* DUP Day Type Badge */}
                            {day.dupType && (
                              <span className={`text-xs px-2 py-0.5 rounded-full bg-${day.dupType.color}-500/20 text-${day.dupType.color}-400 font-medium`}>
                                {day.dupType.shortName}
                              </span>
                            )}
                            {/* Conjugate Day Type Badge */}
                            {day.conjugateType && (
                              <span className={`text-xs px-2 py-0.5 rounded-full bg-${day.conjugateType.color}-500/20 text-${day.conjugateType.color}-400 font-medium`}>
                                {day.conjugateType.shortName}
                              </span>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            day.type === 'strength' ? 'bg-red-500/20 text-red-400' :
                            day.type === 'cardio' ? 'bg-blue-500/20 text-blue-400' :
                            day.type === 'recovery' ? 'bg-green-500/20 text-green-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {day.type}
                          </span>
                        </div>
                        {day.session && <p className={`text-sm ${theme.textMuted} mb-2`}>{day.session}</p>}
                        {/* DUP/Conjugate day info */}
                        {day.dupType && day.type === 'strength' && (
                          <p className={`text-xs ${theme.textMuted} mb-2`}>
                            {day.dupType.sets}×{day.dupType.reps} @ {day.dupType.intensity}% RPE {day.dupType.rpe}
                          </p>
                        )}
                        {day.conjugateType && day.type === 'strength' && (
                          <p className={`text-xs ${theme.textMuted} mb-2 italic`}>
                            {day.conjugateType.prescription?.mainLift}
                          </p>
                        )}
                        
                        {day.type === 'cardio' && (
                          <p className={`text-sm ${theme.text}`}>
                            {CARDIO_ZONES[day.cardioZone]?.name || 'Zone 2'} • {day.duration} min
                          </p>
                        )}
                        
                        {day.adjustedExercises?.length > 0 && (
                          <div className="space-y-1 mt-2">
                            {day.adjustedExercises.map((ex, exIdx) => (
                              <div key={exIdx} className={`${theme.cardAlt} rounded p-2 text-sm`}>
                                <div className="flex justify-between">
                                  <span className={theme.text}>{EXERCISE_LIBRARY[ex.exerciseId]?.name || ex.name || 'Exercise'}</span>
                                  <span className={theme.textMuted}>{ex.adjustedSets}×{ex.adjustedReps} @ {ex.adjustedIntensity}% RPE {ex.adjustedRpe}</span>
                                </div>
                                {(ex.tempo || ex.rest || ex.notes) && (
                                  <div className={`text-xs ${theme.textMuted} mt-1 flex gap-3`}>
                                    {ex.tempo && <span>Tempo: {ex.tempo}</span>}
                                    {ex.rest && <span>Rest: {ex.rest}s</span>}
                                    {ex.notes && <span className="italic">"{ex.notes}"</span>}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {day.type === 'recovery' && (
                          <p className={`text-sm ${theme.textMuted}`}>Rest / Active Recovery</p>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Phase Overview */}
              <div className={`${theme.card} rounded-xl p-4`}>
                <h4 className={`font-medium ${theme.text} mb-2`}>Program Phases</h4>
                <div className="space-y-2">
                  {phases.map((phase, idx) => {
                    const isCurrentPhase = previewWeek >= phase.weeksRange[0] && previewWeek <= phase.weeksRange[1];
                    return (
                      <button
                        key={idx}
                        onClick={() => setPreviewWeek(phase.weeksRange[0])}
                        className={`w-full p-2 rounded-lg text-left ${isCurrentPhase ? 'bg-blue-500/20 border border-blue-500' : theme.cardAlt}`}
                      >
                        <div className="flex justify-between">
                          <span className={theme.text}>{phase.name}</span>
                          <span className={theme.textMuted}>Weeks {phase.weeksRange[0]}-{phase.weeksRange[1]}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Preview Modal */}
      {showCalendarPreview && phases.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-auto">
          <div className={`${theme.bg} min-h-full md:min-h-0 md:max-w-4xl md:mx-auto md:my-8 md:rounded-2xl`}>
            {/* Header */}
            <div className={`sticky top-0 ${theme.card} border-b ${theme.border} p-4 flex items-center justify-between z-10`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{programIcon}</span>
                <div>
                  <h2 className={`font-bold ${theme.text}`}>{programName}</h2>
                  <p className={`text-xs ${theme.textMuted}`}>Calendar Preview • {totalWeeks} weeks</p>
                </div>
              </div>
              <button onClick={() => setShowCalendarPreview(false)} className={`p-2 rounded-lg ${theme.cardAlt}`}>
                <X size={24} className={theme.text} />
              </button>
            </div>

            <div className="p-4">
              {/* Calendar Grid */}
              <div className="space-y-4">
                {phases.map((phase, phaseIdx) => {
                  const phaseWeeks = phase.weeksRange[1] - phase.weeksRange[0] + 1;
                  return (
                    <div key={phase.id} className={`${theme.card} rounded-xl p-4`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={`font-bold ${theme.text}`}>{phase.name}</h3>
                        <span className={`text-sm ${theme.textMuted}`}>Weeks {phase.weeksRange[0]}-{phase.weeksRange[1]}</span>
                      </div>
                      
                      {/* Week rows */}
                      {Array.from({ length: phaseWeeks }, (_, weekIdx) => {
                        const weekNum = phase.weeksRange[0] + weekIdx;
                        const weekProg = phase.weeklyProgression?.[weekIdx] || {};
                        const hasOverrides = hasWeekOverrides(phase, weekNum);
                        
                        return (
                          <div key={weekIdx} className={`mb-2 ${weekProg.isDeload ? 'opacity-60' : ''}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <button 
                                onClick={() => setShowWeekOverride({ phaseIdx, weekNum })}
                                className={`text-xs font-medium ${theme.textMuted} w-12 hover:text-blue-500 text-left`}
                              >
                                Wk {weekNum}
                              </button>
                              {weekProg.isDeload && <span className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-500 rounded">Deload</span>}
                              {hasOverrides && <span className="text-xs px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 rounded">Modified</span>}
                              <button 
                                onClick={() => setShowWeekOverride({ phaseIdx, weekNum })}
                                className={`text-xs ${theme.textMuted} hover:text-blue-500 ml-auto`}
                              >
                                <Edit3 size={12} />
                              </button>
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                              {phase.weeklyTemplate.map((day, dayIdx) => {
                                const dayData = getDayWithOverrides(phase, weekNum, dayIdx);
                                const isOverridden = phase?.weekOverrides?.[weekNum]?.[dayIdx];
                                return (
                                  <div 
                                    key={dayIdx}
                                    className={`p-1.5 rounded text-center text-xs ${
                                      dayData.type === 'strength' ? 'bg-blue-500/20 text-blue-400' :
                                      dayData.type === 'cardio' ? 'bg-red-500/20 text-red-400' :
                                      dayData.type === 'muscular_endurance' ? 'bg-orange-500/20 text-orange-400' :
                                      dayData.type === 'mobility' ? 'bg-purple-500/20 text-purple-400' :
                                      `${theme.cardAlt} ${theme.textMuted}`
                                    } ${isOverridden ? 'ring-2 ring-yellow-500' : ''}`}
                                    title={`${dayData.dayName}: ${dayData.session || dayData.type}${isOverridden ? ' (Modified)' : ''}`}
                                  >
                                    <p className="font-medium truncate">{dayData.dayName.split(' ')[0]}</p>
                                    {dayData.type !== 'recovery' && (
                                      <p className="text-[10px] truncate opacity-75">
                                        {dayData.exercises?.length || 0} ex
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className={`mt-4 ${theme.cardAlt} rounded-lg p-3`}>
                <p className={`text-xs font-medium ${theme.textMuted} mb-2`}>Legend</p>
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500/30"></span> Strength</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/30"></span> Cardio</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500/30"></span> Muscular End.</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-500/30"></span> Mobility</span>
                  <span className="flex items-center gap-1"><span className={`w-3 h-3 rounded ${theme.cardAlt}`}></span> Rest</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Week Override Modal */}
      {showWeekOverride && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-auto">
          <div className={`${theme.bg} min-h-full md:min-h-0 md:max-w-2xl md:mx-auto md:my-8 md:rounded-2xl`}>
            <div className={`sticky top-0 ${theme.card} border-b ${theme.border} p-4 flex items-center justify-between z-10`}>
              <div>
                <h2 className={`font-bold ${theme.text}`}>Week {showWeekOverride.weekNum} Overrides</h2>
                <p className={`text-xs ${theme.textMuted}`}>{phases[showWeekOverride.phaseIdx]?.name} • Modify this week only</p>
              </div>
              <button onClick={() => setShowWeekOverride(null)} className={`p-2 rounded-lg ${theme.cardAlt}`}>
                <X size={24} className={theme.text} />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              <p className={`text-sm ${theme.textMuted}`}>
                Changes here only affect Week {showWeekOverride.weekNum}. The template remains unchanged.
              </p>
              
              {phases[showWeekOverride.phaseIdx]?.weeklyTemplate.map((day, dayIdx) => {
                const override = phases[showWeekOverride.phaseIdx]?.weekOverrides?.[showWeekOverride.weekNum]?.[dayIdx];
                const currentType = override?.type || day.type;
                
                return (
                  <div key={dayIdx} className={`${theme.card} rounded-xl p-4 ${override ? 'ring-2 ring-yellow-500' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-medium ${theme.text}`}>{day.dayName}</span>
                      {override && (
                        <button 
                          onClick={() => clearWeekOverride(showWeekOverride.phaseIdx, showWeekOverride.weekNum, dayIdx)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Reset to template
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={`text-xs ${theme.textMuted}`}>Session Type</label>
                        <select 
                          value={currentType}
                          onChange={(e) => setWeekOverride(showWeekOverride.phaseIdx, showWeekOverride.weekNum, dayIdx, { type: e.target.value })}
                          className={`w-full p-2 rounded-lg ${theme.input} text-sm`}
                        >
                          {SESSION_TYPES.map(t => (
                            <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={`text-xs ${theme.textMuted}`}>Notes</label>
                        <input 
                          type="text"
                          value={override?.notes || ''}
                          onChange={(e) => setWeekOverride(showWeekOverride.phaseIdx, showWeekOverride.weekNum, dayIdx, { notes: e.target.value })}
                          placeholder="e.g., Travel day, skip"
                          className={`w-full p-2 rounded-lg ${theme.input} text-sm`}
                        />
                      </div>
                    </div>
                    
                    {currentType !== 'recovery' && day.type !== 'cardio' && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div>
                          <label className={`text-xs ${theme.textMuted}`}>Volume Modifier</label>
                          <select 
                            value={override?.volumeMod || '100'}
                            onChange={(e) => setWeekOverride(showWeekOverride.phaseIdx, showWeekOverride.weekNum, dayIdx, { volumeMod: e.target.value })}
                            className={`w-full p-2 rounded-lg ${theme.input} text-sm`}
                          >
                            <option value="50">50% (Light)</option>
                            <option value="75">75% (Reduced)</option>
                            <option value="100">100% (Normal)</option>
                            <option value="110">110% (Overreach)</option>
                          </select>
                        </div>
                        <div>
                          <label className={`text-xs ${theme.textMuted}`}>Intensity Modifier</label>
                          <select 
                            value={override?.intensityMod || '100'}
                            onChange={(e) => setWeekOverride(showWeekOverride.phaseIdx, showWeekOverride.weekNum, dayIdx, { intensityMod: e.target.value })}
                            className={`w-full p-2 rounded-lg ${theme.input} text-sm`}
                          >
                            <option value="80">80% (Deload)</option>
                            <option value="90">90% (Light)</option>
                            <option value="100">100% (Normal)</option>
                            <option value="105">105% (Push)</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Conditional Logic Editor Modal */}
      {showConditionalEditor && currentPhase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowConditionalEditor(null)}>
          <div className={`${theme.card} rounded-2xl p-5 max-w-md w-full`} onClick={e => e.stopPropagation()}>
            {(() => {
              const { dayIdx, exIdx } = showConditionalEditor;
              const exercise = currentPhase.weeklyTemplate[dayIdx]?.exercises?.[exIdx];
              if (!exercise) return null;
              
              const conditions = [
                { id: 'readiness_low', label: 'Readiness Score < 60' },
                { id: 'readiness_high', label: 'Readiness Score > 80' },
                { id: 'soreness_high', label: 'Muscle Soreness > 3' },
                { id: 'sleep_poor', label: 'Sleep Quality < 3' },
                { id: 'energy_low', label: 'Energy Level < 3' },
                { id: 'previous_missed', label: 'Previous Session Missed' },
                { id: 'deload_week', label: 'Deload Week' },
              ];
              
              const actions = [
                { id: 'reduce_volume', label: 'Reduce volume 25%' },
                { id: 'reduce_intensity', label: 'Reduce intensity 10%' },
                { id: 'skip_exercise', label: 'Skip this exercise' },
                { id: 'swap_easier', label: 'Swap for easier variant' },
                { id: 'add_sets', label: 'Add 1 extra set' },
                { id: 'increase_intensity', label: 'Increase intensity 5%' },
              ];
              
              return (
                <>
                  <h3 className={`font-bold text-lg ${theme.text} mb-2`}>
                    <GitBranch size={20} className="inline mr-2 text-yellow-500" />
                    Conditional Logic
                  </h3>
                  <p className={`text-sm ${theme.textMuted} mb-4`}>
                    {EXERCISE_LIBRARY[exercise.exerciseId]?.name || 'Exercise'}
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium ${theme.text} mb-2`}>IF (condition)</label>
                      <select 
                        value={exercise.conditional?.condition || ''}
                        onChange={(e) => {
                          const newConditional = e.target.value ? { 
                            condition: e.target.value, 
                            action: exercise.conditional?.action || 'reduce_volume' 
                          } : null;
                          updateExercise(dayIdx, exIdx, { conditional: newConditional });
                        }}
                        className={`w-full p-3 rounded-lg ${theme.input} border`}
                      >
                        <option value="">No condition (always execute)</option>
                        {conditions.map(c => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    {exercise.conditional?.condition && (
                      <div>
                        <label className={`block text-sm font-medium ${theme.text} mb-2`}>THEN (action)</label>
                        <select 
                          value={exercise.conditional?.action || 'reduce_volume'}
                          onChange={(e) => {
                            updateExercise(dayIdx, exIdx, { 
                              conditional: { ...exercise.conditional, action: e.target.value } 
                            });
                          }}
                          className={`w-full p-3 rounded-lg ${theme.input} border`}
                        >
                          {actions.map(a => (
                            <option key={a.id} value={a.id}>{a.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {exercise.conditional && (
                      <div className={`${theme.cardAlt} rounded-lg p-3`}>
                        <p className={`text-sm ${theme.text}`}>
                          <span className="font-medium">Rule:</span> If {conditions.find(c => c.id === exercise.conditional.condition)?.label}, 
                          then {actions.find(a => a.id === exercise.conditional.action)?.label}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    {exercise.conditional && (
                      <button 
                        onClick={() => { updateExercise(dayIdx, exIdx, { conditional: null }); setShowConditionalEditor(null); }}
                        className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-500"
                      >
                        Remove Rule
                      </button>
                    )}
                    <button 
                      onClick={() => setShowConditionalEditor(null)}
                      className={`flex-1 py-2 rounded-lg ${theme.cardAlt} ${theme.text}`}
                    >
                      Done
                    </button>
                  </div>
                </>
              );
            })()}
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

  // Get detours - use program-specific if available, otherwise use universal
  const programDetours = program.availableDetours || {};
  const availableDetours = {
    specialty: [...(programDetours.specialty || []), ...UNIVERSAL_DETOURS.specialty].filter((d, i, arr) => arr.findIndex(x => x.id === d.id) === i),
    life: [...(programDetours.life || []), ...UNIVERSAL_DETOURS.life].filter((d, i, arr) => arr.findIndex(x => x.id === d.id) === i)
  };
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
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Merge program-specific detours with universal detours, removing duplicates
  const programDetours = program?.availableDetours || {};
  const specialty = [...(programDetours.specialty || []), ...UNIVERSAL_DETOURS.specialty]
    .filter((d, i, arr) => arr.findIndex(x => x.id === d.id) === i);
  const life = [...(programDetours.life || []), ...UNIVERSAL_DETOURS.life]
    .filter((d, i, arr) => arr.findIndex(x => x.id === d.id) === i);

  // Get unique categories for filter
  const specialtyCategories = [...new Set(specialty.map(b => b.category).filter(Boolean))];
  const lifeCategories = [...new Set(life.map(b => b.category).filter(Boolean))];

  // Filter blocks by category
  const filteredSpecialty = categoryFilter === 'all'
    ? specialty
    : specialty.filter(b => b.category === categoryFilter);
  const filteredLife = categoryFilter === 'all'
    ? life
    : life.filter(b => b.category === categoryFilter);

  const categoryColors = {
    strength: 'bg-red-500/20 text-red-500 border-red-500',
    cardio: 'bg-blue-500/20 text-blue-500 border-blue-500',
    endurance: 'bg-orange-500/20 text-orange-500 border-orange-500',
    performance: 'bg-purple-500/20 text-purple-500 border-purple-500',
    recovery: 'bg-green-500/20 text-green-500 border-green-500',
    situational: 'bg-yellow-500/20 text-yellow-500 border-yellow-500',
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-auto">
      <div className={`${theme.bg} min-h-full md:min-h-0 md:max-w-lg md:mx-auto md:my-8 md:rounded-2xl`}>
        {/* Header */}
        <div className={`sticky top-0 ${theme.card} border-b ${theme.border} p-4 z-10`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className={`font-bold text-lg ${theme.text}`}>Take a Detour</h2>
              <p className={`text-sm ${theme.textMuted}`}>Inject a block, then return to main cycle</p>
            </div>
            <button onClick={onClose} className={`p-2 rounded-lg ${theme.cardAlt}`}>
              <X size={24} className={theme.text} />
            </button>
          </div>
          {/* Category Filter Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`w-full p-2.5 rounded-lg ${theme.input} border text-sm font-medium`}
          >
            <option value="all">All Categories</option>
            <optgroup label="Specialty">
              {specialtyCategories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </optgroup>
            <optgroup label="Life">
              {lifeCategories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="p-4 space-y-6 pb-8">
          {/* Specialty Blocks */}
          {filteredSpecialty.length > 0 && (
            <div>
              <h3 className={`font-semibold ${theme.text} mb-3 flex items-center gap-2`}>
                <Zap size={18} className="text-orange-500" />
                Specialty Blocks
                <span className={`text-xs ${theme.textMuted}`}>({filteredSpecialty.length})</span>
              </h3>
              <p className={`text-sm ${theme.textMuted} mb-3`}>
                Focused training when specific demands arise.
              </p>
              <div className="space-y-3">
                {filteredSpecialty.map(block => (
                  <div key={block.id} className={`${theme.card} rounded-xl overflow-hidden border-l-4 border-orange-500`}>
                    <button
                      onClick={() => setExpandedBlock(expandedBlock === block.id ? null : block.id)}
                      className="w-full p-4 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{block.icon}</span>
                        <div>
                          <p className={`font-semibold ${theme.text}`}>{block.name}</p>
                          <p className={`text-sm ${theme.textMuted}`}>
                            {block.duration?.min}-{block.duration?.max} {block.duration?.unit}
                            {block.category && (
                              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${categoryColors[block.category] || theme.cardAlt}`}>
                                {block.category}
                              </span>
                            )}
                          </p>
                        </div>
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
          {filteredLife.length > 0 && (
            <div>
              <h3 className={`font-semibold ${theme.text} mb-3 flex items-center gap-2`}>
                <Heart size={18} className="text-green-500" />
                Life Blocks
                <span className={`text-xs ${theme.textMuted}`}>({filteredLife.length})</span>
              </h3>
              <p className={`text-sm ${theme.textMuted} mb-3`}>
                Adaptive responses for injuries, burnout, deployment, etc.
              </p>
              <div className="space-y-3">
                {filteredLife.map(block => (
                  <div key={block.id} className={`${theme.card} rounded-xl overflow-hidden border-l-4 border-green-500`}>
                    <button
                      onClick={() => setExpandedBlock(expandedBlock === `life_${block.id}` ? null : `life_${block.id}`)}
                      className="w-full p-4 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{block.icon}</span>
                        <div>
                          <p className={`font-semibold ${theme.text}`}>{block.name}</p>
                          <p className={`text-sm ${theme.textMuted}`}>
                            {block.duration?.min}-{block.duration?.max} {block.duration?.unit}
                            {block.category && (
                              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${categoryColors[block.category] || theme.cardAlt}`}>
                                {block.category}
                              </span>
                            )}
                          </p>
                        </div>
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

          {/* No results message */}
          {filteredSpecialty.length === 0 && filteredLife.length === 0 && (
            <div className={`text-center py-8 ${theme.textMuted}`}>
              <p>No detours match the selected category.</p>
              <button
                onClick={() => setCategoryFilter('all')}
                className="mt-2 text-blue-500 underline"
              >
                Show all detours
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============== WORKOUT TIMER COMPONENT ==============
const WorkoutTimer = ({ theme, darkMode, workoutType }) => {
  const [mode, setMode] = useState('stopped'); // 'stopped', 'running', 'paused'
  const [timerType, setTimerType] = useState('stopwatch'); // 'stopwatch', 'countdown', 'interval', 'emom', 'amrap'
  const [seconds, setSeconds] = useState(0);
  const [targetSeconds, setTargetSeconds] = useState(60); // For countdown
  const [intervalConfig, setIntervalConfig] = useState({
    workTime: 240, // 4 min
    restTime: 180, // 3 min  
    rounds: 4,
    currentRound: 1,
    isRest: false
  });
  const [emomConfig, setEmomConfig] = useState({
    minuteLength: 60, // seconds per round (usually 60)
    totalMinutes: 10,
    currentMinute: 1
  });
  const [amrapConfig, setAmrapConfig] = useState({
    totalTime: 600, // 10 minutes
    roundCount: 0
  });
  const [showConfig, setShowConfig] = useState(false);
  const intervalRef = useRef(null);
  
  // Audio beep for transitions
  const playBeep = useCallback((type = 'single') => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const beeps = type === 'double' ? 2 : type === 'triple' ? 3 : 1;
      for (let i = 0; i < beeps; i++) {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = type === 'triple' ? 880 : 660;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.2);
        }, i * 250);
      }
    } catch (e) { console.log('Audio not available'); }
  }, []);
  
  // Format time display
  const formatTime = (secs) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };
  
  // Timer logic
  useEffect(() => {
    if (mode === 'running') {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          if (timerType === 'stopwatch') {
            return prev + 1;
          } else if (timerType === 'countdown') {
            if (prev <= 1) {
              playBeep('triple');
              setMode('stopped');
              return 0;
            }
            if (prev === 4) playBeep('single');
            return prev - 1;
          } else if (timerType === 'interval') {
            const target = intervalConfig.isRest ? intervalConfig.restTime : intervalConfig.workTime;
            if (prev >= target - 1) {
              // Transition
              if (intervalConfig.isRest) {
                // End of rest, start next work period
                if (intervalConfig.currentRound >= intervalConfig.rounds) {
                  playBeep('triple');
                  setMode('stopped');
                  return 0;
                }
                playBeep('double');
                setIntervalConfig(c => ({ ...c, currentRound: c.currentRound + 1, isRest: false }));
                return 0;
              } else {
                // End of work, start rest
                playBeep('double');
                setIntervalConfig(c => ({ ...c, isRest: true }));
                return 0;
              }
            }
            // 3-second warning
            if (prev === target - 4) playBeep('single');
            return prev + 1;
          } else if (timerType === 'emom') {
            const secondsInMinute = prev % emomConfig.minuteLength;
            const currentMin = Math.floor(prev / emomConfig.minuteLength) + 1;
            
            // Check if EMOM is complete
            if (currentMin > emomConfig.totalMinutes) {
              playBeep('triple');
              setMode('stopped');
              setEmomConfig(c => ({ ...c, currentMinute: 1 }));
              return 0;
            }
            
            // Update current minute display
            if (secondsInMinute === 0 && prev > 0) {
              setEmomConfig(c => ({ ...c, currentMinute: currentMin }));
            }
            
            // New minute starting - beep
            if (secondsInMinute === 0 && prev > 0) {
              playBeep('double');
            }
            
            // 3-second warning before next minute
            if (secondsInMinute === emomConfig.minuteLength - 4) {
              playBeep('single');
            }
            
            return prev + 1;
          } else if (timerType === 'amrap') {
            // Count down from total time
            if (prev <= 1) {
              playBeep('triple');
              setMode('stopped');
              return 0;
            }
            // Warnings at 1 minute, 30 seconds, 10 seconds
            if (prev === 61) playBeep('single');
            if (prev === 31) playBeep('single');
            if (prev === 11) playBeep('single');
            if (prev === 4) playBeep('double');
            return prev - 1;
          }
          return prev;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [mode, timerType, intervalConfig.isRest, intervalConfig.currentRound, intervalConfig.rounds, intervalConfig.workTime, intervalConfig.restTime, playBeep]);
  
  const startTimer = () => {
    if (timerType === 'countdown' && seconds === 0) setSeconds(targetSeconds);
    if (timerType === 'amrap' && seconds === 0) setSeconds(amrapConfig.totalTime);
    setMode('running');
  };
  
  const pauseTimer = () => setMode('paused');
  
  const resetTimer = () => {
    setMode('stopped');
    if (timerType === 'countdown') {
      setSeconds(targetSeconds);
    } else if (timerType === 'amrap') {
      setSeconds(amrapConfig.totalTime);
      setAmrapConfig(c => ({ ...c, roundCount: 0 }));
    } else if (timerType === 'emom') {
      setSeconds(0);
      setEmomConfig(c => ({ ...c, currentMinute: 1 }));
    } else {
      setSeconds(0);
    }
    setIntervalConfig(c => ({ ...c, currentRound: 1, isRest: false }));
  };
  
  // Quick presets based on workout type
  const presets = useMemo(() => {
    if (workoutType === 'threshold') {
      return [
        { label: '4×4min', work: 240, rest: 180, rounds: 4 },
        { label: '5×3min', work: 180, rest: 120, rounds: 5 },
        { label: '3×8min', work: 480, rest: 300, rounds: 3 },
      ];
    } else if (workoutType === 'muscular_endurance') {
      return [
        { label: '20 on/20 off', work: 20, rest: 20, rounds: 10 },
        { label: '30 on/30 off', work: 30, rest: 30, rounds: 8 },
        { label: '45 on/15 off', work: 45, rest: 15, rounds: 10 },
        { label: '10min EMOM', emom: { minutes: 10, length: 60 } },
        { label: '12min AMRAP', amrap: 12 },
      ];
    } else if (workoutType === 'strength') {
      return [
        { label: '60s rest', countdown: 60 },
        { label: '90s rest', countdown: 90 },
        { label: '2min rest', countdown: 120 },
        { label: '3min rest', countdown: 180 },
        { label: '5min rest', countdown: 300 },
      ];
    }
    return [
      { label: '30s rest', countdown: 30 },
      { label: '60s rest', countdown: 60 },
      { label: '90s rest', countdown: 90 },
      { label: '10min EMOM', emom: { minutes: 10, length: 60 } },
      { label: '15min AMRAP', amrap: 15 },
    ];
  }, [workoutType]);
  
  const applyPreset = (preset) => {
    resetTimer();
    if (preset.countdown) {
      setTimerType('countdown');
      setTargetSeconds(preset.countdown);
      setSeconds(preset.countdown);
    } else if (preset.emom) {
      setTimerType('emom');
      setEmomConfig(c => ({ ...c, totalMinutes: preset.emom.minutes, minuteLength: preset.emom.length, currentMinute: 1 }));
      setSeconds(0);
    } else if (preset.amrap) {
      setTimerType('amrap');
      setAmrapConfig(c => ({ ...c, totalTime: preset.amrap * 60, roundCount: 0 }));
      setSeconds(preset.amrap * 60);
    } else {
      setTimerType('interval');
      setIntervalConfig(c => ({
        ...c,
        workTime: preset.work,
        restTime: preset.rest,
        rounds: preset.rounds,
        currentRound: 1,
        isRest: false
      }));
      setSeconds(0);
    }
  };
  
  // Current display value
  const displayTime = timerType === 'interval' 
    ? formatTime((intervalConfig.isRest ? intervalConfig.restTime : intervalConfig.workTime) - seconds)
    : formatTime(timerType === 'countdown' ? seconds : seconds);
  
  const progressPercent = timerType === 'interval'
    ? (seconds / (intervalConfig.isRest ? intervalConfig.restTime : intervalConfig.workTime)) * 100
    : timerType === 'countdown'
    ? ((targetSeconds - seconds) / targetSeconds) * 100
    : 0;

  return (
    <div className={`${theme.card} rounded-xl shadow-sm overflow-hidden`}>
      <button 
        onClick={() => setShowConfig(!showConfig)}
        className={`w-full p-4 flex items-center justify-between ${theme.cardAlt}`}
      >
        <div className="flex items-center gap-2">
          <Timer size={20} className={theme.text} />
          <span className={`font-medium ${theme.text}`}>Workout Timer</span>
        </div>
        {showConfig ? <ChevronUp size={20} className={theme.textMuted} /> : <ChevronDown size={20} className={theme.textMuted} />}
      </button>
      
      {showConfig && (
        <div className="p-4 space-y-4">
          {/* Timer Type Selector */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'stopwatch', label: '⏱️ Stopwatch' },
              { id: 'countdown', label: '⏳ Countdown' },
              { id: 'interval', label: '🔄 Intervals' },
              { id: 'emom', label: '⚡ EMOM' },
              { id: 'amrap', label: '🔥 AMRAP' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => { setTimerType(t.id); resetTimer(); }}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  timerType === t.id ? 'bg-blue-500 text-white' : `${theme.cardAlt} ${theme.text}`
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          
          {/* Quick Presets */}
          <div>
            <p className={`text-xs ${theme.textMuted} mb-2`}>Quick Presets</p>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(preset)}
                  className={`px-3 py-1.5 rounded-lg text-sm ${theme.cardAlt} ${theme.text} hover:opacity-80`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Interval Config */}
          {timerType === 'interval' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={`text-xs ${theme.textMuted}`}>Work (sec)</label>
                <input
                  type="number"
                  value={intervalConfig.workTime}
                  onChange={(e) => setIntervalConfig(c => ({ ...c, workTime: parseInt(e.target.value) || 0 }))}
                  className={`w-full mt-1 px-2 py-1.5 rounded ${theme.input} text-center`}
                />
              </div>
              <div>
                <label className={`text-xs ${theme.textMuted}`}>Rest (sec)</label>
                <input
                  type="number"
                  value={intervalConfig.restTime}
                  onChange={(e) => setIntervalConfig(c => ({ ...c, restTime: parseInt(e.target.value) || 0 }))}
                  className={`w-full mt-1 px-2 py-1.5 rounded ${theme.input} text-center`}
                />
              </div>
              <div>
                <label className={`text-xs ${theme.textMuted}`}>Rounds</label>
                <input
                  type="number"
                  value={intervalConfig.rounds}
                  onChange={(e) => setIntervalConfig(c => ({ ...c, rounds: parseInt(e.target.value) || 1 }))}
                  className={`w-full mt-1 px-2 py-1.5 rounded ${theme.input} text-center`}
                />
              </div>
            </div>
          )}
          
          {/* Countdown Config */}
          {timerType === 'countdown' && mode === 'stopped' && (
            <div>
              <label className={`text-xs ${theme.textMuted}`}>Duration (seconds)</label>
              <input
                type="number"
                value={targetSeconds}
                onChange={(e) => { setTargetSeconds(parseInt(e.target.value) || 0); setSeconds(parseInt(e.target.value) || 0); }}
                className={`w-full mt-1 px-3 py-2 rounded ${theme.input} text-center`}
              />
            </div>
          )}
          
          {/* EMOM Config */}
          {timerType === 'emom' && mode === 'stopped' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`text-xs ${theme.textMuted}`}>Minutes</label>
                <input
                  type="number"
                  value={emomConfig.totalMinutes}
                  onChange={(e) => setEmomConfig(c => ({ ...c, totalMinutes: parseInt(e.target.value) || 1 }))}
                  className={`w-full mt-1 px-2 py-1.5 rounded ${theme.input} text-center`}
                />
              </div>
              <div>
                <label className={`text-xs ${theme.textMuted}`}>Sec/Round</label>
                <input
                  type="number"
                  value={emomConfig.minuteLength}
                  onChange={(e) => setEmomConfig(c => ({ ...c, minuteLength: parseInt(e.target.value) || 60 }))}
                  className={`w-full mt-1 px-2 py-1.5 rounded ${theme.input} text-center`}
                />
              </div>
            </div>
          )}
          
          {/* AMRAP Config */}
          {timerType === 'amrap' && mode === 'stopped' && (
            <div>
              <label className={`text-xs ${theme.textMuted}`}>Total Time (minutes)</label>
              <input
                type="number"
                value={Math.floor(amrapConfig.totalTime / 60)}
                onChange={(e) => { 
                  const mins = parseInt(e.target.value) || 1;
                  setAmrapConfig(c => ({ ...c, totalTime: mins * 60 })); 
                  setSeconds(mins * 60);
                }}
                className={`w-full mt-1 px-3 py-2 rounded ${theme.input} text-center`}
              />
            </div>
          )}
          
          {/* Timer Display */}
          <div className={`p-6 rounded-xl text-center ${
            timerType === 'interval' && mode === 'running'
              ? intervalConfig.isRest 
                ? (darkMode ? 'bg-green-900/50' : 'bg-green-100')
                : (darkMode ? 'bg-red-900/50' : 'bg-red-100')
              : timerType === 'emom' && mode === 'running'
              ? (darkMode ? 'bg-purple-900/50' : 'bg-purple-100')
              : timerType === 'amrap' && mode === 'running'
              ? (darkMode ? 'bg-orange-900/50' : 'bg-orange-100')
              : theme.cardAlt
          }`}>
            {timerType === 'interval' && (
              <div className={`text-sm font-medium mb-2 ${intervalConfig.isRest ? 'text-green-500' : 'text-red-500'}`}>
                {intervalConfig.isRest ? '🌿 REST' : '🔥 WORK'} — Round {intervalConfig.currentRound}/{intervalConfig.rounds}
              </div>
            )}
            {timerType === 'emom' && mode === 'running' && (
              <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                ⚡ EMOM — Minute {Math.floor(seconds / emomConfig.minuteLength) + 1}/{emomConfig.totalMinutes}
              </div>
            )}
            {timerType === 'amrap' && mode === 'running' && (
              <div className="mb-2">
                <div className={`text-sm font-medium ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                  🔥 AMRAP — Rounds: {amrapConfig.roundCount}
                </div>
                <button 
                  onClick={() => { setAmrapConfig(c => ({ ...c, roundCount: c.roundCount + 1 })); playBeep('single'); }}
                  className="mt-2 px-4 py-1 bg-orange-500 text-white rounded-lg text-sm font-medium"
                >
                  + Round Complete
                </button>
              </div>
            )}
            <div className={`text-5xl font-mono font-bold ${theme.text}`}>
              {timerType === 'emom' 
                ? formatTime(emomConfig.minuteLength - (seconds % emomConfig.minuteLength))
                : timerType === 'amrap'
                ? formatTime(seconds)
                : displayTime
              }
            </div>
            {timerType === 'emom' && mode === 'running' && (
              <div className="w-full bg-gray-600/50 rounded-full h-2 mt-4">
                <div 
                  className="h-2 rounded-full transition-all bg-purple-500"
                  style={{ width: `${((seconds % emomConfig.minuteLength) / emomConfig.minuteLength) * 100}%` }}
                />
              </div>
            )}
            {timerType === 'amrap' && mode === 'running' && (
              <div className="w-full bg-gray-600/50 rounded-full h-2 mt-4">
                <div 
                  className="h-2 rounded-full transition-all bg-orange-500"
                  style={{ width: `${((amrapConfig.totalTime - seconds) / amrapConfig.totalTime) * 100}%` }}
                />
              </div>
            )}
            {(timerType === 'interval' || timerType === 'countdown') && mode === 'running' && (
              <div className="w-full bg-gray-600/50 rounded-full h-2 mt-4">
                <div 
                  className={`h-2 rounded-full transition-all ${intervalConfig.isRest ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </div>
          
          {/* Controls */}
          <div className="flex gap-3">
            {mode === 'stopped' && (
              <button
                onClick={startTimer}
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <PlayCircle size={20} /> Start
              </button>
            )}
            {mode === 'running' && (
              <button
                onClick={pauseTimer}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <StopCircle size={20} /> Pause
              </button>
            )}
            {mode === 'paused' && (
              <>
                <button
                  onClick={startTimer}
                  className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <PlayCircle size={20} /> Resume
                </button>
              </>
            )}
            {mode !== 'stopped' && (
              <button
                onClick={resetTimer}
                className={`px-4 py-3 ${theme.btnSecondary} rounded-xl font-medium flex items-center justify-center gap-2`}
              >
                <RotateCcw size={20} /> Reset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============== CALENDAR VIEW COMPONENT ==============
const CalendarView = ({ programState, setProgramState, workoutLogs, phase, program, theme, darkMode, setCurrentView, readiness }) => {
  const [viewMode, setViewMode] = useState('week'); // 'week', 'month', or 'real'
  const [selectedWeek, setSelectedWeek] = useState(programState.currentWeek);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDayDetails, setSelectedDayDetails] = useState(null); // For showing day details modal
  
  // Get total weeks in program
  const totalWeeks = useMemo(() => {
    if (!program?.phases) return 12;
    return Math.max(...program.phases.map(p => p.weeks[1]));
  }, [program?.phases]);
  
  // Calculate real date for a program week/day
  const getDateForProgramDay = useCallback((weekNum, dayNum) => {
    if (!programState.startDate) return null;
    // Use parseLocalDate to avoid UTC timezone issues with stored date strings
    const startDate = parseLocalDate(programState.startDate);
    const daysFromStart = ((weekNum - 1) * 7) + (dayNum - 1);
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + daysFromStart);
    return targetDate;
  }, [programState.startDate]);
  
  // Get program week/day for a real date
  const getProgramDayForDate = useCallback((date) => {
    if (!programState.startDate) return null;
    const startDate = parseLocalDate(programState.startDate);
    const diffTime = date.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return null;
    const weekNum = Math.floor(diffDays / 7) + 1;
    const dayNum = (diffDays % 7) + 1;
    if (weekNum > totalWeeks) return null;
    return { week: weekNum, day: dayNum };
  }, [programState.startDate, totalWeeks]);
  
  // Get phase for a specific week
  const getPhaseForWeek = (weekNum) => {
    return program?.phases?.find(p => weekNum >= p.weeks[0] && weekNum <= p.weeks[1]);
  };
  
  // Get workouts for a specific week
  const getWorkoutsForWeek = (weekNum) => {
    const weekPhase = getPhaseForWeek(weekNum);
    return weekPhase?.weeklyTemplate || [];
  };
  
  // Check if a workout is completed
  const isWorkoutCompleted = (weekNum, dayNum) => {
    return workoutLogs.some(log => 
      log.week === weekNum && 
      log.day === dayNum && 
      log.programId === programState.currentProgram && 
      log.completed
    );
  };
  
  // Get workout log for a specific day
  const getWorkoutLog = (weekNum, dayNum) => {
    return workoutLogs.find(log => 
      log.week === weekNum && 
      log.day === dayNum && 
      log.programId === programState.currentProgram
    );
  };
  
  // Get readiness for a specific date
  const getReadinessForDate = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    return readiness?.logs?.find(l => l.date === dateKey);
  };
  
  // Calculate week stats
  const getWeekStats = (weekNum) => {
    const weekWorkouts = getWorkoutsForWeek(weekNum);
    const plannedWorkouts = weekWorkouts.filter(w => w.type !== 'recovery' && w.type !== 'rest').length;
    const completedWorkouts = weekWorkouts.filter(w => isWorkoutCompleted(weekNum, w.day)).length;
    const totalDuration = workoutLogs
      .filter(log => log.week === weekNum && log.programId === programState.currentProgram && log.completed)
      .reduce((sum, log) => sum + (log.actual || log.duration || 0), 0);
    const avgRPE = workoutLogs
      .filter(log => log.week === weekNum && log.programId === programState.currentProgram && log.completed && log.rpe)
      .reduce((acc, log, _, arr) => acc + log.rpe / arr.length, 0);
    
    return {
      planned: plannedWorkouts,
      completed: completedWorkouts,
      percentage: plannedWorkouts > 0 ? Math.round((completedWorkouts / plannedWorkouts) * 100) : 0,
      duration: totalDuration,
      avgRPE: avgRPE ? avgRPE.toFixed(1) : null
    };
  };
  
  // Jump to a specific day
  const jumpToDay = (weekNum, dayNum) => {
    setProgramState(prev => ({
      ...prev,
      currentWeek: weekNum,
      currentDay: dayNum
    }));
    setCurrentView('workout');
  };
  
  // Get workout type color
  const getTypeColorLight = (type) => {
    const colors = {
      strength: darkMode ? 'bg-red-900/60 border-red-700' : 'bg-red-100 border-red-300',
      aerobic: darkMode ? 'bg-blue-900/60 border-blue-700' : 'bg-blue-100 border-blue-300',
      cardio: darkMode ? 'bg-blue-900/60 border-blue-700' : 'bg-blue-100 border-blue-300',
      long_aerobic: darkMode ? 'bg-purple-900/60 border-purple-700' : 'bg-purple-100 border-purple-300',
      long_effort: darkMode ? 'bg-purple-900/60 border-purple-700' : 'bg-purple-100 border-purple-300',
      muscular_endurance: darkMode ? 'bg-orange-900/60 border-orange-700' : 'bg-orange-100 border-orange-300',
      threshold: darkMode ? 'bg-amber-900/60 border-amber-700' : 'bg-amber-100 border-amber-300',
      recovery: darkMode ? 'bg-green-900/60 border-green-700' : 'bg-green-100 border-green-300',
      rest: darkMode ? 'bg-gray-800/60 border-gray-600' : 'bg-gray-100 border-gray-300',
    };
    return colors[type] || (darkMode ? 'bg-slate-700/60 border-slate-600' : 'bg-slate-100 border-slate-300');
  };
  
  // Get short label for workout type
  const getTypeLabel = (type) => {
    const labels = {
      strength: 'STR',
      aerobic: 'AER',
      cardio: 'AER',
      long_aerobic: 'LNG',
      long_effort: 'LNG',
      muscular_endurance: 'ME',
      threshold: 'THR',
      recovery: 'REC',
      rest: 'OFF',
    };
    return labels[type] || type?.slice(0, 3).toUpperCase() || '?';
  };
  
  // Format date short
  const formatDateShort = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  // Get readiness color
  const getReadinessColor = (score) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  // Render week view
  const renderWeekView = (weekNum) => {
    const weekWorkouts = getWorkoutsForWeek(weekNum);
    const weekPhase = getPhaseForWeek(weekNum);
    const isCurrentWeek = weekNum === programState.currentWeek;
    const stats = getWeekStats(weekNum);
    const weekStartDate = getDateForProgramDay(weekNum, 1);
    const weekEndDate = getDateForProgramDay(weekNum, 7);
    
    return (
      <div key={weekNum} className={`${theme.card} rounded-xl p-4 ${isCurrentWeek ? (darkMode ? 'ring-2 ring-blue-500' : 'ring-2 ring-blue-400') : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-bold ${theme.text}`}>Week {weekNum}</h3>
              {isCurrentWeek && (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded-full">Current</span>
              )}
            </div>
            <p className={`text-xs ${theme.textMuted}`}>{weekPhase?.name || 'Unknown Phase'}</p>
            {weekStartDate && (
              <p className={`text-xs ${theme.textSubtle}`}>
                {formatDateShort(weekStartDate)} - {formatDateShort(weekEndDate)}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${stats.percentage === 100 ? 'text-green-500' : stats.percentage > 0 ? 'text-blue-500' : theme.textMuted}`}>
              {stats.percentage}%
            </p>
            <p className={`text-xs ${theme.textMuted}`}>{stats.completed}/{stats.planned} done</p>
            {stats.duration > 0 && (
              <p className={`text-xs ${theme.textSubtle}`}>{Math.floor(stats.duration / 60)}h {stats.duration % 60}m</p>
            )}
          </div>
        </div>
        
        {/* Day headers - dynamic based on actual start date */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {[1, 2, 3, 4, 5, 6, 7].map(dayNum => {
            const dayDate = getDateForProgramDay(weekNum, dayNum);
            const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // Sunday = 0
            const dayLetter = dayDate ? dayNames[dayDate.getDay()] : '-';
            return (
              <div key={dayNum} className={`text-center text-xs font-medium ${theme.textMuted}`}>{dayLetter}</div>
            );
          })}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {[1, 2, 3, 4, 5, 6, 7].map(dayNum => {
            const workout = weekWorkouts.find(w => w.day === dayNum);
            const isCompleted = isWorkoutCompleted(weekNum, dayNum);
            const isCurrent = isCurrentWeek && dayNum === programState.currentDay;
            const dayDate = getDateForProgramDay(weekNum, dayNum);
            const dayReadiness = dayDate ? getReadinessForDate(dayDate) : null;
            const workoutLog = getWorkoutLog(weekNum, dayNum);
            
            return (
              <button
                key={dayNum}
                onClick={() => {
                  if (workoutLog || isCompleted) {
                    setSelectedDayDetails({ weekNum, dayNum, workout, workoutLog, dayDate, dayReadiness });
                  } else if (workout) {
                    jumpToDay(weekNum, dayNum);
                  }
                }}
                className={`
                  relative p-1.5 rounded-lg text-center transition-all min-h-[56px] flex flex-col items-center justify-center
                  ${workout ? `border ${getTypeColorLight(workout.type)} cursor-pointer hover:opacity-80` : `${theme.cardAlt} opacity-50`}
                  ${isCurrent ? 'ring-2 ring-blue-400' : ''}
                `}
              >
                {dayDate && (
                  <span className={`text-[10px] ${theme.textSubtle}`}>{dayDate.getDate()}</span>
                )}
                {workout ? (
                  <>
                    <span className={`text-[10px] font-bold ${theme.text}`}>
                      {getTypeLabel(workout.type)}
                    </span>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {isCompleted && <CheckCircle2 size={12} className="text-green-500" />}
                      {dayReadiness && (
                        <span className={`text-[9px] font-bold ${getReadinessColor(dayReadiness.score)}`}>
                          {dayReadiness.score}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <span className={`text-[9px] ${theme.textMuted}`}>OFF</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Calculate current streak
  const calculateStreak = useMemo(() => {
    if (!workoutLogs || workoutLogs.length === 0) return { current: 0, longest: 0 };
    
    // Get all completed workout dates, sorted descending
    const completedDates = workoutLogs
      .filter(log => log.completed && log.programId === programState.currentProgram)
      .map(log => {
        const date = getDateForProgramDay(log.week, log.day);
        return date ? date.toISOString().split('T')[0] : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a)); // Descending
    
    if (completedDates.length === 0) return { current: 0, longest: 0 };
    
    // Remove duplicates
    const uniqueDates = [...new Set(completedDates)];
    
    // Calculate current streak (from today backwards)
    const today = new Date().toISOString().split('T')[0];
    let currentStreak = 0;
    let checkDate = new Date(today);
    
    // Check if we trained today or yesterday to start streak
    const todayTrained = uniqueDates.includes(today);
    if (!todayTrained) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (uniqueDates.includes(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 1;
    const sortedAsc = [...uniqueDates].sort();
    
    for (let i = 1; i < sortedAsc.length; i++) {
      const prevDate = new Date(sortedAsc[i - 1]);
      const currDate = new Date(sortedAsc[i]);
      const diffDays = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    
    return { current: currentStreak, longest: longestStreak };
  }, [workoutLogs, programState.currentProgram, getDateForProgramDay]);
  
  // Render real calendar grid for a month
  const renderRealCalendarGrid = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = lastDay.getDate();
    
    // Adjust for Monday start (0 = Monday)
    const adjustedStart = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    
    // Build calendar grid
    const calendarDays = [];
    
    // Empty cells before first day
    for (let i = 0; i < adjustedStart; i++) {
      calendarDays.push(null);
    }
    
    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const programDay = getProgramDayForDate(date);
      const workout = programDay ? getWorkoutsForWeek(programDay.week).find(w => w.day === programDay.day) : null;
      const isCompleted = programDay ? isWorkoutCompleted(programDay.week, programDay.day) : false;
      const workoutLog = programDay ? getWorkoutLog(programDay.week, programDay.day) : null;
      const dayReadiness = getReadinessForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      
      calendarDays.push({
        date,
        day,
        programDay,
        workout,
        isCompleted,
        workoutLog,
        dayReadiness,
        isToday
      });
    }
    
    return (
      <div className={`${theme.card} rounded-xl p-4`}>
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setSelectedMonth(new Date(year, month - 1, 1))}
            className={`p-2 rounded-lg ${theme.cardAlt}`}
          >
            <ChevronLeft size={20} className={theme.text} />
          </button>
          <div className="text-center">
            <p className={`font-bold text-lg ${theme.text}`}>
              {selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => setSelectedMonth(new Date(year, month + 1, 1))}
            className={`p-2 rounded-lg ${theme.cardAlt}`}
          >
            <ChevronRight size={20} className={theme.text} />
          </button>
        </div>
        
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className={`text-center text-xs font-medium ${theme.textMuted} py-1`}>{d}</div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((dayData, idx) => {
            if (!dayData) {
              return <div key={idx} className="aspect-square" />;
            }
            
            const { date, day, programDay, workout, isCompleted, workoutLog, dayReadiness, isToday } = dayData;
            
            return (
              <button
                key={idx}
                onClick={() => {
                  if (programDay && (workoutLog || workout)) {
                    setSelectedDayDetails({ 
                      weekNum: programDay.week, 
                      dayNum: programDay.day, 
                      workout, 
                      workoutLog, 
                      dayDate: date, 
                      dayReadiness 
                    });
                  }
                }}
                className={`
                  aspect-square p-1 rounded-lg text-center transition-all flex flex-col items-center justify-center relative
                  ${isToday ? 'ring-2 ring-blue-400' : ''}
                  ${workout ? `border ${getTypeColorLight(workout.type)} cursor-pointer hover:opacity-80` : 
                    programDay ? `${theme.cardAlt}` : `${theme.cardAlt} opacity-30`}
                `}
              >
                <span className={`text-xs font-medium ${theme.text}`}>{day}</span>
                {workout && (
                  <span className={`text-[8px] ${theme.textMuted}`}>{getTypeLabel(workout.type)}</span>
                )}
                {isCompleted && (
                  <CheckCircle2 size={10} className="text-green-500 absolute bottom-0.5 right-0.5" />
                )}
                {dayReadiness && (
                  <span className={`text-[8px] absolute top-0.5 right-0.5 ${getReadinessColor(dayReadiness.score)}`}>
                    {dayReadiness.score}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Jump to today */}
        <button
          onClick={() => setSelectedMonth(new Date())}
          className="w-full mt-3 py-2 text-sm text-blue-500 hover:text-blue-400"
        >
          ↩ Jump to today
        </button>
      </div>
    );
  };
  
  // Calculate weeks to show based on view mode
  const weeksToShow = viewMode === 'week' 
    ? [selectedWeek] 
    : viewMode === 'month' 
      ? Array.from({ length: Math.min(4, totalWeeks - selectedWeek + 1) }, (_, i) => selectedWeek + i)
      : [];
  
  return (
    <div className="p-4 space-y-4">
      {/* Day Details Modal */}
      {selectedDayDetails && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDayDetails(null)}>
          <div className={`${theme.card} rounded-2xl p-5 max-w-sm w-full max-h-[80vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`font-bold text-lg ${theme.text}`}>
                  Week {selectedDayDetails.weekNum}, Day {selectedDayDetails.dayNum}
                </h3>
                {selectedDayDetails.dayDate && (
                  <p className={`text-sm ${theme.textMuted}`}>
                    {selectedDayDetails.dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>
              <button onClick={() => setSelectedDayDetails(null)} className={`p-2 rounded-lg ${theme.cardAlt}`}>
                <XIcon size={20} className={theme.text} />
              </button>
            </div>
            
            {/* Workout Info */}
            {selectedDayDetails.workout && (
              <div className={`p-3 rounded-lg border ${getTypeColorLight(selectedDayDetails.workout.type)} mb-4`}>
                <p className={`font-medium ${theme.text} capitalize`}>{selectedDayDetails.workout.type.replace('_', ' ')}</p>
                {selectedDayDetails.workout.duration && (
                  <p className={`text-sm ${theme.textMuted}`}>{selectedDayDetails.workout.duration} min planned</p>
                )}
              </div>
            )}
            
            {/* Completion Status */}
            {selectedDayDetails.workoutLog ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500" size={20} />
                  <span className={`font-medium ${theme.text}`}>Completed</span>
                </div>
                
                {selectedDayDetails.workoutLog.actual && (
                  <div className={`${theme.cardAlt} p-3 rounded-lg`}>
                    <p className={`text-sm ${theme.textMuted}`}>Duration</p>
                    <p className={`font-bold ${theme.text}`}>{selectedDayDetails.workoutLog.actual} min</p>
                  </div>
                )}
                
                {selectedDayDetails.workoutLog.rpe && (
                  <div className={`${theme.cardAlt} p-3 rounded-lg`}>
                    <p className={`text-sm ${theme.textMuted}`}>RPE</p>
                    <p className={`font-bold ${theme.text}`}>{selectedDayDetails.workoutLog.rpe}/10</p>
                  </div>
                )}
                
                {selectedDayDetails.workoutLog.notes && (
                  <div className={`${theme.cardAlt} p-3 rounded-lg`}>
                    <p className={`text-sm ${theme.textMuted}`}>Notes</p>
                    <p className={`text-sm ${theme.text}`}>{selectedDayDetails.workoutLog.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className={`${theme.cardAlt} p-4 rounded-lg text-center`}>
                <p className={`${theme.textMuted}`}>Not yet completed</p>
              </div>
            )}
            
            {/* Readiness */}
            {selectedDayDetails.dayReadiness && (
              <div className={`${theme.cardAlt} p-3 rounded-lg mt-3`}>
                <p className={`text-sm ${theme.textMuted} mb-1`}>Readiness Score</p>
                <p className={`font-bold text-xl ${getReadinessColor(selectedDayDetails.dayReadiness.score)}`}>
                  {selectedDayDetails.dayReadiness.score}
                </p>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  jumpToDay(selectedDayDetails.weekNum, selectedDayDetails.dayNum);
                  setSelectedDayDetails(null);
                }}
                className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg font-medium"
              >
                Go to Workout
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Header with Streak */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold ${theme.text}`}>Calendar</h2>
          {calculateStreak.current > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Flame size={14} className="text-orange-500" />
              <span className={`text-sm font-medium text-orange-500`}>{calculateStreak.current} day streak</span>
              {calculateStreak.longest > calculateStreak.current && (
                <span className={`text-xs ${theme.textMuted}`}>(best: {calculateStreak.longest})</span>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('week')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'week' 
                ? 'bg-blue-500 text-white' 
                : `${theme.cardAlt} ${theme.text}`
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'month' 
                ? 'bg-blue-500 text-white' 
                : `${theme.cardAlt} ${theme.text}`
            }`}
          >
            Program
          </button>
          <button
            onClick={() => setViewMode('real')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'real' 
                ? 'bg-blue-500 text-white' 
                : `${theme.cardAlt} ${theme.text}`
            }`}
          >
            Calendar
          </button>
        </div>
      </div>
      
      {/* Week Navigation - show for week and month views */}
      {viewMode !== 'real' && (
        <div className={`${theme.card} rounded-xl p-3 flex items-center justify-between`}>
          <button
            onClick={() => setSelectedWeek(Math.max(1, selectedWeek - (viewMode === 'week' ? 1 : 4)))}
            disabled={selectedWeek <= 1}
            className={`p-2 rounded-lg ${theme.cardAlt} disabled:opacity-30`}
          >
            <ChevronLeft size={20} className={theme.text} />
          </button>
          <div className="text-center">
            <p className={`font-medium ${theme.text}`}>
              {viewMode === 'week' ? `Week ${selectedWeek}` : `Weeks ${selectedWeek}-${Math.min(selectedWeek + 3, totalWeeks)}`}
            </p>
            <p className={`text-xs ${theme.textMuted}`}>
              {getPhaseForWeek(selectedWeek)?.name || 'Unknown Phase'}
            </p>
          </div>
          <button
            onClick={() => setSelectedWeek(Math.min(totalWeeks, selectedWeek + (viewMode === 'week' ? 1 : 4)))}
            disabled={selectedWeek >= totalWeeks}
            className={`p-2 rounded-lg ${theme.cardAlt} disabled:opacity-30`}
          >
            <ChevronRight size={20} className={theme.text} />
          </button>
        </div>
      )}
      
      {/* Jump to Current - for week/month views */}
      {viewMode !== 'real' && selectedWeek !== programState.currentWeek && (
        <button
          onClick={() => setSelectedWeek(programState.currentWeek)}
          className="w-full py-2 text-sm text-blue-500 hover:text-blue-400"
        >
          ↩ Jump to current week (Week {programState.currentWeek})
        </button>
      )}
      
      {/* Real Calendar Grid */}
      {viewMode === 'real' && renderRealCalendarGrid()}
      
      {/* Week Cards - for week/month views */}
      {viewMode !== 'real' && (
        <div className="space-y-4">
          {weeksToShow.map(weekNum => renderWeekView(weekNum))}
        </div>
      )}
      
      {/* Program Overview */}
      <div className={`${theme.card} rounded-xl p-4`}>
        <h3 className={`font-semibold ${theme.text} mb-3`}>Program Overview</h3>
        <div className="space-y-2">
          {program?.phases?.map((p, idx) => {
            const isActive = programState.currentWeek >= p.weeks[0] && programState.currentWeek <= p.weeks[1];
            const completedWeeks = Math.max(0, Math.min(programState.currentWeek, p.weeks[1]) - p.weeks[0] + 1);
            const totalPhaseWeeks = p.weeks[1] - p.weeks[0] + 1;
            const progress = programState.currentWeek > p.weeks[1] ? 100 : 
                           programState.currentWeek < p.weeks[0] ? 0 :
                           Math.round((completedWeeks / totalPhaseWeeks) * 100);
            
            return (
              <button
                key={idx}
                onClick={() => setSelectedWeek(p.weeks[0])}
                className={`w-full text-left p-3 rounded-lg ${theme.cardAlt} ${isActive ? (darkMode ? 'ring-1 ring-blue-500' : 'ring-1 ring-blue-400') : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-medium ${theme.text}`}>{p.name}</span>
                  <span className={`text-xs ${theme.textMuted}`}>Weeks {p.weeks[0]}-{p.weeks[1]}</span>
                </div>
                <div className="w-full bg-gray-600/50 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${isActive ? 'bg-blue-500' : progress === 100 ? 'bg-green-500' : 'bg-gray-500'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className={`${theme.card} rounded-xl p-4`}>
        <h3 className={`font-semibold ${theme.text} mb-3`}>Workout Types</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            { type: 'strength', label: 'Strength' },
            { type: 'aerobic', label: 'Aerobic' },
            { type: 'long_aerobic', label: 'Long Aerobic' },
            { type: 'threshold', label: 'Threshold' },
            { type: 'muscular_endurance', label: 'Muscular End.' },
            { type: 'recovery', label: 'Recovery' },
          ].map(({ type, label }) => (
            <div key={type} className={`flex items-center gap-2 p-2 rounded border ${getTypeColorLight(type)}`}>
              <span className={theme.text}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============== WELCOME / LOGIN SCREEN ==============
const WelcomeScreen = ({ onLogin, onCreateProfile, onLinkAccount, biometricAvailable, savedProfile, isLoading }) => {
  const [step, setStep] = useState(savedProfile ? 'welcome-back' : 'welcome'); // 'welcome', 'welcome-back', 'create', 'link'
  const [name, setName] = useState('');
  const [useBiometric, setUseBiometric] = useState(true);
  const [syncCode, setSyncCode] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleLinkAccount = async () => {
    if (!syncCode.trim()) {
      setError('Please enter your sync code');
      return;
    }
    setIsAuthenticating(true);
    setError('');
    const result = await onLinkAccount(syncCode.trim());
    if (!result.success) {
      setError(result.error || 'Could not find data with this sync code');
    }
    setIsAuthenticating(false);
  };

  const handleCreateProfile = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    setIsAuthenticating(true);
    setError('');
    const result = await onCreateProfile(name.trim(), useBiometric && biometricAvailable);
    if (!result.success) {
      setError(result.error || 'Failed to create profile');
    }
    setIsAuthenticating(false);
  };

  const handleBiometricLogin = async () => {
    setIsAuthenticating(true);
    setError('');
    const result = await onLogin();
    if (!result.success) {
      setError(result.error || 'Authentication failed');
      // Fall back to showing options
      setStep('welcome');
    }
    setIsAuthenticating(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⛰️</div>
          <Loader className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        {/* Logo & Branding */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="text-7xl mb-4">⛰️</div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Training Hub</h1>
          <p className="text-blue-300/80 text-lg">Your Personal Training Companion</p>
        </div>

        {/* Welcome Back - Returning User */}
        {step === 'welcome-back' && savedProfile && (
          <div className="w-full max-w-sm space-y-6 animate-fadeInUp">
            <div className="glass-dark rounded-3xl p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                <span className="text-3xl">{savedProfile.name?.charAt(0)?.toUpperCase() || '?'}</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Welcome back!</h2>
              <p className="text-blue-300/70 mb-6">{savedProfile.name}</p>

              {savedProfile.hasBiometric && biometricAvailable ? (
                <button
                  onClick={handleBiometricLogin}
                  disabled={isAuthenticating}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isAuthenticating ? (
                    <Loader className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Fingerprint size={24} />
                      Sign in with Face ID
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => onLogin()}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30 hover:scale-[1.02] transition-all"
                >
                  Continue as {savedProfile.name}
                </button>
              )}

              {error && (
                <p className="text-red-400 text-sm mt-4">{error}</p>
              )}
            </div>

            <button
              onClick={() => setStep('welcome')}
              className="w-full py-3 text-blue-300/70 hover:text-white transition-colors text-sm"
            >
              Not {savedProfile.name}? Switch profile
            </button>
          </div>
        )}

        {/* Welcome - New User */}
        {step === 'welcome' && (
          <div className="w-full max-w-sm space-y-4 animate-fadeInUp">
            <div className="glass-dark rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-white mb-2 text-center">Get Started</h2>
              <p className="text-blue-300/70 text-center mb-6">Create your profile to begin training</p>

              <button
                onClick={() => setStep('create')}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 mb-3"
              >
                <Sparkles size={20} />
                Create Profile
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-transparent text-blue-300/50">or</span>
                </div>
              </div>

              <button
                onClick={() => setStep('link')}
                className="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-3"
              >
                <Cloud size={20} />
                Link Existing Account
              </button>

              {savedProfile && (
                <button
                  onClick={() => setStep('welcome-back')}
                  className="w-full py-3 text-blue-300/70 hover:text-white transition-colors text-sm mt-3"
                >
                  Sign in as {savedProfile.name}
                </button>
              )}
            </div>

            {/* Features Preview */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              {[
                { icon: '📊', label: 'Track Progress' },
                { icon: '💪', label: 'Custom Programs' },
                { icon: '🔄', label: 'Cloud Sync' },
              ].map((feature, i) => (
                <div key={i} className="glass-dark rounded-2xl p-4 text-center">
                  <div className="text-2xl mb-1">{feature.icon}</div>
                  <p className="text-xs text-blue-300/70">{feature.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Profile */}
        {step === 'create' && (
          <div className="w-full max-w-sm animate-fadeInUp">
            <div className="glass-dark rounded-3xl p-8">
              <button
                onClick={() => setStep('welcome')}
                className="text-blue-300/70 hover:text-white mb-4 flex items-center gap-1"
              >
                <ChevronLeft size={20} /> Back
              </button>

              <h2 className="text-2xl font-bold text-white mb-6">Create Profile</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-blue-300/70 text-sm mb-2">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    autoFocus
                  />
                </div>

                {biometricAvailable && (
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Fingerprint className="text-blue-400" size={24} />
                      <div>
                        <p className="text-white font-medium">Enable Face ID</p>
                        <p className="text-blue-300/50 text-xs">Quick & secure login</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setUseBiometric(!useBiometric)}
                      className={`w-12 h-7 rounded-full transition-colors ${useBiometric ? 'bg-blue-500' : 'bg-white/20'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${useBiometric ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                )}

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                <button
                  onClick={handleCreateProfile}
                  disabled={isAuthenticating || !name.trim()}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAuthenticating ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      {useBiometric && biometricAvailable ? 'Setting up Face ID...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      {useBiometric && biometricAvailable && <Fingerprint size={20} />}
                      Create & Continue
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Link Existing Account */}
        {step === 'link' && (
          <div className="w-full max-w-sm animate-fadeInUp">
            <div className="glass-dark rounded-3xl p-8">
              <button
                onClick={() => setStep('welcome')}
                className="text-blue-300/70 hover:text-white mb-4 flex items-center gap-1"
              >
                <ChevronLeft size={20} /> Back
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Cloud size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Link Account</h2>
                <p className="text-blue-300/70 text-sm">Enter your sync code to access your existing data on this device</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-blue-300/70 text-sm mb-2">Sync Code</label>
                  <input
                    type="text"
                    value={syncCode}
                    onChange={(e) => setSyncCode(e.target.value)}
                    placeholder="e.g., john@email.com or my-sync-code"
                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    autoFocus
                  />
                </div>

                <p className="text-blue-300/50 text-xs">
                  💡 Find your sync code in Settings → Sync Code on your other device
                </p>

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                <button
                  onClick={handleLinkAccount}
                  disabled={isAuthenticating || !syncCode.trim()}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-2xl shadow-lg shadow-green-500/30 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAuthenticating ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Linking...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={20} />
                      Link & Sync Data
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 text-center relative z-10">
        <p className="text-blue-300/40 text-xs">Training Hub v2.2 • Your data syncs securely to the cloud</p>
      </div>
    </div>
  );
};

// ============== MAIN APP ==============
export default function App() {
  // Auth state
  const { isAuthenticated, isLoading: authLoading, profile, biometricAvailable, loginWithBiometric, createProfile, linkAccount, logout } = useAuth();

  const [currentView, setCurrentView] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [cloudLoaded, setCloudLoaded] = useState(false);

  // Cloud sync status
  const [syncStatus, setSyncStatus] = useSyncStatus();
  
  // Use synced storage for all important data
  const [darkMode, setDarkMode] = useSyncedStorage('trainingHub_darkMode', window.matchMedia('(prefers-color-scheme: dark)').matches, syncStatus, setSyncStatus);
  const [athleteProfile, setAthleteProfile] = useSyncedStorage('trainingHub_athleteProfile', DEFAULT_ATHLETE_PROFILE, syncStatus, setSyncStatus);
  const [readiness, setReadiness] = useSyncedStorage('trainingHub_readiness', DEFAULT_READINESS, syncStatus, setSyncStatus);
  const [benchmarkResults, setBenchmarkResults] = useSyncedStorage('trainingHub_benchmarkResults', {}, syncStatus, setSyncStatus);
  const [customPrograms, setCustomPrograms] = useSyncedStorage('trainingHub_customPrograms', {}, syncStatus, setSyncStatus);
  const [programTemplates, setProgramTemplates] = useSyncedStorage('trainingHub_programTemplates', {}, syncStatus, setSyncStatus);
  const [programState, setProgramState] = useSyncedStorage('trainingHub_programState', { 
    currentProgram: 'combatAlpinist', 
    currentWeek: 1, 
    currentDay: 1, 
    startDate: getTodayKey(),
    // Detour tracking
    activeDetour: null, // { blockId, blockType, weekInDetour, returnToWeek, startedAt }
  }, syncStatus, setSyncStatus);
  const [workoutLogs, setWorkoutLogs] = useSyncedStorage('trainingHub_workoutLogs', [], syncStatus, setSyncStatus);
  const [exerciseCompletion, setExerciseCompletion] = useState({});
  const [setTrackingData, setSetTrackingData] = useState({}); // { exerciseName: [{ completed, plannedWeight, actualWeight, rpe }, ...] }
  const [workoutData, setWorkoutData] = useState({ duration: 0, rpe: 5, notes: '', newPRs: {} });
  const [showProgramUpload, setShowProgramUpload] = useState(false);
  const [showTemplateUpload, setShowTemplateUpload] = useState(false);
  const [viewingProgramId, setViewingProgramId] = useState(null); // For program overview
  const [showDetourPicker, setShowDetourPicker] = useState(false); // For detour selection
  const [exerciseSwaps, setExerciseSwaps] = useSyncedStorage('trainingHub_exerciseSwaps', {}, syncStatus, setSyncStatus); // { "originalExerciseName": "swappedExerciseId" }
  const [customExercises, setCustomExercises] = useSyncedStorage('trainingHub_customExercises', {}, syncStatus, setSyncStatus); // User-created exercises
  const [hasSeenOnboarding, setHasSeenOnboarding] = useSyncedStorage('trainingHub_hasSeenOnboarding', false, syncStatus, setSyncStatus); // First-time user flag
  const [showOnboarding, setShowOnboarding] = useState(false); // Show onboarding modal
  const [swappingExercise, setSwappingExercise] = useState(null); // { name, pattern } for swap picker
  const [showAllSwapOptions, setShowAllSwapOptions] = useState(false); // Show unavailable equipment options too
  const [showAddExercise, setShowAddExercise] = useState(false); // Show add custom exercise modal
  const [viewingExerciseHistory, setViewingExerciseHistory] = useState(null); // For exercise history modal
  
  // Load from cloud on app start - only after authentication
  useEffect(() => {
    if (!isAuthenticated) {
      setCloudLoaded(false);
      return;
    }
    const initCloudSync = async () => {
      const result = await loadFromCloud();
      console.log('Cloud sync result:', result);
      if (result.success && result.loaded > 0 && !result.skipped) {
        // Data was loaded from cloud, reload to pick it up in React state
        console.log('Reloading to apply cloud data...');
        window.location.reload();
        return;
      }
      setCloudLoaded(true);
    };
    initCloudSync();
  }, [isAuthenticated]);

  // Show onboarding for first-time users
  useEffect(() => {
    if (isAuthenticated && cloudLoaded && !hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, [isAuthenticated, cloudLoaded, hasSeenOnboarding]);

  // Offline status
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Sync code state for recovery/multi-device
  const [syncCodeInput, setSyncCodeInput] = useState('');
  const [showSyncCodeSetup, setShowSyncCodeSetup] = useState(false);
  const [syncCodeLoading, setSyncCodeLoading] = useState(false);

  // Floating pane system - opens dashboard items as overlays instead of full views
  const [floatingPane, setFloatingPane] = useState(null); // 'workout', 'readiness', 'charts', 'calendar', 'load', 'week'
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
  
  // Get available detours - merge program-specific with universal
  const availableDetoursForProgram = useMemo(() => {
    const programDetours = program?.availableDetours || {};
    return {
      specialty: [...(programDetours.specialty || []), ...UNIVERSAL_DETOURS.specialty].filter((d, i, arr) => arr.findIndex(x => x.id === d.id) === i),
      life: [...(programDetours.life || []), ...UNIVERSAL_DETOURS.life].filter((d, i, arr) => arr.findIndex(x => x.id === d.id) === i)
    };
  }, [program?.availableDetours]);
  
  const detourBlock = useMemo(() => {
    if (!activeDetour) return null;
    const { blockId, blockType } = activeDetour;
    const blocks = availableDetoursForProgram[blockType] || [];
    return blocks.find(b => b.id === blockId);
  }, [activeDetour, availableDetoursForProgram]);

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
  const phaseStartWeek = phase?.weeks?.[0] || 1;
  const todayWorkout = useMemo(() => {
    if (!todayWorkoutRaw) return null;
    // If it's a template-based program, apply auto-propagation with progression
    if (program?.isTemplate) {
      return generateWorkoutFromTemplate(todayWorkoutRaw, athleteProfile, currentWeekNum, readinessScore, phaseStartWeek);
    }
    // For non-template programs, still apply progressions
    return generateWorkoutFromTemplate(todayWorkoutRaw, athleteProfile, currentWeekNum, readinessScore, phaseStartWeek);
  }, [todayWorkoutRaw, athleteProfile, currentWeekNum, readinessScore, program?.isTemplate, phaseStartWeek]);

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

  // Handle set tracking data updates
  const handleSetDataChange = (exerciseName, setsData) => {
    setSetTrackingData(prev => ({ ...prev, [exerciseName]: setsData }));
    // Update exercise completion based on all sets being complete
    const allComplete = setsData.every(s => s.completed);
    setExerciseCompletion(prev => ({ ...prev, [exerciseName]: allComplete }));
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
      detour: activeDetour ? { blockId: activeDetour.blockId, blockType: activeDetour.blockType } : null,
      // Exercise-level data for history tracking
      exerciseData: todayWorkout?.prescription?.exercises?.map(ex => {
        const prKey = ex.prKey;
        const prValue = prKey ? athleteProfile.prs?.[prKey]?.value : null;
        const workingWeight = ex.percentage && prValue ? calculateWorkingWeight(prValue, ex.percentage) : null;
        const trackingData = setTrackingData[ex.name] || [];
        return {
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          weight: workingWeight || workoutData.newPRs?.[prKey] || null,
          percentage: ex.percentage,
          prKey: ex.prKey,
          completed: exerciseCompletion[ex.name] || false,
          swappedTo: exerciseSwaps[ex.name] || null,
          // Set-level tracking data for progression analysis
          setData: trackingData.map(s => ({
            actualWeight: s.actualWeight ? parseFloat(s.actualWeight) : null,
            rpe: s.rpe ? parseFloat(s.rpe) : null,
            completed: s.completed
          }))
        };
      }) || []
    };
    setWorkoutLogs(prev => [...prev.filter(log => !(log.date === newLog.date && log.session === newLog.session && log.programId === newLog.programId)), newLog]);
    setExerciseCompletion({});
    setSetTrackingData({});
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

  // Training load calculations using new system
  const atl = calculateATL(workoutLogs);
  const ctl = calculateCTL(workoutLogs);
  const acr = calculateACR(workoutLogs);
  const loadStatus = getLoadStatus(acr, atl, ctl);

  // Load history for sparkline visualizations (last 14 days for compact view)
  const loadHistory = useMemo(() => getLoadHistory(workoutLogs, 14), [workoutLogs]);
  const atlHistory = useMemo(() => loadHistory.map(h => h.atl), [loadHistory]);
  const ctlHistory = useMemo(() => loadHistory.map(h => h.ctl), [loadHistory]);

  // Load-adjusted readiness (combines subjective + objective)
  const adjustedReadinessScore = readinessScore ? calculateLoadAdjustedReadiness(readinessScore, acr, loadStatus) : null;
  const adjustedReadinessInfo = adjustedReadinessScore ? getReadinessLabel(adjustedReadinessScore) : null;
  
  // Legacy values for backward compatibility
  const acuteLoad = atl;
  const chronicLoad = ctl;
  const loadRatio = acr;

  // Progression analysis for today's exercises
  const progressionAnalyses = useMemo(() => {
    const exercises = todayWorkout?.prescription?.exercises || [];
    return analyzeAllProgressions(workoutLogs, athleteProfile, exercises);
  }, [workoutLogs, athleteProfile, todayWorkout?.prescription?.exercises]);

  const theme = {
    bg: darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-100 to-slate-200',
    card: darkMode ? 'bg-gray-800/90 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50',
    cardAlt: darkMode ? 'bg-gray-700/80' : 'bg-slate-50/80',
    cardHover: 'card-hover',
    text: darkMode ? 'text-gray-100' : 'text-slate-800',
    textMuted: darkMode ? 'text-gray-300' : 'text-slate-500',
    textSubtle: darkMode ? 'text-gray-400' : 'text-slate-400',
    textDisabled: darkMode ? 'text-gray-500' : 'text-slate-400',
    border: darkMode ? 'border-gray-700/50' : 'border-slate-200/50',
    input: darkMode ? 'bg-gray-700/80 border-gray-600 text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/50' : 'bg-white/90 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/50',
    header: darkMode ? 'glass-dark' : 'bg-gradient-to-r from-slate-800 to-slate-900',
    nav: darkMode ? 'glass-dark' : 'bg-white/90 backdrop-blur-xl border-slate-200/50 shadow-lg shadow-slate-200/20',
    modal: darkMode ? 'bg-gray-800/95 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl shadow-2xl',
    modalBackdrop: 'modal-backdrop',
    glass: darkMode ? 'glass-dark' : 'glass-light',
    gradient: 'bg-gradient-to-r from-blue-500 to-purple-600',
    gradientText: 'gradient-text',
    btnDisabled: darkMode ? 'bg-gray-700 text-gray-400' : 'bg-slate-200 text-slate-400',
    // New high-contrast button styles for dark mode
    btnSecondary: darkMode ? 'bg-gray-600/60 hover:bg-gray-500/60 text-gray-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    btnGhost: darkMode ? 'hover:bg-gray-700/50 text-gray-200' : 'hover:bg-slate-100 text-slate-600',
    chip: darkMode ? 'bg-gray-600/50 text-gray-200 hover:bg-gray-500/50' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
    chipActive: 'bg-blue-500 text-white',
    badge: darkMode ? 'bg-gray-600/60 text-gray-200' : 'bg-slate-100 text-slate-600',
    iconMuted: darkMode ? 'text-gray-400' : 'text-slate-400',
  };

  // Handle linking account with sync code - loads cloud data then authenticates
  const handleLinkAccount = async (code) => {
    try {
      // First try to load data with this sync code
      const loadResult = await loadWithSyncCode(code);

      if (!loadResult.success) {
        return { success: false, error: loadResult.error || 'No data found for this sync code' };
      }

      if (loadResult.loaded === 0) {
        return { success: false, error: 'No data found for this sync code. Check the code and try again.' };
      }

      // Data loaded successfully, now link the account
      const linkResult = await linkAccount(code);

      if (linkResult.success) {
        // Reload the app to pick up the new cloud data
        window.location.reload();
      }

      return linkResult;
    } catch (error) {
      console.error('Link account error:', error);
      return { success: false, error: error.message };
    }
  };

  // Show welcome/login screen if not authenticated
  if (!isAuthenticated || authLoading) {
    return (
      <WelcomeScreen
        onLogin={loginWithBiometric}
        onCreateProfile={createProfile}
        onLinkAccount={handleLinkAccount}
        biometricAvailable={biometricAvailable}
        savedProfile={getSavedProfile()}
        isLoading={authLoading}
      />
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg}`}>
      {/* Onboarding Flow for First-Time Users */}
      {showOnboarding && (
        <OnboardingFlow
          theme={theme}
          darkMode={darkMode}
          onComplete={() => {
            setShowOnboarding(false);
            setHasSeenOnboarding(true);
          }}
        />
      )}

      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-amber-500 text-amber-950 text-center py-1 text-sm font-medium">
          📴 Offline Mode — Data saves locally
        </div>
      )}
      
      {/* Header */}
      <header className={`${theme.header} text-white p-4 sticky top-0 z-50 shadow-lg`}>
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            {/* Home Button - show when not on dashboard */}
            {currentView !== 'dashboard' && (
              <button
                onClick={() => setCurrentView('dashboard')}
                className="p-2 -ml-2 mr-1 hover:bg-white/10 rounded-xl transition-all"
                title="Return to Dashboard"
              >
                <Home size={20} />
              </button>
            )}
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <span className="text-2xl">⛰️</span>
              <h1 className="text-lg font-bold tracking-tight">Training Hub <span className="text-xs font-normal opacity-50">v2.2</span></h1>
            </button>
          </div>
          <div className="flex items-center gap-1">
            {/* Profile indicator */}
            {profile && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10">
                <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-[10px] font-bold">
                  {profile.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span className="text-xs hidden sm:inline opacity-80">{profile.name?.split(' ')[0]}</span>
              </div>
            )}
            {/* Cloud Sync Status */}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${syncStatus.syncing ? 'bg-blue-500/20' : isOffline ? 'bg-amber-500/20' : 'bg-green-500/20'}`}>
              {syncStatus.syncing ? (
                <Loader size={12} className="animate-spin text-blue-400" />
              ) : isOffline ? (
                <CloudOff size={12} className="text-amber-400" />
              ) : (
                <Cloud size={12} className="text-green-400" />
              )}
            </div>
            {readinessScore && (
              <div className={`px-2.5 py-1 rounded-xl ${readinessScore >= 70 ? 'bg-green-500/20' : readinessScore >= 50 ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
                <span className={`text-sm font-bold ${getReadinessColor(readinessScore)}`}>{readinessScore}</span>
              </div>
            )}
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-white/10 rounded-xl transition-all">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 hover:bg-white/10 rounded-xl transition-all">{menuOpen ? <X size={24} /> : <Menu size={24} />}</button>
          </div>
        </div>
      </header>

      {/* Floating Menu Modal */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 modal-backdrop animate-fadeIn" onClick={() => setMenuOpen(false)}>
          <nav
            className={`absolute top-16 left-4 right-4 max-w-md mx-auto ${theme.modal} rounded-2xl p-3 shadow-2xl animate-fadeInUp`}
            onClick={e => e.stopPropagation()}
          >
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: Home, bg: 'bg-blue-500/20', text: 'text-blue-500', ring: 'ring-blue-500/50', hover: 'hover:bg-blue-500/10' },
                { id: 'readiness', label: 'Readiness', icon: Battery, bg: 'bg-green-500/20', text: 'text-green-500', ring: 'ring-green-500/50', hover: 'hover:bg-green-500/10' },
                { id: 'workout', label: 'Workout', icon: Play, bg: 'bg-purple-500/20', text: 'text-purple-500', ring: 'ring-purple-500/50', hover: 'hover:bg-purple-500/10' },
                { id: 'calendar', label: 'Calendar', icon: Calendar, bg: 'bg-orange-500/20', text: 'text-orange-500', ring: 'ring-orange-500/50', hover: 'hover:bg-orange-500/10' },
                { id: 'charts', label: 'Charts', icon: LineChart, bg: 'bg-cyan-500/20', text: 'text-cyan-500', ring: 'ring-cyan-500/50', hover: 'hover:bg-cyan-500/10' },
                { id: 'profile', label: 'Profile', icon: User, bg: 'bg-pink-500/20', text: 'text-pink-500', ring: 'ring-pink-500/50', hover: 'hover:bg-pink-500/10' },
                { id: 'benchmarks', label: 'Benchmarks', icon: Flag, bg: 'bg-amber-500/20', text: 'text-amber-500', ring: 'ring-amber-500/50', hover: 'hover:bg-amber-500/10' },
                { id: 'log', label: 'Workout Log', icon: FileText, bg: 'bg-emerald-500/20', text: 'text-emerald-500', ring: 'ring-emerald-500/50', hover: 'hover:bg-emerald-500/10' },
                { id: 'progress', label: 'Progress', icon: BarChart3, bg: 'bg-indigo-500/20', text: 'text-indigo-500', ring: 'ring-indigo-500/50', hover: 'hover:bg-indigo-500/10' },
                { id: 'programs', label: 'Programs', icon: Dumbbell, bg: 'bg-rose-500/20', text: 'text-rose-500', ring: 'ring-rose-500/50', hover: 'hover:bg-rose-500/10' },
                { id: 'settings', label: 'Settings', icon: Settings, bg: 'bg-slate-500/20', text: 'text-slate-400', ring: 'ring-slate-500/50', hover: 'hover:bg-slate-500/10' }
              ].map(({ id, label, icon: Icon, bg, text, ring, hover }) => (
                <button
                  key={id}
                  onClick={() => { setCurrentView(id); setMenuOpen(false); }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    currentView === id
                      ? `${bg} ring-2 ${ring}`
                      : `${theme.cardAlt} ${hover}`
                  }`}
                >
                  <div className={`p-2 rounded-lg ${bg}`}>
                    <Icon size={18} className={text} />
                  </div>
                  <span className={`text-sm font-medium ${theme.text}`}>{label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      )}

      <main className="max-w-2xl mx-auto pb-28">
        {/* DASHBOARD */}
        {currentView === 'dashboard' && (
          <div className="p-4 space-y-4 animate-fadeIn">
            {/* Active Detour Banner */}
            {activeDetour && detourBlock && (
              <div className={`p-4 rounded-2xl border-2 animate-fadeInUp ${activeDetour.blockType === 'specialty' ? 'border-orange-500 bg-gradient-to-br from-orange-500/20 to-orange-600/10' : 'border-green-500 bg-gradient-to-br from-green-500/20 to-green-600/10'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs uppercase font-semibold tracking-wider ${activeDetour.blockType === 'specialty' ? 'text-orange-500' : 'text-green-500'}`}>
                      {activeDetour.blockType === 'specialty' ? '⚡ Specialty Block' : '🛡️ Life Block'}
                    </p>
                    <p className={`font-bold text-lg ${theme.text}`}>{detourBlock.name}</p>
                    <p className={`text-sm ${theme.textMuted}`}>Week {activeDetour.weekInDetour} of {detourBlock.duration?.max || '?'}</p>
                  </div>
                  <button
                    onClick={endDetour}
                    className={`px-4 py-2 rounded-xl text-sm font-medium ${theme.cardAlt} ${theme.text} hover:scale-105 transition-transform`}
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

            {/* Readiness Section - High Altitude Theme */}
            {!todayReadiness && (
              <button onClick={() => setFloatingPane('readiness')} className={`w-full p-5 ${darkMode ? 'bg-gradient-to-br from-cyan-900/30 via-gray-800/50 to-blue-900/30 border-cyan-600/30' : 'bg-gradient-to-br from-cyan-50 via-white to-blue-50 border-cyan-200'} border rounded-2xl flex items-center gap-4 card-hover`}>
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-cyan-500/20' : 'bg-cyan-100'}`}>
                  <Mountain className={darkMode ? 'text-cyan-400' : 'text-cyan-600'} size={24} />
                </div>
                <div className="text-left flex-1">
                  <p className={`font-semibold ${theme.text}`}>Begin Altitude Check</p>
                  <p className={`text-sm ${theme.textMuted}`}>Assess readiness before ascending</p>
                </div>
                <ChevronRight className={`${theme.textMuted}`} />
              </button>
            )}
            {todayReadiness && (
              <button onClick={() => setFloatingPane('readiness')} className={`w-full ${theme.card} rounded-2xl p-5 card-hover`}>
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-xs ${theme.textMuted} uppercase tracking-wider font-medium`}>Readiness Status</p>
                  <div className={`p-2 ${theme.cardAlt} rounded-lg`}><Edit3 size={14} className={theme.textMuted} /></div>
                </div>
                <div className="flex justify-center">
                  <ReadinessGauge
                    score={adjustedReadinessScore || readinessScore}
                    readinessData={todayReadiness}
                    theme={theme}
                    darkMode={darkMode}
                    size="medium"
                  />
                </div>
                {adjustedReadinessScore && adjustedReadinessScore !== readinessScore && (
                  <p className={`text-xs ${theme.textMuted} text-center mt-2`}>Base: {readinessScore} (load adjusted)</p>
                )}
              </button>
            )}

            {/* Training Load Card - High Altitude Theme */}
            <TrainingLoadCard
              atl={atl}
              ctl={ctl}
              acr={acr}
              atlHistory={atlHistory}
              ctlHistory={ctlHistory}
              loadStatus={loadStatus.zone}
              theme={theme}
              darkMode={darkMode}
            />

            {/* Load Zone Meter */}
            <LoadZoneMeter acr={acr} theme={theme} darkMode={darkMode} />

            {/* Charts Quick Link */}
            <button onClick={() => setFloatingPane('charts')} className={`w-full ${theme.card} rounded-2xl p-4 flex items-center justify-between card-hover group`}>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 group-hover:scale-110 transition-transform">
                  <LineChart size={22} className="text-blue-500" />
                </div>
                <div className="text-left">
                  <p className={`font-semibold ${theme.text}`}>Charts & Trends</p>
                  <p className={`text-xs ${theme.textMuted}`}>View progress visualization</p>
                </div>
              </div>
              <ChevronRight className={`${theme.textMuted} group-hover:translate-x-1 transition-transform`} />
            </button>

            {/* Limiting Factors Card */}
            {(() => {
              const limitingFactors = analyzeLimitingFactors(workoutLogs, benchmarkResults, readiness, athleteProfile);
              if (limitingFactors.length === 0) return null;
              const topFactors = limitingFactors.slice(0, 3);
              return (
                <div className={`${theme.card} rounded-2xl p-5`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Target size={18} className={darkMode ? 'text-purple-400' : 'text-purple-600'} />
                      <h3 className={`font-semibold ${theme.text}`}>Limiting Factors</h3>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${topFactors[0]?.severity === 'high' ? 'bg-red-500/20 text-red-500' : topFactors[0]?.severity === 'medium' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'}`}>
                      {limitingFactors.length} found
                    </span>
                  </div>
                  <div className="space-y-3">
                    {topFactors.map((factor, idx) => (
                      <div key={factor.id} className={`p-3 ${theme.cardAlt} rounded-xl`}>
                        <div className="flex items-start gap-3">
                          <span className="text-xl">{factor.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-medium ${theme.text}`}>{factor.title}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${factor.severity === 'high' ? 'bg-red-500/20 text-red-500' : factor.severity === 'medium' ? 'bg-amber-500/20 text-amber-500' : 'bg-gray-500/20 text-gray-400'}`}>
                                {factor.metric}
                              </span>
                            </div>
                            <p className={`text-sm ${theme.textMuted}`}>{factor.action}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {limitingFactors.length > 3 && (
                    <p className={`text-xs ${theme.textMuted} text-center mt-3`}>+{limitingFactors.length - 3} more factors identified</p>
                  )}
                </div>
              );
            })()}

            {/* Progression Insights Card */}
            {(() => {
              const progressionOps = analyzeProgressionOpportunities(workoutLogs, athleteProfile);
              if (progressionOps.length === 0) return null;
              return (
                <div className={`${theme.card} rounded-2xl p-5`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={18} className={darkMode ? 'text-green-400' : 'text-green-600'} />
                      <h3 className={`font-semibold ${theme.text}`}>Progression Insights</h3>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      progressionOps[0]?.priority === 'high'
                        ? 'bg-green-500/20 text-green-500'
                        : progressionOps[0]?.priority === 'medium'
                          ? 'bg-amber-500/20 text-amber-500'
                          : 'bg-blue-500/20 text-blue-500'
                    }`}>
                      {progressionOps.filter(p => p.priority === 'high').length} ready
                    </span>
                  </div>
                  <div className="space-y-3">
                    {progressionOps.slice(0, 3).map((op, idx) => (
                      <div key={idx} className={`p-3 rounded-xl ${theme.cardAlt}`}>
                        <div className="flex items-start gap-3">
                          <span className="text-xl">{op.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium ${theme.text} text-sm`}>{op.exercise}</p>
                            <p className={`text-xs ${theme.textMuted} mt-0.5`}>{op.message}</p>
                            <p className={`text-xs mt-1 ${
                              op.priority === 'high'
                                ? (darkMode ? 'text-green-400' : 'text-green-600')
                                : op.priority === 'medium'
                                  ? (darkMode ? 'text-amber-400' : 'text-amber-600')
                                  : (darkMode ? 'text-blue-400' : 'text-blue-600')
                            } font-medium`}>
                              → {op.recommendation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {progressionOps.length > 3 && (
                    <p className={`text-xs ${theme.textMuted} text-center mt-3`}>+{progressionOps.length - 3} more insights</p>
                  )}
                </div>
              );
            })()}

            {/* Program Status Card */}
            <button onClick={() => setFloatingPane('calendar')} className={`w-full text-left ${theme.card} rounded-2xl p-5 card-hover`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className={`text-xs ${theme.textMuted} uppercase tracking-wider font-medium`}>{program?.name}</p>
                  <h2 className={`text-xl font-bold ${theme.text}`}>{phase?.name} {activeDetour ? '' : 'Phase'}</h2>
                </div>
                <div className="flex items-center gap-3">
                  {hasDetours && !activeDetour && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowDetourPicker(true); }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:scale-105 transition-all"
                    >
                      Detour
                    </button>
                  )}
                  <span className="text-4xl">{program?.icon}</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: activeDetour ? activeDetour.weekInDetour : programState.currentWeek, label: 'Week' },
                  { value: programState.currentDay, label: 'Day' },
                  { value: `${completedThisWeek}/7`, label: 'Done' },
                  { value: workoutLogs.filter(l => l.programId === programState.currentProgram).length, label: 'Total' }
                ].map((stat, i) => (
                  <div key={i} className={`text-center p-3 ${theme.cardAlt} rounded-xl`}>
                    <p className={`text-2xl font-bold ${theme.text}`}>{stat.value}</p>
                    <p className={`text-xs ${theme.textMuted}`}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </button>

            {/* Today's Workout Card */}
            {todayWorkout && (
              <button onClick={() => setFloatingPane('workout')} className={`w-full text-left rounded-2xl p-5 border-l-4 ${getTypeBorder(todayWorkout.type)} ${theme.card} card-hover group`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className={`text-xs ${theme.textMuted} uppercase tracking-wider font-medium`}>Day {programState.currentDay}</p>
                    <h3 className={`text-xl font-bold ${theme.text} mt-1`}>{todayWorkout.session}</h3>
                    <div className={`flex flex-wrap items-center gap-3 mt-3 text-sm ${theme.textMuted}`}>
                      <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-500/10"><Clock size={14} />{todayWorkout.duration} min</span>
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold text-white ${getTypeColor(todayWorkout.type, darkMode)}`}>{todayWorkout.type.replace('_', ' ')}</span>
                      {todayLog?.completed && <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-500/20 text-green-500 font-medium"><CheckCircle2 size={14} />Done</span>}
                    </div>
                    {readinessScore && readinessScore < 55 && todayWorkout.type !== 'recovery' && (
                      <p className={`text-xs ${darkMode ? 'text-amber-400' : 'text-amber-600'} mt-3 flex items-center gap-1`}>
                        <AlertTriangle size={12} /> {readinessInfo?.recommendation}
                      </p>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className={`p-3 rounded-xl ${theme.cardAlt} group-hover:bg-blue-500/20 transition-colors`}>
                      <ChevronRight size={24} className={`${theme.textMuted} group-hover:text-blue-500 group-hover:translate-x-1 transition-all`} />
                    </div>
                  </div>
                </div>
              </button>
            )}

            {/* This Week Card - Route Map Style */}
            <div className={`${theme.card} rounded-2xl p-5`}>
              <div className="flex items-center gap-2 mb-4">
                <Flag size={16} className="text-cyan-500" />
                <h3 className={`font-semibold ${theme.text}`}>Weekly Route</h3>
              </div>
              <div className="relative">
                {/* Trail line connecting waypoints */}
                <div className={`absolute left-[19px] top-6 bottom-6 w-0.5 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />

                <div className="space-y-2 relative">
                  {phase?.weeklyTemplate?.map((w, idx) => {
                    const isCurrent = w.day === programState.currentDay;
                    const logged = thisWeekLogs.find(l => l.day === w.day && l.completed);
                    const isPast = w.day < programState.currentDay;
                    return (
                      <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isCurrent
                          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 shadow-sm'
                          : theme.cardAlt
                      }`}>
                        {/* Waypoint marker */}
                        <div className={`relative z-10 w-[22px] h-[22px] rounded-full flex items-center justify-center ${
                          logged
                            ? 'bg-emerald-500'
                            : isCurrent
                              ? 'bg-cyan-500 ring-2 ring-cyan-500/50 ring-offset-2 ring-offset-transparent'
                              : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                        }`}>
                          {logged ? (
                            <CheckCircle2 size={14} className="text-white" />
                          ) : isCurrent ? (
                            <Mountain size={12} className="text-white" />
                          ) : (
                            <span className={`text-[10px] font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{w.day}</span>
                          )}
                        </div>
                        <span className={`flex-1 text-sm font-medium ${isCurrent ? 'text-cyan-500' : theme.text} truncate`}>
                          {w.session || w.name}
                        </span>
                        <span className={`text-xs font-mono ${logged ? 'text-emerald-500' : theme.textMuted}`}>
                          {w.duration || 0}m
                        </span>
                      </div>
                    );
                  })}
                </div>
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
                <span className="flex items-center gap-1"><Clock size={16} />{todayWorkout.duration} min{todayWorkout.durationProgressed && todayWorkout.originalDuration && ` (was ${todayWorkout.originalDuration})`}</span>
                <span className="capitalize">{todayWorkout.type.replace('_', ' ')}</span>
              </div>
              {/* Progression indicator */}
              {todayWorkout.blockPhase && (
                <div className="mt-3 flex items-center gap-2 text-sm opacity-80">
                  <TrendingUp size={14} />
                  <span>Phase Week {todayWorkout.weekInPhase} • {todayWorkout.blockPhase}</span>
                </div>
              )}
              {todayLog?.completed && <div className="mt-4 bg-white/20 rounded-lg p-3 flex items-center gap-2"><CheckCircle2 size={18} /><span>Completed</span></div>}
            </div>

            {/* Readiness Warning + Auto-Adjustment */}
            {readinessScore && readinessScore < 70 && todayWorkout.type !== 'recovery' && (
              <div className={`p-4 ${readinessScore < 40 ? (darkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-300') : (darkMode ? 'bg-amber-900/30 border-amber-700' : 'bg-amber-50 border-amber-200')} border rounded-xl`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className={readinessScore < 40 ? (darkMode ? 'text-red-400' : 'text-red-600') : (darkMode ? 'text-amber-400' : 'text-amber-600')} size={20} />
                  <span className={`font-medium ${theme.text}`}>{readinessScore < 40 ? 'Low' : 'Moderate'} Readiness ({readinessScore})</span>
                </div>
                <p className={`text-sm ${theme.textMuted}`}>{readinessInfo?.recommendation}</p>
                {todayWorkout?.readinessAdjustment && (
                  <div className={`mt-2 pt-2 border-t ${theme.border}`}>
                    <p className={`text-sm font-medium ${readinessScore < 40 ? 'text-red-500' : 'text-amber-500'}`}>
                      ⚡ Auto-adjusted: {todayWorkout.readinessAdjustment}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Training Load Warning */}
            {loadStatus.zone === 'danger' && todayWorkout.type !== 'recovery' && (
              <div className={`p-4 ${darkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-300'} border rounded-xl`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🚨</span>
                  <span className={`font-medium ${darkMode ? 'text-red-400' : 'text-red-700'}`}>Overreach Warning (ACR: {acr})</span>
                </div>
                <p className={`text-sm ${theme.textMuted}`}>{loadStatus.recommendation}</p>
                <button 
                  onClick={() => {
                    // Swap to recovery day
                    setProgramState(prev => ({ ...prev, currentDay: 7 }));
                  }}
                  className={`mt-3 px-4 py-2 ${darkMode ? 'bg-red-900/50 hover:bg-red-900/70' : 'bg-red-100 hover:bg-red-200'} rounded-lg text-sm font-medium ${darkMode ? 'text-red-300' : 'text-red-700'}`}
                >
                  Switch to Recovery Day
                </button>
              </div>
            )}
            
            {loadStatus.zone === 'caution' && todayWorkout.type !== 'recovery' && (
              <div className={`p-4 ${darkMode ? 'bg-orange-900/30 border-orange-700' : 'bg-orange-50 border-orange-300'} border rounded-xl`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">⚠️</span>
                  <span className={`font-medium ${darkMode ? 'text-orange-400' : 'text-orange-700'}`}>Load Caution (ACR: {acr})</span>
                </div>
                <p className={`text-sm ${theme.textMuted}`}>{loadStatus.recommendation}</p>
              </div>
            )}

            {/* Workout Timer */}
            <WorkoutTimer theme={theme} darkMode={darkMode} workoutType={todayWorkout.type} />

            {/* HR Zone */}
            {todayWorkout.prescription.hrZone && <HRZoneDisplay hrZone={todayWorkout.prescription.hrZone} profile={athleteProfile} theme={theme} darkMode={darkMode} />}

            {/* Load Target */}
            <SmartLoadDisplay prescription={todayWorkout.prescription} profile={athleteProfile} theme={theme} darkMode={darkMode} currentWeek={programState.currentWeek} />

            {/* Progression Insights */}
            {todayWorkout.type === 'strength' && progressionAnalyses.length > 0 && (
              <ProgressionInsights 
                analyses={progressionAnalyses} 
                profile={athleteProfile} 
                setAthleteProfile={setAthleteProfile} 
                theme={theme} 
                darkMode={darkMode} 
              />
            )}

            <div className={`${theme.card} rounded-xl shadow-sm overflow-hidden`}>
              {todayWorkout.prescription.warmup && <div className={`p-4 border-b ${theme.border}`}><p className={`text-xs font-medium ${theme.textMuted} uppercase mb-2`}>Warm-up</p><p className={theme.text}>{todayWorkout.prescription.warmup}</p></div>}
              {todayWorkout.prescription.description && <div className={`p-4 border-b ${theme.border}`}><p className={`text-xs font-medium ${theme.textMuted} uppercase mb-2`}>Overview</p><p className={theme.text}>{todayWorkout.prescription.description}</p></div>}
              {todayWorkout.prescription.mainSet && <div className={`p-4 border-b ${theme.border} ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}><p className="text-xs font-medium text-blue-500 uppercase mb-2">Main Set</p><p className={`text-lg font-semibold ${theme.text}`}>{todayWorkout.prescription.mainSet}</p>{todayWorkout.prescription.recovery && <p className={`${theme.textMuted} mt-1`}>Recovery: {todayWorkout.prescription.recovery}</p>}</div>}
              
              {todayWorkout.prescription.exercises && (
                <div className={`p-4 border-b ${theme.border}`}>
                  <p className={`text-xs font-medium ${theme.textMuted} uppercase mb-3`}>Exercises</p>
                  <div className="space-y-3">
                    {todayWorkout.prescription.exercises.map((ex, idx) => (
                      <SmartExercise
                        key={idx}
                        exercise={ex}
                        profile={athleteProfile}
                        theme={theme}
                        darkMode={darkMode}
                        isComplete={exerciseCompletion[ex.name]}
                        onToggle={() => toggleExercise(ex.name)}
                        onSwap={(exerciseInfo) => setSwappingExercise(exerciseInfo)}
                        swappedTo={exerciseSwaps[ex.name]}
                        onShowHistory={(exercise) => setViewingExerciseHistory(exercise)}
                        setData={setTrackingData[ex.name]}
                        onSetDataChange={handleSetDataChange}
                      />
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

              {todayWorkout.prescription.steps && <div className={`p-4 border-b ${theme.border}`}><p className={`text-xs font-medium ${theme.textMuted} uppercase mb-3`}>Protocol</p><ol className="space-y-2">{todayWorkout.prescription.steps.map((step, idx) => <li key={idx} className={`flex gap-3 ${theme.text} text-sm`}><span className={`flex-shrink-0 w-6 h-6 rounded-full ${theme.badge} text-xs font-medium flex items-center justify-center`}>{idx + 1}</span>{step}</li>)}</ol></div>}
              {todayWorkout.prescription.options && <div className={`p-4 border-b ${theme.border}`}><p className={`text-xs font-medium ${theme.textMuted} uppercase mb-2`}>Options</p><ul className="space-y-1">{todayWorkout.prescription.options.map((opt, idx) => <li key={idx} className={`text-sm ${theme.textMuted}`}>• {opt}</li>)}</ul></div>}
              {todayWorkout.prescription.notes && <div className={`p-4 border-b ${theme.border}`}><p className={`text-xs font-medium ${theme.textMuted} uppercase mb-2`}>Notes</p><ul className="space-y-1">{(Array.isArray(todayWorkout.prescription.notes) ? todayWorkout.prescription.notes : [todayWorkout.prescription.notes]).map((note, idx) => <li key={idx} className={`text-sm ${theme.textMuted}`}>• {note}</li>)}</ul></div>}
              {todayWorkout.prescription.cooldown && <div className={`p-4 border-b ${theme.border}`}><p className={`text-xs font-medium ${theme.textMuted} uppercase mb-2`}>Cool-down</p><p className={theme.text}>{todayWorkout.prescription.cooldown}</p></div>}
              {todayWorkout.prescription.intensity && <div className={`p-4 ${darkMode ? 'bg-gray-700' : 'bg-slate-800'} text-white`}><p className="text-xs uppercase opacity-70 mb-1">Intensity</p><p className="font-semibold">{todayWorkout.prescription.intensity}</p></div>}
            </div>

            {/* Log Form */}
            <div className={`${theme.card} rounded-2xl overflow-hidden`}>
              <div className={`p-4 ${darkMode ? 'bg-gradient-to-r from-emerald-900/30 to-green-900/20' : 'bg-gradient-to-r from-emerald-50 to-green-50'} border-b ${theme.border}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${darkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                    <Flag size={18} className="text-emerald-500" />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${theme.text}`}>Log Expedition</h3>
                    <p className={`text-xs ${theme.textMuted}`}>Record your training session</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-5">
                {/* Duration & RPE in grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-semibold ${theme.textMuted} uppercase tracking-wide mb-2`}>Duration</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={workoutData.duration}
                        onChange={(e) => setWorkoutData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                        className={`w-full px-4 py-3 rounded-xl border ${theme.input} font-mono text-lg`}
                      />
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${theme.textMuted}`}>min</span>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold ${theme.textMuted} uppercase tracking-wide mb-2`}>Effort (RPE)</label>
                    <div className={`px-4 py-3 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} text-center`}>
                      <span className={`text-2xl font-bold ${
                        workoutData.rpe >= 9 ? 'text-red-500' :
                        workoutData.rpe >= 7 ? 'text-amber-500' :
                        workoutData.rpe >= 5 ? 'text-cyan-500' :
                        'text-emerald-500'
                      }`}>{workoutData.rpe}</span>
                      <span className={`text-sm ${theme.textMuted}`}>/10</span>
                    </div>
                  </div>
                </div>
                {/* RPE Slider */}
                <div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={workoutData.rpe}
                    onChange={(e) => setWorkoutData(prev => ({ ...prev, rpe: parseInt(e.target.value) }))}
                    className="w-full accent-cyan-500"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>Easy</span><span>Moderate</span><span>Hard</span><span>Max</span>
                  </div>
                </div>

                {/* PR Section */}
                {todayWorkout.type === 'strength' && todayWorkout.prescription.exercises?.some(e => e.prKey) && (
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-amber-500/10 ring-1 ring-amber-500/20' : 'bg-amber-50 ring-1 ring-amber-200'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Award size={16} className="text-amber-500" />
                      <p className={`text-sm font-semibold ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>New Summit?</p>
                    </div>
                    <div className="space-y-3">
                      {todayWorkout.prescription.exercises.filter(e => e.prKey).map(ex => (
                        <div key={ex.prKey} className="flex items-center gap-3">
                          <span className={`text-sm ${theme.text} flex-1`}>{PR_DISPLAY_NAMES[ex.prKey]}</span>
                          <div className="relative">
                            <input
                              type="number"
                              placeholder={athleteProfile.prs?.[ex.prKey]?.value || '—'}
                              value={workoutData.newPRs?.[ex.prKey] || ''}
                              onChange={(e) => setWorkoutData(prev => ({ ...prev, newPRs: { ...prev.newPRs, [ex.prKey]: e.target.value ? Number(e.target.value) : null } }))}
                              className={`w-24 px-3 py-2 rounded-lg ${theme.input} text-right font-mono`}
                            />
                            <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${theme.textMuted}`}>lb</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className={`block text-xs font-semibold ${theme.textMuted} uppercase tracking-wide mb-2`}>Field Notes</label>
                  <textarea
                    value={workoutData.notes}
                    onChange={(e) => setWorkoutData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="How did it feel? Any observations..."
                    rows={2}
                    className={`w-full px-4 py-3 rounded-xl border ${theme.input} resize-none`}
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={completeWorkout}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98]"
                >
                  <CheckCircle2 size={20} />
                  {todayLog?.completed ? 'Update Log' : 'Summit Reached'}
                </button>
              </div>
            </div>
          </div>
        )}
        {currentView === 'workout' && !todayWorkout && <div className="p-4"><div className={`${theme.card} rounded-xl shadow-sm p-8 text-center`}><Circle size={48} className={`mx-auto ${theme.textMuted} mb-4`} /><h2 className={`text-xl font-semibold ${theme.text}`}>No Workout</h2></div></div>}

        {/* CALENDAR VIEW */}
        {currentView === 'calendar' && (
          <CalendarView 
            programState={programState} 
            setProgramState={setProgramState} 
            workoutLogs={workoutLogs} 
            phase={phase} 
            program={program} 
            theme={theme} 
            darkMode={darkMode} 
            setCurrentView={setCurrentView} 
          />
        )}

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
            {workoutLogs.length === 0 ? (
              <div className={`${theme.card} rounded-2xl p-8 text-center`}>
                <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-cyan-500/10' : 'bg-cyan-50'}`}>
                  <Mountain size={40} className="text-cyan-500" />
                </div>
                <h3 className={`font-semibold ${theme.text} mb-2`}>No Expeditions Yet</h3>
                <p className={`text-sm ${theme.textMuted} mb-4`}>Complete your first workout to start tracking your journey</p>
                <button onClick={() => setCurrentView('workout')} className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-cyan-500/20">
                  Start Training
                </button>
              </div>
            ) : (
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
              ) : (
                <div className={`text-center py-6 ${theme.textMuted}`}>
                  <TrendingUp size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Complete workouts to see volume data</p>
                </div>
              )}
            </div>

            {/* Readiness Heatmap - High Altitude Theme */}
            {readiness.logs?.length > 0 && (
              <ReadinessHeatmap
                readinessHistory={readiness.logs?.reduce((acc, log) => {
                  if (log.date) acc[log.date] = { score: log.score };
                  return acc;
                }, {}) || {}}
                weeks={6}
                theme={theme}
                darkMode={darkMode}
              />
            )}

            {/* PR History - Summit Log */}
            {athleteProfile.history?.filter(h => h.category === 'prs').length > 0 && (
              <div className={`${theme.card} rounded-2xl p-5`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                    <Award size={16} className="text-amber-500" />
                  </div>
                  <h3 className={`font-semibold ${theme.text}`}>Summit Log</h3>
                  <span className={`text-xs ${theme.textMuted} ml-auto`}>Personal Records</span>
                </div>
                <div className="relative">
                  {/* Timeline line */}
                  <div className={`absolute left-[11px] top-3 bottom-3 w-0.5 ${darkMode ? 'bg-amber-500/20' : 'bg-amber-200'}`} />
                  <div className="space-y-3">
                    {[...athleteProfile.history].filter(h => h.category === 'prs').reverse().slice(0, 10).map((pr, idx) => (
                      <div key={idx} className={`flex items-center gap-4 p-3 rounded-xl ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'} relative`}>
                        {/* Timeline dot */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                          idx === 0
                            ? 'bg-amber-500 shadow-lg shadow-amber-500/30'
                            : darkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                          {idx === 0 ? (
                            <Flag size={12} className="text-white" />
                          ) : (
                            <span className={`text-[10px] font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{idx + 1}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${idx === 0 ? 'text-amber-500' : theme.text}`}>{PR_DISPLAY_NAMES[pr.key]}</p>
                          <p className={`text-xs ${theme.textMuted}`}>{formatDateShort(pr.date)}</p>
                        </div>
                        <div className={`text-right px-3 py-1.5 rounded-lg ${idx === 0 ? 'bg-amber-500/20' : theme.cardAlt}`}>
                          <span className={`font-mono font-bold ${idx === 0 ? 'text-amber-500' : theme.text}`}>{pr.value}</span>
                          <span className={`text-xs ${theme.textMuted} ml-1`}>lb</span>
                        </div>
                      </div>
                    ))}
                  </div>
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
                <div className="flex items-center gap-2">
                  <Library size={14} className="text-purple-500" />
                  <h3 className={`text-sm font-semibold ${theme.textMuted} uppercase tracking-wide`}>Templates</h3>
                </div>
                {Object.entries(programTemplates).map(([id, data]) => {
                  const isActive = programState.currentProgram === id;
                  return (
                    <div
                      key={id}
                      className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                        isActive
                          ? 'ring-2 ring-cyan-500 shadow-lg shadow-cyan-500/20'
                          : `${theme.card} hover:shadow-md`
                      }`}
                    >
                      {/* Gradient background for active */}
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10" />
                      )}
                      <div className="relative p-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                            isActive
                              ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20'
                              : darkMode ? 'bg-gray-800' : 'bg-gray-100'
                          }`}>
                            {data.program?.icon || '📋'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`font-bold ${isActive ? 'text-cyan-500' : theme.text}`}>{data.program?.name}</p>
                              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-semibold rounded-full uppercase">
                                Template
                              </span>
                              {isActive && (
                                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] font-semibold rounded-full flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                                  Active
                                </span>
                              )}
                            </div>
                            <p className={`text-sm ${theme.textMuted} mt-1 line-clamp-2`}>{data.program?.description}</p>
                            {data.profileCheck && !data.profileCheck.complete && (
                              <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                                <AlertTriangle size={10} />
                                Profile {data.profileCheck.percentComplete}% complete
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button onClick={() => setViewingProgramId(id)} className={`px-4 py-2.5 ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} ${theme.text} rounded-xl text-sm font-medium transition-colors`}>
                            View
                          </button>
                          {isActive ? (
                            <div className="flex-1 flex items-center justify-center text-cyan-500 font-semibold text-sm gap-2">
                              <CheckCircle2 size={16} /> Current Route
                            </div>
                          ) : (
                            <button onClick={() => setProgramState(prev => ({ ...prev, currentProgram: id, currentWeek: 1, currentDay: 1 }))} className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-cyan-500/20">
                              Start Expedition
                            </button>
                          )}
                          <button onClick={() => { if (confirm(`Delete template "${data.program?.name}"?`)) deleteTemplate(id); }} className="px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
              customExercises={customExercises}
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

            {/* Account Section */}
            {profile && (
              <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
                <h3 className={`font-semibold ${theme.text} mb-4`}>Account</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-xl font-bold text-white">{profile.name?.charAt(0)?.toUpperCase() || '?'}</span>
                  </div>
                  <div>
                    <p className={`font-semibold ${theme.text}`}>{profile.name}</p>
                    <p className={`text-sm ${theme.textMuted}`}>
                      {profile.hasBiometric ? '🔐 Face ID enabled' : '👤 Name login'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to log out?')) {
                      logout();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/20 transition-colors"
                >
                  <LogOut size={18} />
                  Log Out
                </button>
              </div>
            )}

            <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
              <div className="flex items-center justify-between">
                <div><h3 className={`font-semibold ${theme.text}`}>Dark Mode</h3></div>
                <button onClick={() => setDarkMode(!darkMode)} className={`w-14 h-8 rounded-full transition-colors ${darkMode ? 'bg-blue-500' : 'bg-slate-300'} relative`}>
                  <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${darkMode ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            {/* Replay Onboarding */}
            <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-semibold ${theme.text}`}>App Tour</h3>
                  <p className={`text-sm ${theme.textMuted}`}>Replay the intro tutorial</p>
                </div>
                <button
                  onClick={() => setShowOnboarding(true)}
                  className={`px-4 py-2 ${theme.btnSecondary} rounded-lg text-sm font-medium`}
                >
                  Replay
                </button>
              </div>
            </div>

            {/* Custom Exercises Section */}
            <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${theme.text}`}>Custom Exercises</h3>
                <button onClick={() => setShowAddExercise(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 rounded-lg text-sm font-medium text-white">
                  <Plus size={16} />Add
                </button>
              </div>
              {Object.keys(customExercises).length === 0 ? (
                <div className={`text-center py-6`}>
                  <Dumbbell size={28} className={`mx-auto mb-2 ${theme.textMuted} opacity-40`} />
                  <p className={`text-sm ${theme.textMuted}`}>No custom exercises yet</p>
                  <p className={`text-xs ${theme.textMuted} mt-1`}>Add movements specific to your training</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {Object.values(customExercises).map(ex => (
                    <div key={ex.id} className={`flex items-center justify-between p-3 ${theme.cardAlt} rounded-lg`}>
                      <div className="flex-1">
                        <p className={`font-medium ${theme.text}`}>{ex.name}</p>
                        <p className={`text-xs ${theme.textMuted}`}>{MOVEMENT_PATTERNS[ex.pattern]?.name} • {ex.muscles?.slice(0, 3).join(', ')}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setShowAddExercise(ex)} className={`p-2 ${theme.cardAlt} rounded-lg`}><Edit3 size={14} className={theme.textMuted} /></button>
                        <button onClick={() => { if (confirm(`Delete "${ex.name}"?`)) setCustomExercises(prev => { const u = {...prev}; delete u[ex.id]; return u; }); }} className="p-2 bg-red-500/10 rounded-lg"><Trash2 size={14} className="text-red-500" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              <h3 className={`font-semibold ${theme.text} mb-4`}>Cloud Sync</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {syncStatus.syncing ? (
                      <Loader size={18} className="animate-spin text-blue-500" />
                    ) : isOffline ? (
                      <CloudOff size={18} className="text-amber-500" />
                    ) : (
                      <Cloud size={18} className="text-green-500" />
                    )}
                    <span className={theme.text}>
                      {syncStatus.syncing ? 'Syncing...' : isOffline ? 'Offline' : 'Connected'}
                    </span>
                  </div>
                  {syncStatus.lastSync && (
                    <span className={`text-xs ${theme.textMuted}`}>
                      Last sync: {new Date(syncStatus.lastSync).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                {syncStatus.error && (
                  <div className="p-2 bg-red-500/10 rounded-lg text-red-500 text-sm">
                    {syncStatus.error}
                  </div>
                )}
                <button
                  onClick={async () => {
                    const result = await syncAllToCloud(setSyncStatus);
                    if (result.success) {
                      alert(`Synced ${result.synced} items to cloud!`);
                    } else {
                      alert(`Sync failed: ${result.error}`);
                    }
                  }}
                  disabled={syncStatus.syncing || isOffline}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 rounded-xl text-sm font-medium text-white`}
                >
                  <Cloud size={18} />
                  {syncStatus.syncing ? 'Syncing...' : 'Sync Now'}
                </button>
                <p className={`text-xs ${theme.textMuted} text-center`}>
                  Data automatically syncs to cloud. Use this button to force a full sync.
                </p>
              </div>
            </div>

            {/* Sync Code Section */}
            <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
              <h3 className={`font-semibold ${theme.text} mb-2`}>Sync Code</h3>
              <p className={`text-xs ${theme.textMuted} mb-4`}>
                Use this code to link your data on another device. Go to "Link Existing Account" on your other device and enter this code.
              </p>

              {!showSyncCodeSetup ? (
                <div className="space-y-3">
                  <div className={`p-3 ${theme.cardAlt} rounded-lg`}>
                    <p className={`text-xs ${theme.textMuted} mb-1`}>Your Sync Code:</p>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm ${theme.text} font-mono break-all flex-1`}>
                        {getCurrentDeviceId()?.replace('sync_', '') || 'Not set'}
                      </p>
                      <button
                        onClick={() => {
                          const code = getCurrentDeviceId()?.replace('sync_', '') || '';
                          navigator.clipboard.writeText(code);
                          alert('Sync code copied to clipboard!');
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Copy sync code"
                      >
                        <Copy size={16} className={theme.textMuted} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSyncCodeSetup(true)}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${theme.btnSecondary} rounded-xl text-sm font-medium`}
                  >
                    <Key size={18} />
                    Change Sync Code
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className={`block text-sm ${theme.textMuted} mb-2`}>
                      Enter a memorable sync code (e.g., your email or a phrase):
                    </label>
                    <input
                      type="text"
                      value={syncCodeInput}
                      onChange={(e) => setSyncCodeInput(e.target.value)}
                      placeholder="mysynccode123"
                      className={`w-full p-3 ${theme.cardAlt} rounded-lg ${theme.text} text-sm`}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!syncCodeInput.trim()) {
                          alert('Please enter a sync code');
                          return;
                        }
                        setSyncCodeLoading(true);
                        // First, try to load existing data with this code
                        const loadResult = await loadWithSyncCode(syncCodeInput);
                        if (loadResult.success && loadResult.loaded > 0) {
                          alert(`Found and loaded ${loadResult.loaded} items from this sync code! Reloading app...`);
                          window.location.reload();
                        } else {
                          // No existing data, just set the code for future use
                          await setSyncCode(syncCodeInput);
                          // Then sync current data to cloud with new code
                          const syncResult = await syncAllToCloud(setSyncStatus);
                          if (syncResult.success) {
                            alert(`Sync code set! Your data is now linked to: ${syncCodeInput}`);
                          } else {
                            alert('Sync code set, but cloud sync failed. Try syncing again.');
                          }
                        }
                        setSyncCodeLoading(false);
                        setShowSyncCodeSetup(false);
                        setSyncCodeInput('');
                      }}
                      disabled={syncCodeLoading}
                      className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 rounded-xl text-sm font-medium text-white"
                    >
                      {syncCodeLoading ? 'Loading...' : 'Set / Recover'}
                    </button>
                    <button
                      onClick={() => {
                        setShowSyncCodeSetup(false);
                        setSyncCodeInput('');
                      }}
                      className={`px-4 py-3 ${theme.btnSecondary} rounded-xl text-sm font-medium`}
                    >
                      Cancel
                    </button>
                  </div>
                  <p className={`text-xs ${theme.textMuted}`}>
                    If data exists with this code, it will be loaded. Otherwise, your current data will be linked to this code.
                  </p>
                </div>
              )}</div>

            <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
              <h3 className={`font-semibold ${theme.text} mb-4`}>Data</h3>
              <div className="space-y-3">
                <button onClick={exportData} className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${theme.btnSecondary} rounded-xl text-sm font-medium`}><Download size={18} />Export All Data</button>
                <label className="block"><span className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${theme.btnSecondary} rounded-xl text-sm font-medium cursor-pointer`}><Upload size={18} />Import Data</span><input type="file" accept=".json" onChange={importData} className="hidden" /></label>
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

      {/* Exercise History Modal */}
      {viewingExerciseHistory && (
        <ExerciseHistoryModal
          exercise={viewingExerciseHistory}
          workoutLogs={workoutLogs}
          profile={athleteProfile}
          onClose={() => setViewingExerciseHistory(null)}
          theme={theme}
          darkMode={darkMode}
        />
      )}

      {/* Add Custom Exercise Modal */}
      {showAddExercise && (
        <AddCustomExerciseModal
          onClose={() => setShowAddExercise(false)}
          onSave={(id, exercise) => setCustomExercises(prev => ({ ...prev, [id]: exercise }))}
          editExercise={typeof showAddExercise === 'object' ? showAddExercise : null}
          theme={theme}
          darkMode={darkMode}
        />
      )}

      {/* Smart Exercise Swap Picker Modal */}
      {swappingExercise && (() => {
        const originalEx = { ...EXERCISE_LIBRARY, ...customExercises }[swappingExercise.originalId] || { id: swappingExercise.originalId, pattern: swappingExercise.pattern, equipment: [] };
        const smartSubs = getSmartSubstitutions(originalEx, customExercises, athleteProfile.availableEquipment || [], workoutLogs);
        const { recentlyUsed, recommended, unavailable } = smartSubs;

        const renderSwapOption = (ex, showLoadHint = true) => (
          <button
            key={ex.id}
            onClick={() => {
              setExerciseSwaps(prev => ({ ...prev, [swappingExercise.name]: ex.id }));
              setSwappingExercise(null);
              setShowAllSwapOptions(false);
            }}
            className={`w-full p-4 ${theme.card} rounded-xl text-left ${exerciseSwaps[swappingExercise.name] === ex.id ? 'ring-2 ring-purple-500' : ''} ${!ex.hasAllEquipment ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className={`font-medium ${theme.text}`}>{ex.name}</p>
                <p className={`text-sm ${theme.textMuted}`}>
                  {ex.equipment?.map(e => EQUIPMENT_TYPES[e] || e).join(', ')}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {ex.prKey && <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-500 rounded">PR tracking</span>}
                  {ex.recentUsageCount > 0 && <span className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-500 rounded">Used {ex.recentUsageCount}x</span>}
                  {ex.flags?.includes('same_equipment') && <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-500 rounded">Same gear</span>}
                </div>
              </div>
              {showLoadHint && ex.loadAdjustment && (
                <div className={`text-right ${theme.textMuted}`}>
                  <p className="text-xs">Load adjust</p>
                  <p className={`text-sm font-mono ${ex.loadAdjustment < 1 ? 'text-amber-500' : 'text-green-500'}`}>
                    {ex.loadAdjustment < 1 ? '↓' : '↑'}{Math.abs(Math.round((1 - ex.loadAdjustment) * 100))}%
                  </p>
                </div>
              )}
            </div>
            {!ex.hasAllEquipment && ex.missingEquipment?.length > 0 && (
              <p className="text-xs text-red-400 mt-1">Missing: {ex.missingEquipment.map(e => EQUIPMENT_TYPES[e] || e).join(', ')}</p>
            )}
          </button>
        );

        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => { setSwappingExercise(null); setShowAllSwapOptions(false); }}>
            <div className={`${theme.bg} w-full rounded-t-2xl max-h-[80vh] overflow-hidden flex flex-col`} onClick={e => e.stopPropagation()}>
              <div className={`p-4 border-b ${theme.border} flex items-center justify-between`}>
                <div>
                  <h3 className={`font-bold ${theme.text}`}>Smart Swap</h3>
                  <p className={`text-sm ${theme.textMuted}`}>
                    {MOVEMENT_PATTERNS[swappingExercise.pattern]?.icon} {swappingExercise.name}
                  </p>
                </div>
                <button onClick={() => { setSwappingExercise(null); setShowAllSwapOptions(false); }} className={`p-2 rounded-lg ${theme.cardAlt}`}>
                  <X size={24} className={theme.text} />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-4">
                {/* Reset to original option */}
                {exerciseSwaps[swappingExercise.name] && (
                  <button
                    onClick={() => {
                      setExerciseSwaps(prev => {
                        const updated = { ...prev };
                        delete updated[swappingExercise.name];
                        return updated;
                      });
                      setSwappingExercise(null);
                      setShowAllSwapOptions(false);
                    }}
                    className={`w-full p-4 rounded-xl border-2 border-dashed ${theme.border} text-left`}
                  >
                    <p className={`font-medium text-blue-500`}>↩ Reset to original</p>
                    <p className={`text-sm ${theme.textMuted}`}>{swappingExercise.name}</p>
                  </button>
                )}

                {/* Recently Used Section */}
                {recentlyUsed.length > 0 && (
                  <div>
                    <p className={`text-xs font-semibold ${theme.textMuted} uppercase tracking-wider mb-2`}>⏱ Recently Used</p>
                    <div className="space-y-2">
                      {recentlyUsed.map(ex => renderSwapOption(ex))}
                    </div>
                  </div>
                )}

                {/* Recommended Section */}
                {recommended.length > 0 && (
                  <div>
                    <p className={`text-xs font-semibold ${theme.textMuted} uppercase tracking-wider mb-2`}>✓ Available at Your Gym</p>
                    <div className="space-y-2">
                      {recommended.slice(0, showAllSwapOptions ? undefined : 6).map(ex => renderSwapOption(ex))}
                      {recommended.length > 6 && !showAllSwapOptions && (
                        <button
                          onClick={() => setShowAllSwapOptions(true)}
                          className={`w-full p-3 text-center text-sm ${theme.textMuted} ${theme.cardAlt} rounded-xl`}
                        >
                          Show {recommended.length - 6} more...
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Unavailable Equipment Section */}
                {unavailable.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowAllSwapOptions(!showAllSwapOptions)}
                      className={`text-xs font-semibold ${theme.textMuted} uppercase tracking-wider mb-2 flex items-center gap-1`}
                    >
                      🚫 Need Different Equipment ({unavailable.length})
                      <ChevronRight size={12} className={`transition-transform ${showAllSwapOptions ? 'rotate-90' : ''}`} />
                    </button>
                    {showAllSwapOptions && (
                      <div className="space-y-2">
                        {unavailable.map(ex => renderSwapOption(ex, false))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Floating Pane System - Dashboard Quick Views */}
      {floatingPane && (
        <div
          className="fixed inset-0 z-50 modal-backdrop animate-fadeIn"
          onClick={() => setFloatingPane(null)}
        >
          <div
            className={`absolute bottom-0 left-0 right-0 ${theme.modal} rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col animate-slideInUp shadow-2xl`}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className={`w-10 h-1 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-slate-300'}`} />
            </div>

            {/* Pane Header */}
            <div className={`px-5 pb-3 flex items-center justify-between border-b ${theme.border}`}>
              <h2 className={`text-lg font-bold ${theme.text}`}>
                {floatingPane === 'workout' && "Today's Workout"}
                {floatingPane === 'readiness' && 'Readiness Check'}
                {floatingPane === 'charts' && 'Charts & Trends'}
                {floatingPane === 'calendar' && 'Calendar'}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setCurrentView(floatingPane); setFloatingPane(null); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg ${theme.cardAlt} ${theme.text}`}
                >
                  Full View
                </button>
                <button
                  onClick={() => setFloatingPane(null)}
                  className={`p-2 rounded-xl ${theme.cardAlt}`}
                >
                  <X size={20} className={theme.text} />
                </button>
              </div>
            </div>

            {/* Pane Content */}
            <div className="flex-1 overflow-auto">
              {/* Workout Pane */}
              {floatingPane === 'workout' && todayWorkout && (
                <div className="p-5 space-y-4">
                  <div className={`p-4 rounded-2xl ${theme.cardAlt}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold text-white ${getTypeColor(todayWorkout.type, darkMode)}`}>
                        {todayWorkout.type.replace('_', ' ')}
                      </span>
                      <span className={`text-sm ${theme.textMuted}`}>{todayWorkout.duration} min</span>
                    </div>
                    <h3 className={`text-xl font-bold ${theme.text}`}>{todayWorkout.session}</h3>
                    {todayLog?.completed && (
                      <div className="flex items-center gap-2 mt-2 text-green-500">
                        <CheckCircle2 size={18} />
                        <span className="font-medium">Completed</span>
                      </div>
                    )}
                  </div>

                  {/* Exercises */}
                  {todayWorkout.prescription?.exercises && (
                    <div className="space-y-2">
                      <p className={`text-xs font-semibold ${theme.textMuted} uppercase tracking-wider`}>Exercises</p>
                      {todayWorkout.prescription.exercises.map((ex, idx) => (
                        <div key={idx} className={`p-4 ${theme.card} rounded-xl`}>
                          <p className={`font-medium ${theme.text}`}>{ex.name}</p>
                          <p className={`text-sm ${theme.textMuted}`}>
                            {ex.sets} × {ex.reps} @ {ex.intensity}% {ex.rpe && `RPE ${ex.rpe}`}
                          </p>
                          {ex.notes && <p className={`text-xs ${theme.textSubtle} mt-1 italic`}>{ex.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Cardio Details */}
                  {todayWorkout.type === 'aerobic' && todayWorkout.prescription?.cardio && (
                    <div className={`p-4 ${theme.card} rounded-xl`}>
                      <p className={`font-medium ${theme.text}`}>{todayWorkout.prescription.cardio.activity}</p>
                      <p className={`text-sm ${theme.textMuted}`}>
                        {todayWorkout.prescription.cardio.duration} min • {todayWorkout.prescription.cardio.zone}
                      </p>
                    </div>
                  )}

                  {/* Start Workout Button */}
                  {!todayLog?.completed && (
                    <button
                      onClick={() => { setCurrentView('workout'); setFloatingPane(null); }}
                      className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30 hover:scale-[1.02] transition-transform"
                    >
                      Start Workout
                    </button>
                  )}
                </div>
              )}

              {/* Readiness Pane */}
              {floatingPane === 'readiness' && (
                <div className="p-5">
                  <ReadinessCheckView
                    readiness={readiness}
                    setReadiness={setReadiness}
                    athleteProfile={athleteProfile}
                    theme={theme}
                    darkMode={darkMode}
                  />
                </div>
              )}

              {/* Charts Pane */}
              {floatingPane === 'charts' && (
                <div className="p-5">
                  <ChartsView
                    workoutLogs={workoutLogs}
                    benchmarkResults={benchmarkResults}
                    readiness={readiness}
                    athleteProfile={athleteProfile}
                    theme={theme}
                    darkMode={darkMode}
                  />
                </div>
              )}

              {/* Calendar Pane */}
              {floatingPane === 'calendar' && (
                <div className="p-5">
                  <CalendarView
                    programState={programState}
                    setProgramState={setProgramState}
                    workoutLogs={workoutLogs}
                    phase={phase}
                    program={program}
                    theme={theme}
                    darkMode={darkMode}
                    setCurrentView={(view) => { setCurrentView(view); setFloatingPane(null); }}
                    readiness={readiness}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav - High Altitude Design */}
      <nav className={`fixed bottom-4 left-4 right-4 ${theme.nav} rounded-2xl px-2 py-2 safe-area-pb z-40 shadow-xl backdrop-blur-lg border ${darkMode ? 'border-white/10' : 'border-black/5'}`}>
        <div className="max-w-md mx-auto flex justify-around items-center">
          {[
            { id: 'dashboard', icon: Home, label: 'Base' },
            { id: 'readiness', icon: Activity, label: 'Status' },
            { id: 'workout', icon: Mountain, label: 'Summit', primary: true },
            { id: 'profile', icon: User, label: 'Climber' },
            { id: 'progress', icon: TrendingUp, label: 'Ascent' }
          ].map(({ id, icon: Icon, label, primary }) => {
            const isActive = currentView === id;
            return (
              <button
                key={id}
                onClick={() => setCurrentView(id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 relative ${
                  primary
                    ? `${isActive
                        ? 'bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600'
                        : 'bg-gradient-to-br from-cyan-500 to-blue-600'
                      } text-white shadow-lg shadow-cyan-500/40 -mt-5 px-5 py-3`
                    : isActive
                      ? ''
                      : `${theme.textMuted} hover:text-cyan-400 active:scale-95`
                }`}
                style={primary ? { boxShadow: '0 4px 20px rgba(6, 182, 212, 0.4), 0 0 40px rgba(6, 182, 212, 0.2)' } : {}}
              >
                {/* Active glow effect */}
                {isActive && !primary && (
                  <span
                    className="absolute inset-0 rounded-xl opacity-20"
                    style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)' }}
                  />
                )}
                {/* Active indicator line */}
                {isActive && !primary && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
                )}
                <Icon
                  size={primary ? 24 : 22}
                  className={`transition-all duration-300 ${isActive && !primary ? 'text-cyan-400 scale-110' : ''}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={`text-[10px] font-semibold tracking-wide ${
                  primary ? 'text-white' : isActive ? 'text-cyan-400' : ''
                }`}>
                  {label}
                </span>
                {/* Pulse on primary */}
                {primary && (
                  <span className="absolute inset-0 rounded-xl bg-white/20 animate-ping opacity-20" style={{ animationDuration: '2s' }} />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
// Build 1769743122
