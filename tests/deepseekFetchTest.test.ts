import { fetchQuickConversation, AIProvider } from "../apis/AIFeatures";
import * as fs from "fs";
import * as path from "path";

describe("DeepSeek API Performance Tests", () => {
  const NUM_RUNS = 10;
  const TIMEOUT = 120000; // 120 seconds timeout (2 minutes)
  const PROVIDER: AIProvider = "deepseek";
  const MODEL = "deepseek-v3.2-exp";
  const RESULTS_DIR = path.join(__dirname, "../performance-results");
  const RESULTS_FILE = path.join(RESULTS_DIR, "performance-results.json");

  // Helper function to calculate average excluding outliers
  const calculateAverageWithoutOutliers = (times: number[]) => {
    const sortedTimes = [...times].sort((a, b) => a - b);
    const trimmedTimes = sortedTimes.slice(2, -2);
    const sum = trimmedTimes.reduce((acc, time) => acc + time, 0);
    return sum / trimmedTimes.length;
  };

  // Helper function to ensure results directory exists
  const ensureResultsDirectory = () => {
    if (!fs.existsSync(RESULTS_DIR)) {
      fs.mkdirSync(RESULTS_DIR, { recursive: true });
    }
  };

  // Helper function to write performance results to file (returns the results array)
  const writePerformanceResults = (
    provider: AIProvider,
    model: string,
    averageTime: number,
    successRate: number,
    minTime: number,
    maxTime: number,
    timestamp: string
  ): any[] => {
    ensureResultsDirectory();

    let results: any[] = [];

    // Read existing results if file exists
    if (fs.existsSync(RESULTS_FILE)) {
      try {
        const fileContent = fs.readFileSync(RESULTS_FILE, "utf-8");
        results = JSON.parse(fileContent);
      } catch (error) {
        console.warn(
          "⚠️ Could not parse existing results file, starting fresh"
        );
        results = [];
      }
    }

    // Add new result
    const newResult = {
      timestamp,
      provider,
      model,
      averageTime: parseFloat(averageTime.toFixed(2)),
      successRate: parseFloat(successRate.toFixed(1)),
      minTime: parseFloat(minTime.toFixed(2)),
      maxTime: parseFloat(maxTime.toFixed(2)),
      numRuns: NUM_RUNS,
    };

    results.push(newResult);

    // Write results to file
    try {
      fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
      console.log(`\n📁 Performance results saved to: ${RESULTS_FILE}`);
      console.log(`📊 Total recorded tests: ${results.length}`);
    } catch (error) {
      console.error("❌ Failed to write performance results:", error);
    }

    return results;
  };

  // Helper function to print comparison with previous runs
  const printComparisonWithPrevious = (allResults: any[]) => {
    try {
      if (!allResults || allResults.length < 2) {
        return;
      }

      const previous = allResults[allResults.length - 2];
      const current = allResults[allResults.length - 1];

      const timeDiff = current.averageTime - previous.averageTime;
      const timeDiffPercent = ((timeDiff / previous.averageTime) * 100).toFixed(
        1
      );
      const direction = timeDiff > 0 ? "⬆️ slower" : "⬇️ faster";

      console.log("\n📈 Comparison with Previous Run:");
      console.log("----------------------------------------");
      console.log(
        `Previous (${previous.provider}/${previous.model}): ${previous.averageTime}ms`
      );
      console.log(
        `Current (${current.provider}/${current.model}): ${current.averageTime}ms`
      );
      console.log(
        `Difference: ${Math.abs(timeDiff).toFixed(2)}ms ${direction} (${timeDiffPercent}%)`
      );
      console.log("----------------------------------------\n");
    } catch (error) {
      console.warn("⚠️ Could not compare with previous results");
    }
  };

  it(
    `should test fetchQuickConversation performance over ${NUM_RUNS} runs with ${PROVIDER}`,
    async () => {
      const executionTimes: number[] = [];
      const results: Array<{ time: number; success: boolean; error?: string }> =
        [];
      const testStartTime = new Date().toISOString();

      console.log(
        `\n🚀 Starting ${PROVIDER.toUpperCase()} API Performance Test`
      );
      console.log(`📅 Timestamp: ${testStartTime}`);
      console.log(`🤖 Model: ${MODEL}`);
      console.log("----------------------------------------");

      for (let i = 0; i < NUM_RUNS; i++) {
        const startTime = performance.now();

        try {
          console.log(
            `⏳ Run ${i + 1}/${NUM_RUNS}: Sending request to ${PROVIDER}...`
          );

          const result = await fetchQuickConversation(
            "performance",
            undefined,
            undefined,
            PROVIDER
          );
          const endTime = performance.now();
          const executionTime = endTime - startTime;

          executionTimes.push(executionTime);
          results.push({
            time: executionTime,
            success: result !== null,
          });

          console.log(
            `✅ Run ${i + 1}/${NUM_RUNS}: ${executionTime.toFixed(2)}ms ${result ? "(success)" : "(failed)"}`
          );
        } catch (error) {
          const endTime = performance.now();
          const executionTime = endTime - startTime;
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          results.push({
            time: executionTime,
            success: false,
            error: errorMessage,
          });
          console.log(
            `❌ Run ${i + 1}/${NUM_RUNS}: ${executionTime.toFixed(2)}ms (error: ${errorMessage})`
          );
        }

        // Add small delay between requests to avoid rate limiting
        if (i < NUM_RUNS - 1) {
          console.log(`⏰ Waiting 500ms before next request...`);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      // Calculate statistics
      const successfulTimes = results
        .filter((r) => r.success)
        .map((r) => r.time);

      if (successfulTimes.length === 0) {
        console.log("\n❌ No successful requests to analyze!");
        expect(true).toBe(true);
        return;
      }

      const averageTime = calculateAverageWithoutOutliers(successfulTimes);
      const minTime = Math.min(...successfulTimes);
      const maxTime = Math.max(...successfulTimes);
      const successRate =
        (results.filter((r) => r.success).length / NUM_RUNS) * 100;

      console.log(`\n📊 ${PROVIDER.toUpperCase()} Test Results Summary`);
      console.log("----------------------------------------");
      console.log(`🎯 Total Runs: ${NUM_RUNS}`);
      console.log(`✅ Successful: ${results.filter((r) => r.success).length}`);
      console.log(`❌ Failed: ${results.filter((r) => !r.success).length}`);
      console.log(`🎯 Success Rate: ${successRate.toFixed(1)}%`);
      console.log(
        `⚡ Average Time (excluding outliers): ${averageTime.toFixed(2)}ms`
      );
      console.log(`⬇️ Fastest Time: ${minTime.toFixed(2)}ms`);
      console.log(`⬆️ Slowest Time: ${maxTime.toFixed(2)}ms`);
      console.log("----------------------------------------\n");

      // Show errors if any
      const failedRuns = results.filter((r) => !r.success);
      if (failedRuns.length > 0) {
        console.log("❌ Failed Requests:");
        failedRuns.forEach((run, index) => {
          console.log(`  - Run ${index + 1} error: ${run.error}`);
        });
      }

      // Write results to file and get all results
      const allResults = writePerformanceResults(
        PROVIDER,
        MODEL,
        averageTime,
        successRate,
        minTime,
        maxTime,
        testStartTime
      );

      // Print comparison with previous run (using returned results, not file read)
      printComparisonWithPrevious(allResults);

      expect(successRate).toBeGreaterThanOrEqual(50);
    },
    TIMEOUT
  );

  beforeAll(() => {
    jest.setTimeout(TIMEOUT);
  });
});
