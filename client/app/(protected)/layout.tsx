import ProtectedGuard from "@/components/guards/ProtectedGuard";

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  return <ProtectedGuard>{children}</ProtectedGuard>;
};

export default ProtectedLayout;
