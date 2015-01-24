link = require "../link"

console.log("adding event listener")

document.addEventListener("wikDrop", (e) ->
  console.log("dropListener!",e)
  page = e.detail.page
  site = e.detail.site
  chrome.runtime.sendMessage({put:"thisPage",options:{slug: wiki.asSlug(page.title), page:page}}, (res) ->
    console.log("response?")

    link.showPage(wiki.asSlug(page.title), site)
  )
)
