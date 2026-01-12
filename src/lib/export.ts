// Session export utilities for Symbiotic Thinking Dojo

import { Message, Construct, SparringPartner, BalanceState, DIKWState, CONSTRUCT_INFO, DIKW_LEVELS } from './types';

export interface SessionExport {
  version: '1.0';
  exportedAt: string;
  session: {
    construct: Construct;
    constructName: string;
    activePartners: SparringPartner[];
    startedAt: string;
    messageCount: number;
  };
  metrics: {
    balance: {
      finalScore: number;
      history: number[];
    };
    dikw: {
      finalLevel: string;
      highWaterMark: string;
      history: string[];
    };
  };
  messages: {
    role: 'user' | 'assistant';
    speaker: string;
    content: string;
    timestamp: string;
  }[];
}

/**
 * Export session as JSON for later import
 */
export function exportSessionAsJSON(
  messages: Message[],
  construct: Construct,
  activePartners: SparringPartner[],
  balance: BalanceState,
  dikw: DIKWState
): string {
  const sessionExport: SessionExport = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    session: {
      construct,
      constructName: CONSTRUCT_INFO[construct].name,
      activePartners,
      startedAt: messages[0]?.timestamp.toISOString() || new Date().toISOString(),
      messageCount: messages.length,
    },
    metrics: {
      balance: {
        finalScore: balance.score,
        history: balance.history,
      },
      dikw: {
        finalLevel: dikw.current,
        highWaterMark: dikw.highWaterMark,
        history: dikw.history,
      },
    },
    messages: messages.map(msg => ({
      role: msg.role,
      speaker: msg.speaker || (msg.role === 'user' ? 'user' : 'sensei'),
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
    })),
  };

  return JSON.stringify(sessionExport, null, 2);
}

/**
 * Export session as Markdown for human reading
 */
export function exportSessionAsMarkdown(
  messages: Message[],
  construct: Construct,
  activePartners: SparringPartner[],
  balance: BalanceState,
  dikw: DIKWState
): string {
  const constructInfo = CONSTRUCT_INFO[construct];
  const dikwInfo = DIKW_LEVELS.find(l => l.id === dikw.highWaterMark);
  const startTime = messages[0]?.timestamp || new Date();
  const endTime = messages[messages.length - 1]?.timestamp || new Date();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSpeakerName = (msg: Message): string => {
    if (msg.role === 'user') return 'You';
    switch (msg.speaker) {
      case 'framer': return 'The Framer 🖼️';
      case 'auditor': return 'The Auditor 📋';
      case 'connector': return 'The Connector 🔗';
      case 'challenger': return 'The Challenger ⚔️';
      case 'reflector': return 'The Reflector 🪞';
      default: return 'Sensei 🥋';
    }
  };

  const getBalanceDescription = (score: number): string => {
    if (score >= 5) return 'Strong Creating — excellent critical engagement';
    if (score >= 2) return 'Creating — good thinking demonstrated';
    if (score >= 0) return 'Balanced';
    if (score >= -3) return 'Slight Consuming — room for more engagement';
    return 'Consuming — consider engaging more actively';
  };

  let markdown = `# Symbiotic Thinking Dojo Session

## Session Overview

| Property | Value |
|----------|-------|
| **Date** | ${formatDate(startTime)} |
| **Mode** | ${constructInfo.name} (${constructInfo.stakes}) |
| **Active Partners** | ${activePartners.length > 0 ? activePartners.map(p => `@${p}`).join(', ') : 'None (Sensei only)'} |
| **Messages** | ${messages.length} |

## Session Metrics

### Creating-Consuming Balance
- **Final Score:** ${balance.score > 0 ? '+' : ''}${balance.score}
- **Assessment:** ${getBalanceDescription(balance.score)}

### DIKW Pyramid
- **Highest Level Reached:** ${dikwInfo?.name || 'Data'} — ${dikwInfo?.description || 'Raw facts'}

---

## Conversation

`;

  for (const msg of messages) {
    const speaker = getSpeakerName(msg);
    const time = msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    markdown += `### ${speaker}\n`;
    markdown += `*${time}*\n\n`;
    markdown += `${msg.content}\n\n`;
    markdown += `---\n\n`;
  }

  markdown += `
## Export Information

- **Exported:** ${formatDate(new Date())}
- **Source:** Symbiotic Thinking Dojo
- **Learn more:** [symbioticthinking.ai](https://symbioticthinking.ai)

---

*This session was exported from the Symbiotic Thinking Dojo. Consider using @reflector before your next session to capture key insights.*
`;

  return markdown;
}

/**
 * Trigger a file download in the browser
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Generate a filename based on date and construct
 */
export function generateFilename(construct: Construct, extension: 'json' | 'md'): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
  const constructName = CONSTRUCT_INFO[construct].name.toLowerCase().replace(/\s+/g, '-');

  return `dojo-session-${constructName}-${dateStr}-${timeStr}.${extension}`;
}
