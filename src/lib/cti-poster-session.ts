/**
 * Small pure helpers for the standalone /cti poster dojo, kept out of the
 * page so they can be tested.
 */

import { CTI_POSTER_BACK_CARD } from '@/lib/practice-dojo/topics/cti-poster';

// The first build's card, which a conversation saved before v2 can still hold.
const LEGACY_BACK_CARD = { id: 'poster', title: 'Back to the poster' } as const;

/**
 * True when a selection-card click is the "Back to the themes" card. The
 * model writes the cards, so match on the title as well as the id: a card
 * with the right words and a different id must still go back.
 */
export function isBackToThemesCard(data: Record<string, string>): boolean {
  const title = (data.optionTitle ?? '').trim().toLowerCase();
  return [CTI_POSTER_BACK_CARD, LEGACY_BACK_CARD].some(
    (card) => data.optionId === card.id || title === card.title.toLowerCase()
  );
}

/**
 * The messages the chat view shows. The first message is the topic's welcome
 * (the five themes as cards); on /cti the opening screen already did that
 * job, so it stays in the history for the model and off the screen.
 */
export function visiblePosterMessages<T extends { role: string }>(messages: T[]): T[] {
  return messages[0]?.role === 'assistant' ? messages.slice(1) : messages;
}
