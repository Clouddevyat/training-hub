# Program Template Format

This document describes the JSON format for creating program templates that can be uploaded to the Training Hub app.

## Basic Structure

```json
{
  "meta": {
    "id": "unique_program_id",
    "name": "Display Name",
    "description": "Brief description of the program",
    "version": "1.0",
    "type": "standalone",
    "icon": "mountain"
  },
  "phases": [...],
  "availableDetours": {
    "specialty": [...],
    "life": [...]
  }
}
```

## Required Fields

### meta (required)
- `id` - Unique identifier (no spaces, use camelCase or snake_case)
- `name` - Display name shown in the app
- `description` - Brief program description
- `version` - Version string (e.g., "1.0")
- `type` - Usually "standalone" for phase-based programs
- `icon` - Icon identifier (mountain, dumbbell, run, etc.)

### phases (required)
Array of training phases. Each phase needs:
- `id` - Unique phase identifier
- `name` - Phase display name
- `weeks` - Array of [start_week, end_week]
- `description` - Phase description
- `exitCriteria` - Array of strings describing completion criteria
- `weeklyTemplate` - Array of 7 daily workouts

## Weekly Template Format

Each day in weeklyTemplate:

```json
{
  "day": 1,
  "session": "Strength A",
  "type": "strength",
  "duration": 60,
  "prescription": {
    "warmup": "10 min easy",
    "exercises": [...],
    "cooldown": "5 min walk",
    "notes": ["Note 1", "Note 2"]
  }
}
```

### Session Types
- `strength` - Weight training
- `cardio` - Running, cycling, etc.
- `muscular_endurance` - High rep, loaded work
- `long_effort` - Long duration aerobic
- `recovery` - Rest or mobility
- `skill` - Technical skill work

### Exercise Format

```json
{
  "name": "Trap Bar Deadlift",
  "sets": 4,
  "reps": "3-5",
  "rest": "3 min",
  "prKey": "trapBarDeadlift",
  "percentage": 85
}
```

- `name` - Exercise name
- `sets` - Number of sets
- `reps` - Rep scheme (string to allow "3-5", "10/leg", etc.)
- `rest` - Rest period
- `prKey` - Key for PR tracking (optional)
- `percentage` - Percentage of 1RM (optional)

### Cardio Prescription

```json
{
  "description": "Easy conversational pace",
  "hrZone": "zone2",
  "warmup": "10 min easy",
  "mainSet": "4 x 8 min at tempo",
  "recovery": "2 min jog",
  "cooldown": "10 min easy"
}
```

## Available Detours (Optional)

### Specialty Blocks
For emphasis periods (strength, running, ME):

```json
{
  "id": "strength_emphasis",
  "name": "Strength Emphasis",
  "type": "specialty",
  "duration": { "min": 4, "max": 6, "unit": "weeks" },
  "when_to_use": ["Strength dropped >10%", "Pre-expedition peak"],
  "sacrifice": ["Aerobic sessions reduced", "ME work paused"],
  "exit_criteria": ["Hit target numbers", "Completed 4-6 weeks"],
  "return_to": "foundation",
  "weeklyTemplate": [...]
}
```

### Life Blocks
For disruptions (injury, travel, burnout):

```json
{
  "id": "field_maintenance",
  "name": "Field/Deployment",
  "type": "life",
  "duration": { "min": 1, "max": 52, "unit": "weeks" },
  "when_to_use": ["Deployed", "Limited equipment"],
  "exit_criteria": ["Return to normal environment"],
  "return_to": "foundation",
  "weeklyTemplate": [...]
}
```

## Valid prKey Values

For tracking PRs, use these keys:
- `trapBarDeadlift`
- `backSquat`
- `frontSquat`
- `benchPress`
- `overheadPress`
- `weightedPullUp`
- `weightedDip`
- `boxStepUp`
- `romanianDeadlift`

## HR Zones

- `zone1` - Recovery (very easy)
- `zone2` - Aerobic base (conversational)
- `zone3` - Tempo/threshold
- `zone4` - VO2max intervals
- `zone5` - Anaerobic/sprint

## Example: Minimal 8-Week Program

```json
{
  "meta": {
    "id": "simpleStrength",
    "name": "Simple Strength",
    "description": "8-week strength focus",
    "version": "1.0",
    "type": "standalone",
    "icon": "dumbbell"
  },
  "phases": [
    {
      "id": "build",
      "name": "Build Phase",
      "weeks": [1, 8],
      "description": "Progressive strength building",
      "exitCriteria": ["All lifts improved 5-10%"],
      "weeklyTemplate": [
        {
          "day": 1,
          "session": "Lower Body",
          "type": "strength",
          "duration": 60,
          "prescription": {
            "exercises": [
              { "name": "Back Squat", "sets": 4, "reps": "5", "percentage": 80 },
              { "name": "Romanian Deadlift", "sets": 3, "reps": "8" }
            ]
          }
        },
        {
          "day": 2,
          "session": "Easy Cardio",
          "type": "cardio",
          "duration": 30,
          "prescription": { "hrZone": "zone2" }
        },
        {
          "day": 3,
          "session": "Upper Body",
          "type": "strength",
          "duration": 60,
          "prescription": {
            "exercises": [
              { "name": "Bench Press", "sets": 4, "reps": "5", "percentage": 80 },
              { "name": "Barbell Row", "sets": 4, "reps": "6" }
            ]
          }
        },
        {
          "day": 4,
          "session": "Rest",
          "type": "recovery",
          "duration": 0,
          "prescription": { "description": "Complete rest" }
        },
        {
          "day": 5,
          "session": "Full Body",
          "type": "strength",
          "duration": 50,
          "prescription": {
            "exercises": [
              { "name": "Trap Bar Deadlift", "sets": 3, "reps": "5", "percentage": 82 },
              { "name": "Overhead Press", "sets": 3, "reps": "6" }
            ]
          }
        },
        {
          "day": 6,
          "session": "Cardio",
          "type": "cardio",
          "duration": 45,
          "prescription": { "hrZone": "zone2", "description": "Run, bike, or hike" }
        },
        {
          "day": 7,
          "session": "Rest",
          "type": "recovery",
          "duration": 0,
          "prescription": { "description": "Complete rest" }
        }
      ]
    }
  ]
}
```

## Tips for Creating Templates in Claude

1. Start with the meta section
2. Define your phases with week ranges
3. Build out the weeklyTemplate for each phase (7 days)
4. Add detours if the program needs specialty/life blocks
5. Keep exercise names consistent with the app's exercise library
6. Use percentage for strength work, hrZone for cardio
