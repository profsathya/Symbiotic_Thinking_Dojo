'use client';

import { DojoVisualData } from '@/lib/practice-dojo/types';
import { SelectionCards } from './SelectionCards';
import { ComparisonTable } from './ComparisonTable';
import { FrameworkDiagram } from './FrameworkDiagram';
import { InfoBox } from './InfoBox';
import { CheckpointPrompt } from './CheckpointPrompt';

interface DojoVisualRendererProps {
  data: DojoVisualData;
  onInteraction?: (action: string, data: Record<string, string>) => void;
}

export function DojoVisualRenderer({ data, onInteraction }: DojoVisualRendererProps) {
  const handleSelection = (optionId: string, optionTitle: string) => {
    if (onInteraction) {
      onInteraction('select', { optionId, optionTitle });
    }
  };

  switch (data.type) {
    case 'selection-cards':
      return <SelectionCards data={data} onSelect={handleSelection} />;
    case 'comparison-table':
      return <ComparisonTable data={data} />;
    case 'framework-diagram':
      return <FrameworkDiagram data={data} />;
    case 'info-box':
      return <InfoBox data={data} />;
    case 'checkpoint-prompt':
      return <CheckpointPrompt data={data} />;
    default:
      console.warn('Unknown dojo-visual type:', (data as DojoVisualData).type);
      return null;
  }
}

// Regex to find dojo-visual JSON blocks in text
// Matches: ```dojo-visual followed by JSON and closing ```
const DOJO_VISUAL_REGEX = /```dojo-visual\s*([\s\S]*?)```/g;

/**
 * Parses message content and extracts dojo-visual blocks
 * Returns an array of content parts (strings and visual data objects)
 */
export function parseDojoVisuals(content: string): Array<{ type: 'text'; content: string } | { type: 'visual'; data: DojoVisualData }> {
  const parts: Array<{ type: 'text'; content: string } | { type: 'visual'; data: DojoVisualData }> = [];
  let lastIndex = 0;
  let match;

  // Reset regex
  DOJO_VISUAL_REGEX.lastIndex = 0;

  while ((match = DOJO_VISUAL_REGEX.exec(content)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      const textContent = content.slice(lastIndex, match.index).trim();
      if (textContent) {
        parts.push({ type: 'text', content: textContent });
      }
    }

    // Parse the JSON
    try {
      const jsonStr = match[1].trim();
      const visualData = JSON.parse(jsonStr) as DojoVisualData;
      parts.push({ type: 'visual', data: visualData });
    } catch (e) {
      console.error('Failed to parse dojo-visual JSON:', e);
      // If parsing fails, include as text
      parts.push({ type: 'text', content: match[0] });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const textContent = content.slice(lastIndex).trim();
    if (textContent) {
      parts.push({ type: 'text', content: textContent });
    }
  }

  // If no visuals found, return original content as single text part
  if (parts.length === 0) {
    parts.push({ type: 'text', content });
  }

  return parts;
}

/**
 * Check if content contains any dojo-visual blocks
 */
export function hasDojoVisuals(content: string): boolean {
  DOJO_VISUAL_REGEX.lastIndex = 0;
  return DOJO_VISUAL_REGEX.test(content);
}
