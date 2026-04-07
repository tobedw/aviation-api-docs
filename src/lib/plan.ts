// Derive plan tier from the plan string stored in KV
// e.g. "API Key - Community", "API Key - Starter", "API Key - Growth", "API Key - Enterprise"

export type PlanTier = 'free' | 'starter' | 'growth' | 'enterprise'

export interface PlanLimits {
  maxPageSize: number   // max ?limit= per request
  requireFilter: boolean // bulk endpoints require at least one filter
}

export function getPlanTier(plan: string): PlanTier {
  const p = plan.toLowerCase()
  if (p.includes('enterprise')) return 'enterprise'
  if (p.includes('growth') || p.includes('pro')) return 'growth'
  if (p.includes('starter') || p.includes('startup')) return 'starter'
  return 'free'
}

export function getPlanLimits(plan: string): PlanLimits {
  const tier = getPlanTier(plan)
  switch (tier) {
    case 'enterprise': return { maxPageSize: 500, requireFilter: false }
    case 'growth':     return { maxPageSize: 500, requireFilter: false }
    case 'starter':    return { maxPageSize: 100, requireFilter: false }
    default:           return { maxPageSize: 50,  requireFilter: true  }
  }
}
