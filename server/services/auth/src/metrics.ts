import client from "prom-client";
import fs from "fs/promises";

export const register = client.register;

// metrics globales node (CPU, RAM, etc.)
client.collectDefaultMetrics({ register });

// db metrics
export const authDbSizeBytes = new client.Gauge({
  name: "auth_db_size_bytes",
  help: "Size of auth sqlite database file in bytes",
  registers: [register],
});

export const authDbMtimeSeconds = new client.Gauge({
  name: "auth_db_mtime_seconds",
  help: "Last modification time of auth sqlite database file (unix seconds)",
  registers: [register],
});


 
export const authDbQueryDuration = new client.Histogram({
  name: "auth_db_query_duration_seconds",
  help: "Duration of sqlite operations in seconds",
  labelNames: ["op"],
  // buckets : 1ms -> 2s
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2],
  registers: [register],
});

export const authDbErrorsTotal = new client.Counter({
  name: "auth_db_errors_total",
  help: "Total number of sqlite operation errors",
  labelNames: ["op"],
  registers: [register],
});


 // polling stats file DB
 
export function startDbFileStatsPolling(dbPath: string, intervalMs = 5000) {
  const tick = async () => {
    try {
      const st = await fs.stat(dbPath);
      authDbSizeBytes.set(st.size);
      authDbMtimeSeconds.set(Math.floor(st.mtimeMs / 1000));
    } catch {
      // file not created or incorrect path
      authDbSizeBytes.set(0);
      authDbMtimeSeconds.set(0);
    }
  };

  tick();
  setInterval(tick, intervalMs).unref();
}

export function timedQuerySync<T>(op: string, fn: () => T): T {
  const end = authDbQueryDuration.startTimer({ op });
  try {
    const res = fn();
    return res;
  } catch (e) {
    authDbErrorsTotal.inc({ op });
    throw e;
  } finally {
    end();
  }
}