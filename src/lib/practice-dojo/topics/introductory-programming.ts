import { TopicConfig } from '../types';

// Introductory Programming - Mental Models for Programming Fundamentals
// Mental Model: Deeper Understanding → Core Concepts → Language-Agnostic Thinking → Problem-Solving Transfer
export const INTRODUCTORY_PROGRAMMING_TOPIC: TopicConfig = {
  topicId: 'intro-programming',
  title: 'Introductory Programming',
  description: 'Explore core programming mental models through interactive challenges',
  estimatedTime: '25-40 minutes',
  category: 'general',
  enabled: true,
  icon: '💻',

  pathways: [
    {
      id: 'guided',
      title: 'Guided Exploration',
      description: 'Interactive journey through programming mental models',
      icon: '🧭',
      estimatedTime: '30-40 min',
    },
    {
      id: 'quick',
      title: 'Quick Assessment',
      description: 'Test your understanding of core concepts',
      icon: '⚡',
      estimatedTime: '15-20 min',
    },
    {
      id: 'test',
      title: 'Challenge Mode',
      description: 'Prove your mastery with code prediction challenges',
      icon: '🏆',
      estimatedTime: '20-25 min',
    },
  ],

  phases: [
    {
      phaseId: 0,
      title: 'Welcome & Language Selection',
      purpose: 'Orient the student and select their preferred programming language',
      hasCheckpoint: false,
      contentGuidance: `
Welcome the student warmly to the Introductory Programming exploration.

Explain that this experience is about understanding the **mental models** that make programming click—not just syntax memorization. These concepts transfer across ALL programming languages.

**IMPORTANT - Language Selection - REQUIRED VISUAL:**
\`\`\`dojo-visual
{
  "type": "selection-cards",
  "prompt": "Which programming language would you like to use for examples?",
  "options": [
    {"id": "python", "icon": "🐍", "title": "Python", "description": "Beginner-friendly, clear syntax"},
    {"id": "javascript", "icon": "🌐", "title": "JavaScript", "description": "Web development, interactive"},
    {"id": "java", "icon": "☕", "title": "Java", "description": "Object-oriented, industry standard"},
    {"id": "cpp", "icon": "⚙️", "title": "C/C++", "description": "Systems programming, performance"}
  ]
}
\`\`\`

**CRITICAL:** Remember their language choice and use it for ALL code examples throughout the session.

After they select, acknowledge their choice and explain:
"Great choice! While we'll use [language] for examples, remember: the mental models we explore work in ANY language. A variable is a variable whether it's Python or C++. Understanding the 'why' behind code matters more than memorizing the 'how'."

**Opening Question:**
"Before we dive in, I'm curious: What's something about programming that still feels a bit mysterious to you? Something you can do but aren't sure you fully understand?"

Use their response to gauge their level and personalize the journey.
`,
    },
    {
      phaseId: 1,
      title: 'Variables: The Memory Model',
      purpose: 'Build deep understanding of variables as named memory locations',
      hasCheckpoint: true,
      contentGuidance: `
## CORE MENTAL MODEL: Variables as Labeled Boxes

**Step 1: Surface their current model**
"When you create a variable like \`x = 5\`, what do you imagine is happening inside the computer? Paint me a picture."

Listen carefully—common misconceptions include:
- Thinking variables ARE values (rather than HOLD values)
- Confusion about assignment vs. equality
- Not understanding that variables can change

**Step 2: The box metaphor - REQUIRED VISUAL**
\`\`\`dojo-visual
{
  "type": "info-box",
  "style": "insight",
  "title": "Variables: Labeled Boxes in Memory",
  "content": "Think of computer memory as a wall of boxes (storage locations).\\n\\n**Creating a variable does TWO things:**\\n1. Picks an empty box\\n2. Puts a label (the variable name) on it\\n\\n**Assignment** puts a value IN the box\\n**Reading** looks at what's IN the box\\n\\nThe box can only hold ONE value at a time. Put something new in? The old value is gone."
}
\`\`\`

**Step 3: Prediction Challenge - REQUIRED INTERACTIVE**
Present code in their chosen language and ask them to predict:

For Python:
\`\`\`
x = 10
y = x
x = 20
print(y)
\`\`\`

For JavaScript:
\`\`\`
let x = 10;
let y = x;
x = 20;
console.log(y);
\`\`\`

For Java:
\`\`\`
int x = 10;
int y = x;
x = 20;
System.out.println(y);
\`\`\`

For C++:
\`\`\`
int x = 10;
int y = x;
x = 20;
cout << y;
\`\`\`

\`\`\`dojo-visual
{
  "type": "selection-cards",
  "prompt": "What will this code output?",
  "options": [
    {"id": "10", "icon": "1️⃣", "title": "10", "description": "y keeps its original value"},
    {"id": "20", "icon": "2️⃣", "title": "20", "description": "y changes when x changes"},
    {"id": "error", "icon": "❌", "title": "Error", "description": "Something is wrong with the code"},
    {"id": "unsure", "icon": "🤔", "title": "Not sure", "description": "I need to think about this"}
  ]
}
\`\`\`

**Correct answer is 10.** Explain using the box metaphor:
- Line 1: Box labeled 'x' gets value 10
- Line 2: Box labeled 'y' gets a COPY of what's in x (which is 10)
- Line 3: Box 'x' now gets 20, but 'y' still has its own copy of 10

If they got it wrong, don't make them feel bad. Say: "This trips up MANY programmers! The key insight is that y = x COPIES the value, it doesn't create a link between the boxes."

**CHECKPOINT:** "In your own words, explain why changing x after y = x doesn't change y."
`,
      checkpointCriteria: `
Student should articulate:
1. Variables are storage locations (boxes) that hold values
2. Assignment copies the value, not creates a reference (for primitives)
3. Each variable has its own independent storage
4. Changing one variable doesn't affect others that received its value earlier

Probe if unclear: "If I label two boxes 'x' and 'y', and put the number 10 in both, what happens to y's box when I empty x and put 20 in it?"
`,
    },
    {
      phaseId: 2,
      title: 'Sequential Execution',
      purpose: 'Understand that code executes one line at a time, in order',
      hasCheckpoint: true,
      contentGuidance: `
## CORE MENTAL MODEL: The Instruction Pointer

**Step 1: Introduce the concept**
"Computers are incredibly fast but also incredibly literal. They execute your code one instruction at a time, in order—like following a recipe step by step. Let's see if you can think like the computer."

**Step 2: Code tracing challenge - REQUIRED INTERACTIVE**
Present this sequence and ask them to trace through:

For Python:
\`\`\`
a = 5
b = 3
a = a + b
b = a - b
a = a - b
print(a, b)
\`\`\`

\`\`\`dojo-visual
{
  "type": "selection-cards",
  "prompt": "After running this code, what are the values of a and b?",
  "options": [
    {"id": "5-3", "icon": "🔄", "title": "a=5, b=3", "description": "Same as the start"},
    {"id": "3-5", "icon": "↔️", "title": "a=3, b=5", "description": "Values are swapped"},
    {"id": "8-5", "icon": "➕", "title": "a=8, b=5", "description": "a is the sum"},
    {"id": "8-3", "icon": "📊", "title": "a=8, b=3", "description": "Only a changes"}
  ]
}
\`\`\`

**Correct answer is a=3, b=5 (swapped).** Walk through line by line:
- Start: a=5, b=3
- a = a + b → a=8, b=3
- b = a - b → a=8, b=5
- a = a - b → a=3, b=5

"This is actually a classic algorithm to swap two values without a temporary variable! Did you recognize it?"

**Step 3: Order matters challenge**
\`\`\`dojo-visual
{
  "type": "comparison-table",
  "title": "Does Order Matter?",
  "leftHeader": "Version A",
  "rightHeader": "Version B",
  "rows": [
    {"left": "x = 10", "right": "x = 10"},
    {"left": "y = x * 2", "right": "x = x + 5"},
    {"left": "x = x + 5", "right": "y = x * 2"}
  ],
  "question": "Will y have the same value in both versions?"
}
\`\`\`

Ask them to predict whether y will be the same. (Answer: No! Version A: y=20, Version B: y=30)

**Step 4: The key insight - REQUIRED VISUAL**
\`\`\`dojo-visual
{
  "type": "info-box",
  "style": "insight",
  "title": "The Instruction Pointer",
  "content": "Imagine a finger pointing at your code, moving down line by line.\\n\\n**At each line:**\\n1. Read the instruction\\n2. Execute it completely\\n3. Move to the next line\\n\\n**Key insight:** Each line sees the world as it exists RIGHT NOW—after all previous lines have run. The order of your code IS the order things happen."
}
\`\`\`

**CHECKPOINT:** "If I rearrange the lines of a program, will it always produce the same result? Why or why not?"
`,
      checkpointCriteria: `
Student should understand:
1. Code executes sequentially, one line at a time
2. Each line sees the current state of all variables
3. Reordering lines can change results because the state changes
4. They can trace through code by tracking variable values at each step

Probe if shallow: "If line 5 uses a variable that line 6 modifies, what value does line 5 see?"
`,
    },
    {
      phaseId: 3,
      title: 'Control Flow: Making Decisions',
      purpose: 'Understand conditionals as decision points in code',
      hasCheckpoint: true,
      contentGuidance: `
## CORE MENTAL MODEL: The Fork in the Road

**Step 1: Bridge from sequential**
"So far, code has been a straight line—do this, then this, then this. But real programs need to make decisions. Let's explore how that works."

**Step 2: The fork metaphor - REQUIRED VISUAL**
\`\`\`dojo-visual
{
  "type": "info-box",
  "style": "insight",
  "title": "Conditionals: Forks in the Road",
  "content": "An if-statement is like reaching a fork in the road:\\n\\n**The condition is the signpost:** It asks a yes/no question\\n**True path:** If the answer is yes, go this way\\n**False path (else):** If no, go that way\\n\\n**Critical:** You ALWAYS take exactly one path, never both, never neither. After the fork, the roads merge back together."
}
\`\`\`

**Step 3: Prediction challenge - REQUIRED INTERACTIVE**
Present this code:

For Python:
\`\`\`
score = 75
grade = "F"
if score >= 90:
    grade = "A"
if score >= 80:
    grade = "B"
if score >= 70:
    grade = "C"
print(grade)
\`\`\`

\`\`\`dojo-visual
{
  "type": "selection-cards",
  "prompt": "What grade will be printed?",
  "options": [
    {"id": "F", "icon": "📕", "title": "F", "description": "The default grade"},
    {"id": "C", "icon": "📗", "title": "C", "description": "Because 75 >= 70"},
    {"id": "B", "icon": "📘", "title": "B", "description": "Something about the order"},
    {"id": "A", "icon": "📙", "title": "A", "description": "The first if that matches"}
  ]
}
\`\`\`

**Correct answer is C.** But this reveals a common bug! Walk through:
- score=75 is NOT >= 90, skip first if
- score=75 is NOT >= 80, skip second if
- score=75 IS >= 70, so grade becomes "C"

"Notice these are separate if statements, not if-elif-elif. Each one is checked independently. What would happen if score was 95?"

(Answer: grade would be set to A, then B, then C! The code is buggy!)

**Step 4: Fix the bug - discussion**
Show them the corrected version with elif and explain why it matters:
\`\`\`
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "F"
\`\`\`

"With elif, once ONE condition is true, we skip all the rest. It's like: check A? No. Then check B? No. Then check C? Yes! Stop checking."

**Step 5: Boolean logic teaser**
\`\`\`dojo-visual
{
  "type": "selection-cards",
  "prompt": "When does this condition trigger: if x > 0 and x < 10",
  "options": [
    {"id": "either", "icon": "🔀", "title": "When either is true", "description": "x > 0 OR x < 10"},
    {"id": "both", "icon": "✅", "title": "When both are true", "description": "x must be 1-9"},
    {"id": "neither", "icon": "❌", "title": "Never", "description": "They contradict"},
    {"id": "first", "icon": "1️⃣", "title": "Only checks first", "description": "Ignores the second part"}
  ]
}
\`\`\`

Explain that "and" requires BOTH to be true (x between 1-9), while "or" needs only ONE to be true.

**CHECKPOINT:** "What's the difference between multiple separate if statements versus if-elif-elif? When would you use each?"
`,
      checkpointCriteria: `
Student should explain:
1. Separate ifs: ALL conditions are checked, multiple blocks can run
2. if-elif chain: Only ONE block runs (first true condition wins)
3. Use separate ifs when conditions are independent
4. Use elif when conditions are mutually exclusive alternatives

Good example: "Use separate ifs if I want to print 'positive' AND 'even' for the same number. Use elif for letter grades where I only want one result."
`,
    },
    {
      phaseId: 4,
      title: 'Loops: Controlled Repetition',
      purpose: 'Understand loops as controlled repetition with termination',
      hasCheckpoint: true,
      contentGuidance: `
## CORE MENTAL MODEL: The Repeat-Until Machine

**Step 1: Why loops matter**
"What if you needed to print numbers 1 to 1000? Writing 1000 print statements would be madness. Loops let you say 'keep doing this until you're done.' But getting the 'until' part right is where the magic—and the bugs—happen."

**Step 2: Loop anatomy - REQUIRED VISUAL**
\`\`\`dojo-visual
{
  "type": "info-box",
  "style": "insight",
  "title": "The Three Parts of Every Loop",
  "content": "Every loop has three critical parts:\\n\\n**1. Initialization:** Set up before the loop starts (i = 0)\\n**2. Condition:** Check before each iteration (i < 10)\\n**3. Update:** Change something each time (i = i + 1)\\n\\n**If you forget the update, you get an infinite loop!**\\n**If the condition starts false, the body never runs!**"
}
\`\`\`

**Step 3: Trace challenge - REQUIRED INTERACTIVE**
Present this code:

For Python:
\`\`\`
total = 0
i = 1
while i <= 4:
    total = total + i
    i = i + 1
print(total)
\`\`\`

\`\`\`dojo-visual
{
  "type": "selection-cards",
  "prompt": "What does this code output?",
  "options": [
    {"id": "4", "icon": "4️⃣", "title": "4", "description": "The final value of i"},
    {"id": "10", "icon": "🔟", "title": "10", "description": "Sum of 1+2+3+4"},
    {"id": "15", "icon": "🔢", "title": "15", "description": "Sum including 5"},
    {"id": "infinite", "icon": "♾️", "title": "Infinite loop", "description": "Never stops"}
  ]
}
\`\`\`

**Correct answer is 10.** Walk through each iteration:
- i=1: total=0+1=1, i=2 (1 <= 4? yes, continue)
- i=2: total=1+2=3, i=3 (2 <= 4? yes, continue)
- i=3: total=3+3=6, i=4 (3 <= 4? yes, continue)
- i=4: total=6+4=10, i=5 (4 <= 4? yes, continue... then 5 <= 4? NO, stop!)

**Step 4: Off-by-one exploration**
\`\`\`dojo-visual
{
  "type": "comparison-table",
  "title": "Spot the Difference",
  "leftHeader": "while i < 5",
  "rightHeader": "while i <= 5",
  "rows": [
    {"left": "Runs while i is 1,2,3,4", "right": "Runs while i is 1,2,3,4,5"},
    {"left": "4 iterations", "right": "5 iterations"},
    {"left": "Stops when i becomes 5", "right": "Stops when i becomes 6"}
  ],
  "question": "This one-character difference (< vs <=) is the #1 source of loop bugs. It's called an 'off-by-one error.'"
}
\`\`\`

**Step 5: Predict the bug**
Show code with an infinite loop potential:

\`\`\`
count = 10
while count > 0:
    print(count)
    # count = count - 1   (commented out!)
\`\`\`

Ask: "What happens when we run this? Why?" (Answer: prints 10 forever—count never changes)

**CHECKPOINT:** "A loop printed numbers 1 to 9 but I wanted 1 to 10. What's likely wrong and how would you fix it?"
`,
      checkpointCriteria: `
Student should demonstrate:
1. Understanding of loop components (init, condition, update)
2. Ability to trace through loop iterations
3. Recognition that < vs <= changes boundary behavior
4. For the 1-9 vs 1-10 problem: either the condition uses < instead of <=, or the initial value or comparison value is off by 1

Accept any reasonable fix: change < to <=, change 10 to 11, or start at 0 if using < 10.
`,
    },
    {
      phaseId: 5,
      title: 'Functions: Building Blocks',
      purpose: 'Understand functions as reusable, named blocks of code',
      hasCheckpoint: true,
      contentGuidance: `
## CORE MENTAL MODEL: Functions as Machines

**Step 1: Introduce the concept**
"You've built up values in variables, made decisions with conditionals, and repeated actions with loops. Now let's talk about organizing code into reusable pieces: functions."

**Step 2: The machine metaphor - REQUIRED VISUAL**
\`\`\`dojo-visual
{
  "type": "info-box",
  "style": "insight",
  "title": "Functions: Input-Process-Output Machines",
  "content": "Think of a function as a machine with:\\n\\n**Name:** What we call the machine (e.g., 'calculate_area')\\n**Inputs (Parameters):** What we feed in (e.g., width, height)\\n**Process:** What happens inside (multiply them)\\n**Output (Return value):** What comes out (the area)\\n\\n**Calling** a function = turning on the machine\\n**Defining** a function = building the machine\\n\\nOnce built, you can use the machine as many times as you want!"
}
\`\`\`

**Step 3: Parameter passing challenge - REQUIRED INTERACTIVE**
This is where many students struggle. Present:

For Python:
\`\`\`
def mystery(x):
    x = x + 10
    return x

a = 5
b = mystery(a)
print(a, b)
\`\`\`

\`\`\`dojo-visual
{
  "type": "selection-cards",
  "prompt": "What does print(a, b) output?",
  "options": [
    {"id": "5-15", "icon": "✨", "title": "5, 15", "description": "a unchanged, b is the result"},
    {"id": "15-15", "icon": "🔄", "title": "15, 15", "description": "Both are modified"},
    {"id": "5-5", "icon": "📋", "title": "5, 5", "description": "Function doesn't change anything"},
    {"id": "error", "icon": "❌", "title": "Error", "description": "Something is wrong"}
  ]
}
\`\`\`

**Correct answer is 5, 15.** This is crucial! Explain:
- When we call mystery(a), the VALUE 5 is copied into parameter x
- Inside the function, x becomes 15
- But x is a LOCAL copy—it doesn't affect a outside!
- The return value 15 is stored in b

"This is called 'pass by value' for primitives. The function gets a COPY, not the original."

**Step 4: Return value understanding**
\`\`\`dojo-visual
{
  "type": "comparison-table",
  "title": "Return Values Matter",
  "leftHeader": "Code",
  "rightHeader": "What Happens",
  "rows": [
    {"left": "result = mystery(5)", "right": "result gets 15 (the returned value)"},
    {"left": "mystery(5)", "right": "15 is computed but thrown away!"},
    {"left": "print(mystery(5))", "right": "15 is printed (used directly)"}
  ],
  "question": "A returned value must be used (stored, printed, passed to another function) or it disappears!"
}
\`\`\`

**Step 5: Scope teaser**
Show this and ask what happens:

\`\`\`
def greet():
    message = "Hello"
    return message

greet()
print(message)  # What happens here?
\`\`\`

(Answer: Error! message only exists inside the function—it's "local scope")

**CHECKPOINT:** "If a function modifies its parameter inside, does that change the original variable outside? Explain why or why not."
`,
      checkpointCriteria: `
Student should articulate:
1. Parameters receive COPIES of values (for primitives)
2. Changes to parameters inside don't affect original variables
3. Return is how functions communicate results back
4. Without capturing the return value, the result is lost
5. Variables created inside functions are "local" to that function

If they mention references/objects behaving differently, that's advanced understanding—acknowledge it but keep focus on the core model.
`,
    },
    {
      phaseId: 6,
      title: 'Integration: Code Reading Challenge',
      purpose: 'Apply all mental models to trace complex code',
      hasCheckpoint: true,
      contentGuidance: `
## BRINGING IT ALL TOGETHER

**Step 1: Set the stage**
"You now have the mental models for variables, execution flow, conditionals, loops, and functions. Let's put them ALL together with a code reading challenge. This is how real debugging works—tracing through code step by step."

**Step 2: The ultimate challenge - REQUIRED INTERACTIVE**
Present this comprehensive code:

For Python:
\`\`\`
def transform(n):
    if n % 2 == 0:
        return n // 2
    else:
        return n * 3 + 1

def count_steps(start):
    steps = 0
    current = start
    while current != 1:
        current = transform(current)
        steps = steps + 1
    return steps

result = count_steps(6)
print(result)
\`\`\`

First ask them to read the code and describe IN ENGLISH what it does before predicting the output.

Then:
\`\`\`dojo-visual
{
  "type": "selection-cards",
  "prompt": "What value does count_steps(6) return?",
  "options": [
    {"id": "6", "icon": "6️⃣", "title": "6", "description": "The starting number"},
    {"id": "8", "icon": "8️⃣", "title": "8", "description": "Eight steps to reach 1"},
    {"id": "1", "icon": "1️⃣", "title": "1", "description": "The final value"},
    {"id": "infinite", "icon": "♾️", "title": "Infinite", "description": "Never reaches 1"}
  ]
}
\`\`\`

**Walk through together (Collatz sequence):**
- start=6: current=6, steps=0
- 6 is even → transform returns 3, steps=1
- 3 is odd → transform returns 10, steps=2
- 10 is even → transform returns 5, steps=3
- 5 is odd → transform returns 16, steps=4
- 16 is even → transform returns 8, steps=5
- 8 is even → transform returns 4, steps=6
- 4 is even → transform returns 2, steps=7
- 2 is even → transform returns 1, steps=8
- current is 1, loop stops, return 8

**Correct answer is 8.**

"This is the Collatz Conjecture—one of math's unsolved problems! Nobody knows if this always reaches 1 for any starting number, but you just traced through a working implementation."

**Step 3: Reflection - REQUIRED VISUAL**
\`\`\`dojo-visual
{
  "type": "info-box",
  "style": "summary",
  "title": "Your Programming Mental Models",
  "content": "You now understand the core building blocks:\\n\\n**Variables:** Named boxes holding values\\n**Execution:** One line at a time, in order\\n**Conditionals:** Forks in the road based on conditions\\n**Loops:** Repeat until a condition becomes false\\n**Functions:** Reusable machines with inputs and outputs\\n\\nEvery program, no matter how complex, is built from these pieces. When code confuses you, slow down and trace through it like we just did."
}
\`\`\`

**CHECKPOINT:** "Walk me through your thinking process as you traced that code. What mental models did you use at each step?"
`,
      checkpointCriteria: `
Student should demonstrate they can:
1. Identify function calls and trace into function definitions
2. Track variable values through conditionals and loops
3. Understand how return values flow back to the caller
4. Recognize when a loop terminates
5. Combine all mental models to understand a complete program

Listen for them mentioning concepts like "I checked if 6 was even" (conditional), "then the loop ran again" (iteration), "transform returned 3" (function return).
`,
    },
    {
      phaseId: 7,
      title: 'Your Learning Path',
      purpose: 'Reflect on growth and identify next steps',
      hasCheckpoint: false,
      contentGuidance: `
## CLOSING

**Step 1: Personalized reflection**
"You've explored the fundamental mental models that every programmer needs. Let's reflect on YOUR journey."

\`\`\`dojo-visual
{
  "type": "selection-cards",
  "prompt": "Which concept felt most 'aha!' to you today?",
  "options": [
    {"id": "variables", "icon": "📦", "title": "Variables", "description": "The box metaphor clicked"},
    {"id": "control", "icon": "🔀", "title": "Control Flow", "description": "Conditionals or loops"},
    {"id": "functions", "icon": "⚙️", "title": "Functions", "description": "Parameters and returns"},
    {"id": "tracing", "icon": "🔍", "title": "Code Tracing", "description": "Reading code step-by-step"}
  ]
}
\`\`\`

Discuss their selection and reinforce that insight.

**Step 2: Growth areas**
"Now, which concept do you want to practice more?"

Based on their answer, give specific suggestions:
- Variables: Practice predicting swap operations, explore references vs. values
- Control Flow: Write your own if-elif chains, trace nested loops
- Functions: Practice functions that call other functions, explore recursion
- Tracing: Find complex code online and trace through it manually

**Step 3: The transfer insight - REQUIRED VISUAL**
\`\`\`dojo-visual
{
  "type": "info-box",
  "style": "summary",
  "title": "The Language-Agnostic Programmer",
  "content": "**These mental models work in EVERY language.**\\n\\nPython, JavaScript, Java, C++, Rust, Go—they all have:\\n• Variables (with slight differences in types)\\n• Sequential execution\\n• Conditionals (if/else)\\n• Loops (for/while)\\n• Functions\\n\\nWhen you learn a new language, you're learning new SYNTAX for the same mental models. The thinking transfers. That's what makes a good programmer."
}
\`\`\`

**Step 4: Final encouragement**
"Programming isn't about memorizing syntax—it's about building mental models that let you THINK in code. You've strengthened those models today. The more you practice tracing, predicting, and debugging, the more natural it becomes."

"What's one thing you'll do differently when you write or read code after today?"

Close warmly and encourage them to return whenever they want to deepen their understanding or try Challenge Mode for harder problems.
`,
    },
  ],
};
