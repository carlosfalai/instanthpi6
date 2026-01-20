import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Award, Shield } from "lucide-react";

interface DoctorProfile {
  name: string;
  email: string;
  specialty: string;
  license: string;
  phone: string;
  address: string;
  clinicName?: string;
  experience?: string;
  education: string;
  certifications: string[];
  avatarUrl?: string;
  signature?: string;
  ai_api_key?: string;
  ai_provider?: "claude" | "openai";
}

export default function DoctorProfile() {
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const [profile, setProfile] = useState<DoctorProfile>({
    name: "",
    email: "",
    specialty: "",
    license: "",
    phone: "",
    address: "",
    clinicName: "",
    experience: "",
    education: "",
    certifications: [],
    avatarUrl: "",
    signature: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Try to get from localStorage first
      const savedProfile = localStorage.getItem("doctor_profile");
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      } else {
        // Load default profile
        setProfile({
          name: "Dr. Carlos Faviel Font",
          email: "cff@centremedicalfont.ca",
          specialty: "Médecine Générale",
          license: "CMQ-12345",
          phone: "+1 (514) 555-0123",
          address: "123 Rue Medical, Montréal, QC H1A 1A1",
          clinicName: "Centre Médical Font",
          experience: "15 ans d'expérience en médecine générale",
          education: "MD - Université de Montréal (2008)",
          certifications: ["Collège des Médecins du Québec", "Médecine d'Urgence"],
          avatarUrl: "",
          signature: "Dr. Carlos Faviel Font",
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem("doctor_profile", JSON.stringify(profile));
    setIsEditing(false);
  };

  const handleCancel = () => {
    loadProfile();
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof DoctorProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleCertificationChange = (index: number, value: string) => {
    const newCerts = [...profile.certifications];
    newCerts[index] = value;
    setProfile((prev) => ({ ...prev, certifications: newCerts }));
  };

  const addCertification = () => {
    setProfile((prev) => ({ ...prev, certifications: [...prev.certifications, ""] }));
  };

  const removeCertification = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md shadow-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate("/doctor-dashboard")}
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour
              </Button>
              <h1 className="text-xl font-semibold text-white">Profil Médecin</h1>
            </div>
            <div className="flex items-center gap-4">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Modifier le Profil
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Sauvegarder
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/20"
                  >
                    Annuler
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
              <CardContent className="p-8 text-center">
                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-white" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{profile.name}</h2>
                <p className="text-blue-200 mb-4">{profile.specialty}</p>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>Licence: {profile.license}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{profile.experience}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Personal Information */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Informations Personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nom complet
                      </label>
                      {isEditing ? (
                        <Input
                          value={profile.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          className="bg-white/20 border-white/30 text-white placeholder-gray-400"
                        />
                      ) : (
                        <p className="text-white">{profile.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Spécialité
                      </label>
                      {isEditing ? (
                        <Input
                          value={profile.specialty}
                          onChange={(e) => handleInputChange("specialty", e.target.value)}
                          className="bg-white/20 border-white/30 text-white placeholder-gray-400"
                        />
                      ) : (
                        <p className="text-white">{profile.specialty}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={profile.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          className="bg-white/20 border-white/30 text-white placeholder-gray-400"
                        />
                      ) : (
                        <p className="text-white flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {profile.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Téléphone
                      </label>
                      {isEditing ? (
                        <Input
                          value={profile.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          className="bg-white/20 border-white/30 text-white placeholder-gray-400"
                        />
                      ) : (
                        <p className="text-white flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {profile.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Adresse</label>
                    {isEditing ? (
                      <Input
                        value={profile.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        className="bg-white/20 border-white/30 text-white placeholder-gray-400"
                      />
                    ) : (
                      <p className="text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {profile.address}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Professional Information */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Informations Professionnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Numéro de licence
                    </label>
                    {isEditing ? (
                      <Input
                        value={profile.license}
                        onChange={(e) => handleInputChange("license", e.target.value)}
                        className="bg-white/20 border-white/30 text-white placeholder-gray-400"
                      />
                    ) : (
                      <p className="text-white">{profile.license}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Expérience
                    </label>
                    {isEditing ? (
                      <Input
                        value={profile.experience}
                        onChange={(e) => handleInputChange("experience", e.target.value)}
                        className="bg-white/20 border-white/30 text-white placeholder-gray-400"
                      />
                    ) : (
                      <p className="text-white">{profile.experience}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Formation
                    </label>
                    {isEditing ? (
                      <Input
                        value={profile.education}
                        onChange={(e) => handleInputChange("education", e.target.value)}
                        className="bg-white/20 border-white/30 text-white placeholder-gray-400"
                      />
                    ) : (
                      <p className="text-white">{profile.education}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Certifications
                    </label>
                    {isEditing ? (
                      <div className="space-y-2">
                        {profile.certifications.map((cert, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={cert}
                              onChange={(e) => handleCertificationChange(index, e.target.value)}
                              className="bg-white/20 border-white/30 text-white placeholder-gray-400"
                            />
                            <Button
                              onClick={() => removeCertification(index)}
                              variant="outline"
                              size="sm"
                              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                            >
                              Supprimer
                            </Button>
                          </div>
                        ))}
                        <Button
                          onClick={addCertification}
                          variant="outline"
                          className="border-white/30 text-white hover:bg-white/20"
                        >
                          Ajouter une certification
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {profile.certifications.map((cert, index) => (
                          <p key={index} className="text-white">
                            • {cert}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Signature (pour les documents)
                    </label>
                    {isEditing ? (
                      <Input
                        value={profile.signature}
                        onChange={(e) => handleInputChange("signature", e.target.value)}
                        placeholder="Ex: Dr. Carlos Faviel Font"
                        className="bg-white/20 border-white/30 text-white placeholder-gray-400"
                      />
                    ) : (
                      <p className="text-white">{profile.signature || "Non définie"}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Cette signature apparaîtra sur vos documents PDF
                    </p>
                  </div>

                  {/* AI Settings Section */}
                  <div className="border-t border-white/20 pt-6 mt-6">
                    <h3 className="text-white font-semibold mb-4">Paramètres IA</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Fournisseur IA
                        </label>
                        {isEditing ? (
                          <select
                            value={profile.ai_provider || "claude"}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                ai_provider: e.target.value as "claude" | "openai",
                              })
                            }
                            className="w-full px-3 py-2 bg-white/20 border border-white/30 text-white rounded-md"
                          >
                            <option value="claude" className="bg-slate-900">
                              Claude (Anthropic)
                            </option>
                            <option value="openai" className="bg-slate-900">
                              OpenAI (GPT-4)
                            </option>
                          </select>
                        ) : (
                          <p className="text-white">
                            {profile.ai_provider === "openai"
                              ? "OpenAI (GPT-4)"
                              : "Claude (Anthropic)"}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Clé API {profile.ai_provider === "openai" ? "OpenAI" : "Claude"}
                        </label>
                        {isEditing ? (
                          <Input
                            type="password"
                            value={profile.ai_api_key || ""}
                            onChange={(e) => setProfile({ ...profile, ai_api_key: e.target.value })}
                            placeholder={profile.ai_provider === "openai" ? "sk-..." : "sk-ant-..."}
                            className="bg-white/20 border-white/30 text-white placeholder-gray-400"
                          />
                        ) : (
                          <p className="text-white">
                            {profile.ai_api_key
                              ? "●●●●●●●●●●" + profile.ai_api_key.slice(-4)
                              : "Non configurée"}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Votre clé API sera utilisée uniquement pour générer du contenu IA dans vos
                          documents
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
