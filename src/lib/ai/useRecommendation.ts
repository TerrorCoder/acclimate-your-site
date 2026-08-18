import { useQuery } from "@tanstack/react-query";

import { useEnvironment } from "../env/EnvironmentProvider";
import type { StructuredResponse, TaskType } from "../env/types";
import { getRecommendation, type RecommendationOptions } from "./getRecommendation";

export function useRecommendation(
  taskType: TaskType,
  options: RecommendationOptions = {},
  enabled = true,
) {
  const { context } = useEnvironment();
  return useQuery<StructuredResponse>({
    queryKey: ["ai", taskType, context?.fetchedAt, context?.location.name, JSON.stringify(options)],
    queryFn: () => getRecommendation(taskType, context!, options),
    enabled: enabled && Boolean(context),
    staleTime: 5 * 60 * 1000,
  });
}
