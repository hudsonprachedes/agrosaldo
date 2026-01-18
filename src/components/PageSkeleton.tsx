import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type PageSkeletonProps = {
  className?: string;
  header?: boolean;
  cards?: number;
  lines?: number;
};

export default function PageSkeleton({ className, header = true, cards = 4, lines = 8 }: PageSkeletonProps) {
  return (
    <div className={cn("p-4 md:p-6 lg:p-8 space-y-6", className)}>
      {header && (
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
      )}

      {cards > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: cards }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      )}

      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={cn("h-4", i % 3 === 0 ? "w-11/12" : i % 3 === 1 ? "w-10/12" : "w-9/12")} />
        ))}
      </div>
    </div>
  );
}
