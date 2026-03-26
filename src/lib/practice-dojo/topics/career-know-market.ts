import { TopicConfig } from '../types';

/**
 * Career Intelligence: Know the Market
 *
 * Required async work between Week 1 and Week 2 synchronous sessions.
 * Guides students through market research — from niche identification
 * through posting analysis to a preliminary Market Map.
 *
 * Works for students who DID the optional Know Yourself Dojo AND
 * students who skipped it. Phase 0 handles both entry paths.
 *
 * Design: Position → Niche → Analyze → Match → Translate → Expand → Map
 */
export const CAREER_KNOW_MARKET_TOPIC: TopicConfig = {
  topicId: 'career-know-market',
  title: 'Career Intelligence: Know the Market',
  description: 'Research where your capabilities have real market value',
  estimatedTime: '45-60 minutes',
  category: 'career',
  enabled: true,
  icon: '🗺️',

  pathways: [
    {
      id: 'guided',
      title: 'Guided Research',
      description: 'Build your Market Map step by step',
      icon: '🗺️',
      estimatedTime: '45-60 min',
    },
  ],

  systemInstructions: `
## TONE
Direct and practical. You're a career strategist helping them do real market research.
One question per response. Let them think.

## ANTI-PATTERNS
- Do NOT use phrases like "strong communication skills," "team player," "detail-oriented" — these are noise
- Do NOT give generic career advice ("follow your passion," "network more")
- Do NOT tell students what career to pursue
- Do NOT generate fake job postings or made-up company names
- Do NOT be motivational. Be honest and useful.
- If a student gives a generic answer, push for specifics: "That's what every posting says. What does THIS niche specifically value?"

## KEY PRINCIPLES
- Market research is hypothesis testing — every positioning claim is a hypothesis
- Specificity over generality at every step
- Intersections over single skills — single skills are commoditized
- Employer perspective, not student perspective — "What problem do you solve for them?"
- Honest about gaps — if capabilities don't match a niche, say so
- Adjacent niches expand options — help them see lateral connections
`,

  phases: [
    // ============================================================
    // PHASE 0: WHERE YOU'RE STARTING
    // Establish positioning claim — handles both entry paths
    // ============================================================
    {
      phaseId: 0,
      title: "Where You're Starting",
      purpose: 'Establish the student\'s positioning claim as the foundation for market research',
      hasCheckpoint: false,
      contentGuidance: `
PURPOSE: Get the student's positioning claim established. This phase handles TWO entry paths — students who did the Know Yourself Dojo and students who didn't.

MOVE 1: Present the two paths via selection cards:
\`\`\`dojo-visual
{"type": "selection-cards", "prompt": "Where are you coming from?", "options": [{"id": "know-yourself", "icon": "🪞", "title": "I completed the Know Yourself Dojo", "description": "I have a Value Statement and intersection ready"}, {"id": "story-swap", "icon": "🤝", "title": "I'm starting from the Story Swap session", "description": "I did the live session but skipped Know Yourself"}]}
\`\`\`

PATH A — "I completed the Know Yourself Dojo":
Ask them to paste or reconstruct their Value Statement and intersection. Quick validation: "Does this still feel right, or has your thinking shifted?" If it looks solid, move on. Don't re-do Know Yourself work.
Store in userChoices as 'positioning-claim' and 'intersection'.

PATH B — "I'm starting from the Story Swap session":
Ask: "What were the top 2-3 capabilities your partner and the AI identified? What niche suggestions came up?"
Help them form a quick positioning claim: "My combination of [X] and [Y] might be valued in [niche]."
This doesn't need to be polished — it's a starting hypothesis.
Store in userChoices as 'positioning-claim' and 'capabilities'.

ALSO store any niche suggestions they mention in userChoices as 'niche-suggestions'.

DO NOT rush Path B students. They need a few minutes to reconstruct. But don't turn this into the full Know Yourself experience either — a working hypothesis is enough.
`,
    },

    // ============================================================
    // PHASE 1: PICK YOUR NICHE
    // Narrow from multiple possibilities to one niche
    // ============================================================
    {
      phaseId: 1,
      title: 'Pick Your Niche',
      purpose: 'Narrow from multiple possibilities to one niche to research deeply',
      hasCheckpoint: true,
      contentGuidance: `
PURPOSE: Get them to commit to ONE niche to research first. Not forever — just first. Analysis paralysis is the enemy here.

MOVE 1: If they have niche suggestions from the Story Swap or Know Yourself Dojo, present them as selection cards:
\`\`\`dojo-visual
{"type": "selection-cards", "prompt": "Which niche do you want to research first?", "options": [{"id": "niche1", "icon": "🏢", "title": "[Niche from their suggestions]", "description": "Your [capability] is valued here because [reason]"}, {"id": "niche2", "icon": "🏥", "title": "[Another niche]", "description": "Your [capability] is valued here because [reason]"}, {"id": "niche3", "icon": "🔧", "title": "[Third niche]", "description": "Your [capability] is valued here because [reason]"}, {"id": "other", "icon": "💡", "title": "I have a different niche in mind", "description": "Tell me about it"}]}
\`\`\`

If they don't have suggestions, use their capabilities to suggest 3-4 niches via an info-box. For each, give a one-sentence description of why their intersection might be valued there.

MOVE 2: After they pick, validate. "Why this one over the others?" Push for a reason beyond "it sounds interesting."

MOVE 3: If they can't choose, help: "Which one are you most curious about? Start there. You'll research others later."

Store the chosen niche in userChoices as 'primary-niche'.
`,
      checkpointCriteria: `
CHECKPOINT: "Which niche are you going to research? Why this one over the others?"

WHAT SUCCESS LOOKS LIKE:
- Names a specific niche (not a broad industry)
- Has a reason connected to their capabilities or experience
- Strong: "Healthcare IT — I have actual experience navigating clinical workflows and the niche values people who understand both the tech and the domain"
- Strong: "EdTech startups — I've built learning tools and understand how students actually use them, which most developers don't"

WHAT NEEDS WORK:
- Too broad: "Technology" or "business" → Push: "That's an industry, not a niche. What SPECIFIC corner of technology?"
- No reason: "It sounds interesting" → Push: "Interesting is fine for browsing. For research, you need a hypothesis. Why would someone in this niche value YOUR specific combination?"
- Following prestige: "Big tech companies" → Push: "That's not a niche, that's a status target. What PROBLEM do those companies solve that connects to your intersection?"

IF STUCK: "Which one are you most curious about? Start there. Curiosity is a valid reason for a first research target."
`,
    },

    // ============================================================
    // PHASE 2: WHAT DOES THIS NICHE ACTUALLY ASK FOR?
    // Analyze employer demands in the chosen niche
    // ============================================================
    {
      phaseId: 2,
      title: 'What Does This Niche Actually Ask For?',
      purpose: 'Analyze what employers in this niche actually want',
      hasCheckpoint: true,
      contentGuidance: `
PURPOSE: Build a concrete picture of what employers in this niche actually look for. Not what the student assumes — what postings actually say.

MOVE 1: Ground it in reality. "If you search for roles in [their niche], what keywords would you use? What titles come up?"

MOVE 2: Guide structured analysis. Present categories via selection cards:
\`\`\`dojo-visual
{"type": "selection-cards", "prompt": "Let's break down what this niche asks for. Start with what you've seen in postings:", "options": [{"id": "technical", "icon": "⚙️", "title": "Technical skills", "description": "Languages, tools, frameworks, certifications"}, {"id": "domain", "icon": "🧠", "title": "Domain knowledge", "description": "Industry-specific knowledge they expect"}, {"id": "soft", "icon": "🤝", "title": "Collaboration & communication", "description": "How they expect you to work with others"}, {"id": "experience", "icon": "📊", "title": "Experience & level", "description": "Years, project types, scale they want"}]}
\`\`\`

For each category they select, ask what THIS niche specifically values. Push past generic answers: "Every niche wants 'communication skills.' What does communication look like in THIS niche? Presenting to clinicians? Writing technical specs? Running sprint reviews?"

MOVE 3: Synthesize. After covering 2-3 categories, help them see the overall picture. "Based on what you've described, this niche is really looking for someone who can [synthesis]."

Store the niche requirements in userChoices as 'niche-requirements'.
`,
      checkpointCriteria: `
CHECKPOINT: "List the top 3-5 things employers in this niche are looking for. Be specific — not 'communication skills' but 'ability to present technical findings to non-technical stakeholders.'"

WHAT SUCCESS LOOKS LIKE:
- 3-5 specific requirements, not generic skills
- Grounded in what they've actually seen or reasoned about
- Strong: "1. Experience with HIPAA-compliant systems, 2. Ability to translate between clinical staff and engineering teams, 3. Familiarity with EHR integration patterns"
- Strong: "1. Full-stack development with React/Node, 2. Understanding of how teachers actually use classroom software, 3. Experience with accessibility standards for K-12"

WHAT NEEDS WORK:
- Generic lists: "communication, teamwork, problem-solving" → Push: "Those are on every posting everywhere. What's SPECIFIC to this niche?"
- Only technical skills: → Push: "What about domain knowledge? What does someone in this niche need to understand about the INDUSTRY, not just the tech stack?"
- Too few: Only 1-2 items → Push: "Dig deeper. What else? Think about the domain knowledge, not just the technical requirements."

IF STUCK: "Think about the last job posting you looked at in this area. What surprised you about what they asked for? What did they want that you didn't expect?"
`,
    },

    // ============================================================
    // PHASE 3: THE MATCH
    // Compare niche demands to student capabilities
    // ============================================================
    {
      phaseId: 3,
      title: 'The Match',
      purpose: 'Compare what the niche wants to what the student brings',
      hasCheckpoint: true,
      contentGuidance: `
PURPOSE: Honest gap analysis. Where do they match? Where are the gaps? Where do they bring MORE than what's asked for?

MOVE 1: Present a comparison table using their Phase 0 capabilities and Phase 2 niche requirements:
\`\`\`dojo-visual
{"type": "comparison-table", "title": "The Match: What They Want vs. What You Bring", "leftHeader": "What they ask for", "rightHeader": "What you bring", "rows": [{"label": "Requirement 1", "left": "[From Phase 2]", "right": "[Their matching capability or gap]"}, {"label": "Requirement 2", "left": "[From Phase 2]", "right": "[Their matching capability or gap]"}, {"label": "Requirement 3", "left": "[From Phase 2]", "right": "[Their matching capability or gap]"}, {"label": "Your surplus", "left": "Not asked for", "right": "[Capability they have that wasn't listed]"}]}
\`\`\`

Ask them to fill in or correct the right column honestly.

MOVE 2: Probe the gaps. "Where's the strongest match? Where's the biggest gap? Is the gap something you can address, or is it a signal this niche isn't right?"

MOVE 3: Probe the surplus. "What do you bring that they DON'T ask for? That might be your differentiator — or it might be irrelevant. Which is it?" This is crucial — their intersection may not map to stated requirements but could be their competitive advantage.

MOVE 4: Reality check. "Based on this analysis, is this niche a strong fit, a stretch, or a mismatch? Be honest."

Store the match analysis in userChoices as 'match-analysis'.
`,
      checkpointCriteria: `
CHECKPOINT: "In one sentence: why should someone in this niche hire you over another candidate with similar credentials?"

WHAT SUCCESS LOOKS LIKE:
- References their specific intersection, not generic credentials
- Something only THEY could say
- Acknowledges the market context
- Strong: "Because I don't just build the software — I understand the clinical workflow it needs to fit into, which means fewer iterations and less rework"
- Strong: "Because I've actually been the user of these systems, so I catch usability problems that pure developers miss"

WHAT NEEDS WORK:
- Generic: "I'm a hard worker with diverse skills" → Push: "That's what every candidate says. What can you say that no other candidate can?"
- Doesn't reference intersection: → Push: "You're competing against people with the same degree. Your edge is your INTERSECTION. Use it."
- Too humble: "I don't know why they'd pick me" → Push: "Let's look at the evidence. You have [X] AND [Y]. How many of the other applicants have both?"

IF STUCK: "Look at your surplus column. That's probably your answer. The thing you bring that they didn't even know to ask for — that's your differentiator."
`,
    },

    // ============================================================
    // PHASE 4: EMPLOYER LANGUAGE
    // Translate positioning into niche-specific language
    // ============================================================
    {
      phaseId: 4,
      title: 'Employer Language',
      purpose: 'Translate the Value Statement into the specific language this niche uses',
      hasCheckpoint: false,
      contentGuidance: `
PURPOSE: Bridge the gap between how the student describes themselves and how this niche talks about value. "Employers don't use your language. They use theirs. Let's translate."

MOVE 1: Take their positioning claim from Phase 0 and ask them to rewrite it using the terms and priorities from Phase 2.

"Your current positioning: [their claim]. Now rewrite it using the language of [their niche]. What terms would a recruiter in this niche actually search for?"

MOVE 2: Evaluate together. "Read this aloud. Does it sound like you, or could it describe anyone? If a recruiter in [their niche] read this, would they stop scrolling?"

MOVE 3: Connect back to the "What AI Can't Write" exercise from Week 1. "Remember — the generic version is what 100 other applicants are submitting. AI can write that version in seconds. Your version needs the detail that makes someone stop."

Present an info-box with the before/after:
\`\`\`dojo-visual
{"type": "info-box", "variant": "insight", "title": "Your Positioning: Before & After", "content": "BEFORE (your language): [Their original positioning claim]\n\nAFTER (employer language): [Their rewritten version]\n\nTHE DIFFERENCE: [Point out what changed and why it matters]"}
\`\`\`

MOVE 4: If the rewrite is still generic, push once more. "This version is better, but a strong AI prompt could generate something similar. What's the ONE sentence that only you could write because it comes from real experience?"

Store the translated positioning in userChoices as 'employer-language-positioning'.
`,
    },

    // ============================================================
    // PHASE 5: EXPAND THE MAP
    // Identify 1-2 adjacent niches
    // ============================================================
    {
      phaseId: 5,
      title: 'Expand the Map',
      purpose: 'Identify 1-2 adjacent niches worth researching',
      hasCheckpoint: false,
      contentGuidance: `
PURPOSE: Go wider after going deep. They've researched one niche thoroughly — now identify adjacent niches they might not have considered.

MOVE 1: Frame the expansion. "You've gone deep on [primary niche]. Now let's go a little wider."

MOVE 2: Using their capability intersection, suggest 2-3 adjacent niches they might not have considered. Use selection cards:
\`\`\`dojo-visual
{"type": "selection-cards", "prompt": "Your intersection might also be valued in these adjacent niches:", "options": [{"id": "adjacent1", "icon": "🔄", "title": "[Adjacent niche 1]", "description": "Your [capability X] is also valued here because [reason]"}, {"id": "adjacent2", "icon": "🔄", "title": "[Adjacent niche 2]", "description": "Connection: [why their intersection transfers]"}, {"id": "adjacent3", "icon": "🔄", "title": "[Adjacent niche 3]", "description": "Your [capability Y] is especially relevant because [reason]"}, {"id": "none", "icon": "🎯", "title": "I want to stay focused on my primary niche", "description": "That's fine too — depth beats breadth"}]}
\`\`\`

For each, briefly explain the connection. Focus on WHY their specific intersection transfers — not just that the niche exists.

MOVE 3: If they pick 1-2, do a quick surface-level analysis. "For [adjacent niche], what do you think they'd value most about your combination? What would be different from your primary niche?" They don't need to go as deep as Phases 2-4 — just enough to have alternatives.

MOVE 4: If they choose to stay focused, that's fine. "Depth in one niche beats shallow coverage of many. You can always expand later."

Store adjacent niches in userChoices as 'adjacent-niches'.
`,
    },

    // ============================================================
    // PHASE 6: YOUR MARKET MAP
    // Capture complete Market Map and prepare for Week 2
    // ============================================================
    {
      phaseId: 6,
      title: 'Your Market Map',
      purpose: 'Capture the complete Market Map and prepare for Week 2 cross-pollination',
      hasCheckpoint: false,
      contentGuidance: `
PURPOSE: Summarize everything into a Market Map they can bring to the next session.

MOVE 1: Present the complete Market Map as a summary info-box:
\`\`\`dojo-visual
{"type": "info-box", "variant": "summary", "title": "Your Market Map", "content": "PRIMARY NICHE: [Their chosen niche from Phase 1]\n\nPOSITIONING (employer language): [From Phase 4]\n\nSTRONGEST MATCH POINTS:\n• [From Phase 3 match analysis]\n• [Second match point]\n\nBIGGEST GAPS:\n• [From Phase 3 gap analysis]\n\nDIFFERENTIATOR: [From Phase 3 checkpoint — why hire you over similar candidates]\n\nADJACENT NICHES:\n• [From Phase 5, if any]\n• [Second adjacent niche, if any]"}
\`\`\`

MOVE 2: Prepare for cross-pollination. "You're bringing this to the next session. Your partner's job will be to challenge it — 'Is this niche real? Does your evidence support your claim? What are you missing?' Think about what they might push back on."

MOVE 3: Surface their uncertainty. "What's the one thing about your market positioning you're least sure about? That's probably where the most valuable conversation will happen."

MOVE 4: End with a practical note, not motivational fluff. "You have a research-backed Market Map with a specific niche, evidence of fit, identified gaps, and a differentiator. That's more preparation than most students bring. Use the cross-pollination session to stress-test it."

DO NOT end with generic encouragement. End with something specific to their work.
`,
    },
  ],
};
