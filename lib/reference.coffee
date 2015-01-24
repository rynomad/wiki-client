# The Reference plugin holds a site and page name to be
# found on that site. Search, for example, produces a page of
# references. Double click will edit the body of a reference
# but not the name and site.

editor = require './editor'
resolve = require './resolve'
Steward = require './steward'

# see http://fed.wiki.org/about-reference-plugin.html

emit = ($item, item) ->
  slug = item.slug or 'welcome-visitors'
  site = item.site
  resolve.resolveFrom site, ->
    $item.append """
      <p style='margin-bottom:3px;'>
        <img class='remote'
          src=''
          title='#{site}'
          data-site="#{site}"
          data-slug="#{slug}"
        >
        #{resolve.resolveLinks "[[#{item.title or slug}]]"}
      </p>
      <div>
        #{resolve.resolveLinks(item.text)}
      </div>
    """
    Steward.get("favicon",
      remote: site
    ,(err, res)->
      console.log("favicon callback in reference",err, res)
      $item.find(".remote").attr("src", res.favicon)
      )
    $item
bind = ($item, item) ->
  $item.dblclick -> editor.textEditor $item, item

module.exports = {emit, bind}
