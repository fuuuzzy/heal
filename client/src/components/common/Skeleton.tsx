export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-14 rounded-md" />
      </div>
      <Skeleton className="h-1.5 w-full rounded-full" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

export function GridSkeleton() {
  return (
    <div className="card p-3">
      <div className="grid grid-cols-8 gap-1">
        {Array.from({ length: 40 }).map((_, i) => (
          <Skeleton key={i} className="h-[40px] w-[40px] rounded-md" />
        ))}
      </div>
    </div>
  )
}
