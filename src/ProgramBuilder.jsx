// ProgramBuilderView - Refactored to fix input focus issues
// All state is at the top level, no nested function components with useState

import React, { useState } from 'react';
import { Plus, Trash2, ChevronLeft, X, RotateCcw } from 'lucide-react';

const ProgramBuilderView = ({ 
  customPrograms, 
  setCustomPrograms, 
  theme, 
  PROGRESSION_MODELS,
  EXERCISE_LIBRARY,
  MOVEMENT_PATTERNS,
  CARDIO_ZONES,
  getExerciseSwaps
}) => {
  // All state at top level
  const [step, setStep] = useState('type');
  const [programType, setProgramType] = useState(null);
  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [programIcon, setProgramIcon] = useState('🏋️');
  const [phases, setPhases] = useState([]);
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [showExercisePicker, setShowExercisePicker] = useState(null);
  const [showSwapPicker, setShowSwapPicker] = useState(null);
  
  // New phase form state - at top level to avoid focus issues
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseWeeks, setNewPhaseWeeks] = useState(4);
  const [newPhaseProgression, setNewPhaseProgression] = useState('linear');
  
  // Exercise picker state
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

  // Phase functions
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
      weeklyTemplate: Array(7).fill(null).map((_, i) => ({ 
        day: i + 1, 
        dayName: `Day ${i + 1}`, 
        session: '', 
        type: 'recovery', 
        exercises: [],
        duration: 60,
        cardioZone: 'zone2',
        cardioActivity: 'run',
      })),
    }]);
    setNewPhaseName('');
    setNewPhaseWeeks(4);
  };

  const removePhase = (idx) => {
    setPhases(prev => prev.filter((_, i) => i !== idx));
  };

  // Day/Exercise functions
  const updateDay = (dayIdx, updates) => {
    setPhases(prev => prev.map((ph, i) => i === currentPhaseIdx ? {
      ...ph,
      weeklyTemplate: ph.weeklyTemplate.map((d, di) => di === dayIdx ? { ...d, ...updates } : d)
    } : ph));
  };

  const addExercise = (dayIdx) => {
    const day = currentPhase.weeklyTemplate[dayIdx];
    updateDay(dayIdx, {
      exercises: [...(day.exercises || []), {
        id: `ex_${Date.now()}`,
        exerciseId: null,
        name: '',
        sets: 3,
        reps: '8-10',
        intensity: 70,
        rpe: 7,
        rest: '2 min',
      }]
    });
  };

  const updateExercise = (dayIdx, exIdx, updates) => {
    const day = currentPhase.weeklyTemplate[dayIdx];
    updateDay(dayIdx, {
      exercises: day.exercises.map((ex, i) => i === exIdx ? { ...ex, ...updates } : ex)
    });
  };

  const removeExercise = (dayIdx, exIdx) => {
    const day = currentPhase.weeklyTemplate[dayIdx];
    updateDay(dayIdx, {
      exercises: day.exercises.filter((_, i) => i !== exIdx)
    });
  };

  const selectExercise = (exerciseId) => {
    const { dayIdx, exerciseIdx } = showExercisePicker;
    const exercise = EXERCISE_LIBRARY[exerciseId];
    updateExercise(dayIdx, exerciseIdx, {
      exerciseId,
      name: exercise.name,
      prKey: exercise.prKey || null,
    });
    setShowExercisePicker(null);
    setExerciseSearch('');
    setExerciseFilter('all');
  };

  const selectSwap = (exerciseId) => {
    const { dayIdx, exerciseIdx } = showSwapPicker;
    const exercise = EXERCISE_LIBRARY[exerciseId];
    updateExercise(dayIdx, exerciseIdx, {
      exerciseId,
      name: exercise.name,
      prKey: exercise.prKey || null,
    });
    setShowSwapPicker(null);
  };

  const saveProgram = () => {
    const finalProgram = {
      id: `custom_${Date.now()}`,
      name: programName,
      description: programDescription,
      icon: programIcon,
      phases: phases.map(phase => ({
        id: phase.id,
        name: phase.name,
        weeks: phase.weeksRange,
        description: `${PROGRESSION_MODELS[phase.progression].name} progression`,
        progression: phase.progression,
        weeklyTemplate: phase.weeklyTemplate.map(day => ({
          day: day.day,
          dayName: day.dayName,
          session: day.session,
          type: day.type,
          duration: day.duration || 60,
          prescription: day.type === 'cardio' ? {
            hrZone: day.cardioZone || 'zone2',
            description: CARDIO_ZONES[day.cardioZone || 'zone2']?.description,
          } : {
            exercises: (day.exercises || []).map(ex => ({
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
              percentage: ex.intensity,
              rpe: ex.rpe,
              rest: ex.rest,
              prKey: ex.prKey,
            })),
          },
        })),
      })),
    };

    setCustomPrograms(prev => ({ ...prev, [finalProgram.id]: finalProgram }));
    
    // Reset all state
    setStep('type');
    setProgramType(null);
    setProgramName('');
    setProgramDescription('');
    setProgramIcon('🏋️');
    setPhases([]);
    setCurrentPhaseIdx(0);
  };

  // Filter exercises for picker
  const filteredExercises = Object.values(EXERCISE_LIBRARY)
    .filter(e => !e.isCardio && !e.isMobility)
    .filter(e => exerciseFilter === 'all' || e.pattern === exerciseFilter)
    .filter(e => e.name.toLowerCase().includes(exerciseSearch.toLowerCase()));

  return (
    <div className="p-4">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-6">
        {['type', 'details', 'phases', 'template', 'review'].map((s, i) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full ${
              ['type', 'details', 'phases', 'template', 'review'].indexOf(step) >= i
                ? 'bg-blue-500'
                : theme.cardAlt
            }`}
          />
        ))}
      </div>

      {/* STEP 1: Type Selection */}
      {step === 'type' && (
        <div className="space-y-4">
          <h3 className={`text-lg font-bold ${theme.text}`}>What do you want to build?</h3>
          
          <button
            onClick={() => { setProgramType('meso'); setStep('details'); }}
            className={`w-full ${theme.card} rounded-xl p-5 text-left border-2 ${theme.border} hover:border-blue-500 transition-colors`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">📦</span>
              <div>
                <p className={`font-bold ${theme.text}`}>Mesocycle</p>
                <p className={`text-sm ${theme.textMuted}`}>Single training block (3-8 weeks)</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => { setProgramType('macro'); setStep('details'); }}
            className={`w-full ${theme.card} rounded-xl p-5 text-left border-2 ${theme.border} hover:border-blue-500 transition-colors`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">📅</span>
              <div>
                <p className={`font-bold ${theme.text}`}>Macrocycle</p>
                <p className={`text-sm ${theme.textMuted}`}>Multiple mesocycles (12-52 weeks)</p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* STEP 2: Details */}
      {step === 'details' && (
        <div className="space-y-4">
          <h3 className={`text-lg font-bold ${theme.text}`}>Program Details</h3>
          
          <div>
            <label className={`block text-sm font-medium ${theme.text} mb-2`}>Program Name</label>
            <input
              type="text"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              placeholder="e.g., Pre-Season Strength"
              className={`w-full p-3 rounded-lg ${theme.input} border`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme.text} mb-2`}>Description</label>
            <textarea
              value={programDescription}
              onChange={(e) => setProgramDescription(e.target.value)}
              placeholder="Brief description of goals..."
              rows={2}
              className={`w-full p-3 rounded-lg ${theme.input} border`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme.text} mb-2`}>Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setProgramIcon(icon)}
                  className={`text-2xl p-2 rounded-lg ${programIcon === icon ? 'bg-blue-500' : theme.cardAlt}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep('phases')}
            disabled={!programName}
            className={`w-full py-3 rounded-xl font-medium ${programName ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'}`}
          >
            Next: Add {programType === 'meso' ? 'Phase' : 'Mesocycles'}
          </button>
        </div>
      )}

      {/* STEP 3: Phases */}
      {step === 'phases' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-bold ${theme.text}`}>
              {programType === 'meso' ? 'Phase Setup' : 'Mesocycles'}
            </h3>
            <span className={`text-sm ${theme.textMuted}`}>{totalWeeks} weeks total</span>
          </div>

          {/* Existing phases */}
          {phases.map((phase, idx) => (
            <div key={phase.id} className={`${theme.card} rounded-xl p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${theme.text}`}>{phase.name}</p>
                  <p className={`text-sm ${theme.textMuted}`}>
                    Weeks {phase.weeksRange[0]}-{phase.weeksRange[1]} • {PROGRESSION_MODELS[phase.progression].name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setCurrentPhaseIdx(idx); setStep('template'); }}
                    className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm"
                  >
                    Edit Days
                  </button>
                  <button
                    onClick={() => removePhase(idx)}
                    className="px-3 py-1 bg-red-500/20 text-red-500 rounded-lg text-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add new phase form */}
          <div className={`${theme.card} rounded-xl p-4 space-y-4 border-2 border-dashed ${theme.border}`}>
            <p className={`font-medium ${theme.text}`}>Add {programType === 'meso' ? 'Phase' : 'Mesocycle'}</p>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs ${theme.textMuted} mb-1`}>Name</label>
                <input
                  type="text"
                  value={newPhaseName}
                  onChange={(e) => setNewPhaseName(e.target.value)}
                  placeholder="e.g., Accumulation"
                  className={`w-full p-2 rounded-lg ${theme.input} border text-sm`}
                />
              </div>
              <div>
                <label className={`block text-xs ${theme.textMuted} mb-1`}>Weeks</label>
                <input
                  type="number"
                  value={newPhaseWeeks}
                  onChange={(e) => setNewPhaseWeeks(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  max={12}
                  className={`w-full p-2 rounded-lg ${theme.input} border text-sm`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs ${theme.textMuted} mb-2`}>Progression Model</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(PROGRESSION_MODELS).map(model => (
                  <button
                    key={model.id}
                    onClick={() => setNewPhaseProgression(model.id)}
                    className={`p-3 rounded-lg text-left ${newPhaseProgression === model.id ? 'bg-blue-500 text-white' : theme.cardAlt}`}
                  >
                    <span className="text-lg mr-2">{model.icon}</span>
                    <span className="text-sm font-medium">{model.name}</span>
                  </button>
                ))}
              </div>
              <p className={`text-xs ${theme.textMuted} mt-2`}>
                {PROGRESSION_MODELS[newPhaseProgression].description}
              </p>
            </div>

            <button
              onClick={addPhase}
              disabled={!newPhaseName}
              className={`w-full py-2 rounded-lg font-medium ${newPhaseName ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'}`}
            >
              <Plus size={18} className="inline mr-1" /> Add Phase
            </button>
          </div>

          {phases.length > 0 && (
            <button
              onClick={() => setStep('review')}
              className="w-full py-3 rounded-xl font-medium bg-blue-500 text-white"
            >
              Review & Save Program
            </button>
          )}
        </div>
      )}

      {/* STEP 4: Template Editor */}
      {step === 'template' && currentPhase && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setStep('phases')} className={theme.textMuted}>
              <ChevronLeft size={20} className="inline" /> Back
            </button>
            <h3 className={`font-bold ${theme.text}`}>{currentPhase.name}</h3>
            <span className={`text-sm ${theme.textMuted}`}>Week 1 of {currentPhase.weeks}</span>
          </div>

          <p className={`text-sm ${theme.textMuted}`}>
            Build Week 1 template. Exercises auto-propagate to all {currentPhase.weeks} weeks with {PROGRESSION_MODELS[currentPhase.progression].name} progression.
          </p>

          {currentPhase.weeklyTemplate.map((day, dayIdx) => (
            <div key={day.day} className={`${theme.card} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-3">
                <input
                  type="text"
                  value={day.dayName}
                  onChange={(e) => updateDay(dayIdx, { dayName: e.target.value })}
                  className={`font-medium ${theme.text} bg-transparent border-b ${theme.border} w-24`}
                />
                <select
                  value={day.type}
                  onChange={(e) => updateDay(dayIdx, { 
                    type: e.target.value, 
                    session: SESSION_TYPES.find(s => s.id === e.target.value)?.name || '' 
                  })}
                  className={`p-2 rounded-lg ${theme.input} text-sm`}
                >
                  {SESSION_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                  ))}
                </select>
              </div>

              {day.type !== 'recovery' && (
                <>
                  <input
                    type="text"
                    value={day.session}
                    onChange={(e) => updateDay(dayIdx, { session: e.target.value })}
                    placeholder="Session name (e.g., Upper Body A)"
                    className={`w-full p-2 rounded-lg ${theme.input} border text-sm mb-3`}
                  />

                  {day.type === 'cardio' ? (
                    <div className="space-y-2">
                      <select
                        value={day.cardioZone || 'zone2'}
                        onChange={(e) => updateDay(dayIdx, { cardioZone: e.target.value })}
                        className={`w-full p-2 rounded-lg ${theme.input} text-sm`}
                      >
                        {Object.values(CARDIO_ZONES).map(z => (
                          <option key={z.id} value={z.id}>{z.name}</option>
                        ))}
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={`text-xs ${theme.textMuted}`}>Duration (min)</label>
                          <input
                            type="number"
                            value={day.duration || 45}
                            onChange={(e) => updateDay(dayIdx, { duration: parseInt(e.target.value) || 30 })}
                            className={`w-full p-2 rounded-lg ${theme.input} text-sm`}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${theme.textMuted}`}>Activity</label>
                          <select
                            value={day.cardioActivity || 'run'}
                            onChange={(e) => updateDay(dayIdx, { cardioActivity: e.target.value })}
                            className={`w-full p-2 rounded-lg ${theme.input} text-sm`}
                          >
                            {Object.values(EXERCISE_LIBRARY).filter(e => e.isCardio).map(e => (
                              <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(day.exercises || []).map((ex, exIdx) => (
                        <div key={ex.id} className={`${theme.cardAlt} rounded-lg p-3`}>
                          <div className="flex items-center justify-between mb-2">
                            <button
                              onClick={() => setShowExercisePicker({ dayIdx, exerciseIdx: exIdx })}
                              className={`text-sm font-medium ${ex.exerciseId ? theme.text : 'text-blue-500'}`}
                            >
                              {ex.exerciseId ? EXERCISE_LIBRARY[ex.exerciseId]?.name || ex.name : '+ Select Exercise'}
                            </button>
                            <div className="flex gap-1">
                              {ex.exerciseId && (
                                <button
                                  onClick={() => setShowSwapPicker({ dayIdx, exerciseIdx: exIdx, currentExerciseId: ex.exerciseId })}
                                  className={`p-1 ${theme.textMuted} hover:text-blue-500`}
                                  title="Swap exercise"
                                >
                                  <RotateCcw size={14} />
                                </button>
                              )}
                              <button onClick={() => removeExercise(dayIdx, exIdx)} className="p-1 text-red-500">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            <div>
                              <label className={theme.textMuted}>Sets</label>
                              <input
                                type="number"
                                value={ex.sets}
                                onChange={(e) => updateExercise(dayIdx, exIdx, { sets: parseInt(e.target.value) || 3 })}
                                className={`w-full p-1 rounded ${theme.input}`}
                              />
                            </div>
                            <div>
                              <label className={theme.textMuted}>Reps</label>
                              <input
                                type="text"
                                value={ex.reps}
                                onChange={(e) => updateExercise(dayIdx, exIdx, { reps: e.target.value })}
                                className={`w-full p-1 rounded ${theme.input}`}
                              />
                            </div>
                            <div>
                              <label className={theme.textMuted}>%1RM</label>
                              <input
                                type="number"
                                value={ex.intensity}
                                onChange={(e) => updateExercise(dayIdx, exIdx, { intensity: parseInt(e.target.value) || 70 })}
                                className={`w-full p-1 rounded ${theme.input}`}
                              />
                            </div>
                            <div>
                              <label className={theme.textMuted}>RPE</label>
                              <input
                                type="number"
                                value={ex.rpe}
                                onChange={(e) => updateExercise(dayIdx, exIdx, { rpe: parseInt(e.target.value) || 7 })}
                                min={1}
                                max={10}
                                className={`w-full p-1 rounded ${theme.input}`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => addExercise(dayIdx)}
                        className={`w-full py-2 border-2 border-dashed ${theme.border} rounded-lg text-sm ${theme.textMuted}`}
                      >
                        <Plus size={16} className="inline mr-1" /> Add Exercise
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          <button
            onClick={() => setStep('phases')}
            className="w-full py-3 rounded-xl font-medium bg-blue-500 text-white"
          >
            Save Template
          </button>
        </div>
      )}

      {/* STEP 5: Review */}
      {step === 'review' && (
        <div className="space-y-4">
          <h3 className={`text-lg font-bold ${theme.text}`}>Review Program</h3>

          <div className={`${theme.card} rounded-xl p-5`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{programIcon}</span>
              <div>
                <h4 className={`text-xl font-bold ${theme.text}`}>{programName}</h4>
                <p className={`text-sm ${theme.textMuted}`}>{programDescription}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className={`${theme.cardAlt} rounded-lg p-3 text-center`}>
                <p className={`text-2xl font-bold ${theme.text}`}>{totalWeeks}</p>
                <p className={`text-xs ${theme.textMuted}`}>Total Weeks</p>
              </div>
              <div className={`${theme.cardAlt} rounded-lg p-3 text-center`}>
                <p className={`text-2xl font-bold ${theme.text}`}>{phases.length}</p>
                <p className={`text-xs ${theme.textMuted}`}>Phases</p>
              </div>
            </div>

            {phases.map((phase) => (
              <div key={phase.id} className={`${theme.cardAlt} rounded-lg p-3 mb-2`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`font-medium ${theme.text}`}>{phase.name}</p>
                    <p className={`text-xs ${theme.textMuted}`}>
                      Weeks {phase.weeksRange[0]}-{phase.weeksRange[1]} • {PROGRESSION_MODELS[phase.progression].name}
                    </p>
                  </div>
                  <p className={`text-sm ${theme.textMuted}`}>{phase.weeks} wks</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('phases')}
              className={`flex-1 py-3 rounded-xl font-medium ${theme.cardAlt} ${theme.text}`}
            >
              Edit
            </button>
            <button
              onClick={saveProgram}
              className="flex-1 py-3 rounded-xl font-medium bg-green-500 text-white"
            >
              Save Program
            </button>
          </div>
        </div>
      )}

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className={`${theme.bg} w-full rounded-t-2xl p-4 max-h-[80vh] overflow-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-bold ${theme.text}`}>Select Exercise</h3>
              <button onClick={() => { setShowExercisePicker(null); setExerciseSearch(''); setExerciseFilter('all'); }}>
                <X size={24} className={theme.text} />
              </button>
            </div>

            <input
              type="text"
              placeholder="Search exercises..."
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
              className={`w-full p-3 rounded-lg ${theme.input} border mb-3`}
            />

            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setExerciseFilter('all')}
                className={`px-3 py-1 rounded-full text-sm ${exerciseFilter === 'all' ? 'bg-blue-500 text-white' : theme.cardAlt}`}
              >
                All
              </button>
              {Object.values(MOVEMENT_PATTERNS).filter(p => p.id !== 'cardio' && p.id !== 'mobility').map(pattern => (
                <button
                  key={pattern.id}
                  onClick={() => setExerciseFilter(pattern.id)}
                  className={`px-3 py-1 rounded-full text-sm ${exerciseFilter === pattern.id ? 'bg-blue-500 text-white' : theme.cardAlt}`}
                >
                  {pattern.icon} {pattern.name}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-[40vh] overflow-auto">
              {filteredExercises.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => selectExercise(ex.id)}
                  className={`w-full p-3 ${theme.card} rounded-lg text-left`}
                >
                  <p className={`font-medium ${theme.text}`}>{ex.name}</p>
                  <p className={`text-xs ${theme.textMuted}`}>
                    {MOVEMENT_PATTERNS[ex.pattern]?.name} • {ex.equipment.join(', ')}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Swap Picker Modal */}
      {showSwapPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className={`${theme.bg} w-full rounded-t-2xl p-4 max-h-[70vh] overflow-auto`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`font-bold ${theme.text}`}>Swap Exercise</h3>
                <p className={`text-sm ${theme.textMuted}`}>
                  Same movement pattern: {MOVEMENT_PATTERNS[EXERCISE_LIBRARY[showSwapPicker.currentExerciseId]?.pattern]?.name}
                </p>
              </div>
              <button onClick={() => setShowSwapPicker(null)}><X size={24} className={theme.text} /></button>
            </div>

            <div className="space-y-2">
              {getExerciseSwaps(showSwapPicker.currentExerciseId).map(ex => (
                <button
                  key={ex.id}
                  onClick={() => selectSwap(ex.id)}
                  className={`w-full p-3 ${theme.card} rounded-lg text-left`}
                >
                  <p className={`font-medium ${theme.text}`}>{ex.name}</p>
                  <p className={`text-xs ${theme.textMuted}`}>Equipment: {ex.equipment.join(', ')}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramBuilderView;
