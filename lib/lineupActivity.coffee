# Compare journal activity for pages in the current lineup.

lineup = require './lineup'
Steward = require './steward'

day = 24 * hour = 60 * minute = 60 * second = 1000

activity = (journal, from, to) ->
  for action in journal
    return true if action.date? and from < action.date and action.date <= to
  false

sparks = (journal) ->
  line = ''
  to = (new Date).getTime()
  for [1..60]
    line += if activity(journal, to-day, to) then '|' else '.'
    line += '<td>' if (new Date(to)).getDay() == 0
    to -= day
  line

row = (page) ->
  remote = page.getRemoteSite location.host
  title = page.getTitle()
  Steward.get("favicon",
    remote: remote
  , (err, res)->
    console.log("error here?", res.favicon)
    console.log($(".remote #{remote}"))
    $("img[data-site='#{remote}']").attr("src", res.favicon)
  )
  """
    <tr><td align=right>
      <img data-site="#{remote}" class="remote" src="">
      #{title}
    <td>
      #{sparks page.getRawPage().journal}
  """

table = (keys) ->
  """
    <table>
    #{(row lineup.atKey key for key in keys).join "<br>"}
    </table>
  """

show = ->
  table lineup.debugKeys()

module.exports = {show}
