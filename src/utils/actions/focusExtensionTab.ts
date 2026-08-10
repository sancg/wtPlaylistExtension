export default async function focusExtensionTab(
  extensionUrl: string,
  currentWindowId: number,
) {
  // Find if a tab with your extension's page is already open
  const [tab] = await chrome.tabs.query({ url: extensionUrl });

  if (tab?.id) {
    // // 1) Focus/restore the window
    if (typeof tab.windowId === 'number' && tab.windowId !== currentWindowId) {
      await chrome.windows.update(tab.windowId, {
        focused: true,
        state: 'normal',
        drawAttention: true,
      });
    }

    if (typeof tab.id === 'number') {
      await chrome.tabs.update(tab.id, { active: true, highlighted: true });
    } else if (typeof tab.index === 'number' && typeof tab.windowId === 'number') {
      // Fallback: highlight by index if id is missing (rare)
      await chrome.tabs.highlight({ windowId: tab.windowId, tabs: tab.index });
    }

    return tab;
  }

  // Otherwise, open a new tab with the extension page
  return await chrome.tabs.create({ url: extensionUrl });
}
