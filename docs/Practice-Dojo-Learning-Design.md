# Practice Dojo Learning Design Principles

## The North Star

> Every Practice Dojo session is practice in **thinking well with AI**. The topic is the vehicle; symbiotic thinking is the skill being developed.

A student finishing any Practice Dojo should have:
- **Felt** the difference their judgment makes
- **Practiced** the 3Cs (Context, Choices, Confirmation)
- **Noticed** their Creating vs Consuming balance
- **Connected** this experience to their next real challenge

---

## The Six Essential Principles

### 1. Anchor in THEIR Context

Start with something the student uniquely cares about or knows.

**Why:** Without personal stakes, they're just going through motions.

**Do:** "What's a problem YOU'RE facing?" / "What do YOU already know about this?"

**Don't:** "Imagine you're a manager..." (generic scenarios)

---

### 2. Require Judgment BEFORE AI Input

They predict, choose, or commit before seeing what AI would do.

**Why:** Prevents passive consumption; creates ownership of their thinking.

**Do:** "Before I help, what's YOUR instinct?" / "What do you think will happen?"

**Don't:** Present information first, then ask if they understand.

---

### 3. Create Visible Contrast

Show the difference between "with their input" and "without."

**Why:** Makes their contribution undeniable; builds confidence in their judgment.

**Do:** Show generic version → then personalized version → ask "What changed?"

**Don't:** Just tell them their input matters; let them SEE it.

---

### 4. Name After Doing

They experience the concept before you label it.

**Why:** Discovery is sticky; being told is forgettable.

**Do:** Let them struggle → reflect on what they did → "That's called the 3Cs"

**Don't:** "This is called the 3Cs. Now let's practice it."

---

### 5. Transfer Out

Connect this practice to their next real situation.

**Why:** Learning without transfer is entertainment.

**Do:** "What will you do differently next time?" / "Where else could you apply this?"

**Don't:** End with "Good job, you understand X."

---

### 6. Brevity as Engagement

Long responses are lectures. Lectures trigger Consuming mode.

**Why:** The student should talk more than the AI. Short responses keep them active.

**Rules:**
- One question per message
- One insight per message
- Under 50 words for text (visuals don't count toward this)
- If you have more to say, use a collapsible info-box
- If AI response > student input, something is wrong

---

## The Symbiotic Thinking Thread

Every topic must weave in these elements, regardless of subject matter:

### Context (the C they bring)
- What's YOUR situation?
- What do YOU already know about this?
- What matters to YOU about getting this right?

### Choices (the C they make)
- Before I help, what's YOUR instinct?
- What approach feels right to YOU?
- Which tradeoff fits YOUR values/goals?

### Confirmation (the C they verify)
- Does this match what YOU intended?
- How do YOU know it's good enough?
- What would YOU change?

### Creating vs Consuming Awareness
- Notice: right now, are you receiving or contributing?
- What did YOU add that I couldn't have known?
- What happens if you just accept without engaging?

---

## Anti-Patterns (What to Avoid)

| Anti-Pattern | Why It Fails | Do Instead |
|--------------|--------------|------------|
| Teaching AT them | "Here's how X works..." puts them in Consuming mode | Ask what they already know or think first |
| Generic scenarios | "Imagine you're a manager..." has no personal stakes | Use THEIR situation, goal, or problem |
| Choices without consequences | "Pick A, B, or C" where all paths converge | Their choice should visibly change what happens |
| Comprehension checks | "Do you understand?" gets false positives | Have them apply, predict, or create instead |
| Naming before experiencing | "This is called the 3Cs..." before they've done it | Let them struggle, then name what they did |
| Ending without transfer | Session ends with "Good job!" | End with "What will you do differently now?" |
| Long responses | Walls of text trigger passive reading | One move per message; keep it short |

---

## Phase Design Template

For each phase in a Practice Dojo topic, define:

```
PURPOSE
What symbiotic thinking skill does this phase practice?
(One sentence)

ANCHOR
How does this connect to something the student cares about?
(Their context, their problem, their goal)

CHALLENGE
What judgment/prediction/choice do they make BEFORE getting input?
(They commit first, then see AI perspective)

CONTRAST
How do they see the difference their contribution makes?
(Before/after, with/without their input)

NAMING
What framework/concept gets named AFTER they've experienced it?
(Discovery before labeling)

BRIDGE
How does this connect to the next phase or to their real life?
(Transfer)
```

---

## Evaluation Checklist

For any Practice Dojo topic, ask:

| Question | Check |
|----------|-------|
| Does the student bring unique Context that changes outcomes? | [ ] |
| Are there real Choices where their judgment matters? | [ ] |
| Do they Confirm against their own intent (not just "is it correct")? | [ ] |
| Can they feel the difference between engaged vs passive participation? | [ ] |
| Are frameworks named AFTER being experienced? | [ ] |
| Does it end with transfer to their next challenge? | [ ] |
| Would two different students have meaningfully different experiences? | [ ] |
| Are AI responses short (under 50 words typical)? | [ ] |
| Does the student talk more than the AI? | [ ] |

---

## Model-Specific Considerations

### Frontier Models (Gemini Pro, GPT-4, Claude)
- Can infer intent from subtle cues
- Handle long context well
- Maintain tone consistency

### Llama 3.3 70B (via Groq)
- Needs explicit, direct instructions
- Benefits from constraints stated as rules
- Key behaviors should be repeated at start AND end of prompts
- Simpler prompt structure works better
- Add explicit word limits: "Respond in under 50 words"

---

## Response Format Guidelines

| Response Type | Max Length | Pattern |
|---------------|------------|---------|
| Question | 1-2 sentences | Ask one thing. Wait. |
| Reveal/Insight | 2-3 sentences + visual | Short setup. Visual does heavy lifting. |
| Feedback | 1 sentence + 1 follow-up | "You noticed X. What about Y?" |
| Transition | 1 sentence | Bridge to next phase. |

**The "One Move" Rule:** Each response makes ONE move—ask, reveal, or bridge. Never all three.
