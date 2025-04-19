import { useEffect } from 'react';
import ThreePanelLayout from '@/components/dashboard/ThreePanelLayout';
import { loadDemoData } from '@/lib/mockApi';

export default function Dashboard() {
  // Load mock data for demonstration purposes
  useEffect(() => {
    loadDemoData();
  }, []);
  
  return <ThreePanelLayout />;
}
