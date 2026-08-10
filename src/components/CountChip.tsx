import { QueueListIcon } from '@heroicons/react/20/solid';

type CountChipProps = {
  count: number | string;
};

export function CountChip({ count }: CountChipProps) {
  return (
    <div className='absolute bottom-1 right-1 z-20 flex items-center gap-1 rounded-md bg-yt-bg-secondary/70 px-1 py-0.5 text-xxs font-semibold text-white'>
      <div className='flex gap-0.5 justify-center items-center'>
        {typeof count === 'number' ? (
          <>
            <QueueListIcon width={14} />
            <span>{count}</span>
          </>
        ) : (
          <span> {count}</span>
        )}
      </div>
    </div>
  );
}
