wik = {}
io = require("ndn-io")

module.exports = wik

wik.assignSelf = (hashname) ->
  wik.self = hashname

wik.getFavicon = (site, cb) ->
  console.log "wik.getFavicon site", site
  fetchFav =
    type: "object"
    uri: "wiki/system/#{site}/favicon"

  onData = (uri, favicon, actual) ->
    cb favicon.image

  onTimeout = (uri) ->
    cb false


  io.fetch fetchFav, onData, onTimeout

wik.saveFavicon = (fav) ->
  param =
    type: "object",
    uri: "wiki/system/#{$('.local').data().hashname}/favicon",
    freshness: 60 * 60 * 1000
    thing:
      image: fav

  io.publish param, (a, b) ->
    console.log(a,b)

wik.getPlugin = (scripts, pluginName, cb) ->
  pluginParams =
    uri: "wiki/plugin/#{pluginName}"
    type: "application/javascript"


  onData = (reqUri, script, actualUri) ->
    url = window.URL.createObjectURL(script)
    options = $.extend(options or {},
      dataType: "script"
      cache: true
      url: url
    )
    $.ajax options
      .done ->
        scripts.push url
        console.log "callback script"
        cb()

  onTimeout = (uri) ->
    console.log "plugin fetch timeout"

  io.fetch pluginParams, onData, onTimeout

wik.getSitemap = (site, cb) ->
  console.log("wik.getSitemap")
  sitemap = []
  sitemapNum = 0
  sitemapParam =
    uri  : "wiki/system/#{site}/sitemap/#{sitemapNum}",
    type : "object"

  onData = (requri, entry, realuri ) ->
    sitemap.push(entry)
    sitemapNum++
    sitemapParam =
      uri : "wiki/system/#{site}/sitemap/#{sitemapNum}",
      type: "object"

    io.fetch(sitemapParam, onData, onTimeout )

  onTimeout = (uri ) ->
    sitemapParam =
      uri : "wiki/system/#{site}/sitemap/#{sitemapNum}",
      type: "object",
      selectors:
        interestLifetime: 60000

    if sitemapNum == 0
      cb(false)
    else
      cb(sitemap)
      io.fetch(sitemapParam, onData, onTimeout)

  io.fetch(sitemapParam, onData, onTimeout)

wik.updateSitemap = () ->
