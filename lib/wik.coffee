wik = {}
io = require("ndn-io")
ndn = require("ndn-lib")
revision = require("./revision")

module.exports = wik

wik.federation = {}

wik.self = () ->
  d = $(".local").data()
  if d
    d.hashname
  else
    undefined

$(".local").on "init", ()-> wik.init()

wik.getPage = (pageInformation, whenGotten, whenNotGotten) ->
  gotten = false

  {slug,rev,site} = pageInformation
  journalNum = 0
  triggered = false

  fetchParams =
    uri: "wiki/page/" + slug + '/' + journalNum,
    type: "object"


  if ((site == wik.self()) || !site)
    fetchingSelf = true
    fetchParams.uri += "/#{wik.self()}"
  else if site?
    fetchingSelf == false
    fetchParams.uri += "/#{site}"


  console.log(pageInformation, slug, rev, site, fetchingSelf)


  data =
    journal: []

  onTimeout = (interest, name) ->

    console.log(interest, name, "timeout triggered", site)
    if journalNum == 0 && fetchingSelf == true
      fetchingSelf = false
      fetchParams.uri = "wiki/page/" + slug + '/' + journalNum + '/'
      io.fetch(fetchParams, onData, onTimeout)

    else if journalNum == 0 && fetchingSelf == false
      whenNotGotten()
      triggered == true

    else if site == wik.self()
      whenGotten(revision.create(journalNum, data))
    else
      whenGotten(revision.create(journalNum, data), site)


  onData = (name, thing, uri) ->
    comps = uri.split("/")
    site = comps[comps.length - 1]
    if journalNum == 0 && thing.type == "fork"
      thing.to = site
      data.journal[thing.index] = thing
      fetchForkFrom =
        uri : "wiki/page/" + slug + '/' + 0 + '/' + thing.site,
        type: "object"

      io.fetch(fetchForkFrom, onData, onTimeout)

    else

      data.journal[journalNum] = thing
      if journalNum != parseInt(rev)
        journalNum++

        if ((data.journal[journalNum] != undefined) && (data.journal[journalNum].to != undefined))
          journalNum++
          fetchParams.uri = "wiki/page/" + slug + '/' + journalNum + '/' + data.journal[journalNum - 1].to
        else
          fetchParams.uri = "wiki/page/" + slug + '/' + journalNum + '/' + site


        if (thing.item && thing.item.title)
          data.title = thing.item.title


        io.fetch(fetchParams, onData, onTimeout)
      else
        whenGotten(revision.create(journalNum, data))

  io.fetch(fetchParams, onData, onTimeout)


wik.getFavicon = (site, cb) ->
  console.log "wik.getFavicon site", site
  fetchFav =
    type: "object"
    uri: "wiki/system/#{site}/favicon"
    selectors:
      interestLifetime = 50000

  onData = (uri, favicon, actual) ->
    cb favicon.image

  onTimeout = (uri) ->
    if site == wik.self()
      cb(false)
    else
      io.fetch fetchFav, onData, onTimeout


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

wik.getSitemapEntries = (site, cb) ->
  console.log("wik.getSitemap", site)
  sitemap = []
  sitemapNum = 0
  sitemapParam =
    uri  : "wiki/system/#{site}/sitemap/#{sitemapNum}",
    type : "object",
    selectors:
      child: "right"

  onData = (requri, entry, realuri ) ->
    cb(entry)
    sitemapNum++
    sitemapParam =
      uri : "wiki/system/#{site}/sitemap/#{sitemapNum}",
      type: "object"
      selectors:
        child: "right"

    io.fetch(sitemapParam, onData, onTimeout )

  onTimeout = (uri) ->
    sitemapParam =
      uri : "wiki/system/#{site}/sitemap/#{sitemapNum}",
      type: "object",
      selectors:
        child: "right",
        interestLifetime: 60000

    if sitemapNum == 0
      cb(false)
    else
      io.fetch(sitemapParam, onData, onTimeout)

  io.fetch(sitemapParam, onData, onTimeout)

wik.updateSitemap = () ->

wik.federation = {}

wik.federate = (site, cb) ->
  console.log("federating", site)


  thishost = site.split(':')[0]

  remoteFaceID = ""

  if ((wik.self() != thishost) && (thishost != "localhost") && (thishost != "127.0.0.1") && (thishost != "66.185.108.210") && (!wik.federation[thishost]))
    wik.federation[thishost] = {sitemap: []}
    console.log "remoteSite", wik.self(), thishost
    params =
      host: thishost,
      port: 6464,
      nextHop:
        uri: "wiki/system/" + thishost

    if thishost.length > 30
      params.protocol = "th"
    else
      params.protocol = "tcp"


    #console.log thishost, host

    dat = new ndn.Data(new ndn.Name(''), new ndn.SignedInfo(), JSON.stringify(params))
    dat.signedInfo.setFields()
    dat.sign()
    enc = dat.wireEncode()

    com = new ndn.Name("localhost/nfd/faces/create")

    com.append(enc.buffer)
    inst = new ndn.Interest(com)

    fetchfacade =
      uri: com.toUri(),
      type: "object",

    onEntry = (entry) ->
      if entry == false
        return
      else
        wik.federation[thishost].sitemap.push(entry)
        nexthop =
          uri: "wiki/page/" + entry.slug,
          faceID : remoteFaceID

        d = new ndn.Data(new ndn.Name(), new ndn.SignedInfo(), JSON.stringify(nexthop))
        d.signedInfo.setFields()
        d.sign()
        n = new ndn.Name("localhost/nfd/fib/add-nexthop")
        n.append(d.wireEncode().buffer)

        nextHopFacade =
        uri: n.toUri()
        type: "object"
        i = new ndn.Interest(n)
        nu = (arg)->
          console.log "facade cb", arg



        io.fetch nextHopFacade, nu , nu

    onData = (uri, data, actualUri) ->
      console.log("makeFace got Response", data)
      cb(site)
      remoteFaceID = data.faceID
      #neighborhood[site].hashName = JSON.parse(data.content).ndndid
      #console.log(neighborhood[site], thishost)
      wik.getSitemapEntries thishost, onEntry


    onTimeout = (interest) ->
      console.log("makeFace timeout", site)

    io.fetch fetchfacade, onData, onTimeout

wik.init = () ->
  cycle = () ->
    console.log "wik.self", wik.self()

    if wik.self() == undefined
      $(".local").on "init", cycle
      ""
    else
      onPage = (page) ->
        console.log "got page from self sitemap"
        for action in page.journal
          if (action.site? && !wik.federation[action.site] && action.site != wik.self())
            setTimeout wik.federate, 0 , action.site, ()->

      onSitemapEntry = (entry) ->
        pageInformation =
          slug: entry.slug
          site: wik.self()

        wik.getPage(pageInformation, onPage, ()->)

      wik.getSitemapEntries wik.self(), onSitemapEntry

  cycle()

setTimeout(wik.init, 100)
