import { ButtonSkeleton } from "@/components/common/loading-skeleton/Button";
import {
  InputWithLabelSkeleton,
  TextAreaWithLabelSkeleton,
} from "@/components/common/loading-skeleton/Input";
import { Skeleton } from "@/components/ui/skeleton";

const SettingsPageSkeleton = () => {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="max-w-md space-y-4">
        <InputWithLabelSkeleton />
        <InputWithLabelSkeleton />
        <TextAreaWithLabelSkeleton />
        <ButtonSkeleton />
      </div>
    </div>
  );
};

export default SettingsPageSkeleton;
