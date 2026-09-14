import type { ScaleEstimates, ScaleInputs } from "@/types/scale";

const SECONDS_PER_DAY = 86_400;
const KB_PER_GB = 1024 * 1024;
const GB_PER_TB = 1024;

export function estimateScale(inputs: ScaleInputs): ScaleEstimates {
  const dau = Math.round(inputs.totalUsers * (inputs.dauPercentage / 100));
  const dailyRequests = dau * inputs.requestsPerUserPerDay;
  const averageQps = dailyRequests / SECONDS_PER_DAY;
  const peakQps = averageQps * inputs.peakMultiplier;

  const dailyObjectsCreated = dau * inputs.objectsCreatedPerUserPerDay;
  const storagePerDayGB = (dailyObjectsCreated * inputs.avgObjectSizeKB) / KB_PER_GB;
  const storagePerYearTB = (storagePerDayGB * 365) / GB_PER_TB;

  return {
    dau,
    dailyRequests,
    averageQps,
    peakQps,
    dailyObjectsCreated,
    storagePerDayGB,
    storagePerYearTB,
  };
}

const USER_COUNT_PATTERN = /\b(\d[\d,]*\.?\d*)\s*(million|thousand|billion)?\s*(registered users|users)\b/i;
const MULTIPLIERS: Record<string, number> = {
  thousand: 1_000,
  million: 1_000_000,
  billion: 1_000_000_000,
};

// Best-effort guess at "total users" from free text, to prefill the estimator.
// Returns null if nothing matches - the UI falls back to a sensible default.
export function extractApproxUserCount(description: string): number | null {
  const match = description.match(USER_COUNT_PATTERN);
  if (!match) return null;

  const rawNumber = parseFloat(match[1].replace(/,/g, ""));
  const multiplier = match[2] ? MULTIPLIERS[match[2].toLowerCase()] : 1;
  return Math.round(rawNumber * multiplier);
}
