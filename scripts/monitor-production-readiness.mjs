#!/usr/bin/env node

const baseUrl = clean(process.env.MONITORING_BASE_URL) ||
  clean(process.env.APP_URL) ||
  clean(process.env.NEXT_PUBLIC_APP_URL);
const webhookUrl = clean(process.env.MONITORING_ALERT_WEBHOOK_URL);
const timeoutMs = Number(process.env.MONITORING_TIMEOUT_MS || 10000);

if (!baseUrl) {
  console.error("MONITORING_BASE_URL or APP_URL is required.");
  process.exit(2);
}

const readinessUrl = new URL("/api/readiness", baseUrl);
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), timeoutMs);

try {
  const response = await fetch(readinessUrl, {
    headers: { accept: "application/json" },
    signal: controller.signal,
  });
  const payload = await safeJson(response);
  const status = typeof payload?.status === "string" ? payload.status : "unknown";
  const failedChecks = Array.isArray(payload?.checks)
    ? payload.checks
      .filter((check) => check?.status === "fail")
      .map((check) => String(check.name))
      .slice(0, 10)
    : [];

  const summary = {
    ok: response.ok && status === "ready",
    httpStatus: response.status,
    status,
    failedChecks,
    requestId: typeof payload?.requestId === "string" ? payload.requestId : null,
    timestamp: new Date().toISOString(),
  };

  console.log(JSON.stringify(summary));

  if (!summary.ok) {
    await sendAlert(summary);
    process.exit(1);
  }
} catch {
  const summary = {
    ok: false,
    httpStatus: 0,
    status: "check_failed",
    failedChecks: ["readiness_request"],
    requestId: null,
    timestamp: new Date().toISOString(),
  };

  console.error(JSON.stringify(summary));
  await sendAlert(summary);
  process.exit(1);
} finally {
  clearTimeout(timeout);
}

async function sendAlert(summary) {
  if (!webhookUrl) {
    return;
  }

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      text: `AI Health Guide readiness alert: ${summary.status}`,
      status: summary.status,
      httpStatus: summary.httpStatus,
      failedChecks: summary.failedChecks,
      requestId: summary.requestId,
      timestamp: summary.timestamp,
    }),
  }).catch(() => undefined);
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function clean(value) {
  const trimmed = value?.trim();

  return trimmed || null;
}
