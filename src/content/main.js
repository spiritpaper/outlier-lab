// Routes YouTube's single-page navigations to the right feature.
(async () => {
  let lastUrl = null;

  function route() {
    if (location.href === lastUrl) return;
    lastUrl = location.href;

    const type = YTK.pageType();
    if (type === 'watch') {
      YTK.watchPanel.show(new URLSearchParams(location.search).get('v'), { floating: false });
    } else if (type === 'shorts') {
      YTK.watchPanel.show(location.pathname.split('/')[2], { floating: true });
    } else {
      YTK.watchPanel.remove();
    }
    YTK.channelPanel.syncFab();
    YTK.badges.scanSoon();
  }

  const { signal, stop } = YTK; // this copy's, even after a newer copy takes over YTK
  await YTK.loadSettings();
  document.addEventListener('yt-navigate-finish', route, { signal });
  // Shorts swipes and some navigations don't always fire yt-navigate-finish.
  // Also notices when the extension was updated or removed under this tab,
  // and then takes this copy's UI down instead of leaving it broken.
  YTK.every(() => {
    if (!YTK.alive()) return stop();
    YTK.sweep(); // an old copy's panel, added after an update
    route();
  }, 1000);
  document.addEventListener('ytk-settings-changed', () => {
    lastUrl = null;
    route();
  }, { signal });

  route();
  YTK.badges.start();
})();
