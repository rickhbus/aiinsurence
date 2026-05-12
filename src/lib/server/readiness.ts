import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  getClientEnv,
  getEnvIssues,
  getRequiredProductionEnvIssues,
  shouldFailFastForProduction,
} from "@/lib/env";
import { hasSharedRateLimitStoreConfig } from "@/lib/server/rate-limit-store";

export type ReadinessStatus = "ready" | "degraded" | "not_ready";
export type ReadinessCheckStatus = "pass" | "warn" | "fail";

export type ReadinessCheck = {
  name: string;
  status: ReadinessCheckStatus;
  message: string;
  durationMs?: number;
};

export type ReadinessReport = {
  status: ReadinessStatus;
  checks: ReadinessCheck[];
  requestId: string;
  timestamp: string;
};

type ProbeOptions = {
  env?: Record<string, string | undefined>;
  requestId: string;
  now?: Date;
  supabaseProbe?: (env: Record<string, string | undefined>) => Promise<ReadinessCheck[]>;
};

const REQUIRED_TABLES = [
  { table: "health_lessons", column: "id", access: "public" },
  { table: "profiles", column: "id", access: "protected" },
  { table: "health_memory", column: "id", access: "protected" },
  { table: "daily_checkins", column: "id", access: "protected" },
  { table: "ai_usage_events", column: "id", access: "protected" },
  { table: "gbl_cases", column: "id", access: "protected" },
  { table: "gbl_analysis_results", column: "id", access: "protected" },
  { table: "emotion_engine_results", column: "id", access: "protected" },
  { table: "insurance_analyses", column: "id", access: "protected" },
  { table: "mobile_health_sync_batches", column: "id", access: "protected" },
  { table: "mobile_health_records", column: "id", access: "protected" },
] as const;

export async function buildReadinessReport({
  env = process.env,
  requestId,
  now = new Date(),
  supabaseProbe = probeSupabaseReadiness,
}: ProbeOptions): Promise<ReadinessReport> {
  const checks: ReadinessCheck[] = [
    buildRuntimeConfigCheck(env),
    buildAiProviderCheck(env),
    buildRateLimitStoreCheck(env),
    buildMonitoringAlertCheck(env),
    buildSecretRotationCheck(env, now),
  ];

  if (getClientEnv(env).isSupabaseConfigured) {
    checks.push(...await supabaseProbe(env));
  }

  const status = summarizeStatus(checks);

  return {
    status,
    checks,
    requestId,
    timestamp: now.toISOString(),
  };
}

export async function probeSupabaseReadiness(
  env: Record<string, string | undefined>,
): Promise<ReadinessCheck[]> {
  const clientEnv = getClientEnv(env);
  const started = Date.now();

  if (!clientEnv.supabaseUrl || !clientEnv.supabaseAnonKey) {
    return [
      {
        name: "supabase_connectivity",
        status: "fail",
        message: "Supabase public URL and anon/publishable key are required.",
        durationMs: Date.now() - started,
      },
    ];
  }

  const supabase = createSupabaseClient(
    clientEnv.supabaseUrl,
    clientEnv.supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
      global: {
        headers: {
          "x-client-info": "ai-health-guide-readiness",
        },
      },
    },
  );

  const checks = await Promise.all(REQUIRED_TABLES.map(async (table) => {
    const tableStarted = Date.now();
    const { error, status } = await supabase
      .from(table.table)
      .select(table.column, { head: true, count: "exact" })
      .limit(1);

    return classifyTableProbe({
      table: table.table,
      access: table.access,
      httpStatus: status,
      error,
      durationMs: Date.now() - tableStarted,
    });
  }));

  checks.unshift({
    name: "supabase_connectivity",
    status: checks.some((check) => check.status === "fail") ? "fail" : "pass",
    message: checks.some((check) => check.status === "fail")
      ? "Supabase responded but one or more required tables could not be verified."
      : "Supabase responded to anon-key readiness probes.",
    durationMs: Date.now() - started,
  });

  return checks;
}

function buildRuntimeConfigCheck(env: Record<string, string | undefined>): ReadinessCheck {
  const requiredIssues = getRequiredProductionEnvIssues(env);

  if (requiredIssues.length > 0) {
    return {
      name: "runtime_config",
      status: "fail",
      message: `Missing required production configuration: ${requiredIssues.map((issue) => issue.key).join(", ")}`,
    };
  }

  return {
    name: "runtime_config",
    status: "pass",
    message: "Required Supabase production runtime configuration is present.",
  };
}

function buildAiProviderCheck(env: Record<string, string | undefined>): ReadinessCheck {
  const aiIssues = getEnvIssues("server", env).filter((issue) =>
    issue.key.endsWith("_API_KEY")
  );

  if (aiIssues.length > 0) {
    return {
      name: "ai_provider",
      status: "warn",
      message: "AI provider key is absent; deterministic provider-free fallback remains available.",
    };
  }

  return {
    name: "ai_provider",
    status: "pass",
    message: "AI provider key is configured for provider-backed generation.",
  };
}

function buildRateLimitStoreCheck(env: Record<string, string | undefined>): ReadinessCheck {
  const production = shouldFailFastForProduction(env);
  const hasRedis = hasSharedRateLimitStoreConfig(env);
  const rateLimitDisabled = clean(env.PRODUCTION_API_RATE_LIMIT_ENABLED)?.toLowerCase() === "false";

  if (production && rateLimitDisabled) {
    return {
      name: "shared_rate_limit_store",
      status: "fail",
      message: "Production API rate limiting is disabled; enable it before production traffic.",
    };
  }

  if (!hasRedis && production) {
    return {
      name: "shared_rate_limit_store",
      status: "fail",
      message: "Shared Redis/Upstash rate-limit store is required for production API traffic.",
    };
  }

  return {
    name: "shared_rate_limit_store",
    status: hasRedis ? "pass" : "warn",
    message: hasRedis
      ? "Shared Redis/Upstash-compatible rate-limit store is configured."
      : "Local/test in-memory rate-limit store is active.",
  };
}

function buildMonitoringAlertCheck(env: Record<string, string | undefined>): ReadinessCheck {
  const production = shouldFailFastForProduction(env);
  const alertsEnabled = clean(env.MONITORING_ALERTS_ENABLED)?.toLowerCase() === "true";
  const hasDestination = Boolean(
    clean(env.MONITORING_ALERT_WEBHOOK_URL) ||
      clean(env.SENTRY_DSN) ||
      clean(env.OTEL_EXPORTER_OTLP_ENDPOINT) ||
      clean(env.VERCEL_LOG_DRAIN_CONFIGURED)?.toLowerCase() === "true",
  );

  if (production && (!alertsEnabled || !hasDestination)) {
    return {
      name: "monitoring_alerts",
      status: "fail",
      message: "Production monitoring alerts are not configured or not declared enabled.",
    };
  }

  return {
    name: "monitoring_alerts",
    status: alertsEnabled && hasDestination ? "pass" : "warn",
    message: alertsEnabled && hasDestination
      ? "Production monitoring alert destination is declared."
      : "Monitoring alerts are not enabled for this environment.",
  };
}

function buildSecretRotationCheck(
  env: Record<string, string | undefined>,
  now: Date,
): ReadinessCheck {
  const production = shouldFailFastForProduction(env);
  const rotatedAt = parseDate(env.SECRETS_ROTATED_AT);
  const nextDueAt = parseDate(env.SECRETS_ROTATION_NEXT_DUE_AT);

  if (!rotatedAt || !nextDueAt) {
    return {
      name: "secret_rotation",
      status: production ? "fail" : "warn",
      message: "Secret rotation metadata is missing or invalid.",
    };
  }

  if (rotatedAt.getTime() > now.getTime() + 24 * 60 * 60 * 1000) {
    return {
      name: "secret_rotation",
      status: production ? "fail" : "warn",
      message: "Secret rotation metadata has an invalid future rotation timestamp.",
    };
  }

  if (nextDueAt.getTime() <= now.getTime()) {
    return {
      name: "secret_rotation",
      status: production ? "fail" : "warn",
      message: "Secret rotation is due or overdue.",
    };
  }

  const daysUntilDue = Math.ceil(
    (nextDueAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
  );

  return {
    name: "secret_rotation",
    status: daysUntilDue <= 14 ? "warn" : "pass",
    message: daysUntilDue <= 14
      ? "Secret rotation is due within 14 days."
      : "Secret rotation metadata is current.",
  };
}

function classifyTableProbe({
  table,
  access,
  httpStatus,
  error,
  durationMs,
}: {
  table: string;
  access: "public" | "protected";
  httpStatus: number;
  error: { code?: string; message?: string } | null;
  durationMs: number;
}): ReadinessCheck {
  const name = `table:${table}`;

  if (!error) {
    return {
      name,
      status: "pass",
      message: access === "public"
        ? `${table} is queryable with anon credentials.`
        : `${table} responded to anon probe; staging RLS diagnostics must verify no cross-user rows are exposed.`,
      durationMs,
    };
  }

  const message = error.message?.toLowerCase() ?? "";
  const missing = error.code === "42P01" || message.includes("does not exist");

  if (missing) {
    return {
      name,
      status: "fail",
      message: `${table} is missing; required migrations may not be applied.`,
      durationMs,
    };
  }

  const permissionDenied =
    error.code === "42501" ||
    httpStatus === 401 ||
    httpStatus === 403 ||
    message.includes("permission denied");

  if (permissionDenied && access === "protected") {
    return {
      name,
      status: "pass",
      message: `${table} exists and is protected from anonymous reads.`,
      durationMs,
    };
  }

  return {
    name,
    status: access === "public" ? "fail" : "warn",
    message: `${table} readiness probe returned ${error.code ?? httpStatus}.`,
    durationMs,
  };
}

function summarizeStatus(checks: ReadinessCheck[]): ReadinessStatus {
  if (checks.some((check) => check.status === "fail")) {
    return "not_ready";
  }

  if (checks.some((check) => check.status === "warn")) {
    return "degraded";
  }

  return "ready";
}

function parseDate(value: string | undefined) {
  const cleaned = clean(value);

  if (!cleaned) {
    return null;
  }

  const date = new Date(cleaned);

  return Number.isNaN(date.getTime()) ? null : date;
}

function clean(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}
