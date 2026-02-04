'use client';

import { FrameworkDiagramData, DiagramType } from '@/lib/practice-dojo/types';

interface FrameworkDiagramProps {
  data: FrameworkDiagramData;
}

export function FrameworkDiagram({ data }: FrameworkDiagramProps) {
  const renderDiagram = (type: DiagramType) => {
    switch (type) {
      case '3cs':
        return <ThreeCsDiagram />;
      case 'umpire':
        return <UmpireDiagram />;
      case 'dikw':
        return <DIKWDiagram />;
      case 'personal-stack':
        return <PersonalStackDiagram />;
      case '3cs-umpire-mapping':
        return <ThreeCsUmpireMappingDiagram />;
      case 'dojo-modes':
        return <DojoModesDiagram />;
      case 'ikigai':
        return <IkigaiDiagram />;
      case 'ikigai-passion':
        return <IkigaiDiagram highlight="passion" />;
      case 'ikigai-mission':
        return <IkigaiDiagram highlight="mission" />;
      case 'ikigai-profession':
        return <IkigaiDiagram highlight="profession" />;
      case 'ikigai-vocation':
        return <IkigaiDiagram highlight="vocation" />;
      default:
        return <div className="text-gray-400 text-sm">Unknown diagram type: {type}</div>;
    }
  };

  return (
    <div className="my-4">
      {renderDiagram(data.diagram)}
      {data.caption && (
        <p className="text-xs text-gray-500 text-center mt-2 italic">{data.caption}</p>
      )}
    </div>
  );
}

// 3Cs Diagram
function ThreeCsDiagram() {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
      <h4 className="text-center text-sm font-semibold text-gray-200 mb-4">The 3Cs</h4>
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[100px] max-w-[150px] p-3 rounded-lg bg-blue-900/40 border border-blue-700/50 text-center">
          <div className="text-2xl mb-1">📋</div>
          <div className="text-sm font-semibold text-blue-300">CONTEXT</div>
          <div className="text-xs text-blue-200/70 mt-1">What you bring</div>
          <div className="text-[10px] text-blue-200/50 mt-0.5">Details, situation, memories</div>
        </div>
        <div className="text-gray-500 text-xl">→</div>
        <div className="flex-1 min-w-[100px] max-w-[150px] p-3 rounded-lg bg-amber-900/40 border border-amber-700/50 text-center">
          <div className="text-2xl mb-1">🎯</div>
          <div className="text-sm font-semibold text-amber-300">CHOICES</div>
          <div className="text-xs text-amber-200/70 mt-1">What you decide</div>
          <div className="text-[10px] text-amber-200/50 mt-0.5">Tone, approach, direction</div>
        </div>
        <div className="text-gray-500 text-xl">→</div>
        <div className="flex-1 min-w-[100px] max-w-[150px] p-3 rounded-lg bg-emerald-900/40 border border-emerald-700/50 text-center">
          <div className="text-2xl mb-1">✓</div>
          <div className="text-sm font-semibold text-emerald-300">CONFIRM</div>
          <div className="text-xs text-emerald-200/70 mt-1">How you verify</div>
          <div className="text-[10px] text-emerald-200/50 mt-0.5">Does it match intent?</div>
        </div>
      </div>
      <div className="text-center mt-3">
        <span className="text-xs text-gray-400">⟲ iterate</span>
      </div>
    </div>
  );
}

// UMPIRE Diagram
function UmpireDiagram() {
  const stages = [
    { letter: 'U', name: 'Understand', color: 'text-blue-400', bg: 'bg-blue-900/30' },
    { letter: 'M', name: 'Map', color: 'text-cyan-400', bg: 'bg-cyan-900/30' },
    { letter: 'P', name: 'Plan', color: 'text-amber-400', bg: 'bg-amber-900/30' },
    { letter: 'I', name: 'Implement', color: 'text-orange-400', bg: 'bg-orange-900/30' },
    { letter: 'R', name: 'Review', color: 'text-rose-400', bg: 'bg-rose-900/30' },
    { letter: 'E', name: 'Evaluate', color: 'text-purple-400', bg: 'bg-purple-900/30' },
  ];

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
      <h4 className="text-center text-sm font-semibold text-gray-200 mb-4">The UMPIRE Cycle</h4>
      <div className="flex flex-col items-center gap-1">
        {stages.map((stage, index) => (
          <div key={stage.letter} className="flex items-center gap-2 w-full max-w-xs">
            <div className={`w-8 h-8 rounded-full ${stage.bg} flex items-center justify-center`}>
              <span className={`text-sm font-bold ${stage.color}`}>{stage.letter}</span>
            </div>
            <div className="flex-1">
              <span className={`text-sm font-medium ${stage.color}`}>{stage.name}</span>
            </div>
            {index < stages.length - 1 && (
              <div className="text-gray-600 text-xs">↓</div>
            )}
          </div>
        ))}
      </div>
      <div className="text-center mt-3 text-xs text-gray-400">
        <span className="bg-gray-700/50 px-2 py-1 rounded">P-I-R Loop</span>
        <span className="mx-2">|</span>
        <span className="bg-gray-700/50 px-2 py-1 rounded">E→U Restart</span>
      </div>
    </div>
  );
}

// DIKW Pyramid
function DIKWDiagram() {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
      <h4 className="text-center text-sm font-semibold text-gray-200 mb-4">The DIKW Pyramid</h4>
      <div className="flex flex-col items-center gap-1">
        {/* Wisdom */}
        <div className="w-32 p-2 rounded-t-lg bg-purple-900/50 border border-purple-700/50 text-center">
          <div className="text-xs font-semibold text-purple-300">WISDOM</div>
          <div className="text-[10px] text-purple-200/60">Judgment for the future</div>
        </div>
        {/* Knowledge */}
        <div className="w-44 p-2 bg-emerald-900/50 border-x border-emerald-700/50 text-center">
          <div className="text-xs font-semibold text-emerald-300">KNOWLEDGE</div>
          <div className="text-[10px] text-emerald-200/60">Understanding why & when</div>
        </div>
        {/* Information */}
        <div className="w-56 p-2 bg-amber-900/50 border-x border-amber-700/50 text-center">
          <div className="text-xs font-semibold text-amber-300">INFORMATION</div>
          <div className="text-[10px] text-amber-200/60">Organized, connected</div>
        </div>
        {/* Data */}
        <div className="w-64 p-2 rounded-b-lg bg-blue-900/50 border border-blue-700/50 text-center">
          <div className="text-xs font-semibold text-blue-300">DATA</div>
          <div className="text-[10px] text-blue-200/60">Raw facts & content</div>
        </div>
      </div>
      <div className="flex justify-center gap-4 mt-3 text-[10px] text-gray-400">
        <span>D, I, K = Understanding the PAST</span>
        <span>|</span>
        <span>W = Useful for the FUTURE</span>
      </div>
    </div>
  );
}

// Personal Stack
function PersonalStackDiagram() {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
      <h4 className="text-center text-sm font-semibold text-gray-200 mb-4">Your Personal Stack</h4>
      <div className="flex flex-col gap-2">
        {/* Motivation */}
        <div className="p-3 rounded-lg bg-purple-900/40 border border-purple-700/50">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🎯</span>
            <span className="text-sm font-semibold text-purple-300">MOTIVATION (The WHY)</span>
          </div>
          <p className="text-xs text-purple-200/70 ml-7">
            Climbing from Data → Wisdom. Why bother creating when consuming is easier?
          </p>
        </div>
        <div className="text-center text-gray-500">▲</div>
        {/* Metacognition */}
        <div className="p-3 rounded-lg bg-amber-900/40 border border-amber-700/50">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🧠</span>
            <span className="text-sm font-semibold text-amber-300">METACOGNITION (The HOW)</span>
          </div>
          <p className="text-xs text-amber-200/70 ml-7">
            3Cs + UMPIRE: Tools for thinking about thinking.
          </p>
        </div>
        <div className="text-center text-gray-500">▲</div>
        {/* Mindset */}
        <div className="p-3 rounded-lg bg-emerald-900/40 border border-emerald-700/50">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">💭</span>
            <span className="text-sm font-semibold text-emerald-300">MINDSET (The WHAT)</span>
          </div>
          <p className="text-xs text-emerald-200/70 ml-7">
            Creating vs Consuming: Active engagement with AI.
          </p>
        </div>
      </div>
      <p className="text-center text-xs text-gray-400 mt-3">
        Each layer builds on the one below — like a three-legged stool.
      </p>
    </div>
  );
}

// 3Cs to UMPIRE Mapping
function ThreeCsUmpireMappingDiagram() {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
      <h4 className="text-center text-sm font-semibold text-gray-200 mb-4">How 3Cs Map to UMPIRE</h4>
      <div className="space-y-3">
        {/* Context → U+M */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-900/20 border border-blue-700/30">
          <div className="w-20 text-center">
            <span className="text-sm font-semibold text-blue-300">CONTEXT</span>
            <div className="text-[10px] text-blue-200/60">What you bring</div>
          </div>
          <div className="text-gray-500">→</div>
          <div className="flex-1">
            <span className="text-sm font-semibold text-blue-400">UNDERSTAND + MAP</span>
            <div className="text-[10px] text-gray-400">Define the problem, connect to what you know</div>
          </div>
        </div>
        {/* Choices → P+I */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-900/20 border border-amber-700/30">
          <div className="w-20 text-center">
            <span className="text-sm font-semibold text-amber-300">CHOICES</span>
            <div className="text-[10px] text-amber-200/60">What you decide</div>
          </div>
          <div className="text-gray-500">→</div>
          <div className="flex-1">
            <span className="text-sm font-semibold text-amber-400">PLAN + IMPLEMENT</span>
            <div className="text-[10px] text-gray-400">Decide approach, execute it</div>
          </div>
        </div>
        {/* Confirmation → R+E */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-900/20 border border-emerald-700/30">
          <div className="w-20 text-center">
            <span className="text-sm font-semibold text-emerald-300">CONFIRM</span>
            <div className="text-[10px] text-emerald-200/60">How you verify</div>
          </div>
          <div className="text-gray-500">→</div>
          <div className="flex-1">
            <span className="text-sm font-semibold text-emerald-400">REVIEW + EVALUATE</span>
            <div className="text-[10px] text-gray-400">Check results, align with goals, loop back</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dojo Modes
function DojoModesDiagram() {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
      <h4 className="text-center text-sm font-semibold text-gray-200 mb-4">The Dojo: Your Training Ground</h4>
      <div className="space-y-2">
        {/* Learn */}
        <div className="p-3 rounded-lg bg-emerald-900/30 border border-emerald-700/50">
          <div className="flex items-center gap-2">
            <span className="text-lg">📚</span>
            <span className="text-sm font-semibold text-emerald-300">LEARN Mode</span>
          </div>
          <p className="text-xs text-emerald-200/70 ml-7 mt-1">
            Safe exploration. Build understanding. Mistakes are expected and valuable.
          </p>
        </div>
        {/* Learn + Solve */}
        <div className="p-3 rounded-lg bg-amber-900/30 border border-amber-700/50">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔧</span>
            <span className="text-sm font-semibold text-amber-300">LEARN + SOLVE Mode</span>
          </div>
          <p className="text-xs text-amber-200/70 ml-7 mt-1">
            Apply learning to defined problems. Real but bounded stakes.
          </p>
        </div>
        {/* Learn + Solve + Build */}
        <div className="p-3 rounded-lg bg-purple-900/30 border border-purple-700/50">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏗️</span>
            <span className="text-sm font-semibold text-purple-300">LEARN + SOLVE + BUILD Mode</span>
          </div>
          <p className="text-xs text-purple-200/70 ml-7 mt-1">
            Create real value for real stakeholders. High stakes. Quality matters.
          </p>
        </div>
      </div>
      <p className="text-center text-xs text-gray-400 mt-3">
        Use <span className="text-cyan-400">@reflector</span> to generate a session summary
      </p>
    </div>
  );
}

// Ikigai Diagram - Four overlapping circles
interface IkigaiDiagramProps {
  highlight?: 'passion' | 'mission' | 'profession' | 'vocation';
}

function IkigaiDiagram({ highlight }: IkigaiDiagramProps) {
  // Circle positions (centered in 300x300 viewBox)
  const cx = 150, cy = 150;
  const r = 70; // circle radius
  const offset = 45; // how far circles are from center

  // Four circle centers
  const circles = {
    love: { x: cx, y: cy - offset, color: '#ec4899', label: 'What you LOVE' },      // pink - top
    goodAt: { x: cx - offset, y: cy, color: '#3b82f6', label: 'What you\'re GOOD AT' }, // blue - left
    need: { x: cx + offset, y: cy, color: '#10b981', label: 'What the WORLD NEEDS' },  // green - right
    paid: { x: cx, y: cy + offset, color: '#f59e0b', label: 'What you can be PAID FOR' }, // amber - bottom
  };

  // Intersection highlights
  const intersections = {
    passion: { x: cx - offset/2, y: cy - offset/2, label: 'PASSION', desc: 'Love + Good At' },
    mission: { x: cx + offset/2, y: cy - offset/2, label: 'MISSION', desc: 'Love + Need' },
    profession: { x: cx - offset/2, y: cy + offset/2, label: 'PROFESSION', desc: 'Good At + Paid' },
    vocation: { x: cx + offset/2, y: cy + offset/2, label: 'VOCATION', desc: 'Need + Paid' },
  };

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
      <h4 className="text-center text-sm font-semibold text-gray-200 mb-2">生き甲斐 Ikigai</h4>
      <p className="text-center text-xs text-gray-400 mb-4">Your reason for being</p>

      <div className="flex justify-center">
        <svg viewBox="0 0 300 300" className="w-full max-w-[280px]">
          <defs>
            {/* Gradients for each circle */}
            <radialGradient id="loveFill">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.1" />
            </radialGradient>
            <radialGradient id="goodAtFill">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
            </radialGradient>
            <radialGradient id="needFill">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
            </radialGradient>
            <radialGradient id="paidFill">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.1" />
            </radialGradient>
          </defs>

          {/* Four overlapping circles */}
          <circle cx={circles.love.x} cy={circles.love.y} r={r} fill="url(#loveFill)" stroke="#ec4899" strokeWidth="2" />
          <circle cx={circles.goodAt.x} cy={circles.goodAt.y} r={r} fill="url(#goodAtFill)" stroke="#3b82f6" strokeWidth="2" />
          <circle cx={circles.need.x} cy={circles.need.y} r={r} fill="url(#needFill)" stroke="#10b981" strokeWidth="2" />
          <circle cx={circles.paid.x} cy={circles.paid.y} r={r} fill="url(#paidFill)" stroke="#f59e0b" strokeWidth="2" />

          {/* Center - Ikigai */}
          <circle cx={cx} cy={cy} r={18} fill="#a855f7" fillOpacity="0.4" stroke="#a855f7" strokeWidth="2" />
          <text x={cx} y={cy + 4} textAnchor="middle" className="fill-purple-200 text-[10px] font-bold">IKIGAI</text>

          {/* Highlight specific intersection if requested */}
          {highlight && (
            <circle
              cx={intersections[highlight].x}
              cy={intersections[highlight].y}
              r={20}
              fill="#fff"
              fillOpacity="0.2"
              stroke="#fff"
              strokeWidth="2"
              className="animate-pulse"
            />
          )}

          {/* Labels outside circles */}
          <text x={cx} y={30} textAnchor="middle" className="fill-pink-400 text-[9px] font-medium">What you LOVE</text>
          <text x={25} y={cy + 4} textAnchor="middle" className="fill-blue-400 text-[9px] font-medium" transform={`rotate(-90, 25, ${cy})`}>GOOD AT</text>
          <text x={275} y={cy + 4} textAnchor="middle" className="fill-emerald-400 text-[9px] font-medium" transform={`rotate(90, 275, ${cy})`}>WORLD NEEDS</text>
          <text x={cx} y={285} textAnchor="middle" className="fill-amber-400 text-[9px] font-medium">What you can be PAID FOR</text>

          {/* Intersection labels (smaller) */}
          <text x={intersections.passion.x} y={intersections.passion.y} textAnchor="middle" className="fill-gray-300 text-[7px]">Passion</text>
          <text x={intersections.mission.x} y={intersections.mission.y} textAnchor="middle" className="fill-gray-300 text-[7px]">Mission</text>
          <text x={intersections.profession.x} y={intersections.profession.y} textAnchor="middle" className="fill-gray-300 text-[7px]">Profession</text>
          <text x={intersections.vocation.x} y={intersections.vocation.y} textAnchor="middle" className="fill-gray-300 text-[7px]">Vocation</text>
        </svg>
      </div>

      {/* Legend below */}
      <div className="grid grid-cols-2 gap-2 mt-4 text-[10px]">
        <div className={`p-2 rounded ${highlight === 'passion' ? 'bg-white/10 ring-1 ring-white/30' : 'bg-gray-700/30'}`}>
          <span className="font-semibold text-gray-200">Passion</span>
          <span className="text-gray-400"> = Love + Good At</span>
        </div>
        <div className={`p-2 rounded ${highlight === 'mission' ? 'bg-white/10 ring-1 ring-white/30' : 'bg-gray-700/30'}`}>
          <span className="font-semibold text-gray-200">Mission</span>
          <span className="text-gray-400"> = Love + Need</span>
        </div>
        <div className={`p-2 rounded ${highlight === 'profession' ? 'bg-white/10 ring-1 ring-white/30' : 'bg-gray-700/30'}`}>
          <span className="font-semibold text-gray-200">Profession</span>
          <span className="text-gray-400"> = Good At + Paid</span>
        </div>
        <div className={`p-2 rounded ${highlight === 'vocation' ? 'bg-white/10 ring-1 ring-white/30' : 'bg-gray-700/30'}`}>
          <span className="font-semibold text-gray-200">Vocation</span>
          <span className="text-gray-400"> = Need + Paid</span>
        </div>
      </div>
    </div>
  );
}
