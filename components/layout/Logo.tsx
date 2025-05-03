interface LogoProps {
  className?: string;
}

const Logo = ({ className = "" }: LogoProps) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`w-12 h-12 drop-shadow-lg ${className}`}
      aria-label="Vattenflow Logo"
    >
      <defs>
        <radialGradient id="circle-glow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#fffbe6" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fffbe6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="yellow-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#FFD600", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#FFB800", stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#0057b8", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#1F4B9D", stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      {/* Outer white border for contrast */}
      <circle cx="50" cy="50" r="48" fill="#fff" />
      {/* Top half – Yellow with gradient */}
      <path
        d="M50 2 A 48 48 0 0 1 98 50 L2 50 A 48 48 0 0 1 50 2"
        fill="url(#yellow-gradient)"
        style={{ filter: "drop-shadow(0 2px 8px #ffd60055)" }}
      />
      {/* Bottom half – Blue with gradient */}
      <path
        d="M2 50 A 48 48 0 0 0 50 98 L50 98 A 48 48 0 0 0 98 50 L2 50"
        fill="url(#blue-gradient)"
        style={{ filter: "drop-shadow(0 2px 8px #0057b855)" }}
      />
      {/* Subtle glow */}
      <circle cx="50" cy="50" r="48" fill="url(#circle-glow)" />
    </svg>
  );
};

export default Logo;
