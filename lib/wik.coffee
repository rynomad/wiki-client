wik = {}
io = require("ndn-io")
ndn = require("ndn-lib")
revision = require("./revision")

module.exports = wik

wik.federation = {}

wik.self = () ->
  $(".local").data().hashname


wik.getPage = (slug, whenGotten, whenNotGotten) ->
  gotten = false


  fetchingSelf = true

  console.log(site)
  journalNum = 0
  triggered = false

  fetchParams =
    uri: "wiki/page/" + slug + '/' + journalNum + '/' + wik.self(),
    type: "object"

  data =
    journal: []

  onTimeout = (interest, name) ->

    console.log(interest, name, "timeout triggered", site)
    if journalNum == 0 && fetchingSelf == true
      fetchingSelf = false
      fetchParams.uri = "wiki/page/" + slug + '/' + journalNum + '/'
      ndnIO.fetch(fetchParams, onData, onTimeout)

    else if journalNum == 0 && fetchingSelf == false
      whenNotGotten()
      triggered == true

    else
      whenGotten(revision.create(journalNum, data))


  onData = (name, thing, uri) ->
    comps = uri.split("/")
    site = comps[comps.length - 1]
    if journalNum == 0 && thing.type == "fork"
      thing.to = site
      data.journal[thing.index] = thing
      fetchForkFrom =
        uri : "wiki/page/" + slug + '/' + 0 + '/' + thing.site,
        type: "object"

      ndnIO.fetch(fetchForkFrom, onData, onTimeout)

    else

      data.journal[journalNum] = thing
      journalNum++

      if ((data.journal[journalNum] != undefined) && (data.journal[journalNum].to != undefined))
        journalNum++
        fetchParams.uri = "wiki/page/" + slug + '/' + journalNum + '/' + data.journal[journalNum - 1].to
      else
        fetchParams.uri = "wiki/page/" + slug + '/' + journalNum + '/' + site


      if (thing.item && thing.item.title)
        data.title = thing.item.title


      ndnIO.fetch(fetchParams, onData, onTimeout)

  ndnIO.fetch(fetchParams, onData, onTimeout)


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
    type : "object",
    selectors:
      child: "right"

  onData = (requri, entry, realuri ) ->
    sitemap.push(entry)
    sitemapNum++
    sitemapParam =
      uri : "wiki/system/#{site}/sitemap/#{sitemapNum}",
      type: "object"
      selectors:
        child: "right"

    io.fetch(sitemapParam, onData, onTimeout )

  onTimeout = (uri ) ->
    sitemapParam =
      uri : "wiki/system/#{site}/sitemap/#{sitemapNum}",
      type: "object",
      selectors:
        child: "right",
        interestLifetime: 60000

    if sitemapNum == 0
      cb(false)
    else
      cb(sitemap)
      io.fetch(sitemapParam, onData, onTimeout)

  io.fetch(sitemapParam, onData, onTimeout)

wik.updateSitemap = () ->


wik.federate = (site, cb) ->
  console.log("federating", site)

  if wik.self() == undefined
    return setTimeout wik.federate, 2000, site, cb

  thishost = site.split(':')[0]

  remoteFaceID = ""

  if ((wik.self() != thishost) && (thishost != "localhost") && (thishost != "127.0.0.1") && (thishost != "66.185.108.210"))
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

    onSitemap = (sitemap) ->
      if sitemap == false
        return
      else

        for page in sitemap
          nexthop =
            uri: "wiki/page/" + page.slug,
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
      wik.getSitemap thishost, onSitemap


    onTimeout = (interest) ->
      console.log("makeFace timeout", site)

    io.fetch fetchfacade, onData, onTimeout

  else if wik.self() == thishost
    console.log "wik.self"
    onPage = (page) ->

      for action in page.journal
        if (action.site? && !wik.federation[action.site])
          wik.federation[action.site] == true
          wik.federate(action.site)

    onSitemap = (sitemap) ->
      cb(site)
      if sitemap != false
        for entry in sitemap
          wik.getPage(entry.slug, onPage, ()->)

    wik.getSitemap thishost, onSitemap
