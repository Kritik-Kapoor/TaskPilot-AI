"use client";

import BoardColumns from "@/features/(workspace)/board/components/BoardColumns";
import BoardToolbar from "@/features/(workspace)/board/components/BoardToolbar";
import useBoardPage from "@/features/(workspace)/board/hooks/useBoardPage";

const BoardPage = () => {
  const { state, actions } = useBoardPage();

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <BoardToolbar state={state} actions={actions} />
      <BoardColumns columns={state.columns} />
    </div>
  );
};

export default BoardPage;
