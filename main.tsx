import React from 'react';
import { motion } from 'motion/react';

export default function SkeletonTable() {
  return (
    <div className="space-y-4 w-full">
      <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex gap-4">
          <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
          <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
        </div>
        <div className="flex gap-4">
          <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
          <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
        </div>
      </div>
      <div className="overflow-x-auto p-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              {[1, 2, 3, 4, 5].map((i) => (
                <th key={i} className="px-6 py-5">
                  <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {[1, 2, 3, 4, 5].map((row) => (
              <tr key={row}>
                {[1, 2, 3, 4, 5].map((col) => (
                  <td key={col} className="px-6 py-4">
                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
