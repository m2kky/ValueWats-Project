const prisma = require('../config/database');

const PAID_SEAT_ROLES = ['owner', 'admin', 'supervisor', 'agent'];
const LEGACY_PLAN_ALIASES = {
  basic: 'starter',
  pro: 'growth',
  business: 'scale',
  advanced: 'scale',
};

function normalizePlanName(planName) {
  const normalized = String(planName || '').trim().toLowerCase();
  return LEGACY_PLAN_ALIASES[normalized] || normalized;
}

function isPaidSeatRole(role) {
  return PAID_SEAT_ROLES.includes(String(role || '').trim().toLowerCase());
}

async function resolvePlanByName(planName) {
  const normalized = normalizePlanName(planName);
  if (!normalized) return null;
  return prisma.plan.findUnique({ where: { name: normalized } });
}

async function resolveTenantPlanByTenant(tenant) {
  if (!tenant) return null;
  if (tenant.plan) return tenant.plan;
  if (!tenant.subscriptionPlan) return null;
  return resolvePlanByName(tenant.subscriptionPlan);
}

async function resolveTenantPlanByTenantId(tenantId) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  if (!tenant) return { tenant: null, plan: null };

  const plan = await resolveTenantPlanByTenant(tenant);
  return { tenant, plan };
}

async function getSeatUsageForTenant(tenantId) {
  const { tenant, plan } = await resolveTenantPlanByTenantId(tenantId);
  if (!tenant) return null;

  const [paidUsers, pendingPaidInvitations] = await Promise.all([
    prisma.user.count({
      where: {
        tenantId,
        role: { in: PAID_SEAT_ROLES },
      },
    }),
    prisma.invitation.count({
      where: {
        tenantId,
        role: { in: PAID_SEAT_ROLES },
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
    }),
  ]);

  const unlimitedUsers = Boolean(plan?.unlimitedUsers);
  const includedUsers = plan?.includedUsers ?? null;
  const occupiedSeats = paidUsers + pendingPaidInvitations;
  const availablePaidSeats = unlimitedUsers || includedUsers === null
    ? null
    : Math.max(includedUsers - occupiedSeats, 0);

  return {
    planId: plan?.id || null,
    planName: plan?.name || tenant.subscriptionPlan || null,
    unlimitedUsers,
    includedUsers,
    paidUsers,
    pendingPaidInvitations,
    occupiedSeats,
    availablePaidSeats,
    additionalUserPrice: plan?.additionalUserPrice != null
      ? Number(plan.additionalUserPrice)
      : null,
  };
}

async function enforceSeatLimitForRole({ tenantId, role }) {
  if (!isPaidSeatRole(role)) return null;

  const seatUsage = await getSeatUsageForTenant(tenantId);
  if (!seatUsage) return null;

  if (!seatUsage.unlimitedUsers && seatUsage.availablePaidSeats !== null && seatUsage.availablePaidSeats <= 0) {
    const err = new Error(
      `You reached your plan limit (${seatUsage.includedUsers}) for paid users. Upgrade your plan or buy extra seats to invite more users.`
    );
    err.status = 402;
    err.payload = {
      error: err.message,
      code: 'PAID_SEAT_LIMIT_REACHED',
      seatUsage,
    };
    throw err;
  }

  return seatUsage;
}

module.exports = {
  PAID_SEAT_ROLES,
  isPaidSeatRole,
  normalizePlanName,
  resolvePlanByName,
  resolveTenantPlanByTenant,
  resolveTenantPlanByTenantId,
  getSeatUsageForTenant,
  enforceSeatLimitForRole,
};

