export type RequirementSource = "user-stated" | "assumed";

export interface RequirementItem {
  text: string;
  source: RequirementSource;
}

export interface AnalyzedRequirements {
  functional: RequirementItem[];
  nonFunctional: RequirementItem[];
  assumptions: RequirementItem[];
}
