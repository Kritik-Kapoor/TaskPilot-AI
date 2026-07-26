import DashboardGuard from "@/components/guards/DashboardGuard";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return <DashboardGuard>{children}</DashboardGuard>;
};

export default DashboardLayout;
