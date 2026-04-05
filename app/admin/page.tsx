"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/admin/dashboard");
    } else if (res.status === 429) {
      setError("Te veel pogingen. Probeer het later opnieuw.");
    } else {
      setError("Onjuist wachtwoord. Probeer het opnieuw.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 mb-4">
            <Lock size={28} className="text-[#d4af37]" />
          </div>
          <h1 className="text-2xl font-black text-white">Beheerpaneel</h1>
          <p className="text-gray-500 text-sm mt-1">Dakservice Van Heijst</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Wachtwoord"
              required
              className="w-full px-4 py-3 pr-12 bg-gray-950 border border-gray-800 focus:border-[#d4af37]/60 rounded-lg text-white placeholder-gray-600 outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#d4af37] text-white font-bold rounded-lg hover:bg-[#d4af37] transition-all disabled:opacity-60"
          >
            {loading ? "Bezig..." : "Inloggen"}
          </button>
        </form>

        <p className="text-center mt-6">
          <a href="/" className="text-gray-600 text-sm hover:text-gray-400 transition-colors">
            ← Terug naar de website
          </a>
        </p>
      </div>
    </div>
  );
}
