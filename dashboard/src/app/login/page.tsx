"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions/auth";
import Image from "next/image";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState | undefined, FormData>(login, undefined);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-gray-900 rounded-xl p-4 w-full">
              <Image
                src="/logo-big-text.png"
                alt="Blackdeer Investment Group"
                width={860}
                height={200}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
            Sign In
          </h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            BIG Executive Dashboard &amp; Prospect Portal
          </p>

          {state?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
              {state.error}
            </div>
          )}

          <form action={action} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="you@blackdeerig.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors"
            >
              {pending ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-6">
            Restricted access — BIG employees and investors only
          </p>
        </div>
      </div>
    </div>
  );
}
