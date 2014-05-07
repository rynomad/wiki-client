# The pageHandler bundles fetching and storing json pages
# from origin, remote and browser local storage. It handles
# incremental updates and implicit forks when pages are edited.

_ = require 'underscore'

state = require './state'
revision = require './revision'
addToJournal = require './addToJournal'
newPage = require('./page').newPage
random = require './random'

ndnIO = require("ndn-io")

falsyloc =
  host: "something:"

location = location || falsyloc

remoteNFD =
  host: location.host.split(":")[0],
  port: 6565


ndnIO.initFace "websocket", remoteNFD, ->
                              console.log("connected to remote nfd")

module.exports = pageHandler = {}

pageHandler.useLocalStorage = ->
  $(".login").length > 0

pageFromLocalStorage = (slug)->
  if json = localStorage[slug]
    JSON.parse(json)
  else
    undefined

recursiveGet = ({pageInformation, whenGotten, whenNotGotten, localContext}) ->

  gotten = false

  {slug,rev,site} = pageInformation

  journalNum = 0
  triggered = false

  fetchParams =
    uri: "wiki/page/" + slug + '/' + journalNum,
    type: "object"

  data =
    journal: []

  onTimeout = (name) ->
    console.log(journalNum, "timeout triggered")
    if journalNum == 0
      whenNotGotten()
      triggered == true
    else
      whenGotten newPage revision.create journalNum, data


  onData = (name, thing) ->
    journalNum++
    fetchParams.uri = "wiki/page/" + slug + '/' + journalNum
    data.journal.push(thing)
    if (thing.item && thing.item.title)
      data.title = thing.item.title


    ndnIO.fetch(fetchParams, onData, onTimeout)

  ndnIO.fetch(fetchParams, onData, onTimeout)


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
  $.ajax
    type: 'PUT'
    url: "/page/#{pagePutInfo.slug}/action"
    data:
      'action': JSON.stringify(action)
    success: () ->
      addToJournal $page.find('.journal'), action
      if action.type == 'fork' # push
        localStorage.removeItem $page.attr('id')
    error: (xhr, type, msg) ->
      console.log "pageHandler.put ajax error callback", type, msg

pageHandler.put = ($page, action) ->

  checkedSite = () ->
    switch site = $page.data('site')
      when 'origin', 'local', 'view' then null
      when location.host then null
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
    pushToLocal($page, pagePutInfo, action)
    $page.addClass("local")
  else
    pushToServer($page, pagePutInfo, action)

