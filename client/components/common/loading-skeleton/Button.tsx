import { Skeleton } from "@/components/ui/skeleton";

export const ButtonSkeleton = ({ height = "40px", classes = "rounded-xl" }) => {
  return <Skeleton className={`w-40 ${classes}`} style={{ height: height }} />;
};
