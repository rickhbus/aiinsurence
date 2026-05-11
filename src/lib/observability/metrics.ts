import { logInfo, sanitizeLogMetadata } from "./logger";

type MetricMetadata = Record<string, string | number | boolean | null | undefined>;

type MetricEvent = {
  name: string;
  value?: number;
  unit?: "count" | "ms" | "ratio" | "bytes";
  route?: string;
  requestId?: string;
  metadata?: MetricMetadata;
};

type ObservabilityEvent = {
  name: string;
  route?: string;
  requestId?: string;
  metadata?: MetricMetadata;
};

export function emitMetric(event: MetricEvent) {
  emitObservabilityRecord("metric", event);
}

export function emitEvent(event: ObservabilityEvent) {
  emitObservabilityRecord("event", event);
}

function emitObservabilityRecord(
  type: "metric" | "event",
  event: MetricEvent | ObservabilityEvent,
) {
  if (process.env.OBSERVABILITY_EVENTS_ENABLED !== "1") {
    return;
  }

  logInfo("observability_record", {
    type,
    name: event.name,
    route: event.route,
    requestId: event.requestId,
    ...(type === "metric"
      ? {
          value: (event as MetricEvent).value ?? 1,
          unit: (event as MetricEvent).unit ?? "count",
        }
      : {}),
    metadata: sanitizeLogMetadata(event.metadata ?? {}),
  });
}
