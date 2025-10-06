import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, LogOut, FileText, Calendar, Printer, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

interface PatientConsultation {
  id: string;
  patient_id: string;
  created_at: string;
  hpi_confirmed: boolean;
  hpi_corrections?: string;
  answers: Record<string, string>;
  enhanced_soap_note?: string;
  doctor_hpi_summary?: string;
}

export default function PatientDashboard() {
  const [, navigate] = useLocation();
  const [consultations, setConsultations] = useState<PatientConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/patient-login");
        return;
      }
      setUser(session.user);
      await fetchConsultations();
    };
    checkAuth();
  }, [navigate]);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      
      // Fetch patient answers
      const { data: patientAnswers, error: answersError } = await supabase
        .from('patient_answers')
        .select('*')
        .order('created_at', { ascending: false });

      if (answersError) {
        console.error('Error fetching patient answers:', answersError);
        return;
      }

      // Fetch consultations
      const { data: consultations, error: consultationsError } = await supabase
        .from('consultations')
        .select('*')
        .order('created_at', { ascending: false });

      if (consultationsError) {
        console.error('Error fetching consultations:', consultationsError);
        return;
      }

      // Combine the data
      const combinedData = patientAnswers?.map(answer => ({
        id: answer.id,
        patient_id: answer.patient_id,
        created_at: answer.created_at,
        hpi_confirmed: answer.hpi_confirmed,
        hpi_corrections: answer.hpi_corrections,
        answers: answer.answers,
        enhanced_soap_note: answer.enhanced_soap_note,
        doctor_hpi_summary: answer.doctor_hpi_summary
      })) || [];

      setConsultations(combinedData);
    } catch (error) {
      console.error('Error fetching consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/patient-login");
  };

  const handlePrint = (consultation: PatientConsultation) => {
    // Create a printable document
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Document Médical - ${consultation.patient_id}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            .section h3 { color: #2c3e50; margin-bottom: 10px; }
            .question { margin-bottom: 10px; }
            .answer { margin-left: 20px; color: #666; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Document Médical - ${consultation.patient_id}</h1>
            <p>Date: ${format(new Date(consultation.created_at), 'dd/MM/yyyy HH:mm')}</p>
          </div>
          
          <div class="section">
            <h3>Résumé de consultation confirmé:</h3>
            <p>${consultation.doctor_hpi_summary || 'Non disponible'}</p>
          </div>
          
          <div class="section">
            <h3>Réponses aux questions de suivi:</h3>
            ${Object.entries(consultation.answers || {}).map(([q, a]) => `
              <div class="question">
                <strong>Q${q}:</strong> ${a}
              </div>
            `).join('')}
          </div>
          
          <div class="section">
            <h3>Rapport médical pour votre médecin:</h3>
            <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${consultation.enhanced_soap_note || 'Non disponible'}</pre>
          </div>
          
          <div class="warning">
            <strong>⚠️ Instructions importantes:</strong><br>
            • Ce document facilite votre prise en charge mais ne remplace PAS l'évaluation médicale<br>
            • En cas d'urgence, appelez le 911<br>
            • Remettez ce document à l'infirmière de triage
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#E6E0F2'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos consultations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#E6E0F2'}}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Patient Portal</h1>
                <p className="text-sm text-gray-600">Vos consultations médicales</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate("/patient-intake")}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Nouvelle Consultation
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="text-gray-600"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {consultations.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucune consultation trouvée
              </h3>
              <p className="text-gray-600 mb-6">
                Vous n'avez pas encore de consultations médicales enregistrées.
              </p>
              <Button
                onClick={() => navigate("/patient-intake")}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Commencer une nouvelle consultation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Vos Consultations ({consultations.length})
              </h2>
            </div>

            {consultations.map((consultation) => (
              <Card key={consultation.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Consultation {consultation.patient_id}
                      </CardTitle>
                      <CardDescription>
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {format(new Date(consultation.created_at), 'dd/MM/yyyy HH:mm')}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={consultation.hpi_confirmed ? "default" : "secondary"}>
                        {consultation.hpi_confirmed ? "Confirmé" : "Non confirmé"}
                      </Badge>
                      <Button
                        onClick={() => handlePrint(consultation)}
                        size="sm"
                        variant="outline"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Printer className="w-4 h-4 mr-1" />
                        Imprimer
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* HPI Confirmation Summary */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">
                        Résumé de consultation confirmé:
                      </h4>
                      <p className="text-sm text-blue-800">
                        {consultation.doctor_hpi_summary || 'Non disponible'}
                      </p>
                      {consultation.hpi_corrections && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                          <p className="text-sm text-yellow-800">
                            <strong>Corrections:</strong> {consultation.hpi_corrections}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Answers to Questions */}
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">
                        Réponses aux questions de suivi:
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(consultation.answers || {}).map(([q, a]) => (
                          <div key={q} className="text-sm">
                            <div className="font-medium text-green-800">
                              Q{q}: {a}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Enhanced SOAP Note */}
                    {consultation.enhanced_soap_note && (
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-purple-900 mb-2">
                          Rapport médical pour votre médecin:
                        </h4>
                        <pre className="text-sm text-purple-800 whitespace-pre-wrap">
                          {consultation.enhanced_soap_note}
                        </pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
