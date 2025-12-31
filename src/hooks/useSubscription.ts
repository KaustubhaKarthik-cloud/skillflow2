import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { getTierByProductId, TierKey } from "@/lib/stripe-config";

interface SubscriptionState {
  isLoading: boolean;
  subscribed: boolean;
  tier: TierKey;
  subscriptionEnd: string | null;
  error: string | null;
}

export function useSubscription() {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    isLoading: true,
    subscribed: false,
    tier: "free",
    subscriptionEnd: null,
    error: null,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState({
        isLoading: false,
        subscribed: false,
        tier: "free",
        subscriptionEnd: null,
        error: null,
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");

      if (error) throw error;

      const tier = getTierByProductId(data.product_id);

      setState({
        isLoading: false,
        subscribed: data.subscribed,
        tier,
        subscriptionEnd: data.subscription_end,
        error: null,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to check subscription",
      }));
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Auto-refresh every minute
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  return {
    ...state,
    refetch: checkSubscription,
  };
}
