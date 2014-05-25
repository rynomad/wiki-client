# Refresh will fetch a page and use it to fill a dom
# element that has been ready made to hold it.
#
# cycle: have a div, $(this), with id = slug
# whenGotten: have a pageObject we just fetched
# buildPage: have a pageObject from somewhere
# rebuildPage: have a key from saving pageObject in lineup
# renderPageIntoPageElement: have $page annotated from pageObject
# pageObject.seqItems: get back each item sequentially
# plugin.do: have $item in dom for item
#
# The various calling conventions are due to async
# requirements and the work of many hands.

_ = require 'underscore'

pageHandler = require './pageHandler'
plugin = require './plugin'
state = require './state'
neighborhood = require './neighborhood'
addToJournal = require './addToJournal'
actionSymbols = require './actionSymbols'
lineup = require './lineup'
resolve = require './resolve'
random = require './random'
wik = require "./wik"

pageModule = require('./page')
newPage = pageModule.newPage
asSlug = pageModule.asSlug

getIO = () ->
  if pageHandler.io != null
    plugin.useIO pageHandler.io
  else
    setTimeout getIO, 500

getIO()

getItem = ($item) ->
  $($item).data("item") or $($item).data('staticItem') if $($item).length > 0

handleDragging = (evt, ui) ->
  $item = ui.item

  item = getItem($item)
  $thisPage = $(this).parents('.page:first')
  $sourcePage = $item.data('pageElement')
  sourceSite = $sourcePage.data('site')

  $destinationPage = $item.parents('.page:first')
  equals = (a, b) -> a and b and a.get(0) == b.get(0)

  moveWithinPage = not $sourcePage or equals($sourcePage, $destinationPage)
  moveFromPage = not moveWithinPage and equals($thisPage, $sourcePage)
  moveToPage = not moveWithinPage and equals($thisPage, $destinationPage)

  if moveFromPage
    if $sourcePage.hasClass('ghost') or
      $sourcePage.attr('id') == $destinationPage.attr('id') or
        evt.shiftKey
          # stem the damage, better ideas here:
          # http://stackoverflow.com/questions/3916089/jquery-ui-sortables-connect-lists-copy-items
          return

  action = if moveWithinPage
    order = $(this).children().map((_, value) -> $(value).attr('data-id')).get()
    {type: 'move', order: order}
  else if moveFromPage
    console.log 'drag from', $sourcePage.find('h1').text()
    {type: 'remove'}
  else if moveToPage
    $item.data 'pageElement', $thisPage
    $before = $item.prev('.item')
    before = getItem($before)
    {type: 'add', item: item, after: before?.id}
  action.id = item.id
  pageHandler.put $thisPage, action

initDragging = ($page) ->
  options =
    connectWith: '.page .story'
    placeholder: 'item-placeholder'
    forcePlaceholderSize: true
  $story = $page.find('.story')
  $story.sortable(options).on('sortupdate', handleDragging)


initAddButton = ($page) ->
  $page.find(".add-factory").live "click", (evt) ->
    return if $page.hasClass 'ghost'
    evt.preventDefault()
    createFactory($page)

createFactory = ($page) ->
  item =
    type: "factory"
    id: random.itemId()
  $item = $("<div />", class: "item factory").data('item',item).attr('data-id', item.id)
  $item.data 'pageElement', $page
  $page.find(".story").append($item)
  plugin.do $item, item
  $before = $item.prev('.item')
  before = getItem($before)
  pageHandler.put $page, {item: item, id: item.id, type: "add", after: before?.id}

emitHeader = ($header, $page, pageObject) ->
  viewHere = if pageObject.getSlug() is 'welcome-visitors' then "" else "/view/#{pageObject.getSlug()}"
  absolute = if pageObject.isRemote() then "#{pageObject.getRemoteSite()}" else $(".local").data().hashname
  tooltip = pageObject.getRemoteSiteDetails(location.host)

  if $("img[data-neighborFlag=#{absolute}]").length > 0
    $header.append """
          <h1 title="#{tooltip}">
            <a href="#{absolute}/view/welcome-visitors#{viewHere}">
              <img src="#{$("img[data-neighborFlag=#{absolute}]").attr('src')}" height="32px" class="favicon" data-site="#{absolute}">
            </a> #{pageObject.getTitle()}
          </h1>
        """
  else
    cb = (fav) ->
      console.log fav, absolute, plugin
      if ((fav == false) && (absolute == wik.self()))
        console.log "plugin.get favicon-alt"
        plugin.get 'favicon-alt', (favicon) ->
          favicon.create( (f) ->
                          cb(f)
                          wik.saveFavicon(f)

                        )
      else
        $header.append """
          <h1 title="#{tooltip}">
            <a href="#{absolute}/view/welcome-visitors#{viewHere}">
              <img src="#{fav}" height="32px" class="favicon" data-site="#{absolute}">
            </a> #{pageObject.getTitle()}
          </h1>
        """

    wik.getFavicon absolute, cb

emitTimestamp = ($header, $page, pageObject) ->
  if $page.attr('id').match /_rev/
    $page.addClass('ghost')
    $page.data('rev', pageObject.getRevision())
    $header.append $ """
      <h2 class="revision">
        <span>
          #{pageObject.getTimestamp()}
        </span>
      </h2>
    """

emitControls = ($journal) ->
  $journal.append """
    <div class="control-buttons">
      <a href="#" class="button fork-page" title="fork this page">#{actionSymbols.fork}</a>
      <a href="#" class="button add-factory" title="add paragraph">#{actionSymbols.add}</a>
    </div>
  """

emitFooter = ($footer, pageObject) ->
  host = pageObject.getRemoteSite(location.host)
  slug = pageObject.getSlug()
  $footer.append """
    <a id="license" href="http://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a> .
    <a class="show-page-source" href="/#{slug}.json?random=#{random.randomBytes(4)}" title="source">JSON</a> .
    <a href= "//#{host}/#{slug}.html">#{host}</a>
  """

emitTwins = ($page) ->
  page = $page.data 'data'
  return unless page
  site = $page.data('site') or $(".local").data().hashname
  site = $(".local").data().hashname if site in ['view', 'origin']
  slug = asSlug page.title

  $page.find('.twins')
    .html ""

  j = 0
  $custody = null
  console.log "EMITTWINS"
  for action in page.journal
    if (action.type == "create") || (action.type == "fork")

      console.log action
      site = (action.site || (action.item && action.item.site))
      if site
        console.log action
        if $custody != null
          $custody.text(j)
          $custody.attr("data-count", j)
          j = 0
        console.log "updated old"
        $custody = $("""<a href="#" /> """).addClass("action").addClass(action.type)
          .attr('data-site',site)

        console.log
        if ($("img[data-neighborFlag='#{site}']").length > 0)
          flag = $("img[data-neighborFlag='#{site}']").attr('src')
          $custody.css("background-image", "url('#{flag}')")
        console.log $custody
        $page.find('.twins')
          .append($custody)
      else
        j++
    else
      j++

  $custody.attr('data-count', j)
  $custody.text(j)
  console.log "ERROR?"
  ###




  if (actions = page.journal?.length)? and (viewing = page.journal[actions-1]?.date)?
    viewing = Math.floor(viewing/1000)*1000
    bins = {newer:[], same:[], older:[]}
    # {fed.wiki.org: [{slug: "happenings", title: "Happenings", date: 1358975303000, synopsis: "Changes here ..."}]}
    for remoteSite, info of neighborhood.sites
      if remoteSite != site and info.sitemap?
        for item in info.sitemap
          if item.slug == slug
            bin = if item.date > viewing then bins.newer
            else if item.date < viewing then bins.older
            else bins.same
            bin.push {remoteSite, item}
    twins = []
    # {newer:[remoteSite: "fed.wiki.org", item: {slug: ..., date: ...}, ...]}
    for legend, bin of bins
      continue unless bin.length
      bin.sort (a,b) ->
        a.item.date < b.item.date
      flags = for {remoteSite, item}, i in bin

        break if i >= 8
        """<img class="remote"
          src="#{$("img[data-neighborFlag=#{remoteSite}]").attr("src")}"
          data-slug="#{slug}"
          data-site="#{remoteSite}"
          title="#{remoteSite}">
        """
      twins.push "#{flags.join '&nbsp;'} #{legend}"
    $page.find('.twins').html """<p>#{twins.join ", "}</p>""" if twins
  ###

renderPageIntoPageElement = (pageObject, $page) ->
  $page.data("data", pageObject.getRawPage())
  $page.data("site", pageObject.getRemoteSite()) if pageObject.isRemote()

  console.log '.page keys ', ($(each).data('key') for each in $('.page'))
  console.log 'lineup keys', lineup.debugKeys()

  resolve.resolutionContext = pageObject.getContext()

  $page.empty()
  [$twins, $header, $story, $journal, $footer] = ['twins', 'header', 'story', 'journal', 'footer'].map (className) ->
    $("<div />").addClass(className).appendTo($page)

  emitHeader $header, $page, pageObject
  emitTimestamp $header, $page, pageObject

  pageObject.seqItems (item, done) ->
    if item?.type and item?.id
      $item = $ """<div class="item #{item.type}" data-id="#{item.id}">"""
      $story.append $item
      plugin.do $item, item, done
    else
      $story.append $ """<div><p class="error">Can't make sense of story[#{i}]</p></div>"""
      done()

  pageObject.seqActions (each, done) ->
    addToJournal $journal, each.separator if each.separator
    addToJournal $journal, each.action
    done()

  emitTwins $page
  emitControls $journal
  emitFooter $footer, pageObject


createMissingFlag = ($page, pageObject) ->
  unless pageObject.isRemote()
    recursor = () ->
      if plugin.io
        console.log("get favicon")
        $('img.favicon',$page).error ->
          plugin.get 'favicon', (favicon) ->
            favicon.create()
      else
        setTimeout recursor, 500

rebuildPage = (pageObject, $page) ->
  $page.addClass('local') if pageObject.isLocal()
  $page.addClass('remote') if pageObject.isRemote()
  $page.addClass('plugin') if pageObject.isPlugin()

  renderPageIntoPageElement pageObject, $page
  createMissingFlag $page, pageObject

  #STATE -- update url when adding new page, removing others
  state.setUrl()

  initDragging $page
  initAddButton $page
  $page

buildPage = (pageObject, $page) ->
  $page.data('key', lineup.addPage(pageObject))
  rebuildPage(pageObject, $page)

cycle = ->
  $page = $(this)

  [slug, rev] = $page.attr('id').split('_rev')
  pageInformation = {
    slug: slug
    rev: rev
    site: $page.data('site')
  }

  createGhostPage = ->
    title = $("""a[href="/#{slug}.html"]:last""").text() or slug
    #NEWPAGE future after failed pageHandler.get then buildPage
    pageObject = newPage()
    pageObject.setTitle(title)

    hits = []
    for site, info of neighborhood.sites
      if info.sitemap?
        result = _.find info.sitemap, (each) ->
          each.slug == slug
        if result?
          hits.push
            "type": "reference"
            "site": site
            "slug": slug
            "title": result.title || slug
            "text": result.synopsis || ''
    if hits.length > 0
      pageObject.addItem
        'type': 'future'
        'text': 'We could not find this page in the expected context.'
        'title': title
      pageObject.addItem
        'type': 'paragraph'
        'text': "We did find the page in your current neighborhood."
      pageObject.addItem hit for hit in hits
    else
       pageObject.addItem
        'type': 'future'
        'text': 'We could not find this page.'
        'title': title

    buildPage( pageObject, $page ).addClass('ghost')

  whenGotten = (pageObject) ->
    buildPage( pageObject, $page )
    for site in pageObject.getNeighbors($(".local").data().hashname)
      neighborhood.registerNeighbor site

  pageHandler.get
    whenGotten: whenGotten
    whenNotGotten: createGhostPage
    pageInformation: pageInformation

module.exports = {cycle, emitTwins, buildPage, rebuildPage}
