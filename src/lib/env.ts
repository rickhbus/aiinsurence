import { z } from "zod";

const appEnvSchema = z
  .enum(["local", "development", "preview", "staging", "production", "test"])
  .default("development");

const aiProviderSchema = z.enum(["deepseek", "groq", "openai"]).default("deepseek");

export type AppEnv = z.infer<typeof appEnvSchema>;
export type AiProvider = z.infer<typeof aiProviderSchema>;
export type EnvValidationMode = "client" | "server" | "production";

export type EnvIssue = {
  key: string;
  message: string;
  severity: "error" | "warning";
};

export type ClientEnv = {
  appEnv: AppEnv;
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  analyticsKey: string | null;
  isSupabaseConfigured: boolean;
};

export type ServerEnv = ClientEnv & {
  aiProvider: AiProvider;
  aiApiKey: string | null;
  aiModel: string | null;
  isAiConfigured: boolean;
};

export class EnvValidationError extends Error {
  issues: EnvIssue[];

  constructor(message: string, issues: EnvIssue[]) {
    super(message);
    this.name = "EnvValidationError";
    this.issues = issues;
  }
}

type RawEnv = Record<string, string | undefined>;

export function getClientEnv(env: RawEnv = process.env): ClientEnv {
  const appEnv = getAppEnv(env);
  const supabaseUrl = clean(env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = getSupabasePublicKey(env);

  return {
    appEnv,
    supabaseUrl,
    supabaseAnonKey,
    analyticsKey: clean(env.NEXT_PUBLIC_ANALYTICS_KEY),
    isSupabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey),
  };
}

export function getServerEnv(env: RawEnv = process.env): ServerEnv {
  const client = getClientEnv(env);
  const aiProvider = aiProviderSchema.catch("deepseek").parse(clean(env.AI_PROVIDER));
  const aiApiKey = getAiProviderKey(aiProvider, env);

  return {
    ...client,
    aiProvider,
    aiApiKey,
    aiModel: getAiModel(aiProvider, env),
    isAiConfigured: Boolean(aiApiKey),
  };
}

export function getEnvIssues(
  mode: EnvValidationMode,
  env: RawEnv = process.env,
): EnvIssue[] {
  const client = getClientEnv(env);
  const server = getServerEnv(env);
  const issues: EnvIssue[] = [];

  if (containsPublicServiceRoleLeak(env)) {
    issues.push({
      key: "NEXT_PUBLIC_*",
      message: "Service role secrets must never use a NEXT_PUBLIC_ prefix.",
      severity: "error",
    });
  }

  if (!client.supabaseUrl) {
    issues.push({
      key: "NEXT_PUBLIC_SUPABASE_URL",
      message: "Supabase URL is required for authenticated persistence.",
      severity: mode === "production" ? "error" : "warning",
    });
  }

  if (!client.supabaseAnonKey) {
    issues.push({
      key: "NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      message: "Supabase anon/publishable key is required for authenticated persistence.",
      severity: mode === "production" ? "error" : "warning",
    });
  }

  if (mode !== "client" && !server.aiApiKey) {
    issues.push({
      key: getAiProviderKeyName(server.aiProvider),
      message: `AI provider key is not configured for ${server.aiProvider}; provider-backed generation will use deterministic fallback where supported.`,
      severity: "warning",
    });
  }

  return issues;
}

export function assertServerEnv(env: RawEnv = process.env) {
  const issues = getEnvIssues("server", env).filter((issue) => issue.severity === "error");

  if (issues.length > 0) {
    throw new EnvValidationError("Server environment is not valid.", issues);
  }

  return getServerEnv(env);
}

export function assertProductionEnv(env: RawEnv = process.env) {
  const issues = getRequiredProductionEnvIssues(env);

  if (issues.length > 0) {
    throw new EnvValidationError("Production environment is not deployable.", issues);
  }

  return getServerEnv(env);
}

export function getRequiredProductionEnvIssues(env: RawEnv = process.env): EnvIssue[] {
  return getEnvIssues("production", env).filter((issue) => issue.severity === "error");
}

export function shouldFailFastForProduction(env: RawEnv = process.env) {
  return (
    clean(env.APP_ENV) === "production" ||
    clean(env.NEXT_PUBLIC_APP_ENV) === "production" ||
    clean(env.VERCEL_ENV) === "production"
  );
}

export function getSupabasePublicKey(env: RawEnv = process.env) {
  return (
    clean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    clean(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  );
}

export function assertProductionEnvIfNeeded(env: RawEnv = process.env) {
  if (!shouldFailFastForProduction(env)) {
    return getServerEnv(env);
  }

  return assertProductionEnv(env);
}

function getAppEnv(env: RawEnv): AppEnv {
  return appEnvSchema
    .catch("development")
    .parse(clean(env.APP_ENV) || clean(env.NEXT_PUBLIC_APP_ENV) || env.NODE_ENV);
}

function getAiProviderKey(provider: AiProvider, env: RawEnv) {
  return clean(env[getAiProviderKeyName(provider)]);
}

function getAiProviderKeyName(provider: AiProvider) {
  switch (provider) {
    case "openai":
      return "OPENAI_API_KEY";
    case "groq":
      return "GROQ_API_KEY";
    case "deepseek":
      return "DEEPSEEK_API_KEY";
  }
}

function getAiModel(provider: AiProvider, env: RawEnv) {
  const providerModelKey =
    provider === "openai"
      ? "OPENAI_MODEL"
      : provider === "groq"
        ? "GROQ_MODEL"
        : "DEEPSEEK_MODEL";

  return clean(env[providerModelKey]) || clean(env.AI_MODEL);
}

function containsPublicServiceRoleLeak(env: RawEnv) {
  return Object.entries(env).some(([key, value]) => {
    const normalizedKey = key.toLowerCase();
    const normalizedValue = clean(value)?.toLowerCase() ?? "";

    return (
      normalizedKey.startsWith("next_public_") &&
      (normalizedKey.includes("service_role") ||
        normalizedKey.includes("service-role") ||
        normalizedValue.includes("service_role"))
    );
  });
}

function clean(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}
