export type Plan = "FREE" | "STARTER" | "PRO" | "AGENCY";

export interface PlanLimits {
  maxLeads: number | null;
  maxEmailsPerDay: number | null;
  maxUsers: number | null;
  maxSequences: number | null;
  maxJourneys: number | null;
  mapsImport: boolean;
  autopilot: boolean;
  whiteLabel: boolean;
  apiAccess: boolean;
}

export function getPlanLimits(plan: Plan): PlanLimits {
  switch (plan) {
    case "STARTER":
      return {
        maxLeads: 2000,
        maxEmailsPerDay: 100,
        maxUsers: 1,
        maxSequences: 1,
        maxJourneys: 1,
        mapsImport: false,
        autopilot: false,
        whiteLabel: false,
        apiAccess: false,
      };
    case "PRO":
      return {
        maxLeads: 20000,
        maxEmailsPerDay: 500,
        maxUsers: 5,
        maxSequences: null,
        maxJourneys: null,
        mapsImport: true,
        autopilot: false,
        whiteLabel: false,
        apiAccess: false,
      };
    case "AGENCY":
      return {
        maxLeads: null,
        maxEmailsPerDay: null,
        maxUsers: null,
        maxSequences: null,
        maxJourneys: null,
        mapsImport: true,
        autopilot: true,
        whiteLabel: true,
        apiAccess: true,
      };
    default: // FREE
      return {
        maxLeads: 100,
        maxEmailsPerDay: 20,
        maxUsers: 1,
        maxSequences: 1,
        maxJourneys: 1,
        mapsImport: false,
        autopilot: false,
        whiteLabel: false,
        apiAccess: false,
      };
  }
}

export function canUseFeature(plan: Plan, feature: keyof PlanLimits): boolean {
  const limits = getPlanLimits(plan);
  const val = limits[feature];
  if (typeof val === "boolean") return val;
  return val !== 0;
}

export function isLeadLimitReached(plan: Plan, count: number): boolean {
  const limits = getPlanLimits(plan);
  if (limits.maxLeads === null) return false;
  return count >= limits.maxLeads;
}
