type props = { items: number };
export default function SnackSkeleton({ items }: props) {
  return (
    <>
      {Array.from({ length: items }).map((_, i) => (
        <div className='flex items-center p-2 gap-3 animate-pulse' key={i}>
          {/* thumbnail */}
          <div className='w-28 h-16 rounded bg-yt-bg-tertiary' />

          {/* text */}
          <div className='flex-1 space-y-2'>
            <div className='h-4 w-3/4 rounded bg-yt-bg-tertiary' />
            <div className='h-3 w-1/2 rounded bg-yt-bg-tertiary' />
          </div>

          {/* action */}
          <div className='w-6 h-6 rounded bg-yt-bg-tertiary' />
        </div>
      ))}
    </>
  );
}
