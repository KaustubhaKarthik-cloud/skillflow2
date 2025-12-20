import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  content: string;
  reasoning: string | null;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export function useAIChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (messages: Message[]): Promise<AIResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-chat', {
        body: { messages }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data as AIResponse;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get AI response';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { sendMessage, isLoading, error };
}
