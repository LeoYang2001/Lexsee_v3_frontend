import { useMemo } from "react";

export interface TimelineEntry {
  date: string;
  ease: number;
  interval: number;
  familiarityLevel: string;
}

export interface WordData {
  id: string;
  content: string;
  timeline: TimelineEntry[];
  masteryPercentage: number;
}

export type Sentiment = "success" | "info" | "warning" | "neutral";

export interface Metric {
  label: string;
  value: string;
  desc: string;
  sentiment: Sentiment;
}

export const useWordDataScience = (
  wordData: WordData | null,
  masteryInterval: number = 180,
) => {
  return useMemo(() => {
    if (!wordData || !wordData.timeline || wordData.timeline.length === 0)
      return null;

    const history = wordData.timeline;
    const current = history[0];
    const initial = history[history.length - 1];
    const previous = history[1];
    const word = wordData.content || "this word";

    // 1. Core Calculations
    const multiplier = previous
      ? current.interval / Math.max(previous.interval, 1)
      : 1.0;

    const velocityScore =
      history.reduce((sum, e) => sum + e.ease, 0) / history.length;

    const effortReduction = Math.max(
      0,
      ((current.ease - initial.ease) / initial.ease) * 100,
    );

    // 2. Mastery Percentile Logic (Relative to Goal)
    const progressRatio = current.interval / masteryInterval;
    const progressPercent = Math.round(progressRatio * 100);

    // 3. Logic Gates for 12 Archetype Variations
    let archetype = "Steady Learner";
    let unifiedDesc = `You're making consistent progress. Keep reviewing to lock ${word} into long-term storage.`;

    if (velocityScore > 3.0 && effortReduction > 15) {
      archetype = "Natural Connection";
      unifiedDesc = `Your brain has indexed ${word} perfectly. With recall feeling this light, you've essentially mastered the core of this word.`;
    } else if (velocityScore < 2.0 && effortReduction < 5) {
      archetype = "Heavy Lift";
      unifiedDesc = `${word} is proving stubborn. It still requires high mental effort, but every review builds the foundation you need.`;
    } else if (current.ease > (previous?.ease || 0) + 0.3) {
      archetype = "Breakthrough";
      unifiedDesc = `Something clicked! You just had a major breakthrough in recall speed. Your brain is finding a much faster path to this word.`;
    } else if (multiplier > 2.5 && progressRatio < 0.5) {
      archetype = "Deep Rooting";
      unifiedDesc = `Even though you're early in the journey, your memory resilience is elite. You're building an exceptionally durable neural path.`;
    } else if (progressRatio >= 0.85) {
      archetype = "Home Stretch";
      unifiedDesc = `Almost there! ${word} is at ${progressPercent}% mastery. Just a few more successful reviews to make this permanent.`;
    } else if (multiplier > 3.0) {
      archetype = "Memory Anchor";
      unifiedDesc = `Your memory for ${word} is exceptionally stable. You've made it ${multiplier.toFixed(1)}x harder to forget since your last review.`;
    } else if (multiplier <= 1.0 && history.length > 3) {
      archetype = "Reinforcement";
      unifiedDesc = `You're in a critical reinforcement phase. Your brain is working to stabilize ${word} before its next big interval jump.`;
    } else if (velocityScore > 2.8 && progressRatio < 0.3) {
      archetype = "Fast Tracker";
      unifiedDesc = `You're acquiring ${word} at an elite percentile. At this rate, mastery will feel effortless when it arrives.`;
    } else if (effortReduction > 25) {
      archetype = "Frictionless";
      unifiedDesc = `Incredible! It takes ${effortReduction.toFixed(0)}% less brain power to recall ${word} now compared to your first day.`;
    } else if (velocityScore < 2.2 && multiplier > 2.0) {
      archetype = "The Slow Burn";
      unifiedDesc = `${word} takes effort to recall, but once you find it, it stays. Your resilience is carrying you toward mastery.`;
    } else if (history.length <= 2) {
      archetype = "Early Encoding";
      unifiedDesc = `You've just met ${word}. Your initial velocity is ${velocityScore > 2.5 ? "excellent" : "steady"} for a new term.`;
    } else if (current.familiarityLevel === "hard" && multiplier > 1) {
      archetype = "Resilient Recovery";
      unifiedDesc = `That was a tough review, but you pushed through. Your memory held up better than expected despite the friction!`;
    }

    // 4. Sentiment (Color) Logic
    const resSent: Sentiment =
      multiplier >= 2.0 ? "success" : multiplier >= 1.2 ? "info" : "warning";
    const velSent: Sentiment =
      velocityScore > 2.8
        ? "success"
        : velocityScore >= 2.2
          ? "info"
          : "warning";
    const effSent: Sentiment =
      effortReduction > 10
        ? "success"
        : effortReduction > 0
          ? "info"
          : "neutral";

    return {
      archetype,
      unifiedDesc,
      progressPercent,
      resilience: {
        label: "Resilience",
        value: `${multiplier.toFixed(1)}x`,
        desc: "Resistance compares to last review.",
        sentiment: resSent,
      },
      velocity: {
        label: "Velocity",
        value:
          velocityScore > 3.2
            ? "Elite"
            : velocityScore > 2.8
              ? "High"
              : "Steady",
        desc: "Your learning speed.",
        sentiment: velSent,
      },
      mentalEffort: {
        label: "Effort Reduction",
        value: `${effortReduction.toFixed(0)}%`,
        desc: "It's now easier for your brain to recall",
        sentiment: effSent,
      },
    };
  }, [wordData, masteryInterval]);
};
