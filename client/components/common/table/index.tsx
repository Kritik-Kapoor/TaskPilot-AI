import { useState } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  type ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import Pagination from "./Pagination";
import SearchFilter from "./SearchFilter";

interface DataTableProps<TData extends object, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterColumn?: string;
  emptyDataText?: string;
  isSearching?: boolean;
  isPaginated?: boolean;
  manualPagination?: boolean;
  page?: number;
  setPage?: (page: number) => void;
  pageSize?: number;
  canGetNextPage?: boolean;
  onTableRowClick?: (id: string) => void;
  mainClasses?: string;
  bodyClasses?: string;
  headerClasses?: string;
}

export function DataTable<TData extends object, TValue>({
  columns,
  data,
  filterColumn,
  emptyDataText = "No data Found",
  isSearching = false,
  isPaginated = true,
  manualPagination = false,
  page,
  setPage,
  pageSize = 10,
  canGetNextPage = false,
  onTableRowClick,
  mainClasses,
  bodyClasses,
  headerClasses,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: manualPagination,
    state: {
      columnFilters,
      ...(manualPagination && page !== undefined
        ? {
            pagination: {
              pageIndex: page - 1,
              pageSize: pageSize,
            },
          }
        : {}),
    },
    initialState: !manualPagination
      ? {
          pagination: {
            pageSize: pageSize,
          },
        }
      : undefined,
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    table.getColumn(filterColumn as string)?.setFilterValue(event.target.value);
  };

  return (
    <div>
      {filterColumn && (
        <SearchFilter
          value={
            (table.getColumn(filterColumn)?.getFilterValue() as string) ?? ""
          }
          onChange={handleSearchChange}
        />
      )}
      <div
        className={`rounded-lg border overflow-x-auto w-full sm:w-full p-3 bg-white ${mainClasses}`}
      >
        <Table className="min-w-150 w-full table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={`p-2 text-xs sm:text-sm ${headerClasses}`}
                      style={
                        header.getSize()
                          ? {
                              width: header.getSize(),
                              maxWidth:
                                header.column.columnDef.maxSize ??
                                header.getSize(),
                            }
                          : {}
                      }
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isSearching ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="bg-muted/50 text-center pointer-events-none text-slate-500 px-2 py-2 text-xs sm:text-sm"
                >
                  <Loader2 className="animate-spin inline-block" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={`${onTableRowClick && "cursor-pointer"}`}
                  onClick={() => {
                    if (
                      onTableRowClick &&
                      "id" in row.original &&
                      typeof row.original.id === "string"
                    ) {
                      onTableRowClick(row.original.id);
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={`px-2 py-2 text-xs sm:text-sm ${bodyClasses}`}
                      style={
                        cell.column.getSize()
                          ? {
                              width: cell.column.getSize(),
                              maxWidth:
                                cell.column.columnDef.maxSize ??
                                cell.column.getSize(),
                            }
                          : {}
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center pointer-events-none text-slate-500 px-2 py-2 text-xs sm:text-sm"
                >
                  {emptyDataText}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {isPaginated && (
        <Pagination
          getCanPreviousPage={
            manualPagination ? page! > 1 : table.getCanPreviousPage()
          }
          getCanNextPage={
            manualPagination ? canGetNextPage : table.getCanNextPage()
          }
          previousPage={() =>
            manualPagination ? setPage?.(page! - 1) : table.previousPage()
          }
          nextPage={() =>
            manualPagination ? setPage?.(page! + 1) : table.nextPage()
          }
        />
      )}
    </div>
  );
}
