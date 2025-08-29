import { useEffect } from "react";
import ThreePanelLayout from "@/components/dashboard/ThreePanelLayout";
import { loadDemoData } from "@/lib/mockApi";
import AppLayoutSpruce from "@/components/layout/AppLayoutSpruce";

export default function Dashboard() {
  // Load mock data for demonstration purposes
  useEffect(() => {
    loadDemoData();
  }, []);

  return (
    <AppLayoutSpruce>
      <ThreePanelLayout />
    </AppLayoutSpruce>
  );
}
