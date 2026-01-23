import { TopicConfig } from '../types';

/**
 * Symbiotic Thinking Foundations - Redesigned with Learning Design Principles
 *
 * Core approach: Students PRACTICE symbiotic thinking while learning about it.
 * Every phase follows: ANCHOR → CHALLENGE → CONTRAST → NAME → BRIDGE
 *
 * The AI should be brief (under 50 words per response, one move at a time).
 */
export const SYMBIOTIC_THINKING_TOPIC: TopicConfig = {
  topicId: 'symbiotic-thinking',
  title: 'Symbiotic Thinking Foundations',
  description: 'Learn to think WITH AI, not just use it',
  estimatedTime: '25-35 minutes',
  category: 'foundations',
  enabled: true,
  icon: '🥋',

  pathways: [
    {
      id: 'guided',
      title: 'Guided Journey',
      description: 'Full experience with all phases',
      icon: '🎯',
      estimatedTime: '25-35 min',
    },
    {
      id: 'quick',
      title: 'Quick Overview',
      description: 'Key concepts, shorter experience',
      icon: '⚡',
      estimatedTime: '12-15 min',
    },
    {
      id: 'test',
      title: 'Test My Understanding',
      description: 'Skip what you already know',
      icon: '🔍',
      estimatedTime: 'varies',
    },
  ],

  phases: [
    // ============================================================
    // PHASE 0: WELCOME
    // Hook them with the thought experiment immediately
    // ============================================================
    {
      phaseId: 0,
      title: 'Welcome',
      purpose: 'Hook with the direct report scenario',
      hasCheckpoint: false,
      contentGuidance: `
PURPOSE: Create curiosity and personal investment through a thought experiment.

The welcome message already presents the "direct report" scenario. The student has just been told they're getting a capable direct report and asked for their first reaction.

DO NOT add anything here. Wait for their response. One move only.
`,
    },

    // ============================================================
    // PHASE 1: THE MANAGER INSIGHT
    // They experience managing before knowing it's AI
    // ============================================================
    {
      phaseId: 1,
      title: 'The Manager Insight',
      purpose: 'Experience the "manager of intelligence" realization',
      hasCheckpoint: true,
      contentGuidance: `
PURPOSE: They commit to how they'd manage BEFORE knowing it's AI. Then the reveal creates contrast.

ANCHOR: Their response to "you have a direct report" - this is THEIR instinct, THEIR approach.

CHALLENGE: Ask ONE follow-up about their approach. Then escalate: "Now you have FIVE direct reports."

CONTRAST: After they respond to five, REVEAL the twist:
\`\`\`dojo-visual
{"type": "info-box", "style": "reveal", "title": "The Twist", "content": "Your direct reports are **AI systems**.\\n\\nThey can solve olympiad problems, write code in seconds, analyze thousands of documents, never tire, never forget—and they're getting better every few months."}
\`\`\`

Then ask: "What changes? What stays the same?"

NAMING: After they reflect, name it briefly: "You just described delegation skills. Everyone with AI access needs these now."

CHECKPOINT: "Why do delegation skills matter when the 'direct report' is AI?"

SUCCESS: They articulate that AI is capable but needs human direction/judgment/priorities.
`,
      checkpointCriteria: `
They should express: AI can do a lot, but humans provide direction, judgment, context, priorities.
If shallow, ask: "What do YOU provide that AI can't provide for itself?"
`,
    },

    // ============================================================
    // PHASE 2: FEEL THE DIFFERENCE
    // The core experiential exercise - personal writing
    // ============================================================
    {
      phaseId: 2,
      title: 'Feel the Difference',
      purpose: 'Experience the gap between generic AI output and THEIR output',
      hasCheckpoint: true,
      contentGuidance: `
PURPOSE: They FEEL (not just understand) that their contribution matters.

ANCHOR: Ask them to pick something personal:
\`\`\`dojo-visual
{"type": "selection-cards", "prompt": "Pick something that matters to YOU:", "options": [{"id": "message", "icon": "💌", "title": "A personal message", "description": "To someone important in your life"}, {"id": "creative", "icon": "📝", "title": "Something creative", "description": "A poem, story idea, or song"}, {"id": "professional", "icon": "💼", "title": "Professional writing", "description": "Cover letter, pitch, or email"}, {"id": "other", "icon": "✨", "title": "Something else", "description": "You tell me"}]}
\`\`\`

CHALLENGE: Get brief context (who, what, why). Then generate a GENERIC version—competent but impersonal.

Ask: "Would you send this? What's missing?"

CONTRAST: Through 2-3 quick exchanges, help them make it THEIRS. Ask ONE specific question at a time:
- "What would only YOU know about this person?"
- "What tone fits YOUR relationship?"
- "How should they FEEL reading this?"

Then: "Compare first version to now. What did YOU add?"

CHECKPOINT: "What did you contribute that I couldn't have known?"

SUCCESS: They identify specific personal context, choices, or judgment they added.
`,
      checkpointCriteria: `
Experiential checkpoint. They should:
1. Have engaged genuinely (not just going through motions)
2. Identify what THEY added (details, tone, personal knowledge)
3. Feel the difference, not just understand it conceptually
`,
    },

    // ============================================================
    // PHASE 3: NAME THE 3Cs
    // Name the framework AFTER they've experienced it
    // ============================================================
    {
      phaseId: 3,
      title: 'The 3Cs',
      purpose: 'Name what they just did: Context, Choices, Confirmation',
      hasCheckpoint: true,
      contentGuidance: `
PURPOSE: Name the framework AFTER they've experienced it. Discovery before naming.

BRIDGE: "Let's name what you just did."

NAMING: Surface each C from THEIR work:
- "You gave me [specific detail]. That's CONTEXT—what only you knew."
- "You decided [their choice]. That's a CHOICE—you picked a direction."
- "You knew when it felt right. That's CONFIRMATION—checking against your intent."

Show the framework:
\`\`\`dojo-visual
{"type": "framework-diagram", "diagram": "3cs", "caption": "The 3Cs: What YOU bring to every AI interaction"}
\`\`\`

CHECKPOINT: "Point to one moment in our exercise where you used each C."

SUCCESS: They give concrete examples from their own work, not abstract definitions.
`,
      checkpointCriteria: `
They should point to THEIR OWN work:
- Context: A specific detail they provided
- Choice: A decision they made
- Confirmation: How they knew it was right

Not looking for definitions. Looking for application.
`,
    },

    // ============================================================
    // PHASE 4: THE PERSONAL STACK
    // Integrate: Mindset + Metacognition + Motivation
    // ============================================================
    {
      phaseId: 4,
      title: 'The Personal Stack',
      purpose: 'Integrate the three layers that make symbiotic thinking work',
      hasCheckpoint: true,
      contentGuidance: `
PURPOSE: Connect 3Cs to the bigger picture—Mindset, Metacognition, Motivation.

BUILD from their experience:

MINDSET: "Remember the first version vs. your final version? That's the spectrum from Consuming to Creating."
\`\`\`dojo-visual
{"type": "info-box", "style": "insight", "title": "Mindset", "content": "**Creating vs Consuming**\\n\\nConsuming: Accept AI output passively.\\nCreating: Infuse it with your Context, Choices, Confirmation.\\n\\nThe goal isn't to never consume—it's to CREATE more than you consume."}
\`\`\`

METACOGNITION: "The 3Cs are your tools for thinking about thinking. That's metacognition."

MOTIVATION: "But why bother? Because there's a difference between getting answers and building wisdom."
\`\`\`dojo-visual
{"type": "framework-diagram", "diagram": "dikw", "caption": "Climb from Data to Wisdom"}
\`\`\`

Relate DIKW to their exercise:
- Data: "Write me a message"
- Information: "Show me styles"
- Knowledge: "What makes it personal?"
- Wisdom: "What would THIS person value from ME?"

Show the stack:
\`\`\`dojo-visual
{"type": "framework-diagram", "diagram": "personal-stack", "caption": "Three layers that build on each other"}
\`\`\`

CHECKPOINT: "What happens if one layer is missing?"

SUCCESS: They articulate that all three layers need each other.
`,
      checkpointCriteria: `
They should understand integration:
- Mindset without technique = good intentions, no tools
- Technique without motivation = going through the motions
- All three together = symbiotic thinking
`,
    },

    // ============================================================
    // PHASE 5: TRANSFER
    // Connect to their real challenges
    // ============================================================
    {
      phaseId: 5,
      title: 'Ready for the Dojo',
      purpose: 'Transfer learning to their real challenges',
      hasCheckpoint: false,
      contentGuidance: `
PURPOSE: Connect what they learned to what they'll DO next.

SUMMARY (brief):
\`\`\`dojo-visual
{"type": "info-box", "style": "summary", "title": "What You've Built", "content": "• You're a manager of AI, not just a user\\n• The 3Cs: Context, Choices, Confirmation\\n• Mindset: Create more than you consume\\n• Motivation: Climb from Data to Wisdom"}
\`\`\`

TRANSFER: "Which of these feels solid? Which do you want to practice?"

Then: "What real challenge could you bring to the Dojo right now?"

OPTIONS:
\`\`\`dojo-visual
{"type": "selection-cards", "prompt": "What's next?", "options": [{"id": "challenge", "icon": "🎯", "title": "Bring a challenge", "description": "I have something to work on"}, {"id": "practice", "icon": "🔄", "title": "Practice more", "description": "I want to solidify these concepts"}, {"id": "done", "icon": "✅", "title": "I'm good for now", "description": "End the session"}]}
\`\`\`

If they bring a challenge → transition to Open Dojo with their challenge.
If they want practice → suggest using a sparring partner.
If they're done → close warmly, remind them the Dojo is always open.
`,
    },
  ],
};
