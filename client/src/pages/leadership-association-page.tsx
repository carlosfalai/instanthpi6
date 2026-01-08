import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import ModernLayout from "@/components/layout/ModernLayout";

export default function LeadershipAssociationPage() {
  const leadershipMembers = [
    {
      name: "Dr. Carlos Faviel Font",
      role: "Founder",
      specialty: "Family Medicine",
      bio: "Founder of InstantHPI, specializing in Family Medicine with a focus on innovative healthcare delivery systems. Based in La Prairie, Quebec.",
    },
    {
      name: "Dr. Sonia Font del Pino",
      role: "Co-Founder",
      specialty: "Anesthesiology & Chronic Pain Management",
      bio: "Co-founder of InstantHPI, specializing in anesthesiology and chronic pain management. Brings expert insight on pain treatment protocols and medical practice management. Based in St-Jean-sur-Richelieu, Quebec.",
    },
    {
      name: "Mme Sonia Truchon",
      role: "Marketing/Sales Director",
      specialty: "",
      bio: "Leads marketing and sales initiatives, driving growth and adoption of InstantHPI technology in medical practices. Based in Brossard, Quebec.",
    },
    {
      name: "Dr. Dan Kogan",
      role: "California Leadership",
      specialty: "Neurologist",
      bio: "Provides leadership for California operations as a practicing neurologist, implementing InstantHPI solutions across medical practices.",
    },
    {
      name: "Dr. Kogan (Spouse)",
      role: "California Leadership",
      specialty: "Internist",
      bio: "Works alongside spouse in leadership of California operations as an internist, specializing in practitioner training and support.",
    },
  ];

  return (
    <ModernLayout title="Leadership Association" description="Leadership team and structure">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-blue-500">InstantHPI</h1>
          <h2 className="text-2xl font-bold mt-4">Leadership Association</h2>
          <p className="text-gray-400">Meet the team behind InstantHPI's innovation and vision</p>
        </div>

        <div>
          {/* Leadership Team Introduction */}
          <Card className="mb-8 bg-[#1e1e1e] border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-6 w-6 mr-2 text-blue-500" />
                Leadership Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                The InstantHPI leadership association brings together experienced medical
                professionals and business experts to revolutionize medical documentation and
                patient care through innovative technology solutions.
              </p>
            </CardContent>
          </Card>

          {/* Leadership Members */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leadershipMembers.map((member, index) => (
              <Card key={index} className="bg-[#1e1e1e] border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold">{member.name}</CardTitle>
                  <div className="text-blue-400 font-medium text-sm">{member.role}</div>
                  {member.specialty && (
                    <div className="text-gray-400 text-sm">{member.specialty}</div>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}
