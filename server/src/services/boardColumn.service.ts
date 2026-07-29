import { DEFAULT_BOARD_COLUMNS } from "../constants/boardColumns.js";
import type { Prisma } from "../generated/prisma/client.js";

type TransactionClient = Prisma.TransactionClient;

export const seedDefaultBoardColumns = (
  tx: TransactionClient,
  projectId: string,
) =>
  tx.boardColumn.createMany({
    data: DEFAULT_BOARD_COLUMNS.map((column) => ({
      projectId,
      name: column.name,
      color: column.color,
      position: column.position,
    })),
  });
