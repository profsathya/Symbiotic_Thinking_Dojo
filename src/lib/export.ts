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
export function downloadFile(content: string, filename: string, mimeType: string): boolean {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);

    // Use a small timeout to ensure the link is in the DOM
    setTimeout(() => {
      link.click();

      // Clean up after a delay to ensure download starts
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    }, 0);

    return true;
  } catch (error) {
    console.error('Download failed:', error);

    // Fallback: try opening in new window
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return true;
    } catch (fallbackError) {
      console.error('Fallback download also failed:', fallbackError);
      return false;
    }
  }
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

// ============================================================================
// Import Utilities
// ============================================================================

export interface ImportedSession {
  messages: Message[];
  construct: Construct;
  activePartners: SparringPartner[];
  balance: BalanceState;
  dikw: DIKWState;
  exportedAt: Date;
  originalStartedAt: Date;
}

export interface ImportError {
  type: 'parse' | 'validation' | 'version';
  message: string;
}

export type ImportResult =
  | { success: true; data: ImportedSession }
  | { success: false; error: ImportError };

/**
 * Validate that a value is a valid Construct
 */
function isValidConstruct(value: unknown): value is Construct {
  return value === 'learn' || value === 'learn-solve' || value === 'learn-solve-build';
}

/**
 * Validate that a value is a valid SparringPartner
 */
function isValidPartner(value: unknown): value is SparringPartner {
  return (
    value === 'framer' ||
    value === 'auditor' ||
    value === 'connector' ||
    value === 'challenger' ||
    value === 'reflector'
  );
}

/**
 * Validate that a value is a valid DIKWLevel
 */
function isValidDIKWLevel(value: unknown): value is DIKWState['current'] {
  return value === 'data' || value === 'information' || value === 'knowledge' || value === 'wisdom';
}

/**
 * Parse and validate an imported JSON session file
 */
export function parseImportedSession(jsonContent: string): ImportResult {
  // Try to parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonContent);
  } catch {
    return {
      success: false,
      error: { type: 'parse', message: 'Invalid JSON format. Please select a valid Dojo session file.' },
    };
  }

  // Type guard for basic structure
  if (typeof parsed !== 'object' || parsed === null) {
    return {
      success: false,
      error: { type: 'validation', message: 'Invalid file structure.' },
    };
  }

  const data = parsed as Record<string, unknown>;

  // Check version
  if (data.version !== '1.0') {
    return {
      success: false,
      error: {
        type: 'version',
        message: `Unsupported file version: ${data.version}. This app supports version 1.0.`,
      },
    };
  }

  // Validate session object
  const session = data.session as Record<string, unknown> | undefined;
  if (!session || typeof session !== 'object') {
    return {
      success: false,
      error: { type: 'validation', message: 'Missing session data.' },
    };
  }

  // Validate construct
  if (!isValidConstruct(session.construct)) {
    return {
      success: false,
      error: { type: 'validation', message: 'Invalid or missing construct type.' },
    };
  }

  // Validate partners
  const partners = session.activePartners;
  if (!Array.isArray(partners)) {
    return {
      success: false,
      error: { type: 'validation', message: 'Invalid partners data.' },
    };
  }
  const validPartners = partners.filter(isValidPartner);

  // Validate messages
  const messages = data.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return {
      success: false,
      error: { type: 'validation', message: 'No messages found in session.' },
    };
  }

  // Validate metrics
  const metrics = data.metrics as Record<string, unknown> | undefined;
  if (!metrics || typeof metrics !== 'object') {
    return {
      success: false,
      error: { type: 'validation', message: 'Missing metrics data.' },
    };
  }

  const balanceData = metrics.balance as Record<string, unknown> | undefined;
  const dikwData = metrics.dikw as Record<string, unknown> | undefined;

  if (!balanceData || !dikwData) {
    return {
      success: false,
      error: { type: 'validation', message: 'Missing balance or DIKW metrics.' },
    };
  }

  // Convert messages to Message type
  const convertedMessages: Message[] = messages.map((msg: Record<string, unknown>, index: number) => ({
    id: `imported_${index}_${Date.now()}`,
    role: msg.role as 'user' | 'assistant',
    content: String(msg.content || ''),
    timestamp: new Date(String(msg.timestamp) || new Date()),
    speaker: (msg.speaker as Message['speaker']) || (msg.role === 'user' ? 'user' : 'sensei'),
  }));

  // Reconstruct balance state
  const balanceHistory = Array.isArray(balanceData.history) ? balanceData.history.map(Number) : [];
  const balance: BalanceState = {
    score: Number(balanceData.finalScore) || 0,
    lastDelta: balanceHistory[balanceHistory.length - 1] || 0,
    consecutiveConsuming: 0, // Reset on import
    history: balanceHistory,
  };

  // Reconstruct DIKW state
  const dikwHistory = Array.isArray(dikwData.history)
    ? dikwData.history.filter(isValidDIKWLevel)
    : [];
  const currentDikw = isValidDIKWLevel(dikwData.finalLevel) ? dikwData.finalLevel : 'data';
  const highWaterDikw = isValidDIKWLevel(dikwData.highWaterMark) ? dikwData.highWaterMark : currentDikw;

  const dikw: DIKWState = {
    current: currentDikw,
    highWaterMark: highWaterDikw,
    history: dikwHistory,
  };

  return {
    success: true,
    data: {
      messages: convertedMessages,
      construct: session.construct,
      activePartners: validPartners,
      balance,
      dikw,
      exportedAt: new Date(String(data.exportedAt) || new Date()),
      originalStartedAt: new Date(String(session.startedAt) || new Date()),
    },
  };
}

/**
 * Read a file and return its contents as a string
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
