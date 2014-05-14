# The neighborhood provides a cache of site maps read from
# various federated wiki sites. It is careful to fetch maps
# slowly and keeps track of get requests in flight.

_ = require 'underscore'
ndnIO = null

module.exports = neighborhood = {}

neighborhood.sites = {}
nextAvailableFetch = 0
nextFetchInterval = 2000

neighborhood.useIO = (io) ->
  ndnIO = io

populateSiteInfoFor = (site,neighborInfo)->
  console.log("POPULATESITEINFOFOR", site, neighborInfo)
  return if neighborInfo.sitemapRequestInflight
  neighborInfo.sitemapRequestInflight = true

  transition = (site, from, to) ->
    $(""".neighbor[data-site="#{site}"]""")
      .find('div')
      .removeClass(from)
      .addClass(to)

  fetchMap = ->
    sitemapNum = 0
    sitemap = []
    sitemapParam =
      uri : "wiki/system/#{site}/sitemap/#{sitemapNum}",
      type: "object"

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
        transition site, 'fetch', 'fail'
        transition site, 'wait', 'fail'
      else
        transition site, "wait", "done"
        neighborInfo.sitemap = sitemap
        transition site, 'fetch', 'done'
        $('body').trigger 'new-neighbor-done', site



      ndnIO.fetch(sitemapParam, onData, onTimeout)

    ndnIO.fetch(sitemapParam, onData, onTimeout)

  fetchMap()

neighborhood.registerNeighbor = (site)->
  return if neighborhood.sites[site]?
  neighborInfo = {}
  neighborhood.sites[site] = neighborInfo


  onData = (requri, fav, actualuri) ->
    populateSiteInfoFor( site, neighborInfo )
    $('body').trigger 'new-neighbor', site, fav.uri

  onTimeout = (uri) ->
    console.log "flag fetch fail"

  fav =
    uri: "wiki/system/#{site}/favicon"
    type: "object"

  ndnIO.fetch fav, onData, onTimeout

neighborhood.listNeighbors = ()->
  _.keys( neighborhood.sites )

neighborhood.search = (searchQuery)->
  finds = []
  tally = {}

  tick = (key) ->
    if tally[key]? then tally[key]++ else tally[key] = 1

  match = (key, text) ->
    hit = text? and text.toLowerCase().indexOf( searchQuery.toLowerCase() ) >= 0
    tick key if hit
    hit

  start = Date.now()
  for own neighborSite,neighborInfo of neighborhood.sites
    sitemap = neighborInfo.sitemap
    tick 'sites' if sitemap?
    matchingPages = _.each sitemap, (page)->
      tick 'pages'
      return unless match('title', page.title) or match('text', page.synopsis) or match('slug', page.slug)
      tick 'finds'
      finds.push
        page: page,
        site: neighborSite,
        rank: 1 # HARDCODED FOR NOW
  tally['msec'] = Date.now() - start
  { finds, tally }

