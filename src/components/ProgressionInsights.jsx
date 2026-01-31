import React from 'react';
import { TrendingUp } from 'lucide-react';

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

export default ProgressionInsights;
