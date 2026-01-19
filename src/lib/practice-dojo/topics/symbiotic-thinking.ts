import { TopicConfig } from '../types';

export const SYMBIOTIC_THINKING_TOPIC: TopicConfig = {
  topicId: 'symbiotic-thinking',
  title: 'Symbiotic Thinking Foundations',
  description: 'Learn to think WITH AI, not just use it',
  estimatedTime: '30-45 minutes',
  category: 'foundations',
  enabled: true,
  icon: '🥋',

  pathways: [
    {
      id: 'guided',
      title: 'Guided Journey',
      description: 'Full experience with all phases',
      icon: '🎯',
      estimatedTime: '30-45 min',
    },
    {
      id: 'quick',
      title: 'Quick Overview',
      description: 'Key concepts, shorter experience',
      icon: '⚡',
      estimatedTime: '15-20 min',
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
    {
      phaseId: 0,
      title: 'Welcome & Pathway',
      purpose: 'Orient and select engagement style',
      hasCheckpoint: false,
      contentGuidance: `
Welcome the student warmly to Symbiotic Thinking Foundations. Explain that this experience will help them develop a framework for thinking WITH AI, not just using it.

Present the pathway selection using a dojo-visual selection-cards component:
- Guided Journey (🎯): Full experience, 30-45 min
- Quick Overview (⚡): Key concepts, 15-20 min
- Test My Understanding (🔍): Skip what I know, varies

After they select, acknowledge their choice and transition to Phase 1.
`,
    },
    {
      phaseId: 1,
      title: 'The Direct Report',
      purpose: 'Understand WHY (AI as intelligence resources)',
      hasCheckpoint: true,
      contentGuidance: `
Present a thought experiment:

"Imagine this: You just landed your dream job. On your first day, your boss comes to your desk with exciting news: 'I'm assigning you a direct report. They're an expert in a specific area, diligent, creative, and great at remembering things. They're very capable, but it will be up to you to figure out how to best utilize their skills. With this additional resource, I'll naturally be expecting more value from your work.'"

Ask for their reaction: What questions would you want to ask? What would you need to figure out?

Guide their thinking with follow-ups based on their response.

Then escalate: "Just as you're getting the hang of this, your boss returns: 'Actually, you now have FIVE direct reports! Each is extremely skilled in different areas—one brilliant at research, another at writing, another at analysis, another at design, another at problem-solving. Now that you have such a capable team, we expect a lot more from you!'"

Ask: With five instead of one, what changes? How do you coordinate when they don't talk to each other—YOU are the connection point?

Then REVEAL using a dojo-visual info-box with style "reveal":
- Your direct reports are AI systems
- They can solve International Math Olympiad problems
- Write functional code in seconds
- Analyze thousands of documents instantly
- Generate professional-quality writing
- Trained on essentially all public human knowledge
- Never tired, never forget, available 24/7
- Getting dramatically better every few months

Post-reveal reflection: Look back at what you said about managing your direct reports. What changes now that you know they're AI? What stays the same?

CHECKPOINT: Ask them to explain in their own words why having access to AI makes 'delegation skills' important for everyone, not just managers.

Evaluation: Look for connection between AI capabilities and need for human judgment/direction. They should articulate that AI can execute but humans must provide direction, context, judgment.
`,
      checkpointCriteria: `
Student should demonstrate understanding that:
1. AI capabilities are substantial (can do many tasks well)
2. But AI needs human direction/management
3. The human provides judgment, context, priorities that AI cannot determine on its own
4. This makes "delegation skills" universal - everyone with AI access needs them

If response is shallow, probe: "You mentioned [X]. Can you say more about what the human provides that the AI can't provide for itself?"
`,
    },
    {
      phaseId: 2,
      title: 'The Value Question',
      purpose: 'Bridge: why not just accept AI output',
      hasCheckpoint: true,
      contentGuidance: `
Build on Phase 1. Ask: "So you're a manager of AI now. Here's a question: If your direct report hands you something, do you just pass it along to your boss? Or do you review it, shape it, make sure it represents YOUR judgment?"

Make it concrete: "Imagine you ask AI to write an email to an important client. AI produces something perfectly grammatical, professional, covers all the points. But... is it YOUR email? Would the client be receiving a message from you, or from an AI that happens to have your name on it?"

Present a comparison using dojo-visual comparison-table:
Left column: "Pass-through" - Ask AI → Accept output → Submit. "AI did this". Replaceable.
Right column: "Value-added" - Ask AI → Review → Shape → Verify → Make it yours. "I did this with AI". Creates unique value.

Ask: Which manager creates more value? Which one is replaceable?

CHECKPOINT: "When does AI output become YOUR output? What has to happen in between?"

Then transition: "Let's experience this difference directly. We're going to try something where it MATTERS that the output is yours—where you'd actually feel the difference."
`,
      checkpointCriteria: `
Student should articulate that some form of human input/judgment transforms AI output into their own work:
- Review and verification
- Shaping/editing to match intent
- Injecting personal knowledge/context
- Making decisions about what to keep/change

If insufficient, probe: "Imagine two people submit the same AI-generated report. One just submitted it. One revised it extensively. Are they creating the same value?"
`,
    },
    {
      phaseId: 3,
      title: 'Something You Care About',
      purpose: 'FEEL the difference through hands-on experience',
      hasCheckpoint: true,
      contentGuidance: `
Present scenario selection using dojo-visual selection-cards:
- 💌 A message to someone important (birthday note, thank you, apology)
- 📝 Something creative (poem, song idea, short story concept)
- 🎯 A personal goal or plan (career decision, life plan, resolution)
- 💼 Professional communication that represents you (cover letter, important email, pitch)
- ✨ Something else (I'll describe it)

After selection, get specifics: "Tell me more about the specific situation. Who is this for? What's the context? What do you want to achieve or convey?"

First attempt (generic AI): Generate a competent but generic, impersonal version of what they asked for. Then ask: "Would you send this? What's missing?"

Guided iteration: Ask probing questions:
- What specific memories or inside jokes would make this feel like it's from YOU?
- What tone matches your actual relationship?
- What do you want them to FEEL when they read this?

Guide through 2-3 iterations with specific questions based on their responses.

Comparison: "Look at where we started versus where we ended. What's different? What did YOU add that I couldn't have known or decided on my own?"

CHECKPOINT: This is experiential—evaluate whether they:
1. Engaged genuinely (not just going through motions)
2. Can articulate what changed between versions
3. Feel the difference (not just intellectually understand it)
`,
      checkpointCriteria: `
This is an experiential checkpoint. Evaluate:
1. Did they provide meaningful personal context (specific details, relationships, emotions)?
2. Can they identify what changed between the generic and personalized versions?
3. Do they recognize that THEY provided what made it better?

The goal is felt understanding, not just intellectual agreement.
`,
    },
    {
      phaseId: 4,
      title: 'The 3Cs Discovery',
      purpose: 'NAME what they did: Context, Choices, Confirmation',
      hasCheckpoint: true,
      contentGuidance: `
Surface the pattern from Phase 3: "Looking back at what you just did—what made your final version better than the generic one? What specifically did YOU contribute?"

Guide toward each C based on their responses:

For CONTEXT: "You mentioned [specific details about their situation]. That's information I couldn't have known. What else did you provide that I didn't have?"

For CHOICES: "You decided the tone should be [their choice]. That was a choice—I could have gone either direction. What other decisions did you make?"

For CONFIRMATION: "How did you know when it was right? What told you 'yes, this sounds like me' versus 'no, this still feels off'?"

After they've articulated the concepts, NAME the framework using dojo-visual framework-diagram with diagram type "3cs":

"What you just did has a name. The three things you contributed are called the 3Cs:
- CONTEXT: What you bring (details, memories, situation)
- CHOICES: What you decide (tone, approach, direction)
- CONFIRMATION: How you verify (does it match intent?)"

Show the iterative loop.

CHECKPOINT: "Go back to your [their scenario]. Point to a specific moment where you applied each C:
- What was your Context? (What did you provide that I didn't have?)
- What Choice did you make? (What did you decide rather than leaving to me?)
- How did you Confirm? (How did you know it was right?)"
`,
      checkpointCriteria: `
Student should identify concrete examples from their own Phase 3 work:
- Context: Specific details they provided (names, relationships, memories, situation)
- Choice: A decision they made (tone, focus, what to include/exclude)
- Confirmation: How they evaluated it (felt right, matched their voice, would actually send it)

Not looking for perfect definitions—looking for demonstrated application to their own work.
`,
    },
    {
      phaseId: 5,
      title: 'Connecting to UMPIRE',
      purpose: 'PROCESS scaffold',
      hasCheckpoint: true,
      contentGuidance: `
Introduce the idea: "The 3Cs are powerful, but they fit into a larger process. When you're tackling any problem—with or without AI—there's a structure that helps."

Present UMPIRE using dojo-visual framework-diagram with diagram type "umpire":
"It's called UMPIRE: Understand, Map, Plan, Implement, Review, Evaluate"

Show the mapping using dojo-visual framework-diagram with diagram type "3cs-umpire-mapping":
- CONTEXT → UNDERSTAND + MAP (Define the problem, connect to what you know)
- CHOICES → PLAN + IMPLEMENT (Decide approach, execute it)
- CONFIRMATION → REVIEW + EVALUATE (Check results, align with goals, loop back if needed)

Key insight: "Notice that UMPIRE loops back. When you Review and it's not right, you Plan again. When you Evaluate and realize you misunderstood the problem, you go back to Understand. This is how real thinking works—it's iterative, not linear."

CHECKPOINT: "Think of a time you were stuck on a problem—school, work, personal. Where in UMPIRE did you get stuck? Looking back, what would it have looked like to loop back earlier?"
`,
      checkpointCriteria: `
Student should:
1. Apply UMPIRE to a real situation from their experience
2. Identify where they got stuck (which phase)
3. Recognize the iterative nature—that looping back is part of the process

Not looking for perfect analysis—looking for genuine application and understanding of iteration.
`,
    },
    {
      phaseId: 6,
      title: 'The Personal Stack',
      purpose: 'INTEGRATE Mindset, Metacognition, Motivation',
      hasCheckpoint: true,
      contentGuidance: `
Connect the pieces:

MINDSET (Creating vs Consuming):
"Remember the first version of your [their scenario] versus the final one? That's the spectrum from Consuming to Creating. Pure Consuming: Accept AI output passively. Creating: Infuse it with your Context, Choices, and Confirmation. The goal isn't to never consume—it's to infuse consuming with the habits of creating."

METACOGNITION (3Cs + UMPIRE):
"The techniques you learned—3Cs and UMPIRE—these are tools for thinking about your thinking. That's what metacognition means: awareness and control of your own thought process."

MOTIVATION (DIKW):
"But why bother? Why not just accept AI output and move on? Because there's a difference between getting answers and building knowledge."

Present DIKW using dojo-visual framework-diagram with diagram type "dikw", relating to their example:
- Data: "Write me a birthday message" (just getting an answer)
- Information: "Show me different styles of messages" (organized options)
- Knowledge: "What makes a message feel personal?" (understanding principles)
- Wisdom: "What would MY partner value most hearing from me?" (judgment for this specific situation)

Present the Personal Stack using dojo-visual framework-diagram with diagram type "personal-stack":
- MOTIVATION (The WHY): Climbing from Data → Wisdom. Why bother creating when consuming is easier?
- METACOGNITION (The HOW): 3Cs + UMPIRE. The techniques that make creating possible.
- MINDSET (The WHAT): Creating vs Consuming. The foundation.

"Each layer builds on the one below. All three are needed—like a three-legged stool."

CHECKPOINT: "In your own words, explain how the three layers work together. Why do you need all three? What happens if one is missing?"
`,
      checkpointCriteria: `
Student should articulate the integration:
- Mindset without technique is just intention
- Technique without motivation leads to going through the motions
- Motivation without mindset means you don't know what you're trying to do
- All three work together

Examples of good responses:
- Connecting each layer to the others
- Identifying what breaks without each layer
- Using their own examples to illustrate
`,
    },
    {
      phaseId: 7,
      title: 'Ready for the Dojo',
      purpose: 'TRANSITION to open Dojo',
      hasCheckpoint: false,
      contentGuidance: `
Summarize what they've built:
- You understand that AI makes you a manager of intelligence resources
- You've experienced the difference between pass-through and value-added work
- You know the 3Cs: Context, Choices, Confirmation
- You have UMPIRE as a process for structured thinking
- You understand the Personal Stack: Mindset, Metacognition, Motivation
- You can see learning as climbing from Data to Wisdom

Self-assessment: "Which of these feels solid? Which do you want to practice more?"

Preview Dojo modes using dojo-visual framework-diagram with diagram type "dojo-modes":
- Learn Mode: Safe exploration. Build understanding. Mistakes are expected and valuable.
- Learn + Solve Mode: Apply learning to defined problems. Real but bounded stakes.
- Learn + Solve + Build Mode: Create real value for real stakeholders. High stakes. Quality matters.

Remind about @reflector for generating session summaries.

Transition: "You're ready. What challenge do you want to bring to the Dojo?"

If they provide something → transition to Open Dojo mode with their challenge.
If they're not ready → offer to continue practicing or end session.
`,
    },
  ],
};
