import React from 'react';

const LETTERS = [
  { ch: 's', color: '#3B3F8A' },
  { ch: 'k', color: '#B95A49' },
  { ch: 'o', color: '#D2B48C' },
  { ch: 'o', color: '#8DAEE3' },
  { ch: 'l', color: '#B95A49' },
];

export default function SkoolLogo({ size = 18, className = '' }) {
  return (
    <span
      className={`font-extrabold tracking-tight leading-none select-none ${className}`}
      style={{ fontSize: `${size}px` }}
      aria-label="Skool"
    >
      {LETTERS.map((l, i) => (
        <span key={i} style={{ color: l.color }}>{l.ch}</span>
      ))}
    </span>
  );
}
