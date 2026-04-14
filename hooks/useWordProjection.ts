import { useMemo } from "react";
import { addDays, format, parseISO, differenceInDays } from "date-fns";

export const useWordProjection = (wordData: any, masteryInterval = 180) => {
  return useMemo(() => {
    if (!wordData || !wordData.createdAt) {
      return { timeline: [], daysToMastery: null, estimatedMasteryDate: null };
    }

    const today = new Date();
    const creationDateStr = wordData.createdAt.split("T")[0];

    // Treat DB entries without a type as actual reviews
    const rawHistory = wordData.timeline
      ? [...wordData.timeline].filter(
          (entry: any) => !entry.type || entry.type === "actual",
        )
      : [];

    const sortedHistory = rawHistory.sort(
      (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime(),
    );

    const history: any[] = [];

    // Initial collected state if missing
    if (
      sortedHistory.length === 0 ||
      sortedHistory[0].date !== creationDateStr
    ) {
      history.push({
        date: creationDateStr,
        interval: 1,
        ease: 2.5,
        type: "actual",
        retention: 1.0,
        reviewDelta: 0,
      });
    }

    // Actual review history
    sortedHistory.forEach((entry: any, index: number) => {
      const current = parseISO(entry.date);
      const prevDate =
        index === 0
          ? parseISO(creationDateStr)
          : parseISO(sortedHistory[index - 1].date);

      history.push({
        date: entry.date,
        interval: Number(entry.interval),
        ease: Number(entry.ease),
        type: "actual",
        retention: entry.retention ?? 1.0,
        reviewDelta: differenceInDays(current, prevDate),
        familiarityLevel: entry.familiarityLevel ?? null,
      });
    });

    const projectedTimeline = [];
    const lastActual = history[history.length - 1];

    let currentInterval = Number(lastActual.interval);
    let currentEase = Number(lastActual.ease);
    let currentDate = parseISO(lastActual.date);
    let masteryDate: Date | null = null;

    for (let i = 0; i < 50; i++) {
      const nextReviewDate = addDays(currentDate, currentInterval);

      const nextInterval = Math.max(
        1,
        Math.round(currentInterval * currentEase * 1.3),
      );
      const nextEase = Number((currentEase + 0.15).toFixed(2));

      projectedTimeline.push({
        date: format(nextReviewDate, "yyyy-MM-dd"),
        interval: nextInterval,
        ease: nextEase,
        type: "estimated",
        retention: 1.0,
        reviewDelta: currentInterval,
      });

      if (!masteryDate && nextInterval >= masteryInterval) {
        masteryDate = nextReviewDate;
      }

      currentDate = nextReviewDate;
      currentInterval = nextInterval;
      currentEase = nextEase;

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
