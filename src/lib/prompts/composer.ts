import { DojoConfig, Construct, SparringPartner } from '../types';
import { PracticeDojoContext, TopicConfig, PhaseConfig } from '../practice-dojo/types';
import { AIProvider } from '../providers/types';
import { DEFAULT_CAREER_INTELLIGENCE_PROMPT } from './defaults/career-intelligence';

export interface ComposeOptions {
  isGuidedPractice?: boolean;
  mentionedPartners?: SparringPartner[];  // Partners invoked via @ mention for this message
  practiceDojoContext?: PracticeDojoContext;  // Context for Practice Dojo mode
  consecutiveTextOnlyResponses?: number;  // Count of consecutive AI responses without interactive elements
  provider?: AIProvider;  // The AI provider being used (for model-specific adjustments)
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
  const { isGuidedPractice = false, mentionedPartners = [], practiceDojoContext, consecutiveTextOnlyResponses = 0, provider } = options;
  const parts: string[] = [];
  const isGroq = provider === 'groq';

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

    // Career Intelligence persona for career topics
    if (practiceDojoContext.topic.topicId.startsWith('career-')) {
      parts.push('# CAREER INTELLIGENCE PERSONA\n\n' + DEFAULT_CAREER_INTELLIGENCE_PROMPT);
    }
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

CRITICAL RULE — Do NOT combine open-ended questions with selection cards:
- If you ask the student to WRITE something (share their words, describe a moment, explain their thinking), do NOT include selection-cards in the same response. Let them type their answer.
- Selection cards should only appear when the options ARE the complete response — choosing a direction, picking a focus, making a decision.
- BAD: "Tell me what your stakeholder said." + selection cards with "Their voice first" / "A specific moment" — this lets students skip the writing.
- GOOD: "Tell me what your stakeholder said. Take a moment to recall their exact words or a specific moment." (no cards — wait for their text)
- GOOD: "How should we approach this?" + selection cards with distinct approaches (cards ARE the answer)
- If a question requires reflection or articulation, trust the student to type. The text input IS the learning.

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

  // 7. Brevity constraints (for all models, but especially important for Groq/Llama)
  const brevitySection = composeBrevityConstraints(isGroq, !!practiceDojoContext);
  parts.push(brevitySection);

  // 8. Chat panel space constraint
  parts.push('Important: Keep responses brief and conversational. This is a chat side panel with limited space.');

  return parts.join('\n\n---\n\n');
}

/**
 * Composes brevity and response length constraints
 * More explicit for Groq/Llama, lighter for frontier models
 */
function composeBrevityConstraints(isGroq: boolean, isPracticeDojo: boolean): string {
  if (isGroq) {
    // Explicit, direct constraints for Llama
    return `# CRITICAL: RESPONSE RULES

**You MUST follow these rules exactly:**

1. **KEEP RESPONSES SHORT.** Maximum 50 words of text per response. Visuals do not count.
2. **ONE MOVE PER RESPONSE.** Either ask ONE question, OR make ONE point, OR present ONE choice. Never all three.
3. **NEVER write paragraphs of explanation.** If you need to explain, use an info-box visual.
4. **ASK, THEN STOP.** After asking a question, stop writing. Do not add more text.
5. **THE STUDENT SHOULD TALK MORE THAN YOU.** If your response is longer than theirs, it's too long.

${isPracticeDojo ? `**IN PRACTICE DOJO:**
- End with a selection-cards visual when possible
- Keep setup text to 1-2 short sentences before the visual
- Do NOT lecture. Ask one thing and wait.` : ''}

**GOOD RESPONSE:** "What matters most to you about this?" (8 words)
**BAD RESPONSE:** "That's a great question. There are several things to consider here. First, we should think about..." (too long, lecturing)

REMEMBER: Short. One move. Then stop.`;
  } else {
    // Lighter guidance for frontier models
    return `# RESPONSE STYLE

Keep responses concise:
- One question or one insight per response
- Under 50 words typical (visuals don't count)
- The student should talk more than you
- Ask, then wait. Don't fill silence with more text.

${isPracticeDojo ? 'In Practice Dojo: Prefer ending with interactive visuals over open-ended questions.' : ''}`;
  }
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

  // Topic-level system instructions (tone, anti-gaming, response style)
  if (topic.systemInstructions) {
    sections.push(`## TOPIC INSTRUCTIONS\n\n${topic.systemInstructions}`);
  }

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

1. **Use selection-cards frequently** - Give 3-4 clickable options for direction/choice questions
2. **Keep text brief** - 2-3 short paragraphs max before the interactive element
3. **Make options feel safe** - No "wrong" answers, each option leads somewhere valuable
4. **IMPORTANT: Choose ONE response type per turn** - Either ask for text input OR present selection cards, NEVER both
5. **When you need their own words** - Ask the question without cards. Scaffold with "In 1-2 sentences..." to reduce blank-input anxiety
6. **When offering a choice or direction** - Use selection cards where clicking IS the complete answer

Example patterns:
- Direction question → Selection cards (clicking = complete response)
- Reflection question → Text prompt only, scaffolded ("In a sentence or two, what did they say?")

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
5. **Never combine text questions with selection cards** - Each response is either a text prompt or a selection; mixing them lets students skip the thinking

Example patterns:
- Ask a focused question (text only), then next turn provide an info-box to react to
- Present a comparison table, then ask what they notice (text only)
- Use selection cards ONLY for "which direction" questions where clicking IS the answer`;
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

    // CST395 Sprint 2 Learn+Solve
    if (topic.topicId === 'cst395-s2-learn-solve') {
      return `**Sensei:** Welcome to the Sprint 2 Practice Dojo. 🔬

This is **Learn + Solve** mode — you're not just practicing, you're producing real deliverables. By the end, you'll have your MVP statement, prototype plan, and build log content ready for submission.

Three blocks, your pace:
- **Block 1** — Narrow to a locked MVP (best done in class with your pair partner)
- **Block 2** — Plan your prototype
- **Block 3** — Build your build log

**Let's start. Who is the person whose problem you're solving?**

\`\`\`dojo-visual
{
  "type": "selection-cards",
  "prompt": "Where are you right now in Sprint 2?",
  "options": [
    {"id": "discovery", "icon": "🔍", "title": "Done discovery", "description": "I've talked to my stakeholder and understand the problem area"},
    {"id": "narrowed", "icon": "🎯", "title": "Already narrowing", "description": "I have a sense of what to build but haven't locked it"},
    {"id": "building", "icon": "🔨", "title": "Already building", "description": "I started a prototype and need to plan/document"},
    {"id": "behind", "icon": "😅", "title": "Behind", "description": "I haven't done much discovery yet"}
  ]
}
\`\`\``;
    }

    // CST395 Sprint 3 Problem Stake Defense
    if (topic.topicId === 'cst395-s3-problem-stake') {
      return `**Sensei:** Welcome to the Sprint 3 Practice Dojo. 🎯

Sprint 3 is different. You're solving a real problem in a domain none of us are experts in — Bhutan's MDRO clinical guideline. Your job is to stake a **specific human moment** where the guideline fails the person who needs it.

This session does two things:
1. **Sharpens your stake** — pressure-tests your user, moment, and pain point
2. **Trains your questioning** — practice spotting gaps in someone else's stake

You'll need this for class, where you'll defend your stake and interrogate a classmate's.

\`\`\`dojo-visual
{
  "type": "selection-cards",
  "prompt": "Where are you with your Sprint 3 problem stake?",
  "options": [
    {"id": "have-stake", "icon": "📋", "title": "I have a stake", "description": "I've written or drafted my Problem Stake Brief"},
    {"id": "finding", "icon": "🔍", "title": "Still finding my moment", "description": "I read the guideline but haven't locked a specific problem"},
    {"id": "stuck", "icon": "🤔", "title": "Started but stuck", "description": "I have some ideas but something isn't clicking"}
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

  // Career Intelligence: Know Yourself
  if (topic.topicId === 'career-know-yourself') {
    return `**Sensei:** Welcome to the Career Intelligence Dojo. 🪞

By the end of this session you'll have a **working draft** of a Value Statement — what you uniquely bring and why it matters to an employer. Treat it as a draft to develop, not a final verdict on who you are. We'll start specific and stay specific.

Let's start somewhere real.

\`\`\`dojo-visual
{
  "type": "selection-cards",
  "prompt": "Where do you want to start?",
  "options": [
    {"id": "moment", "icon": "⏳", "title": "A moment that pulled you in", "description": "A recent time you were so absorbed you lost track of time"},
    {"id": "people", "icon": "🤝", "title": "What people come to you for", "description": "Something people seek you out for specifically"},
    {"id": "either", "icon": "🌗", "title": "Not sure — pick either", "description": "There is no wrong door. Just start."}
  ]
}
\`\`\``;
  }

  // Career Intelligence: Know the Market
  if (topic.topicId === 'career-know-market') {
    return `**Sensei:** Welcome to the Career Intelligence Dojo. 🗺️

This is required work before the next synchronous session. By the end, you'll have a **Market Map** — a research-backed picture of where your capabilities have real value, what employers in that space actually ask for, and how to position yourself in their language.

This isn't about browsing job boards. It's about testing a hypothesis: *does the market actually value what I bring?*

**First, let's establish where you're starting.**

\`\`\`dojo-visual
{
  "type": "selection-cards",
  "prompt": "Where are you coming from?",
  "options": [
    {"id": "know-yourself", "icon": "🪞", "title": "I completed the Know Yourself Dojo", "description": "I have a Value Statement and intersection ready"},
    {"id": "story-swap", "icon": "🤝", "title": "I'm starting from the Story Swap session", "description": "I did the live session but skipped Know Yourself"}
  ]
}
\`\`\``;
  }

  // Map Your Curiosity: open with the Phase 0 free-time selection cards
  if (topic.topicId === 'map-curiosity') {
    return `**Sensei:** Welcome. 💡

This is a short journey — about 25–35 minutes — to help you notice something you're already curious about, name it as a real question, and connect it to whatever you're working on right now.

Let's start with you. When you have free time, what do you find yourself doing?

\`\`\`dojo-visual
{
  "type": "selection-cards",
  "prompt": "Pick whichever feels most you — or pick \\"Something else\\" and tell me.",
  "options": [
    {"id": "make", "icon": "🎨", "title": "Make things", "description": "Art, music, writing, crafts, cooking"},
    {"id": "build", "icon": "🔧", "title": "Build or fix things", "description": "Lego, models, repair stuff, DIY projects"},
    {"id": "play", "icon": "🎮", "title": "Play games", "description": "Video games, board games, sports"},
    {"id": "watch", "icon": "🎬", "title": "Watch things", "description": "Videos, shows, documentaries, livestreams"},
    {"id": "read", "icon": "📖", "title": "Read", "description": "Books, comics, articles, fanfic"},
    {"id": "observe", "icon": "🌿", "title": "Notice the world", "description": "People-watch, nature, animals, the sky"},
    {"id": "talk", "icon": "💬", "title": "Talk with people", "description": "Friends, online communities, debates"},
    {"id": "tinker", "icon": "💻", "title": "Tinker with tech", "description": "Computers, phones, apps, gadgets"},
    {"id": "other", "icon": "✨", "title": "Something else", "description": "Tell me what it is"}
  ]
}
\`\`\``;
  }

  // Generic welcome for other topics
  return `**Sensei:** Welcome to the Practice Dojo! 🥋

You've chosen to explore **${topic.title}** via the **${pathwayName}** path.

${topic.description}

**Let's start with you.** What drew you to this topic, or what's on your mind as we begin?`;
}
