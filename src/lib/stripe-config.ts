export const STRIPE_TIERS = {
  free: {
    name: "Free",
    price: 0,
    description: "Perfect for getting started",
    features: [
      "1 AI-generated roadmap",
      "Basic task tracking",
      "Community support",
      "5 AI reviews per month",
    ],
    priceId: null,
    productId: null,
  },
  pro: {
    name: "Pro",
    price: 19.99,
    description: "For serious learners",
    features: [
      "Unlimited AI roadmaps",
      "Advanced analytics",
      "Priority AI reviews",
      "Email support",
      "Custom milestones",
      "Progress insights",
    ],
    priceId: "price_1SkOSV0lt5N8Z5KkAVdGHxIi",
    productId: "prod_Tho4ooCEst9k2e",
  },
  enterprise: {
    name: "Enterprise",
    price: 49.99,
    description: "For teams and organizations",
    features: [
      "Everything in Pro",
      "Team management",
      "SSO integration",
      "Dedicated support",
      "Custom integrations",
      "Admin dashboard",
      "API access",
    ],
    priceId: "price_1SkOSy0lt5N8Z5Kkfjgp5Hr2",
    productId: "prod_Tho5uQG3hyglLM",
  },
} as const;

export type TierKey = keyof typeof STRIPE_TIERS;

export function getTierByProductId(productId: string | null): TierKey {
  if (!productId) return "free";
  if (productId === STRIPE_TIERS.pro.productId) return "pro";
  if (productId === STRIPE_TIERS.enterprise.productId) return "enterprise";
  return "free";
}
