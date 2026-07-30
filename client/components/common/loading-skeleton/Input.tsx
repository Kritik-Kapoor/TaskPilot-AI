import { Skeleton } from "@/components/ui/skeleton";

export const InputWithLabelSkeleton = ({ classes = "" }) => {
  return (
    <div className={`space-y-1 ${classes}`}>
      <Skeleton className="h-4.5 w-35 rounded-xl" />
      <Skeleton className="h-9 w-full rounded-xl" />
    </div>
  );
};

export const InputSkeleton = ({ classes = "" }) => {
  return (
    <div className={`space-y-1 ${classes}`}>
      <Skeleton className="h-9 w-full rounded-xl" />
    </div>
  );
};

export const TextAreaWithLabelSkeleton = ({ classes = "" }) => {
  return (
    <div className={`space-y-1 ${classes}`}>
      <Skeleton className="h-4.5 w-35 rounded-xl" />
      <Skeleton className="h-32.5 w-full rounded-xl" />
    </div>
  );
};
