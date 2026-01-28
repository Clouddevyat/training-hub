import React, { useState, useEffect } from 'react';
import { 
  Calendar, Dumbbell, TrendingUp, CheckCircle2, Circle, ChevronRight, 
  ChevronLeft, Play, Clock, Flame, Target, Menu, X, Download, Upload,
  Settings, Activity, Mountain, Home, BarChart3, Trash2, Moon, Sun, Plus, FileUp
} from 'lucide-react';

// ============== DEFAULT PROGRAM DATA ==============
const DEFAULT_PROGRAMS = {
  combatAlpinist: {
    id: 'combatAlpinist',
    name: 'Combat Alpinist',
    description: 'Integrated protocol for physical capacity, technical mastery, and mountain experience',
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
            day: 1,
            dayName: 'Day 1',
            session: 'Strength A',
            type: 'strength',
            duration: 60,
            prescription: {
              warmup: '10 min easy cardio + dynamic stretching',
              exercises: [
                { name: 'Trap Bar Deadlift', sets: 4, reps: '3-5', rest: '3 min', notes: '85% 1RM' },
                { name: 'Box Step-Up (each leg)', sets: 4, reps: '3-5', rest: '3 min', notes: '70-80 lb DB' },
                { name: 'Weighted Pull-Up', sets: 4, reps: '3-5', rest: '3 min', notes: '+60 lbs target' },
                { name: 'Dip', sets: 4, reps: '3-5', rest: '3 min', notes: '+60 lbs target' }
              ],
              cooldown: '5 min walk + static stretching',
              intensity: '85% 1RM - leave 1-2 reps in tank'
            }
          },
          {
            day: 2,
            dayName: 'Day 2',
            session: 'Zone 2 Run',
            type: 'cardio',
            duration: 70,
            prescription: {
              description: 'Easy conversational pace on flat to rolling terrain',
              notes: ['Should be able to hold full conversation', 'Nasal breathing preferred', 'If HR drifts above Zone 2, slow down'],
              intensity: 'Zone 2 (60-70% Max HR)'
            }
          },
          {
            day: 3,
            dayName: 'Day 3',
            session: 'Zone 2 + Mobility',
            type: 'cardio',
            duration: 55,
            prescription: {
              description: '30-40 min easy aerobic + 15-20 min mobility',
              exercises: [
                { name: 'Pigeon Pose', duration: '2 min each side' },
                { name: 'Cat-Cow', reps: 20 },
                { name: 'Thread the Needle', reps: '10 each side' },
                { name: "Child's Pose", duration: '2 min' },
                { name: "World's Greatest Stretch", reps: '5 each side' }
              ],
              intensity: 'Zone 1-2 (50-70% Max HR)'
            }
          },
          {
            day: 4,
            dayName: 'Day 4',
            session: 'Threshold Intervals',
            type: 'cardio',
            duration: 45,
            prescription: {
              warmup: '10 min easy jog building to moderate',
              mainSet: '4 x 8 min at Aerobic Threshold',
              recovery: '2 min easy jog between intervals',
              cooldown: '5-10 min easy jog',
              intensity: 'Zone 3-4 (70-85% Max HR)',
              notes: ['Comfortably hard - can speak in short sentences']
            }
          },
          {
            day: 5,
            dayName: 'Day 5',
            session: 'Strength B',
            type: 'strength',
            duration: 60,
            prescription: {
              warmup: '10 min easy cardio + dynamic stretching',
              exercises: [
                { name: 'Trap Bar Deadlift', sets: 4, reps: '3-5', rest: '3 min', notes: '85% 1RM' },
                { name: 'Box Step-Up (each leg)', sets: 4, reps: '3-5', rest: '3 min', notes: '70-80 lb DB' },
                { name: 'Weighted Pull-Up', sets: 4, reps: '3-5', rest: '3 min', notes: '+60 lbs target' },
                { name: 'Dip', sets: 4, reps: '3-5', rest: '3 min', notes: '+60 lbs target' }
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
            day: 6,
            dayName: 'Day 6',
            session: 'Long Aerobic',
            type: 'long_effort',
            duration: 150,
            prescription: {
              description: 'Long Zone 1-2 effort',
              options: ['Long hike (unloaded or <10 lbs)', 'Long run on trails', 'Combination run/hike'],
              nutrition: '30-60g carbs/hour after first hour',
              hydration: '16-24 oz/hour',
              intensity: 'Zone 1-2 (50-70% Max HR)',
              progression: { 'Weeks 1-4': '2 hours', 'Weeks 5-8': '2.5 hours', 'Weeks 9-12': '2.5-3 hours', 'Weeks 13-16': '3+ hours' }
            }
          },
          {
            day: 7,
            dayName: 'Day 7',
            session: 'Active Recovery',
            type: 'recovery',
            duration: 30,
            prescription: {
              description: 'Very easy movement to promote recovery',
              options: ['Easy walk', 'Light yoga/stretching', 'Swimming (easy)', 'Foam rolling + mobility'],
              intensity: 'Zone 1 (50-60% Max HR) or complete rest',
              notes: ['This is NOT a workout', 'If feeling fatigued, take complete rest']
            }
          }
        ],
        benchmarks: [
          { name: 'AeT HR Drift', target: '<5% over 60 min' },
          { name: '5-Mile Run', target: '<36:00' },
          { name: 'Strength Floor', target: 'No lifts drop >5%' }
        ]
      },
      {
        id: 'conversion',
        name: 'Conversion',
        weeks: [17, 28],
        description: 'Convert strength to muscular endurance. The crux.',
        weeklyTemplate: [
          { day: 1, dayName: 'Day 1', session: 'Strength (Reduced)', type: 'strength', duration: 45, prescription: { warmup: '10 min easy cardio + dynamic stretching', exercises: [ { name: 'Trap Bar Deadlift', sets: 3, reps: '3-5', rest: '3 min', notes: '85% 1RM' }, { name: 'Box Step-Up (each leg)', sets: 3, reps: '3-5', rest: '3 min', notes: 'Heavy DB' }, { name: 'Weighted Pull-Up', sets: 3, reps: '3-5', rest: '3 min', notes: '+60 lbs' }, { name: 'Dip', sets: 3, reps: '3-5', rest: '3 min', notes: '+60 lbs' } ], intensity: 'Maintenance only - not pushing PRs' } },
          { day: 2, dayName: 'Day 2', session: 'Zone 2 Run', type: 'cardio', duration: 60, prescription: { description: 'Easy recovery-pace run', intensity: 'Zone 2 (60-70% Max HR)', notes: ['Recovery from ME work', 'Keep it truly easy'] } },
          { day: 3, dayName: 'Day 3', session: 'Gym ME Session', type: 'muscular_endurance', duration: 70, prescription: { warmup: '10 min easy cardio', description: 'Continuous circuit, minimal rest', exercises: [ { name: 'Box Step-Up', notes: '75% knee height' }, { name: 'Walking Lunge', notes: 'Continuous' }, { name: 'Split Squat', notes: 'Alternating' }, { name: 'Heel Touch', notes: 'Eccentric focus' } ], tempo: '1 rep every 2 seconds', progression: { 'Weeks 17-20': 'Bodyweight, 400 total steps', 'Weeks 21-24': '+10% BW (22 lbs), 500 steps', 'Weeks 25-28': '+20% BW (45 lbs), 600 steps' } } },
          { day: 4, dayName: 'Day 4', session: 'Zone 2 + Mobility', type: 'cardio', duration: 45, prescription: { description: '30 min easy aerobic + 15 min mobility', intensity: 'Zone 1-2' } },
          { day: 5, dayName: 'Day 5', session: 'Threshold Intervals', type: 'cardio', duration: 45, prescription: { warmup: '10 min building effort', mainSet: '5 x 6 min at tempo', recovery: '2 min easy jog', cooldown: '5-10 min easy', intensity: 'Zone 3-4' } },
          { day: 6, dayName: 'Day 6', session: 'Outdoor ME (Water Jug)', type: 'muscular_endurance', duration: 90, prescription: { description: 'THE WATER JUG PROTOCOL', steps: ['Fill pack with water jugs to target weight', 'Find steep terrain (30%+ grade) or stairmaster at 15%+', 'Hike continuously uphill for 60-90 min', 'At the top: DUMP THE WATER', 'Descend with empty pack'], why: 'Spares knees from eccentric damage, allows higher training frequency', progression: { 'Weeks 17-20': '34 lbs (15% BW), 60 min', 'Weeks 21-24': '45 lbs (20% BW), 75 min', 'Weeks 25-28': '56 lbs (25% BW), 90 min' }, intensity: 'Zone 2-3 HR' } },
          { day: 7, dayName: 'Day 7', session: 'Active Recovery', type: 'recovery', duration: 30, prescription: { description: 'Very easy movement or complete rest', intensity: 'Zone 1 or rest' } }
        ],
        benchmarks: [ { name: 'Gym ME', target: '600 steps @ 20% BW' }, { name: '5-Mile Run', target: '<34:00' }, { name: 'AeT/AnT Gap', target: 'Within 12%' } ]
      },
      {
        id: 'specificity',
        name: 'Specificity',
        weeks: [29, 40],
        description: 'Expedition simulation. Back-to-back efforts, peak loads.',
        weeklyTemplate: [
          { day: 1, dayName: 'Day 1', session: 'Strength (Minimal)', type: 'strength', duration: 40, prescription: { exercises: [ { name: 'Trap Bar Deadlift', sets: 3, reps: '3-5', rest: '3 min' }, { name: 'Weighted Pull-Up', sets: 3, reps: '3-5', rest: '3 min' }, { name: 'Box Step-Up or Dip', sets: 3, reps: '3-5', rest: '3 min' } ], intensity: '80-85% 1RM - maintaining only' } },
          { day: 2, dayName: 'Day 2', session: 'Zone 2 Run', type: 'cardio', duration: 55, prescription: { description: 'Easy recovery run', intensity: 'Zone 2', notes: ['Active recovery from weekend sawtooth'] } },
          { day: 3, dayName: 'Day 3', session: 'Peak ME Session', type: 'muscular_endurance', duration: 75, prescription: { description: 'Continuous circuit at peak load', target: '800-1000 total steps at 25% BW (56 lbs)', tempo: '1 step every 2 seconds', notes: ['This is HARD', 'Maintain form under fatigue'] } },
          { day: 4, dayName: 'Day 4', session: 'Off or Mobility', type: 'recovery', duration: 30, prescription: { description: 'TRUE RECOVERY DAY', options: ['Complete rest', 'Light mobility only', 'Foam rolling'], notes: ['Do NOT train', 'You need this for the weekend sawtooth'] } },
          { day: 5, dayName: 'Day 5', session: 'Tempo Run', type: 'cardio', duration: 45, prescription: { warmup: '10 min building', mainSet: '3 x 1 mile at 6:24/mile pace', recovery: '2-3 min jog between', cooldown: '10 min easy', intensity: 'Goal 5-mile pace' } },
          { day: 6, dayName: 'Day 6', session: 'Sawtooth Day 1', type: 'long_effort', duration: 300, prescription: { description: 'LONG LOADED EFFORT', load: '56-67 lbs (25-30% BW)', duration: '4-6 hours', terrain: 'Hilly/mountainous or stairmaster', benchmark: '1000 vertical feet/hour at 25% BW, HR in Zone 2', nutrition: '60-90g carbs/hour after first hour', hydration: '16-24 oz/hour' } },
          { day: 7, dayName: 'Day 7', session: 'Sawtooth Day 2', type: 'long_effort', duration: 150, prescription: { description: 'MODERATE AEROBIC (BACK-TO-BACK)', load: '15% BW or unloaded', duration: '2-3 hours', purpose: 'Train fatigue resistance on tired legs', intensity: 'Zone 1-2, recovery pace' } }
        ],
        benchmarks: [ { name: 'Vertical Rate', target: '1000 ft/hr @ 25% BW in Zone 2' }, { name: '5-Mile Run', target: '<32:00' }, { name: 'AeT/AnT Gap', target: 'Within 10%' } ]
      }
    ]
  }
};

// ============== STORAGE HOOKS ==============
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

// ============== UTILITY FUNCTIONS ==============
const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
const getTypeBorder = (type) => ({ strength: 'border-red-500', cardio: 'border-blue-500', muscular_endurance: 'border-orange-500', recovery: 'border-green-500', long_effort: 'border-purple-500' }[type] || 'border-gray-500');
const getTypeIcon = (type) => ({ strength: Dumbbell, cardio: Activity, muscular_endurance: Flame, recovery: Circle, long_effort: Mountain }[type] || Circle);

// ============== MAIN APP COMPONENT ==============
export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useLocalStorage('trainingHub_darkMode', window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [customPrograms, setCustomPrograms] = useLocalStorage('trainingHub_customPrograms', {});
  const [programState, setProgramState] = useLocalStorage('trainingHub_programState', { 
    currentProgram: 'combatAlpinist', 
    currentWeek: 1, 
    currentDay: 1,
    startDate: new Date().toISOString().split('T')[0]
  });
  const [workoutLogs, setWorkoutLogs] = useLocalStorage('trainingHub_workoutLogs', []);
  const [exerciseCompletion, setExerciseCompletion] = useState({});
  const [workoutData, setWorkoutData] = useState({ duration: 0, rpe: 5, notes: '' });
  const [showProgramUpload, setShowProgramUpload] = useState(false);

  // Merge default and custom programs
  const allPrograms = { ...DEFAULT_PROGRAMS, ...customPrograms };
  const program = allPrograms[programState.currentProgram];
  const phase = program?.phases.find(p => programState.currentWeek >= p.weeks[0] && programState.currentWeek <= p.weeks[1]);
  const todayWorkout = phase?.weeklyTemplate.find(w => w.day === programState.currentDay);

  useEffect(() => { if (todayWorkout) setWorkoutData(prev => ({ ...prev, duration: todayWorkout.duration })); }, [todayWorkout?.session]);

  // Get logs for current week
  const thisWeekLogs = workoutLogs.filter(log => log.week === programState.currentWeek && log.programId === programState.currentProgram);
  const completedThisWeek = thisWeekLogs.filter(log => log.completed).length;
  const toggleExercise = (name) => setExerciseCompletion(prev => ({ ...prev, [name]: !prev[name] }));

  const advanceDay = () => {
    if (programState.currentDay >= 7) {
      // Move to next week
      const maxWeek = program?.phases[program.phases.length - 1]?.weeks[1] || 40;
      setProgramState(prev => ({
        ...prev,
        currentDay: 1,
        currentWeek: Math.min(prev.currentWeek + 1, maxWeek)
      }));
    } else {
      setProgramState(prev => ({ ...prev, currentDay: prev.currentDay + 1 }));
    }
  };

  const completeWorkout = () => {
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
      completed: true 
    };
    setWorkoutLogs(prev => [...prev.filter(log => !(log.date === newLog.date && log.session === newLog.session && log.programId === newLog.programId)), newLog]);
    setExerciseCompletion({});
    setWorkoutData({ duration: todayWorkout?.duration || 0, rpe: 5, notes: '' });
    advanceDay();
  };

  const exportData = () => {
    const data = { programState, workoutLogs, customPrograms, darkMode, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `training-hub-export-${new Date().toISOString().split('T')[0]}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result);
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
            alert('Invalid program format. Required fields: id, name, phases');
            return;
          }
          // Ensure unique ID
          const newId = programData.id + '_' + Date.now();
          const newProgram = { ...programData, id: newId, isDefault: false };
          setCustomPrograms(prev => ({ ...prev, [newId]: newProgram }));
          alert(`Program "${programData.name}" imported successfully!`);
          setShowProgramUpload(false);
        } catch (err) { 
          alert('Error importing program. Make sure it\'s valid JSON.'); 
        }
      };
      reader.readAsText(file);
    }
  };

  const deleteProgram = (programId) => {
    if (allPrograms[programId]?.isDefault) {
      alert('Cannot delete default programs.');
      return;
    }
    if (confirm(`Delete "${allPrograms[programId]?.name}"? This cannot be undone.`)) {
      setCustomPrograms(prev => {
        const updated = { ...prev };
        delete updated[programId];
        return updated;
      });
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
              {[{ id: 'dashboard', label: 'Dashboard', icon: Home }, { id: 'workout', label: "Today's Workout", icon: Play }, { id: 'log', label: 'Workout Log', icon: Calendar }, { id: 'progress', label: 'Progress', icon: TrendingUp }, { id: 'programs', label: 'Programs', icon: FileUp }, { id: 'settings', label: 'Settings', icon: Settings }].map(({ id, label, icon: Icon }) => (
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
            <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className={`text-xs ${theme.textMuted} uppercase tracking-wide`}>Current Program</p>
                  <h2 className={`text-xl font-bold ${theme.text}`}>{program?.name}</h2>
                </div>
                <span className="text-4xl">{program?.icon}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className={`text-center p-3 ${theme.cardAlt} rounded-xl`}>
                  <p className={`text-2xl font-bold ${theme.text}`}>{programState.currentWeek}</p>
                  <p className={`text-xs ${theme.textMuted} uppercase`}>Week</p>
                </div>
                <div className={`text-center p-3 ${theme.cardAlt} rounded-xl`}>
                  <p className={`text-2xl font-bold ${theme.text}`}>{programState.currentDay}</p>
                  <p className={`text-xs ${theme.textMuted} uppercase`}>Day</p>
                </div>
                <div className={`text-center p-3 ${theme.cardAlt} rounded-xl`}>
                  <p className={`text-xl font-bold ${theme.text}`}>{phase?.name?.slice(0,5)}</p>
                  <p className={`text-xs ${theme.textMuted} uppercase`}>Phase</p>
                </div>
                <div className={`text-center p-3 ${theme.cardAlt} rounded-xl`}>
                  <p className={`text-2xl font-bold ${theme.text}`}>{completedThisWeek}/7</p>
                  <p className={`text-xs ${theme.textMuted} uppercase`}>Done</p>
                </div>
              </div>
            </div>
            {todayWorkout && (
              <button onClick={() => setCurrentView('workout')} className={`w-full text-left rounded-xl shadow-sm p-5 border-l-4 ${getTypeBorder(todayWorkout.type)} ${theme.card} hover:shadow-md transition-shadow`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs ${theme.textMuted} uppercase tracking-wide`}>Day {programState.currentDay} Workout</p>
                    <h3 className={`text-xl font-bold ${theme.text} mt-1`}>{todayWorkout.session}</h3>
                    <div className={`flex items-center gap-3 mt-2 text-sm ${theme.textMuted}`}>
                      <span className="flex items-center gap-1"><Clock size={14} />{todayWorkout.duration} min</span>
                      <span className={`px-2 py-0.5 rounded text-xs text-white ${getTypeColor(todayWorkout.type, darkMode)}`}>{todayWorkout.type.replace('_', ' ')}</span>
                      {todayLog?.completed && <span className="flex items-center gap-1 text-green-500 font-medium"><CheckCircle2 size={14} />Done</span>}
                    </div>
                  </div>
                  <ChevronRight size={24} className={theme.textSubtle} />
                </div>
              </button>
            )}
            <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
              <h3 className={`font-semibold ${theme.text} mb-4`}>This Week</h3>
              <div className="space-y-2">
                {phase?.weeklyTemplate.map((workout, idx) => {
                  const isCurrent = workout.day === programState.currentDay;
                  const logged = thisWeekLogs.find(l => l.day === workout.day && l.completed);
                  return (
                    <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isCurrent ? (darkMode ? 'bg-blue-900/50 border border-blue-700' : 'bg-blue-50 border border-blue-200') : theme.cardAlt}`}>
                      {logged ? <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" /> : <Circle size={20} className={`${theme.textSubtle} flex-shrink-0`} />}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${theme.text} truncate`}>{workout.session}</p>
                        <p className={`text-xs ${theme.textMuted}`}>Day {workout.day}</p>
                      </div>
                      <span className={`text-sm ${theme.textSubtle}`}>{workout.duration}m</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
              <h3 className={`font-semibold ${theme.text} mb-4`}>Phase Benchmarks</h3>
              <div className="space-y-3">
                {phase?.benchmarks.map((b, idx) => (
                  <div key={idx} className={`flex justify-between items-center p-3 ${theme.cardAlt} rounded-xl`}>
                    <span className={theme.text}>{b.name}</span>
                    <span className={`font-mono text-sm ${theme.textMuted} ${darkMode ? 'bg-gray-600' : 'bg-white'} px-2 py-1 rounded`}>{b.target}</span>
                  </div>
                ))}
              </div>
            </div>
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
            <div className={`${theme.card} rounded-xl shadow-sm overflow-hidden`}>
              {todayWorkout.prescription.warmup && <div className={`p-4 border-b ${theme.border}`}><p className={`text-xs font-medium ${theme.textMuted} uppercase mb-2`}>Warm-up</p><p className={theme.text}>{todayWorkout.prescription.warmup}</p></div>}
              {todayWorkout.prescription.description && <div className={`p-4 border-b ${theme.border}`}><p className={`text-xs font-medium ${theme.textMuted} uppercase mb-2`}>Overview</p><p className={theme.text}>{todayWorkout.prescription.description}</p></div>}
              {todayWorkout.prescription.mainSet && <div className={`p-4 border-b ${theme.border} ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}><p className="text-xs font-medium text-blue-500 uppercase mb-2">Main Set</p><p className={`text-lg font-semibold ${theme.text}`}>{todayWorkout.prescription.mainSet}</p>{todayWorkout.prescription.recovery && <p className={`${theme.textMuted} mt-1`}>Recovery: {todayWorkout.prescription.recovery}</p>}</div>}
              {todayWorkout.prescription.exercises && (
                <div className={`p-4 border-b ${theme.border}`}>
                  <p className={`text-xs font-medium ${theme.textMuted} uppercase mb-3`}>Exercises</p>
                  <div className="space-y-2">
                    {todayWorkout.prescription.exercises.map((ex, idx) => (
                      <button key={idx} onClick={() => toggleExercise(ex.name)} className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${exerciseCompletion[ex.name] ? 'bg-green-500/20 border-green-500' : `${theme.cardAlt} ${darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-slate-200 hover:border-slate-300'}`}`}>
                        {exerciseCompletion[ex.name] ? <CheckCircle2 size={24} className="text-green-500 flex-shrink-0" /> : <Circle size={24} className={`${theme.textSubtle} flex-shrink-0`} />}
                        <div className="flex-1">
                          <p className={`font-medium ${theme.text}`}>{ex.name}</p>
                          <div className={`flex flex-wrap gap-x-4 gap-y-1 text-sm ${theme.textMuted} mt-1`}>
                            {ex.sets && <span>{ex.sets} sets</span>}{ex.reps && <span>× {ex.reps}</span>}{ex.duration && <span>{ex.duration}</span>}{ex.rest && <span className={theme.textSubtle}>Rest: {ex.rest}</span>}
                          </div>
                          {ex.notes && <p className="text-sm text-blue-500 mt-1">{ex.notes}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {todayWorkout.prescription.progression && <div className={`p-4 border-b ${theme.border} ${darkMode ? 'bg-amber-900/30' : 'bg-amber-50'}`}><p className={`text-xs font-medium ${darkMode ? 'text-amber-400' : 'text-amber-700'} uppercase mb-2`}>Progression</p><div className="space-y-1">{Object.entries(todayWorkout.prescription.progression).map(([k, v]) => <div key={k} className="flex justify-between text-sm"><span className={theme.textMuted}>{k}</span><span className={`font-medium ${theme.text}`}>{v}</span></div>)}</div></div>}
              {todayWorkout.prescription.steps && <div className={`p-4 border-b ${theme.border}`}><p className={`text-xs font-medium ${theme.textMuted} uppercase mb-3`}>Protocol</p><ol className="space-y-2">{todayWorkout.prescription.steps.map((step, idx) => <li key={idx} className={`flex gap-3 ${theme.text}`}><span className={`flex-shrink-0 w-6 h-6 rounded-full ${theme.cardAlt} ${theme.textMuted} text-sm flex items-center justify-center`}>{idx + 1}</span>{step}</li>)}</ol></div>}
              {todayWorkout.prescription.options && <div className={`p-4 border-b ${theme.border}`}><p className={`text-xs font-medium ${theme.textMuted} uppercase mb-2`}>Options</p><ul className="space-y-1">{todayWorkout.prescription.options.map((opt, idx) => <li key={idx} className={theme.textMuted}>• {opt}</li>)}</ul></div>}
              {todayWorkout.prescription.notes && <div className={`p-4 border-b ${theme.border}`}><p className={`text-xs font-medium ${theme.textMuted} uppercase mb-2`}>Notes</p><ul className="space-y-1">{(Array.isArray(todayWorkout.prescription.notes) ? todayWorkout.prescription.notes : [todayWorkout.prescription.notes]).map((note, idx) => <li key={idx} className={theme.textMuted}>• {note}</li>)}</ul></div>}
              {todayWorkout.prescription.cooldown && <div className={`p-4 border-b ${theme.border}`}><p className={`text-xs font-medium ${theme.textMuted} uppercase mb-2`}>Cool-down</p><p className={theme.text}>{todayWorkout.prescription.cooldown}</p></div>}
              {todayWorkout.prescription.intensity && <div className={`p-4 ${darkMode ? 'bg-gray-700' : 'bg-slate-800'} text-white`}><p className="text-xs uppercase opacity-70 mb-1">Intensity</p><p className="font-semibold">{todayWorkout.prescription.intensity}</p></div>}
            </div>
            <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
              <h3 className={`font-semibold ${theme.text} mb-4`}>Log Workout</h3>
              <div className="space-y-4">
                <div><label className={`block text-sm font-medium ${theme.textMuted} mb-2`}>Actual Duration (min)</label><input type="number" value={workoutData.duration} onChange={(e) => setWorkoutData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))} className={`w-full px-4 py-3 rounded-xl border ${theme.input} focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none`} /></div>
                <div><label className={`block text-sm font-medium ${theme.textMuted} mb-2`}>RPE (1-10): {workoutData.rpe}</label><input type="range" min="1" max="10" value={workoutData.rpe} onChange={(e) => setWorkoutData(prev => ({ ...prev, rpe: parseInt(e.target.value) }))} className="w-full" /><div className={`flex justify-between text-xs ${theme.textSubtle} mt-1`}><span>Easy</span><span>Moderate</span><span>Max Effort</span></div></div>
                <div><label className={`block text-sm font-medium ${theme.textMuted} mb-2`}>Notes</label><textarea value={workoutData.notes} onChange={(e) => setWorkoutData(prev => ({ ...prev, notes: e.target.value }))} placeholder="How did it feel? Any modifications?" rows={3} className={`w-full px-4 py-3 rounded-xl border ${theme.input} focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none`} /></div>
                <button onClick={completeWorkout} className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"><CheckCircle2 size={20} />{todayLog?.completed ? 'Update & Advance' : 'Complete & Next Day'}</button>
              </div>
            </div>
          </div>
        )}
        {currentView === 'workout' && !todayWorkout && <div className="p-4"><div className={`${theme.card} rounded-xl shadow-sm p-8 text-center`}><Circle size={48} className={`mx-auto ${theme.textSubtle} mb-4`} /><h2 className={`text-xl font-semibold ${theme.text}`}>No Workout</h2><p className={`${theme.textMuted} mt-2`}>No workout found for this day.</p></div></div>}

        {/* LOG VIEW */}
        {currentView === 'log' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between"><h2 className={`text-xl font-bold ${theme.text}`}>Workout History</h2><span className={`text-sm ${theme.textMuted}`}>{workoutLogs.length} logged</span></div>
            {workoutLogs.length === 0 ? <div className={`${theme.card} rounded-xl shadow-sm p-8 text-center`}><Calendar size={48} className={`mx-auto ${theme.textSubtle} mb-4`} /><p className={theme.textMuted}>No workouts logged yet.</p><p className={`text-sm ${theme.textSubtle} mt-1`}>Complete your first workout to see it here.</p></div> : (
              <div className="space-y-3">
                {[...workoutLogs].reverse().map(log => (
                  <div key={log.id} className={`${theme.card} rounded-xl shadow-sm p-4 border-l-4 ${getTypeBorder(log.type)}`}>
                    <div className="flex items-center justify-between"><div><p className={`font-semibold ${theme.text}`}>{log.session}</p><p className={`text-sm ${theme.textMuted}`}>{formatDate(log.date)} • Week {log.week}, Day {log.day}</p></div><CheckCircle2 size={20} className="text-green-500" /></div>
                    <div className={`flex gap-4 mt-2 text-sm ${theme.textMuted}`}><span>Duration: {log.actual}m</span><span>RPE: {log.rpe}/10</span></div>
                    {log.notes && <p className={`mt-2 text-sm ${theme.textMuted} ${theme.cardAlt} rounded-lg p-2`}>{log.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROGRESS VIEW */}
        {currentView === 'progress' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between"><h2 className={`text-xl font-bold ${theme.text}`}>Progress</h2><button onClick={exportData} className={`flex items-center gap-2 px-3 py-2 ${theme.cardAlt} hover:opacity-80 rounded-lg text-sm font-medium ${theme.text} transition-colors`}><Download size={16} />Export</button></div>
            <div className="grid grid-cols-3 gap-3">
              <div className={`${theme.card} rounded-xl shadow-sm p-4 text-center`}><p className={`text-3xl font-bold ${theme.text}`}>{workoutLogs.length}</p><p className={`text-sm ${theme.textMuted}`}>Workouts</p></div>
              <div className={`${theme.card} rounded-xl shadow-sm p-4 text-center`}><p className={`text-3xl font-bold ${theme.text}`}>{Math.round(workoutLogs.reduce((s, l) => s + (l.actual || 0), 0) / 60)}</p><p className={`text-sm ${theme.textMuted}`}>Hours</p></div>
              <div className={`${theme.card} rounded-xl shadow-sm p-4 text-center`}><p className={`text-3xl font-bold ${theme.text}`}>{workoutLogs.length > 0 ? (workoutLogs.reduce((s, l) => s + (l.rpe || 0), 0) / workoutLogs.length).toFixed(1) : '-'}</p><p className={`text-sm ${theme.textMuted}`}>Avg RPE</p></div>
            </div>
            <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
              <h3 className={`font-semibold ${theme.text} mb-4`}>By Type</h3>
              {workoutLogs.length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(workoutLogs.reduce((acc, log) => { acc[log.type] = (acc[log.type] || 0) + 1; return acc; }, {})).map(([type, count]) => (
                    <div key={type} className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${getTypeColor(type, darkMode)} flex items-center justify-center`}>{React.createElement(getTypeIcon(type), { size: 20, className: 'text-white' })}</div>
                      <div className="flex-1"><div className="flex justify-between text-sm mb-1"><span className={`capitalize ${theme.text}`}>{type.replace('_', ' ')}</span><span className={theme.textMuted}>{count}</span></div><div className={`h-2 ${theme.cardAlt} rounded-full overflow-hidden`}><div className={`h-full ${getTypeColor(type, darkMode)}`} style={{ width: `${(count / workoutLogs.length) * 100}%` }} /></div></div>
                    </div>
                  ))}
                </div>
              ) : <p className={`${theme.textSubtle} text-center py-4`}>No data yet</p>}
            </div>
          </div>
        )}

        {/* PROGRAMS VIEW */}
        {currentView === 'programs' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-bold ${theme.text}`}>Programs</h2>
              <button onClick={() => setShowProgramUpload(true)} className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium text-white transition-colors">
                <Plus size={16} />Add Program
              </button>
            </div>

            {showProgramUpload && (
              <div className={`${theme.card} rounded-xl shadow-sm p-5 border-2 border-dashed ${darkMode ? 'border-gray-600' : 'border-slate-300'}`}>
                <h3 className={`font-semibold ${theme.text} mb-3`}>Import Training Program</h3>
                <p className={`text-sm ${theme.textMuted} mb-4`}>Upload a JSON file with your training program. Required fields: id, name, icon, phases (with weeklyTemplate).</p>
                <label className="block">
                  <span className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${theme.cardAlt} hover:opacity-80 rounded-xl text-sm font-medium ${theme.text} transition-colors cursor-pointer border ${theme.border}`}>
                    <FileUp size={18} />Select Program File (.json)
                  </span>
                  <input type="file" accept=".json" onChange={importProgram} className="hidden" />
                </label>
                <button onClick={() => setShowProgramUpload(false)} className={`w-full mt-3 text-sm ${theme.textMuted} hover:${theme.text}`}>Cancel</button>
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
                        {prog.isDefault && <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-gray-600' : 'bg-slate-200'} ${theme.textMuted}`}>Default</span>}
                      </div>
                      <p className={`text-sm ${theme.textMuted} mt-1`}>{prog.description}</p>
                      <p className={`text-xs ${theme.textSubtle} mt-1`}>{prog.phases?.length || 0} phases • {prog.phases?.reduce((sum, p) => sum + (p.weeks[1] - p.weeks[0] + 1), 0) || 0} weeks</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    {programState.currentProgram === prog.id ? (
                      <span className="flex-1 text-center py-2 text-green-500 font-medium text-sm">Active</span>
                    ) : (
                      <button onClick={() => setProgramState(prev => ({ ...prev, currentProgram: prog.id, currentWeek: 1, currentDay: 1 }))} className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
                        Switch to This
                      </button>
                    )}
                    {!prog.isDefault && (
                      <button onClick={() => deleteProgram(prog.id)} className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
              <h3 className={`font-semibold ${theme.text} mb-3`}>Program JSON Format</h3>
              <pre className={`text-xs ${theme.textMuted} ${theme.cardAlt} p-3 rounded-lg overflow-x-auto`}>{`{
  "id": "myProgram",
  "name": "My Program",
  "description": "Description here",
  "icon": "🏃",
  "phases": [{
    "id": "phase1",
    "name": "Phase 1",
    "weeks": [1, 4],
    "description": "Phase description",
    "weeklyTemplate": [{
      "day": 1,
      "dayName": "Day 1",
      "session": "Workout Name",
      "type": "strength|cardio|recovery",
      "duration": 60,
      "prescription": { ... }
    }],
    "benchmarks": [{ "name": "...", "target": "..." }]
  }]
}`}</pre>
            </div>
          </div>
        )}

        {/* SETTINGS VIEW */}
        {currentView === 'settings' && (
          <div className="p-4 space-y-4">
            <h2 className={`text-xl font-bold ${theme.text}`}>Settings</h2>
            
            {/* Dark Mode Toggle */}
            <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-semibold ${theme.text}`}>Dark Mode</h3>
                  <p className={`text-sm ${theme.textMuted} mt-1`}>Toggle dark/light theme</p>
                </div>
                <button onClick={() => setDarkMode(!darkMode)} className={`w-14 h-8 rounded-full transition-colors ${darkMode ? 'bg-blue-500' : 'bg-slate-300'} relative`}>
                  <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${darkMode ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            {/* Week/Day Navigation */}
            <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
              <h3 className={`font-semibold ${theme.text} mb-4`}>Current Position</h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm ${theme.textMuted} mb-2`}>Week</label>
                  <div className="flex items-center justify-center gap-4">
                    <button onClick={() => setProgramState(prev => ({ ...prev, currentWeek: Math.max(1, prev.currentWeek - 1) }))} className={`p-2 rounded-lg ${theme.cardAlt} hover:opacity-80`}><ChevronLeft size={20} className={theme.text} /></button>
                    <span className={`text-2xl font-bold ${theme.text} w-16 text-center`}>{programState.currentWeek}</span>
                    <button onClick={() => setProgramState(prev => ({ ...prev, currentWeek: Math.min(40, prev.currentWeek + 1) }))} className={`p-2 rounded-lg ${theme.cardAlt} hover:opacity-80`}><ChevronRight size={20} className={theme.text} /></button>
                  </div>
                </div>
                <div>
                  <label className={`block text-sm ${theme.textMuted} mb-2`}>Day (1-7)</label>
                  <div className="flex items-center justify-center gap-4">
                    <button onClick={() => setProgramState(prev => ({ ...prev, currentDay: Math.max(1, prev.currentDay - 1) }))} className={`p-2 rounded-lg ${theme.cardAlt} hover:opacity-80`}><ChevronLeft size={20} className={theme.text} /></button>
                    <span className={`text-2xl font-bold ${theme.text} w-16 text-center`}>{programState.currentDay}</span>
                    <button onClick={() => setProgramState(prev => ({ ...prev, currentDay: Math.min(7, prev.currentDay + 1) }))} className={`p-2 rounded-lg ${theme.cardAlt} hover:opacity-80`}><ChevronRight size={20} className={theme.text} /></button>
                  </div>
                </div>
                <button onClick={() => setProgramState(prev => ({ ...prev, currentWeek: 1, currentDay: 1 }))} className={`w-full py-2 ${theme.cardAlt} hover:opacity-80 rounded-lg text-sm ${theme.textMuted}`}>
                  Reset to Week 1, Day 1
                </button>
              </div>
            </div>

            {/* Data Management */}
            <div className={`${theme.card} rounded-xl shadow-sm p-5`}>
              <h3 className={`font-semibold ${theme.text} mb-4`}>Data Management</h3>
              <div className="space-y-3">
                <button onClick={exportData} className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${theme.cardAlt} hover:opacity-80 rounded-xl text-sm font-medium ${theme.text} transition-colors`}><Download size={18} />Export All Data</button>
                <label className="block"><span className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${theme.cardAlt} hover:opacity-80 rounded-xl text-sm font-medium ${theme.text} transition-colors cursor-pointer`}><Upload size={18} />Import Data</span><input type="file" accept=".json" onChange={importData} className="hidden" /></label>
                <button onClick={() => { if (confirm('Clear all workout logs? This cannot be undone.')) setWorkoutLogs([]); }} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-sm font-medium text-red-500 transition-colors"><Trash2 size={18} />Clear All Logs</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 ${theme.nav} border-t px-4 py-2 safe-area-pb`}>
        <div className="max-w-2xl mx-auto flex justify-around">
          {[{ id: 'dashboard', icon: Home, label: 'Home' }, { id: 'workout', icon: Play, label: 'Workout' }, { id: 'log', icon: Calendar, label: 'Log' }, { id: 'progress', icon: BarChart3, label: 'Progress' }].map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setCurrentView(id)} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${currentView === id ? 'text-blue-500' : theme.textSubtle}`}>
              <Icon size={24} /><span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
