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
  const { topic, currentPhase, pathway, completedPhases, userChoices, checkpointStatuses, interactionCount } = context;

  const sections: string[] = [];

  // Topic header
  sections.push(`# PRACTICE DOJO MODE: ${topic.title.toUpperCase()}`);

  // Session info
  sections.push(`## Session Information
- **Topic:** ${topic.title}
- **Pathway:** ${pathway.charAt(0).toUpperCase() + pathway.slice(1)}
- **Current Phase:** ${currentPhase.phaseId + 1} of ${topic.phases.length} - "${currentPhase.title}"
- **Completed Phases:** ${completedPhases.length > 0 ? completedPhases.map(p => p + 1).join(', ') : 'None yet'}
- **Interaction Count:** ${interactionCount}`);

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

  // Progressive scaffolding based on interaction count
  // This helps students build momentum - start with clicks, transition to text
  let scaffoldingGuidance: string;
  if (interactionCount <= 4) {
    // Early phase: Heavy interactive scaffolding
    scaffoldingGuidance = `## ENGAGEMENT SCAFFOLDING (Early Phase - Interaction ${interactionCount + 1})

**PRIORITY: Use interactive elements to build momentum.**

In these early interactions, students are warming up. Make it easy for them to engage:

1. **End EVERY response with a selection-cards element** - Give 3-4 clickable options
2. **Keep text brief** - 2-3 short paragraphs max before the interactive element
3. **Make options feel safe** - No "wrong" answers, each option leads somewhere valuable
4. **If asking a question, offer structured responses** - Don't leave them staring at a blank input

Example pattern:
- Brief acknowledgment/insight (1-2 sentences)
- One key point or question (1 paragraph)
- Selection cards with clear options

\`\`\`dojo-visual
{
  "type": "selection-cards",
  "prompt": "Your prompt here",
  "options": [
    {"id": "opt1", "icon": "🎯", "title": "Option 1", "description": "Brief description"},
    {"id": "opt2", "icon": "💡", "title": "Option 2", "description": "Brief description"},
    {"id": "opt3", "icon": "🤔", "title": "Option 3", "description": "Brief description"}
  ]
}
\`\`\``;
  } else if (interactionCount <= 8) {
    // Middle phase: Mixed scaffolding
    scaffoldingGuidance = `## ENGAGEMENT SCAFFOLDING (Building Phase - Interaction ${interactionCount + 1})

**PRIORITY: Mix interactive elements with guided text responses.**

The student has momentum now. Start asking for more:

1. **Alternate between interactive and text prompts** - Every other response can ask for text input
2. **When asking for text, scaffold it** - "In 1-2 sentences..." or "What's one example..."
3. **Use info-boxes and comparison tables** - Visual elements that don't require clicking
4. **Still offer selection cards for big decisions** - But allow text for reflection

Example patterns:
- Ask a focused question, then provide an info-box to react to
- Present a comparison table, then ask what they notice
- Use selection cards for "which direction" questions, text for "what do you think" questions`;
  } else {
    // Later phase: Text-primary with periodic interactive elements
    scaffoldingGuidance = `## ENGAGEMENT SCAFFOLDING (Fluent Phase - Interaction ${interactionCount + 1})

**PRIORITY: Natural conversation with periodic visual elements.**

The student is engaged and thinking. Trust them more:

1. **Text responses are fine** - They're warmed up and contributing
2. **Use interactive elements every 2-3 responses** - Keep variety but don't force it
3. **Reserve selection cards for genuine choices** - Not just to have something clickable
4. **Use info-boxes for reveals and summaries** - Visual punctuation for key moments

At this stage, match the natural flow of the conversation. If they're giving thoughtful responses, don't interrupt with unnecessary interactive elements.`;
  }
  sections.push(scaffoldingGuidance);

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
 * Uses selection cards for initial engagement to build momentum
 */
export function createPracticeDojoWelcome(topic: TopicConfig, pathway: string): string {
  const pathwayConfig = topic.pathways.find(p => p.id === pathway);
  const pathwayName = pathwayConfig?.title || pathway;

  // For Symbiotic Thinking topic, start with the thought experiment + initial reaction cards
  if (topic.topicId === 'symbiotic-thinking') {
    return `**Sensei:** Welcome to the Practice Dojo! 🥋

You've chosen to explore **${topic.title}** via the **${pathwayName}** path. ${topic.description}

Let me start with a thought experiment:

*Imagine this: You just landed your dream job. On your first day, your boss comes to your desk with exciting news:*

*"I'm assigning you a direct report. They're an expert in a specific area, diligent, creative, and great at remembering things. They're very capable, but it will be up to you to figure out how to best utilize their skills. With this additional resource, I'll naturally be expecting more value from your work."*

**What's your first reaction to this news?**

\`\`\`dojo-visual
{
  "type": "selection-cards",
  "prompt": "How do you feel about suddenly having a direct report?",
  "options": [
    {"id": "excited", "icon": "🎉", "title": "Excited!", "description": "More resources means I can do more"},
    {"id": "nervous", "icon": "😰", "title": "A bit nervous", "description": "I've never managed anyone before"},
    {"id": "curious", "icon": "🤔", "title": "Curious", "description": "I want to know more about their skills"},
    {"id": "skeptical", "icon": "🧐", "title": "Skeptical", "description": "What's the catch here?"}
  ]
}
\`\`\``;
  }

  // For course topics, start with interactive cards
  if (topic.category === 'course') {
    // CST395 opening
    if (topic.topicId === 'course-cst395-overview') {
      return `**Sensei:** Welcome to the Practice Dojo! 🥋

Let's explore **${topic.title}** together.

This is an interactive experience to help you deeply understand the course—not just what it covers, but how it's designed and how to get the most out of it.

**What brings you here today?**

\`\`\`dojo-visual
{
  "type": "selection-cards",
  "prompt": "What would you like to focus on?",
  "options": [
    {"id": "understand", "icon": "🎯", "title": "Understand the course", "description": "What is this course really about?"},
    {"id": "succeed", "icon": "🏆", "title": "How to succeed", "description": "What does it take to do well?"},
    {"id": "ai-native", "icon": "🤖", "title": "What's 'AI-native'?", "description": "I want to understand this concept"},
    {"id": "explore", "icon": "🗺️", "title": "Just exploring", "description": "Show me what this is about"}
  ]
}
\`\`\``;
    }

    // CST349 opening
    if (topic.topicId === 'course-cst349-overview') {
      return `**Sensei:** Welcome to the Practice Dojo! 🥋

Let's explore **${topic.title}** together.

This is an interactive experience to help you deeply understand the course—not just what it covers, but how it's designed and how to get the most out of it.

**What brings you here today?**

\`\`\`dojo-visual
{
  "type": "selection-cards",
  "prompt": "What would you like to focus on?",
  "options": [
    {"id": "understand", "icon": "🎯", "title": "Understand the course", "description": "What is this course really about?"},
    {"id": "succeed", "icon": "🏆", "title": "How to succeed", "description": "What does it take to do well?"},
    {"id": "professional", "icon": "💼", "title": "Career preparation", "description": "How does this help my career?"},
    {"id": "explore", "icon": "🗺️", "title": "Just exploring", "description": "Show me what this is about"}
  ]
}
\`\`\``;
    }

    // Generic course welcome (fallback)
    return `**Sensei:** Welcome to the Practice Dojo! 🥋

Let's explore **${topic.title}** together.

This is an interactive experience to help you deeply understand the course—not just what it covers, but how it's designed and how to get the most out of it.

\`\`\`dojo-visual
{
  "type": "selection-cards",
  "prompt": "What would you like to focus on?",
  "options": [
    {"id": "understand", "icon": "🎯", "title": "Understand the course", "description": "What is this course really about?"},
    {"id": "succeed", "icon": "🏆", "title": "How to succeed", "description": "What does it take to do well?"},
    {"id": "explore", "icon": "🗺️", "title": "Just exploring", "description": "Show me what this is about"}
  ]
}
\`\`\``;
  }

  // Generic welcome for other topics
  return `**Sensei:** Welcome to the Practice Dojo! 🥋

You've chosen to explore **${topic.title}** via the **${pathwayName}** path.

${topic.description}

Let's begin your journey.`;
}
