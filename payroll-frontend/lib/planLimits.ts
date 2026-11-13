/**
 * Kiaan Technology Pvt Ltd - Payroll & HRMS SaaS Plan Limits (Frontend TS)
 * Authoritative limits synchronized with Option B Subscription Catalog
 */

export interface PlanLimit {
  id?: number;
  name: string;
  maxEmployees: number;
  jobPortalAccess: boolean;
  multiBranchAccess: boolean;
  vendorPayrollAccess: boolean;
  durationDays: number;
}

export const PLAN_LIMITS: Record<string, PlanLimit> = {
  trial: {
    id: 4,
    name: "FREE TRIAL",
    maxEmployees: 10,
    jobPortalAccess: false,
    multiBranchAccess: false,
    vendorPayrollAccess: false,
    durationDays: 7,
  },
  starter: {
    id: 1,
    name: "STARTER PLAN",
    maxEmployees: 15,
    jobPortalAccess: true,
    multiBranchAccess: false,
    vendorPayrollAccess: false,
    durationDays: 30,
  },
  // Backward compatibility alias
  basic: {
    id: 1,
    name: "STARTER PLAN",
    maxEmployees: 15,
    jobPortalAccess: true,
    multiBranchAccess: false,
    vendorPayrollAccess: false,
    durationDays: 30,
  },
  professional: {
    id: 2,
    name: "PROFESSIONAL PLAN",
    maxEmployees: 50,
    jobPortalAccess: true,
    multiBranchAccess: false,
    vendorPayrollAccess: false,
    durationDays: 30,
  },
  pro: {
    id: 2,
    name: "PROFESSIONAL PLAN",
    maxEmployees: 50,
    jobPortalAccess: true,
    multiBranchAccess: false,
    vendorPayrollAccess: false,
    durationDays: 30,
  },
  premium: {
    id: 3,
    name: "PREMIUM PLAN",
    maxEmployees: 100,
    jobPortalAccess: true,
    multiBranchAccess: true,
    vendorPayrollAccess: true,
    durationDays: 30,
  },
  enterprise: {
    id: 5,
    name: "ENTERPRISE PLAN",
    maxEmployees: 999999,
    jobPortalAccess: true,
    multiBranchAccess: true,
    vendorPayrollAccess: true,
    durationDays: 365,
  },
  custom: {
    id: 5,
    name: "OTHER / TAILORED",
    maxEmployees: 999999,
    jobPortalAccess: true,
    multiBranchAccess: true,
    vendorPayrollAccess: true,
    durationDays: 365,
  }
};

export const getPlanLimits = (planId?: string | number): PlanLimit => {
  if (typeof planId === 'number' || (typeof planId === 'string' && !isNaN(Number(planId)))) {
    const num = Number(planId);
    if (num === 1) return PLAN_LIMITS.starter;
    if (num === 2) return PLAN_LIMITS.professional;
    if (num === 3) return PLAN_LIMITS.premium;
    if (num === 4) return PLAN_LIMITS.trial;
    if (num === 5) return PLAN_LIMITS.enterprise;
  }
  const key = (String(planId || 'trial')).toLowerCase();
  return PLAN_LIMITS[key] || PLAN_LIMITS.trial;
};
