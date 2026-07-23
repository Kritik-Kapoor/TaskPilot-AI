import ProtectedGuard from "@/components/guards/ProtectedGuard";

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProtectedGuard redirectTo="/sign-in">{children}</ProtectedGuard>
  );
};

export default ProtectedLayout;
