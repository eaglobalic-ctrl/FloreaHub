export default function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200/70 rounded-lg ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="card-premium overflow-hidden bg-white">
      <Skeleton className="h-40 rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card-premium p-5">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-8 !rounded-lg" />
      </div>
      <Skeleton className="h-7 w-20 mb-2" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-2">
      <Skeleton className="w-9 h-9 !rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>
      <Skeleton className="h-4 w-14" />
    </div>
  );
}
