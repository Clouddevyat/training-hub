// Data module index - re-exports all data constants

// Movement patterns and equipment
export { MOVEMENT_PATTERNS, EQUIPMENT_TYPES } from './movementPatterns';

// Exercise library
export { EXERCISE_LIBRARY, EQUIPMENT_OPTIONS } from './exercises';

// Athlete profile and benchmark tests
export {
  DEFAULT_ATHLETE_PROFILE,
  DEFAULT_READINESS,
  PR_DISPLAY_NAMES,
  BENCHMARK_DISPLAY_NAMES,
  BENCHMARK_TESTS
} from './benchmarks';

// Progression models and mesocycle templates
export {
  PROGRESSION_MODELS,
  MESO_TEMPLATES,
  isModelCompatibleWithTrack,
  getCompatibleTracks,
  getCompatibleModels,
  applyRepShift,
  calculateWeekValues,
  generateBlockPhases
} from './progressionModels';

// Cardio zones and session templates
export {
  CARDIO_ZONES,
  CARDIO_SESSION_TEMPLATES,
  calculateZones,
  calculateLoadTargets
} from './cardioZones';

// Universal detour blocks
export { UNIVERSAL_DETOURS } from './detours';
