// Universal Detour Blocks - can be applied to ANY program

export const UNIVERSAL_DETOURS = {
  specialty: [
    {
      id: 'strength_emphasis',
      name: 'Strength Emphasis',
      icon: '💪',
      type: 'specialty',
      category: 'strength',
      duration: { min: 4, max: 6, unit: 'weeks' },
      description: 'Focus on building maximal strength',
      when_to_use: ['Strength numbers dropped >10%', 'Pre-expedition strength peak', 'Coming off long aerobic focus'],
      sacrifice: ['Aerobic capacity may decline slightly', 'Muscular endurance reduced'],
      exit_criteria: ['Hit new PR on main lifts', 'Completed planned weeks', 'Strength tests improved'],
      weeklyTemplate: [
        { day: 1, session: 'Heavy Lower', type: 'strength', duration: 75 },
        { day: 2, session: 'Zone 2 (Maintenance)', type: 'cardio', duration: 40 },
        { day: 3, session: 'Heavy Upper', type: 'strength', duration: 70 },
        { day: 4, session: 'Recovery', type: 'recovery', duration: 30 },
        { day: 5, session: 'Power + Accessories', type: 'strength', duration: 60 },
        { day: 6, session: 'Easy Cardio', type: 'cardio', duration: 60 },
        { day: 7, session: 'Rest', type: 'recovery', duration: 0 }
      ]
    },
    {
      id: 'running_emphasis',
      name: 'Running Emphasis',
      icon: '🏃',
      type: 'specialty',
      category: 'cardio',
      duration: { min: 4, max: 8, unit: 'weeks' },
      description: 'Improve running performance and aerobic capacity',
      when_to_use: ['5-mile time regressed', 'Running-heavy event coming', 'AeT/AnT gap too wide'],
      sacrifice: ['Strength gains will plateau', 'Muscle mass may decrease'],
      exit_criteria: ['Run test improved', 'AeT pace improved by 30+ sec/mile', 'Event completed'],
      weeklyTemplate: [
        { day: 1, session: 'Tempo Run', type: 'cardio', duration: 50 },
        { day: 2, session: 'Strength (Maintenance)', type: 'strength', duration: 45 },
        { day: 3, session: 'Easy Run', type: 'cardio', duration: 45 },
        { day: 4, session: 'Intervals', type: 'cardio', duration: 55 },
        { day: 5, session: 'Easy Run + Strides', type: 'cardio', duration: 40 },
        { day: 6, session: 'Long Run', type: 'long_effort', duration: 90 },
        { day: 7, session: 'Rest', type: 'recovery', duration: 0 }
      ]
    },
    {
      id: 'me_peak',
      name: 'Muscular Endurance Peak',
      icon: '⛰️',
      type: 'specialty',
      category: 'endurance',
      duration: { min: 3, max: 5, unit: 'weeks' },
      description: 'Peak loaded carrying capacity',
      when_to_use: ['Event requiring sustained load', 'Pre-expedition ME peak', 'Testing max capacity'],
      sacrifice: ['Max strength will decrease', 'Power output reduced', 'Need extra recovery'],
      exit_criteria: ['ME test improved', 'Completed target ruck weight/distance', 'Event date reached'],
      weeklyTemplate: [
        { day: 1, session: 'Gym ME Circuit', type: 'muscular_endurance', duration: 70 },
        { day: 2, session: 'Zone 2', type: 'cardio', duration: 45 },
        { day: 3, session: 'Outdoor Loaded Carry', type: 'muscular_endurance', duration: 90 },
        { day: 4, session: 'Recovery', type: 'recovery', duration: 30 },
        { day: 5, session: 'Light Strength', type: 'strength', duration: 40 },
        { day: 6, session: 'Peak ME Session', type: 'muscular_endurance', duration: 120 },
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
      icon: '🩹',
      type: 'life',
      category: 'recovery',
      duration: { min: 2, max: 8, unit: 'weeks' },
      description: 'Gradual return to training after injury',
      when_to_use: ['Returning from injury', 'Medical clearance received', 'Pain-free in daily activities'],
      exit_criteria: ['Pain-free under load', 'Passed movement screens', 'Back to baseline strength'],
      weeklyTemplate: [
        { day: 1, session: 'Movement Assessment', type: 'strength', duration: 45 },
        { day: 2, session: 'Easy Cardio', type: 'cardio', duration: 30 },
        { day: 3, session: 'Rehab + Light Strength', type: 'strength', duration: 40 },
        { day: 4, session: 'Rest or Mobility', type: 'recovery', duration: 20 },
        { day: 5, session: 'Progressive Load Test', type: 'strength', duration: 45 },
        { day: 6, session: 'Easy Movement', type: 'cardio', duration: 60 },
        { day: 7, session: 'Rest', type: 'recovery', duration: 0 }
      ]
    },
    {
      id: 'mental_reset',
      name: 'Mental Reset',
      icon: '🧘',
      type: 'life',
      category: 'recovery',
      duration: { min: 1, max: 3, unit: 'weeks' },
      description: 'Recovery from burnout and motivation loss',
      when_to_use: ['Burnout symptoms', 'Zero motivation', 'Life stress overwhelming'],
      exit_criteria: ['Feel excited to train again', 'Energy levels restored', 'Sleep quality improved'],
      weeklyTemplate: [
        { day: 1, session: 'Optional Movement', type: 'recovery', duration: 30 },
        { day: 2, session: 'Optional Movement', type: 'recovery', duration: 30 },
        { day: 3, session: 'Optional Movement', type: 'recovery', duration: 30 },
        { day: 4, session: 'Optional Movement', type: 'recovery', duration: 30 },
        { day: 5, session: 'Optional Movement', type: 'recovery', duration: 30 },
        { day: 6, session: 'Outdoor Activity', type: 'recovery', duration: 60 },
        { day: 7, session: 'Rest', type: 'recovery', duration: 0 }
      ]
    },
    {
      id: 'field_maintenance',
      name: 'Field/Travel Maintenance',
      icon: '🎒',
      type: 'life',
      category: 'situational',
      duration: { min: 1, max: 52, unit: 'weeks' },
      description: 'Maintain fitness with limited equipment',
      when_to_use: ['Deployed/traveling', 'No gym access', 'Limited equipment'],
      exit_criteria: ['Back to normal gym access', 'Trip/deployment ended', 'Equipment available again'],
      weeklyTemplate: [
        { day: 1, session: 'Bodyweight Strength', type: 'strength', duration: 40 },
        { day: 2, session: 'Run or Ruck', type: 'cardio', duration: 45 },
        { day: 3, session: 'Hotel Room Circuit', type: 'strength', duration: 30 },
        { day: 4, session: 'Easy Movement', type: 'recovery', duration: 30 },
        { day: 5, session: 'Bodyweight + Core', type: 'strength', duration: 40 },
        { day: 6, session: 'Long Cardio', type: 'cardio', duration: 60 },
        { day: 7, session: 'Rest', type: 'recovery', duration: 0 }
      ]
    },
    {
      id: 'pre_event_taper',
      name: 'Pre-Event Taper',
      icon: '🎯',
      type: 'life',
      category: 'performance',
      duration: { min: 1, max: 3, unit: 'weeks' },
      description: 'Peak performance for upcoming event',
      when_to_use: ['1-3 weeks before major event', 'Need to peak performance', 'Competition prep'],
      exit_criteria: ['Event completed', 'Feel fresh and ready', 'Taper period complete'],
      weeklyTemplate: [
        { day: 1, session: 'Reduced Volume Strength', type: 'strength', duration: 40 },
        { day: 2, session: 'Light Cardio', type: 'cardio', duration: 30 },
        { day: 3, session: 'Event-Specific Practice', type: 'strength', duration: 45 },
        { day: 4, session: 'Rest', type: 'recovery', duration: 0 },
        { day: 5, session: 'Activation Session', type: 'strength', duration: 30 },
        { day: 6, session: 'Easy Movement', type: 'recovery', duration: 20 },
        { day: 7, session: 'Rest', type: 'recovery', duration: 0 }
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
};
