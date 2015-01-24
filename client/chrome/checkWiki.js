console.log("checkwiki?")
if (document.getElementsByTagName("title")[0].getAttribute("class") === "wiki"){
  console.log("is wiki")
  document.getElementsByTagName("title")[0].setAttribute("class","wiki-extension-enabled")
  document.addEventListener("getPage", function(e){
    var returns = e.detail
    chrome.runtime.sendMessage({
      get: "page",
      options: e.detail
    }, function(res) {
      returns.page = res.page
      returns.site = res.site
      returns.err = res.err
      document.dispatchEvent(new CustomEvent("returnPage", {detail: returns}))
    });
  })
  document.addEventListener("getSitemap", function(e){
    console.log("getSitemap", e.detail)
    var returns ={
      site: e.detail.site
    }
    chrome.runtime.sendMessage({
      get: "sitemap",
      options: e.detail
    }, function(res) {
      console.log("got sitemap response", res, e, returns)
      returns.sitemap = res.sitemap
      returns.err = res.err
      document.dispatchEvent(new CustomEvent("returnSitemap", {detail: returns}))
    });
  })
  document.addEventListener("getFavicon", function(e){
    console.log("getFavicon")
    if (!e.detail.remote){
      e.detail.remote = location.host
    }
    var returns = e.detail
    chrome.runtime.sendMessage({
      get: "favicon",
      options: e.detail
    }, function(res) {
      console.log("got favicon response", res)
      returns.favicon = res.favicon
      returns.site = e.detail.site
      returns.err = res.err
      document.dispatchEvent(new CustomEvent("returnFavicon", {detail: returns}))
    });
  })

}
