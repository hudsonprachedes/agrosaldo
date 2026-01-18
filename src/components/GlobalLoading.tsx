import { useEffect, useMemo, useState } from "react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type GlobalLoadingProps = {
  title?: string;
  className?: string;
};

export default function GlobalLoading({ title = "Carregando...", className }: GlobalLoadingProps) {
  const [progress, setProgress] = useState(12);

  const steps = useMemo(() => [3, 5, 4, 6, 8, 7, 5], []);

  useEffect(() => {
    let i = 0;
    const id = window.setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + steps[i % steps.length], 92);
        i += 1;
        return next;
      });
    }, 520);

    return () => window.clearInterval(id);
  }, [steps]);

  return (
    <div className={cn("min-h-screen w-full flex items-center justify-center p-6", className)}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-5">
          <div className="h-20 w-20 rounded-2xl bg-background/60 p-2 shadow-sm ring-1 ring-border">
            <img
              src="/agrosaldo-logo.png"
              alt="AgroSaldo"
              className="h-full w-full object-contain animate-pulse"
            />
          </div>

          <div className="text-center">
            <div className="font-display text-lg font-bold text-foreground">{title}</div>
            <div className="mt-1 text-sm text-muted-foreground">Preparando tudo para você</div>
          </div>

          <div className="w-full space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Carregando</span>
              <span>{progress}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
