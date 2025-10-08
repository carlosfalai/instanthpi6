import React from "react";

export default function SimpleDashboard() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Dashboard Test</h1>
      <p>If you can see this, the component is working!</p>
      <div className="mt-4 p-4 bg-gray-800 rounded">
        <h2 className="text-lg font-semibold mb-2">Medical Sections</h2>
        <div className="space-y-2">
          <div className="p-2 bg-gray-700 rounded">HPI Summary</div>
          <div className="p-2 bg-gray-700 rounded">Super Spartan SAP</div>
          <div className="p-2 bg-gray-700 rounded">Medications</div>
        </div>
      </div>
    </div>
  );
}
