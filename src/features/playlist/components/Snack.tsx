import { Thumbnail, ThumbnailVariant } from '../../../components/Thumbnail';
import type { Video } from '../../../types/video';
import { ViewState } from '../types';

type state = Pick<ViewState, 'view'>;

type props = {
  video: Video;
  imgVariant: ThumbnailVariant;
  title?: string;
  chip?: string | number;
  viewState?: state;
  playingVideo?: boolean;
};
export default function Snack({
  video,
  title,
  imgVariant,
  viewState,
  chip,
  playingVideo,
}: props) {
  return (
    <div className={`flex flex-1 items-center ml-1 pt-2 gap-2 md:w-80`}>
      <Thumbnail
        className={`w-28 ${!playingVideo && 'ml-2'}`}
        src={video.thumbImg}
        variant={imgVariant}
        count={chip}
        activeVideoId={playingVideo}
      />
      <div className='flex flex-col gap-1.5 self-baseline h-full flex-1'>
        <h4
          className={`font-extrabold truncate whitespace-normal ${viewState?.view === 'VIDEOS' ? 'text-xs' : 'text-md'}`}
          title={title}
        >
          <span className='line-clamp-2'>{title ? <span>{title}</span> : video.title}</span>
        </h4>
        {viewState?.view === 'VIDEOS' && (
          <div className='truncate whitespace-normal text-yt-text-muted text-xxs'>
            <span className='line-clamp-1'>{video.publishedBy}</span>
          </div>
        )}
      </div>
    </div>
  );
}
