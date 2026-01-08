import { useEffect } from "react";
import ThreePanelLayout from "@/components/dashboard/ThreePanelLayout";
import { loadDemoData } from "@/lib/mockApi";
import ModernLayout from "@/components/layout/ModernLayout";

export default function Dashboard() {
  // Load mock data for demonstration purposes
  useEffect(() => {
    loadDemoData();
  }, []);

  return (
    <ModernLayout title="Dashboard" description="Overview">
      <ThreePanelLayout />
    </ModernLayout>
  );
}
