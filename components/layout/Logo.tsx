interface LogoProps {
  className?: string;
}

const Logo = ({ className = "" }: LogoProps) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`w-8 h-8 ${className}`}
      aria-label="Vattenflow Logo"
    >
      <defs>
        <linearGradient id="yellow-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#FFDA00", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#FFB800", stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#1F4B9D", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#163A7D", stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* Top half – Yellow with gradient */}
      <path
        d="M50 2 A 48 48 0 0 1 98 50 L2 50 A 48 48 0 0 1 50 2"
        fill="url(#yellow-gradient)"
        className="drop-shadow-sm"
      />

      {/* Bottom half – Blue with gradient */}
      <path
        d="M2 50 A 48 48 0 0 0 50 98 L50 98 A 48 48 0 0 0 98 50 L2 50"
        fill="url(#blue-gradient)"
        className="drop-shadow-sm"
      />
    </svg>
  );
};

export default Logo;
