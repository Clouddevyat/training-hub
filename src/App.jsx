import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Dumbbell, TrendingUp, CheckCircle2, Circle, ChevronRight, 
  ChevronLeft, Play, Clock, Flame, Menu, X, Download, Upload,
  Settings, Activity, Mountain, Home, BarChart3, Trash2, Moon, Sun, 
  Plus, FileUp, User, Target, Zap, Award, Timer, Heart, Scale,
  ChevronDown, ChevronUp, Edit3, Save, X as XIcon, AlertTriangle
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
  // Identity
  name: '',
  age: null,
  weight: 225, // lbs
  height: 74, // inches (6'2")
  
  // Strength PRs (1RM)
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
  
  // Cardio Benchmarks
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
  
  // Calculated (derived from above)
  zones: {
    // Will be calculated from maxHR or threshold
  },
  
  // Load percentages (calculated from weight)
  loadTargets: {
    // 20%, 25%, 30% of bodyweight
  },
  
  // History of changes
  history: [],
  
  // Last updated
  lastUpdated: null,
};

// ============== UTILITY FUNCTIONS ==============
const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
const formatDateShort = (date) => date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-';

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

// Calculate training zones from max HR or thresholds
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

// Calculate load targets from bodyweight
const calculateLoadTargets = (weight) => {
  if (!weight) return null;
  return {
    light: Math.round(weight * 0.15),
    base: Math.round(weight * 0.20),
    standard: Math.round(weight * 0.25),
    peak: Math.round(weight * 0.30),
  };
};

// Calculate working weight from percentage
const calculateWorkingWeight = (prValue, percentage) => {
  if (!prValue || !percentage) return null;
  return Math.round(prValue * (percentage / 100) / 5) * 5; // Round to nearest 5
};

// Parse time string (mm:ss or hh:mm:ss) to seconds
const parseTimeToSeconds = (timeStr) => {
  if (!timeStr) return null;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
};

// Format seconds to mm:ss
const formatSecondsToTime = (seconds) => {
  if (!seconds) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// ============== DEFAULT PROGRAM WITH SMART REFERENCES ==============
const DEFAULT_PROGRAMS = {
  combatAlpinist: {
    id: 'combatAlpinist',
    name: 'Combat Alpinist',
    description: 'Integrated mountaineering protocol',
    icon: '⛰️',
    isDefault: true,
    phases: [
      {
        id: 'foundation',
        name: 'Foundation',
        weeks: [1, 16],
        description: 'Build aerobic engine, maintain strength. 80% Zone 1-2.',
        weeklyTemplate: [
          {
            day: 1, dayName: 'Day 1', session: 'Strength A', type: 'strength', duration: 60,
            prescription: {
              warmup: '10 min easy cardio + dynamic stretching',
              exercises: [
                { name: 'Trap Bar Deadlift', sets: 4, reps: '3-5', rest: '3 min', prKey: 'trapBarDeadlift', percentage: 85 },
                { name: 'Box Step-Up (each leg)', sets: 4, reps: '3-5', rest: '3 min', prKey: 'boxStepUp', percentage: 100, note: 'Per hand' },
                { name: 'Weighted Pull-Up', sets: 4, reps: '3-5', rest: '3 min', prKey: 'weightedPullUp', percentage: 85 },
                { name: 'Dip', sets: 4, reps: '3-5', rest: '3 min', prKey: 'weightedDip', percentage: 85 }
              ],
              cooldown: '5 min walk + static stretching',
              intensity: '85% 1RM - leave 1-2 reps in tank'
            }
          },
          {
            day: 2, dayName: 'Day 2', session: 'Zone 2 Run', type: 'cardio', duration: 70,
            prescription: {
              description: 'Easy conversational pace on flat to rolling terrain',
              hrZone: 'zone2',
              notes: ['Should be able to hold full conversation', 'Nasal breathing preferred', 'If HR drifts above Zone 2, slow down'],
              intensity: 'Zone 2'
            }
          },
          {
            day: 3, dayName: 'Day 3', session: 'Zone 2 + Mobility', type: 'cardio', duration: 55,
            prescription: {
              description: '30-40 min easy aerobic + 15-20 min mobility',
              hrZone: 'zone2',
              exercises: [
                { name: 'Pigeon Pose', duration: '2 min each side' },
                { name: 'Cat-Cow', reps: 20 },
                { name: 'Thread the Needle', reps: '10 each side' },
                { name: "Child's Pose", duration: '2 min' },
                { name: "World's Greatest Stretch", reps: '5 each side' }
              ],
              intensity: 'Zone 1-2'
            }
          },
          {
            day: 4, dayName: 'Day 4', session: 'Threshold Intervals', type: 'cardio', duration: 45,
            prescription: {
              warmup: '10 min easy jog building to moderate',
              mainSet: '4 x 8 min at Aerobic Threshold',
              recovery: '2 min easy jog between intervals',
              hrZone: 'zone3',
              cooldown: '5-10 min easy jog',
              intensity: 'Zone 3-4',
              notes: ['Comfortably hard - can speak in short sentences', 'HR at AeT']
            }
          },
          {
            day: 5, dayName: 'Day 5', session: 'Strength B', type: 'strength', duration: 60,
            prescription: {
              warmup: '10 min easy cardio + dynamic stretching',
              exercises: [
                { name: 'Trap Bar Deadlift', sets: 4, reps: '3-5', rest: '3 min', prKey: 'trapBarDeadlift', percentage: 85 },
                { name: 'Box Step-Up (each leg)', sets: 4, reps: '3-5', rest: '3 min', prKey: 'boxStepUp', percentage: 100 },
                { name: 'Weighted Pull-Up', sets: 4, reps: '3-5', rest: '3 min', prKey: 'weightedPullUp', percentage: 85 },
                { name: 'Dip', sets: 4, reps: '3-5', rest: '3 min', prKey: 'weightedDip', percentage: 85 }
              ],
              accessory: [
                { name: 'Face Pulls', sets: 2, reps: 15 },
                { name: 'Pallof Press', sets: 2, reps: 15 }
              ],
              cooldown: '5 min walk + static stretching',
              intensity: '85% 1RM - leave 1-2 reps in tank'
            }
          },
          {
            day: 6, dayName: 'Day 6', session: 'Long Aerobic', type: 'long_effort', duration: 150,
            prescription: {
              description: 'Long Zone 1-2 effort',
              hrZone: 'zone2',
              options: ['Long hike (unloaded or <10 lbs)', 'Long run on trails', 'Combination run/hike'],
              nutrition: '30-60g carbs/hour after first hour',
              hydration: '16-24 oz/hour',
              intensity: 'Zone 1-2',
              progression: { 'Weeks 1-4': '2 hours', 'Weeks 5-8': '2.5 hours', 'Weeks 9-12': '2.5-3 hours', 'Weeks 13-16': '3+ hours' }
            }
          },
          {
            day: 7, dayName: 'Day 7', session: 'Active Recovery', type: 'recovery', duration: 30,
            prescription: {
              description: 'Very easy movement to promote recovery',
              hrZone: 'zone1',
              options: ['Easy walk', 'Light yoga/stretching', 'Swimming (easy)', 'Foam rolling + mobility'],
              intensity: 'Zone 1 or complete rest',
              notes: ['This is NOT a workout', 'If feeling fatigued, take complete rest']
            }
          }
        ],
        benchmarks: [
          { name: 'AeT HR Drift', target: '<5% over 60 min', key: 'aetDrift' },
          { name: '5-Mile Run', target: '<36:00', key: 'fiveMileTime' },
          { name: 'Strength Floor', target: 'No lifts drop >5%', key: 'strengthMaintenance' }
        ]
      },
      {
        id: 'conversion',
        name: 'Conversion',
        weeks: [17, 28],
        description: 'Convert strength to muscular endurance. The crux.',
        weeklyTemplate: [
          { day: 1, dayName: 'Day 1', session: 'Strength (Reduced)', type: 'strength', duration: 45, prescription: { warmup: '10 min easy cardio', exercises: [ { name: 'Trap Bar Deadlift', sets: 3, reps: '3-5', rest: '3 min', prKey: 'trapBarDeadlift', percentage: 85 }, { name: 'Box Step-Up (each leg)', sets: 3, reps: '3-5', rest: '3 min', prKey: 'boxStepUp', percentage: 100 }, { name: 'Weighted Pull-Up', sets: 3, reps: '3-5', rest: '3 min', prKey: 'weightedPullUp', percentage: 85 }, { name: 'Dip', sets: 3, reps: '3-5', rest: '3 min', prKey: 'weightedDip', percentage: 85 } ], intensity: 'Maintenance only' } },
          { day: 2, dayName: 'Day 2', session: 'Zone 2 Run', type: 'cardio', duration: 60, prescription: { description: 'Easy recovery-pace run', hrZone: 'zone2', intensity: 'Zone 2', notes: ['Recovery from ME work'] } },
          { day: 3, dayName: 'Day 3', session: 'Gym ME Session', type: 'muscular_endurance', duration: 70, prescription: { warmup: '10 min easy cardio', description: 'Continuous circuit, minimal rest', exercises: [ { name: 'Box Step-Up', notes: '75% knee height' }, { name: 'Walking Lunge', notes: 'Continuous' }, { name: 'Split Squat', notes: 'Alternating' }, { name: 'Heel Touch', notes: 'Eccentric focus' } ], tempo: '1 rep every 2 seconds', loadType: 'bodyweight_percentage', progression: { 'Weeks 17-20': { load: 0, steps: 400 }, 'Weeks 21-24': { load: 10, steps: 500 }, 'Weeks 25-28': { load: 20, steps: 600 } } } },
          { day: 4, dayName: 'Day 4', session: 'Zone 2 + Mobility', type: 'cardio', duration: 45, prescription: { description: '30 min easy aerobic + 15 min mobility', hrZone: 'zone2', intensity: 'Zone 1-2' } },
          { day: 5, dayName: 'Day 5', session: 'Threshold Intervals', type: 'cardio', duration: 45, prescription: { warmup: '10 min building effort', mainSet: '5 x 6 min at tempo', recovery: '2 min easy jog', hrZone: 'zone3', cooldown: '5-10 min easy', intensity: 'Zone 3-4' } },
          { day: 6, dayName: 'Day 6', session: 'Outdoor ME (Water Jug)', type: 'muscular_endurance', duration: 90, prescription: { description: 'THE WATER JUG PROTOCOL', steps: ['Fill pack with water jugs to target weight', 'Find steep terrain (30%+ grade)', 'Hike continuously uphill for 60-90 min', 'At the top: DUMP THE WATER', 'Descend with empty pack'], loadType: 'bodyweight_percentage', progression: { 'Weeks 17-20': { load: 15, duration: 60 }, 'Weeks 21-24': { load: 20, duration: 75 }, 'Weeks 25-28': { load: 25, duration: 90 } }, intensity: 'Zone 2-3' } },
          { day: 7, dayName: 'Day 7', session: 'Active Recovery', type: 'recovery', duration: 30, prescription: { description: 'Very easy movement or complete rest', hrZone: 'zone1', intensity: 'Zone 1 or rest' } }
        ],
        benchmarks: [ { name: 'Gym ME', target: '600 steps @ 20% BW', key: 'gymME' }, { name: '5-Mile Run', target: '<34:00', key: 'fiveMileTime' }, { name: 'AeT/AnT Gap', target: 'Within 12%', key: 'thresholdGap' } ]
      },
      {
        id: 'specificity',
        name: 'Specificity',
        weeks: [29, 40],
        description: 'Expedition simulation. Peak loads, back-to-back efforts.',
        weeklyTemplate: [
          { day: 1, dayName: 'Day 1', session: 'Strength (Minimal)', type: 'strength', duration: 40, prescription: { exercises: [ { name: 'Trap Bar Deadlift', sets: 3, reps: '3-5', rest: '3 min', prKey: 'trapBarDeadlift', percentage: 82 }, { name: 'Weighted Pull-Up', sets: 3, reps: '3-5', rest: '3 min', prKey: 'weightedPullUp', percentage: 82 } ], intensity: '80-85% 1RM - maintaining only' } },
          { day: 2, dayName: 'Day 2', session: 'Zone 2 Run', type: 'cardio', duration: 55, prescription: { description: 'Easy recovery run', hrZone: 'zone2', intensity: 'Zone 2', notes: ['Recovery from weekend sawtooth'] } },
          { day: 3, dayName: 'Day 3', session: 'Peak ME Session', type: 'muscular_endurance', duration: 75, prescription: { description: 'Continuous circuit at peak load', target: '800-1000 total steps', loadType: 'bodyweight_percentage', load: 25, tempo: '1 step every 2 seconds', notes: ['This is HARD', 'Maintain form under fatigue'] } },
          { day: 4, dayName: 'Day 4', session: 'Off or Mobility', type: 'recovery', duration: 30, prescription: { description: 'TRUE RECOVERY DAY', options: ['Complete rest', 'Light mobility only'], notes: ['Do NOT train', 'You need this for the weekend sawtooth'] } },
          { day: 5, dayName: 'Day 5', session: 'Tempo Run', type: 'cardio', duration: 45, prescription: { warmup: '10 min building', mainSet: '3 x 1 mile at goal pace', paceTarget: 'fiveMileGoalPace', recovery: '2-3 min jog between', cooldown: '10 min easy', intensity: 'Goal 5-mile pace' } },
          { day: 6, dayName: 'Day 6', session: 'Sawtooth Day 1', type: 'long_effort', duration: 300, prescription: { description: 'LONG LOADED EFFORT', loadType: 'bodyweight_percentage', load: 27, duration: '4-6 hours', benchmark: '1000 vertical feet/hour in Zone 2', nutrition: '60-90g carbs/hour after first hour', hydration: '16-24 oz/hour' } },
          { day: 7, dayName: 'Day 7', session: 'Sawtooth Day 2', type: 'long_effort', duration: 150, prescription: { description: 'BACK-TO-BACK - Fatigue resistance', loadType: 'bodyweight_percentage', load: 15, duration: '2-3 hours', hrZone: 'zone2', purpose: 'Train performance on tired legs', intensity: 'Zone 1-2' } }
        ],
        benchmarks: [ { name: 'Vertical Rate', target: '1000 ft/hr @ 25% BW', key: 'verticalRate' }, { name: '5-Mile Run', target: '<32:00', key: 'fiveMileTime' }, { name: 'AeT/AnT Gap', target: 'Within 10%', key: 'thresholdGap' } ]
      }
    ]
  }
};

// ============== PR DISPLAY NAMES ==============
const PR_DISPLAY_NAMES = {
  trapBarDeadlift: 'Trap Bar Deadlift',
  backSquat: 'Back Squat',
  frontSquat: 'Front Squat',
  benchPress: 'Bench Press',
  overheadPress: 'Overhead Press',
  weightedPullUp: 'Weighted Pull-Up',
  weightedDip: 'Weighted Dip',
  boxStepUp: 'Box Step-Up (per DB)',
};

const BENCHMARK_DISPLAY_NAMES = {
  fiveMileTime: '5-Mile Time',
  aerobicThresholdHR: 'Aerobic Threshold HR',
  anaerobicThresholdHR: 'Anaerobic Threshold HR',
  maxHR: 'Max Heart Rate',
  restingHR: 'Resting HR',
  hrvBaseline: 'HRV Baseline',
  verticalRate: 'Vertical Rate (25% BW)',
  vo2max: 'VO2 Max (est.)',
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
        updated[category] = {
          ...updated[category],
          [key]: {
            ...updated[category][key],
            value: newValue,
            date: newValue ? new Date().toISOString().split('T')[0] : null
          }
        };
        // Record in history
        if (newValue) {
          updated.history = [
            ...(updated.history || []),
            { category, key, value: newValue, date: new Date().toISOString() }
          ].slice(-100); // Keep last 100 entries
        }
      }
      updated.lastUpdated = new Date().toISOString();
      return updated;
    });
    
    setEditMode(null);
    setTempValue('');
  };

  const cancelEdit = () => {
    setEditMode(null);
    setTempValue('');
  };

  const zones = useMemo(() => 
    calculateZones(profile.benchmarks?.maxHR?.value, profile.benchmarks?.aerobicThresholdHR?.value, profile.benchmarks?.anaerobicThresholdHR?.value),
    [profile.benchmarks?.maxHR?.value, profile.benchmarks?.aerobicThresholdHR?.value, profile.benchmarks?.anaerobicThresholdHR?.value]
  );

  const loadTargets = useMemo(() => calculateLoadTargets(profile.weight), [profile.weight]);

  const EditableField = ({ category, fieldKey, value, unit, note }) => {
    const isEditing = editMode?.category === category && editMode?.key === fieldKey;
    
    return (
      <div className={`flex items-center justify-between p-3 ${theme.cardAlt} rounded-lg`}>
        <div className="flex-1">
          <p className={`text-sm ${theme.text}`}>
            {category === 'prs' ? PR_DISPLAY_NAMES[fieldKey] : 
             category === 'benchmarks' ? BENCHMARK_DISPLAY_NAMES[fieldKey] : fieldKey}
          </p>
          {note && <p className={`text-xs ${theme.textMuted}`}>{note}</p>}
        </div>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type={unit === 'min:sec' ? 'text' : 'number'}
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder={unit === 'min:sec' ? '32:00' : '0'}
              className={`w-24 px-2 py-1 rounded ${theme.input} text-right text-sm`}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
            />
            <span className={`text-xs ${theme.textMuted}`}>{unit}</span>
            <button onClick={saveEdit} className="p-1 text-green-500 hover:bg-green-500/20 rounded"><CheckCircle2 size={18} /></button>
            <button onClick={cancelEdit} className="p-1 text-red-500 hover:bg-red-500/20 rounded"><XIcon size={18} /></button>
          </div>
        ) : (
          <button onClick={() => startEdit(category, fieldKey, value)} className="flex items-center gap-2 group">
            <span className={`font-mono ${value ? theme.text : theme.textMuted}`}>
              {value || '—'}
            </span>
            <span className={`text-xs ${theme.textMuted}`}>{unit}</span>
            <Edit3 size={14} className={`${theme.textMuted} opacity-0 group-hover:opacity-100 transition-opacity`} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-bold ${theme.text}`}>Athlete Profile</h2>
        <div className={`text-xs ${theme.textMuted}`}>
          {profile.lastUpdated ? `Updated ${formatDateShort(profile.lastUpdated)}` : 'Not set up'}
        </div>
      </div>

      {/* Basic Info */}
      <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
        <h3 className={`font-semibold ${theme.text} mb-4 flex items-center gap-2`}>
          <User size={18} /> Basic Info
        </h3>
        <div className="space-y-2">
          <EditableField category="basic" fieldKey="weight" value={profile.weight} unit="lbs" />
          <EditableField category="basic" fieldKey="age" value={profile.age} unit="years" />
        </div>
        
        {/* Calculated Load Targets */}
        {loadTargets && (
          <div className={`mt-4 p-3 ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'} rounded-lg`}>
            <p className={`text-xs font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'} mb-2`}>LOAD TARGETS (from {profile.weight} lbs)</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              {Object.entries(loadTargets).map(([key, val]) => (
                <div key={key}>
                  <p className={`font-mono font-bold ${theme.text}`}>{val}</p>
                  <p className={`text-xs ${theme.textMuted}`}>{key === 'light' ? '15%' : key === 'base' ? '20%' : key === 'standard' ? '25%' : '30%'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Strength PRs */}
      <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
        <h3 className={`font-semibold ${theme.text} mb-4 flex items-center gap-2`}>
          <Award size={18} /> Strength PRs (1RM)
        </h3>
        <div className="space-y-2">
          {Object.entries(profile.prs || {}).map(([key, data]) => (
            <EditableField 
              key={key} 
              category="prs" 
              fieldKey={key} 
              value={data?.value} 
              unit={data?.unit || 'lbs'}
              note={data?.note}
            />
          ))}
        </div>
      </div>

      {/* Cardio Benchmarks */}
      <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
        <h3 className={`font-semibold ${theme.text} mb-4 flex items-center gap-2`}>
          <Heart size={18} /> Cardio Benchmarks
        </h3>
        <div className="space-y-2">
          {Object.entries(profile.benchmarks || {}).map(([key, data]) => (
            <EditableField 
              key={key} 
              category="benchmarks" 
              fieldKey={key} 
              value={data?.value} 
              unit={data?.unit || 'bpm'}
              note={data?.note}
            />
          ))}
        </div>
        
        {/* Calculated Zones */}
        {zones && (
          <div className={`mt-4 p-3 ${darkMode ? 'bg-green-900/30' : 'bg-green-50'} rounded-lg`}>
            <p className={`text-xs font-medium ${darkMode ? 'text-green-400' : 'text-green-600'} mb-2`}>HR ZONES (from max {profile.benchmarks?.maxHR?.value})</p>
            <div className="space-y-1">
              {Object.entries(zones).filter(([k]) => k.startsWith('zone')).map(([key, zone]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className={theme.textMuted}>{key.replace('zone', 'Z')} - {zone.name}</span>
                  <span className={`font-mono ${theme.text}`}>{zone.min}-{zone.max}</span>
                </div>
              ))}
              <div className={`pt-2 mt-2 border-t ${theme.border}`}>
                <div className="flex justify-between text-sm">
                  <span className={theme.textMuted}>Aerobic Threshold</span>
                  <span className={`font-mono ${theme.text}`}>{zones.aet} bpm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={theme.textMuted}>Anaerobic Threshold</span>
                  <span className={`font-mono ${theme.text}`}>{zones.ant} bpm</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PR History */}
      {profile.history?.length > 0 && (
        <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
          <h3 className={`font-semibold ${theme.text} mb-4 flex items-center gap-2`}>
            <TrendingUp size={18} /> Recent Updates
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {[...profile.history].reverse().slice(0, 10).map((entry, idx) => (
              <div key={idx} className={`flex justify-between text-sm p-2 ${theme.cardAlt} rounded`}>
                <span className={theme.text}>
                  {entry.category === 'prs' ? PR_DISPLAY_NAMES[entry.key] : BENCHMARK_DISPLAY_NAMES[entry.key]}
                </span>
                <span className={theme.textMuted}>
                  {entry.value} • {formatDateShort(entry.date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============== SMART EXERCISE DISPLAY ==============
const SmartExercise = ({ exercise, profile, theme, darkMode, isComplete, onToggle }) => {
  const workingWeight = exercise.prKey && exercise.percentage && profile.prs?.[exercise.prKey]?.value
    ? calculateWorkingWeight(profile.prs[exercise.prKey].value, exercise.percentage)
    : null;
  
  const prValue = exercise.prKey ? profile.prs?.[exercise.prKey]?.value : null;

  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
        isComplete 
          ? 'bg-green-500/20 border-green-500' 
          : `${theme.cardAlt} ${darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-slate-200 hover:border-slate-300'}`
      }`}
    >
      {isComplete ? (
        <CheckCircle2 size={24} className="text-green-500 flex-shrink-0" />
      ) : (
        <Circle size={24} className={`${theme.textMuted} flex-shrink-0`} />
      )}
      <div className="flex-1">
        <p className={`font-medium ${theme.text}`}>{exercise.name}</p>
        <div className={`flex flex-wrap gap-x-4 gap-y-1 text-sm ${theme.textMuted} mt-1`}>
          {exercise.sets && <span>{exercise.sets} sets</span>}
          {exercise.reps && <span>× {exercise.reps}</span>}
          {exercise.duration && <span>{exercise.duration}</span>}
          {exercise.rest && <span className={theme.textSubtle}>Rest: {exercise.rest}</span>}
        </div>
        
        {/* Smart weight calculation */}
        {workingWeight && (
          <div className={`mt-2 flex items-center gap-2`}>
            <span className={`px-2 py-1 rounded text-sm font-mono font-bold ${darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
              {workingWeight} lbs
            </span>
            <span className={`text-xs ${theme.textMuted}`}>
              ({exercise.percentage}% of {prValue} 1RM)
            </span>
          </div>
        )}
        
        {/* If no PR set, show warning */}
        {exercise.prKey && !prValue && (
          <div className={`mt-2 flex items-center gap-1 text-xs ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
            <AlertTriangle size={12} />
            <span>Set your {PR_DISPLAY_NAMES[exercise.prKey]} PR in Profile</span>
          </div>
        )}
        
        {exercise.notes && !workingWeight && (
          <p className="text-sm text-blue-500 mt-1">{exercise.notes}</p>
        )}
        {exercise.note && (
          <p className={`text-xs ${theme.textMuted} mt-1`}>{exercise.note}</p>
        )}
      </div>
    </button>
  );
};

// ============== SMART LOAD DISPLAY ==============
const SmartLoadDisplay = ({ prescription, profile, theme, darkMode, currentWeek }) => {
  if (prescription.loadType !== 'bodyweight_percentage') return null;
  
  const weight = profile.weight || 225;
  
  // Check for week-specific progression
  let loadPercent = prescription.load;
  let extraInfo = null;
  
  if (prescription.progression) {
    for (const [weekRange, data] of Object.entries(prescription.progression)) {
      const match = weekRange.match(/Weeks? (\d+)-?(\d+)?/);
      if (match) {
        const start = parseInt(match[1]);
        const end = match[2] ? parseInt(match[2]) : start;
        if (currentWeek >= start && currentWeek <= end) {
          loadPercent = data.load;
          extraInfo = data;
          break;
        }
      }
    }
  }
  
  const loadWeight = loadPercent ? Math.round(weight * (loadPercent / 100)) : null;
  
  if (!loadWeight) return null;
  
  return (
    <div className={`p-4 ${darkMode ? 'bg-orange-900/30' : 'bg-orange-50'} rounded-lg`}>
      <p className={`text-xs font-medium ${darkMode ? 'text-orange-400' : 'text-orange-600'} uppercase mb-2`}>
        Load Target (Week {currentWeek})
      </p>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold font-mono ${theme.text}`}>{loadWeight} lbs</span>
        <span className={theme.textMuted}>({loadPercent}% of {weight} lbs BW)</span>
      </div>
      {extraInfo?.steps && (
        <p className={`text-sm ${theme.textMuted} mt-1`}>Target: {extraInfo.steps} total steps</p>
      )}
      {extraInfo?.duration && (
        <p className={`text-sm ${theme.textMuted} mt-1`}>Duration: {extraInfo.duration} min</p>
      )}
    </div>
  );
};

// ============== HR ZONE DISPLAY ==============
const HRZoneDisplay = ({ hrZone, profile, theme, darkMode }) => {
  const zones = calculateZones(
    profile.benchmarks?.maxHR?.value,
    profile.benchmarks?.aerobicThresholdHR?.value,
    profile.benchmarks?.anaerobicThresholdHR?.value
  );
  
  if (!zones || !hrZone) return null;
  
  const zone = zones[hrZone];
  if (!zone) return null;
  
  return (
    <div className={`p-3 ${darkMode ? 'bg-green-900/30' : 'bg-green-50'} rounded-lg flex items-center justify-between`}>
      <div>
        <p className={`text-xs font-medium ${darkMode ? 'text-green-400' : 'text-green-600'} uppercase`}>Target HR Zone</p>
        <p className={`font-medium ${theme.text}`}>{zone.name}</p>
      </div>
      <div className="text-right">
        <span className={`text-xl font-bold font-mono ${theme.text}`}>{zone.min}-{zone.max}</span>
        <span className={`text-sm ${theme.textMuted} ml-1`}>bpm</span>
      </div>
    </div>
  );
};

// ============== MAIN APP COMPONENT ==============
export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useLocalStorage('trainingHub_darkMode', window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [athleteProfile, setAthleteProfile] = useLocalStorage('trainingHub_athleteProfile', DEFAULT_ATHLETE_PROFILE);
  const [customPrograms, setCustomPrograms] = useLocalStorage('trainingHub_customPrograms', {});
  const [programState, setProgramState] = useLocalStorage('trainingHub_programState', { 
    currentProgram: 'combatAlpinist', 
    currentWeek: 1, 
    currentDay: 1,
    startDate: new Date().toISOString().split('T')[0]
  });
  const [workoutLogs, setWorkoutLogs] = useLocalStorage('trainingHub_workoutLogs', []);
  const [exerciseCompletion, setExerciseCompletion] = useState({});
  const [workoutData, setWorkoutData] = useState({ duration: 0, rpe: 5, notes: '', newPRs: {} });
  const [showProgramUpload, setShowProgramUpload] = useState(false);

  // Merge default and custom programs
  const allPrograms = { ...DEFAULT_PROGRAMS, ...customPrograms };
  const program = allPrograms[programState.currentProgram];
  const phase = program?.phases.find(p => programState.currentWeek >= p.weeks[0] && programState.currentWeek <= p.weeks[1]);
  const todayWorkout = phase?.weeklyTemplate.find(w => w.day === programState.currentDay);

  useEffect(() => { 
    if (todayWorkout) setWorkoutData(prev => ({ ...prev, duration: todayWorkout.duration })); 
  }, [todayWorkout?.session]);

  // Get logs for current week
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
    // Update any new PRs
    if (Object.keys(workoutData.newPRs || {}).length > 0) {
      setAthleteProfile(prev => {
        const updated = { ...prev, prs: { ...prev.prs }, history: [...(prev.history || [])] };
        for (const [key, value] of Object.entries(workoutData.newPRs)) {
          if (value && (!updated.prs[key]?.value || value > updated.prs[key].value)) {
            updated.prs[key] = { ...updated.prs[key], value, date: new Date().toISOString().split('T')[0] };
            updated.history.push({ category: 'prs', key, value, date: new Date().toISOString() });
          }
        }
        updated.lastUpdated = new Date().toISOString();
        return updated;
      });
    }

    const newLog = { 
      id: Date.now(), 
      date: new Date().toISOString().split('T')[0], 
      week: programState.currentWeek, 
      day: programState.currentDay,
      phase: phase?.name, 
      session: todayWorkout.session, 
      type: todayWorkout.type, 
      programId: programState.currentProgram,
      prescribed: todayWorkout.duration, 
      actual: workoutData.duration, 
      rpe: workoutData.rpe, 
      notes: workoutData.notes,
      prsHit: workoutData.newPRs,
      completed: true 
    };
    setWorkoutLogs(prev => [...prev.filter(log => !(log.date === newLog.date && log.session === newLog.session && log.programId === newLog.programId)), newLog]);
    setExerciseCompletion({});
    setWorkoutData({ duration: todayWorkout?.duration || 0, rpe: 5, notes: '', newPRs: {} });
    advanceDay();
  };

  const exportData = () => {
    const data = { athleteProfile, programState, workoutLogs, customPrograms, darkMode, exportedAt: new Date().toISOString(), version: '2.0' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `training-hub-backup-${new Date().toISOString().split('T')[0]}.json`; a.click();
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
          if (data.programState) setProgramState(data.programState);
          if (data.workoutLogs) setWorkoutLogs(data.workoutLogs);
          if (data.customPrograms) setCustomPrograms(data.customPrograms);
          if (data.darkMode !== undefined) setDarkMode(data.darkMode);
          alert('Data imported successfully!');
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
          if (!programData.id || !programData.name || !programData.phases) {
            alert('Invalid program format.');
            return;
          }
          const newId = programData.id + '_' + Date.now();
          const newProgram = { ...programData, id: newId, isDefault: false };
          setCustomPrograms(prev => ({ ...prev, [newId]: newProgram }));
          alert(`Program "${programData.name}" imported!`);
          setShowProgramUpload(false);
        } catch (err) { alert('Error importing program.'); }
      };
      reader.readAsText(file);
    }
  };

  const deleteProgram = (programId) => {
    if (allPrograms[programId]?.isDefault) return;
    if (confirm(`Delete "${allPrograms[programId]?.name}"?`)) {
      setCustomPrograms(prev => { const updated = { ...prev }; delete updated[programId]; return updated; });
      if (programState.currentProgram === programId) {
        setProgramState(prev => ({ ...prev, currentProgram: 'combatAlpinist' }));
      }
    }
  };

  const todayLog = workoutLogs.find(log => 
    log.week === programState.currentWeek && 
    log.day === programState.currentDay && 
    log.programId === programState.currentProgram &&
    log.completed
  );

  // Training load calculations
  const last7DaysLogs = workoutLogs.filter(log => {
    const logDate = new Date(log.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return logDate >= weekAgo && log.completed;
  });
  const acuteLoad = last7DaysLogs.reduce((sum, log) => sum + (log.actual || 0), 0);
  
  const last28DaysLogs = workoutLogs.filter(log => {
    const logDate = new Date(log.date);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 28);
    return logDate >= monthAgo && log.completed;
  });
  const chronicLoad = last28DaysLogs.length > 0 ? Math.round(last28DaysLogs.reduce((sum, log) => sum + (log.actual || 0), 0) / 4) : 0;
  const loadRatio = chronicLoad > 0 ? (acuteLoad / chronicLoad).toFixed(2) : '-';

  // Theme classes
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
      {/* Header */}
      <header className={`${theme.header} text-white p-4 sticky top-0 z-50`}>
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⛰️</span>
            <h1 className="text-lg font-bold">Training Hub</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className={`absolute top-full left-0 right-0 ${theme.header} border-t border-slate-700 p-4 shadow-lg`}>
            <div className="max-w-2xl mx-auto flex flex-col gap-2">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: Home },
                { id: 'workout', label: "Today's Workout", icon: Play },
                { id: 'profile', label: 'Athlete Profile', icon: User },
                { id: 'log', label: 'Workout Log', icon: Calendar },
                { id: 'progress', label: 'Progress & Data', icon: BarChart3 },
                { id: 'programs', label: 'Programs', icon: FileUp },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => { setCurrentView(id); setMenuOpen(false); }} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${currentView === id ? 'bg-slate-600' : 'hover:bg-slate-700'}`}>
                  <Icon size={20} /><span>{label}</span>
                </button>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="max-w-2xl mx-auto pb-24">
        {/* DASHBOARD VIEW */}
        {currentView === 'dashboard' && (
          <div className="p-4 space-y-4">
            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`${theme.card} rounded-xl shadow-sm p-4`}>
                <p className={`text-xs ${theme.textMuted} uppercase`}>Acute Load (7d)</p>
                <p className={`text-2xl font-bold ${theme.text}`}>{acuteLoad}<span className={`text-sm ${theme.textMuted} ml-1`}>min</span></p>
              </div>
              <div className={`${theme.card} rounded-xl shadow-sm p-4`}>
                <p className={`text-xs ${theme.textMuted} uppercase`}>A:C Ratio</p>
                <p className={`text-2xl font-bold ${loadRatio !== '-' && loadRatio > 1.5 ? 'text-red-500' : loadRatio !== '-' && loadRatio < 0.8 ? 'text-amber-500' : theme.text}`}>
                  {loadRatio}
                </p>
                <p className={`text-xs ${theme.textMuted}`}>{loadRatio !== '-' && loadRatio > 1.5 ? 'High fatigue risk' : loadRatio !== '-' && loadRatio < 0.8 ? 'Detraining risk' : 'Optimal'}</p>
              </div>
            </div>

            {/* Program Status */}
            <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className={`text-xs ${theme.textMuted} uppercase tracking-wide`}>{program?.name}</p>
                  <h2 className={`text-lg font-bold ${theme.text}`}>{phase?.name} Phase</h2>
                </div>
                <span className="text-3xl">{program?.icon}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className={`text-center p-2 ${theme.cardAlt} rounded-lg`}>
                  <p className={`text-xl font-bold ${theme.text}`}>{programState.currentWeek}</p>
                  <p className={`text-xs ${theme.textMuted}`}>Week</p>
                </div>
                <div className={`text-center p-2 ${theme.cardAlt} rounded-lg`}>
                  <p className={`text-xl font-bold ${theme.text}`}>{programState.currentDay}</p>
                  <p className={`text-xs ${theme.textMuted}`}>Day</p>
                </div>
                <div className={`text-center p-2 ${theme.cardAlt} rounded-lg`}>
                  <p className={`text-xl font-bold ${theme.text}`}>{completedThisWeek}</p>
                  <p className={`text-xs ${theme.textMuted}`}>Done</p>
                </div>
                <div className={`text-center p-2 ${theme.cardAlt} rounded-lg`}>
                  <p className={`text-xl font-bold ${theme.text}`}>{workoutLogs.filter(l => l.programId === programState.currentProgram).length}</p>
                  <p className={`text-xs ${theme.textMuted}`}>Total</p>
                </div>
              </div>
            </div>

            {/* Today's Workout Card */}
            {todayWorkout && (
              <button onClick={() => setCurrentView('workout')} className={`w-full text-left rounded-xl shadow-sm p-5 border-l-4 ${getTypeBorder(todayWorkout.type)} ${theme.card} hover:shadow-md transition-shadow`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs ${theme.textMuted} uppercase tracking-wide`}>Up Next: Day {programState.currentDay}</p>
                    <h3 className={`text-xl font-bold ${theme.text} mt-1`}>{todayWorkout.session}</h3>
                    <div className={`flex items-center gap-3 mt-2 text-sm ${theme.textMuted}`}>
                      <span className="flex items-center gap-1"><Clock size={14} />{todayWorkout.duration} min</span>
                      <span className={`px-2 py-0.5 rounded text-xs text-white ${getTypeColor(todayWorkout.type, darkMode)}`}>{todayWorkout.type.replace('_', ' ')}</span>
                      {todayLog?.completed && <span className="flex items-center gap-1 text-green-500 font-medium"><CheckCircle2 size={14} />Done</span>}
                    </div>
                  </div>
                  <ChevronRight size={24} className={theme.textMuted} />
                </div>
              </button>
            )}

            {/* Week Overview */}
            <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
              <h3 className={`font-semibold ${theme.text} mb-3`}>This Week</h3>
              <div className="space-y-2">
                {phase?.weeklyTemplate.map((workout, idx) => {
                  const isCurrent = workout.day === programState.currentDay;
                  const logged = thisWeekLogs.find(l => l.day === workout.day && l.completed);
                  return (
                    <div key={idx} className={`flex items-center gap-3 p-2 rounded-lg ${isCurrent ? (darkMode ? 'bg-blue-900/40 border border-blue-700' : 'bg-blue-50 border border-blue-200') : theme.cardAlt}`}>
                      {logged ? <CheckCircle2 size={18} className="text-green-500" /> : <Circle size={18} className={theme.textSubtle} />}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${theme.text} truncate`}>{workout.session}</p>
                      </div>
                      <span className={`text-xs ${theme.textMuted}`}>D{workout.day}</span>
                      <span className={`text-xs ${theme.textMuted}`}>{workout.duration}m</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Profile Stats */}
            {athleteProfile.weight && (
              <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-semibold ${theme.text}`}>Quick Stats</h3>
                  <button onClick={() => setCurrentView('profile')} className={`text-xs ${theme.textMuted} hover:underline`}>Edit Profile →</button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className={`p-2 ${theme.cardAlt} rounded-lg text-center`}>
                    <p className={`text-lg font-bold font-mono ${theme.text}`}>{athleteProfile.weight}</p>
                    <p className={`text-xs ${theme.textMuted}`}>BW (lbs)</p>
                  </div>
                  {athleteProfile.prs?.trapBarDeadlift?.value && (
                    <div className={`p-2 ${theme.cardAlt} rounded-lg text-center`}>
                      <p className={`text-lg font-bold font-mono ${theme.text}`}>{athleteProfile.prs.trapBarDeadlift.value}</p>
                      <p className={`text-xs ${theme.textMuted}`}>Deadlift</p>
                    </div>
                  )}
                  {athleteProfile.benchmarks?.fiveMileTime?.value && (
                    <div className={`p-2 ${theme.cardAlt} rounded-lg text-center`}>
                      <p className={`text-lg font-bold font-mono ${theme.text}`}>{athleteProfile.benchmarks.fiveMileTime.value}</p>
                      <p className={`text-xs ${theme.textMuted}`}>5-Mile</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* WORKOUT VIEW */}
        {currentView === 'workout' && todayWorkout && (
          <div className="p-4 space-y-4">
            <div className={`${getTypeColor(todayWorkout.type, darkMode)} rounded-xl p-5 text-white`}>
              <p className="text-sm opacity-80 uppercase tracking-wide">Week {programState.currentWeek} • Day {programState.currentDay}</p>
              <h2 className="text-2xl font-bold mt-1">{todayWorkout.session}</h2>
              <div className="flex items-center gap-4 mt-3 text-sm opacity-90">
                <span className="flex items-center gap-1"><Clock size={16} />{todayWorkout.duration} min</span>
                <span className="capitalize">{todayWorkout.type.replace('_', ' ')}</span>
              </div>
              {todayLog?.completed && <div className="mt-4 bg-white/20 rounded-lg p-3 flex items-center gap-2"><CheckCircle2 size={18} /><span>Completed</span></div>}
            </div>

            {/* Smart HR Zone */}
            {todayWorkout.prescription.hrZone && (
              <HRZoneDisplay hrZone={todayWorkout.prescription.hrZone} profile={athleteProfile} theme={theme} darkMode={darkMode} />
            )}

            {/* Smart Load Target */}
            <SmartLoadDisplay prescription={todayWorkout.prescription} profile={athleteProfile} theme={theme} darkMode={darkMode} currentWeek={programState.currentWeek} />

            <div className={`${theme.card} rounded-xl shadow-sm overflow-hidden`}>
              {todayWorkout.prescription.warmup && <div className={`p-4 border-b ${theme.border}`}><p className={`text-xs font-medium ${theme.textMuted} uppercase mb-2`}>Warm-up</p><p className={theme.text}>{todayWorkout.prescription.warmup}</p></div>}
              {todayWorkout.prescription.description && <div className={`p-4 border-b ${theme.border}`}><p className={`text-xs font-medium ${theme.textMuted} uppercase mb-2`}>Overview</p><p className={theme.text}>{todayWorkout.prescription.description}</p></div>}
              {todayWorkout.prescription.mainSet && <div className={`p-4 border-b ${theme.border} ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}><p className="text-xs font-medium text-blue-500 uppercase mb-2">Main Set</p><p className={`text-lg font-semibold ${theme.text}`}>{todayWorkout.prescription.mainSet}</p>{todayWorkout.prescription.recovery && <p className={`${theme.textMuted} mt-1`}>Recovery: {todayWorkout.prescription.recovery}</p>}</div>}
              
              {/* Smart Exercises */}
              {todayWorkout.prescription.exercises && (
                <div className={`p-4 border-b ${theme.border}`}>
                  <p className={`text-xs font-medium ${theme.textMuted} uppercase mb-3`}>Exercises</p>
                  <div className="space-y-2">
                    {todayWorkout.prescription.exercises.map((ex, idx) => (
                      <SmartExercise 
                        key={idx} 
                        exercise={ex} 
                        profile={athleteProfile} 
                        theme={theme} 
                        darkMode={darkMode}
                        isComplete={exerciseCompletion[ex.name]}
                        onToggle={() => toggleExercise(ex.name)}
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
                        <p className={`text-sm ${theme.textMuted}`}>{ex.sets} sets × {ex.reps}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {todayWorkout.prescription.progression && !todayWorkout.prescription.loadType && (
                <div className={`p-4 border-b ${theme.border} ${darkMode ? 'bg-amber-900/30' : 'bg-amber-50'}`}>
                  <p className={`text-xs font-medium ${darkMode ? 'text-amber-400' : 'text-amber-700'} uppercase mb-2`}>Progression</p>
                  <div className="space-y-1">{Object.entries(todayWorkout.prescription.progression).map(([k, v]) => <div key={k} className="flex justify-between text-sm"><span className={theme.textMuted}>{k}</span><span className={`font-medium ${theme.text}`}>{typeof v === 'object' ? JSON.stringify(v) : v}</span></div>)}</div>
                </div>
              )}

              {todayWorkout.prescription.steps && <div className={`p-4 border-b ${theme.border}`}><p className={`text-xs font-medium ${theme.textMuted} uppercase mb-3`}>Protocol</p><ol className="space-y-2">{todayWorkout.prescription.steps.map((step, idx) => <li key={idx} className={`flex gap-3 ${theme.text}`}><span className={`flex-shrink-0 w-6 h-6 rounded-full ${theme.cardAlt} ${theme.textMuted} text-sm flex items-center justify-center`}>{idx + 1}</span>{step}</li>)}</ol></div>}
              {todayWorkout.prescription.options && <div className={`p-4 border-b ${theme.border}`}><p className={`text-xs font-medium ${theme.textMuted} uppercase mb-2`}>Options</p><ul className="space-y-1">{todayWorkout.prescription.options.map((opt, idx) => <li key={idx} className={theme.textMuted}>• {opt}</li>)}</ul></div>}
              {todayWorkout.prescription.notes && <div className={`p-4 border-b ${theme.border}`}><p className={`text-xs font-medium ${theme.textMuted} uppercase mb-2`}>Notes</p><ul className="space-y-1">{(Array.isArray(todayWorkout.prescription.notes) ? todayWorkout.prescription.notes : [todayWorkout.prescription.notes]).map((note, idx) => <li key={idx} className={theme.textMuted}>• {note}</li>)}</ul></div>}
              {todayWorkout.prescription.cooldown && <div className={`p-4 border-b ${theme.border}`}><p className={`text-xs font-medium ${theme.textMuted} uppercase mb-2`}>Cool-down</p><p className={theme.text}>{todayWorkout.prescription.cooldown}</p></div>}
              {todayWorkout.prescription.intensity && <div className={`p-4 ${darkMode ? 'bg-gray-700' : 'bg-slate-800'} text-white`}><p className="text-xs uppercase opacity-70 mb-1">Intensity</p><p className="font-semibold">{todayWorkout.prescription.intensity}</p></div>}
            </div>

            {/* Log Form */}
            <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
              <h3 className={`font-semibold ${theme.text} mb-4`}>Log Workout</h3>
              <div className="space-y-4">
                <div><label className={`block text-sm font-medium ${theme.textMuted} mb-2`}>Duration (min)</label><input type="number" value={workoutData.duration} onChange={(e) => setWorkoutData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))} className={`w-full px-4 py-3 rounded-xl border ${theme.input} focus:border-blue-500 outline-none`} /></div>
                <div><label className={`block text-sm font-medium ${theme.textMuted} mb-2`}>RPE: {workoutData.rpe}/10</label><input type="range" min="1" max="10" value={workoutData.rpe} onChange={(e) => setWorkoutData(prev => ({ ...prev, rpe: parseInt(e.target.value) }))} className="w-full" /></div>
                
                {/* PR Input for strength days */}
                {todayWorkout.type === 'strength' && todayWorkout.prescription.exercises?.some(e => e.prKey) && (
                  <div className={`p-4 ${darkMode ? 'bg-amber-900/20' : 'bg-amber-50'} rounded-xl`}>
                    <p className={`text-xs font-medium ${darkMode ? 'text-amber-400' : 'text-amber-700'} uppercase mb-3`}>Hit a new PR? (optional)</p>
                    <div className="space-y-2">
                      {todayWorkout.prescription.exercises.filter(e => e.prKey).map(ex => (
                        <div key={ex.prKey} className="flex items-center gap-2">
                          <span className={`text-sm ${theme.text} flex-1`}>{PR_DISPLAY_NAMES[ex.prKey]}</span>
                          <input
                            type="number"
                            placeholder={athleteProfile.prs?.[ex.prKey]?.value || 'PR'}
                            value={workoutData.newPRs?.[ex.prKey] || ''}
                            onChange={(e) => setWorkoutData(prev => ({ ...prev, newPRs: { ...prev.newPRs, [ex.prKey]: e.target.value ? Number(e.target.value) : null } }))}
                            className={`w-24 px-2 py-1 rounded ${theme.input} text-right text-sm`}
                          />
                          <span className={`text-xs ${theme.textMuted}`}>lbs</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div><label className={`block text-sm font-medium ${theme.textMuted} mb-2`}>Notes</label><textarea value={workoutData.notes} onChange={(e) => setWorkoutData(prev => ({ ...prev, notes: e.target.value }))} placeholder="How did it feel?" rows={2} className={`w-full px-4 py-3 rounded-xl border ${theme.input} outline-none resize-none`} /></div>
                <button onClick={completeWorkout} className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"><CheckCircle2 size={20} />{todayLog?.completed ? 'Update & Next' : 'Complete & Next Day'}</button>
              </div>
            </div>
          </div>
        )}
        {currentView === 'workout' && !todayWorkout && <div className="p-4"><div className={`${theme.card} rounded-xl shadow-sm p-8 text-center`}><Circle size={48} className={`mx-auto ${theme.textMuted} mb-4`} /><h2 className={`text-xl font-semibold ${theme.text}`}>No Workout</h2><p className={theme.textMuted}>No workout for this day.</p></div></div>}

        {/* PROFILE VIEW */}
        {currentView === 'profile' && (
          <AthleteProfileView profile={athleteProfile} setProfile={setAthleteProfile} theme={theme} darkMode={darkMode} />
        )}

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
                      <CheckCircle2 size={20} className="text-green-500" />
                    </div>
                    <div className={`flex gap-4 mt-2 text-sm ${theme.textMuted}`}>
                      <span>{log.actual}m</span>
                      <span>RPE {log.rpe}</span>
                    </div>
                    {log.prsHit && Object.keys(log.prsHit).length > 0 && (
                      <div className={`mt-2 flex items-center gap-2 text-xs ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                        <Award size={14} />
                        <span>PR: {Object.entries(log.prsHit).filter(([,v]) => v).map(([k, v]) => `${PR_DISPLAY_NAMES[k]} ${v}`).join(', ')}</span>
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
                <div className={`p-3 ${theme.cardAlt} rounded-lg text-center`}>
                  <p className={`text-2xl font-bold ${theme.text}`}>{acuteLoad}</p>
                  <p className={`text-xs ${theme.textMuted}`}>Acute (7d)</p>
                </div>
                <div className={`p-3 ${theme.cardAlt} rounded-lg text-center`}>
                  <p className={`text-2xl font-bold ${theme.text}`}>{chronicLoad}</p>
                  <p className={`text-xs ${theme.textMuted}`}>Chronic (28d avg)</p>
                </div>
                <div className={`p-3 ${theme.cardAlt} rounded-lg text-center`}>
                  <p className={`text-2xl font-bold ${loadRatio !== '-' && loadRatio > 1.5 ? 'text-red-500' : loadRatio !== '-' && loadRatio < 0.8 ? 'text-amber-500' : 'text-green-500'}`}>{loadRatio}</p>
                  <p className={`text-xs ${theme.textMuted}`}>A:C Ratio</p>
                </div>
              </div>
              <p className={`text-xs ${theme.textMuted} mt-3`}>Optimal A:C ratio is 0.8-1.3. Above 1.5 increases injury risk. Below 0.8 may indicate detraining.</p>
            </div>

            {/* Summary Stats */}
            <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
              <h3 className={`font-semibold ${theme.text} mb-4`}>All-Time Summary</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className={`p-3 ${theme.cardAlt} rounded-lg text-center`}><p className={`text-2xl font-bold ${theme.text}`}>{workoutLogs.length}</p><p className={`text-xs ${theme.textMuted}`}>Workouts</p></div>
                <div className={`p-3 ${theme.cardAlt} rounded-lg text-center`}><p className={`text-2xl font-bold ${theme.text}`}>{Math.round(workoutLogs.reduce((s, l) => s + (l.actual || 0), 0) / 60)}</p><p className={`text-xs ${theme.textMuted}`}>Hours</p></div>
                <div className={`p-3 ${theme.cardAlt} rounded-lg text-center`}><p className={`text-2xl font-bold ${theme.text}`}>{workoutLogs.length > 0 ? (workoutLogs.reduce((s, l) => s + (l.rpe || 0), 0) / workoutLogs.length).toFixed(1) : '-'}</p><p className={`text-xs ${theme.textMuted}`}>Avg RPE</p></div>
              </div>
            </div>

            {/* By Type */}
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

            {/* PR History */}
            {athleteProfile.history?.filter(h => h.category === 'prs').length > 0 && (
              <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
                <h3 className={`font-semibold ${theme.text} mb-4`}>PR History</h3>
                <div className="space-y-2">
                  {[...athleteProfile.history].filter(h => h.category === 'prs').reverse().slice(0, 10).map((pr, idx) => (
                    <div key={idx} className={`flex justify-between items-center p-2 ${theme.cardAlt} rounded`}>
                      <div className="flex items-center gap-2">
                        <Award size={16} className={darkMode ? 'text-amber-400' : 'text-amber-600'} />
                        <span className={theme.text}>{PR_DISPLAY_NAMES[pr.key]}</span>
                      </div>
                      <div className={`text-right`}>
                        <span className={`font-mono font-bold ${theme.text}`}>{pr.value} lbs</span>
                        <span className={`text-xs ${theme.textMuted} ml-2`}>{formatDateShort(pr.date)}</span>
                      </div>
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
              <div className={`${theme.card} rounded-xl shadow-sm p-5 border-2 border-dashed ${darkMode ? 'border-gray-600' : 'border-slate-300'}`}>
                <h3 className={`font-semibold ${theme.text} mb-3`}>Import Program</h3>
                <p className={`text-sm ${theme.textMuted} mb-4`}>Upload a JSON file with your training program.</p>
                <label className="block">
                  <span className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${theme.cardAlt} rounded-xl text-sm font-medium ${theme.text} cursor-pointer border ${theme.border}`}>
                    <FileUp size={18} />Select File (.json)
                  </span>
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
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold ${theme.text}`}>{prog.name}</p>
                        {prog.isDefault && <span className={`text-xs px-2 py-0.5 rounded ${theme.cardAlt} ${theme.textMuted}`}>Default</span>}
                      </div>
                      <p className={`text-sm ${theme.textMuted} mt-1`}>{prog.description}</p>
                      <p className={`text-xs ${theme.textSubtle} mt-1`}>{prog.phases?.length || 0} phases</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    {programState.currentProgram === prog.id ? (
                      <span className="flex-1 text-center py-2 text-green-500 font-medium text-sm">Active</span>
                    ) : (
                      <button onClick={() => setProgramState(prev => ({ ...prev, currentProgram: prog.id, currentWeek: 1, currentDay: 1 }))} className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium">Switch</button>
                    )}
                    {!prog.isDefault && (
                      <button onClick={() => deleteProgram(prog.id)} className="px-3 py-2 bg-red-500/10 text-red-500 rounded-lg"><Trash2 size={16} /></button>
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
                <div><h3 className={`font-semibold ${theme.text}`}>Dark Mode</h3><p className={`text-sm ${theme.textMuted}`}>Toggle theme</p></div>
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
                <button onClick={() => setProgramState(prev => ({ ...prev, currentWeek: 1, currentDay: 1 }))} className={`w-full py-2 ${theme.cardAlt} rounded-lg text-sm ${theme.textMuted}`}>Reset to Week 1, Day 1</button>
              </div>
            </div>

            <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
              <h3 className={`font-semibold ${theme.text} mb-4`}>Data</h3>
              <div className="space-y-3">
                <button onClick={exportData} className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${theme.cardAlt} rounded-xl text-sm font-medium ${theme.text}`}><Download size={18} />Export All Data</button>
                <label className="block"><span className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${theme.cardAlt} rounded-xl text-sm font-medium ${theme.text} cursor-pointer`}><Upload size={18} />Import Data</span><input type="file" accept=".json" onChange={importData} className="hidden" /></label>
                <button onClick={() => { if (confirm('Clear all logs?')) setWorkoutLogs([]); }} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 rounded-xl text-sm font-medium text-red-500"><Trash2 size={18} />Clear Logs</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 ${theme.nav} border-t px-4 py-2 safe-area-pb`}>
        <div className="max-w-2xl mx-auto flex justify-around">
          {[
            { id: 'dashboard', icon: Home, label: 'Home' }, 
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
