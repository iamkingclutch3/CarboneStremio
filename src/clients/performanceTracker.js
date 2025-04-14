export class PerformanceTracker {
  constructor() {
    this.metrics = {
      parse: { count: 0, totalTime: 0 },
      malLookup: { count: 0, totalTime: 0 },
      rdApi: { count: 0, totalTime: 0 },
      streamMatches: { count: 0, totalHits: 0 },
    };
    this.lastLogTime = Date.now();
  }

  startTimer() {
    return {
      start: Date.now(),
      end: () => Date.now() - this.start,
    };
  }

  record(metric, duration, additionalData = {}) {
    if (!this.metrics[metric]) {
      this.metrics[metric] = { count: 0, totalTime: 0 };
    }

    this.metrics[metric].count++;
    this.metrics[metric].totalTime += duration;

    // Record additional metrics
    for (const [key, value] of Object.entries(additionalData)) {
      if (!this.metrics[metric][key]) {
        this.metrics[metric][key] = 0;
      }
      this.metrics[metric][key] += value;
    }

    this.logPeriodically();
  }

  logPeriodically() {
    const now = Date.now();
    if (now - this.lastLogTime > 60000) {
      // Log every minute
      this.printMetrics();
      this.lastLogTime = now;
    }
  }

  printMetrics() {
    const stats = {};
    for (const [metric, data] of Object.entries(this.metrics)) {
      stats[metric] = {
        calls: data.count,
        avgTime: data.totalTime / (data.count || 1),
        ...data,
      };
    }

    console.log("\n📊 Performance Metrics:");
    console.table(stats);
  }

  getMetrics() {
    return this.metrics;
  }
}

// Singleton instance
export const perfTracker = new PerformanceTracker();