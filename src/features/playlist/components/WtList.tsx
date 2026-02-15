import { useRef } from 'react';
import { useVisibleObserver } from '../hooks/useVisibleObserver';
import { useRipple } from '../hooks/useRipple';

import { EllipsisVerticalIcon, PlayIcon } from '@heroicons/react/20/solid';

import type { Video } from '../../../types/video';
import type { ThumbnailVariant } from '../../../components/Thumbnail';
import type { ViewState } from '../types';

import { Snack, SnackSkeleton } from '.';
import { sendToBackground } from '../../../utils/actions';

type props = {
  playList: Video[];
  viewState: Pick<ViewState, 'view'>;
  imgVariant: ThumbnailVariant;
  chip?: number | string;
  playlistKey?: string;
  isLoading?: boolean;
  activeVideoId?: string;
  onItemClick?: (video: Video) => void;
};

export default function WtList({
  playList,
  isLoading,
  imgVariant,
  chip,
  playlistKey,
  viewState,
  activeVideoId,
  onItemClick,
}: props) {
  const refContent = useRef<HTMLDivElement>(null);
  const { containerRef: buttonRef, createBorderRipple } = useRipple();

  const observe = useVisibleObserver(refContent.current, (_el) => {});

  const handleOptionClick = async (playlistName: string) => {
    console.log('[SP] remove playlist action');
    await sendToBackground({ type: 'REMOVE_PLAYLIST', payload: { key: playlistName } });
  };

  const renderIndex = (active: boolean) => {
    if (!active) {
      return;
    }

    return (
      <div className='h-full ml-1 p-0.5 w-auto'>
        <PlayIcon className='w-3.5 m-auto fill-yt-text-secondary/60' />
      </div>
    );
  };

  if (isLoading) {
    return <SnackSkeleton items={1} />;
  }

  return (
    <div>
      {playList.map((video, idx) => {
        const isPlayingVideo = activeVideoId === video.id;

        return (
          <div
            key={video.id}
            ref={refContent}
            className={`ref-content relative group inline-block w-full ${isPlayingVideo && 'bg-yt-accent-hover-red/80'}`}
          >
            <div
              ref={observe}
              className={`flex justify-center items-center py-2 hover:bg-yt-bg-tertiary hover:cursor-pointer hover:opacity-100`}
              onClick={() => {
                switch (viewState.view) {
                  case 'VIDEOS':
                    // Assign clickable function if it is NOT playingVideo
                    if (!isPlayingVideo) {
                      onItemClick?.({ ...video, currentIndex: idx + 1 });
                    }
                    break;
                  default: // PLAYLISTS
                    onItemClick?.(video);
                    break;
                }
              }}
            >
              {renderIndex(isPlayingVideo)}
              <Snack
                video={video}
                playingVideo={isPlayingVideo}
                imgVariant={imgVariant}
                chip={chip || video?.timeLength}
                title={playlistKey}
                viewState={viewState}
              />
              <div className='w-10 mx-1 flex items-center justify-center opacity-0 translate-x-1 scale-90 group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 transition-all duration-100 ease-out'>
                <button
                  className='relative overflow-hidden w-full h-10 rounded-full transition-colors duration-150 hover:cursor-pointer hover:bg-white/10 active:bg-white/20'
                  type='button'
                  ref={buttonRef}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (viewState.view === 'PLAYLISTS') {
                      handleOptionClick(playlistKey!);
                    }
                  }}
                  onPointerUp={(e) => {
                    createBorderRipple(e);
                    e.stopPropagation();
                  }}
                >
                  <EllipsisVerticalIcon className='w-6 h-6 m-auto' />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
