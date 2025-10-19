import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { PatientIntakeForm } from "@/components/patient/PatientIntakeForm";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function PublicPatientIntake() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);

  const handleDoctorLogin = () => {};

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
      {/* Header (patient-only) */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">InstantHPI</h1>
              <span className="ml-2 text-sm text-gray-500">Patient Intake</span>
            </div>
            <div className="flex items-center gap-2" />
          </div>
        </div>
      </header>

      {/* Clean, professional hero with patient mode options */}
      <section className="bg-gradient-to-r from-white to-blue-50 border-b">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-bold tracking-tight text-slate-900">
              Trusted care, simple intake
            </h2>
            <p className="mt-3 text-slate-700 text-lg">
              Secure patient onboarding with AI assistance. Available in English and French.
            </p>
            
            {/* Patient Entry Modes */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border-2 border-blue-200 rounded-xl p-6 hover:border-blue-400 transition-all hover:shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      Just use InstantHPI
                    </h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Quick, anonymous intake. No account needed. Fill the form and print your medical summary.
                    </p>
                    <a
                      href="#patient-form"
                      className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full text-center font-medium"
                    >
                      Start Now →
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-slate-400 transition-all hover:shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      Sign in to save & access later
                    </h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Create an account to save your intake, track history, and access your documents anytime.
                    </p>
                    <button
                      onClick={() => alert('Patient account feature coming soon! For now, use "Just use InstantHPI" mode.')}
                      className="inline-flex items-center justify-center px-4 py-2 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors w-full text-center font-medium"
                    >
                      Coming Soon
                    </button>
                  </div>
                </div>
              </div>
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
