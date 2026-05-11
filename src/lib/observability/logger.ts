type LogMetadata = Record<
  string,
  string | number | boolean | null | undefined | Error | unknown
>;

const SENSITIVE_KEY_PATTERN =
  /(authorization|cookie|token|secret|api[_-]?key|session|content|message|input|prompt|symptom|diagnosis|notes|policy|claim|hkid|email|phone|payment|name|food)/iu;
const SENSITIVE_VALUE_PATTERN =
  /(bearer\s+[a-z0-9._-]+|service[_-]?role|sk-[a-z0-9_-]+|hkid|香港身份證|\+?\d[\d\s().-]{7,}\d)/iu;

export function hashUserId(userId: string | null | undefined) {
  if (!userId) {
    return "anonymous";
  }

  let hash = 0x811c9dc5;

  for (let index = 0; index < userId.length; index += 1) {
    hash ^= userId.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
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
      message: sanitizeStringValue(error.message || "Unknown error"),
    };
  }

  if (typeof error === "string") {
    return { type: "Error", message: sanitizeStringValue(error) };
  }

  return { type: "UnknownError", message: "Unknown error" };
}

function safeConsole(
  level: "info" | "warn" | "error",
  message: string,
  metadata: LogMetadata,
) {
  try {
    console[level](
      JSON.stringify({
        level,
        message,
        timestamp: new Date().toISOString(),
        ...sanitizeLogMetadata(metadata),
      }),
    );
  } catch {
    // Logging must never break a production request.
  }
}

function normalizeLogValue(value: LogMetadata[string]) {
  if (value instanceof Error) {
    return normalizeError(value);
  }

  if (typeof value === "string") {
    return sanitizeStringValue(value);
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

function sanitizeStringValue(value: string) {
  return SENSITIVE_VALUE_PATTERN.test(value) ? "[redacted]" : value.slice(0, 500);
}
