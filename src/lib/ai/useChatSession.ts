/**
 * useChatSession — multi-turn conversation state for the AskAI panel.
 *
 * Maintains an in-memory message thread so follow-up questions like
 * "what if I push it to 4pm?" have access to prior context.
 * The session resets on panel close — intentional, keeps things simple.
 */

import { useCallback, useState } from "react";

import { getRecommendation } from "./getRecommendation";
import { useEnvironment } from "../env/EnvironmentProvider";
import type { StructuredResponse } from "../env/types";

export interface ChatTurn {
  role: "user" | "assistant";
  question: string;
  response: StructuredResponse;
}

export interface ChatSession {
  turns: ChatTurn[];
  isLoading: boolean;
  ask: (question: string) => Promise<void>;
  reset: () => void;
}

export function useChatSession(): ChatSession {
  const { context } = useEnvironment();
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const ask = useCallback(
    async (question: string) => {
      if (!context || !question.trim()) return;
      setIsLoading(true);

      // Build flat history for the prompt so the model has conversation context
      const history = turns.flatMap<{ role: "user" | "assistant"; content: string }>((t) => [
        { role: "user", content: t.question },
        { role: "assistant", content: t.response.why },
      ]);

      const response = await getRecommendation("ask_ai", context, {
        question,
        chatHistory: history,
      });

      setTurns((prev) => [...prev, { role: "user", question, response }]);
      setIsLoading(false);
    },
    [context, turns],
  );

  const reset = useCallback(() => setTurns([]), []);

  return { turns, isLoading, ask, reset };
}
