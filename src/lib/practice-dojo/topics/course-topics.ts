import { TopicConfig } from '../types';

// CST349 - CS Professional Seminar
// Mental Model: Self-Directed Learner → SDL capability → Progressive Autonomy → 4 Sprints (decreasing scaffolding)
export const CST349_TOPIC: TopicConfig = {
  topicId: 'course-cst349-overview',
  title: 'CST349: CS Professional Seminar',
  description: 'Understand the course structure, goals, and how to succeed',
  estimatedTime: '15-20 minutes',
  category: 'course',
  courseCode: 'CST349',
  enabled: true,
  icon: '🎓',

  // Only guided pathway for course overviews
  pathways: [
    {
      id: 'guided',
      title: 'Guided Journey',
      description: 'Understand the course through interactive exploration',
      icon: '🎯',
      estimatedTime: '15-20 min',
    },
  ],

  phases: [
    {
      phaseId: 0,
      title: 'Welcome',
      purpose: 'Orient to the course overview experience',
      hasCheckpoint: false,
      contentGuidance: `
Welcome the student warmly to the CST349 Course Overview experience.

Explain that this is an interactive exploration to help them deeply understand:
- What this course is really about (beyond just "professional seminar")
- The mental model that shapes how the course is designed
- How to engage effectively to get maximum value

**Start with curiosity:**
"Before I explain what this course is about, I'm curious: What do you think a 'CS Professional Seminar' should prepare you for? What comes to mind when you hear that title?"

Use their response to bridge into Phase 1.
`,
    },
    {
      phaseId: 1,
      title: 'The Real Goal',
      purpose: 'Understand the course\'s true objective: Self-Directed Learner',
      hasCheckpoint: true,
      contentGuidance: `
## CORE INSIGHT TO CONVEY:
The goal of CST349 is NOT just "professional skills" or "career prep" — it's to develop you as a **Self-Directed Learner (SDL)**.

## DISCOVERY FLOW:

**Step 1: Surface their assumptions**
Based on their initial response, probe: "What skills do you think will matter most in your first 5 years after graduation? What about 20 years from now?"

**Step 2: The SDL reveal - REQUIRED VISUAL**
After they respond, use this info-box:
\`\`\`dojo-visual
{
  "type": "info-box",
  "style": "reveal",
  "title": "The Real Goal",
  "content": "**Self-Directed Learner**\\n\\nThe goal isn't to teach you specific skills that might be obsolete in 5 years. It's to develop your ability to **identify what you need to learn** and **learn it effectively on your own**.\\n\\nIn a field that changes as fast as CS, the most valuable skill isn't what you know—it's how quickly you can learn what you don't."
}
\`\`\`

**Step 3: Make it concrete**
Ask: "Think of something you learned completely on your own—not for a class, not because someone assigned it. How did you know you needed to learn it? How did you go about it?"

**CHECKPOINT:** Ask them to explain why being a self-directed learner matters more than mastering specific technical skills in CS.
`,
      checkpointCriteria: `
Student should articulate:
1. Technology changes rapidly, so specific skills become outdated
2. The ability to learn independently is more durable than any specific knowledge
3. Self-directed learning means taking ownership of your own growth

Probe if shallow: "If two graduates have identical technical skills, but one can learn new things independently and one waits to be taught—who has the advantage? Why?"
`,
    },
    {
      phaseId: 2,
      title: 'The Key Capability',
      purpose: 'Understand Self-Directed Learning as a learnable skill',
      hasCheckpoint: true,
      contentGuidance: `
## CORE INSIGHT:
Self-Directed Learning (SDL) isn't a personality trait—it's a **capability that can be developed**.

## DISCOVERY FLOW:

**Step 1: Challenge the myth**
"Some people think you're either 'self-motivated' or you're not—like it's a fixed trait. What's your experience? Have you ever surprised yourself by learning something you didn't think you could?"

**Step 2: SDL as capability - REQUIRED VISUAL**
\`\`\`dojo-visual
{
  "type": "info-box",
  "style": "insight",
  "title": "Self-Directed Learning (SDL)",
  "content": "**SDL is a learnable capability, not a personality trait.**\\n\\nIt involves:\\n• **Recognizing** what you need to learn\\n• **Planning** how to learn it\\n• **Executing** on that plan\\n• **Evaluating** your progress\\n• **Adjusting** as needed\\n\\nLike any skill, it improves with deliberate practice."
}
\`\`\`

**Step 3: Self-assessment**
Present this choice:
\`\`\`dojo-visual
{
  "type": "selection-cards",
  "prompt": "Where do you feel strongest in SDL right now?",
  "options": [
    {"id": "recognize", "icon": "🔍", "title": "Recognizing gaps", "description": "I know what I need to learn"},
    {"id": "plan", "icon": "📋", "title": "Planning to learn", "description": "I know how to approach learning"},
    {"id": "execute", "icon": "⚡", "title": "Following through", "description": "I actually do the learning"},
    {"id": "evaluate", "icon": "📊", "title": "Evaluating progress", "description": "I know if I've learned it"},
    {"id": "unsure", "icon": "🤔", "title": "Not sure", "description": "I haven't thought about it this way"}
  ]
}
\`\`\`

Based on their selection, discuss that area and ask about areas they find challenging.

**CHECKPOINT:** "In your own words, what's the difference between being 'smart' and being a 'self-directed learner'?"
`,
      checkpointCriteria: `
Student should distinguish:
- Being smart = having knowledge/ability
- Being a self-directed learner = having the meta-skill to acquire new knowledge/ability independently

Look for understanding that SDL is about process, not innate talent.
`,
    },
    {
      phaseId: 3,
      title: 'Progressive Autonomy',
      purpose: 'Understand how the course builds SDL through practice',
      hasCheckpoint: true,
      contentGuidance: `
## CORE INSIGHT:
The course uses **Progressive Autonomy**—you start with high scaffolding and gradually take more ownership.

## DISCOVERY FLOW:

**Step 1: The scaffolding concept**
"Have you ever learned something where the instructor held your hand at first, then gradually let go? What did that feel like?"

**Step 2: Course structure - REQUIRED VISUAL**
\`\`\`dojo-visual
{
  "type": "comparison-table",
  "title": "Progressive Autonomy Through 4 Sprints",
  "leftHeader": "Sprint",
  "rightHeader": "Your Autonomy Level",
  "rows": [
    {"left": "Sprint 1", "right": "High scaffolding — clear guidance, frequent check-ins"},
    {"left": "Sprint 2", "right": "Moderate scaffolding — more choices, less hand-holding"},
    {"left": "Sprint 3", "right": "Low scaffolding — you drive, instructor supports"},
    {"left": "Sprint 4", "right": "Minimal scaffolding — you own your learning"}
  ]
}
\`\`\`

**Step 3: Why this matters**
"Notice how each sprint gives you more rope. Why do you think the course is designed this way instead of just telling you 'be self-directed' from day one?"

**Step 4: Their concerns**
\`\`\`dojo-visual
{
  "type": "selection-cards",
  "prompt": "Which transition feels most challenging to you?",
  "options": [
    {"id": "s1-s2", "icon": "🌱", "title": "Sprint 1 → 2", "description": "Going from clear guidance to making choices"},
    {"id": "s2-s3", "icon": "🌿", "title": "Sprint 2 → 3", "description": "Taking the driver's seat"},
    {"id": "s3-s4", "icon": "🌳", "title": "Sprint 3 → 4", "description": "Owning my learning fully"},
    {"id": "all", "icon": "💪", "title": "I'm ready for all of it", "description": "Bring it on"}
  ]
}
\`\`\`

Discuss their selection and how they might prepare for that transition.

**CHECKPOINT:** "Why can't the course just start at Sprint 4 autonomy? What would happen?"
`,
      checkpointCriteria: `
Student should recognize:
1. Skills need to be built progressively
2. Jumping to full autonomy too fast leads to floundering
3. The scaffolding is intentional—it's how SDL capability is developed
4. Each sprint prepares you for the next level of autonomy
`,
    },
    {
      phaseId: 4,
      title: 'How to Succeed',
      purpose: 'Concrete strategies for engaging with the course',
      hasCheckpoint: true,
      contentGuidance: `
## PRACTICAL GUIDANCE

**Step 1: The key insight**
"Now that you understand the design, here's the key to success: Each sprint is an opportunity to practice the level of autonomy you'll need in the next one. It's not just about completing tasks—it's about developing capability."

**Step 2: Success strategies - REQUIRED VISUAL**
\`\`\`dojo-visual
{
  "type": "info-box",
  "style": "summary",
  "title": "Success Strategies",
  "content": "**Sprint 1:** Use the scaffolding fully. Don't just do the minimum—understand WHY the structure exists.\\n\\n**Sprint 2:** Start experimenting. Make small choices beyond what's required. Notice what works.\\n\\n**Sprint 3:** Push yourself. When you're unsure, try to figure it out before asking. Reflect on your process.\\n\\n**Sprint 4:** Own it. Set your own goals. Seek feedback proactively. This is your dress rehearsal for professional life."
}
\`\`\`

**Step 3: Personal commitment**
"Which of these strategies feels most important for YOU to focus on? What's one thing you could do differently starting in Sprint 1?"

**Step 4: Questions**
"What questions do you have about the course now that you understand the underlying model?"

Answer any questions they have, relating answers back to the SDL framework.

**CHECKPOINT:** "What's one specific thing you'll do differently in this course now that you understand its design?"
`,
      checkpointCriteria: `
Student should commit to a specific, actionable behavior:
- Not just "I'll work harder" but something concrete
- Shows understanding that success comes from intentionally developing SDL, not just completing tasks
`,
    },
    {
      phaseId: 5,
      title: 'Your Commitment',
      purpose: 'Articulate personal investment and close',
      hasCheckpoint: false,
      contentGuidance: `
## CLOSING

**Step 1: Summary reflection**
"Let's bring it all together. You now understand that CST349 is designed to develop you as a Self-Directed Learner through Progressive Autonomy across four sprints."

**Step 2: Their mental model - REQUIRED VISUAL**
\`\`\`dojo-visual
{
  "type": "info-box",
  "style": "summary",
  "title": "CST349 Mental Model",
  "content": "**Goal:** Self-Directed Learner\\n\\n**Key Capability:** Self-Directed Learning (SDL)\\n\\n**Practice:** Progressive Autonomy\\n\\n**Structure:** 4 Sprints with decreasing scaffolding\\n\\n*The course isn't just teaching you content—it's developing your ability to learn anything.*"
}
\`\`\`

**Step 3: Final question**
"What does becoming a self-directed learner mean to you personally? Not just for this course, but for your career and life?"

Close warmly, encouraging them to return to this understanding when they feel challenged during the course.
`,
    },
  ],

  courseContent: {
    syllabus: 'CST349 CS Professional Seminar course syllabus',
    learningObjectives: [
      'Develop self-directed learning capabilities',
      'Build professional communication skills',
      'Practice progressive autonomy in learning',
      'Prepare for professional life in technology',
    ],
  },
};

// CST395 - AI-Native Solution Engineering
// Mental Model: Better Thinkers → SDL+IS+AB capabilities → Symbiotic Thinking → 4 Sprints (expanding stakeholder scope)
export const CST395_TOPIC: TopicConfig = {
  topicId: 'course-cst395-overview',
  title: 'CST395: AI-Native Solution Engineering',
  description: 'Understand the course structure, goals, and how to succeed',
  estimatedTime: '15-20 minutes',
  category: 'course',
  courseCode: 'CST395',
  enabled: true,
  icon: '🤖',

  // Only guided pathway for course overviews
  pathways: [
    {
      id: 'guided',
      title: 'Guided Journey',
      description: 'Understand the course through interactive exploration',
      icon: '🎯',
      estimatedTime: '15-20 min',
    },
  ],

  phases: [
    {
      phaseId: 0,
      title: 'Welcome',
      purpose: 'Orient to the course overview experience',
      hasCheckpoint: false,
      contentGuidance: `
Welcome the student warmly to the CST395 Course Overview experience.

Explain that this is an interactive exploration to help them deeply understand:
- What "AI-Native Solution Engineering" really means
- The mental model that shapes how the course is designed
- How to engage effectively to become a better thinker

**Start with curiosity:**
"When you hear 'AI-Native Solution Engineering,' what do you picture? What do you think makes solution engineering 'AI-native' versus traditional?"

Use their response to bridge into Phase 1.
`,
    },
    {
      phaseId: 1,
      title: 'The Real Goal',
      purpose: 'Understand the course\'s true objective: Better Thinkers',
      hasCheckpoint: true,
      contentGuidance: `
## CORE INSIGHT TO CONVEY:
The goal of CST395 is NOT just "build AI solutions" — it's to develop you as a **Better Thinker**.

## DISCOVERY FLOW:

**Step 1: Challenge assumptions**
Based on their response about AI-native engineering, probe: "If AI can write code, analyze data, and generate solutions—what's left for the human engineer to do? What value do YOU add?"

**Step 2: The Better Thinkers reveal - REQUIRED VISUAL**
\`\`\`dojo-visual
{
  "type": "info-box",
  "style": "reveal",
  "title": "The Real Goal",
  "content": "**Better Thinkers**\\n\\nThis course isn't about learning to use AI tools—it's about developing the thinking capabilities that make AI amplify YOUR value rather than replace it.\\n\\nAI can execute. Humans must think:\\n• What problem are we actually solving?\\n• Who are the stakeholders?\\n• What's the right approach?\\n• How do we know it's good enough?\\n\\nThe goal is to make you a better thinker—one who happens to have powerful AI capabilities at their disposal."
}
\`\`\`

**Step 3: Make it concrete**
"Think of a time when you had all the tools you needed but the real challenge was figuring out WHAT to do. What made that hard? What thinking skills did it require?"

**CHECKPOINT:** "In your own words, why does having access to AI make thinking skills MORE important, not less?"
`,
      checkpointCriteria: `
Student should articulate:
1. AI handles execution but needs human direction
2. The harder problems are about judgment, not just capability
3. Better thinking = better leverage of AI capabilities
4. Without good thinking, AI just makes you faster at the wrong things

Probe if shallow: "Two engineers have the same AI tools. One builds something users love. One builds something nobody wants. What's the difference?"
`,
    },
    {
      phaseId: 2,
      title: 'The Three Capabilities',
      purpose: 'Understand SDL + IS + AB as learnable capabilities',
      hasCheckpoint: true,
      contentGuidance: `
## CORE INSIGHT:
To be a better thinker, you need three interconnected capabilities: SDL, IS, and AB.

## DISCOVERY FLOW:

**Step 1: Build on what they know**
"You might already know about Self-Directed Learning. In this course, we add two more capabilities that make SDL more powerful."

**Step 2: The three capabilities - REQUIRED VISUAL**
\`\`\`dojo-visual
{
  "type": "comparison-table",
  "title": "Three Thinking Capabilities",
  "leftHeader": "Capability",
  "rightHeader": "What It Means",
  "rows": [
    {"left": "SDL (Self-Directed Learning)", "right": "Identify what you need to learn and learn it independently"},
    {"left": "IS (Information Synthesis)", "right": "Combine information from multiple sources into coherent understanding"},
    {"left": "AB (Audience-Based)", "right": "Shape your work based on who will use it and why"}
  ]
}
\`\`\`

**Step 3: How they connect**
"These three work together. SDL helps you acquire what you need to know. IS helps you make sense of it. AB ensures what you create actually serves someone. Without all three, something breaks."

**Step 4: Self-assessment**
\`\`\`dojo-visual
{
  "type": "selection-cards",
  "prompt": "Which capability do you want to develop most?",
  "options": [
    {"id": "sdl", "icon": "📚", "title": "Self-Directed Learning", "description": "Learning what I need without being told"},
    {"id": "is", "icon": "🧩", "title": "Information Synthesis", "description": "Making sense of complex, messy information"},
    {"id": "ab", "icon": "👥", "title": "Audience-Based", "description": "Creating work that truly serves users"},
    {"id": "all", "icon": "🎯", "title": "All three equally", "description": "I want to develop them together"}
  ]
}
\`\`\`

Discuss their choice and how the course develops that capability.

**CHECKPOINT:** "Pick one of the three capabilities. How would AI amplify that capability if you develop it? How would AI be limited if you don't?"
`,
      checkpointCriteria: `
Student should show understanding that:
1. Each capability enables better use of AI
2. AI can help execute but the human provides direction through these capabilities
3. Missing one capability creates blind spots that AI can't fill

Example good answer: "If I don't have AB, I might use AI to build something technically perfect that nobody wants. AI doesn't know my stakeholders—I have to."
`,
    },
    {
      phaseId: 3,
      title: 'Symbiotic Thinking',
      purpose: 'Understand the practice model: thinking WITH AI',
      hasCheckpoint: true,
      contentGuidance: `
## CORE INSIGHT:
The practice model is **Symbiotic Thinking**—not using AI as a tool, but thinking WITH it.

## DISCOVERY FLOW:

**Step 1: Challenge the tool mindset**
"Most people think of AI as a tool—you use it to do things. But what if AI could be more like a thinking partner? What would that change?"

**Step 2: Symbiotic Thinking - REQUIRED VISUAL**
\`\`\`dojo-visual
{
  "type": "info-box",
  "style": "insight",
  "title": "Symbiotic Thinking",
  "content": "**Thinking WITH AI, not just using it**\\n\\nIn a symbiotic relationship, both parties contribute unique value:\\n\\n**You bring:**\\n• Context (what matters in this situation)\\n• Choices (judgment about what to do)\\n• Confirmation (knowing when it's right)\\n\\n**AI brings:**\\n• Broad knowledge\\n• Rapid execution\\n• Pattern recognition\\n• Tireless iteration\\n\\nTogether, you can think better than either alone."
}
\`\`\`

**Step 3: The 3Cs connection**
"The three things you bring—Context, Choices, Confirmation—these are called the 3Cs. They're the human contribution that makes AI valuable. Without them, AI just generates noise."

**Step 4: Personal reflection**
"Think of a recent time you used AI (ChatGPT, Copilot, anything). Did you think WITH it, or just ask it to do something FOR you? What's the difference in the outcome?"

**CHECKPOINT:** "What's the difference between 'using AI' and 'thinking with AI'? Give an example of each."
`,
      checkpointCriteria: `
Student should articulate:
- Using AI = delegation, AI does the work
- Thinking with AI = collaboration, both contribute to the outcome
- The human's contribution (3Cs) determines the quality of the result
- Symbiotic thinking requires developing your own capabilities, not just relying on AI
`,
    },
    {
      phaseId: 4,
      title: 'Expanding Stakeholder Scope',
      purpose: 'Understand how the course progresses through 4 sprints',
      hasCheckpoint: true,
      contentGuidance: `
## CORE INSIGHT:
The course uses **Expanding Stakeholder Scope**—each sprint adds more complex stakeholder relationships.

## DISCOVERY FLOW:

**Step 1: Why stakeholders matter**
"The 'AB' in our capabilities stands for Audience-Based. But in real engineering, your 'audience' isn't just users—it's everyone affected by what you build. The course develops this understanding progressively."

**Step 2: Sprint structure - REQUIRED VISUAL**
\`\`\`dojo-visual
{
  "type": "comparison-table",
  "title": "Expanding Stakeholder Scope Through 4 Sprints",
  "leftHeader": "Sprint",
  "rightHeader": "Stakeholder Focus",
  "rows": [
    {"left": "Sprint 1", "right": "Self — Build something that helps YOU learn and think better"},
    {"left": "Sprint 2", "right": "Peer — Build something useful for your classmates"},
    {"left": "Sprint 3", "right": "External — Build for real users outside the class"},
    {"left": "Sprint 4", "right": "Complex — Multiple stakeholders with different needs"}
  ]
}
\`\`\`

**Step 3: Why this progression**
"Notice how each sprint adds complexity. You start by being your own user—you understand that stakeholder perfectly. Then you have to understand others, first similar to you, then increasingly different."

**Step 4: Anticipate challenges**
\`\`\`dojo-visual
{
  "type": "selection-cards",
  "prompt": "Which stakeholder transition seems most challenging?",
  "options": [
    {"id": "s1-s2", "icon": "👤→👥", "title": "Self → Peer", "description": "Building for others like me"},
    {"id": "s2-s3", "icon": "👥→🌍", "title": "Peer → External", "description": "Building for strangers"},
    {"id": "s3-s4", "icon": "🌍→🎯", "title": "External → Complex", "description": "Balancing competing needs"},
    {"id": "excited", "icon": "🚀", "title": "Excited for all", "description": "Each sounds valuable"}
  ]
}
\`\`\`

Discuss their selection and how they might approach that challenge.

**CHECKPOINT:** "Why does the course start with building for yourself rather than jumping straight to external users?"
`,
      checkpointCriteria: `
Student should recognize:
1. Building for yourself lets you learn the process without stakeholder complexity
2. Understanding your own needs deeply is practice for understanding others
3. Each sprint builds skills needed for the next level of stakeholder complexity
4. The progression is intentional, not arbitrary
`,
    },
    {
      phaseId: 5,
      title: 'How to Succeed',
      purpose: 'Concrete strategies for engaging with the course',
      hasCheckpoint: true,
      contentGuidance: `
## PRACTICAL GUIDANCE

**Step 1: The key insight**
"Success in this course comes from treating each sprint as practice for developing your thinking capabilities—SDL, IS, and AB—not just completing projects."

**Step 2: Success strategies - REQUIRED VISUAL**
\`\`\`dojo-visual
{
  "type": "info-box",
  "style": "summary",
  "title": "Success Strategies",
  "content": "**Sprint 1 (Self):** Really dig into your own needs. What would make YOU a better thinker? Use this to practice SDL.\\n\\n**Sprint 2 (Peer):** Practice IS by synthesizing feedback from classmates. What patterns emerge?\\n\\n**Sprint 3 (External):** This is where AB becomes critical. Who are your real users? What do THEY need?\\n\\n**Sprint 4 (Complex):** Integrate all three capabilities. Balance competing stakeholder needs with clear thinking."
}
\`\`\`

**Step 3: The symbiotic thinking practice**
"Throughout all sprints, practice thinking WITH AI, not just using it. Every project is an opportunity to develop your 3Cs: What Context do you bring? What Choices are you making? How do you Confirm the result is good?"

**Step 4: Personal commitment**
"What's one specific way you'll approach this course differently now that you understand the design?"

**CHECKPOINT:** "What's the most important thing you'll do to develop as a 'better thinker' in this course?"
`,
      checkpointCriteria: `
Student should commit to something specific that shows they understand:
- The course is about developing thinking capabilities
- Success means practicing SDL, IS, AB deliberately
- Symbiotic thinking is a skill to develop, not just a technique to use
`,
    },
    {
      phaseId: 6,
      title: 'Your Commitment',
      purpose: 'Articulate personal investment and close',
      hasCheckpoint: false,
      contentGuidance: `
## CLOSING

**Step 1: Summary reflection**
"Let's bring it all together. You now understand that CST395 is designed to make you a Better Thinker through developing three capabilities—SDL, IS, and AB—using Symbiotic Thinking practice across four sprints with expanding stakeholder scope."

**Step 2: The complete mental model - REQUIRED VISUAL**
\`\`\`dojo-visual
{
  "type": "info-box",
  "style": "summary",
  "title": "CST395 Mental Model",
  "content": "**Goal:** Better Thinkers\\n\\n**Key Capabilities:**\\n• SDL (Self-Directed Learning)\\n• IS (Information Synthesis)\\n• AB (Audience-Based)\\n\\n**Practice:** Symbiotic Thinking (thinking WITH AI)\\n\\n**Structure:** 4 Sprints with expanding stakeholder scope\\n\\n*The course isn't just teaching you to build AI solutions—it's developing how you think.*"
}
\`\`\`

**Step 3: Final question**
"What does becoming a 'better thinker' mean to you personally? In a world where AI can do more and more, what kind of thinker do you want to become?"

Close warmly, encouraging them to use the Symbiotic Thinking Dojo throughout the course to practice and develop their capabilities.
`,
    },
  ],

  courseContent: {
    syllabus: 'CST395 AI-Native Solution Engineering course syllabus',
    learningObjectives: [
      'Develop as a better thinker who leverages AI effectively',
      'Build Self-Directed Learning (SDL) capabilities',
      'Practice Information Synthesis (IS) from multiple sources',
      'Apply Audience-Based (AB) thinking to solution design',
      'Master Symbiotic Thinking with AI',
    ],
  },
};

// Placeholder for general subjects
export const GENERAL_SUBJECTS_PLACEHOLDER: TopicConfig = {
  topicId: 'general-subjects',
  title: 'General Subjects',
  description: 'Coming soon...',
  estimatedTime: '--',
  category: 'general',
  enabled: false,
  icon: '📖',
  pathways: [],
  phases: [],
};
