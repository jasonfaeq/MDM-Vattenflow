import React from "react";

const Logo = ({ className = "" }) => {
  return (
    <div className={`flex items-center gap-4 ${className}`} style={{ minWidth: 220 }}>
      <span
        style={{
          fontFamily: 'Montserrat, Inter, sans-serif',
          fontWeight: 900,
          fontSize: 38,
          letterSpacing: 2,
          color: '#484542',
          textTransform: 'uppercase',
          lineHeight: 1,
        }}
      >
        VATTENFLOW
      </span>
      <svg className="w-12 h-12" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Vattenfall Circle">
        <path d="M 0 50 A 50 50 0 0 1 100 50 Z" fill="#FFD600" />
        <path d="M 0 50 A 50 50 0 0 0 100 50 Z" fill="#1A7AC5" />
      </svg>
    </div>
  );
};

export default Logo;
