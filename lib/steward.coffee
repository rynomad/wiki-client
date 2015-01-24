Steward = ->
  this
pageFromLocalStorage = (slug) ->
  if json = localStorage[slug]
    JSON.parse json
  else
    `undefined`
newPage = require("./page.coffee").newPage
random = require("./random.coffee")
lineup = require("./lineup.coffee")
revision = require("./revision.coffee")


deepCopy = (object) ->
  JSON.parse JSON.stringify object


Steward::get = (asset, options, callback) ->
  asset = asset.charAt(0).toUpperCase() + asset.toLowerCase().substr(1)
  if this["get" + asset]
    this["get" + asset] options, callback
  else
    console.log "don't know how to get " + asset
  this

Steward::put = (asset, options, callback) ->
  asset = asset.charAt(0).toUpperCase() + asset.toLowerCase().substr(1)
  if this["put" + asset]
    this["put" + asset] options, callback
  else
    console.log "don't know how to put " + asset
  this

pushToLocal = undefined
pushToServer = undefined
Steward::useLocalStorage = ->
  $(".login").length > 0

Steward::putPage = (options, callback) ->
  console.log "steward.putPage"
  action = options.action
  pagePutInfo = options.pagePutInfo
  $page = options.page
  if @useLocalStorage() or options.pagePutInfo.site is "local"
    page = undefined
    site = undefined
    if action.type is "create"
      page =
        title: action.item.title
        story: []
        journal: []
    else
      page = lineup.atKey($page.data("key")).getRawPage()
      pageObject = newPage(page, "local")
      pageObject.apply action
      console.log "page", page
      page.journal = []  unless page.journal?
      if (site = action["fork"])?
        page.journal = page.journal.concat(
          type: "fork"
          site: site
          date: (new Date()).getTime()
        )
        delete action["fork"]
    page.journal = page.journal.concat(action)
    localStorage[pagePutInfo.slug] = JSON.stringify(page)
    callback $page, action
    $page.addClass "local"
  else
    console.log "trying put"
    bundle = undefined
    pageObject = undefined
    bundle = deepCopy(action)
    pageObject = lineup.atKey($page.data("key"))
    bundle.item = deepCopy(pageObject.getRawPage())  if action.type is "fork"
    $.ajax
      type: "PUT"
      url: "/page/" + pagePutInfo.slug + "/action"
      data:
        action: JSON.stringify(bundle)

      success: ->
        pageObject.apply action  if (if pageObject? then pageObject.apply else undefined)
        callback $page, action
        localStorage.removeItem $page.attr("id")  if action.type is "fork"

      error: (xhr, type, msg) ->
        console.log "pageHandler.put ajax error callback", type, msg
        action.error =
          type: type
          msg: msg

        pushToLocal $page, pagePutInfo, action


Steward::putFavicon = (options, callback) ->
  console.log options
  $.post "/favicon.png",
    image: options.favicon
  , (data) ->
    console.log data

  return

Steward::getFavicon = (options, callback) ->
  url = (if options.remote then "http://" + options.remote else "")
  url += "/favicon-url.png"
  $.ajax url,
    cache: true
    success: (res, status) ->
      callback null,
        req: options
        favicon: "data:image/png;base64," + res

      return

    error: (err) ->
      console.log "error getting favicon, try", url.split("-url").join("")
      callback null,
        req: options
        favicon: url.split("-url").join("")

      return

  return

Steward::getPage = (_arg) ->
  Self = this
  localContext = undefined
  localPage = undefined
  pageInformation = undefined
  rev = undefined
  site = undefined
  slug = undefined
  url = undefined
  whenGotten = undefined
  whenNotGotten = undefined
  pageInformation = _arg.pageInformation
  whenGotten = _arg.whenGotten
  whenNotGotten = _arg.whenNotGotten
  localContext = _arg.localContext

  slug = pageInformation.slug
  rev = pageInformation.rev
  site = pageInformation.site

  console.log rev, "!!!!!!!!!!!"
  if site
    localContext = []
  else
    site = localContext.shift()
  site = "origin"  if site is window.location.host
  site = null  if site is "view"
  if site?
    if site is "local"
      if localPage = pageFromLocalStorage(pageInformation.slug)
        return whenGotten(newPage(localPage, "local"))
      else
        return whenNotGotten()
    else
      if site is "origin"
        url = "/" + slug + ".json"
      else
        url = "http://" + site + "/" + slug + ".json"
  else
    url = "/" + slug + ".json"
  $.ajax
    type: "GET"
    dataType: "json"
    url: url + ("?random=" + (random.randomBytes(4)))
    success: (page) ->
      page = revision.create(rev, page)  if rev
      whenGotten newPage(page, site)

    error: (xhr, type, msg) ->
      troublePageObject = undefined
      if (xhr.status isnt 404) and (xhr.status isnt 0)
        console.log "pageHandler.get error", xhr, xhr.status, type, msg
        troublePageObject = newPage(
          title: "Trouble: Can't Get Page"
        , null)
        troublePageObject.addParagraph "The page handler has run into problems with this   request.\n<pre class=error>" + (JSON.stringify(pageInformation)) + "</pre>\nThe requested url.\n<pre class=error>" + url + "</pre>\nThe server reported status.\n<pre class=error>" + xhr.status + "</pre>\nThe error type.\n<pre class=error>" + type + "</pre>\nThe error message.\n<pre class=error>" + msg + "</pre>\nThese problems are rarely solved by reporting issues.\nThere could be additional information reported in the browser's console.log.\nMore information might be accessible by fetching the page outside of wiki.\n<a href=\"" + url + "\" target=\"_blank\">try-now</a>"
        return whenGotten(troublePageObject)
      if localContext.length > 0
        Self.getPage
          pageInformation: pageInformation
          whenGotten: whenGotten
          whenNotGotten: whenNotGotten
          localContext: localContext

      else if page = localStorage[slug]
        whenGotten(newPage(JSON.parse(page),"local"))
      else
        whenNotGotten()
      return


Steward::getFactories = (options, callback) ->
  $.getJSON "/system/factories.json", (data) ->
    callback null, data
    return

  return

Steward::getIcons = (options, callback) ->
  url = "/images/external-link-ltr-icon.url"
  $.ajax url,
    cache: true
    success: (res, status) ->
      callback null,
        externalLink: "data:image/png;base64," + res

      return

    error: (err) ->
      callback err, null
      return

  return

Steward::getSitemap = (options, callback) ->
  request = undefined
  sitemapUrl = undefined
  site = options.site
  sitemapUrl = "http://" + site + "/system/sitemap.json"
  request = $.ajax(
    type: "GET"
    dataType: "json"
    url: sitemapUrl
  )
  request.done((data) ->
    callback null, data
    return
  ).fail (data) ->
    callback new Error("fetch sitemap failed"), null
    return

  return

Steward::getScript = (options, callback) ->
  request = $.ajax(options)
  request.done((data) ->
    callback null, data
    return
  ).fail (data) ->
    callback new Error("fetch sitemap failed"), null
    return

  return

callbacks = []

setTimeout( ()->

    console.log("checking", document.getElementsByTagName("title")[0].getAttribute("class"))
    if document.getElementsByTagName("title")[0].getAttribute("class") == "wiki-extension-enabled"
      pageCallbacks = []
      sitemapCallbacks = []
      faviconCallbacks = []

      window.document.addEventListener("returnSitemap", (e) ->
        console.log("got returnSitemap event!", e, sitemapCallbacks)
        for arg, i in sitemapCallbacks
          console.log arg.site, e.detail.site
          if arg.site == e.detail.site
            sitemapCallbacks.splice(i, 1)
            if e.detail.err
              return arg.callback(e.detail.err, null)
            else
              return arg.callback(null, e.detail.sitemap)
      )

      window.document.addEventListener "returnFavicon", (e) ->
        console.log("got returnFavicon event!", e, faviconCallbacks)
        for arg, i in faviconCallbacks
          if arg.site == e.detail.site
            faviconCallbacks.splice(i, 1)
            if e.detail.err
              return arg.callback(e.detail.err, null)
            else
              return arg.callback(null, e.detail)


      window.document.addEventListener("returnPage", (e) ->
        console.log("got returnPage event!", e, pageCallbacks.length)
        for arg, i in pageCallbacks
          console.log("!",arg.pageInformation.slug, e.detail.pageInformation.slug)
          if arg.pageInformation.slug == e.detail.pageInformation.slug
            console.log("!",arg.pageInformation.site, e.detail.pageInformation.site)
            if arg.pageInformation.site == e.detail.pageInformation.site
              console.log("!",arg.pageInformation.rev, e.detail.pageInformation.rev)
              if arg.pageInformation.rev == e.detail.pageInformation.rev
                page = e.detail.page
                if e.detail.err
                  return arg.whenNotGotten()
                else
                  page = revision.create(arg.pageInformation.rev, page)  if arg.pageInformation.rev

                if e.detail.site && e.detail.site != location.host
                  site = e.detail.site
                else
                  site = null
                arg.whenGotten(newPage(e.detail.page, site))
                pageCallbacks.splice(i, 1)
                return
      )

      Steward::getPage = (arg) ->
        arg.pageInformation.site = location.host
        pageCallbacks.push(arg)
        console.log(pageCallbacks)
        window.document.dispatchEvent(new CustomEvent("getPage", {detail:{pageInformation: arg.pageInformation, localContext: arg.localContext}}))
        return

      Steward::getFavicon = (arg, callback) ->
        console.log("extension get Favicon")
        arg.callback = callback
        faviconCallbacks.push(arg)
        window.document.dispatchEvent(new CustomEvent("getFavicon", {detail:{remote: arg.remote}}))

      Steward::getSitemap = (arg, callback) ->
        console.log("extension get sitemap", arg)
        arg.callback = callback
        sitemapCallbacks.push(arg)
        window.document.dispatchEvent(new CustomEvent("getSitemap", {detail:{site: arg.site}}))


  , 1000)

module.exports = new Steward()
