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


  io.fetch fetchFav, onData, ()->

wik.saveFavicon = (fav) ->
  param =
    type: "object",
    uri: uri,
    freshness: 60 * 60 * 1000
    thing:
      image: fav

  ndnIO.publish param, (a, b) ->
    console.log(a,b)


wik.getSitemap = (site, cb) ->
  sitemap = []
  sitemapNum = 0
  sitemapParam =
    uri  : "wiki/system/#{site}/sitemap/#{sitemapNum}",
    type : "object"

  transition site, 'wait', 'fetch'

  onData = (requri, entry, realuri ) ->
    sitemap.push(entry)
    sitemapNum++
    sitemapParam =
      uri : "wiki/system/#{site}/sitemap/#{sitemapNum}",
      type: "object"

    ndnIO.fetch(sitemapParam, onData, onTimeout )

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
      ndnIO.fetch(sitemapParam, onData, onTimeout)

  ndnIO.fetch(sitemapParam, onData, onTimeout)

wik.updateSitemap = () ->
