import { createHash } from "node:crypto";

type LogMetadata = Record<string, string | number | boolean | null | undefined>;

const SENSITIVE_KEY_PATTERN =
  /(content|message|input|symptom|diagnosis|notes|policy|hkid|email|phone|name|food)/iu;

export function hashUserId(userId: string | null | undefined) {
  if (!userId) {
    return "anonymous";
  }

  return createHash("sha256").update(userId).digest("hex").slice(0, 12);
}

export function logInfo(message: string, metadata: LogMetadata = {}) {
  console.info(message, sanitizeMetadata(metadata));
}

export function logWarn(message: string, metadata: LogMetadata = {}) {
  console.warn(message, sanitizeMetadata(metadata));
}

export function logError(message: string, metadata: LogMetadata = {}) {
  console.error(message, sanitizeMetadata(metadata));
}

function sanitizeMetadata(metadata: LogMetadata) {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? "[redacted]" : value,
    ]),
  );
}
