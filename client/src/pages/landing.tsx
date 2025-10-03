import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, User, ArrowRight } from "lucide-react";

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            InstantHPI
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Plateforme médicale intelligente pour patients et médecins
          </p>
        </div>

        {/* Login Options */}
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Doctor Login */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Stethoscope className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl text-gray-900">Doctor's Lounge</CardTitle>
                <CardDescription className="text-gray-600">
                  Accès sécurisé pour les professionnels de la santé
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-500 mb-6">
                  Consultez les dossiers patients, générez des rapports médicaux complets, 
                  et accédez aux outils d'IA pour optimiser vos consultations.
                </p>
                <Button 
                  onClick={() => navigate("/doctor-login")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Stethoscope className="w-4 h-4 mr-2" />
                  Connexion Médecin
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Patient Login */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <User className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-gray-900">Patient Portal</CardTitle>
                <CardDescription className="text-gray-600">
                  Accès simple et sécurisé pour les patients
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-500 mb-6">
                  Remplissez votre consultation médicale, répondez aux questions de suivi, 
                  et générez un document médical pour votre médecin.
                </p>
                <Button 
                  onClick={() => navigate("/patient-login")}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <User className="w-4 h-4 mr-2" />
                  Connexion Patient
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Features Section */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Fonctionnalités
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 bg-white rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Pour les Médecins</h3>
                <p className="text-sm text-gray-600">
                  Rapports médicaux complets, prescriptions, références spécialisées, 
                  et documentation d'assurance générés automatiquement.
                </p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Pour les Patients</h3>
                <p className="text-sm text-gray-600">
                  Consultation médicale guidée, questions de suivi personnalisées, 
                  et document imprimable pour votre médecin.
                </p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">IA Médicale</h3>
                <p className="text-sm text-gray-600">
                  Intelligence artificielle avancée pour la génération de rapports médicaux, 
                  triage, et documentation clinique.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
