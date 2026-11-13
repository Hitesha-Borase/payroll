/**
 * Kiaan Technology Pvt Ltd - Payroll & HRMS SaaS Plan Limits
 * Authoritative limits synchronized with Option B Subscription Catalog
 */

const PLAN_LIMITS = {
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
  // Alias for backward compatibility
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
    maxEmployees: 999999, // Unlimited
    jobPortalAccess: true,
    multiBranchAccess: true,
    vendorPayrollAccess: true,
    durationDays: 365,
  },
  custom: {
    id: 5,
    name: "OTHER / TAILORED",
    maxEmployees: 999999, // Unlimited
    jobPortalAccess: true,
    multiBranchAccess: true,
    vendorPayrollAccess: true,
    durationDays: 365,
  }
};

const getPlanLimits = (planId) => {
  if (typeof planId === 'number' || !isNaN(Number(planId))) {
    const num = Number(planId);
    if (num === 1) return PLAN_LIMITS.starter;
    if (num === 2) return PLAN_LIMITS.professional;
    if (num === 3) return PLAN_LIMITS.premium;
    if (num === 4) return PLAN_LIMITS.trial;
    if (num === 5) return PLAN_LIMITS.enterprise;
  }
  const key = (planId || 'trial').toLowerCase();
  return PLAN_LIMITS[key] || PLAN_LIMITS.trial;
};

module.exports = {
  PLAN_LIMITS,
  getPlanLimits
};
