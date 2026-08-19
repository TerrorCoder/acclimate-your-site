import { useRecommendation } from "@/lib/ai/useRecommendation";
import { AiLabel, BasedOn } from "@/components/ai/ResponseCard";
import { PanelSkeleton } from "@/components/states";

export function FoodCard() {
  const { data, isFetching } = useRecommendation("food");
  if (!data || isFetching) return <PanelSkeleton lines={4} />;

  return (
    <section aria-labelledby="food" className="panel p-4 md:p-4">
      <AiLabel>Food &amp; drink</AiLabel>
      <h2 id="food" className="display-md mt-1">
        What should I eat today?
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{data.mainConsideration}</p>
      <ul className="mt-3 space-y-2.5">
        {data.whatToDo.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted-foreground">{data.why}</p>
      <BasedOn sources={data.dataUsed} />
    </section>
  );
}
