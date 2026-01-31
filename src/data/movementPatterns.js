// Movement Patterns for exercise categorization
import { Dumbbell, Footprints, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Briefcase, Target, Wrench, Heart, PersonStanding } from 'lucide-react';

export const MOVEMENT_PATTERNS = {
  hipHinge: { id: 'hipHinge', name: 'Hip Hinge', Icon: Dumbbell },
  squat: { id: 'squat', name: 'Squat', Icon: Footprints },
  horizontalPush: { id: 'horizontalPush', name: 'Horizontal Push', Icon: ArrowRight },
  horizontalPull: { id: 'horizontalPull', name: 'Horizontal Pull', Icon: ArrowLeft },
  verticalPush: { id: 'verticalPush', name: 'Vertical Push', Icon: ArrowUp },
  verticalPull: { id: 'verticalPull', name: 'Vertical Pull', Icon: ArrowDown },
  carry: { id: 'carry', name: 'Carry', Icon: Briefcase },
  lunge: { id: 'lunge', name: 'Lunge/Single Leg', Icon: Footprints },
  core: { id: 'core', name: 'Core', Icon: Target },
  accessory: { id: 'accessory', name: 'Accessory', Icon: Wrench },
  cardio: { id: 'cardio', name: 'Cardio', Icon: Heart },
  mobility: { id: 'mobility', name: 'Mobility', Icon: PersonStanding },
};

export const EQUIPMENT_TYPES = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  kettlebell: 'Kettlebell',
  bodyweight: 'Bodyweight',
  machine: 'Machine',
  cable: 'Cable',
  bands: 'Bands',
  trapBar: 'Trap Bar',
  pullupBar: 'Pull-up Bar',
  bench: 'Bench',
  box: 'Box/Step',
  cardioMachine: 'Cardio Machine',
  none: 'None',
};
