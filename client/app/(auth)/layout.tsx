import AuthGuard from "@/components/guards/AuthGuard";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return <AuthGuard>{children}</AuthGuard>;
};

export default AuthLayout;
