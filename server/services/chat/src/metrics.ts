import client from "prom-client";

export const register = new client.Registry();

client.collectDefaultMetrics({ register });


// co actives
export const chatWsConnections = new client.Gauge({
  name: "chat_ws_connections",
  help: "Number of active Socket.IO connections",
  registers: [register],
});

// co totales
export const chatWsConnectionsTotal = new client.Counter({
  name: "chat_ws_connections_total",
  help: "Total number of Socket.IO connections",
  registers: [register],
});

// déco totales 
export const chatWsDisconnectsTotal = new client.Counter({
  name: "chat_ws_disconnects_total",
  help: "Total number of Socket.IO disconnects",
  labelNames: ["reason"],
  registers: [register],
});

// messages (in/out) par event
export const chatWsMessagesTotal = new client.Counter({
  name: "chat_ws_messages_total",
  help: "Total number of Socket.IO messages",
  labelNames: ["direction", "event"],
  registers: [register],
});

// taille des messages
export const chatWsMessageSizeBytes = new client.Histogram({
  name: "chat_ws_message_size_bytes",
  help: "Estimated Socket.IO message size in bytes",
  labelNames: ["direction", "event"],
  buckets: [64, 256, 1024, 4096, 16384, 65536],
  registers: [register],
});


export function onWsConnect() {
  chatWsConnections.inc();
  chatWsConnectionsTotal.inc();
}

export function onWsDisconnect(reason: string | undefined) {
  chatWsConnections.dec();
  chatWsDisconnectsTotal.inc({ reason: reason ?? "unknown" });
}

function estimateBytes(args: unknown[]): number {
  try {
    const s = JSON.stringify(args);
    return Buffer.byteLength(s, "utf8");
  } catch {
    return 0;
  }
}

export function onWsMessage(direction: "in" | "out", event: string, args: unknown[]) {
  chatWsMessagesTotal.inc({ direction, event });
  const bytes = estimateBytes(args);
  if (bytes > 0) {
    chatWsMessageSizeBytes.observe({ direction, event }, bytes);
  }
}
