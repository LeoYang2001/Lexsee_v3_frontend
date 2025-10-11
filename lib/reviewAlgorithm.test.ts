import { getNextReview } from "./reviewAlgorithm";
import { RecallAccuracy } from "../types/common/RecallAccuracy";

// Helper function to format dates
const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

describe("Word Learning Journey - 7 Review Phases", () => {
  test("Track word 'serenity' through exactly 7 reviews with excellent performance", () => {
    console.log("\n=== 7 REVIEW PHASES: 'serenity' ===\n");
    console.log("Student always recalls with EXCELLENT performance");
    console.log("Tracking exactly 7 review phases to see interval progression");
    console.log("═".repeat(70));

    // Starting state for a new word
    let currentState = {
      review_interval: 1,
      ease_factor: 2.5,
      recall_accuracy: "excellent" as RecallAccuracy,
    };

    let totalDays = 0;

    console.log("📚 Word: 'serenity'");
    console.log(
      `Starting: interval=${currentState.review_interval} day, ease=${currentState.ease_factor}`
    );
    console.log("─".repeat(70));

    // Exactly 7 reviews
    for (let reviewNumber = 1; reviewNumber <= 7; reviewNumber++) {
      // Add current interval to total days (time until this review)
      totalDays += currentState.review_interval;

      // Get next review calculation
      const result = getNextReview(currentState);

      // Show detailed calculation
      const intervalCalculation =
        currentState.review_interval * currentState.ease_factor * 1.3;
      const roundedInterval = Math.round(intervalCalculation);

      console.log(`Review #${reviewNumber} (Day ${totalDays}):`);
      console.log(`  📝 Recall Quality: excellent`);
      console.log(
        `  ⏱️  Previous Interval: ${currentState.review_interval} days`
      );
      console.log(
        `  🧮 Calculation: ${currentState.review_interval} × ${currentState.ease_factor.toFixed(
          2
        )} × 1.3 = ${intervalCalculation.toFixed(2)} → ${result.review_interval} days`
      );
      console.log(`  📅 Next Review Due: ${formatDate(result.next_due)}`);
      console.log(`  🔄 New Interval: ${result.review_interval} days`);
      console.log(
        `  🧠 New Ease Factor: ${currentState.ease_factor.toFixed(2)} + 0.15 = ${result.ease_factor.toFixed(
          2
        )}`
      );

      // Show interval growth
      if (reviewNumber > 1) {
        const growth = result.review_interval / currentState.review_interval;
        console.log(`  📈 Interval Growth: ${growth.toFixed(2)}x`);
      }

      // Show time until next review in different units
      if (result.review_interval >= 30) {
        console.log(
          `  📊 Time Until Next: ${result.review_interval} days (~${(
            result.review_interval / 30
          ).toFixed(1)} months)`
        );
      } else if (result.review_interval >= 7) {
        console.log(
          `  📊 Time Until Next: ${result.review_interval} days (~${(
            result.review_interval / 7
          ).toFixed(1)} weeks)`
        );
      } else {
        console.log(`  📊 Time Until Next: ${result.review_interval} days`);
      }

      console.log("");

      // Update state for next iteration
      currentState = {
        review_interval: result.review_interval,
        ease_factor: result.ease_factor,
        recall_accuracy: "excellent" as RecallAccuracy,
      };

      // Test specific calculations
      if (reviewNumber === 1) {
        expect(result.review_interval).toBe(3); // Math.round(1 * 2.5 * 1.3) = 3
        expect(result.ease_factor).toBe(2.65); // 2.5 + 0.15
      }
    }

    console.log(
      "══════════════════════════════════════════════════════════════════════"
    );
    console.log("📊 FINAL SUMMARY:");
    console.log(`Total Reviews Completed: 7`);
    console.log(`Total Learning Time: ${totalDays} days`);
    console.log(`- In weeks: ${(totalDays / 7).toFixed(1)} weeks`);
    console.log(`- In months: ${(totalDays / 30).toFixed(1)} months`);
    console.log(`- In years: ${(totalDays / 365).toFixed(2)} years`);
    console.log(`Final Interval: ${currentState.review_interval} days`);
    console.log(
      `- In weeks: ${(currentState.review_interval / 7).toFixed(1)} weeks`
    );
    console.log(
      `- In months: ${(currentState.review_interval / 30).toFixed(1)} months`
    );
    console.log(
      `- In years: ${(currentState.review_interval / 365).toFixed(2)} years`
    );
    console.log(`Final Ease Factor: ${currentState.ease_factor.toFixed(2)}`);
  });

  test("Compare 7 reviews with different recall qualities", () => {
    console.log(
      "\n=== COMPARISON: 7 REVIEWS WITH DIFFERENT RECALL QUALITIES ===\n"
    );

    const scenarios = [
      { name: "All Excellent", pattern: Array(7).fill("excellent") },
      { name: "All Good", pattern: Array(7).fill("good") },
      { name: "All Fair", pattern: Array(7).fill("fair") },
      {
        name: "Mixed Performance",
        pattern: [
          "good",
          "excellent",
          "fair",
          "good",
          "excellent",
          "good",
          "excellent",
        ],
      },
    ];

    scenarios.forEach((scenario) => {
      let state = {
        review_interval: 1,
        ease_factor: 2.5,
        recall_accuracy: "good" as RecallAccuracy,
      };
      let totalDays = 0;

      console.log(`${scenario.name}:`);

      scenario.pattern.forEach((accuracy, index) => {
        totalDays += state.review_interval;
        state.recall_accuracy = accuracy as RecallAccuracy;
        const result = getNextReview(state);

        console.log(
          `  Review ${index + 1}: ${accuracy} → ${result.review_interval} days (Total: ${totalDays} days)`
        );

        state = {
          review_interval: result.review_interval,
          ease_factor: result.ease_factor,
          recall_accuracy: accuracy as RecallAccuracy,
        };
      });

      console.log(
        `  Final: ${state.review_interval} days interval, ${state.ease_factor.toFixed(
          2
        )} ease, ${totalDays} total days\n`
      );
    });
  });
});
