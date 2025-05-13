import { LayoutGrid, Users, UserCog, FileText, Clipboard } from 'lucide-react';
import AppLayoutSpruce from '@/components/layout/AppLayoutSpruce';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TierAssociationPage() {
  return (
    <AppLayoutSpruce>
      <div className="px-6 py-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Tier 3.5 (The Association)
          </h1>
          <p className="text-gray-400 max-w-3xl">
            Advanced automation and AI for healthcare practices working together in a collaborative network.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-[#1A1A1A] border-[#333]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-full bg-blue-900/30">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
              </div>
              <CardTitle className="mt-4 text-lg">Collaborative Network</CardTitle>
              <CardDescription>Connect with other healthcare providers.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-300">
                Share insights, protocols, and resources with other healthcare professionals in your network.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-[#333]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-full bg-purple-900/30">
                  <UserCog className="h-6 w-6 text-purple-400" />
                </div>
              </div>
              <CardTitle className="mt-4 text-lg">Association Benefits</CardTitle>
              <CardDescription>Enhanced capabilities for association members.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-300">
                Access exclusive features, templates, and AI capabilities available only to association members.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-[#333]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-full bg-indigo-900/30">
                  <FileText className="h-6 w-6 text-indigo-400" />
                </div>
              </div>
              <CardTitle className="mt-4 text-lg">Resource Sharing</CardTitle>
              <CardDescription>Collaborative knowledge base.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-300">
                Share medical protocols, treatment guidelines, and documentation templates with network members.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-[#333]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-full bg-green-900/30">
                  <Clipboard className="h-6 w-6 text-green-400" />
                </div>
              </div>
              <CardTitle className="mt-4 text-lg">Advanced Reports</CardTitle>
              <CardDescription>Enhanced analytics and insights.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-300">
                Generate comprehensive reports and analytics about your practice and compare with anonymized network data.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-[#333]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-full bg-red-900/30">
                  <LayoutGrid className="h-6 w-6 text-red-400" />
                </div>
              </div>
              <CardTitle className="mt-4 text-lg">Association Dashboard</CardTitle>
              <CardDescription>Unified management interface.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-300">
                Access all association features and benefits through a centralized dashboard interface.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayoutSpruce>
  );
}