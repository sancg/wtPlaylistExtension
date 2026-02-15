type BgHandler<K extends keyof CoordinatorActionMap> = (
  payload: CoordinatorActionMap[K]['payload'],
  sender: chrome.runtime.MessageSender,
  sendResponse: (res: any) => void,
) => Promise<CoordinatorActionMap[K]['response']>;

// NOTE: I have some issues with the UI type ViewState and this one so cast conversion was done on sidePanel
type SidePanelSession = {
  view: 'PLAYLISTS' | 'VIDEOS';
  playlistId?: string;
  activeVideoId?: string;
};

type CoordinatorActionMap = {
  GET_SESSION: { type: 'GET_SESSION' };
  SET_SESSION: { type: 'SET_SESSION'; payload: Partial<SidePanelSession> };
  PLAY_VIDEO: { type: 'PLAY_VIDEO'; payload: { videoId: string; index: number } };
  VIDEO_PL_ENDED: { type: 'VIDEO_PL_ENDED'; payload: { videoId: string; timestamp?: number } };
  VIDEO_CHANGED: { type: 'VIDEO_CHANGED'; payload: { videoId: string } };
  SIDE_PANEL_OPEN: { type: 'SIDE_PANEL_OPEN'; payload: { open: boolean } };

  // ---------------------------------
  // PLAYLIST MANAGER
  // ---------------------------------
  GET_ALL_PLAYLIST: {
    type: 'GET_ALL_PLAYLIST';
    payload?: void;
    response?: {
      playlists: StoragePlaylist;
    };
  };

  UPLOAD_PLAYLIST: {
    type: 'UPLOAD_PLAYLIST';
    payload: {
      name: string;
      playlist: Video[];
    };
    response?: {
      status: 'ok';
    };
  };

  REMOVE_PLAYLIST: {
    type: 'REMOVE_PLAYLIST';
    payload: { key: string };
    response?: { status: 'ok' };
  };
};

type CoordinatorMessage = CoordinatorActionMap[keyof CoordinatorActionMap];

export { SidePanelSession, CoordinatorActionMap, CoordinatorMessage, BgHandler };
