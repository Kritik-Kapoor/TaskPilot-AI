"use client";

import { DataTable } from "@/components/common/table";
import ConfirmationDialog from "@/components/common/dialogs/ConfirmationDialogl";
import MemberSettingsDialog from "@/features/(workspace)/members/components/MemberSettingsDialog";
import MembersToolbar from "@/features/(workspace)/members/components/MembersToolbar";
import useMembersPage from "@/features/(workspace)/members/hooks/useMembersPage";

const MembersPage = () => {
  const {
    state: {
      query,
      members,
      totalCount,
      filteredCount,
      columns,
      activeProject,
      isMembersLoading,
      isMembersError,
      selectedMember,
      isSettingsOpen,
      isDeleteDialogOpen,
      canManage,
      isSaving,
      isDeleting,
    },
    actions: {
      setQuery,
      closeSettings,
      saveMember,
      openDeleteDialog,
      closeDeleteDialog,
      confirmDeleteMember,
    },
  } = useMembersPage();

  return (
    <>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <MembersToolbar
          query={query}
          totalCount={totalCount}
          filteredCount={filteredCount}
          setQuery={setQuery}
        />
        <div className="min-h-0 flex-1 overflow-auto pt-4">
          <DataTable
            columns={columns}
            data={members}
            emptyDataText={
              isMembersError ? "Failed to load members" : "No members found"
            }
            isPaginated
            pageSize={10}
          />
        </div>
      </div>

      <MemberSettingsDialog
        member={selectedMember}
        isOpen={isSettingsOpen}
        canManage={canManage}
        isSaving={isSaving}
        isDeleting={isDeleting}
        onClose={closeSettings}
        onSave={saveMember}
        onDelete={openDeleteDialog}
      />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        callbackFn={confirmDeleteMember}
        title={`Remove ${selectedMember?.username ?? "member"}?`}
        description="This member will lose access to this project. This action cannot be undone."
        btnText="member"
        isLoading={isDeleting}
      />
    </>
  );
};

export default MembersPage;
