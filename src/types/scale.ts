export interface ScaleInputs {
  totalUsers: number;
  dauPercentage: number; // % of total users active on a given day
  requestsPerUserPerDay: number;
  peakMultiplier: number; // peak QPS = average QPS x this
  objectsCreatedPerUserPerDay: number; // e.g. posts/uploads per active user per day
  avgObjectSizeKB: number;
}

export interface ScaleEstimates {
  dau: number;
  dailyRequests: number;
  averageQps: number;
  peakQps: number;
  dailyObjectsCreated: number;
  storagePerDayGB: number;
  storagePerYearTB: number;
}

export const DEFAULT_SCALE_INPUTS: ScaleInputs = {
  totalUsers: 1_000_000,
  dauPercentage: 20,
  requestsPerUserPerDay: 50,
  peakMultiplier: 5,
  objectsCreatedPerUserPerDay: 0.5,
  avgObjectSizeKB: 200,
};
