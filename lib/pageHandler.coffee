# The pageHandler bundles fetching and storing json pages
# from origin, remote and browser local storage. It handles
# incremental updates and implicit forks when pages are edited.

_ = require 'underscore'

state = require './state'
revision = require './revision'
addToJournal = require './addToJournal'
newPage = require('./page').newPage
random = require './random'
neighborhood = require "./neighborhood"
synopsis = require "./synopsis"

wik = require "./wik"

ndnIO = require("ndn-io")

remoteNFD =
  host: "localhost"

console.log ndnIO
ndnIO.remoteTangle  remoteNFD, () ->
  console.log("connected to remote nfd")
  neighborhood.useIO(ndnIO)
  pageHandler.io = ndnIO

module.exports = pageHandler = {}

pageHandler.useLocalStorage = ->
  $(".login").length > 0

pageHandler.id = ->
  $(".local").data().hashname

pageFromLocalStorage = (slug)->
  if json = localStorage[slug]
    JSON.parse(json)
  else
    undefined

recursiveGet = ({pageInformation, whenGotten, whenNotGotten, localContext}) ->
  cycle = () ->
    gotten = false

    {slug,rev,site} = pageInformation
    wg = (page, site) ->
      whenGotten newPage(page, site)

    console.log "RECURSIVEGET"
    if pageHandler.id() != undefined
      wik.getPage pageInformation, wg, whenNotGotten
    else
      $(".local").on "self", cycle
  cycle()

pageHandler.get = ({whenGotten,whenNotGotten,pageInformation}  ) ->

  unless pageInformation.site
    if localPage = pageFromLocalStorage(pageInformation.slug)
      localPage = revision.create pageInformation.rev, localPage if pageInformation.rev
      return whenGotten newPage( localPage, 'local' )

  pageHandler.context = ['view'] unless pageHandler.context.length

  recursiveGet
    pageInformation: pageInformation
    whenGotten: whenGotten
    whenNotGotten: whenNotGotten
    localContext: _.clone(pageHandler.context)


pageHandler.context = []

pushToLocal = ($page, pagePutInfo, action) ->
  if action.type == 'create'
    page = {title: action.item.title, story:[], journal:[]}
  else
    page = pageFromLocalStorage pagePutInfo.slug
    page ||= $page.data("data")
    page.journal = [] unless page.journal?
    if (site=action['fork'])?
      page.journal = page.journal.concat({'type':'fork','site':site})
      delete action['fork']
    page.story = $($page).find(".item").map(-> $(@).data("item")).get()
  page.journal = page.journal.concat(action)
  localStorage[pagePutInfo.slug] = JSON.stringify(page)
  addToJournal $page.find('.journal'), action


pushToServer = ($page, pagePutInfo, action) ->
  console.log("pushToServer", neighborhood.sites[pageHandler.id()])
  if action.type == 'create'
    action.item.site = pageHandler.id()
  else
    page = $page.data("data")
    page.journal = [] unless page.journal?
    if (site=action['fork'])?
      action.index = page.journal.length
      console.log("fork index is ", action.index)
      $page.data("data").journal = $page.data("data").journal.concat({'type':'fork','site':site, "index": action.index})
      delete action['fork']
      publishImplicitFork =
        uri: "wiki/page/" + pagePutInfo.slug + "/" + 0 + "/" + pageHandler.id(),
        freshness: 60 * 60 * 1000 ,
        type: 'object',
        thing: {'type':'fork','site':site, "index": action.index}

      ndnIO.publish publishImplicitFork , cb
    else
      publishImplicitFork = null
    if (action.type == "fork")
      action.index = page.journal.length



  journalnum = $page.data("data").journal.length
  console.log journalnum,
  action.page = undefined
  console.log("ACTION", action)
  publishOptions =
    uri: "wiki/page/" + pagePutInfo.slug + "/" + journalnum + "/" + pageHandler.id(),
    freshness: 60 * 60 * 1000 ,
    type: 'object',
    thing: action

  $page.data("data").journal = $page.data("data").journal.concat(action)
  addToJournal $page.find('.journal'), action

  cb = (success) ->
    console.log(page)
    if success is true
      console.log("publish action success")
      page = revision.create($page.data("data").journal.length, $page.data("data"))
      sitemapUpdate =
        synopsis : synopsis(page),
        date : action.date,
        slug : pagePutInfo.slug,
        title: $page.data("data").title

      console.log("sitemapUpdate", sitemapUpdate)

      updateParams =
        type: "object",
        version: true,
        thing: sitemapUpdate

      sitemap = neighborhood.sites[wik.self()].sitemap
      if action.type == "create"
        console.log sitemap, sitemap.length
        updateParams.uri = "wiki/system/#{pageHandler.id()}/sitemap/#{sitemap.length}"
        sitemap.push sitemapUpdate
      else
        i = 0
        for entry in sitemap
          console.log(entry, pagePutInfo)
          if entry.slug == pagePutInfo.slug
            updateParams.uri = "wiki/system/#{pageHandler.id()}/sitemap/#{i}"
            sitemap[i] = sitemapUpdate
            continue
          else
            i++



      ndnIO.publish  updateParams, (s) ->
        console.log s, "did we update the sitemap???"


    else
      console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!publish action fail!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
      ndnIO.publish publishOptions , cb

  ndnIO.publish publishOptions , cb

pageHandler.put = ($page, action) ->

  checkedSite = () ->
    switch site = $page.data('site')
      when 'origin', 'local', 'view' then null
      when pageHandler.id then null
      else site

  # about the page we have
  pagePutInfo = {
    slug: $page.attr('id').split('_rev')[0]
    rev: $page.attr('id').split('_rev')[1]
    site: checkedSite()
    local: $page.hasClass('local')
  }
  forkFrom = pagePutInfo.site
  console.log 'pageHandler.put', action, pagePutInfo

  # detect when fork to local storage
  if pageHandler.useLocalStorage()
    if pagePutInfo.site?
      console.log 'remote => local'
    else if !pagePutInfo.local
      console.log 'origin => local'
      action.site = forkFrom = location.host
    # else if !pageFromLocalStorage(pagePutInfo.slug)
    #   console.log ''
    #   action.site = forkFrom = pagePutInfo.site
    #   console.log 'local storage first time', action, 'forkFrom', forkFrom

  # tweek action before saving
  action.date = (new Date()).getTime()
  delete action.site if action.site == 'origin'

  # update dom when forking
  if forkFrom
    # pull remote site closer to us
    $page.find('h1 img').attr('src', '/favicon.png')
    $page.find('h1 a').attr('href', '/')
    $page.data('site', null)
    $page.removeClass('remote')
    #STATE -- update url when site changes
    state.setUrl()
    if action.type != 'fork'
      # bundle implicit fork with next action
      action.fork = forkFrom
      addToJournal $page.find('.journal'),
        type: 'fork'
        site: forkFrom
        date: action.date

  # store as appropriate
  if pageHandler.useLocalStorage() or pagePutInfo.site == 'local'
    console.log("push to local")
    pushToLocal($page, pagePutInfo, action)
    $page.addClass("local")
  else
    pushToServer($page, pagePutInfo, action)

