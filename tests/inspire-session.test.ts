import { describe, it, expect } from 'vitest';
import { InspireSaved, restorableMessages } from '@/lib/inspire-session';
import { SerializedMessage } from '@/lib/practice-dojo/types';

function msg(role: 'user' | 'assistant', content: string): SerializedMessage {
  return { id: `${role}-${content.slice(0, 6)}`, role, content, timestamp: '2026-07-22T21:00:00.000Z' };
}

function saved(messages: SerializedMessage[], inFlight?: boolean): InspireSaved {
  return { messages, currentPhase: 2, userChoices: {}, interactionCount: 1, senseiReady: false, inFlight };
}

const welcome = msg('assistant', 'Pick a door.');
const ask = msg('user', 'sharpen my question');
const reply = msg('assistant', "Here's the question under your question.");

describe('restoring an /inspire session', () => {
  it('has nothing to restore before a session exists', () => {
    expect(restorableMessages(null)).toEqual([]);
    expect(restorableMessages(undefined)).toEqual([]);
    expect(restorableMessages(saved([]))).toEqual([]);
  });

  it('restores a settled conversation untouched', () => {
    expect(restorableMessages(saved([welcome, ask, reply]))).toEqual([welcome, ask, reply]);
  });

  // The bug: the save effect writes on every streamed chunk, so a refresh
  // mid-reply persisted a partial assistant turn — which came back as
  // finished history and was sent to the API as words the model never said.
  it('drops a reply the refresh interrupted, keeping the visitor\'s message', () => {
    const partial = msg('assistant', "Here's the question under your quest");
    expect(restorableMessages(saved([welcome, ask, partial], true))).toEqual([welcome, ask]);
  });

  // The sharper case: refreshing before the first chunk lands persisted an
  // EMPTY assistant message. Nothing filters empty content on the way to the
  // API, so the next send was rejected outright.
  it('drops an empty placeholder even when the snapshot predates the inFlight flag', () => {
    const placeholder = msg('assistant', '');
    expect(restorableMessages(saved([welcome, ask, placeholder]))).toEqual([welcome, ask]);
    expect(restorableMessages(saved([welcome, ask, msg('assistant', '   \n ')]))).toEqual([welcome, ask]);
  });

  it('keeps a completed reply that merely happens to be last', () => {
    expect(restorableMessages(saved([welcome, ask, reply], false))).toEqual([welcome, ask, reply]);
  });

  it('leaves a trailing user message alone — there is no partial reply to drop', () => {
    expect(restorableMessages(saved([welcome, ask], true))).toEqual([welcome, ask]);
  });
});
