"use client";

import { ReactNode } from "react";

interface InlineParameterPanelProps {
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  nodeId: string;
}

/**
 * Collapsible parameter container for inline display within generation nodes.
 * Provides a chevron toggle button and smooth expand/collapse transitions.
 */
export function InlineParameterPanel({
  expanded,
  onToggle,
  children,
  nodeId,
}: InlineParameterPanelProps) {
  return (
    <div className="w-full">
      {/* Chevron toggle button - acts as visual boundary */}
      <button
        type="button"
        onClick={onToggle}
        className="nodrag nopan w-full flex items-center justify-center py-1.5 bg-neutral-800/80 text-neutral-400 hover:text-neutral-200 transition-colors"
        aria-label={expanded ? "Collapse parameters" : "Expand parameters"}
        aria-expanded={expanded}
        aria-controls={`params-${nodeId}`}
      >
        <svg
          className="w-3.5 h-3.5 transition-transform duration-200"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Collapsible content area */}
      <div
        id={`params-${nodeId}`}
        className="overflow-hidden transition-all duration-200"
        style={{
          maxHeight: expanded ? "2000px" : "0",
          opacity: expanded ? 1 : 0,
        }}
      >
        <div className="nodrag nopan nowheel bg-neutral-900 px-3 pt-2 pb-3 rounded-b-lg">
          <div className="space-y-2 max-w-[280px] mx-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
