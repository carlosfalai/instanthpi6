import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { PatientIntakeForm } from "@/components/patient/PatientIntakeForm";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function PublicPatientIntake() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);

  const handleDoctorLogin = () => {
    navigate("/doctor-login");
  };

  useEffect(() => {
    // Load Google Translate script
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.head.appendChild(script);

    // Initialize Google Translate
    (window as any).googleTranslateElementInit = function () {
      new (window as any).google.translate.TranslateElement(
        { pageLanguage: "en" },
        "google_translate_element"
      );
    };

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src*="translate.google.com"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  // Fetch available images from the repo-attached assets and pick a nice hero photo
  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/assets/images")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to list images"))))
      .then((data) => {
        if (cancelled) return;
        const files: Array<{ name: string; url: string; size: number; ext: string }> =
          data?.files || [];
        if (!files.length) return;
        // Prefer high-quality JPEG/WEBP, otherwise largest image
        const preferred = files
          .filter((f) => ["jpeg", "jpg", "webp", "png"].includes(f.ext))
          .sort((a, b) => b.size - a.size);
        const picked = preferred[0] || files[0];
        setHeroUrl(picked.url);
      })
      .catch(() => {})
      .finally(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Doctor Login Button */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">InstantHPI</h1>
              <span className="ml-2 text-sm text-gray-500">Medical Platform</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDoctorLogin}
                variant="outline"
                size="sm"
                className="whitespace-nowrap"
                aria-label="Doctor login"
              >
                Doctor Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Clean, professional hero (no busy image) */}
      <section className="bg-gradient-to-r from-white to-blue-50 border-b">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-bold tracking-tight text-slate-900">
              Trusted care, simple intake
            </h2>
            <p className="mt-3 text-slate-700 text-lg">
              Secure patient onboarding with AI assistance. Available in English and French.
            </p>
            <div className="mt-8 flex gap-3">
              <Button
                onClick={handleDoctorLogin}
                className="bg-blue-600 hover:bg-blue-700"
                aria-label="Doctor login CTA"
              >
                Doctor Login
              </Button>
              <a
                href="#patient-form"
                className="inline-flex items-center text-blue-700 hover:text-blue-800 underline underline-offset-2"
                aria-label="Jump to patient form"
              >
                Fill patient form
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content - Patient Form */}
      <main id="patient-form" className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 sm:p-8">
            {/* Google Translate Widget - First element in form */}
            <div className="flex justify-center mb-6 pb-4 border-b border-gray-100">
              <div id="google_translate_element" className="text-sm"></div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Patient Medical Intake</h2>
              <p className="text-gray-600">
                Please provide your medical information for consultation
              </p>
            </div>

            <PatientIntakeForm />
          </div>
        </div>
      </main>
    </div>
  );
}
