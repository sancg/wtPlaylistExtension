import '../../styles/global.css';
import '../../styles/app.css';
import React, { useEffect, useState } from 'react';
import handleFileUpload from './uploadPlaylist';

import { createRoot } from 'react-dom/client';
import { BuildingLibraryIcon } from '@heroicons/react/20/solid';

import type { ViewState } from '../../features/playlist/types';
import type { StoragePlaylist, Video } from '../../types/video';
import type { SidePanelSession } from '../../types/messages';

import { sendToBackground } from '../../utils/actions';
import { PlaybackCount, SnackSkeleton, WtList } from '../../features/playlist/components';
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';

function SidePanel() {
  const [panelView, setPanelView] = useState<ViewState>({
    view: 'PLAYLISTS',
    direction: 'back',
  });
  const [isLoading, setIsLoading] = useState(true);

  const [playlist, setPlaylist] = useState<Video[]>([]);
  const [multiPlaylist, setMultiPlaylist] = useState<StoragePlaylist>({});
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);

  const handleForwardView = (playlistId: string) => {
    const newState = { view: 'VIDEOS', playlistId, direction: 'forward' };
    sendToBackground({
      type: 'SET_SESSION',
      payload: newState as Partial<SidePanelSession>,
    });

    setPanelView(newState as ViewState);
    setPlaylist(multiPlaylist[playlistId]);
  };

  const handleBackView = () => {
    const newState: unknown = { view: 'PLAYLISTS', direction: 'back', playlistId: null };
    sendToBackground({ type: 'SET_SESSION', payload: newState as Partial<SidePanelSession> });
    setPanelView(newState as ViewState);
    // Reset currentVideo
    setCurrentVideo(null);
  };

  useEffect(() => {
    setIsLoading(true);

    sendToBackground({
      type: 'GET_ALL_PLAYLIST',
    })
      .then(async (r: any) => {
        let pl = r.playlists ?? {};
        setMultiPlaylist(pl);

        const session = await sendToBackground({ type: 'GET_SESSION' });

        return {
          session: session as Partial<SidePanelSession>,
          playlists: pl as StoragePlaylist,
        };
      })
      .then((d) => {
        const { session, playlists } = d!;
        if (session.view === 'PLAYLISTS') {
          setPanelView({ view: 'PLAYLISTS', direction: 'back' });
        }

        if (session.view === 'VIDEOS') {
          setPanelView({
            view: 'VIDEOS',
            playlistId: session.playlistId,
            direction: 'forward',
          } as ViewState);

          setPlaylist(playlists[session.playlistId!]);
        }
      })

      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const listener: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (
      changes,
      areaName,
    ) => {
      if (areaName !== 'local') return;

      if (changes.playlists?.newValue) {
        setMultiPlaylist(changes.playlists.newValue as StoragePlaylist);
      }

      if (changes.playlists?.newValue === undefined) {
        setMultiPlaylist({});
      }
    };

    chrome.storage.onChanged.addListener(listener);

    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  const handleActiveVideo = (video: Video) => {
    console.info(`[SIDE_PANEL] Selecting video: `, video);
    setCurrentVideo(video);
    sendToBackground({
      type: 'PLAY_VIDEO',
      payload: { videoId: video.id, index: video.currentIndex as number },
    });
  };

  const renderView = () => {
    return (
      <div
        className={`flex h-full w-full transition-transform ${
          panelView.view === 'PLAYLISTS'
            ? 'translate-x-0 ease-in duration-150'
            : '-translate-x-full ease-out duration-75'
        }`}
      >
        {/* PLAYLISTS VIEW */}
        <div className='w-full shrink-0 overflow-y-auto yt-scrollbar'>
          {isLoading ? (
            <SnackSkeleton items={12} />
          ) : (
            Object.entries(multiPlaylist).map(([plName, values]) => {
              return (
                <WtList
                  playList={[values[0]]}
                  imgVariant='stacked'
                  viewState={panelView}
                  playlistKey={plName}
                  chip={values.length}
                  onItemClick={() => handleForwardView(plName)}
                />
              );
            })
          )}
        </div>

        {/* VIDEOS VIEW */}
        <div className='w-full shrink-0 overflow-y-scroll overflow-x-hidden yt-scrollbar'>
          {isLoading ? (
            <SnackSkeleton items={12} />
          ) : (
            panelView.view === 'VIDEOS' && (
              <WtList
                activeVideoId={currentVideo?.id}
                playList={playlist}
                imgVariant='single'
                viewState={panelView}
                onItemClick={handleActiveVideo}
              />
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <main className='bg-yt-bg w-full h-lvh p-1 text-yt-text-primary'>
      <div className='relative flex flex-col min-w-3xs h-full bg-yt-bg shadow-lg border rounded-2xl border-yt-br_new  overflow-y-hidden'>
        {/* ------ SIDE_PANEL HEADER WITH RENDER CONDITIONS ----- */}
        <div className='flex items-center gap-2 justify-between py-4 px-1 bg-yt-bg-secondary w-full h-18'>
          <div className='flex flex-col'>
            <div className='flex items-center gap-2'>
              {panelView.view === 'VIDEOS' ? (
                <PlaybackCount
                  actionClick={handleBackView}
                  playlistId={panelView.playlistId}
                  totalItems={playlist.length}
                  activeVideoIndex={currentVideo?.currentIndex}
                />
              ) : (
                <>
                  <button className='relative overflow-hidden text-sm h-full font-medium p-2 rounded-full'>
                    <BuildingLibraryIcon className='w-6' />
                  </button>
                  <h2 className='text-base font-black truncate whitespace-normal line-clamp-1'>
                    Home WtLists
                  </h2>
                </>
              )}
            </div>
          </div>
          {/** BUTTON ACTIONS ON HEADER */}
          {panelView.view === 'PLAYLISTS' ? (
            <label className='flex gap-1 min-w-24 px-3 py-2 justify-around place-items-center cursor-pointer font-bold text-sm bg-yt-bg-tertiary rounded-full border border-yt-border hover:bg-yt-border'>
              <DocumentArrowUpIcon width={20} />
              Upload
              <input
                type='file'
                accept='.json'
                className='hidden'
                onChange={(ev) => handleFileUpload(ev, setPlaylist, setMultiPlaylist)}
              />
            </label>
          ) : (
            <button className='py-2 px-3 rounded-2xl ring ring-yt-border'></button>
          )}
          {/** ----------------------- */}
        </div>

        {/* VIEW STATE */}
        <aside className='h-full overflow-hidden'>{renderView()}</aside>
      </div>
    </main>
  );
}
const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <SidePanel />
  </React.StrictMode>,
);
