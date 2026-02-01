import React, { useState } from 'react';
import { X } from 'lucide-react';
import { MOVEMENT_PATTERNS } from '../data';

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
                <button key={eq} onClick={() => toggleEquipment(eq)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${equipment.includes(eq) ? 'bg-amber-500 text-white' : theme.chip}`}>
                  {EQUIPMENT_DISPLAY_NAMES[eq] || eq}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme.text} mb-2`}>Target Muscles</label>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_OPTIONS.map(muscle => (
                <button key={muscle} onClick={() => toggleMuscle(muscle)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${muscles.includes(muscle) ? 'bg-nominal text-white' : theme.chip}`}>
                  {muscle}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={`p-4 border-t ${theme.border} flex gap-3`}>
          <button onClick={onClose} className={`flex-1 py-3 ${theme.btnSecondary} rounded-xl font-medium`}>Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()} className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 rounded-xl font-medium text-white">
            {editExercise ? 'Update' : 'Add Exercise'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCustomExerciseModal;
