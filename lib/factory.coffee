# A Factory plugin provides a drop zone for desktop content
# destine to be one or another kind of item. Double click
# will turn it into a normal paragraph.

neighborhood = require './neighborhood'
plugin = require './plugin'
resolve = require './resolve'
pageHandler = require './pageHandler'
editor = require './editor'
synopsis = require './synopsis'
drop = require './drop'
Steward = require './steward'

emit = ($item, item) ->
  $item.append '<p>Double-Click to Edit<br>Drop Text or Image to Insert</p>'

  showMenu = ->
    menu = $item.find('p').append """
      <br>Or Choose a Plugin
      <center>
      <table style="text-align:left;">
      <tr><td><ul id=format><td><ul id=data><td><ul id=other>
    """
    for info in window.catalog
      column = info.category || 'other'
      column = 'other' unless column in ['format', 'data']
      menu.find('#'+column).append """
        <li><a class="menu" href="#" title="#{info.title}">#{info.name}</a></li>
      """
    menu.find('a.menu').click (evt)->
      $item.removeClass('factory').addClass(item.type=evt.target.text.toLowerCase())
      $item.unbind()
      editor.textEditor $item, item

  showPrompt = ->
    $item.append "<p>#{resolve.resolveLinks(item.prompt)}</b>"

  if item.prompt
    showPrompt()
  else if window.catalog?
    showMenu()
  else
    Steward.get 'factories',null, (err,data)->
      window.catalog = data
      showMenu()

bind = ($item, item) ->

  syncEditAction = ->
    $item.empty().unbind()
    $item.removeClass("factory").addClass(item.type)
    $page = $item.parents('.page:first')
    try
      $item.data 'pageElement', $page
      $item.data 'item', item
      plugin.getPlugin item.type, (plugin) ->
        plugin.emit $item, item
        plugin.bind $item, item
    catch err
      $item.append "<p class='error'>#{err}</p>"
    pageHandler.put $page, {type: 'edit', id: item.id, item: item}

  punt = (data) ->
    item.prompt = "<b>Unexpected Item</b><br>We can't make sense of the drop.<br>#{JSON.stringify data}<br>Try something else or see [[About Factory Plugin]]."
    data.userAgent = navigator.userAgent
    item.punt = data
    syncEditAction()

  addReference = (data) ->
    Steward.get("page",
      pageInformation:
        site: data.site
        slug: data.slug
      whenGotten: (pageObject)->
        item.type = 'reference'
        item.site = data.site
        item.title = pageObject.getTitle() || data.slug
        item.text = synopsis remote
        syncEditAction()
        neighborhood.registerNeighbor item.site if item.site?
    )

  addVideo = (video) ->
    item.type = 'video'
    item.text = "#{video.text}\n(double-click to edit caption)\n"
    syncEditAction()

  readFile = (file) ->
    if file?
      [majorType, minorType] = file.type.split("/")
      reader = new FileReader()
      if majorType == "image"
        reader.onload = (loadEvent) ->
          item.type = 'image'
          item.url = loadEvent.target.result
          item.caption ||= "Uploaded image"
          syncEditAction()
        reader.readAsDataURL(file)
      else if majorType == "text"
        reader.onload = (loadEvent) ->
          result = loadEvent.target.result
          if minorType == 'csv'
            item.type = 'data'
            item.columns = (array = csvToArray result)[0]
            item.data = arrayToJson array
            item.text = file.fileName
          else
            item.type = 'paragraph'
            item.text = result
          syncEditAction()
        reader.readAsText(file)
      else
        punt
          file: file

  $item.dblclick ->
    $item.removeClass('factory').addClass(item.type='paragraph')
    $item.unbind()
    editor.textEditor $item, item

  $item.bind 'dragenter', (evt) -> evt.preventDefault()
  $item.bind 'dragover', (evt) -> evt.preventDefault()
  $item.bind "drop", drop.dispatch
    page: addReference
    file: readFile
    video: addVideo
    punt: punt

# from http://www.bennadel.com/blog/1504-Ask-Ben-Parsing-CSV-Strings-With-Javascript-Exec-Regular-Expression-Command.htm
# via http://stackoverflow.com/questions/1293147/javascript-code-to-parse-csv-data

csvToArray = (strData, strDelimiter) ->
  strDelimiter = (strDelimiter or ",")
  objPattern = new RegExp(("(\\" + strDelimiter + "|\\r?\\n|\\r|^)" + "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" + "([^\"\\" + strDelimiter + "\\r\\n]*))"), "gi")
  arrData = [ [] ]
  arrMatches = null
  while arrMatches = objPattern.exec(strData)
    strMatchedDelimiter = arrMatches[1]
    arrData.push []  if strMatchedDelimiter.length and (strMatchedDelimiter isnt strDelimiter)
    if arrMatches[2]
      strMatchedValue = arrMatches[2].replace(new RegExp("\"\"", "g"), "\"")
    else
      strMatchedValue = arrMatches[3]
    arrData[arrData.length - 1].push strMatchedValue
  arrData

arrayToJson = (array) ->
  cols = array.shift()
  rowToObject = (row) ->
    obj = {}
    for [k, v] in _.zip(cols, row)
      obj[k] = v if v? && (v.match /\S/) && v != 'NULL'
    obj
  (rowToObject row for row in array)

module.exports = {emit, bind}
