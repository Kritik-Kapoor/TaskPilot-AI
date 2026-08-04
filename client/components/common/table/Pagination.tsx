import { Button } from "@/components/ui/button";

interface PaginationProps {
  getCanPreviousPage: boolean;
  getCanNextPage: boolean;
  previousPage: () => void;
  nextPage: () => void;
}

const Pagination = ({
  getCanPreviousPage,
  getCanNextPage,
  previousPage,
  nextPage,
}: PaginationProps) => {
  return (
    <div className="flex items-center justify-end space-x-2 py-4">
      <Button
        variant="outline"
        onClick={() => getCanPreviousPage && previousPage()}
        disabled={!getCanPreviousPage}
      >
        Previous
      </Button>
      <Button
        variant="outline"
        onClick={() => getCanNextPage && nextPage()}
        disabled={!getCanNextPage}
      >
        Next
      </Button>
    </div>
  );
};

export default Pagination;
