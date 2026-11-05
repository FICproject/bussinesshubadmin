import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded ${className}`}
  />
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 5,
}) => (
  <div className="w-full space-y-3 p-4">
    {/* Table Header Skeleton */}
    <div className="flex space-x-4 border-b border-slate-100 dark:border-slate-800 pb-3">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={`th-${i}`} className="h-4 flex-1" />
      ))}
    </div>
    {/* Table Rows Skeleton */}
    {Array.from({ length: rows }).map((_, r) => (
      <div key={`tr-${r}`} className="flex space-x-4 py-2.5 items-center">
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton
            key={`td-${r}-${c}`}
            className={`h-4 flex-1 ${c === 0 ? 'w-1/3' : 'w-full'}`}
          />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonCards: React.FC<{ count?: number; gridCols?: string }> = ({
  count = 4,
  gridCols = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}) => (
  <div className={`grid ${gridCols} gap-4`}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={`card-${i}`}
        className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
      >
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-3 w-36" />
      </div>
    ))}
  </div>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="space-y-3 p-4">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={`list-${i}`}
        className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800/60 flex items-center justify-between"
      >
        <div className="space-y-2 flex-1 pr-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-64" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    ))}
  </div>
);

