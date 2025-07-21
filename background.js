const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 минут

chrome.runtime.onInstalled.addListener(() => {
  console.log("Tab Butler установлен.");
  chrome.alarms.create("checkIdleTabs", { periodInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkIdleTabs") {
    chrome.tabs.query({}, (tabs) => {
      const now = Date.now();

      chrome.storage.local.get(["tabData", "closedTabs"], (result) => {
        const tabData = result.tabData || {};
        const closedTabs = result.closedTabs || [];

        tabs.forEach((tab) => {
          const lastAccess = tabData[tab.id]?.lastAccess || now;
          const priority = tabData[tab.id]?.priority || "medium";

          if (priority !== "high" && now - lastAccess > IDLE_TIMEOUT) {
            closedTabs.unshift({
              url: tab.url,
              title: tab.title,
              closedAt: now,
            });
            if (closedTabs.length > 100) closedTabs.pop();

            chrome.tabs.remove(tab.id);
          }
        });

        chrome.storage.local.set({ closedTabs });
      });
    });
  }
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  updateTabAccess(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "complete") {
    updateTabAccess(tabId);
  }
});

function updateTabAccess(tabId) {
  chrome.storage.local.get("tabData", (result) => {
    const tabData = result.tabData || {};
    if (!tabData[tabId]) tabData[tabId] = {};
    tabData[tabId].lastAccess = Date.now();
    chrome.storage.local.set({ tabData });
  });
}