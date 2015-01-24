chrome.tabs.onUpdated.addListener(function (id, info, tab) {
    console.log("tab updated")
    // decide if we're ready to inject content script
    if (tab.status !== "complete") {
      console.log("not yet");
      return;
    } else {
      console.log("script?")
      chrome.tabs.executeScript(tab.id, {"file": 'chrome/checkWiki.js'})
    }
})
