import { Skeleton } from "@/components/ui/skeleton";
import { ButtonSkeleton } from "./Button";

const TableSkeleton = ({ classes = "" }) => {
  return (
    <div className={`space-y-2 ${classes}`}>
      <div className="space-y-2 p-2 border border-gray-100 rounded-lg">
        <div className="grid grid-cols-4 gap-5">
          {[...Array(8)].map(() =>
            [...Array(4)].map((_, index) => (
              <Skeleton
                className="col-span-2 sm:col-span-1 h-10 w-full rounded-xl"
                key={index}
              />
            )),
          )}
        </div>
      </div>
      <div className="flex items-center justify-end gap-x-3">
        <ButtonSkeleton />
        <ButtonSkeleton />
      </div>
    </div>
  );
};

export default TableSkeleton;
