import React, { useState, useEffect } from 'react';
import { 
  Calendar, Dumbbell, TrendingUp, CheckCircle2, Circle, ChevronRight, 
  ChevronLeft, Play, Clock, Flame, Target, Menu, X, Download, Upload,
  Settings, Activity, Mountain, Home, BarChart3, Trash2
} from 'lucide-react';

// ============== PROGRAM DATA ==============
const PROGRAMS = {
  combatAlpinist: {
    id: 'combatAlpinist',
    name: 'Combat Alpinist',
    description: 'Integrated protocol for physical capacity, technical mastery, and mountain experience',
    icon: '⛰️',
    phases: [
      {
        id: 'foundation',
        name: 'Foundation',
        weeks: [1, 16],
        description: 'Build aerobic engine, maintain strength. 80% Zone 1-2.',
        weeklyTemplate: [
          {
            day: 'Monday',
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
            day: 'Tuesday',
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
            day: 'Wednesday',
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
            day: 'Thursday',
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
            day: 'Friday',
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
            day: 'Saturday',
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
            day: 'Sunday',
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
          {
            day: 'Monday',
            session: 'Strength (Reduced)',
            type: 'strength',
            duration: 45,
            prescription: {
              warmup: '10 min easy cardio + dynamic stretching',
              exercises: [
                { name: 'Trap Bar Deadlift', sets: 3, reps: '3-5', rest: '3 min', notes: '85% 1RM' },
                { name: 'Box Step-Up (each leg)', sets: 3, reps: '3-5', rest: '3 min', notes: 'Heavy DB' },
                { name: 'Weighted Pull-Up', sets: 3, reps: '3-5', rest: '3 min', notes: '+60 lbs' },
                { name: 'Dip', sets: 3, reps: '3-5', rest: '3 min', notes: '+60 lbs' }
              ],
              intensity: 'Maintenance only - not pushing PRs'
            }
          },
          { day: 'Tuesday', session: 'Zone 2 Run', type: 'cardio', duration: 60, prescription: { description: 'Easy recovery-pace run', intensity: 'Zone 2 (60-70% Max HR)', notes: ['Recovery from ME work', 'Keep it truly easy'] } },
          {
            day: 'Wednesday',
            session: 'Gym ME Session',
            type: 'muscular_endurance',
            duration: 70,
            prescription: {
              warmup: '10 min easy cardio',
              description: 'Continuous circuit, minimal rest',
              exercises: [
                { name: 'Box Step-Up', notes: '75% knee height' },
                { name: 'Walking Lunge', notes: 'Continuous' },
                { name: 'Split Squat', notes: 'Alternating' },
                { name: 'Heel Touch', notes: 'Eccentric focus' }
              ],
              tempo: '1 rep every 2 seconds',
              progression: { 'Weeks 17-20': 'Bodyweight, 400 total steps', 'Weeks 21-24': '+10% BW (22 lbs), 500 steps', 'Weeks 25-28': '+20% BW (45 lbs), 600 steps' }
            }
          },
          { day: 'Thursday', session: 'Zone 2 + Mobility', type: 'cardio', duration: 45, prescription: { description: '30 min easy aerobic + 15 min mobility', intensity: 'Zone 1-2' } },
          { day: 'Friday', session: 'Threshold Intervals', type: 'cardio', duration: 45, prescription: { warmup: '10 min building effort', mainSet: '5 x 6 min at tempo', recovery: '2 min easy jog', cooldown: '5-10 min easy', intensity: 'Zone 3-4' } },
          {
            day: 'Saturday',
            session: 'Outdoor ME (Water Jug)',
            type: 'muscular_endurance',
            duration: 90,
            prescription: {
              description: 'THE WATER JUG PROTOCOL',
              steps: ['Fill pack with water jugs to target weight', 'Find steep terrain (30%+ grade) or stairmaster at 15%+', 'Hike continuously uphill for 60-90 min', 'At the top: DUMP THE WATER', 'Descend with empty pack'],
              why: 'Spares knees from eccentric damage, allows higher training frequency',
              progression: { 'Weeks 17-20': '34 lbs (15% BW), 60 min', 'Weeks 21-24': '45 lbs (20% BW), 75 min', 'Weeks 25-28': '56 lbs (25% BW), 90 min' },
              intensity: 'Zone 2-3 HR'
            }
          },
          { day: 'Sunday', session: 'Active Recovery', type: 'recovery', duration: 30, prescription: { description: 'Very easy movement or complete rest', intensity: 'Zone 1 or rest' } }
        ],
        benchmarks: [ { name: 'Gym ME', target: '600 steps @ 20% BW' }, { name: '5-Mile Run', target: '<34:00' }, { name: 'AeT/AnT Gap', target: 'Within 12%' } ]
      },
      {
        id: 'specificity',
        name: 'Specificity',
        weeks: [29, 40],
        description: 'Expedition simulation. Back-to-back efforts, peak loads.',
        weeklyTemplate: [
          { day: 'Monday', session: 'Strength (Minimal)', type: 'strength', duration: 40, prescription: { exercises: [ { name: 'Trap Bar Deadlift', sets: 3, reps: '3-5', rest: '3 min' }, { name: 'Weighted Pull-Up', sets: 3, reps: '3-5', rest: '3 min' }, { name: 'Box Step-Up or Dip', sets: 3, reps: '3-5', rest: '3 min' } ], intensity: '80-85% 1RM - maintaining only' } },
          { day: 'Tuesday', session: 'Zone 2 Run', type: 'cardio', duration: 55, prescription: { description: 'Easy recovery run', intensity: 'Zone 2', notes: ['Active recovery from weekend sawtooth'] } },
          { day: 'Wednesday', session: 'Peak ME Session', type: 'muscular_endurance', duration: 75, prescription: { description: 'Continuous circuit at peak load', target: '800-1000 total steps at 25% BW (56 lbs)', tempo: '1 step every 2 seconds', notes: ['This is HARD', 'Maintain form under fatigue'] } },
          { day: 'Thursday', session: 'Off or Mobility', type: 'recovery', duration: 30, prescription: { description: 'TRUE RECOVERY DAY', options: ['Complete rest', 'Light mobility only', 'Foam rolling'], notes: ['Do NOT train', 'You need this for the weekend sawtooth'] } },
          { day: 'Friday', session: 'Tempo Run', type: 'cardio', duration: 45, prescription: { warmup: '10 min building', mainSet: '3 x 1 mile at 6:24/mile pace', recovery: '2-3 min jog between', cooldown: '10 min easy', intensity: 'Goal 5-mile pace' } },
          { day: 'Saturday', session: 'Sawtooth Day 1', type: 'long_effort', duration: 300, prescription: { description: 'LONG LOADED EFFORT', load: '56-67 lbs (25-30% BW)', duration: '4-6 hours', terrain: 'Hilly/mountainous or stairmaster', benchmark: '1000 vertical feet/hour at 25% BW, HR in Zone 2', nutrition: '60-90g carbs/hour after first hour', hydration: '16-24 oz/hour' } },
          { day: 'Sunday', session: 'Sawtooth Day 2', type: 'long_effort', duration: 150, prescription: { description: 'MODERATE AEROBIC (BACK-TO-BACK)', load: '15% BW or unloaded', duration: '2-3 hours', purpose: 'Train fatigue resistance on tired legs', intensity: 'Zone 1-2, recovery pace' } }
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
const getDayOfWeek = () => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const getTypeColor = (type) => ({ strength: 'bg-red-500', cardio: 'bg-blue-500', muscular_endurance: 'bg-orange-500', recovery: 'bg-green-500', long_effort: 'bg-purple-500' }[type] || 'bg-gray-500');
const getTypeBorder = (type) => ({ strength: 'border-red-500', cardio: 'border-blue-500', muscular_endurance: 'border-orange-500', recovery: 'border-green-500', long_effort: 'border-purple-500' }[type] || 'border-gray-500');
const getTypeIcon = (type) => ({ strength: Dumbbell, cardio: Activity, muscular_endurance: Flame, recovery: Circle, long_effort: Mountain }[type] || Circle);

// ============== MAIN APP COMPONENT ==============
export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [programState, setProgramState] = useLocalStorage('trainingHub_programState', { currentProgram: 'combatAlpinist', currentWeek: 1, startDate: new Date().toISOString().split('T')[0] });
  const [workoutLogs, setWorkoutLogs] = useLocalStorage('trainingHub_workoutLogs', []);
  const [exerciseCompletion, setExerciseCompletion] = useState({});
  const [workoutData, setWorkoutData] = useState({ duration: 0, rpe: 5, notes: '' });

  const program = PROGRAMS[programState.currentProgram];
  const phase = program?.phases.find(p => programState.currentWeek >= p.weeks[0] && programState.currentWeek <= p.weeks[1]);
  const today = getDayOfWeek();
  const todayWorkout = phase?.weeklyTemplate.find(w => w.day === today);

  useEffect(() => { if (todayWorkout) setWorkoutData(prev => ({ ...prev, duration: todayWorkout.duration })); }, [todayWorkout?.session]);

  const thisWeekLogs = workoutLogs.filter(log => log.week === programState.currentWeek);
  const completedThisWeek = thisWeekLogs.filter(log => log.completed).length;
  const toggleExercise = (name) => setExerciseCompletion(prev => ({ ...prev, [name]: !prev[name] }));

  const completeWorkout = () => {
    const newLog = { id: Date.now(), date: new Date().toISOString().split('T')[0], week: programState.currentWeek, phase: phase?.name, session: todayWorkout.session, type: todayWorkout.type, prescribed: todayWorkout.duration, actual: workoutData.duration, rpe: workoutData.rpe, notes: workoutData.notes, completed: true };
    setWorkoutLogs(prev => [...prev.filter(log => !(log.date === newLog.date && log.session === newLog.session)), newLog]);
    setExerciseCompletion({});
    setWorkoutData({ duration: todayWorkout?.duration || 0, rpe: 5, notes: '' });
  };

  const exportData = () => {
    const data = { programState, workoutLogs, exportedAt: new Date().toISOString() };
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
          alert('Data imported successfully!');
        } catch (err) { alert('Error importing data.'); }
      };
      reader.readAsText(file);
    }
  };

  const todayLog = workoutLogs.find(log => log.date === new Date().toISOString().split('T')[0] && log.session === todayWorkout?.session);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-slate-800 text-white p-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⛰️</span>
            <h1 className="text-lg font-bold">Training Hub</h1>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {menuOpen && (
          <nav className="absolute top-full left-0 right-0 bg-slate-800 border-t border-slate-700 p-4 shadow-lg">
            <div className="max-w-2xl mx-auto flex flex-col gap-2">
              {[{ id: 'dashboard', label: 'Dashboard', icon: Home }, { id: 'workout', label: "Today's Workout", icon: Play }, { id: 'log', label: 'Workout Log', icon: Calendar }, { id: 'progress', label: 'Progress', icon: TrendingUp }, { id: 'settings', label: 'Settings', icon: Settings }].map(({ id, label, icon: Icon }) => (
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
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Current Program</p>
                  <h2 className="text-xl font-bold text-slate-800">{program?.name}</h2>
                </div>
                <span className="text-4xl">{program?.icon}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-bold text-slate-800">{programState.currentWeek}</p>
                  <p className="text-xs text-slate-500 uppercase">Week</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-bold text-slate-800">{phase?.name}</p>
                  <p className="text-xs text-slate-500 uppercase">Phase</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-bold text-slate-800">{completedThisWeek}/7</p>
                  <p className="text-xs text-slate-500 uppercase">Done</p>
                </div>
              </div>
            </div>
            {todayWorkout && (
              <button onClick={() => setCurrentView('workout')} className={`w-full text-left rounded-xl shadow-sm p-5 border-l-4 ${getTypeBorder(todayWorkout.type)} bg-white hover:shadow-md transition-shadow`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">{today}'s Workout</p>
                    <h3 className="text-xl font-bold text-slate-800 mt-1">{todayWorkout.session}</h3>
                    <div className="flex items-center gap-3 mt-2 text-sm text-slate-600">
                      <span className="flex items-center gap-1"><Clock size={14} />{todayWorkout.duration} min</span>
                      <span className={`px-2 py-0.5 rounded text-xs text-white ${getTypeColor(todayWorkout.type)}`}>{todayWorkout.type.replace('_', ' ')}</span>
                      {todayLog?.completed && <span className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle2 size={14} />Done</span>}
                    </div>
                  </div>
                  <ChevronRight size={24} className="text-slate-400" />
                </div>
              </button>
            )}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-4">This Week</h3>
              <div className="space-y-2">
                {phase?.weeklyTemplate.map((workout, idx) => {
                  const isToday = workout.day === today;
                  const logged = thisWeekLogs.find(l => l.session === workout.session && l.completed);
                  return (
                    <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isToday ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'}`}>
                      {logged ? <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" /> : <Circle size={20} className="text-slate-300 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{workout.session}</p>
                        <p className="text-xs text-slate-500">{workout.day}</p>
                      </div>
                      <span className="text-sm text-slate-400">{workout.duration}m</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Phase Benchmarks</h3>
              <div className="space-y-3">
                {phase?.benchmarks.map((b, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-700">{b.name}</span>
                    <span className="font-mono text-sm text-slate-600 bg-white px-2 py-1 rounded">{b.target}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* WORKOUT VIEW */}
        {currentView === 'workout' && todayWorkout && (
          <div className="p-4 space-y-4">
            <div className={`${getTypeColor(todayWorkout.type)} rounded-xl p-5 text-white`}>
              <p className="text-sm opacity-80 uppercase tracking-wide">{today}</p>
              <h2 className="text-2xl font-bold mt-1">{todayWorkout.session}</h2>
              <div className="flex items-center gap-4 mt-3 text-sm opacity-90">
                <span className="flex items-center gap-1"><Clock size={16} />{todayWorkout.duration} min</span>
                <span className="capitalize">{todayWorkout.type.replace('_', ' ')}</span>
              </div>
              {todayLog?.completed && <div className="mt-4 bg-white/20 rounded-lg p-3 flex items-center gap-2"><CheckCircle2 size={18} /><span>Completed today</span></div>}
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {todayWorkout.prescription.warmup && <div className="p-4 border-b border-slate-100"><p className="text-xs font-medium text-slate-500 uppercase mb-2">Warm-up</p><p className="text-slate-800">{todayWorkout.prescription.warmup}</p></div>}
              {todayWorkout.prescription.description && <div className="p-4 border-b border-slate-100"><p className="text-xs font-medium text-slate-500 uppercase mb-2">Overview</p><p className="text-slate-800">{todayWorkout.prescription.description}</p></div>}
              {todayWorkout.prescription.mainSet && <div className="p-4 border-b border-slate-100 bg-blue-50"><p className="text-xs font-medium text-blue-600 uppercase mb-2">Main Set</p><p className="text-lg font-semibold text-slate-800">{todayWorkout.prescription.mainSet}</p>{todayWorkout.prescription.recovery && <p className="text-slate-600 mt-1">Recovery: {todayWorkout.prescription.recovery}</p>}</div>}
              {todayWorkout.prescription.exercises && (
                <div className="p-4 border-b border-slate-100">
                  <p className="text-xs font-medium text-slate-500 uppercase mb-3">Exercises</p>
                  <div className="space-y-2">
                    {todayWorkout.prescription.exercises.map((ex, idx) => (
                      <button key={idx} onClick={() => toggleExercise(ex.name)} className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${exerciseCompletion[ex.name] ? 'bg-green-50 border-green-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                        {exerciseCompletion[ex.name] ? <CheckCircle2 size={24} className="text-green-500 flex-shrink-0" /> : <Circle size={24} className="text-slate-300 flex-shrink-0" />}
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{ex.name}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 mt-1">
                            {ex.sets && <span>{ex.sets} sets</span>}{ex.reps && <span>× {ex.reps}</span>}{ex.duration && <span>{ex.duration}</span>}{ex.rest && <span className="text-slate-400">Rest: {ex.rest}</span>}
                          </div>
                          {ex.notes && <p className="text-sm text-blue-600 mt-1">{ex.notes}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {todayWorkout.prescription.progression && <div className="p-4 border-b border-slate-100 bg-amber-50"><p className="text-xs font-medium text-amber-700 uppercase mb-2">Progression</p><div className="space-y-1">{Object.entries(todayWorkout.prescription.progression).map(([k, v]) => <div key={k} className="flex justify-between text-sm"><span className="text-slate-600">{k}</span><span className="font-medium text-slate-800">{v}</span></div>)}</div></div>}
              {todayWorkout.prescription.steps && <div className="p-4 border-b border-slate-100"><p className="text-xs font-medium text-slate-500 uppercase mb-3">Protocol</p><ol className="space-y-2">{todayWorkout.prescription.steps.map((step, idx) => <li key={idx} className="flex gap-3 text-slate-700"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-sm flex items-center justify-center">{idx + 1}</span>{step}</li>)}</ol></div>}
              {todayWorkout.prescription.options && <div className="p-4 border-b border-slate-100"><p className="text-xs font-medium text-slate-500 uppercase mb-2">Options</p><ul className="space-y-1">{todayWorkout.prescription.options.map((opt, idx) => <li key={idx} className="text-slate-600">• {opt}</li>)}</ul></div>}
              {todayWorkout.prescription.notes && <div className="p-4 border-b border-slate-100"><p className="text-xs font-medium text-slate-500 uppercase mb-2">Notes</p><ul className="space-y-1">{(Array.isArray(todayWorkout.prescription.notes) ? todayWorkout.prescription.notes : [todayWorkout.prescription.notes]).map((note, idx) => <li key={idx} className="text-slate-600">• {note}</li>)}</ul></div>}
              {todayWorkout.prescription.cooldown && <div className="p-4 border-b border-slate-100"><p className="text-xs font-medium text-slate-500 uppercase mb-2">Cool-down</p><p className="text-slate-800">{todayWorkout.prescription.cooldown}</p></div>}
              {todayWorkout.prescription.intensity && <div className="p-4 bg-slate-800 text-white"><p className="text-xs uppercase opacity-70 mb-1">Intensity</p><p className="font-semibold">{todayWorkout.prescription.intensity}</p></div>}
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Log Workout</h3>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-slate-600 mb-2">Actual Duration (min)</label><input type="number" value={workoutData.duration} onChange={(e) => setWorkoutData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" /></div>
                <div><label className="block text-sm font-medium text-slate-600 mb-2">RPE (1-10): {workoutData.rpe}</label><input type="range" min="1" max="10" value={workoutData.rpe} onChange={(e) => setWorkoutData(prev => ({ ...prev, rpe: parseInt(e.target.value) }))} className="w-full" /><div className="flex justify-between text-xs text-slate-400 mt-1"><span>Easy</span><span>Moderate</span><span>Max Effort</span></div></div>
                <div><label className="block text-sm font-medium text-slate-600 mb-2">Notes</label><textarea value={workoutData.notes} onChange={(e) => setWorkoutData(prev => ({ ...prev, notes: e.target.value }))} placeholder="How did it feel? Any modifications?" rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none" /></div>
                <button onClick={completeWorkout} className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"><CheckCircle2 size={20} />{todayLog?.completed ? 'Update Workout' : 'Complete Workout'}</button>
              </div>
            </div>
          </div>
        )}
        {currentView === 'workout' && !todayWorkout && <div className="p-4"><div className="bg-white rounded-xl shadow-sm p-8 text-center"><Circle size={48} className="mx-auto text-slate-300 mb-4" /><h2 className="text-xl font-semibold text-slate-800">Rest Day</h2><p className="text-slate-500 mt-2">No workout scheduled for today.</p></div></div>}

        {/* LOG VIEW */}
        {currentView === 'log' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-slate-800">Workout History</h2><span className="text-sm text-slate-500">{workoutLogs.length} logged</span></div>
            {workoutLogs.length === 0 ? <div className="bg-white rounded-xl shadow-sm p-8 text-center"><Calendar size={48} className="mx-auto text-slate-300 mb-4" /><p className="text-slate-500">No workouts logged yet.</p><p className="text-sm text-slate-400 mt-1">Complete your first workout to see it here.</p></div> : (
              <div className="space-y-3">
                {[...workoutLogs].reverse().map(log => (
                  <div key={log.id} className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${getTypeBorder(log.type)}`}>
                    <div className="flex items-center justify-between"><div><p className="font-semibold text-slate-800">{log.session}</p><p className="text-sm text-slate-500">{formatDate(log.date)} • Week {log.week}</p></div><CheckCircle2 size={20} className="text-green-500" /></div>
                    <div className="flex gap-4 mt-2 text-sm text-slate-600"><span>Duration: {log.actual}m</span><span>RPE: {log.rpe}/10</span></div>
                    {log.notes && <p className="mt-2 text-sm text-slate-500 bg-slate-50 rounded-lg p-2">{log.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROGRESS VIEW */}
        {currentView === 'progress' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-slate-800">Progress</h2><button onClick={exportData} className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"><Download size={16} />Export</button></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl shadow-sm p-4 text-center"><p className="text-3xl font-bold text-slate-800">{workoutLogs.length}</p><p className="text-sm text-slate-500">Workouts</p></div>
              <div className="bg-white rounded-xl shadow-sm p-4 text-center"><p className="text-3xl font-bold text-slate-800">{Math.round(workoutLogs.reduce((s, l) => s + (l.actual || 0), 0) / 60)}</p><p className="text-sm text-slate-500">Hours</p></div>
              <div className="bg-white rounded-xl shadow-sm p-4 text-center"><p className="text-3xl font-bold text-slate-800">{workoutLogs.length > 0 ? (workoutLogs.reduce((s, l) => s + (l.rpe || 0), 0) / workoutLogs.length).toFixed(1) : '-'}</p><p className="text-sm text-slate-500">Avg RPE</p></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-4">By Type</h3>
              {workoutLogs.length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(workoutLogs.reduce((acc, log) => { acc[log.type] = (acc[log.type] || 0) + 1; return acc; }, {})).map(([type, count]) => (
                    <div key={type} className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${getTypeColor(type)} flex items-center justify-center`}>{React.createElement(getTypeIcon(type), { size: 20, className: 'text-white' })}</div>
                      <div className="flex-1"><div className="flex justify-between text-sm mb-1"><span className="capitalize text-slate-700">{type.replace('_', ' ')}</span><span className="text-slate-500">{count}</span></div><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${getTypeColor(type)}`} style={{ width: `${(count / workoutLogs.length) * 100}%` }} /></div></div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-slate-400 text-center py-4">No data yet</p>}
            </div>
            {workoutLogs.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="font-semibold text-slate-800 mb-4">Weekly Volume (min)</h3>
                <div className="space-y-2">
                  {Object.entries(workoutLogs.reduce((acc, log) => { acc[log.week] = (acc[log.week] || 0) + (log.actual || 0); return acc; }, {})).sort(([a], [b]) => parseInt(a) - parseInt(b)).slice(-8).map(([week, minutes]) => (
                    <div key={week} className="flex items-center gap-3"><span className="w-12 text-sm text-slate-500">Wk {week}</span><div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-2" style={{ width: `${Math.min((minutes / 600) * 100, 100)}%`, minWidth: minutes > 0 ? '40px' : '0' }}><span className="text-xs text-white font-medium">{minutes}</span></div></div></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SETTINGS VIEW */}
        {currentView === 'settings' && (
          <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Settings</h2>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Current Program</h3>
              <div className="space-y-3">
                {Object.values(PROGRAMS).map(prog => (
                  <button key={prog.id} onClick={() => setProgramState(prev => ({ ...prev, currentProgram: prog.id }))} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${programState.currentProgram === prog.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <span className="text-3xl">{prog.icon}</span>
                    <div className="text-left"><p className="font-semibold text-slate-800">{prog.name}</p><p className="text-sm text-slate-500">{prog.description}</p></div>
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Current Week</h3>
              <div className="flex items-center justify-center gap-6">
                <button onClick={() => setProgramState(prev => ({ ...prev, currentWeek: Math.max(1, prev.currentWeek - 1) }))} className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"><ChevronLeft size={24} /></button>
                <div className="text-center"><p className="text-4xl font-bold text-slate-800">{programState.currentWeek}</p><p className="text-sm text-slate-500">of 40 weeks</p></div>
                <button onClick={() => setProgramState(prev => ({ ...prev, currentWeek: Math.min(40, prev.currentWeek + 1) }))} className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"><ChevronRight size={24} /></button>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Data Management</h3>
              <div className="space-y-3">
                <button onClick={exportData} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-700 transition-colors"><Download size={18} />Export All Data</button>
                <label className="block"><span className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-700 transition-colors cursor-pointer"><Upload size={18} />Import Data</span><input type="file" accept=".json" onChange={importData} className="hidden" /></label>
                <button onClick={() => { if (confirm('Clear all workout logs? This cannot be undone.')) setWorkoutLogs([]); }} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-medium text-red-600 transition-colors"><Trash2 size={18} />Clear All Logs</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 safe-area-pb">
        <div className="max-w-2xl mx-auto flex justify-around">
          {[{ id: 'dashboard', icon: Home, label: 'Home' }, { id: 'workout', icon: Play, label: 'Workout' }, { id: 'log', icon: Calendar, label: 'Log' }, { id: 'progress', icon: BarChart3, label: 'Progress' }].map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setCurrentView(id)} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${currentView === id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <Icon size={24} /><span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
