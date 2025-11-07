export const AGENT_CONFIG = {
  models: {
    base: "gpt-4o-mini",
    advanced: "gpt-4o"
  },
  limits: {
    complexityThreshold: 10
  }
} as const;

export const USER_ROLES = {
  BEGINNER: "beginner",
  EXPERT: "expert"
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];