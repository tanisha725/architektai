"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { estimateScale } from "@/lib/scale-estimator";
import { DEFAULT_SCALE_INPUTS, type ScaleEstimates, type ScaleInputs } from "@/types/scale";

const INPUT_FIELDS: {
  key: keyof ScaleInputs;
  label: string;
  step?: string;
}[] = [
  { key: "totalUsers", label: "Total registered users" },
  { key: "dauPercentage", label: "Daily active users (% of total)" },
  { key: "requestsPerUserPerDay", label: "Requests per active user / day" },
  { key: "peakMultiplier", label: "Peak traffic multiplier (x average)" },
  { key: "objectsCreatedPerUserPerDay", label: "Posts/uploads per active user / day", step: "0.1" },
  { key: "avgObjectSizeKB", label: "Avg. size per upload (KB)" },
];

function formatNumber(value: number, maxFractionDigits = 0): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: maxFractionDigits });
}

export function ScaleEstimator({
  initialTotalUsers,
  onEstimatesChange,
}: {
  initialTotalUsers?: number;
  onEstimatesChange?: (estimates: ScaleEstimates) => void;
}) {
  const [inputs, setInputs] = useState<ScaleInputs>({
    ...DEFAULT_SCALE_INPUTS,
    totalUsers: initialTotalUsers ?? DEFAULT_SCALE_INPUTS.totalUsers,
  });

  const estimates = useMemo(() => estimateScale(inputs), [inputs]);

  // Report estimates up whenever they change, so a parent (e.g. the architecture
  // planner) can react to them without owning this component's input state.
  useEffect(() => {
    onEstimatesChange?.(estimates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimates]);

  function updateField(key: keyof ScaleInputs, rawValue: string) {
    const value = Number(rawValue);
    setInputs((prev) => ({ ...prev, [key]: Number.isFinite(value) ? value : prev[key] }));
  }

  return (
    <div className="grid w-full gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assumptions (editable)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {INPUT_FIELDS.map((field) => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <Label htmlFor={field.key} className="text-xs text-muted-foreground">
                {field.label}
              </Label>
              <Input
                id={field.key}
                type="number"
                step={field.step ?? "1"}
                value={inputs[field.key]}
                onChange={(e) => updateField(field.key, e.target.value)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estimates</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <EstimateRow
            label="Daily active users"
            value={formatNumber(estimates.dau)}
            formula="Total users x DAU %"
          />
          <EstimateRow
            label="Daily requests"
            value={formatNumber(estimates.dailyRequests)}
            formula="DAU x requests/user/day"
          />
          <EstimateRow
            label="Average QPS"
            value={`${formatNumber(estimates.averageQps)} req/s`}
            formula="Daily requests / 86,400 seconds"
          />
          <EstimateRow
            label="Peak QPS"
            value={`${formatNumber(estimates.peakQps)} req/s`}
            formula="Average QPS x peak multiplier"
          />
          <EstimateRow
            label="Storage / day"
            value={`${formatNumber(estimates.storagePerDayGB, 2)} GB`}
            formula="Objects created/day x avg size"
          />
          <EstimateRow
            label="Storage / year"
            value={`${formatNumber(estimates.storagePerYearTB, 2)} TB`}
            formula="Storage/day x 365"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function EstimateRow({ label, value, formula }: { label: string; value: string; formula: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2 last:border-0 last:pb-0">
      <div>
        <p className="text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{formula}</p>
      </div>
      <p className="shrink-0 font-mono text-sm font-medium">{value}</p>
    </div>
  );
}
