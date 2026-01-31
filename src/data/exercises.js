// Exercise Library - 150+ exercises organized by movement pattern
//
// Exercise Categories:
// - competition: Main competition lifts (squat, bench, deadlift for powerlifting)
// - variation: Close variations of competition lifts (good for transmutation)
// - accessory: Isolation and supplementary work
// - gpp: General physical preparation (carries, conditioning)

// Category constants for filtering exercises by block phase type
export const EXERCISE_CATEGORIES = {
  competition: { id: 'competition', name: 'Competition', description: 'Main competition lifts - prioritize in Realization phase' },
  variation: { id: 'variation', name: 'Variation', description: 'Close variations of main lifts - good for Transmutation phase' },
  accessory: { id: 'accessory', name: 'Accessory', description: 'Supplementary and isolation work - use throughout all phases' },
  gpp: { id: 'gpp', name: 'GPP', description: 'General physical preparation - prioritize in Accumulation phase' }
};

// Recommended categories by block phase type (for soft filtering)
export const PHASE_CATEGORY_RECOMMENDATIONS = {
  accumulation: ['gpp', 'accessory', 'variation'],  // Build work capacity, volume
  transmutation: ['variation', 'accessory', 'competition'],  // Sport-specific, intensity
  realization: ['competition', 'variation']  // Peak performance, competition lifts
};

export const EXERCISE_LIBRARY = {
  // === HIP HINGE ===
  trapBarDeadlift: { id: 'trapBarDeadlift', name: 'Trap Bar Deadlift', pattern: 'hipHinge', equipment: ['trapBar'], muscles: ['glutes', 'hamstrings', 'back', 'quads'], prKey: 'trapBarDeadlift', category: 'variation' },
  conventionalDeadlift: { id: 'conventionalDeadlift', name: 'Conventional Deadlift', pattern: 'hipHinge', equipment: ['barbell'], muscles: ['glutes', 'hamstrings', 'back'], category: 'competition' },
  sumoDeadlift: { id: 'sumoDeadlift', name: 'Sumo Deadlift', pattern: 'hipHinge', equipment: ['barbell'], muscles: ['glutes', 'hamstrings', 'quads', 'adductors'], category: 'competition' },
  romanianDeadlift: { id: 'romanianDeadlift', name: 'Romanian Deadlift', pattern: 'hipHinge', equipment: ['barbell', 'dumbbell'], muscles: ['hamstrings', 'glutes'], category: 'variation' },
  stiffLegDeadlift: { id: 'stiffLegDeadlift', name: 'Stiff Leg Deadlift', pattern: 'hipHinge', equipment: ['barbell', 'dumbbell'], muscles: ['hamstrings', 'glutes', 'back'], category: 'variation' },
  kettlebellSwing: { id: 'kettlebellSwing', name: 'Kettlebell Swing', pattern: 'hipHinge', equipment: ['kettlebell'], muscles: ['glutes', 'hamstrings', 'core'], category: 'gpp' },
  hipThrust: { id: 'hipThrust', name: 'Hip Thrust', pattern: 'hipHinge', equipment: ['barbell', 'bench'], muscles: ['glutes'], category: 'accessory' },
  machineHipThrust: { id: 'machineHipThrust', name: 'Machine Hip Thrust', pattern: 'hipHinge', equipment: ['machine'], muscles: ['glutes'], category: 'accessory' },
  goodMorning: { id: 'goodMorning', name: 'Good Morning', pattern: 'hipHinge', equipment: ['barbell'], muscles: ['hamstrings', 'back'], category: 'variation' },
  cableKickback: { id: 'cableKickback', name: 'Cable Kickback', pattern: 'hipHinge', equipment: ['cable'], muscles: ['glutes'], category: 'accessory' },
  gluteHamRaise: { id: 'gluteHamRaise', name: 'Glute Ham Raise', pattern: 'hipHinge', equipment: ['machine'], muscles: ['hamstrings', 'glutes'], category: 'accessory' },
  reverseHyper: { id: 'reverseHyper', name: 'Reverse Hyperextension', pattern: 'hipHinge', equipment: ['machine'], muscles: ['glutes', 'hamstrings', 'back'], category: 'accessory' },
  backExtension: { id: 'backExtension', name: 'Back Extension', pattern: 'hipHinge', equipment: ['machine', 'bodyweight'], muscles: ['back', 'glutes', 'hamstrings'], category: 'accessory' },
  pullThrough: { id: 'pullThrough', name: 'Cable Pull-Through', pattern: 'hipHinge', equipment: ['cable'], muscles: ['glutes', 'hamstrings'], category: 'accessory' },

  // === SQUAT ===
  backSquat: { id: 'backSquat', name: 'Back Squat', pattern: 'squat', equipment: ['barbell'], muscles: ['quads', 'glutes'], prKey: 'backSquat', category: 'competition' },
  frontSquat: { id: 'frontSquat', name: 'Front Squat', pattern: 'squat', equipment: ['barbell'], muscles: ['quads', 'core'], prKey: 'frontSquat', category: 'variation' },
  safetyBarSquat: { id: 'safetyBarSquat', name: 'Safety Bar Squat', pattern: 'squat', equipment: ['barbell'], muscles: ['quads', 'glutes', 'core'], category: 'variation' },
  gobletSquat: { id: 'gobletSquat', name: 'Goblet Squat', pattern: 'squat', equipment: ['kettlebell', 'dumbbell'], muscles: ['quads', 'glutes'], category: 'accessory' },
  zercher_squat: { id: 'zercher_squat', name: 'Zercher Squat', pattern: 'squat', equipment: ['barbell'], muscles: ['quads', 'glutes', 'core'], category: 'variation' },
  legPress: { id: 'legPress', name: 'Leg Press', pattern: 'squat', equipment: ['machine'], muscles: ['quads', 'glutes'], category: 'accessory' },
  legPressWide: { id: 'legPressWide', name: 'Leg Press (Wide Stance)', pattern: 'squat', equipment: ['machine'], muscles: ['quads', 'glutes', 'adductors'], category: 'accessory' },
  hackSquat: { id: 'hackSquat', name: 'Hack Squat', pattern: 'squat', equipment: ['machine'], muscles: ['quads'], category: 'accessory' },
  pendulumSquat: { id: 'pendulumSquat', name: 'Pendulum Squat', pattern: 'squat', equipment: ['machine'], muscles: ['quads', 'glutes'], category: 'accessory' },
  vSquat: { id: 'vSquat', name: 'V-Squat', pattern: 'squat', equipment: ['machine'], muscles: ['quads', 'glutes'], category: 'accessory' },
  smithSquat: { id: 'smithSquat', name: 'Smith Machine Squat', pattern: 'squat', equipment: ['machine'], muscles: ['quads', 'glutes'], category: 'accessory' },
  beltSquat: { id: 'beltSquat', name: 'Belt Squat', pattern: 'squat', equipment: ['machine'], muscles: ['quads', 'glutes'], category: 'variation' },

  // === LUNGE/SINGLE LEG ===
  boxStepUp: { id: 'boxStepUp', name: 'Box Step-Up', pattern: 'lunge', equipment: ['box', 'dumbbell'], muscles: ['quads', 'glutes'], prKey: 'boxStepUp', category: 'accessory' },
  walkingLunge: { id: 'walkingLunge', name: 'Walking Lunge', pattern: 'lunge', equipment: ['bodyweight', 'dumbbell'], muscles: ['quads', 'glutes'], category: 'accessory' },
  reverseLunge: { id: 'reverseLunge', name: 'Reverse Lunge', pattern: 'lunge', equipment: ['bodyweight', 'dumbbell', 'barbell'], muscles: ['quads', 'glutes'], category: 'accessory' },
  lateralLunge: { id: 'lateralLunge', name: 'Lateral Lunge', pattern: 'lunge', equipment: ['bodyweight', 'dumbbell'], muscles: ['quads', 'glutes', 'adductors'], category: 'accessory' },
  curtsy_lunge: { id: 'curtsy_lunge', name: 'Curtsy Lunge', pattern: 'lunge', equipment: ['bodyweight', 'dumbbell'], muscles: ['glutes', 'quads'], category: 'accessory' },
  bulgarianSplitSquat: { id: 'bulgarianSplitSquat', name: 'Bulgarian Split Squat', pattern: 'lunge', equipment: ['bench', 'dumbbell'], muscles: ['quads', 'glutes'], category: 'accessory' },
  singleLegRDL: { id: 'singleLegRDL', name: 'Single Leg RDL', pattern: 'lunge', equipment: ['dumbbell', 'kettlebell'], muscles: ['hamstrings', 'glutes'], category: 'accessory' },
  singleLegPress: { id: 'singleLegPress', name: 'Single Leg Press', pattern: 'lunge', equipment: ['machine'], muscles: ['quads', 'glutes'], category: 'accessory' },
  singleLegLegCurl: { id: 'singleLegLegCurl', name: 'Single Leg Curl', pattern: 'lunge', equipment: ['machine'], muscles: ['hamstrings'], category: 'accessory' },
  pistolSquat: { id: 'pistolSquat', name: 'Pistol Squat', pattern: 'lunge', equipment: ['bodyweight'], muscles: ['quads', 'glutes'], category: 'accessory' },
  splitSquat: { id: 'splitSquat', name: 'Split Squat', pattern: 'lunge', equipment: ['bodyweight', 'dumbbell'], muscles: ['quads', 'glutes'], category: 'accessory' },

  // === HORIZONTAL PUSH ===
  benchPress: { id: 'benchPress', name: 'Bench Press', pattern: 'horizontalPush', equipment: ['barbell', 'bench'], muscles: ['chest', 'triceps', 'shoulders'], prKey: 'benchPress', category: 'competition' },
  inclineBenchPress: { id: 'inclineBenchPress', name: 'Incline Bench Press', pattern: 'horizontalPush', equipment: ['barbell', 'bench'], muscles: ['chest', 'shoulders'], category: 'variation' },
  declineBenchPress: { id: 'declineBenchPress', name: 'Decline Bench Press', pattern: 'horizontalPush', equipment: ['barbell', 'bench'], muscles: ['chest', 'triceps'], category: 'variation' },
  closeGripBench: { id: 'closeGripBench', name: 'Close Grip Bench Press', pattern: 'horizontalPush', equipment: ['barbell', 'bench'], muscles: ['triceps', 'chest'], category: 'variation' },
  dbBenchPress: { id: 'dbBenchPress', name: 'DB Bench Press', pattern: 'horizontalPush', equipment: ['dumbbell', 'bench'], muscles: ['chest', 'triceps'], category: 'variation' },
  dbInclineBenchPress: { id: 'dbInclineBenchPress', name: 'DB Incline Bench Press', pattern: 'horizontalPush', equipment: ['dumbbell', 'bench'], muscles: ['chest', 'shoulders'], category: 'accessory' },
  pushUp: { id: 'pushUp', name: 'Push-Up', pattern: 'horizontalPush', equipment: ['bodyweight'], muscles: ['chest', 'triceps', 'core'], category: 'gpp' },
  diamondPushUp: { id: 'diamondPushUp', name: 'Diamond Push-Up', pattern: 'horizontalPush', equipment: ['bodyweight'], muscles: ['triceps', 'chest'], category: 'accessory' },
  chestDip: { id: 'chestDip', name: 'Dip', pattern: 'horizontalPush', equipment: ['bodyweight'], muscles: ['chest', 'triceps'], prKey: 'weightedDip', category: 'variation' },
  machineChestPress: { id: 'machineChestPress', name: 'Machine Chest Press', pattern: 'horizontalPush', equipment: ['machine'], muscles: ['chest', 'triceps', 'shoulders'], category: 'accessory' },
  machineInclinePress: { id: 'machineInclinePress', name: 'Machine Incline Press', pattern: 'horizontalPush', equipment: ['machine'], muscles: ['chest', 'shoulders'], category: 'accessory' },
  smithBenchPress: { id: 'smithBenchPress', name: 'Smith Machine Bench Press', pattern: 'horizontalPush', equipment: ['machine'], muscles: ['chest', 'triceps', 'shoulders'], category: 'accessory' },
  cableChestPress: { id: 'cableChestPress', name: 'Cable Chest Press', pattern: 'horizontalPush', equipment: ['cable'], muscles: ['chest', 'triceps'], category: 'accessory' },
  chestFly: { id: 'chestFly', name: 'Dumbbell Chest Fly', pattern: 'horizontalPush', equipment: ['dumbbell', 'bench'], muscles: ['chest'], category: 'accessory' },
  inclineChestFly: { id: 'inclineChestFly', name: 'Incline Dumbbell Fly', pattern: 'horizontalPush', equipment: ['dumbbell', 'bench'], muscles: ['chest'], category: 'accessory' },
  cableFly: { id: 'cableFly', name: 'Cable Fly', pattern: 'horizontalPush', equipment: ['cable'], muscles: ['chest'], category: 'accessory' },
  pecDeck: { id: 'pecDeck', name: 'Pec Deck Machine', pattern: 'horizontalPush', equipment: ['machine'], muscles: ['chest'], category: 'accessory' },

  // === HORIZONTAL PULL ===
  barbellRow: { id: 'barbellRow', name: 'Barbell Row', pattern: 'horizontalPull', equipment: ['barbell'], muscles: ['back', 'biceps'], category: 'variation' },
  pendlayRow: { id: 'pendlayRow', name: 'Pendlay Row', pattern: 'horizontalPull', equipment: ['barbell'], muscles: ['back', 'biceps'], category: 'variation' },
  tBarRow: { id: 'tBarRow', name: 'T-Bar Row', pattern: 'horizontalPull', equipment: ['barbell'], muscles: ['back', 'biceps'], category: 'variation' },
  dbRow: { id: 'dbRow', name: 'DB Row', pattern: 'horizontalPull', equipment: ['dumbbell', 'bench'], muscles: ['back', 'biceps'], category: 'accessory' },
  meadowsRow: { id: 'meadowsRow', name: 'Meadows Row', pattern: 'horizontalPull', equipment: ['barbell'], muscles: ['back', 'biceps'], category: 'accessory' },
  cableRow: { id: 'cableRow', name: 'Cable Row', pattern: 'horizontalPull', equipment: ['cable'], muscles: ['back', 'biceps'], category: 'accessory' },
  wideGripCableRow: { id: 'wideGripCableRow', name: 'Wide Grip Cable Row', pattern: 'horizontalPull', equipment: ['cable'], muscles: ['back', 'rear delts'], category: 'accessory' },
  chestSupportedRow: { id: 'chestSupportedRow', name: 'Chest Supported Row', pattern: 'horizontalPull', equipment: ['dumbbell', 'bench'], muscles: ['back'], category: 'accessory' },
  machineRow: { id: 'machineRow', name: 'Machine Row', pattern: 'horizontalPull', equipment: ['machine'], muscles: ['back', 'biceps'], category: 'accessory' },
  hammerStrengthRow: { id: 'hammerStrengthRow', name: 'Hammer Strength Row', pattern: 'horizontalPull', equipment: ['machine'], muscles: ['back', 'biceps'], category: 'accessory' },
  invertedRow: { id: 'invertedRow', name: 'Inverted Row', pattern: 'horizontalPull', equipment: ['bodyweight', 'pullupBar'], muscles: ['back', 'biceps'], category: 'gpp' },
  sealRow: { id: 'sealRow', name: 'Seal Row', pattern: 'horizontalPull', equipment: ['dumbbell', 'bench'], muscles: ['back'], category: 'accessory' },

  // === VERTICAL PUSH ===
  overheadPress: { id: 'overheadPress', name: 'Overhead Press', pattern: 'verticalPush', equipment: ['barbell'], muscles: ['shoulders', 'triceps'], prKey: 'overheadPress', category: 'competition' },
  seatedOHP: { id: 'seatedOHP', name: 'Seated Overhead Press', pattern: 'verticalPush', equipment: ['barbell', 'bench'], muscles: ['shoulders', 'triceps'], category: 'variation' },
  dbShoulderPress: { id: 'dbShoulderPress', name: 'DB Shoulder Press', pattern: 'verticalPush', equipment: ['dumbbell'], muscles: ['shoulders', 'triceps'], category: 'variation' },
  seatedDbShoulderPress: { id: 'seatedDbShoulderPress', name: 'Seated DB Shoulder Press', pattern: 'verticalPush', equipment: ['dumbbell', 'bench'], muscles: ['shoulders', 'triceps'], category: 'accessory' },
  pushPress: { id: 'pushPress', name: 'Push Press', pattern: 'verticalPush', equipment: ['barbell'], muscles: ['shoulders', 'triceps', 'legs'], category: 'variation' },
  arnoldPress: { id: 'arnoldPress', name: 'Arnold Press', pattern: 'verticalPush', equipment: ['dumbbell'], muscles: ['shoulders'], category: 'accessory' },
  pikePushUp: { id: 'pikePushUp', name: 'Pike Push-Up', pattern: 'verticalPush', equipment: ['bodyweight'], muscles: ['shoulders', 'triceps'], category: 'gpp' },
  handstandPushUp: { id: 'handstandPushUp', name: 'Handstand Push-Up', pattern: 'verticalPush', equipment: ['bodyweight'], muscles: ['shoulders', 'triceps'], category: 'gpp' },
  machineShoulderPress: { id: 'machineShoulderPress', name: 'Machine Shoulder Press', pattern: 'verticalPush', equipment: ['machine'], muscles: ['shoulders', 'triceps'], category: 'accessory' },
  smithShoulderPress: { id: 'smithShoulderPress', name: 'Smith Machine Shoulder Press', pattern: 'verticalPush', equipment: ['machine'], muscles: ['shoulders', 'triceps'], category: 'accessory' },
  landminePress: { id: 'landminePress', name: 'Landmine Press', pattern: 'verticalPush', equipment: ['barbell'], muscles: ['shoulders', 'chest'], category: 'accessory' },
  lateralRaise: { id: 'lateralRaise', name: 'Lateral Raise', pattern: 'verticalPush', equipment: ['dumbbell'], muscles: ['shoulders'], category: 'accessory' },
  cableLateralRaise: { id: 'cableLateralRaise', name: 'Cable Lateral Raise', pattern: 'verticalPush', equipment: ['cable'], muscles: ['shoulders'], category: 'accessory' },
  machineLateralRaise: { id: 'machineLateralRaise', name: 'Machine Lateral Raise', pattern: 'verticalPush', equipment: ['machine'], muscles: ['shoulders'], category: 'accessory' },
  frontRaise: { id: 'frontRaise', name: 'Front Raise', pattern: 'verticalPush', equipment: ['dumbbell'], muscles: ['shoulders'], category: 'accessory' },

  // === VERTICAL PULL ===
  pullUp: { id: 'pullUp', name: 'Pull-Up', pattern: 'verticalPull', equipment: ['pullupBar'], muscles: ['back', 'biceps'], prKey: 'weightedPullUp', category: 'competition' },
  chinUp: { id: 'chinUp', name: 'Chin-Up', pattern: 'verticalPull', equipment: ['pullupBar'], muscles: ['back', 'biceps'], category: 'variation' },
  neutralGripPullUp: { id: 'neutralGripPullUp', name: 'Neutral Grip Pull-Up', pattern: 'verticalPull', equipment: ['pullupBar'], muscles: ['back', 'biceps'], category: 'variation' },
  wideGripPullUp: { id: 'wideGripPullUp', name: 'Wide Grip Pull-Up', pattern: 'verticalPull', equipment: ['pullupBar'], muscles: ['back', 'biceps'], category: 'variation' },
  latPulldown: { id: 'latPulldown', name: 'Lat Pulldown', pattern: 'verticalPull', equipment: ['cable'], muscles: ['back', 'biceps'], category: 'accessory' },
  closeGripPulldown: { id: 'closeGripPulldown', name: 'Close Grip Pulldown', pattern: 'verticalPull', equipment: ['cable'], muscles: ['back', 'biceps'], category: 'accessory' },
  wideGripPulldown: { id: 'wideGripPulldown', name: 'Wide Grip Pulldown', pattern: 'verticalPull', equipment: ['cable'], muscles: ['back'], category: 'accessory' },
  straightArmPulldown: { id: 'straightArmPulldown', name: 'Straight Arm Pulldown', pattern: 'verticalPull', equipment: ['cable'], muscles: ['back'], category: 'accessory' },
  assistedPullUp: { id: 'assistedPullUp', name: 'Assisted Pull-Up', pattern: 'verticalPull', equipment: ['machine', 'bands'], muscles: ['back', 'biceps'], category: 'accessory' },
  machinePullover: { id: 'machinePullover', name: 'Machine Pullover', pattern: 'verticalPull', equipment: ['machine'], muscles: ['back', 'chest'], category: 'accessory' },

  // === CARRY ===
  farmerCarry: { id: 'farmerCarry', name: "Farmer's Carry", pattern: 'carry', equipment: ['dumbbell', 'kettlebell'], muscles: ['grip', 'core', 'traps'], category: 'gpp' },
  suitcaseCarry: { id: 'suitcaseCarry', name: 'Suitcase Carry', pattern: 'carry', equipment: ['dumbbell', 'kettlebell'], muscles: ['core', 'grip'], category: 'gpp' },
  overheadCarry: { id: 'overheadCarry', name: 'Overhead Carry', pattern: 'carry', equipment: ['dumbbell', 'kettlebell'], muscles: ['shoulders', 'core'], category: 'gpp' },
  rackCarry: { id: 'rackCarry', name: 'Rack Carry', pattern: 'carry', equipment: ['kettlebell'], muscles: ['core', 'shoulders'], category: 'gpp' },
  ruckMarch: { id: 'ruckMarch', name: 'Ruck March', pattern: 'carry', equipment: ['none'], muscles: ['legs', 'core', 'back'], category: 'gpp' },
  sandbagCarry: { id: 'sandbagCarry', name: 'Sandbag Carry', pattern: 'carry', equipment: ['none'], muscles: ['full body'], category: 'gpp' },
  trapBarCarry: { id: 'trapBarCarry', name: 'Trap Bar Carry', pattern: 'carry', equipment: ['trapBar'], muscles: ['grip', 'traps', 'core'], category: 'gpp' },
  yoke_walk: { id: 'yoke_walk', name: 'Yoke Walk', pattern: 'carry', equipment: ['none'], muscles: ['full body'], category: 'gpp' },

  // === CORE ===
  plank: { id: 'plank', name: 'Plank', pattern: 'core', equipment: ['bodyweight'], muscles: ['core'], category: 'accessory' },
  sidePlank: { id: 'sidePlank', name: 'Side Plank', pattern: 'core', equipment: ['bodyweight'], muscles: ['core', 'obliques'], category: 'accessory' },
  deadBug: { id: 'deadBug', name: 'Dead Bug', pattern: 'core', equipment: ['bodyweight'], muscles: ['core'], category: 'accessory' },
  birdDog: { id: 'birdDog', name: 'Bird Dog', pattern: 'core', equipment: ['bodyweight'], muscles: ['core', 'back'], category: 'accessory' },
  pallofPress: { id: 'pallofPress', name: 'Pallof Press', pattern: 'core', equipment: ['cable', 'bands'], muscles: ['core', 'obliques'], category: 'accessory' },
  hangingLegRaise: { id: 'hangingLegRaise', name: 'Hanging Leg Raise', pattern: 'core', equipment: ['pullupBar'], muscles: ['core'], category: 'accessory' },
  hangingKneeRaise: { id: 'hangingKneeRaise', name: 'Hanging Knee Raise', pattern: 'core', equipment: ['pullupBar'], muscles: ['core'], category: 'accessory' },
  abWheel: { id: 'abWheel', name: 'Ab Wheel Rollout', pattern: 'core', equipment: ['none'], muscles: ['core'], category: 'accessory' },
  cableCrunch: { id: 'cableCrunch', name: 'Cable Crunch', pattern: 'core', equipment: ['cable'], muscles: ['core'], category: 'accessory' },
  cableWoodchop: { id: 'cableWoodchop', name: 'Cable Woodchop', pattern: 'core', equipment: ['cable'], muscles: ['core', 'obliques'], category: 'accessory' },
  russianTwist: { id: 'russianTwist', name: 'Russian Twist', pattern: 'core', equipment: ['bodyweight', 'dumbbell'], muscles: ['core', 'obliques'], category: 'accessory' },
  legRaise: { id: 'legRaise', name: 'Leg Raise', pattern: 'core', equipment: ['bodyweight'], muscles: ['core'], category: 'accessory' },
  sitUp: { id: 'sitUp', name: 'Sit-Up', pattern: 'core', equipment: ['bodyweight'], muscles: ['core'], category: 'accessory' },
  crunch: { id: 'crunch', name: 'Crunch', pattern: 'core', equipment: ['bodyweight'], muscles: ['core'], category: 'accessory' },
  machineCrunch: { id: 'machineCrunch', name: 'Machine Crunch', pattern: 'core', equipment: ['machine'], muscles: ['core'], category: 'accessory' },
  declineSitUp: { id: 'declineSitUp', name: 'Decline Sit-Up', pattern: 'core', equipment: ['bench'], muscles: ['core'], category: 'accessory' },

  // === ACCESSORIES - REAR DELTS ===
  facePull: { id: 'facePull', name: 'Face Pull', pattern: 'accessory', equipment: ['cable', 'bands'], muscles: ['rear delts', 'rotator cuff'], category: 'accessory' },
  rearDeltFly: { id: 'rearDeltFly', name: 'Rear Delt Fly', pattern: 'accessory', equipment: ['dumbbell'], muscles: ['rear delts'], category: 'accessory' },
  reversePecDeck: { id: 'reversePecDeck', name: 'Reverse Pec Deck', pattern: 'accessory', equipment: ['machine'], muscles: ['rear delts'], category: 'accessory' },
  cableRearDeltFly: { id: 'cableRearDeltFly', name: 'Cable Rear Delt Fly', pattern: 'accessory', equipment: ['cable'], muscles: ['rear delts'], category: 'accessory' },

  // === ACCESSORIES - BICEPS ===
  barbellCurl: { id: 'barbellCurl', name: 'Barbell Curl', pattern: 'accessory', equipment: ['barbell'], muscles: ['biceps'], category: 'accessory' },
  ezBarCurl: { id: 'ezBarCurl', name: 'EZ Bar Curl', pattern: 'accessory', equipment: ['barbell'], muscles: ['biceps'], category: 'accessory' },
  dumbbellCurl: { id: 'dumbbellCurl', name: 'Dumbbell Curl', pattern: 'accessory', equipment: ['dumbbell'], muscles: ['biceps'], category: 'accessory' },
  hammerCurl: { id: 'hammerCurl', name: 'Hammer Curl', pattern: 'accessory', equipment: ['dumbbell'], muscles: ['biceps', 'forearms'], category: 'accessory' },
  inclineCurl: { id: 'inclineCurl', name: 'Incline Dumbbell Curl', pattern: 'accessory', equipment: ['dumbbell', 'bench'], muscles: ['biceps'], category: 'accessory' },
  preacherCurl: { id: 'preacherCurl', name: 'Preacher Curl', pattern: 'accessory', equipment: ['barbell', 'dumbbell'], muscles: ['biceps'], category: 'accessory' },
  machinePreacherCurl: { id: 'machinePreacherCurl', name: 'Machine Preacher Curl', pattern: 'accessory', equipment: ['machine'], muscles: ['biceps'], category: 'accessory' },
  cableCurl: { id: 'cableCurl', name: 'Cable Curl', pattern: 'accessory', equipment: ['cable'], muscles: ['biceps'], category: 'accessory' },
  concentrationCurl: { id: 'concentrationCurl', name: 'Concentration Curl', pattern: 'accessory', equipment: ['dumbbell'], muscles: ['biceps'], category: 'accessory' },
  spiderCurl: { id: 'spiderCurl', name: 'Spider Curl', pattern: 'accessory', equipment: ['dumbbell', 'barbell'], muscles: ['biceps'], category: 'accessory' },

  // === ACCESSORIES - TRICEPS ===
  tricepPushdown: { id: 'tricepPushdown', name: 'Tricep Pushdown', pattern: 'accessory', equipment: ['cable'], muscles: ['triceps'], category: 'accessory' },
  ropeTriPushdown: { id: 'ropeTriPushdown', name: 'Rope Tricep Pushdown', pattern: 'accessory', equipment: ['cable'], muscles: ['triceps'], category: 'accessory' },
  overheadTricepExtension: { id: 'overheadTricepExtension', name: 'Overhead Tricep Extension', pattern: 'accessory', equipment: ['dumbbell', 'cable'], muscles: ['triceps'], category: 'accessory' },
  skullCrusher: { id: 'skullCrusher', name: 'Skull Crusher', pattern: 'accessory', equipment: ['barbell', 'dumbbell'], muscles: ['triceps'], category: 'accessory' },
  tricepKickback: { id: 'tricepKickback', name: 'Tricep Kickback', pattern: 'accessory', equipment: ['dumbbell', 'cable'], muscles: ['triceps'], category: 'accessory' },
  machineTricepDip: { id: 'machineTricepDip', name: 'Machine Tricep Dip', pattern: 'accessory', equipment: ['machine'], muscles: ['triceps'], category: 'accessory' },
  benchDip: { id: 'benchDip', name: 'Bench Dip', pattern: 'accessory', equipment: ['bench'], muscles: ['triceps'], category: 'accessory' },

  // === ACCESSORIES - FOREARMS/GRIP ===
  wristCurl: { id: 'wristCurl', name: 'Wrist Curl', pattern: 'accessory', equipment: ['dumbbell', 'barbell'], muscles: ['forearms'], category: 'accessory' },
  reverseWristCurl: { id: 'reverseWristCurl', name: 'Reverse Wrist Curl', pattern: 'accessory', equipment: ['dumbbell', 'barbell'], muscles: ['forearms'], category: 'accessory' },
  farmerHold: { id: 'farmerHold', name: 'Farmer Hold', pattern: 'accessory', equipment: ['dumbbell', 'kettlebell'], muscles: ['grip', 'forearms'], category: 'accessory' },
  deadHang: { id: 'deadHang', name: 'Dead Hang', pattern: 'accessory', equipment: ['pullupBar'], muscles: ['grip', 'shoulders'], category: 'accessory' },
  plateHold: { id: 'plateHold', name: 'Plate Pinch Hold', pattern: 'accessory', equipment: ['none'], muscles: ['grip'], category: 'accessory' },

  // === ACCESSORIES - CALVES ===
  standingCalfRaise: { id: 'standingCalfRaise', name: 'Standing Calf Raise', pattern: 'accessory', equipment: ['machine'], muscles: ['calves'], category: 'accessory' },
  seatedCalfRaise: { id: 'seatedCalfRaise', name: 'Seated Calf Raise', pattern: 'accessory', equipment: ['machine'], muscles: ['calves'], category: 'accessory' },
  legPressCalfRaise: { id: 'legPressCalfRaise', name: 'Leg Press Calf Raise', pattern: 'accessory', equipment: ['machine'], muscles: ['calves'], category: 'accessory' },
  singleLegCalfRaise: { id: 'singleLegCalfRaise', name: 'Single Leg Calf Raise', pattern: 'accessory', equipment: ['bodyweight'], muscles: ['calves'], category: 'accessory' },

  // === MACHINES - LEGS ===
  legExtension: { id: 'legExtension', name: 'Leg Extension', pattern: 'accessory', equipment: ['machine'], muscles: ['quads'], category: 'accessory' },
  legCurl: { id: 'legCurl', name: 'Lying Leg Curl', pattern: 'accessory', equipment: ['machine'], muscles: ['hamstrings'], category: 'accessory' },
  seatedLegCurl: { id: 'seatedLegCurl', name: 'Seated Leg Curl', pattern: 'accessory', equipment: ['machine'], muscles: ['hamstrings'], category: 'accessory' },
  hipAbductor: { id: 'hipAbductor', name: 'Hip Abductor Machine', pattern: 'accessory', equipment: ['machine'], muscles: ['glutes', 'abductors'], category: 'accessory' },
  hipAdductor: { id: 'hipAdductor', name: 'Hip Adductor Machine', pattern: 'accessory', equipment: ['machine'], muscles: ['adductors'], category: 'accessory' },

  // === MACHINES - UPPER BODY ===
  chestPressMachine: { id: 'chestPressMachine', name: 'Chest Press Machine', pattern: 'horizontalPush', equipment: ['machine'], muscles: ['chest', 'triceps', 'shoulders'], category: 'accessory' },
  converging_chest_press: { id: 'converging_chest_press', name: 'Converging Chest Press', pattern: 'horizontalPush', equipment: ['machine'], muscles: ['chest', 'triceps'], category: 'accessory' },

  // === CARDIO ===
  run: { id: 'run', name: 'Run', pattern: 'cardio', equipment: ['none'], isCardio: true, category: 'gpp' },
  treadmill: { id: 'treadmill', name: 'Treadmill', pattern: 'cardio', equipment: ['cardioMachine'], isCardio: true, category: 'gpp' },
  hike: { id: 'hike', name: 'Hike', pattern: 'cardio', equipment: ['none'], isCardio: true, category: 'gpp' },
  ruckHike: { id: 'ruckHike', name: 'Ruck Hike', pattern: 'cardio', equipment: ['none'], isCardio: true, category: 'gpp' },
  bike: { id: 'bike', name: 'Bike', pattern: 'cardio', equipment: ['cardioMachine'], isCardio: true, category: 'gpp' },
  assaultBike: { id: 'assaultBike', name: 'Assault Bike', pattern: 'cardio', equipment: ['cardioMachine'], isCardio: true, category: 'gpp' },
  spinBike: { id: 'spinBike', name: 'Spin Bike', pattern: 'cardio', equipment: ['cardioMachine'], isCardio: true, category: 'gpp' },
  rowErg: { id: 'rowErg', name: 'Row Erg', pattern: 'cardio', equipment: ['cardioMachine'], isCardio: true, category: 'gpp' },
  skiErg: { id: 'skiErg', name: 'Ski Erg', pattern: 'cardio', equipment: ['cardioMachine'], isCardio: true, category: 'gpp' },
  swim: { id: 'swim', name: 'Swim', pattern: 'cardio', equipment: ['none'], isCardio: true, category: 'gpp' },
  stairClimber: { id: 'stairClimber', name: 'Stair Climber', pattern: 'cardio', equipment: ['cardioMachine'], isCardio: true, category: 'gpp' },
  elliptical: { id: 'elliptical', name: 'Elliptical', pattern: 'cardio', equipment: ['cardioMachine'], isCardio: true, category: 'gpp' },
  jumpRope: { id: 'jumpRope', name: 'Jump Rope', pattern: 'cardio', equipment: ['none'], isCardio: true, category: 'gpp' },
  battleRopes: { id: 'battleRopes', name: 'Battle Ropes', pattern: 'cardio', equipment: ['none'], isCardio: true, category: 'gpp' },
  boxJumps: { id: 'boxJumps', name: 'Box Jumps', pattern: 'cardio', equipment: ['box'], isCardio: true, category: 'gpp' },
  burpees: { id: 'burpees', name: 'Burpees', pattern: 'cardio', equipment: ['bodyweight'], isCardio: true, category: 'gpp' },
  mountainClimbers: { id: 'mountainClimbers', name: 'Mountain Climbers', pattern: 'cardio', equipment: ['bodyweight'], isCardio: true, category: 'gpp' },

  // === MOBILITY ===
  pigeonPose: { id: 'pigeonPose', name: 'Pigeon Pose', pattern: 'mobility', equipment: ['bodyweight'], isMobility: true, category: 'gpp' },
  worldsGreatestStretch: { id: 'worldsGreatestStretch', name: "World's Greatest Stretch", pattern: 'mobility', equipment: ['bodyweight'], isMobility: true, category: 'gpp' },
  catCow: { id: 'catCow', name: 'Cat-Cow', pattern: 'mobility', equipment: ['bodyweight'], isMobility: true, category: 'gpp' },
  thoracicRotation: { id: 'thoracicRotation', name: 'Thoracic Rotation', pattern: 'mobility', equipment: ['bodyweight'], isMobility: true, category: 'gpp' },
  hipFlexorStretch: { id: 'hipFlexorStretch', name: 'Hip Flexor Stretch', pattern: 'mobility', equipment: ['bodyweight'], isMobility: true, category: 'gpp' },
  couch_stretch: { id: 'couch_stretch', name: 'Couch Stretch', pattern: 'mobility', equipment: ['bodyweight'], isMobility: true, category: 'gpp' },
  downwardDog: { id: 'downwardDog', name: 'Downward Dog', pattern: 'mobility', equipment: ['bodyweight'], isMobility: true, category: 'gpp' },
  childsPose: { id: 'childsPose', name: "Child's Pose", pattern: 'mobility', equipment: ['bodyweight'], isMobility: true, category: 'gpp' },
  ankleCircles: { id: 'ankleCircles', name: 'Ankle Circles', pattern: 'mobility', equipment: ['bodyweight'], isMobility: true, category: 'gpp' },
  shoulderDislocates: { id: 'shoulderDislocates', name: 'Shoulder Dislocates', pattern: 'mobility', equipment: ['bands'], isMobility: true, category: 'gpp' },
  foamRoll: { id: 'foamRoll', name: 'Foam Rolling', pattern: 'mobility', equipment: ['none'], isMobility: true, category: 'gpp' },
  lacrosseBall: { id: 'lacrosseBall', name: 'Lacrosse Ball Release', pattern: 'mobility', equipment: ['none'], isMobility: true, category: 'gpp' },
};

// Equipment filter options (for UI)
export const EQUIPMENT_OPTIONS = [
  'bands', 'barbell', 'bench', 'bodyweight', 'box', 'cable',
  'dumbbell', 'kettlebell', 'machine', 'none', 'pullupBar', 'trapBar'
];
