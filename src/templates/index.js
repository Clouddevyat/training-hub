// ============== DEFAULT PROGRAM TEMPLATES ==============
// These templates ship with the app and are always available
// They cannot be deleted by cache clears or updates

import { Mountain, Dumbbell, Zap, Target, Flame, Waves, Heart, Battery, Calendar, Scale, PersonStanding, Hand } from 'lucide-react';
import combatAlpinistTemplate from './combat_alpinist.json';

// Icon mapping for templates
const ICON_MAP = {
  mountain: Mountain,
  dumbbell: Dumbbell,
  zap: Zap,
  target: Target,
  flame: Flame,
  waves: Waves,
  heart: Heart,
  battery: Battery,
  calendar: Calendar,
  scale: Scale,
  person_standing: PersonStanding,
  hand: Hand
};

// Convert a JSON template to the app's internal program format
// This is a simplified version that works with the already-correct structure
const templateToDefaultProgram = (template) => {
  const IconComponent = ICON_MAP[template.meta?.icon] || Mountain;

  return {
    id: template.meta.id,
    name: template.meta.name,
    description: template.meta.description || '',
    Icon: IconComponent,
    isDefault: true,
    isTemplate: false, // false because it's a built-in, not user-uploaded
    globalRules: template.globalRules || {},
    quarterlyTesting: template.quarterlyTesting || null,
    availableDetours: template.availableDetours ? {
      specialty: (template.availableDetours.specialty || []).map(detour => ({
        ...detour,
        Icon: ICON_MAP[detour.icon] || Dumbbell
      })),
      life: (template.availableDetours.life || []).map(detour => ({
        ...detour,
        Icon: ICON_MAP[detour.icon] || Heart
      }))
    } : { specialty: [], life: [] },
    phases: template.phases.map(phase => ({
      id: phase.id,
      name: phase.name,
      weeks: phase.weeks,
      description: phase.description || '',
      exitCriteria: phase.exitCriteria || [],
      benchmarks: phase.benchmarks || [],
      weeklyTemplate: phase.weeklyTemplate || []
    }))
  };
};

// Export the default programs
export const DEFAULT_PROGRAMS = {
  combatAlpinist: templateToDefaultProgram(combatAlpinistTemplate)
};

// Export raw templates if needed for reference
export const DEFAULT_TEMPLATES = {
  combatAlpinist: combatAlpinistTemplate
};

// Helper to get all default program IDs
export const DEFAULT_PROGRAM_IDS = Object.keys(DEFAULT_PROGRAMS);

// Helper to check if a program ID is a default
export const isDefaultProgram = (programId) => DEFAULT_PROGRAM_IDS.includes(programId);
