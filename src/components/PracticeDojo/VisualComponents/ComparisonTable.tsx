'use client';

import { ComparisonTableData } from '@/lib/practice-dojo/types';

interface ComparisonTableProps {
  data: ComparisonTableData;
}

export function ComparisonTable({ data }: ComparisonTableProps) {
  return (
    <div className="my-4">
      {data.title && (
        <h4 className="text-sm font-semibold text-gray-200 mb-3">{data.title}</h4>
      )}
      <div className="rounded-lg border border-gray-700 overflow-hidden">
        {/* Headers */}
        <div className="grid grid-cols-2 bg-gray-800/80">
          <div className="px-4 py-3 border-r border-gray-700">
            <h5 className="text-sm font-semibold text-amber-400">{data.leftHeader}</h5>
          </div>
          <div className="px-4 py-3">
            <h5 className="text-sm font-semibold text-emerald-400">{data.rightHeader}</h5>
          </div>
        </div>
        {/* Rows */}
        {data.rows.map((row, index) => (
          <div
            key={index}
            className={`grid grid-cols-2 ${
              index % 2 === 0 ? 'bg-gray-900/50' : 'bg-gray-800/30'
            }`}
          >
            <div className="px-4 py-3 border-r border-gray-700/50">
              {row.label && (
                <span className="text-xs font-medium text-gray-500 block mb-1">
                  {row.label}
                </span>
              )}
              <p className="text-sm text-gray-300">{row.left}</p>
            </div>
            <div className="px-4 py-3">
              {row.label && <span className="text-xs font-medium text-gray-500 block mb-1">&nbsp;</span>}
              <p className="text-sm text-gray-300">{row.right}</p>
            </div>
          </div>
        ))}
      </div>
      {data.question && (
        <p className="text-sm text-purple-300 mt-3 italic">{data.question}</p>
      )}
    </div>
  );
}
