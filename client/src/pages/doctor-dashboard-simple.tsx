import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Home,
  Users2,
  FileText,
  MessageSquare,
  Database,
  Settings,
  Users,
  Stethoscope,
} from "lucide-react";

export default function DoctorDashboardSimple() {
  const [, navigate] = useLocation();

  console.log("[DASHBOARD-SIMPLE] Component mounted");

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1a1a1a] border-r border-[#333] p-6">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#8b5cf6] rounded-lg flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#e6e6e6]">InstantHPI</h1>
              <p className="text-xs text-[#666]">Medical Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          <button
            onClick={() => navigate("/doctor-dashboard")}
            className="flex items-center gap-3 px-3 py-2.5 bg-[#222] text-[#e6e6e6] rounded-md w-full text-left transition-colors border border-[#2a2a2a]"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium">Dashboard</span>
          </button>
          <button
            onClick={() => navigate("/patients")}
            className="flex items-center gap-3 px-3 py-2.5 text-[#999] hover:text-[#e6e6e6] hover:bg-[#222]/50 rounded-md w-full text-left transition-colors"
          >
            <Users2 className="w-4 h-4" />
            <span className="text-sm">Patients</span>
          </button>
          <button
            onClick={() => navigate("/documents")}
            className="flex items-center gap-3 px-3 py-2.5 text-[#999] hover:text-[#e6e6e6] hover:bg-[#222]/50 rounded-md w-full text-left transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span className="text-sm">Reports</span>
          </button>
          <button
            onClick={() => navigate("/messages")}
            className="flex items-center gap-3 px-3 py-2.5 text-[#999] hover:text-[#e6e6e6] hover:bg-[#222]/50 rounded-md w-full text-left transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm">Messages</span>
          </button>
          <button
            onClick={() => navigate("/ai-billing")}
            className="flex items-center gap-3 px-3 py-2.5 text-[#999] hover:text-[#e6e6e6] hover:bg-[#222]/50 rounded-md w-full text-left transition-colors"
          >
            <Database className="w-4 h-4" />
            <span className="text-sm">Analytics</span>
          </button>
          <button
            onClick={() => navigate("/doctor-profile")}
            className="flex items-center gap-3 px-3 py-2.5 text-[#999] hover:text-[#e6e6e6] hover:bg-[#222]/50 rounded-md w-full text-left transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Settings</span>
          </button>
        </nav>

        {/* Collaboration */}
        <div className="border-t border-[#333] pt-6 mt-6">
          <p className="text-xs font-medium text-[#666] uppercase tracking-wider mb-3 px-3">
            Collaboration
          </p>
          <nav className="space-y-1">
            <button
              onClick={() => navigate("/association")}
              className="flex items-center gap-3 px-3 py-2.5 text-[#999] hover:text-[#e6e6e6] hover:bg-[#222]/50 rounded-md w-full text-left transition-colors"
            >
              <Users className="w-4 h-4" />
              <span className="text-sm">Association</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className="flex-1 bg-[#0d0d0d] flex items-center justify-center"
        data-testid="dashboard-root"
      >
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto">
            <div className="animate-spin">
              <Stethoscope className="w-12 h-12 text-[#8b5cf6]" />
            </div>
          </div>
          <p className="text-[#999]">Dashboard Loading (Simple Version)...</p>
          <p className="text-[#666] text-xs">If you see this, the basic rendering works!</p>
        </div>
      </main>
    </div>
  );
}
