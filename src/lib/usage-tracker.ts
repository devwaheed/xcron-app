import type { SupabaseClient } from '@supabase/supabase-js';

export interface UserPlanData {
  planId: number;
  planName: string;
  maxActions: number;
  maxRunsPerMonth: number;
  logRetentionDays: number;
  billingCycleStart: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  resetDate?: string;
}

export interface UsageStatsResult {
  planName: string;
  actions: { used: number; limit: number };
  runs: { used: number; limit: number };
  billingCycleReset: string;
  logRetentionDays: number;
}

/**
 * Computes the current billing cycle start and end dates based on
 * the original billing_cycle_start, advancing in 30-day increments.
 */
export function getBillingCycleRange(billingCycleStart: string): { start: Date; end: Date } {
  const origin = new Date(billingCycleStart);
  const now = new Date();
  const msPerCycle = 30 * 24 * 60 * 60 * 1000;

  // Advance in 30-day increments until we find the current cycle
  let cycleStart = origin;
  while (cycleStart.getTime() + msPerCycle <= now.getTime()) {
    cycleStart = new Date(cycleStart.getTime() + msPerCycle);
  }

  const cycleEnd = new Date(cycleStart.getTime() + msPerCycle);
  return { start: cycleStart, end: cycleEnd };
}

/**
 * Fetches the user's current plan details by joining user_plans + plans.
 */
export async function getUserPlan(
  supabase: SupabaseClient,
  userId: string
): Promise<UserPlanData> {
  const { data, error } = await supabase
    .from('user_plans')
    .select(`
      plan_id,
      billing_cycle_start,
      stripe_customer_id,
      stripe_subscription_id,
      plans (
        name,
        max_actions,
        max_runs_per_month,
        log_retention_days
      )
    `)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error('User plan not found');
  }

  const plan = data.plans as unknown as {
    name: string;
    max_actions: number;
    max_runs_per_month: number;
    log_retention_days: number;
  };

  return {
    planId: data.plan_id,
    planName: plan.name,
    maxActions: plan.max_actions,
    maxRunsPerMonth: plan.max_runs_per_month,
    logRetentionDays: plan.log_retention_days,
    billingCycleStart: data.billing_cycle_start,
    stripeCustomerId: data.stripe_customer_id,
    stripeSubscriptionId: data.stripe_subscription_id,
  };
}

/**
 * Checks whether the user can create another action.
 */
export async function checkActionLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<LimitCheckResult> {
  const userPlan = await getUserPlan(supabase, userId);

  const { count, error } = await supabase
    .from('actions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) throw new Error('Failed to count actions');

  const current = count ?? 0;
  return {
    allowed: current < userPlan.maxActions,
    current,
    limit: userPlan.maxActions,
  };
}

/**
 * Checks whether the user can trigger another run in the current billing cycle.
 */
export async function checkRunLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<LimitCheckResult> {
  const userPlan = await getUserPlan(supabase, userId);
  const { start, end } = getBillingCycleRange(userPlan.billingCycleStart);

  const { count, error } = await supabase
    .from('runs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('triggered_at', start.toISOString())
    .lt('triggered_at', end.toISOString());

  if (error) throw new Error('Failed to count runs');

  const current = count ?? 0;
  return {
    allowed: current < userPlan.maxRunsPerMonth,
    current,
    limit: userPlan.maxRunsPerMonth,
    resetDate: end.toISOString(),
  };
}

/**
 * Records a run in the runs table after a successful trigger.
 */
export async function recordRun(
  supabase: SupabaseClient,
  actionId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('runs')
    .insert({ action_id: actionId, user_id: userId });

  if (error) {
    console.error('Failed to record run:', error.message);
  }
}

/**
 * Returns full usage statistics for the dashboard display.
 */
export async function getUsageStats(
  supabase: SupabaseClient,
  userId: string
): Promise<UsageStatsResult> {
  const userPlan = await getUserPlan(supabase, userId);
  const { start, end } = getBillingCycleRange(userPlan.billingCycleStart);

  // Count actions
  const { count: actionCount } = await supabase
    .from('actions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Count runs in current billing cycle
  const { count: runCount } = await supabase
    .from('runs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('triggered_at', start.toISOString())
    .lt('triggered_at', end.toISOString());

  return {
    planName: userPlan.planName,
    actions: { used: actionCount ?? 0, limit: userPlan.maxActions },
    runs: { used: runCount ?? 0, limit: userPlan.maxRunsPerMonth },
    billingCycleReset: end.toISOString(),
    logRetentionDays: userPlan.logRetentionDays,
  };
}

/**
 * Assigns a plan to a user and resets the billing cycle.
 */
export async function assignPlan(
  supabase: SupabaseClient,
  userId: string,
  planId: number
): Promise<void> {
  const { error } = await supabase
    .from('user_plans')
    .update({
      plan_id: planId,
      billing_cycle_start: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) throw new Error('Failed to assign plan');
}
