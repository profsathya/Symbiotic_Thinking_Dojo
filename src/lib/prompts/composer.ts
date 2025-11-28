import { DojoConfig, Construct, SparringPartner } from '../types';

export interface ComposeOptions {
  isGuidedPractice?: boolean;
}

/**
 * Composes the complete system prompt from configuration and active selections
 */
export function composeSystemPrompt(
  config: DojoConfig,
  activeConstruct: Construct,
  activePartners: SparringPartner[],
  options: ComposeOptions = {}
): string {
  const { isGuidedPractice = false } = options;
  const parts: string[] = [];

  // 1. Base Dojo philosophy (always present)
  parts.push('# SYMBIOTIC THINKING DOJO\n\n' + config.dojoPrompt);

  // 2. Sensei layer (always present)
  parts.push('# SENSEI GUIDANCE\n\n' + config.senseiPrompt);

  // 2b. Ikigai guided practice (if active)
  if (isGuidedPractice) {
    parts.push('# GUIDED PRACTICE: IKIGAI DISCOVERY\n\n' + config.ikigaiPrompt);
  }

  // 3. Active construct prompt
  const construct = config.constructs.find(c => c.id === activeConstruct);
  if (construct) {
    parts.push('# ACTIVE CONSTRUCT\n\n' + construct.prompt);
  }

  // 4. Active partner prompts
  if (activePartners.length > 0) {
    const partnerSection: string[] = ['# ACTIVE SPARRING PARTNERS\n'];

    for (const partnerId of activePartners) {
      const partner = config.partners.find(p => p.id === partnerId);
      if (partner) {
        partnerSection.push(partner.prompt);
      }
    }

    parts.push(partnerSection.join('\n\n'));
  }

  // 5. Response formatting instructions
  parts.push(`# RESPONSE FORMAT

When responding, identify which voice you're speaking from:
- If providing metacognitive guidance, speak as the Sensei
- If a Sparring Partner is activated and their intervention is relevant, speak from that partner's voice
- You may switch between voices in a single response if appropriate
- Always make it clear which voice is speaking by prefixing with the name (e.g., "**Sensei:** ..." or "**The Framer:** ...")

Remember: The goal is to develop the student's judgment and cognitive skills, not just to complete their tasks.`);

  return parts.join('\n\n---\n\n');
}

/**
 * Creates a welcome message based on the current configuration
 */
export function createWelcomeMessage(
  activeConstruct: Construct,
  activePartners: SparringPartner[],
  config: DojoConfig,
  options: ComposeOptions = {}
): string {
  const { isGuidedPractice = false } = options;

  // Guided Practice welcome message
  if (isGuidedPractice) {
    let message = `**Sensei:** Welcome to Guided Practice — your journey of self-discovery.

Let's explore your **ikigai** — your reason for being. This is about understanding what genuinely interests you, what you're naturally good at, what matters to you, and where these might intersect.

This isn't about finding the "right" answer. It's about developing self-awareness through reflection.`;

    if (activePartners.length > 0) {
      const partnerNames = activePartners.map(id => {
        const partner = config.partners.find(p => p.id === id);
        return partner?.name || id;
      });
      message += `\n\n${partnerNames.join(' and ')} ${activePartners.length > 1 ? 'are' : 'is'} here to help challenge and deepen your thinking.`;
    }

    message += `\n\n**Let's start with curiosity:** What's something you find yourself drawn to learning about or doing, even when no one is asking you to? It could be anything — a hobby, a topic, a type of problem, a way of spending time...`;

    return message;
  }

  // Standard welcome message
  const construct = config.constructs.find(c => c.id === activeConstruct);
  const constructName = construct?.name || 'Learn';

  let message = `**Sensei:** Welcome to the Symbiotic Thinking Dojo. You're currently in **${constructName}** mode`;

  if (activePartners.length > 0) {
    const partnerNames = activePartners.map(id => {
      const partner = config.partners.find(p => p.id === id);
      return partner?.name || id;
    });
    message += `, with ${partnerNames.join(' and ')} ready to engage`;
  }

  message += '.\n\nWhat challenge brings you here today? Take a moment to articulate what you\'re working on and what you hope to achieve.';

  return message;
}
