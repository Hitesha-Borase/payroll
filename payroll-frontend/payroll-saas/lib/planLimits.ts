/**
 * Kiaan Technology Pvt Ltd - Payroll & HRMS SaaS Plan Limits (Frontend TS)
 */

export interface PlanLimit {
  name: string;
  maxEmployees: number;
  jobPortalAccess: boolean;
  multiBranchAccess: boolean;
  vendorPayrollAccess: boolean;
  durationDays: number;
}

export const PLAN_LIMITS: Record<string, PlanLimit> = {
  trial: {
    name: "FREE TRIAL",
    maxEmployees: 10,
    jobPortalAccess: false,
    multiBranchAccess: false,
    vendorPayrollAccess: false,
    durationDays: 7,
  },
  basic: {
    name: "BASIC PLAN",
    maxEmployees: 20,
    jobPortalAccess: true,
    multiBranchAccess: false,
    vendorPayrollAccess: false,
    durationDays: 30,
  },
  professional: {
    name: "PROFESSIONAL PLAN",
    maxEmployees: 40,
    jobPortalAccess: true,
    multiBranchAccess: false,
    vendorPayrollAccess: false,
    durationDays: 30,
  },
  enterprise: {
    name: "ENTERPRISE PLAN",
    maxEmployees: 50,
    jobPortalAccess: true,
    multiBranchAccess: true,
    vendorPayrollAccess: true,
    durationDays: 30,
  },
  custom: {
    name: "OTHER / TAILORED",
    maxEmployees: 999999,
    jobPortalAccess: true,
    multiBranchAccess: true,
    vendorPayrollAccess: true,
    durationDays: 365,
  }
};

export const getPlanLimits = (planId?: string): PlanLimit => {
  const key = (planId || 'trial').toLowerCase();
  return PLAN_LIMITS[key] || PLAN_LIMITS.trial;
};
