"use client";

import { DataTable } from "@/components/common/table";
import UserManagementToolbar from "@/features/(workspace)/user-management/components/UserManagementToolbar";
import UserSettingsDialog from "@/features/(workspace)/user-management/components/UserSettingsDialog";
import useUserManagementPage from "@/features/(workspace)/user-management/hooks/useUserManagementPage";

const UserManagementPage = () => {
  const {
    state: {
      query,
      users,
      totalCount,
      filteredCount,
      columns,
      projects,
      selectedUser,
      isSettingsOpen,
      canManage,
      isOrgOwner,
      isUsersLoading,
      isUsersError,
      isSaving,
    },
    actions: { setQuery, closeSettings, saveUser },
  } = useUserManagementPage();

  if (!canManage) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <UserManagementToolbar
          query={query}
          totalCount={0}
          filteredCount={0}
          setQuery={setQuery}
        />
        <div className="flex flex-1 items-center justify-center pt-4">
          <p className="text-sm text-muted-foreground">
            Only organization owners and admins can manage users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <UserManagementToolbar
          query={query}
          totalCount={totalCount}
          filteredCount={filteredCount}
          setQuery={setQuery}
        />
        <div className="min-h-0 flex-1 overflow-auto pt-4">
          <DataTable
            columns={columns}
            data={users}
            emptyDataText={
              isUsersError
                ? "Failed to load users"
                : isUsersLoading
                  ? "Loading users…"
                  : "No users found"
            }
            isPaginated
            pageSize={10}
          />
        </div>
      </div>

      <UserSettingsDialog
        user={selectedUser}
        projects={projects}
        isOpen={isSettingsOpen}
        isOrgOwner={isOrgOwner}
        isSaving={isSaving}
        onClose={closeSettings}
        onSave={saveUser}
      />
    </>
  );
};

export default UserManagementPage;
