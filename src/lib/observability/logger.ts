import { createHash } from "node:crypto";

type LogMetadata = Record<
  string,
  string | number | boolean | null | undefined | Error | unknown
>;

const SENSITIVE_KEY_PATTERN =
  /(content|message|input|symptom|diagnosis|notes|policy|hkid|email|phone|name|food)/iu;

export function hashUserId(userId: string | null | undefined) {
  if (!userId) {
    return "anonymous";
  }

  return createHash("sha256").update(userId).digest("hex").slice(0, 12);
}

export function logInfo(message: string, metadata: LogMetadata = {}) {
  safeConsole("info", message, metadata);
}

export function logWarn(message: string, metadata: LogMetadata = {}) {
  safeConsole("warn", message, metadata);
}

export function logError(message: string, metadata: LogMetadata = {}) {
  safeConsole("error", message, metadata);
}

export function sanitizeLogMetadata(metadata: LogMetadata) {
  try {
    return Object.fromEntries(
      Object.entries(metadata).map(([key, value]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? "[redacted]" : normalizeLogValue(value),
      ]),
    );
  } catch {
    return { metadata: "unserializable" };
  }
}

export function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      type: error.name || "Error",
      message: error.message || "Unknown error",
    };
  }

  if (typeof error === "string") {
    return { type: "Error", message: error };
  }

  return { type: "UnknownError", message: "Unknown error" };
}

function safeConsole(
  level: "info" | "warn" | "error",
  message: string,
  metadata: LogMetadata,
) {
  try {
    console[level](message, sanitizeLogMetadata(metadata));
  } catch {
    // Logging must never break a production request.
  }
}

function normalizeLogValue(value: LogMetadata[string]) {
  if (value instanceof Error) {
    return normalizeError(value);
  }

  if (typeof value === "string") {
    return value.slice(0, 500);
  }

  if (
    value == null ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  return "[object]";
}
