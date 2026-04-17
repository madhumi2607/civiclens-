export function SkeletonLine({ className = '' }) {
  return (
    <div className={`bg-gray-200 dark:bg-zinc-700 rounded-lg animate-pulse ${className}`} />
  )
}

export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={`card p-4 flex flex-col gap-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} className={`h-3 ${i === 0 ? 'w-1/2' : i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  )
}

export function SkeletonMap({ className = '' }) {
  return (
    <div className={`bg-gray-200 dark:bg-zinc-800 rounded-2xl flex items-center justify-center animate-pulse ${className}`}>
      <svg className="w-10 h-10 text-gray-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    </div>
  )
}

export function AIThinkingSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <SkeletonLine className="h-40 w-full rounded-2xl" />
      <SkeletonCard lines={2} />
      <SkeletonCard lines={3} />
    </div>
  )
}
