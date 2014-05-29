# The plugin module manages the dynamic retrieval of plugin
# javascript including additional scripts that may be requested.

module.exports = plugin = {}
wik = require "./wik"
ndnIO = null
# define cachedScript that allows fetching a cached script.
# see example in http://api.jquery.com/jQuery.getScript/
plugin.useIO = (io) ->
  ndnIO = io
  plugin.io = io

cachedScript = (pluginName, callback) ->
  wik.getPlugin scripts, pluginName, callback


scripts = []
getScript = plugin.getScript = (url, callback = () ->) ->
  # console.log "URL :", url, "\nCallback :", callback
  if url in scripts
    callback()
  else
    cachedScript(url, callback)

plugin.get = plugin.getPlugin = (name, callback) ->
  return callback(window.plugins[name]) if window.plugins[name]
  getScript name, () ->
    console.log "getScript callback"
    return callback(window.plugins[name]) if window.plugins[name]

plugin.getCSS = (name, callback) ->
  wik.getCSS name, callback

plugin.do = plugin.doPlugin = (div, item, done=->) ->
  error = (ex) ->
    errorElement = $("<div />").addClass('error')
    errorElement.text(ex.toString())
    div.append(errorElement)

  div.data 'pageElement', div.parents(".page")
  div.data 'item', item
  plugin.get item.type, (script) ->
    try
      throw TypeError("Can't find plugin for '#{item.type}'") unless script?
      if script.emit.length > 2
        script.emit div, item, ->
          script.bind div, item
          done()
      else
        script.emit div, item
        script.bind div, item
        done()
    catch err
      console.log 'plugin error', err
      error(err)
      done()

plugin.registerPlugin = (pluginName,pluginFn)->
  window.plugins[pluginName] = pluginFn($)


