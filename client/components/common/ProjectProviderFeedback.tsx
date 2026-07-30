import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

type ProjectProviderFatalErrorProps = {
  title: string;
  description: string;
  onRetry: () => void;
  isRetrying?: boolean;
};

export function ProjectProviderFatalError({
  title,
  description,
  onRetry,
  isRetrying = false,
}: ProjectProviderFatalErrorProps) {
  return (
    <div className="grid h-svh place-items-center bg-background p-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button onClick={onRetry} disabled={isRetrying}>
          {isRetrying ? (
            <span className="inline-flex items-center gap-2">
              <RefreshCw className="size-4 animate-spin" />
              Retrying...
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <RefreshCw className="size-4" />
              Try again
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

type ProjectRoleWarningBannerProps = {
  onRetry: () => void;
  isRetrying?: boolean;
};

export function ProjectRoleWarningBanner({
  onRetry,
  isRetrying = false,
}: ProjectRoleWarningBannerProps) {
  return (
    <div
      role="alert"
      className="flex shrink-0 items-center justify-between gap-4 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm"
    >
      <p className="text-amber-950 dark:text-amber-100">
        We couldn&apos;t verify your project role. You&apos;ve been assigned the{" "}
        <span className="font-medium">Viewer</span> role until this is resolved.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        disabled={isRetrying}
        className="shrink-0 border-amber-500/40 bg-background/80 hover:bg-background"
      >
        {isRetrying ? <RefreshCw className="size-3.5 animate-spin" /> : "Retry"}
      </Button>
    </div>
  );
}
