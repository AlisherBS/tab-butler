let allTabs = [];
let tabDataCache = {};

function renderTabs(sortBy = "title") {
  const container = document.getElementById("tabs");
  container.innerHTML = "";

  let sortedTabs = [...allTabs];

  if (sortBy === "title") {
    sortedTabs.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === "lastAccess") {
    sortedTabs.sort((a, b) => (tabDataCache[b.id]?.lastAccess || 0) - (tabDataCache[a.id]?.lastAccess || 0));
  } else if (sortBy === "priority") {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    sortedTabs.sort((a, b) => {
      const pa = priorityOrder[tabDataCache[a.id]?.priority || "medium"];
      const pb = priorityOrder[tabDataCache[b.id]?.priority || "medium"];
      return pa - pb;
    });
  }

  sortedTabs.forEach((tab) => {
    const div = document.createElement("div");
    div.className = "tab-entry";
    div.textContent = tab.title;
    const select = document.createElement("select");
    ["low", "medium", "high"].forEach((level) => {
      const option = document.createElement("option");
      option.value = level;
      option.text = level;
      if (tabDataCache[tab.id]?.priority === level) option.selected = true;
      select.appendChild(option);
    });
    select.onchange = () => setPriority(tab.id, select.value);
    div.appendChild(select);
    container.appendChild(div);
  });
}

function setPriority(tabId, priority) {
  chrome.storage.local.get(["tabData"], (result) => {
    const tabData = result.tabData || {};
    if (!tabData[tabId]) tabData[tabId] = {};
    tabData[tabId].priority = priority;
    chrome.storage.local.set({ tabData });
    tabDataCache[tabId] = tabData[tabId];
    renderTabs(document.getElementById("sortSelect").value);
  });
}

document.getElementById("sortSelect").onchange = (e) => {
  renderTabs(e.target.value);
};

chrome.tabs.query({}, (tabs) => {
  allTabs = tabs;
  chrome.storage.local.get(["tabData"], (result) => {
    tabDataCache = result.tabData || {};
    renderTabs(document.getElementById("sortSelect").value);
  });
});

chrome.storage.local.get("closedTabs", (result) => {
  const closedTabs = result.closedTabs || [];
  const container = document.getElementById("closed-tabs");

  closedTabs.slice(0, 10).forEach((entry, index) => {
    const div = document.createElement("div");
    div.className = "tab-entry";
    div.textContent = `${entry.title}`;
    const btn = document.createElement("button");
    btn.textContent = "Открыть";
    btn.onclick = () => {
      chrome.tabs.create({ url: entry.url });
    };
    div.appendChild(btn);
    container.appendChild(div);
  });
});

document.getElementById("restoreAllBtn").onclick = () => {
  chrome.storage.local.get("closedTabs", (result) => {
    const closedTabs = result.closedTabs || [];
    closedTabs.forEach((entry) => {
      chrome.tabs.create({ url: entry.url });
    });
  });
};

// Экспорт и импорт данных

document.getElementById("exportBtn").onclick = () => {
  chrome.storage.local.get(["tabData", "closedTabs"], (result) => {
    const json = JSON.stringify(result, null, 2);
    document.getElementById("dataArea").value = json;
  });
};

document.getElementById("importBtn").onclick = () => {
  try {
    const data = JSON.parse(document.getElementById("dataArea").value);
    chrome.storage.local.set(data, () => {
      alert("Данные успешно импортированы!");
    });
  } catch (e) {
    alert("Ошибка при импорте: некорректный JSON");
  }
};
