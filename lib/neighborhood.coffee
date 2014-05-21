# The neighborhood provides a cache of site maps read from
# various federated wiki sites. It is careful to fetch maps
# slowly and keeps track of get requests in flight.

_ = require 'underscore'
ndnIO = null


wik = require "./wik"
plugin = require "./plugin"

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


  transition site, 'wait', 'fetch'

  cb = (sitemap) ->
    console.log("sitemap callback")
    if sitemap == false
      transition site, 'fetch', 'fail'
      transition site, 'wait', 'fail'
    else
      transition site, "wait", "done"
      neighborInfo.sitemap = sitemap
      transition site, 'fetch', 'done'
      $('body').trigger 'new-neighbor-done', site


  wik.getSitemap site, cb

neighborhood.registerNeighbor = (site)->
  return if neighborhood.sites[site]?
  neighborInfo = {}
  neighborhood.sites[site] = neighborInfo


  cb2 = (fav) ->
    console.log "registerNeighbor favicon callback", fav, site

    if (fav != false)
      populateSiteInfoFor( site, neighborInfo )
      p = [site, fav]
      $('body').trigger 'new-neighbor', p
    else if  site == $(".local").data().hashname
      plugin.get 'favicon-alt', (favicon) ->
        favicon.create( (f) ->
                        populateSiteInfoFor( site, neighborInfo )
                        p = [site, f]
                        $('body').trigger 'new-neighbor', p
                        wik.saveFavicon(f)

                      )



  cb1 = (site) ->
    wik.getFavicon(site, cb2) unless site == false

  wik.federate(site, cb1)


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

