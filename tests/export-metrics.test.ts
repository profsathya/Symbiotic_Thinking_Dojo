import { describe, it, expect } from 'vitest';
import {
  exportSessionAsJSON,
  exportSessionAsMarkdown,
  parseImportedSession,
} from '@/lib/export';
import { Message, INITIAL_BALANCE_STATE, INITIAL_DIKW_STATE } from '@/lib/types';

const messages: Message[] = [
  { id: 'a', role: 'assistant', content: 'Welcome.', timestamp: new Date('2026-08-18T10:00:00Z'), speaker: 'sensei' },
  { id: 'b', role: 'user', content: 'sleep 7, fun 5', timestamp: new Date('2026-08-18T10:01:00Z'), speaker: 'user' },
];

const balance = { ...INITIAL_BALANCE_STATE, score: 5, history: [2, 1, 2] };
const dikw = INITIAL_DIKW_STATE;

describe('exporting a session whose activity has no engagement score', () => {
  it('carries the metrics by default', () => {
    const json = JSON.parse(exportSessionAsJSON(messages, 'learn', [], balance, dikw));
    expect(json.metrics.balance.finalScore).toBe(5);
    expect(exportSessionAsMarkdown(messages, 'learn', [], balance, dikw)).toContain('Session Metrics');
  });

  // A number that means nothing on screen means nothing in a file either —
  // and in a file it outlives the session and starts to look authoritative.
  it('leaves them out when the activity suppresses them', () => {
    const json = JSON.parse(
      exportSessionAsJSON(messages, 'learn', [], balance, dikw, { includeMetrics: false })
    );
    expect(json.metrics).toBeUndefined();
    expect(json.messages).toHaveLength(2);

    const md = exportSessionAsMarkdown(messages, 'learn', [], balance, dikw, { includeMetrics: false });
    expect(md).not.toContain('Session Metrics');
    expect(md).not.toContain('Creating-Consuming');
    expect(md).toContain('## Conversation');
    expect(md).toContain('sleep 7, fun 5');
  });

  it('imports a metrics-free session instead of rejecting the file', () => {
    const json = exportSessionAsJSON(messages, 'learn', [], balance, dikw, { includeMetrics: false });
    const result = parseImportedSession(json);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.messages).toHaveLength(2);
      // No metrics in the file means the starting state, not a failed import
      expect(result.data.balance.score).toBe(0);
    }
  });
});
