Steward = ->
  this
newPage = require("../page.coffee").newPage
random = require("../random.coffee")
lineup = require("../lineup.coffee")
revision = require("../revision.coffee")
Steward::useLocalStorage = ->
  true

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
Steward::putPage = (options, callback) ->
  console.log "steward.putPage"
  action = options.action
  pagePutInfo = options.pagePutInfo
  $page = options.page
  page = lineup.atKey($page.data("key")).getRawPage()
  pageObject = newPage(page, "local")
  pageObject.apply action
  options.page = page
  chrome.runtime.sendMessage
    put: "page"
    options: options
  , (res) ->
    unless res.err
      $page.addClass "local"
      callback $page, action
    else
      console.log "put error"
    return

  return

Steward::putFavicon = (options, callback) ->
  chrome.runtime.sendMessage
    put: "favicon"
    options: options
  , (res) ->
    console.log "favicon put", res
    return

  return

Steward::getFavicon = (options, callback) ->
  chrome.runtime.sendMessage
    get: "favicon"
    options: options
  , (res) ->
    console.log "callback from!!!!!!!!", res
    unless res.err
      callback null,
        req: options
        favicon: res.favicon

    else
      console.log "error getting favicon", options
      callback true, null
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

  _arg.whenGotten = null
  _arg.whenNotGotten = null
  chrome.runtime.sendMessage
    get: "page"
    options: _arg
  , (res) ->
    if res.err
      return whenNotGotten()
    else res.page = revision.create(rev, res.page)  if rev
    console.log(res.page, res.site)
    whenGotten newPage(res.page, res.site)

  return

Steward::getFactories = (options, callback) ->
  chrome.runtime.sendMessage
    get: "factories"
    options: options
  , (res) ->
    callback null, res
    return

  return

Steward::getIcons = (options, callback) ->
  url = "/images/external-link-ltr-icon.url"
  chrome.runtime.sendMessage
    get: "icons"
    options: options
  , (res, data) ->
    unless res.err
      callback null,
        externalLink: "data:image/png;base64"

    return

  return

Steward::getSitemap = (options, callback) ->
  chrome.runtime.sendMessage
    get: "sitemap"
    options: options
  , (res, data, third) ->
    console.log "got sitemap back!", res, data, third
    unless res.err
      callback null, res.sitemap
    else
      callback new Error("fetch sitemap failed"), null
    return

  return

Steward::getScript = (options, callback) ->
  chrome.runtime.sendMessage
    get: "script"
    options: options
  , (res) ->
    unless res.err
      callback null
    else
      callback new Error("fetch sitemap failed"), null
    return

  return

module.exports = new Steward()
