# The state module saves the .page lineup in the browser's location
# bar and history. It also reconstructs that state when the browser
# notifies us that the user has changed this sequence.

active = require '../active'
lineup = require '../lineup'
link = null

module.exports = state = {}

# FUNCTIONS and HANDLERS to manage location bar and back button

state.inject = (link_) ->
  link = link_

state.pagesInDom = ->
  $.makeArray $(".page").map (_, el) -> el.id

state.urlPages = ->
  (i for i in location.hash.split('/') by 2)[1..]

state.locsInDom = ->
  $.makeArray $(".page").map (_, el) ->
    $(el).data('site') or 'view'

state.urlLocs = ->
  (j for j in location.hash.split('/')[1..] by 2)

state.setUrl = ->
  document.title = lineup.bestTitle()
  if location
    locs = state.locsInDom()
    pages = state.pagesInDom()
    url = ("/#{locs?[idx] or 'view'}/#{page}" for page, idx in pages).join('')
    unless url is location.hash
      location.hash = url
      localStorage["#last"] = url
      history.pushState(url)

state.show = (e) ->
  oldPages = state.pagesInDom()
  newPages = state.urlPages()
  oldLocs = state.locsInDom()
  newLocs = state.urlLocs()


  if (!location.hash || location.hash.length <=1)
    location.hash = localStorage["#last"]
    return

  matching = true
  for name, idx in oldPages
    continue if matching and= name is newPages[idx]
    old = $('.page:last')
    lineup.removeKey old.data('key')
    old.remove()

  matching = true
  for name, idx in newPages
    continue if matching and= name is oldPages[idx]
    console.log 'push', idx, name
    link.showPage(name, newLocs[idx])

  console.log 'a .page keys ', ($(each).data('key') for each in $('.page'))
  console.log 'a lineup keys', lineup.debugKeys()

  active.set($('.page').last())
  document.title = lineup.bestTitle()

state.first = ->
  state.show()
  firstUrlPages = state.urlPages()
  firstUrlLocs = state.urlLocs()
  oldPages = state.pagesInDom()
  for urlPage, idx in firstUrlPages when urlPage not in oldPages
    link.doInternalLink(urlPage, firstUrlLocs[idx]) unless urlPage is ''