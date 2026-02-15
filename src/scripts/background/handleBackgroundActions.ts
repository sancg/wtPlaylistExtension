import { CoordinatorActionMap, SidePanelSession } from '../../types/messages';
import { StoragePlaylist } from '../../types/video';

const DEFAULT_SESSION: SidePanelSession = {
  view: 'PLAYLISTS',
};

let sidePanelOpen = false;

type Handler<K extends keyof CoordinatorActionMap> = (
  msg: CoordinatorActionMap[K],
  sender: chrome.runtime.MessageSender,
  sendResponse: (res?: any) => void,
) => void | true;

const Handlers: { [K in keyof CoordinatorActionMap]: Handler<K> } = {
  GET_SESSION: (_, __, sendResponse) => {
    chrome.storage.session.get('session', (res) => {
      sendResponse(res.session ?? DEFAULT_SESSION);
    });
    return true;
  },

  SET_SESSION: (msg) => {
    chrome.storage.session.get('session', (res) => {
      chrome.storage.session.set({
        session: { ...(res.session ?? DEFAULT_SESSION), ...msg.payload },
      });
    });
    return true;
  },

  // --------------- VIDEO MANAGER --------------- //
  PLAY_VIDEO: (msg) => {
    const { payload } = msg;
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id) chrome.tabs.sendMessage(tab.id, { action: 'play_video', payload });
    });
    return true;
  },

  VIDEO_CHANGED: (msg) => {
    if (sidePanelOpen) {
      chrome.runtime.sendMessage(msg);
    }
  },

  VIDEO_PL_ENDED: (msg) => {
    console.log(`[BG ACTIONS] signal event: VIDEO_ENDED`, msg);
    // IMPROVE: Workflow at this point should include index
    (async () => {
      const activePl = await chrome.storage.local.get('');
      console.log(activePl);
    })();
  },

  SIDE_PANEL_OPEN: (msg) => {
    console.info(`[BG ACTIONS] signal that side_panel is open`);
    chrome.storage.sync;
    sidePanelOpen = msg.payload.open;
  },

  // -------------- PLAYLISTS MANAGER ----------------- //
  GET_ALL_PLAYLIST: (_, __, sendResponse) => {
    chrome.storage.local.get('playlists').then((playlists) => {
      console.info(`[BG ACTIONS] getting all playlists: `, playlists);
      sendResponse((playlists as StoragePlaylist) || {});
    });

    return true;
  },

  UPLOAD_PLAYLIST: (msg, _, sendResponse) => {
    (async () => {
      try {
        const { name, playlist } = msg.payload;
        const result = await chrome.storage.local.get('playlists');
        const playlists = (result.playlists ?? {}) as StoragePlaylist;

        const updated: StoragePlaylist = { ...playlists, [name]: playlist };
        await chrome.storage.local.set({ playlists: updated });

        sendResponse({ status: 'ok' });
      } catch (error) {
        sendResponse({ error: String(error) });
      }
      console.info('[BG ACTIONS] Update playlists:', await chrome.storage.local.get(null));
    })();

    return true;
  },

  REMOVE_PLAYLIST: (msg, _, sendResponse) => {
    (async () => {
      const { key } = msg.payload;
      try {
        const result = await chrome.storage.local.get('playlists');
        const playlists = (result.playlists ?? {}) as StoragePlaylist;
        if (!playlists) {
          return; // IMPROVE: Design a consisten error handling for each action type.
        }

        delete playlists[key];
        await chrome.storage.local.set({ playlists });

        sendResponse({ status: 'ok' });
      } catch (error) {
        if (chrome.runtime.lastError) {
          console.info(
            `error removing playlist ${key} with reference:\n${chrome.runtime.lastError}`,
            error,
          );
          sendResponse({ status: String(error) });
        }
        console.error(error);
      }
    })();
    return true;
  },
};

export default Handlers;
