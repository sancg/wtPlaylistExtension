import { ThumbList, Video } from '../../types/video';

(() => {
  // -------------------------
  // TYPES
  // -------------------------
  type VideoStateEvent = {
    source: 'ytps-content';
    type: 'update_state';
    exists: boolean;
    videoId: string;
  };

  type YoutubeButtonOpts = {
    id: string;
    icon: string;
    activeIcon?: string;
    tooltip: string;
    activeTooltip?: string;
    isActive?: boolean;
    onClick?: () => void;
  };

  // --------------------------
  // Button Factory
  // --------------------------
  const heart = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
</svg>
`;

  const heartAdded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
  <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
</svg>
`;

  function createYTbutton({
    id,
    icon,
    activeIcon,
    tooltip,
    activeTooltip,
    isActive = false,
    onClick,
  }: YoutubeButtonOpts): HTMLButtonElement {
    const btn = document.createElement('button');

    btn.id = id;
    btn.type = 'button';
    btn.className = 'yt-native-btn';
    btn.innerHTML = isActive && activeIcon ? activeIcon : icon;
    btn.title = isActive && activeTooltip ? activeTooltip : tooltip;

    btn.style.border = 'none';
    btn.style.display = 'inline-flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.width = '40px';
    btn.style.height = '36px';
    btn.style.marginRight = '8px';
    btn.style.borderRadius = '2rem';
    btn.style.cursor = 'pointer';
    btn.style.color = '#fff';
    btn.style.background = 'rgba(255,255,255,0.1)';

    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(255,255,255,0.2)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(255,255,255,0.1)';
    });

    if (onClick) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      });
    }
    return btn;
  }

  // Styles on Animation
  // -----------------------------------
  function injectYouTubeButtonStyles() {
    if (document.getElementById('yt-fav-btn-styles')) return;

    const style = document.createElement('style');
    style.id = 'yt-fav-btn-styles';
    style.textContent = `
    @keyframes yt-like-pop {
      0%   { transform: scale(1); }
      30%  { transform: scale(1.15); }
      55%  { transform: scale(0.95); }
      100% { transform: scale(1); }
    }

    .yt-like-animate {
      animation: yt-like-pop 300ms cubic-bezier(0.22, 1, 0.36, 1);
    }

    .yt-icon-color {
      border: 1px solid #3f3f3f !important;
      transition: color 250ms ease-in-out;
    }
  `;
    document.head.appendChild(style);
  }

  function animationTrigger(btn: HTMLButtonElement, active: boolean) {
    console.log({ prev: active, check: !active });
    // Toggle Icon appearance
    btn.innerHTML = `<span class="yt-icon" style="width: 100%;height: 26px;">${
      !active ? heartAdded : heart
    }</span>`;
    btn.title = !active ? 'Saved on Local' : 'Add to Local';
    btn.style.color = !active ? '#fff' : '#fff';

    // retrigger animation safely
    btn.classList.remove('yt-like-animate');
    btn.classList.remove('yt-icon-color');
    void btn.offsetWidth; // force reflow (important)
    btn.classList.add('yt-like-animate');
    btn.classList.add('yt-icon-color');
  }

  // --------------------------------
  // Render logic
  // --------------------------------
  /**
   * Renders the button style and update its state depending on the events send by [CS]
   */

  function renderButton(isSaved: boolean) {
    // Track current state
    const BUTTON_ID = 'ytps-fav-btn';
    let button: HTMLButtonElement | null = document.getElementById(
      BUTTON_ID,
    ) as HTMLButtonElement;

    // If button exists, update it
    if (button) {
      console.log(`[BUTTON] Updating state: `, { button, isSaved });
      updateButtonState(button, isSaved, heartAdded, heart);
      return;
    }

    waitForContainer((container) => {
      injectYouTubeButtonStyles();
      button = createYTbutton({
        id: BUTTON_ID,
        icon: heart,
        isActive: isSaved,
        activeIcon: heartAdded,
        tooltip: 'Add to local',
      });

      button.onclick = async () => {
        await sendVideoMessage(button!, isSaved);
      };

      console.log('[BUTTON] First injection button: ', { button, isSaved });
      container.prepend(button);
    });
  }

  // ----------------------------------
  // Helpers
  // ----------------------------------
  function waitForContainer(cb: (el: HTMLElement) => void) {
    const tryFind = () => {
      const container = document.querySelector<HTMLElement>(
        '#actions #actions-inner > #menu > ytd-menu-renderer',
      );

      if (container) {
        cb(container);
      } else {
        setTimeout(tryFind, 500);
      }
    };

    tryFind();
  }

  function updateButtonState(
    btn: HTMLButtonElement,
    isSaved: boolean,
    activeIcon: string,
    icon: string,
  ) {
    btn.onclick = async () => {
      await sendVideoMessage(btn, isSaved);
    };

    btn.innerHTML = `<span class="yt-icon" style="width: 100%;height: 26px;">${
      isSaved ? activeIcon : icon
    }</span>`;
    btn.title = isSaved ? 'Saved on Local' : 'Add to Local';
    btn.style.color = isSaved ? '#fff' : '#fff';
  }

  // Extractor functions
  // -----------------------------------------
  async function sendVideoMessage(btnAction: HTMLButtonElement, active: boolean) {
    const url = window.location.href;
    const id = new URL(url).searchParams.get('v');
    animationTrigger(btnAction, active);

    try {
      let video: Video = { id: id!, url, title: '', thumbImg: '' };
      btnAction.disabled = true;

      if (active) {
        console.log(`[BUTTON] Removing video from store`);
        // Notify contentScript to store the video
        window.postMessage(
          {
            source: 'ytps-injector',
            action: 'remove_video',
            payload: { id },
          },
          '*',
        );

        return;
      }

      console.log('[BUTTON] Get single video');
      const meta = await getVideoMetaData(id!);
      if (meta) {
        video = meta;
      } else {
        console.log(`[BUTTON] Fallback to DOM extraction`);
        video = getVideoFromDOM(id!);
      }

      // Notify contentScript to store the video
      window.postMessage(
        {
          source: 'ytps-injector',
          action: 'add_video',
          payload: { video },
        },
        '*',
      );
    } catch (error) {
      console.error(`[BUTTON] Error while getting metadata -> updateStateFunc: ${error}`);
    } finally {
      btnAction.disabled = false; // NOTE: Would this be trigger if we have an early return?
    }
  }

  const getVideoFromDOM = (id: string): Video => {
    const url = location.href;
    const title = document.querySelector('h1.ytd-watch-metadata')?.textContent?.trim() || '';
    const thumbImg = `https://i.ytimg.com/vi/${id}/hqdefault.jpg` || '';
    const publishedBy = document
      .querySelector('#channel-name div.ytd-channel-name a')
      ?.textContent?.trim();

    return { id, title, url, thumbImg, publishedBy, addedAt: Date.now() };
  };

  const getVideoMetaData = async (videoId: string) => {
    let video: Video = { id: videoId, title: '', url: '', thumbImg: '' };
    try {
      const req = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
      const html = await req.text();

      const playerMatch = html.match(/var ytInitialPlayerResponse = ({.+?});/);
      if (!playerMatch) return null;

      // Extraction ---------------
      const { videoDetails } = JSON.parse(playerMatch[1]);
      const thumbs: ThumbList[] = videoDetails.thumbnail.thumbnails;

      video.title = videoDetails.title;
      video.url = `https://www.youtube.com/watch?v=${videoId}`;
      video.publishedBy = videoDetails.author;
      video.thumbImg = thumbs[0].url;
      video.thumbnailList = thumbs;

      const lengthSeconds = videoDetails.lengthSeconds;
      let SEC: string | number = lengthSeconds % 60;
      const MIN = (lengthSeconds - SEC) / 60;

      SEC = SEC < 10 ? '0' + SEC : SEC;
      video.timeLength = `${MIN}:${SEC}`;
    } catch (err) {
      console.warn(`[VIDEO META] Something happen on the "wt" request: ${err}`);
      return null;
    }

    return video;
  };

  // ----------------------------
  // Message Listener
  // ----------------------------
  /**
   * Listen for messages coming from contentScript
   */
  window.addEventListener('message', (ev) => {
    const msg = ev.data;

    // ensure message comes from contentScript
    if (!msg || msg.source !== 'ytps-content') return;

    // contentScript → injector : provide new video state
    if (msg.type === 'update_state') {
      const { exists } = msg as VideoStateEvent;
      console.log(msg.payload);
      renderButton(exists);
    }

    // contentScript → injector : user clicked “add” inside popup
    if (msg.type === 'user-click-add') {
      console.log('[Injector] Received add trigger from popup');
      simulateClick();
    }
  });

  /**
   * When popup triggers add_video, mimic a click on the YT button
   */
  function simulateClick() {
    // Track current state
    const BUTTON_ID = 'ytps-fav-btn';
    let button: HTMLButtonElement | null = document.getElementById(
      BUTTON_ID,
    ) as HTMLButtonElement;

    if (!button) return;
    button.click();
  }
})();
