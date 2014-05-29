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

wik.init(()->
          neighborhood.registerNeighbor(wik.self())
        )

populateSiteInfoFor = (site,neighborInfo)->
  console.log("POPULATESITEINFOFOR", site, neighborInfo)
  transition = (site, from, to) ->
    $(""".neighbor[data-site='#{site}']""")
      .find('div')
      .removeClass(from)
      .addClass(to)

  triggered = false
  transition site, 'wait', 'fetch'

  cb = (entry) ->
    console.log("sitemap callback")
    if entry == false
      transition site, 'fetch', 'fail'
      transition site, 'wait', 'fail'
    else
      transition site, "wait", "done"
      neighborInfo.sitemap.push(entry)
      transition site, 'fetch', 'done'
      if triggered == false
        triggered = true
        $('body').trigger 'new-neighbor-done', site
      else
        $('body').trigger 'neighbor-update', site
  wik.getSitemapEntries site, cb

neighborhood.registerNeighbor = (site)->
  console.log "registerNeighbor called"
  return if neighborhood.sites[site]?
  neighborInfo = {sitemap: []}
  neighborhood.sites[site] = neighborInfo


  console.log "registerNeighbor favicon callback", fav, site
  cb = (fav) ->
    if (fav != false)
      populateSiteInfoFor( site, neighborInfo )
      p = [site, fav]
      $('body').trigger 'new-neighbor', p
    else if  site == wik.self()
      plugin.get 'favicon-alt', (favicon) ->
        favicon.create( (f) ->
                       populateSiteInfoFor( site, neighborInfo )
                       p = [site, f]
                       $('body').trigger 'new-neighbor', p
                       wik.saveFavicon(f)

                      )

  if $(".favicon[data-site='#{site}']").length > 0
    fav = $("img[data-neighborFlag=#{site}]").attr("src")
    cb fav
  else
    wik.getFavicon(site, cb)


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

