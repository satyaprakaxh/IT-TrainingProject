import React from 'react';

/* ── SVG Illustration: AI-learning student at laptop ── */
export function LearnerIllustration() {
  return (
    <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 380, height: 'auto' }}
      aria-hidden="true">

      {/* Background shapes */}
      <ellipse cx="200" cy="260" rx="160" ry="22" fill="#D4E8CE" />

      {/* Laptop base */}
      <rect x="80" y="175" width="240" height="12" rx="6" fill="#2D3748" />
      {/* Laptop screen */}
      <rect x="100" y="80" width="200" height="130" rx="12" fill="#1A202C" />
      <rect x="108" y="88" width="184" height="114" rx="8" fill="#EDF2F7" />

      {/* Screen content — AI icon square */}
      <rect x="130" y="98" width="80" height="66" rx="8" fill="#78A875" opacity="0.9"/>
      <text x="170" y="137" textAnchor="middle" fontFamily="Poppins,Arial" fontWeight="700"
        fontSize="20" fill="#fff">AI</text>

      {/* Screen content — circuit lines */}
      <line x1="222" y1="108" x2="276" y2="108" stroke="#CBD5E0" strokeWidth="2" strokeLinecap="round"/>
      <line x1="222" y1="120" x2="276" y2="120" stroke="#CBD5E0" strokeWidth="2" strokeLinecap="round"/>
      <line x1="222" y1="132" x2="260" y2="132" stroke="#CBD5E0" strokeWidth="2" strokeLinecap="round"/>
      <line x1="222" y1="145" x2="276" y2="145" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round"/>
      <line x1="222" y1="157" x2="250" y2="157" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round"/>

      {/* Graduation cap */}
      <ellipse cx="275" cy="175" rx="24" ry="8" fill="#2D3748"/>
      <rect x="263" y="162" width="24" height="13" rx="2" fill="#2D3748"/>
      <polygon points="275,148 295,162 275,168 255,162" fill="#4A5568"/>
      <line x1="295" y1="162" x2="295" y2="176" stroke="#4A5568" strokeWidth="2"/>
      <circle cx="295" cy="178" r="3" fill="#78A875"/>

      {/* Person sitting — simplified flat style */}
      {/* Torso */}
      <ellipse cx="168" cy="195" rx="28" ry="38" fill="#553C9A" opacity="0.85"/>
      {/* Head */}
      <circle cx="168" cy="152" r="20" fill="#FDDCB5"/>
      {/* Hair */}
      <ellipse cx="168" cy="140" rx="20" ry="10" fill="#2D3748"/>
      {/* Legs (sitting) */}
      <path d="M148 228 Q130 245 115 240" stroke="#78A875" strokeWidth="12" strokeLinecap="round" fill="none"/>
      <path d="M188 228 Q200 248 215 243" stroke="#78A875" strokeWidth="12" strokeLinecap="round" fill="none"/>
      {/* Arms reaching to laptop */}
      <path d="M145 200 Q110 210 108 192" stroke="#FDDCB5" strokeWidth="10" strokeLinecap="round" fill="none"/>
      <path d="M191 200 Q220 205 220 192" stroke="#FDDCB5" strokeWidth="10" strokeLinecap="round" fill="none"/>

      {/* Book stack below laptop */}
      <rect x="82" y="186" width="60" height="8" rx="3" fill="#E9D8FD"/>
      <rect x="85" y="193" width="55" height="7" rx="3" fill="#C3DFFE"/>
      <rect x="88" y="199" width="50" height="7" rx="3" fill="#FED7AA"/>
    </svg>
  );
}

/* ── Illustration variant for Sign Up panel ── */
export function JourneyIllustration() {
  return (
    <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 380, height: 'auto' }}
      aria-hidden="true">

      <ellipse cx="200" cy="265" rx="155" ry="20" fill="#C8E6C0"/>

      {/* Road */}
      <path d="M60 265 Q200 220 340 265" stroke="#B2DFDB" strokeWidth="6" fill="none"/>

      {/* Person walking with backpack */}
      <circle cx="180" cy="130" r="22" fill="#FDDCB5"/>
      <ellipse cx="180" cy="135" rx="22" ry="10" fill="#2D3748"/>
      <rect x="162" y="150" width="36" height="50" rx="8" fill="#78A875"/>
      {/* Backpack */}
      <rect x="192" y="155" width="20" height="32" rx="6" fill="#4F925A"/>
      <rect x="195" y="162" width="14" height="18" rx="4" fill="#38A169"/>
      {/* Legs */}
      <path d="M169 200 L162 240" stroke="#2D3748" strokeWidth="10" strokeLinecap="round"/>
      <path d="M191 200 L198 240" stroke="#2D3748" strokeWidth="10" strokeLinecap="round"/>
      {/* Shoes */}
      <ellipse cx="160" cy="241" rx="10" ry="5" fill="#1A202C"/>
      <ellipse cx="200" cy="241" rx="10" ry="5" fill="#1A202C"/>
      {/* Arms swinging */}
      <path d="M165 165 Q145 185 140 200" stroke="#FDDCB5" strokeWidth="9" strokeLinecap="round" fill="none"/>
      <path d="M195 165 Q215 175 218 160" stroke="#FDDCB5" strokeWidth="9" strokeLinecap="round" fill="none"/>

      {/* Stars / sparkles along path */}
      <circle cx="100" cy="200" r="6" fill="#78A875" opacity="0.7"/>
      <circle cx="310" cy="210" r="8" fill="#A8D39F" opacity="0.8"/>
      <circle cx="260" cy="175" r="5" fill="#78A875" opacity="0.5"/>
      <circle cx="130" cy="175" r="4" fill="#A8D39F" opacity="0.6"/>

      {/* Floating upward arrow */}
      <path d="M300 120 L300 80" stroke="#78A875" strokeWidth="3" strokeLinecap="round"
        markerEnd="url(#arr)"/>
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0 6 L3 0 L6 6" fill="#78A875"/>
        </marker>
      </defs>

      {/* Top certificates / badges */}
      <rect x="55" y="60" width="80" height="56" rx="10" fill="white" opacity="0.85"
        stroke="#78A875" strokeWidth="1.5"/>
      <text x="95" y="85" textAnchor="middle" fontFamily="Poppins,Arial"
        fontSize="11" fontWeight="600" fill="#2D3748">Certificate</text>
      <text x="95" y="102" textAnchor="middle" fontFamily="Poppins,Arial"
        fontSize="10" fill="#78A875">Earned ✓</text>

      <rect x="265" y="55" width="82" height="56" rx="10" fill="white" opacity="0.85"
        stroke="#78A875" strokeWidth="1.5"/>
      <text x="306" y="80" textAnchor="middle" fontFamily="Poppins,Arial"
        fontSize="11" fontWeight="600" fill="#2D3748">AI Skills</text>
      <text x="306" y="97" textAnchor="middle" fontFamily="Poppins,Arial"
        fontSize="10" fill="#78A875">Unlocked ✓</text>
    </svg>
  );
}

