dropkick = require "dropkick"
link = require "./link"



window.onload = () ->
  dropkick(document.body)
    .on("file", (file) ->

      fr = new FileReader()
      fr.onloadend = (e) ->
        string = e.target.result
        site = null
        page = JSON.parse(string)
        for entry in page.journal by -1
          if entry.site
            site = entry.site
            break

        localStorage[wiki.asSlug(page.title)] = string
        link.showPage(wiki.asSlug(page.title), site)

      if file.name.indexOf ".wik" == file.name.length - 4
        fr.readAsText(file)

      console.log "got file", file
    )
