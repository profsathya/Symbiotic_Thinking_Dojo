/**
 * Small pure helpers for the standalone /cti poster dojo, kept out of the
 * page so they can be tested.
 */

import { CTI_POSTER_BACK_CARD } from '@/lib/practice-dojo/topics/cti-poster';

/**
 * True when a selection-card click is the "Back to the themes" card. The
 * model writes the cards, so match on the title as well as the id: a card
 * with the right words and a different id must still go back.
 */
export function isBackToThemesCard(data: Record<string, string>): boolean {
  if (data.optionId === CTI_POSTER_BACK_CARD.id) return true;
  return (data.optionTitle ?? '').trim().toLowerCase() === CTI_POSTER_BACK_CARD.title.toLowerCase();
}

/**
 * The messages the chat view shows. The first message is the topic's welcome
 * (the five themes as cards); on /cti the opening screen already did that
 * job, so it stays in the history for the model and off the screen.
 */
export function visiblePosterMessages<T extends { role: string }>(messages: T[]): T[] {
  return messages[0]?.role === 'assistant' ? messages.slice(1) : messages;
}
