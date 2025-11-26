# Symbiotic Thinking Dojo

An AI-powered practice environment where users develop cognitive skills to create real value — not just complete technical tasks. The Dojo trains judgment through structured practice with AI as a thinking partner.

## Features

- **Three Constructs** (Training Environments):
  - **Learn**: Safe exploration and skill acquisition (low stakes)
  - **Learn + Solve**: Apply learning to defined problems (medium stakes)
  - **Learn + Solve + Build**: Create real value for real stakeholders (high stakes)

- **Four Sparring Partners** (Skill Challengers):
  - **The Framer**: Blocks implementation until the problem is understood
  - **The Auditor**: Enforces 3Cs (Context, Choices, Confirmation) before accepting decisions
  - **The Connector**: Bridges domains and finds patterns from other fields
  - **The Challenger**: Pressure-tests thinking and plays devil's advocate

- **The Sensei**: Metacognitive coach that guides through questions, not answers

- **UMPIRE Framework**: Understand → Model → Plan → Implement → Review → Extend

- **Fully Configurable**: All prompts for Dojo, Sensei, Constructs, and Sparring Partners can be customized

## Getting Started

### Prerequisites

- Node.js 18+
- An Anthropic API key (get one at https://console.anthropic.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Symbiotic_Thinking_Dojo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your Anthropic API key:
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your API key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Select a Construct**: Choose your training mode based on the stakes and type of work you're doing.

2. **Activate Sparring Partners**: Toggle one or more partners to challenge specific aspects of your thinking.

3. **Engage with the Sensei**: Share your challenge or question, and the Sensei will guide you through the process.

4. **Track Your Progress**: Use the UMPIRE tracker to stay oriented in your problem-solving journey.

5. **Configure Prompts**: Click "Configure Prompts" to customize any of the system prompts to suit your needs.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/chat/          # Chat API endpoint
│   ├── page.tsx           # Main application page
│   └── layout.tsx         # Root layout
├── components/
│   ├── Chat/              # Chat interface components
│   ├── ConfigPanel/       # Prompt configuration UI
│   ├── Sidebar/           # Construct and partner selectors
│   └── StatusPanel/       # UMPIRE tracker and status
├── hooks/
│   ├── useChat.ts         # Chat state management
│   └── useDojoConfig.ts   # Configuration state
└── lib/
    ├── llm/               # LLM provider adapters
    ├── prompts/           # Default prompts and composer
    └── types.ts           # TypeScript type definitions
```

## Configuration

All prompts are fully configurable through the UI. Click the "Configure Prompts" button to access:

- **Dojo Philosophy**: Core frameworks (UMPIRE, 3Cs) and principles
- **Sensei Behavior**: Metacognitive coaching style and approach
- **Construct Prompts**: Behavior modifications for each training mode
- **Partner Prompts**: Individual sparring partner personalities and triggers

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **LLM**: Claude API (Anthropic)
- **State Management**: React hooks

## Future Enhancements

- Multi-provider support (OpenAI, Gemini)
- Session persistence
- User authentication
- Instructor dashboard
- Custom sparring partner creation
- Export/Import configuration

## License

MIT

## Acknowledgments

Based on the Symbiotic Thinking Dojo design framework.
