import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Check, Zap, Crown, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { STRIPE_TIERS, TierKey } from "@/lib/stripe-config";

const tierIcons: Record<TierKey, React.ReactNode> = {
  free: <Zap className="w-6 h-6" />,
  pro: <Crown className="w-6 h-6" />,
  enterprise: <Building2 className="w-6 h-6" />,
};

const Pricing = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { tier: currentTier, isLoading: subLoading } = useSubscription();
  const [loadingTier, setLoadingTier] = useState<TierKey | null>(null);

  const handleSubscribe = async (tierKey: TierKey) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const tier = STRIPE_TIERS[tierKey];
    if (!tier.priceId) return;

    setLoadingTier(tierKey);

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: tier.priceId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create checkout session");
    } finally {
      setLoadingTier(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoadingTier("pro");

    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to open customer portal");
    } finally {
      setLoadingTier(null);
    }
  };

  const isLoading = authLoading || subLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-xl font-bold text-foreground">
              Skill<span className="text-primary">Flow</span>
            </Link>
            <div className="flex items-center gap-4">
              {user ? (
                <Button variant="outline" onClick={() => navigate("/dashboard")}>
                  Dashboard
                </Button>
              ) : (
                <Button variant="outline" onClick={() => navigate("/auth")}>
                  Log in
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4">
              Simple, transparent pricing
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Choose Your Learning Path
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free and upgrade as you grow. All plans include core features to accelerate your tech career.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {(Object.keys(STRIPE_TIERS) as TierKey[]).map((tierKey, index) => {
              const tier = STRIPE_TIERS[tierKey];
              const isCurrentPlan = currentTier === tierKey;
              const isPopular = tierKey === "pro";

              return (
                <motion.div
                  key={tierKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className={`relative h-full flex flex-col ${
                      isPopular
                        ? "border-primary shadow-lg shadow-primary/20 scale-105"
                        : "border-border"
                    } ${isCurrentPlan ? "ring-2 ring-primary" : ""}`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    {isCurrentPlan && (
                      <div className="absolute -top-3 right-4">
                        <Badge variant="outline" className="bg-background">
                          Current Plan
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
                        {tierIcons[tierKey]}
                      </div>
                      <CardTitle className="text-2xl">{tier.name}</CardTitle>
                      <CardDescription>{tier.description}</CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1">
                      <div className="text-center mb-6">
                        <span className="text-4xl font-bold text-foreground">
                          ${tier.price}
                        </span>
                        {tier.price > 0 && (
                          <span className="text-muted-foreground">/month</span>
                        )}
                      </div>

                      <ul className="space-y-3">
                        {tier.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>

                    <CardFooter>
                      {isLoading ? (
                        <Button className="w-full" disabled>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Loading...
                        </Button>
                      ) : isCurrentPlan && tierKey !== "free" ? (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleManageSubscription}
                          disabled={loadingTier !== null}
                        >
                          {loadingTier ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : null}
                          Manage Subscription
                        </Button>
                      ) : tierKey === "free" ? (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => navigate(user ? "/dashboard" : "/auth")}
                        >
                          {user ? "Go to Dashboard" : "Get Started"}
                        </Button>
                      ) : (
                        <Button
                          variant={isPopular ? "default" : "outline"}
                          className="w-full"
                          onClick={() => handleSubscribe(tierKey)}
                          disabled={loadingTier !== null}
                        >
                          {loadingTier === tierKey ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : null}
                          {user ? "Subscribe" : "Get Started"}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-20 text-center"
          >
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Questions?
            </h2>
            <p className="text-muted-foreground">
              Contact us at support@skillflow.dev or check our{" "}
              <Link to="/" className="text-primary hover:underline">
                FAQ page
              </Link>
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
