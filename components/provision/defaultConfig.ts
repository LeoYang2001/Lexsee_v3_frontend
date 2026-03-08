export const MODES = [
  {
    id: "FLUENCY",
    title: "Fluency",
    badge: "Recommended",
    gradientColors: ["#2e2625", "#5b2f23", "#2e2625"],
    desc: "For learners who want to master English as a long-term skill.",
    masteryTimeline: "Long-term durability (6+ months stabilization)",
    features: [
      {
        spec: "Memory Reinforcement",
        value: 0.95, // high retrieval emphasis
        note: "Heavy focus on retrieval practice",
      },
      {
        spec: "Long-Term Reliability",
        value: 0.95,
        note: "Designed for durable memory consolidation",
      },
      {
        spec: "Learning Pace",
        value: 0.4, // slower new-word injection
        note: "Fewer new words, deeper consolidation",
      },

      {
        spec: "Daily Intensity",
        value: 0.35,
        note: "Calm and sustainable workload",
      },
    ],
  },
  {
    id: "BALANCED",
    title: "Steady",
    gradientColors: ["#99b2b9", "#c0beb3", "#88969c"],

    desc: "For learners who want consistent improvement without high daily pressure.",
    masteryTimeline: "Moderate durability (3–4 months stabilization)",
    features: [
      {
        spec: "Memory Reinforcement",
        value: 0.75,
        note: "Strong but flexible retrieval focus",
      },
      {
        spec: "Long-Term Reliability",
        value: 0.8,
        note: "Strong long-term retention",
      },
      {
        spec: "Learning Pace",
        value: 0.6,
        note: "Balanced new-word introduction",
      },

      {
        spec: "Daily Intensity",
        value: 0.55,
        note: "Moderate workload",
      },
    ],
  },
  {
    id: "EXAM_READY",
    title: "Sprint",
    gradientColors: ["#6b7a96", "#a4aac2", "#6b7a96"],

    desc: "For learners preparing for an upcoming exam or short-term goal and willing to study intensively.",
    masteryTimeline: "Short-term stabilization (1–2 months)",
    features: [
      {
        spec: "Memory Reinforcement",
        value: 0.6,
        note: "Retrieval balanced with rapid exposure",
      },
      {
        spec: "Long-Term Reliability",
        value: 0.7,
        note: "Optimized for short-term performance",
      },
      {
        spec: "Learning Pace",
        value: 0.9,
        note: "Aggressive new-word intake",
      },

      {
        spec: "Daily Intensity",
        value: 0.8,
        note: "High workload",
      },
    ],
  },
];

interface MilestoneOption {
  id: string;
  label: string;
  timelineLabel?: string;
  daysForGoal?: number;
  overallGoal?: number;
  masteryIntervalDays: number;

  dailyPacing?: number;
  estReviewsPerDayRange?: string;
  description: string;
  recommended?: boolean;
  newwordNotification: boolean;
}

export const milestoneOptions: MilestoneOption[] = [
  {
    id: "1000_12m",
    label: "+1,000 words",
    overallGoal: 1000,
    timelineLabel: "11 months",
    daysForGoal: 333,
    masteryIntervalDays: 180,
    dailyPacing: 5,
    estReviewsPerDayRange: "12–18",
    newwordNotification: false,

    description: "Sustainable long-term pace (recommended)",
    recommended: true,
  },

  {
    id: "1500_12m_buffer",
    label: "+1,500 words",
    timelineLabel: "12 months",
    masteryIntervalDays: 180,

    overallGoal: 1500,
    daysForGoal: 348,
    dailyPacing: 7,
    estReviewsPerDayRange: "20–30",
    description: "Ambitious pace (best if you might miss days)",
    newwordNotification: false,
  },
  {
    id: "custom",
    label: "Custom",
    masteryIntervalDays: 180,
    description: "Set your own target and timeline",
    newwordNotification: false,
  },
];

export const balancedMilestoneOptions: MilestoneOption[] = [
  {
    id: "800_8m",
    label: "+800 words",
    overallGoal: 800,
    timelineLabel: "7 months",
    daysForGoal: 213,
    masteryIntervalDays: 120,
    dailyPacing: 10,
    estReviewsPerDayRange: "10–15",
    newwordNotification: false,
    description: "Steady pace with moderate retention",
    recommended: true,
  },
  {
    id: "1200_10m",
    label: "+1,200 words",
    timelineLabel: "7 months",
    masteryIntervalDays: 120,
    overallGoal: 1200,
    daysForGoal: 213,
    dailyPacing: 15,
    estReviewsPerDayRange: "15–22",
    description: "Balanced growth for consistent learners",
    newwordNotification: false,
  },
  {
    id: "custom",
    label: "Custom",
    masteryIntervalDays: 120,
    description: "Set your own target and timeline",
    newwordNotification: false,
  },
];
