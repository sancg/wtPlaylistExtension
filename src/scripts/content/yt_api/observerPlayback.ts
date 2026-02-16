const wtPlaybackObserver = (timer: number, indexVideo?: number) => {
  let videoEl: HTMLVideoElement | null = null;
  let currentVideoId: string | null = null;
  let signal = false;

  function attachPlaybackObserver() {
    cleanUpEvents();

    setTimeout(() => {
      videoEl = document.querySelector('video.html5-main-video');
      currentVideoId = getCurrentVideoId();
      signal = false;

      console.log({ videoEl, currentVideoId, signal });
      if (!videoEl) return;
      videoEl.addEventListener('timeupdate', onTimeUpdate);
      videoEl.addEventListener('ended', onEnded);
    }, timer);
  }

  function onTimeUpdate() {
    if (!videoEl || signal) return;

    const remaining = videoEl.duration - videoEl.currentTime;
    if (remaining <= 1) {
      signal = true;
      notifyFinish();
    }
  }

  function onEnded() {
    if (signal) return;
    signal = true;
    notifyFinish();
  }

  // -------------------------
  // HELPERS
  // -------------------------
  function notifyFinish() {
    if (!currentVideoId) return;

    chrome.runtime.sendMessage({
      type: 'VIDEO_PL_ENDED',
      payload: { videoId: currentVideoId, timestamp: Date.now(), indexVideo },
    });

    cleanUpEvents();
  }

  function cleanUpEvents() {
    console.info(`[CS] video observer cleanUpEvents`);
    if (!videoEl) return;

    videoEl.removeEventListener('timeupdate', onTimeUpdate);
    videoEl.removeEventListener('ended', onEnded);
    videoEl = null;
  }

  function getCurrentVideoId(): string | null {
    const url = new URL(window.location.href);

    // Standard watch URLs
    const v = url.searchParams.get('v');
    if (v) return v;

    // Shorts fallback
    if (url.pathname.startsWith('/shorts/')) {
      return url.pathname.split('/shorts/')[1] ?? null;
    }

    return null;
  }

  attachPlaybackObserver();
};

export default wtPlaybackObserver;
