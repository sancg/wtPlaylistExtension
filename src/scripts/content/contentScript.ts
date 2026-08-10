import buildContentPlaylist from './yt_api/buildPlayList';
import wtPlaybackObserver from './yt_api/observerPlayback';
console.log('[ContentScript] Loaded...');

let currentVideoId: string | null = null;
void handleNavigation(location.href);

// Handle injection button on navigation changes
async function handleNavigation(url: string) {
  const nextId = new URL(url).searchParams.get('v');

  console.log('[CS] Navigation detected.', { nextId });
  if (!nextId || nextId === currentVideoId) return;
  currentVideoId = nextId;

  const msg = { type: 'is_saved', payload: { currentId: nextId } };
  // Ask background if video is saved
  const res = await chrome.runtime.sendMessage(msg);

  // Notify UI injector script
  window.postMessage(
    {
      source: 'ytps-content',
      type: 'update_state',
      exists: res.exists,
      videoId: currentVideoId,
    },
    '*',
  );
}
// ----------------------------
// Listen to extension messages
// ----------------------------
chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
  if (!req.action) {
    console.log('No action available', req);
    return;
  }

  console.log(`[CS] action registered: `, req);
  switch (req.action) {
    case 'url_change':
      console.log('[CS] re-injecting button state from ', req.payload.listener);
      const url = req.payload.tab.url; // Info received from BG

      void handleNavigation(url);
      return;

    case 'playback_tracker':
      console.log('[CS] tracking video from selected playlist', req);
      void wtPlaybackObserver(300, req.payload.playVideo?.index);
      return;

    case 'add_video':
      injectAddVideo();
      return true;

    case 'extract_pl':
      (async () => {
        try {
          const result = await buildContentPlaylist(document);
          sendResponse(result);
        } catch (error) {
          console.error('[CS] extraction failed', error);
          sendResponse({ playlist: [], skipVideos: [], error: String(error) });
        }
      })();

      return true;
    case 'play_video':
      const { videoId, index } = req.payload;
      chrome.runtime.sendMessage({
        type: 'VIDEO_PLAYBACK',
        payload: { playVideo: { videoId, index } },
      });
      const a = document.createElement('a');
      a.href = `/watch?v=${videoId}`;
      a.click();
      a.remove();

      return;
    default:
      console.info('Action not registered', req.action);
      return { success: true };
  }
});

// Ask injector script to add the current video
function injectAddVideo() {
  console.log('[CS] Add video fired up');
  window.postMessage({ source: 'ytps-content', type: 'add_video' }, '*');
}

window.addEventListener('message', (ev) => {
  const msg = ev.data;
  if (!msg || msg.source !== 'ytps-injector') return;

  if (msg.action === 'add_video') {
    console.log('[Injector] Request action: "add_video"', msg);

    // Notify to the background if it could be saved
    chrome.runtime
      .sendMessage({ type: 'add_video', payload: { video: msg.payload.video } })
      .then((r) => {
        const msg = {
          source: 'ytps-content',
          type: 'update_state',
          exists: r.exists,
        };

        window.postMessage(msg); // The inject button receives the update
      });
  }
  if (msg.action === 'remove_video') {
    console.log(`[Injector] Request action: "remove_video"`, msg);

    chrome.runtime
      .sendMessage({ type: 'remove_video', payload: { id: msg.payload.id } })
      .then((r) => {
        const msg = {
          source: 'ytps-content',
          type: 'update_state',
          exists: false,
          payload: r,
        };

        window.postMessage(msg);
      });
  }
});
