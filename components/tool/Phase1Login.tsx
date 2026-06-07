'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Phase1LoginProps {
  onLogin: (employeeName: string) => void;
  currentPhase?: 1 | 2 | 3 | 4;
}

const EMPLOYEES: Record<string, string> = {
  '0404': 'Laurens van Heijst',
  '2501': 'Tim van Heijst',
};

const DIGIT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export default function Phase1Login({ onLogin, currentPhase = 1 }: Phase1LoginProps) {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [shake, setShake] = useState(false);

  function handleDigit(digit: string) {
    if (pin.length >= 4) return;
    setError('');
    const next = pin + digit;
    setPin(next);
    if (next.length === 4) {
      attemptLogin(next);
    }
  }

  function handleDelete() {
    setError('');
    setPin((prev) => prev.slice(0, -1));
  }

  function attemptLogin(code: string) {
    const name = EMPLOYEES[code];
    if (name) {
      onLogin(name);
    } else {
      setShake(true);
      setError('Ongeldige code. Probeer opnieuw.');
      setTimeout(() => {
        setPin('');
        setShake(false);
      }, 600);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white">

      <div className="flex flex-col items-center justify-center flex-1 px-4 py-8 gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="bg-white rounded-xl p-3 shadow-lg">
            <Image
              src="/uploads/logo.png"
              alt="Dutch Roofing Experts"
              width={140}
              height={80}
              className="object-contain"
              priority
            />
          </div>
          <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: '#d4af37' }}>
            Dutch Roofing Experts
          </p>
        </div>

        {/* PIN display */}
        <div
          className="flex gap-4"
          style={{
            animation: shake ? 'shake 0.4s ease' : undefined,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-14 h-14 rounded-xl border-2 flex items-center justify-center text-3xl font-bold transition-colors"
              style={{
                borderColor: error
                  ? '#cc0000'
                  : pin.length > i
                  ? '#d4af37'
                  : '#374151',
                backgroundColor: pin.length > i ? '#1a1a1a' : '#111827',
              }}
            >
              {pin.length > i ? '●' : ''}
            </div>
          ))}
        </div>

        {/* Error message */}
        <div className="h-6 flex items-center">
          {error && (
            <p className="text-sm font-medium" style={{ color: '#cc0000' }}>
              {error}
            </p>
          )}
        </div>

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          {DIGIT_KEYS.map((key, index) => {
            if (key === '') {
              return <div key={index} />;
            }
            if (key === 'del') {
              return (
                <button
                  key={key}
                  onClick={handleDelete}
                  disabled={pin.length === 0}
                  className="h-16 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center disabled:opacity-30"
                  style={{ backgroundColor: '#1f2937', color: '#9ca3af' }}
                  aria-label="Verwijder"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"
                    />
                  </svg>
                </button>
              );
            }
            return (
              <button
                key={key}
                onClick={() => handleDigit(key)}
                disabled={pin.length >= 4}
                className="h-16 rounded-xl font-bold text-2xl transition-colors active:scale-95 disabled:opacity-40"
                style={{ backgroundColor: '#1f2937', color: '#f9fafb' }}
              >
                {key}
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
