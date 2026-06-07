'use client';

interface PhaseProgressProps {
  currentPhase: 1 | 2 | 3 | 4;
}

const PHASES: { number: 1 | 2 | 3 | 4; label: string }[] = [
  { number: 1, label: 'Login' },
  { number: 2, label: 'Marges' },
  { number: 3, label: 'Offerte' },
  { number: 4, label: 'Afronden' },
];

export default function PhaseProgress({ currentPhase }: PhaseProgressProps) {
  return (
    <div className="w-full flex items-center justify-center px-4 py-4 bg-gray-950 border-b border-gray-800">
      <div className="flex items-center gap-0 w-full max-w-md">
        {PHASES.map((phase, index) => {
          const isCompleted = phase.number < currentPhase;
          const isActive = phase.number === currentPhase;
          const isFuture = phase.number > currentPhase;

          return (
            <div key={phase.number} className="flex items-center flex-1">
              {/* Step circle */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors"
                  style={
                    isActive
                      ? { backgroundColor: '#d4af37', color: '#000' }
                      : isCompleted
                      ? { backgroundColor: '#cc0000', color: '#fff' }
                      : { backgroundColor: '#1f2937', color: '#6b7280' }
                  }
                >
                  {isCompleted ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    phase.number
                  )}
                </div>
                <span
                  className="text-xs mt-1 font-medium"
                  style={
                    isActive
                      ? { color: '#d4af37' }
                      : isCompleted
                      ? { color: '#cc0000' }
                      : { color: '#6b7280' }
                  }
                >
                  {phase.label}
                </span>
              </div>

              {/* Connector line — not after last step */}
              {index < PHASES.length - 1 && (
                <div
                  className="h-0.5 flex-1 mx-1 rounded transition-colors"
                  style={
                    isCompleted
                      ? { backgroundColor: '#cc0000' }
                      : { backgroundColor: '#374151' }
                  }
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
