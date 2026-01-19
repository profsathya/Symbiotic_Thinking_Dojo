import { DojoConfig, Construct, SparringPartner } from '../types';
import { PracticeDojoContext, TopicConfig, PhaseConfig } from '../practice-dojo/types';

export interface ComposeOptions {
  isGuidedPractice?: boolean;
  mentionedPartners?: SparringPartner[];  // Partners invoked via @ mention for this message
  practiceDojoContext?: PracticeDojoContext;  // Context for Practice Dojo mode
  consecutiveTextOnlyResponses?: number;  // Count of consecutive AI responses without interactive elements
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
  const { isGuidedPractice = false, mentionedPartners = [], practiceDojoContext, consecutiveTextOnlyResponses = 0 } = options;
  const parts: string[] = [];

  // Determine threshold for interactive element encouragement
  // Practice Dojo: 3 consecutive text-only responses, Regular: 5
  const interactionThreshold = practiceDojoContext ? 3 : 5;

  // 1. Base Dojo philosophy (always present)
  parts.push('# SYMBIOTIC THINKING DOJO\n\n' + config.dojoPrompt);

  // 2. Sensei layer (always present)
  parts.push('# SENSEI GUIDANCE\n\n' + config.senseiPrompt);

  // 2b. Practice Dojo mode (if active)
  if (practiceDojoContext) {
    parts.push(composePracticeDojoPrompt(practiceDojoContext));
  }
  // 2c. Ikigai guided practice (if active and not in Practice Dojo)
  else if (isGuidedPractice) {
    parts.push('# GUIDED PRACTICE: IKIGAI DISCOVERY\n\n' + config.ikigaiPrompt);
  }

  // 3. Active construct prompt
  const construct = config.constructs.find(c => c.id === activeConstruct);
  if (construct) {
    parts.push('# ACTIVE CONSTRUCT\n\n' + construct.prompt);
  }

  // 4. Combine toggled partners + mentioned partners (deduplicated)
  const allPartners = [...activePartners];
  for (const mentioned of mentionedPartners) {
    if (!allPartners.includes(mentioned)) {
      allPartners.push(mentioned);
    }
  }

  // 4b. Active partner prompts
  if (allPartners.length > 0) {
    const partnerSection: string[] = ['# ACTIVE SPARRING PARTNERS\n'];

    // Note if any partners were invoked via @ mention
    if (mentionedPartners.length > 0) {
      const mentionedNames = mentionedPartners.map(id => {
        const partner = config.partners.find(p => p.id === id);
        return partner?.name || id;
      });
      partnerSection.push(`*${mentionedNames.join(' and ')} ${mentionedPartners.length > 1 ? 'were' : 'was'} invoked via @ mention for this message.*\n`);
    }

    for (const partnerId of allPartners) {
      const partner = config.partners.find(p => p.id === partnerId);
      if (partner) {
        partnerSection.push(partner.prompt);
      }
    }

    parts.push(partnerSection.join('\n\n'));
  }

  // 5. Interactive learning encouragement (when threshold exceeded)
  if (consecutiveTextOnlyResponses >= interactionThreshold) {
    // Escalate urgency based on how many text-only responses
    const isUrgent = consecutiveTextOnlyResponses >= interactionThreshold + 2;

    if (practiceDojoContext) {
      if (isUrgent) {
        parts.push(`# IMPORTANT: ENGAGEMENT NEEDED

You have provided ${consecutiveTextOnlyResponses} consecutive text-only responses. The Practice Dojo is designed for INTERACTIVE learning.

**In your next response, you SHOULD include at least one visual element.** Choose the most appropriate:

- \`selection-cards\` — Give the student 2-3 concrete options to choose from (this helps them engage actively rather than answering open-ended questions repeatedly)
- \`comparison-table\` — Visualize distinctions between concepts they're exploring
- \`info-box\` with style "reveal" — Surface a key insight or reveal information dramatically
- \`framework-diagram\` — Show relationships between ideas visually

Research shows students learn better through active participation than passive Q&A. Vary your approach — if you've been asking open-ended questions, switch to presenting choices.`);
      } else {
        parts.push(`# LEARNING DESIGN REMINDER

The conversation has been primarily text-based for ${consecutiveTextOnlyResponses} exchanges. This is an opportunity to enhance engagement.

**From learning science:** Active participation improves retention. Visual elements help organize ideas. Choice points reveal mental models.

**Consider using in your next response:**
- \`selection-cards\` for presenting 2-3 concrete options (better than repeated open-ended questions)
- \`comparison-table\` for contrasting ideas or approaches
- \`info-box\` with style "reveal" for key insights
- \`checkpoint-prompt\` for reflection

Vary your approach — don't just keep asking "what would you do?" Give scaffolding through concrete choices when the student seems stuck.`);
      }
    } else {
      parts.push(`# ENGAGEMENT REMINDER

The conversation has been text-based for ${consecutiveTextOnlyResponses} exchanges. Consider making it more interactive:

- \`selection-cards\` — Present concrete options for the student to choose from
- \`comparison-table\` — Visualize distinctions
- \`info-box\` — Highlight key insights
- \`framework-diagram\` — Show relationships

Vary your approach if you've been asking similar types of questions.`);
    }
  }

  // 6. Response formatting instructions
  if (practiceDojoContext) {
    parts.push(`# RESPONSE FORMAT

When responding in Practice Dojo mode:
- Speak as Sensei, guiding the student through the learning experience
- Use the dojo-visual JSON blocks to create interactive visual components when specified in the phase guidance
- Follow the phase content guidance closely, but adapt to the student's responses
- At checkpoints, evaluate understanding using the criteria provided - probe with follow-up questions if insufficient
- Mark phase transitions clearly in your responses

VISUAL COMPONENT FORMAT:
To include visual components, use JSON code blocks with the dojo-visual marker:

\`\`\`dojo-visual
{
  "type": "selection-cards",
  "prompt": "Choose an option:",
  "options": [
    {"id": "option1", "icon": "🎯", "title": "Title", "description": "Description"}
  ]
}
\`\`\`

Available visual types:
- selection-cards: Clickable options for user to choose
- comparison-table: Side-by-side comparison with leftHeader, rightHeader, rows
- framework-diagram: diagram can be "3cs", "umpire", "dikw", "personal-stack", "3cs-umpire-mapping", "dojo-modes"
- info-box: style can be "reveal", "insight", "summary", "warning" with title and content
- checkpoint-prompt: question and optional hint for checkpoint verification

Remember: Guide through questions, not lectures. Let them discover before you name. Meet them where they are.`);
  } else {
    parts.push(`# RESPONSE FORMAT

When responding, identify which voice you're speaking from:
- If providing metacognitive guidance, speak as the Sensei
- If a Sparring Partner is activated and their intervention is relevant, speak from that partner's voice
- You may switch between voices in a single response if appropriate
- Always make it clear which voice is speaking by prefixing with the name (e.g., "**Sensei:** ..." or "**The Framer:** ...")

VISUAL COMPONENT FORMAT:
When presenting choices, comparisons, or frameworks, you can use interactive visual components with JSON code blocks:

\`\`\`dojo-visual
{
  "type": "selection-cards",
  "prompt": "Which approach resonates with you?",
  "options": [
    {"id": "option1", "icon": "🎯", "title": "Option Title", "description": "Brief description"}
  ]
}
\`\`\`

Available visual types:
- selection-cards: Clickable options (great when offering 2-4 choices)
- comparison-table: Side-by-side comparison with leftHeader, rightHeader, rows
- framework-diagram: diagram can be "3cs", "umpire", "dikw", "personal-stack", "3cs-umpire-mapping", "dojo-modes"
- info-box: style can be "reveal", "insight", "summary", "warning" with title and content

Use visuals when they genuinely help organize thinking or present clear choices - not every response needs them.

Remember: The goal is to develop the student's judgment and cognitive skills, not just to complete their tasks.`);
  }

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

/**
 * Composes the Practice Dojo-specific prompt section
 */
function composePracticeDojoPrompt(context: PracticeDojoContext): string {
  const { topic, currentPhase, pathway, completedPhases, userChoices, checkpointStatuses } = context;

  const sections: string[] = [];

  // Topic header
  sections.push(`# PRACTICE DOJO MODE: ${topic.title.toUpperCase()}`);

  // Session info
  sections.push(`## Session Information
- **Topic:** ${topic.title}
- **Pathway:** ${pathway.charAt(0).toUpperCase() + pathway.slice(1)}
- **Current Phase:** ${currentPhase.phaseId + 1} of ${topic.phases.length} - "${currentPhase.title}"
- **Completed Phases:** ${completedPhases.length > 0 ? completedPhases.map(p => p + 1).join(', ') : 'None yet'}`);

  // User choices context
  if (Object.keys(userChoices).length > 0) {
    sections.push(`## User Context from Earlier Phases
${Object.entries(userChoices).map(([key, value]) => `- **${key}:** ${value}`).join('\n')}`);
  }

  // Current phase guidance
  sections.push(`## CURRENT PHASE: ${currentPhase.title}

**Purpose:** ${currentPhase.purpose}

**Content Guidance:**
${currentPhase.contentGuidance}

${currentPhase.hasCheckpoint ? `**This phase has a CHECKPOINT.** Evaluate the student's understanding before proceeding.

**Checkpoint Criteria:**
${currentPhase.checkpointCriteria || 'Use judgment to assess understanding.'}` : '**No checkpoint for this phase.** Progress naturally to the next phase when content is covered.'}`);

  // Previous phase checkpoint status if relevant
  const previousCheckpoints = Object.entries(checkpointStatuses);
  if (previousCheckpoints.length > 0) {
    sections.push(`## Checkpoint History
${previousCheckpoints.map(([phase, status]) => `- ${phase}: ${status}`).join('\n')}`);
  }

  // Sensei behavior guidelines
  sections.push(`## SENSEI BEHAVIOR IN PRACTICE DOJO

1. **Guide through questions, not lectures** - Even when presenting content, follow up with "What do you make of this?"
2. **Meet them where they are** - Adjust language and examples to their level
3. **Checkpoints are conversations** - Don't just accept answers; probe understanding
4. **Allow productive tangents** - If they go somewhere valuable, follow, then guide back
5. **Never lecture when they can discover** - Names come AFTER they've experienced the concept
6. **Tone:** Warm but not effusive, challenging but supportive, intellectually rigorous but accessible`);

  return sections.join('\n\n');
}

/**
 * Creates a welcome message for Practice Dojo mode
 * The welcome immediately starts Phase 1 content since pathway was selected in the UI modal
 */
export function createPracticeDojoWelcome(topic: TopicConfig, pathway: string): string {
  const pathwayConfig = topic.pathways.find(p => p.id === pathway);
  const pathwayName = pathwayConfig?.title || pathway;

  // For Symbiotic Thinking topic, include the Phase 1 thought experiment directly
  if (topic.topicId === 'symbiotic-thinking') {
    return `**Sensei:** Welcome to the Practice Dojo! 🥋

You've chosen to explore **${topic.title}** via the **${pathwayName}** path. ${topic.description}

Let me start with a thought experiment:

*Imagine this: You just landed your dream job. On your first day, your boss comes to your desk with exciting news:*

*"I'm assigning you a direct report. They're an expert in a specific area, diligent, creative, and great at remembering things. They're very capable, but it will be up to you to figure out how to best utilize their skills. With this additional resource, I'll naturally be expecting more value from your work."*

Take a moment to consider this scenario. What questions would you want to ask? What would you need to figure out first?`;
  }

  // For course topics, don't mention pathway (they only have one)
  if (topic.category === 'course') {
    return `**Sensei:** Welcome to the Practice Dojo! 🥋

Let's explore **${topic.title}** together.

This is an interactive experience to help you deeply understand the course—not just what it covers, but how it's designed and how to get the most out of it.

${topic.description}

Let's begin!`;
  }

  // Generic welcome for other topics
  return `**Sensei:** Welcome to the Practice Dojo! 🥋

You've chosen to explore **${topic.title}** via the **${pathwayName}** path.

${topic.description}

Let's begin your journey.`;
}
