/**
 * Utility functions for parsing @ mentions in chat messages
 *
 * @ mentions allow users to invoke specific sparring partners for a single message
 * without toggling them on permanently.
 */

import { SparringPartner } from './types';

// Map of @ mention triggers to partner IDs
// Supports full names and common variations
const MENTION_MAP: Record<string, SparringPartner> = {
  // The Framer
  '@framer': 'framer',
  '@theframer': 'framer',
  '@the-framer': 'framer',

  // The Auditor
  '@auditor': 'auditor',
  '@theauditor': 'auditor',
  '@the-auditor': 'auditor',

  // The Connector
  '@connector': 'connector',
  '@theconnector': 'connector',
  '@the-connector': 'connector',

  // The Challenger
  '@challenger': 'challenger',
  '@thechallenger': 'challenger',
  '@the-challenger': 'challenger',

  // The Reflector
  '@reflector': 'reflector',
  '@thereflector': 'reflector',
  '@the-reflector': 'reflector',

  // The Advocate
  '@advocate': 'advocate',
  '@theadvocate': 'advocate',
  '@the-advocate': 'advocate',
};

// Regex to match @ mentions (case insensitive)
// Matches @word or @word-word patterns
const MENTION_REGEX = /@[a-zA-Z]+(-[a-zA-Z]+)*/gi;

export interface MentionParseResult {
  mentionedPartners: SparringPartner[];
  cleanedContent: string;  // Original content (we don't strip mentions)
  rawMentions: string[];   // The actual mention strings found
}

/**
 * Parse @ mentions from a message and return the mentioned partners
 *
 * @param content - The message content to parse
 * @returns Object containing mentioned partners and cleaned content
 */
export function parseMentions(content: string): MentionParseResult {
  const rawMentions: string[] = [];
  const mentionedPartners: SparringPartner[] = [];

  // Find all @ mentions in the content
  const matches = content.match(MENTION_REGEX) || [];

  for (const match of matches) {
    const normalizedMention = match.toLowerCase();

    if (normalizedMention in MENTION_MAP) {
      const partner = MENTION_MAP[normalizedMention];

      // Only add if not already in the list
      if (!mentionedPartners.includes(partner)) {
        mentionedPartners.push(partner);
        rawMentions.push(match);
      }
    }
  }

  return {
    mentionedPartners,
    cleanedContent: content, // Keep original - don't strip mentions
    rawMentions,
  };
}

/**
 * Get all valid @ mention triggers for autocomplete/hints
 */
export function getAllMentionTriggers(): { trigger: string; partner: SparringPartner; name: string }[] {
  return [
    { trigger: '@framer', partner: 'framer', name: 'The Framer' },
    { trigger: '@auditor', partner: 'auditor', name: 'The Auditor' },
    { trigger: '@connector', partner: 'connector', name: 'The Connector' },
    { trigger: '@challenger', partner: 'challenger', name: 'The Challenger' },
    { trigger: '@reflector', partner: 'reflector', name: 'The Reflector' },
    { trigger: '@advocate', partner: 'advocate', name: 'The Advocate' },
  ];
}

/**
 * Check if a string contains any @ mention
 */
export function hasMentions(content: string): boolean {
  const matches = content.match(MENTION_REGEX) || [];
  return matches.some(match => match.toLowerCase() in MENTION_MAP);
}
