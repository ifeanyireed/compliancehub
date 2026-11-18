/**
 * ComplianceHub.ng - Centralized Subscription Enforcement Service
 *
 * Enforces hard-block limits on documents and seats, computes trial expiration,
 * and provides live quota metrics across the platform.
 */

import {
  PlanTier,
  PlanLimits,
  getTierLimits,
  normalizePlanTier,
  canUploadDocument,
  canInviteMember,
  hasModuleAccess,
  isTrialActive,
  getDaysRemainingInTrial,
  ComplianceModule,
} from "./SubscriptionHelper";

export interface TenantSubscriptionState {
  planTier: PlanTier;
  limits: PlanLimits;
  isTrial: boolean;
  trialEndsAt?: string | null;
  daysRemainingInTrial: number;
  documents: {
    used: number;
    limit: number;
    remaining: number;
    isBlocked: boolean;
    percentage: number;
  };
  seats: {
    used: number;
    limit: number;
    remaining: number;
    isBlocked: boolean;
    percentage: number;
  };
  allowedModules: ComplianceModule[];
}

export class SubscriptionService {
  /**
   * Computes authoritative subscription status and usage percentages from raw tenant inputs.
   */
  static computeState(params: {
    rawPlanTier?: string | null;
    docCount?: number;
    memberCount?: number;
    trialEndsAt?: string | Date | null;
  }): TenantSubscriptionState {
    const planTier = normalizePlanTier(params.rawPlanTier);
    const limits = getTierLimits(planTier);
    const isTrial = planTier === "TRIAL" || isTrialActive(params.trialEndsAt);
    const daysRemaining = isTrial ? getDaysRemainingInTrial(params.trialEndsAt) : 0;

    const usedDocs = Math.max(0, Number(params.docCount || 0));
    const docCheck = canUploadDocument(usedDocs, planTier);
    const docPercentage = Math.min(100, Math.round((usedDocs / (limits.documentLimit || 1)) * 100));

    const usedSeats = Math.max(0, Number(params.memberCount || 1));
    const seatCheck = canInviteMember(usedSeats, planTier);
    const seatPercentage = Math.min(100, Math.round((usedSeats / (limits.seatLimit || 1)) * 100));

    return {
      planTier,
      limits,
      isTrial,
      trialEndsAt: params.trialEndsAt ? new Date(params.trialEndsAt).toISOString() : null,
      daysRemainingInTrial: daysRemaining,
      documents: {
        used: usedDocs,
        limit: limits.documentLimit,
        remaining: docCheck.remaining,
        isBlocked: !docCheck.allowed,
        percentage: docPercentage,
      },
      seats: {
        used: usedSeats,
        limit: limits.seatLimit,
        remaining: seatCheck.remaining,
        isBlocked: !seatCheck.allowed,
        percentage: seatPercentage,
      },
      allowedModules: limits.allowedModules,
    };
  }

  /**
   * Evaluates if a document upload should be hard-blocked.
   */
  static evaluateDocumentUpload(currentCount: number, planTier?: string | null): {
    blocked: boolean;
    error?: string;
    code?: string;
    limit: number;
    current: number;
  } {
    const check = canUploadDocument(currentCount, planTier);
    if (!check.allowed) {
      return {
        blocked: true,
        error: `Document quota exceeded (${check.current}/${check.limit}). Upgrade your subscription plan to upload additional compliance evidence.`,
        code: "DOCUMENT_QUOTA_EXCEEDED",
        limit: check.limit,
        current: check.current,
      };
    }
    return { blocked: false, limit: check.limit, current: check.current };
  }

  /**
   * Evaluates if inviting a new team member should be hard-blocked.
   */
  static evaluateSeatInvite(currentCount: number, planTier?: string | null): {
    blocked: boolean;
    error?: string;
    code?: string;
    limit: number;
    current: number;
  } {
    const check = canInviteMember(currentCount, planTier);
    if (!check.allowed) {
      return {
        blocked: true,
        error: `Workspace seat limit reached (${check.current}/${check.limit} members). Upgrade to add more compliance officers or auditors.`,
        code: "SEAT_QUOTA_EXCEEDED",
        limit: check.limit,
        current: check.current,
      };
    }
    return { blocked: false, limit: check.limit, current: check.current };
  }

  /**
   * Evaluates if a specialist module can be accessed.
   */
  static evaluateModuleAccess(moduleName: ComplianceModule, planTier?: string | null): {
    allowed: boolean;
    error?: string;
    code?: string;
  } {
    const allowed = hasModuleAccess(moduleName, planTier);
    if (!allowed) {
      return {
        allowed: false,
        error: `Access to the ${moduleName.toUpperCase()} module is restricted on your current plan. Upgrade to Business or Professional to unlock this feature.`,
        code: "MODULE_RESTRICTED",
      };
    }
    return { allowed: true };
  }
}
