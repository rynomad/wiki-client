chrome.extension.onRequest.addListener(function(request, sender) {
  if (request.redirect)
    chrome.tabs.update(sender.tab.id, {url: request.redirect});
});
