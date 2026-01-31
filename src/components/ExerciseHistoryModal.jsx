import React from 'react';
import { X, Dumbbell } from 'lucide-react';

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
                      {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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

export default ExerciseHistoryModal;
