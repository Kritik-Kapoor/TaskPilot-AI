import { Skeleton } from "@/components/ui/skeleton";

const ProjectsPageSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-10 w-72" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-xl border bg-card p-5">
            <div className="flex items-start gap-3">
              <Skeleton className="size-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            <div className="mt-5 border-t pt-4">
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectsPageSkeleton;
