export const formatOrganizationRole = (role: string | null | undefined) => {
  if (!role || role === "MEMBER") return "Member";
  return role.charAt(0) + role.slice(1).toLowerCase();
};
