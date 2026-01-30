import React, { type JSX } from "react";
import { AlertTriangle, Home } from "lucide-react";

export default function Page404(): JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b w-full from-gray-50 to-gray-100 p-6">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center">
            <div className="mx-auto w-28 h-28 rounded-full bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center shadow-sm">
            <AlertTriangle className="w-12 h-12 text-amber-600" />
            </div>

            <h1 className="mt-6 text-3xl md:text-4xl font-semibold leading-tight text-slate-900">
            Page Under Development
            </h1>

            <p className="mt-3 text-sm md:text-base text-slate-500">
            We're building something great here. Come back soon — or try one of the options below.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
                onClick={() => (window.location.href = "/")}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-medium shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200"
            >
                <Home className="w-4 h-4" />
                Go to Home
            </button>

            <button
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 focus:outline-none"
            >
                Go Back
            </button>
            </div>

            <div className="mt-6 text-xs text-slate-400">
                <span>Need help? </span>
                <a href="#" className="underline hover:text-slate-600">
                    No, you don't 
                </a>
            </div>
        </div>
    </div>
  );
}