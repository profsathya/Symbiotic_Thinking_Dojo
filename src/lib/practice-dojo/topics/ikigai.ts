import { TopicConfig } from '../types';

/**
 * Ikigai Discovery - Finding Your Reason for Being
 *
 * Core approach: Students discover their Ikigai through guided exploration,
 * not by being told what it is. Selection-based entry points, then deeper
 * personalized exploration. The AI carries forward their choices to create
 * meaningful connections.
 *
 * Learning Design: ANCHOR → CHALLENGE → CONTRAST → NAME → BRIDGE
 * Each quadrant explored at surface then depth before connecting.
 */
export const IKIGAI_TOPIC: TopicConfig = {
  topicId: 'ikigai-discovery',
  title: 'Discover Your Ikigai',
  description: 'Find your reason for being through guided self-exploration',
  estimatedTime: '45-60 minutes',
  category: 'foundations',
  enabled: true,
  icon: '🌸',

  pathways: [
    {
      id: 'guided',
      title: 'Guided Journey',
      description: 'Full exploration of all four quadrants',
      icon: '🎯',
      estimatedTime: '45-60 min',
    },
    {
      id: 'quick',
      title: 'Quick Exploration',
      description: 'Key insights, condensed experience',
      icon: '⚡',
      estimatedTime: '20-25 min',
    },
    {
      id: 'test',
      title: 'Revisit & Refine',
      description: 'Return to deepen your understanding',
      icon: '🔄',
      estimatedTime: 'varies',
    },
  ],

  phases: [
    // ============================================================
    // PHASE 0: THE HOOK
    // Don't mention Ikigai - start with curiosity
    // ============================================================
    {
      phaseId: 0,
      title: 'The Hook',
      purpose: 'Create curiosity through a thought experiment',
      hasCheckpoint: false,
      contentGuidance: `
PURPOSE: Hook them emotionally before any framework. Surface their intuitive sense of meaning.

ANCHOR with a thought experiment. Present selection cards:
\`\`\`dojo-visual
{"type": "selection-cards", "prompt": "Imagine this scenario. Which draws you most?", "options": [{"id": "retirement", "icon": "🏖️", "title": "Retirement at 30", "description": "You have enough money forever. What do you do with your days?"}, {"id": "last-year", "icon": "⏳", "title": "One Year Left", "description": "You have one year to make your mark. What would you work on?"}, {"id": "alternate", "icon": "🌀", "title": "Parallel Universe", "description": "In another life, what path did you choose instead?"}]}
\`\`\`

Wait for their response. Their choice reveals their entry point:
- Retirement → freedom/love-driven
- Last Year → impact/mission-driven
- Alternate → curiosity about untaken paths

DO NOT explain why you're asking. DO NOT mention Ikigai yet. Just acknowledge their choice and ask ONE follow-up question about what drew them to it.
`,
    },

    // ============================================================
    // PHASE 1: WHAT YOU LOVE - Surface
    // Breadth exploration with selection cards
    // ============================================================
    {
      phaseId: 1,
      title: 'What You Love - Exploration',
      purpose: 'Surface exploration of what brings joy and energy',
      hasCheckpoint: false,
      contentGuidance: `
PURPOSE: Cast a wide net. Help them see patterns in what energizes them.

BRIDGE from their Phase 0 response: "That tells me something about what matters to you. Let's explore further."

Present activities selection:
\`\`\`dojo-visual
{"type": "selection-cards", "prompt": "Which activities make you lose track of time? Pick 2-3.", "options": [{"id": "creating", "icon": "🎨", "title": "Creating", "description": "Making something new - art, code, writing, music"}, {"id": "analyzing", "icon": "🔍", "title": "Analyzing", "description": "Breaking down problems, finding patterns"}, {"id": "helping", "icon": "🤝", "title": "Helping", "description": "Supporting others, teaching, mentoring"}, {"id": "building", "icon": "🏗️", "title": "Building", "description": "Constructing systems, organizations, projects"}]}
\`\`\`

After they respond, present domains:
\`\`\`dojo-visual
{"type": "selection-cards", "prompt": "What domains pull you in? Pick 2-3.", "options": [{"id": "technology", "icon": "💻", "title": "Technology", "description": "Software, hardware, innovation"}, {"id": "people", "icon": "👥", "title": "People", "description": "Psychology, relationships, teams"}, {"id": "ideas", "icon": "💡", "title": "Ideas", "description": "Philosophy, strategy, theory"}, {"id": "nature", "icon": "🌿", "title": "Nature/Health", "description": "Environment, wellness, biology"}]}
\`\`\`

Store their choices. Note any patterns between their Phase 0 scenario and these selections.
`,
    },

    // ============================================================
    // PHASE 2: WHAT YOU LOVE - Deep
    // Narrow and deepen
    // ============================================================
    {
      phaseId: 2,
      title: 'What You Love - Depth',
      purpose: 'Discover WHY they love what they love',
      hasCheckpoint: true,
      contentGuidance: `
PURPOSE: Move from WHAT to WHY. The underlying need reveals more than the surface activity.

CHALLENGE: Reference their specific selections from Phase 1.
"You picked [activities] in [domains]. If you could only keep ONE combination, which?"

After they choose, probe deeper with ONE question:
- "What specifically about [choice] energizes you?"
- "Is it the process, the outcome, or who you become while doing it?"

CONTRAST: Show them what they eliminated.
"You let go of [other choices]. What do those have in common with what you kept?"

This surfaces the underlying VALUE, not just the activity.

CHECKPOINT: "In one sentence, what does [their choice] give you that nothing else does?"

SUCCESS: They articulate an underlying need/value, not just the activity itself.
Example: Not "I love coding" but "I love the feeling of solving puzzles and seeing my solutions work"
`,
      checkpointCriteria: `
They should express WHY, not just WHAT.

Surface-level (needs probing): "I just enjoy it" or "It's fun"
Deeper (acceptable): "It makes me feel [specific feeling]" or "I value [specific value]"

If shallow, ask: "What would be missing from your life if you couldn't do this anymore?"
`,
    },

    // ============================================================
    // PHASE 3: WHAT YOU'RE GOOD AT - Surface
    // Skills exploration, separating from love
    // ============================================================
    {
      phaseId: 3,
      title: 'What You\'re Good At - Exploration',
      purpose: 'Explore skills separately from passions',
      hasCheckpoint: false,
      contentGuidance: `
PURPOSE: Separate LOVE from SKILL. They're often conflated but distinct.

ANCHOR: "What you love and what you're good at aren't always the same. Let's explore your skills."

Present skill categories:
\`\`\`dojo-visual
{"type": "selection-cards", "prompt": "What do others come to YOU for? Pick 2-3.", "options": [{"id": "technical", "icon": "⚙️", "title": "Technical Skills", "description": "Specific expertise, tools, methods"}, {"id": "interpersonal", "icon": "💬", "title": "People Skills", "description": "Communication, empathy, leadership"}, {"id": "analytical", "icon": "📊", "title": "Analytical Skills", "description": "Problem-solving, critical thinking"}, {"id": "creative", "icon": "✨", "title": "Creative Skills", "description": "Innovation, design, artistic expression"}]}
\`\`\`

Then ask about hidden strengths:
\`\`\`dojo-visual
{"type": "selection-cards", "prompt": "What comes EASY to you that others find HARD?", "options": [{"id": "patience", "icon": "🧘", "title": "Patience/Persistence", "description": "Sticking with things others abandon"}, {"id": "seeing-patterns", "icon": "🔮", "title": "Seeing Patterns", "description": "Connecting dots others miss"}, {"id": "simplifying", "icon": "🎯", "title": "Simplifying Complexity", "description": "Making the complicated clear"}, {"id": "energizing", "icon": "⚡", "title": "Energizing Others", "description": "Motivating, inspiring action"}]}
\`\`\`

Note overlaps AND gaps with their "Love" answers from Phase 1-2.
`,
    },

    // ============================================================
    // PHASE 4: WHAT YOU'RE GOOD AT - Deep
    // Separating talent from passion
    // ============================================================
    {
      phaseId: 4,
      title: 'What You\'re Good At - Depth',
      purpose: 'Surface the gap between love and skill',
      hasCheckpoint: true,
      contentGuidance: `
PURPOSE: Make the love/skill distinction visible and meaningful.

CHALLENGE with a comparison:
\`\`\`dojo-visual
{"type": "comparison-table", "title": "Your Love vs. Skill Landscape", "leftHeader": "Love but struggle with", "rightHeader": "Good at but don't love", "rows": [{"label": "Activity", "left": "[Ask them]", "right": "[Ask them]"}], "question": "Fill in both columns honestly. What goes where?"}
\`\`\`

After they respond, ask: "Which column frustrates you more? Why?"

INSIGHT to surface:
- Left column = growth opportunity (skill can be built)
- Right column = potential leverage (can fund what you love)
- Neither column is failure - both are information

CONTRAST: "If you HAD to choose a career from the right column (good at, don't love), could you? What would that feel like?"

CHECKPOINT: "What's one thing you're good at that you've been undervaluing?"

SUCCESS: They recognize skills they've overlooked or taken for granted.
`,
      checkpointCriteria: `
They should identify a genuine skill they haven't fully claimed.

Watch for: False modesty ("I'm not really good at anything") - probe for what others say.
Watch for: Conflating love with skill - help them see the distinction.

If stuck, ask: "What would your closest friend say you're great at?"
`,
    },

    // ============================================================
    // PHASE 5: FIRST INTERSECTION - PASSION
    // Love + Good At
    // ============================================================
    {
      phaseId: 5,
      title: 'The Passion Zone',
      purpose: 'Find where love and skill overlap',
      hasCheckpoint: true,
      contentGuidance: `
PURPOSE: First intersection - Passion (Love + Good At). Make it visible and personal.

Show the partial diagram:
\`\`\`dojo-visual
{"type": "framework-diagram", "diagram": "ikigai-passion", "caption": "Passion = What you love + What you're good at"}
\`\`\`

BRIDGE: Reference THEIR specific answers from Phases 1-4.
"You love [their loves]. You're good at [their skills]. Where do these overlap?"

If clear overlap exists: "This is your PASSION zone. [Specific combination] - you love it AND you're skilled at it."

If gap exists: DON'T normalize. PUSH for connection.
"There seems to be a gap. Let's look harder. Could [skill X] support [love Y] in any way? Even indirectly?"

CHALLENGE: "If you spent 80% of your time in your passion zone, what would that look like day-to-day?"

CHECKPOINT: "Name your passion zone in a phrase. Not a job title - the essence of it."

SUCCESS: They articulate a passion zone, even if it's aspirational.
`,
      checkpointCriteria: `
They should name something specific, not generic.

Weak: "Helping people" (too broad)
Strong: "Helping technical people communicate clearly" (specific intersection)

If they can't find overlap, ask: "What if the overlap doesn't exist yet - what would you need to BUILD for it to exist?"
`,
    },

    // ============================================================
    // PHASE 6: WHAT THE WORLD NEEDS - Surface
    // Often the hardest quadrant
    // ============================================================
    {
      phaseId: 6,
      title: 'What the World Needs - Exploration',
      purpose: 'Explore contribution beyond self',
      hasCheckpoint: false,
      contentGuidance: `
PURPOSE: Expand from self to world. This is often where people get stuck.

REFRAME first: "This isn't about saving the world. It's about noticing where you could help."

Present scale options:
\`\`\`dojo-visual
{"type": "selection-cards", "prompt": "At what scale do you feel called to contribute?", "options": [{"id": "global", "icon": "🌍", "title": "Global/Systemic", "description": "Climate, inequality, technology ethics, health"}, {"id": "community", "icon": "🏘️", "title": "Community/Local", "description": "Neighborhood, city, local organizations"}, {"id": "relational", "icon": "👨‍👩‍👧‍👦", "title": "Relational/Personal", "description": "Family, friends, direct mentorship"}, {"id": "professional", "icon": "💼", "title": "Professional/Industry", "description": "Your field's problems, customer pain points"}]}
\`\`\`

Then probe emotion:
\`\`\`dojo-visual
{"type": "selection-cards", "prompt": "What EMOTION points you toward need?", "options": [{"id": "heartbreak", "icon": "💔", "title": "What breaks your heart?", "description": "Suffering you can't ignore"}, {"id": "anger", "icon": "😤", "title": "What makes you angry?", "description": "Injustice that demands action"}, {"id": "hope", "icon": "✨", "title": "What gives you hope?", "description": "Possibility you want to grow"}, {"id": "curiosity", "icon": "🤔", "title": "What puzzles you?", "description": "Problems you keep thinking about"}]}
\`\`\`

Store their answers. These reveal their sense of calling.
`,
    },

    // ============================================================
    // PHASE 7: WHAT THE WORLD NEEDS - Deep
    // Connecting need to self
    // ============================================================
    {
      phaseId: 7,
      title: 'What the World Needs - Depth',
      purpose: 'Connect world needs to personal passion',
      hasCheckpoint: true,
      contentGuidance: `
PURPOSE: Connect their identified needs to their passion zone. Find the MISSION.

CHALLENGE: "Look at your passion zone ([their Phase 5 answer]). Could it address [their Phase 6 needs]?"

If connection exists: Show it clearly.
\`\`\`dojo-visual
{"type": "framework-diagram", "diagram": "ikigai-mission", "caption": "Mission = What you love + What the world needs"}
\`\`\`
"Your passion for [X] could serve the need for [Y]. This is your MISSION zone."

If gap exists: PUSH for creative connection.
"The gap isn't failure - it's a creative challenge. How might [passion] serve [need] in a way no one has tried?"

DEEPER QUESTION: "Who specifically would benefit if you pursued this? Can you picture ONE real person?"

CHECKPOINT: "Complete this sentence: 'The world needs more ______, and I'm uniquely positioned to provide it because _______.'"

SUCCESS: They connect personal passion to external contribution.
`,
      checkpointCriteria: `
They should make a specific connection, not abstract idealism.

Weak: "The world needs more kindness" (true but not personal)
Strong: "The world needs better mental health resources for new parents, and I understand both the tech to build tools and the emotional experience" (specific + personal)

If stuck: "Start smaller. Who in your immediate circle needs what you have to offer?"
`,
    },

    // ============================================================
    // PHASE 8: WHAT YOU CAN BE PAID FOR - Surface
    // Sustainability exploration
    // ============================================================
    {
      phaseId: 8,
      title: 'What You Can Be Paid For - Exploration',
      purpose: 'Explore sustainability without selling out',
      hasCheckpoint: false,
      contentGuidance: `
PURPOSE: Address the sustainability question honestly. Money isn't evil - it's enablement.

REFRAME: "Being paid for what you love isn't selling out. Sustainability enables impact. Money is stored energy for your mission."

Present path options:
\`\`\`dojo-visual
{"type": "selection-cards", "prompt": "How do you imagine sustaining yourself?", "options": [{"id": "direct", "icon": "🎯", "title": "Direct Path", "description": "Turn passion/mission into career directly"}, {"id": "adjacent", "icon": "↔️", "title": "Adjacent Path", "description": "Related work that funds what you care about"}, {"id": "entrepreneurial", "icon": "🚀", "title": "Entrepreneurial Path", "description": "Create something new around your passion"}, {"id": "hybrid", "icon": "⚖️", "title": "Hybrid Path", "description": "Day job + passion project on the side"}]}
\`\`\`

After they choose, ask: "What draws you to this path over the others?"

Present market reality:
\`\`\`dojo-visual
{"type": "selection-cards", "prompt": "What SKILLS of yours have market value?", "options": [{"id": "specialized", "icon": "🎓", "title": "Specialized Knowledge", "description": "Expertise others need but don't have"}, {"id": "execution", "icon": "⚡", "title": "Execution Ability", "description": "You get things done reliably"}, {"id": "connection", "icon": "🔗", "title": "Connection Building", "description": "You bring people/ideas together"}, {"id": "translation", "icon": "🌉", "title": "Translation", "description": "You bridge different worlds/disciplines"}]}
\`\`\`

Note overlaps with their skills from Phases 3-4.
`,
    },

    // ============================================================
    // PHASE 9: WHAT YOU CAN BE PAID FOR - Deep
    // Reconciling idealism with reality
    // ============================================================
    {
      phaseId: 9,
      title: 'What You Can Be Paid For - Depth',
      purpose: 'Reconcile passion with practicality',
      hasCheckpoint: true,
      contentGuidance: `
PURPOSE: Honest examination of the passion/money relationship.

CHALLENGE with comparison:
\`\`\`dojo-visual
{"type": "comparison-table", "title": "Monetization Paths", "leftHeader": "Direct (passion = income)", "rightHeader": "Indirect (job funds passion)", "rows": [{"label": "Upside", "left": "Full alignment, authentic", "right": "Stability, no compromise"}, {"label": "Risk", "left": "Burnout, market pressure", "right": "Split focus, slower progress"}], "question": "Which path resonates more with where you are NOW in life?"}
\`\`\`

Show profession intersection:
\`\`\`dojo-visual
{"type": "framework-diagram", "diagram": "ikigai-profession", "caption": "Profession = What you're good at + What you can be paid for"}
\`\`\`

HONEST QUESTION: "What fears come up when you think about being paid for what you love?"

Common fears to acknowledge:
- "What if it ruins the thing I love?"
- "What if I'm not good enough to compete?"
- "What if I have to compromise my values?"

CHECKPOINT: "What would need to be true for you to be paid for your passion WITHOUT losing what makes it meaningful?"

SUCCESS: They articulate specific conditions, not just hopes.
`,
      checkpointCriteria: `
They should name real constraints and conditions.

Weak: "I'd need to get lucky" (external locus)
Strong: "I'd need to build an audience who values [specific thing] and price in a way that filters for quality clients" (specific conditions)

If stuck: "Let's be concrete. Name ONE person who gets paid for something similar to your passion. How do they do it?"
`,
    },

    // ============================================================
    // PHASE 10: THE FULL PICTURE
    // All four intersections
    // ============================================================
    {
      phaseId: 10,
      title: 'The Full Picture',
      purpose: 'Map all four quadrants and intersections',
      hasCheckpoint: true,
      contentGuidance: `
PURPOSE: See the complete picture. Identify where they're strong and where gaps exist.

Show the full Ikigai diagram:
\`\`\`dojo-visual
{"type": "framework-diagram", "diagram": "ikigai", "caption": "Your complete Ikigai map"}
\`\`\`

SYNTHESIS - Review each intersection with THEIR answers:
"Let's map what we've discovered:
- **PASSION** (Love + Good At): [their answer from Phase 5]
- **MISSION** (Love + Need): [their answer from Phase 7]
- **PROFESSION** (Good At + Paid): [their skills + market value]
- **VOCATION** (Need + Paid): [need they identified + how it pays]"

CHALLENGE: "Where are you strongest? Where are the gaps?"

\`\`\`dojo-visual
{"type": "selection-cards", "prompt": "Which gap feels most urgent to address?", "options": [{"id": "skill", "icon": "📈", "title": "Skill Gap", "description": "Need to develop ability in something I love"}, {"id": "love", "icon": "❤️", "title": "Love Gap", "description": "Need to reconnect with what energizes me"}, {"id": "need", "icon": "🌍", "title": "Need Gap", "description": "Need to connect my work to something larger"}, {"id": "sustainability", "icon": "💰", "title": "Sustainability Gap", "description": "Need to figure out how to make this viable"}]}
\`\`\`

CHECKPOINT: "Looking at all four quadrants, where does YOUR center feel? Even if imperfect, what's your current Ikigai?"

SUCCESS: They articulate a center, even if acknowledging gaps.
`,
      checkpointCriteria: `
They should attempt a synthesis, not just list the parts.

Look for integration: How do the pieces connect in THEIR life?

If overwhelmed, help them: "You don't need all four perfectly aligned. Where are THREE overlapping right now? That's your starting point."
`,
    },

    // ============================================================
    // PHASE 11: NAMING - YOUR IKIGAI
    // Now we name it
    // ============================================================
    {
      phaseId: 11,
      title: 'Your Ikigai',
      purpose: 'Name and claim their Ikigai',
      hasCheckpoint: true,
      contentGuidance: `
PURPOSE: Name what they've discovered. Make it real and claimable.

NOW introduce Ikigai explicitly:
\`\`\`dojo-visual
{"type": "info-box", "style": "insight", "title": "生き甲斐 Ikigai", "content": "In Japanese, Ikigai means 'reason for being.' It's not a destination you arrive at, but a compass that guides your choices.\\n\\nYou've just mapped yours through exploration, not explanation."}
\`\`\`

CONTRAST with common traps:
\`\`\`dojo-visual
{"type": "comparison-table", "title": "Ikigai Traps", "leftHeader": "The Trap", "rightHeader": "The Truth", "rows": [{"label": "Passion without pay", "left": "Starving artist", "right": "Needs sustainability strategy"}, {"label": "Profession without love", "left": "Golden handcuffs", "right": "Needs reconnection to meaning"}, {"label": "Mission without skill", "left": "Ineffective idealist", "right": "Needs capability building"}, {"label": "Vocation without joy", "left": "Burned out helper", "right": "Needs boundaries and renewal"}], "question": "Which trap are you most at risk of falling into?"}
\`\`\`

CHECKPOINT: Articulate their Ikigai statement.
"Complete this: 'My Ikigai is to _______ [contribution/action] for/with _______ [who] by using my _______ [unique combination].'"

Example: "My Ikigai is to help technical founders communicate their vision clearly, using my combination of engineering background and storytelling skills."

SUCCESS: They create a personal, specific, actionable Ikigai statement.
`,
      checkpointCriteria: `
Their Ikigai statement should have:
1. A contribution (what they give)
2. A beneficiary (who receives)
3. A unique angle (what makes it THEIRS)

Weak: "My Ikigai is to help people" (no specificity)
Strong: "My Ikigai is to help first-generation college students navigate academia using my experience as one" (specific + personal)

If vague, prompt: "Who specifically? Doing what exactly? How does YOUR background make you uniquely suited?"
`,
    },

    // ============================================================
    // PHASE 12: TRANSFER - SMALL STEPS
    // Action, not just insight
    // ============================================================
    {
      phaseId: 12,
      title: 'Small Steps Forward',
      purpose: 'Convert insight into action',
      hasCheckpoint: false,
      contentGuidance: `
PURPOSE: Transform insight into action. Ikigai without movement is just philosophy.

SUMMARY of their journey:
\`\`\`dojo-visual
{"type": "info-box", "style": "summary", "title": "Your Ikigai Journey", "content": "• You LOVE: [their Phase 2 answer]\\n• You're GOOD AT: [their Phase 4 answer]\\n• The world NEEDS: [their Phase 7 answer]\\n• You can be PAID FOR: [their Phase 9 answer]\\n• Your IKIGAI: [their Phase 11 statement]"}
\`\`\`

CHALLENGE: "Ikigai isn't found once - it evolves. What's ONE small experiment you could run this week to move toward yours?"

Present action options:
\`\`\`dojo-visual
{"type": "selection-cards", "prompt": "Choose one small step:", "options": [{"id": "conversation", "icon": "💬", "title": "Have a Conversation", "description": "Talk to someone living a similar Ikigai"}, {"id": "project", "icon": "🔨", "title": "Start a Micro-Project", "description": "Something small in your passion zone"}, {"id": "research", "icon": "🔍", "title": "Research Paths", "description": "Find how others monetize similar work"}, {"id": "serve", "icon": "🎁", "title": "Serve Someone", "description": "Help one person with what you have to offer"}]}
\`\`\`

After they choose, make it concrete: "Specifically, what will you do? By when?"

CLOSE:
\`\`\`dojo-visual
{"type": "info-box", "style": "insight", "title": "Remember", "content": "Your Ikigai will shift as you grow. Return here when life changes.\\n\\nThe Dojo is always open. Bring your real challenges - practice makes purpose."}
\`\`\`

No checkpoint - this is about momentum, not assessment.
`,
    },
  ],
};
