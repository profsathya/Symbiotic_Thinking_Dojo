'use client';

interface ConfigTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { id: 'dojo', label: 'Dojo' },
  { id: 'sensei', label: 'Sensei' },
  { id: 'constructs', label: 'Constructs' },
  { id: 'partners', label: 'Sparring Partners' },
];

export function ConfigTabs({ activeTab, onTabChange }: ConfigTabsProps) {
  return (
    <div className="flex border-b border-gray-700">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
