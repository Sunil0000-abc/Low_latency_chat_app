import React from 'react';

export default function Logo({ size = 80, className = "" }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3390ec" />
          <stop offset="100%" stopColor="#2b80d4" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
          <feOffset dx="1" dy="2" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#logoGrad)" />
      {/* Abstract connection bubbles */}
      <circle cx="35" cy="40" r="12" fill="white" fillOpacity="0.1" />
      <circle cx="65" cy="45" r="15" fill="white" fillOpacity="0.1" />
      <circle cx="45" cy="65" r="10" fill="white" fillOpacity="0.1" />
      
      {/* Centered Bolt/Chat Icon */}
      <path 
        d="M52 28L38 55H50L44 75L66 45H54L62 28H52Z" 
        fill="white" 
        filter="url(#shadow)"
      />
    </svg>
  );
}
