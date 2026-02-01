import React, { useState } from 'react';

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
                i === step ? 'w-8 bg-amber-500' : i < step ? 'w-2 bg-amber-500/50' : 'w-2 bg-slate-600/50'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-8 text-center">
          <div className="text-6xl mb-4">{currentStep.icon}</div>
          <h2 className={`text-2xl font-bold ${theme.text} mb-2`}>{currentStep.title}</h2>
          <p className="text-amber-400 font-medium mb-4">{currentStep.subtitle}</p>
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
            className={`flex-1 py-3 rounded-xl font-medium bg-amber-500 hover:bg-amber-600 text-white ${step === 0 ? 'w-full' : ''}`}
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

export default OnboardingFlow;
