import React from 'react';
import { paper } from './design-system/paper';

/** Original terminal companion from docs/jove-assets, with a colorful pixel palette. */
export default function AgentMark({
  working = false,
  animated = false,
  className = '',
}: {
  working?: boolean;
  animated?: boolean;
  className?: string;
}) {
  return (
    <svg
      className={`${paper('agent-mark' + (working ? ' is-working' : ''))} ${className}`}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
    >
      <path d="M8 5h16v3h4v16h-4v3h-5v-3h-6v3H8v-3H4V8h4V5Z" fill="#9b86ee" />
      <path d="M8 5h16v3H8zM4 8h4v12H4z" fill="#c8b7ff" />
      <path d="M24 8h4v16h-4z" fill="#7864d2" />
      <path d="M8 24h5v3H8zM19 24h5v3h-5z" fill="#65c9b4" />
      <g className={animated ? 'motion-safe:animate-[mascot-glance_11s_infinite]' : ''}>
        <path
          className={
            animated ? 'origin-[16px_15px] motion-safe:animate-[mascot-blink_6s_infinite]' : ''
          }
          d="M10 12h4v5h-4zM18 12h4v5h-4z"
          fill="#25213e"
        />
      </g>
      <path d="M8 18h4v2H8zM20 18h4v2h-4z" fill="#ffac9e" />
      <path d="M13 20h6v2h-6z" fill="#44345f" />
    </svg>
  );
}
