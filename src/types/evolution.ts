import type { Architecture } from "@/types/architecture";
import type { ScaleEstimates } from "@/types/scale";

export interface EvolutionStage {
  label: string;
  scale: ScaleEstimates;
  architecture: Architecture;
  addedComponents: string[];
  triggerReason: string;
}
