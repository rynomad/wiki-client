console.log("checkwiki?")
if (document.getElementsByClassName("searchbox").length
    && document.getElementsByClassName("neighborhood").length
    && document.getElementsByClassName("login").length){
  var href = "chrome-extension://" + chrome.i18n.getMessage("@@extension_id") + "/index.html#" + location.pathname;
  href = href.replace("view", location.host);
  console.log(href)
  chrome.extension.sendRequest({redirect: href});
}
