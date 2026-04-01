import { useMemo } from "react";
import { addDays, format, parseISO, differenceInDays } from "date-fns";

export const useWordProjection = (wordData: any, masteryInterval = 180) => {
  return useMemo(() => {
    const today = new Date();

    if (!wordData || !wordData.timeline || !Array.isArray(wordData.timeline)) {
      return { timeline: [], daysToMastery: null, estimatedMasteryDate: null };
    }

    // 1. Process Actual History with Delta Calculation
    const history = [...wordData.timeline]
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
      .map((entry: any, index: number, array: any[]) => {
        const current = parseISO(entry.date);
        let delta = 0;

        if (index > 0) {
          const prev = parseISO(array[index - 1].date);
          delta = differenceInDays(current, prev);
        }

        return {
          date: entry.date,
          interval: parseFloat(entry.interval) || 0,
          ease: parseFloat(entry.ease) || 2.5,
          type: "actual" as const,
          retention: 1.0,
          reviewDelta: delta, // Difference between this review and the last
        };
      });

    if (history.length === 0) {
      return { timeline: [], daysToMastery: null, estimatedMasteryDate: null };
    }

    const projectedTimeline = [];
    let lastEntry = history[history.length - 1];

    let currentInterval = lastEntry.interval;
    let currentEase = lastEntry.ease;
    let currentDate = parseISO(lastEntry.date);
    let masteryDate: Date | null = null;

    // 2. Full Simulation Loop
    // Simulates until nextInterval hits mastery threshold (cap at 50 to be safe)
    for (let i = 0; i < 50; i++) {
      // Calculate next step using 'Excellent' logic
      const boostedInterval = currentInterval * currentEase * 1.3;
      const nextInterval = Math.max(1, Math.round(boostedInterval));
      const nextEase = currentEase + 0.15;
      const nextDate = addDays(currentDate, nextInterval);

      const node = {
        date: format(nextDate, "yyyy-MM-dd"),
        interval: nextInterval,
        ease: Number(nextEase.toFixed(2)),
        type: "estimated" as const,
        retention: 1.0,
        reviewDelta: nextInterval, // For projections, delta is the interval
      };

      projectedTimeline.push(node);

      // Check if this review pushes the word into Mastery
      if (!masteryDate && nextInterval >= masteryInterval) {
        masteryDate = currentDate;
      }

      // Update pointers
      currentInterval = nextInterval;
      currentEase = nextEase;
      currentDate = nextDate;

      // Stop once we've reached mastery
      if (currentInterval >= masteryInterval) break;
    }

    const daysToMastery = masteryDate
      ? differenceInDays(masteryDate, today)
      : null;

    return {
      timeline: [...history, ...projectedTimeline],
      daysToMastery:
        daysToMastery !== null && daysToMastery > 0 ? daysToMastery : 0,
      estimatedMasteryDate: masteryDate
        ? format(masteryDate, "yyyy-MM-dd")
        : null,
    };
  }, [wordData, masteryInterval]);
};
