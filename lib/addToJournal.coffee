# A wiki page has a journal of actions that have been completed.
# The addToJournal function is called when the origin server
# response that the network operation is complete.

util = require './util'
actionSymbols = require './actionSymbols'
Steward = require("./steward")

module.exports = ($journal, action) ->
  $page = $journal.parents('.page:first')
  title = action.type || 'separator'
  title += " #{util.formatElapsedTime(action.date)}" if action.date?
  $action = $("""<a href="#" /> """).addClass("action").addClass(action.type || 'separator')
    .text(action.symbol || actionSymbols.symbols[action.type])
    .attr('title',title)
    .attr('data-id', action.id || "0")
    .data('action', action)
  controls = $journal.children('.control-buttons')
  if controls.length > 0
    $action.insertBefore(controls)
  else
    $action.appendTo($journal)
  if action.type == 'fork' and action.site?
    Steward.get("favicon",{remote: action.site}, (err, res)->
      $action
        .css("background-image", res.favicon)
      )
    $action
      .attr("href", "http://#{action.site}/#{$page.attr('id')}.html")
      .data("site", action.site)
      .data("slug", $page.attr('id'))

