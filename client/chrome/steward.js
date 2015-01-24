var randomByte, randomBytes;

randomByte = function() {
  return (((1 + Math.random()) * 0x100) | 0).toString(16).substring(1);
};

randomBytes = function(n) {
  return ((function() {
    var _i, _results;
    _results = [];
    for (_i = 1; 1 <= n ? _i <= n : _i >= n; 1 <= n ? _i++ : _i--) {
      _results.push(randomByte());
    }
    return _results;
  })()).join('');
};

function Steward(){
  return this;
}

function pageFromLocalStorage (slug){
  if (json = localStorage[slug]){
    return JSON.parse(json);
  } else {
    return undefined;
  }
}

Steward.prototype.get = function(asset, options, callback){
  asset = asset.charAt(0).toUpperCase()+ asset.toLowerCase().substr(1);

  if (this["get"+asset]){
    console.log("getting "+ asset)
    this["get"+asset](options, callback);
  } else {
    console.log("don't know how to get " + asset)
  }

  return this;
}

Steward.prototype.put = function(asset, options, callback){
  asset = asset.charAt(0).toUpperCase()+ asset.toLowerCase().substr(1);

  if (this["put"+asset]){

    this["put"+asset](options, callback);
  } else {
    console.log("don't know how to put " + asset)
  }

  return this;
}
var pushToLocal, pushToServer;
Steward.prototype.useLocalStorage = function(){
  return true;
}

Steward.prototype.putPage = function(options, callback){
  console.log("steward.putPage")
  options = options.request.options
  var action = options.action
    , pagePutInfo = options.pagePutInfo
    , page = options.page;

  var site = pagePutInfo.site

  if(this.useLocalStorage() || options.pagePutInfo.site === "local"){
    if (action.type === 'create') {
      page = {
        title: action.item.title,
        story: [],
        journal: []
      };
    } else {

      console.log("page", page)
      if (page.journal == null) {
        page.journal = [];
      }
      if ((site = action['fork']) != null) {
        page.journal = page.journal.concat({
          'type': 'fork',
          'site': site,
          'date': (new Date()).getTime()
        });
        delete action['fork'];
      }
    }
    page.journal = page.journal.concat(action);
    localStorage[pagePutInfo.slug] = JSON.stringify(page);
    options.slug = pagePutInfo.slug
    this.updateSitemap(options)
    callback({})
  }
};

Steward.prototype.putFavicon = function(options, callback){
  var fav = options.request.options.favicon;
  console.log("fave", fav)
  localStorage["#favicon"] = fav;
  callback(options)

}


Steward.prototype.getFavicon = function(options, callback){
  console.log("optionsFav", options)

  var url = options.request.options.remote ? "http://" + options.request.options.remote : ""
  if (options.request.options.remote == "extension"){
    url = false
  }
  if (url){
    url += "/favicon-url.png"
    $.ajax(url, {
      cache: true
      , success: function(res, status) {
        callback({favicon: "data:image/png;base64," + res})
      }
      , error: function(err){
        console.log("err getting that back")
        callback({favicon: url.split("-url").join("")} )
      }
    })
  } else if (localStorage["#favicon"]) {
    console.log("got favicon from localStorage")
    callback({favicon: localStorage["#favicon"]})
  } else {
    console.log("favicon")
    callback({err:true})
  }

}

Steward.prototype.getPage = function(options, callback){
  var Self = this;
  var _arg = options.request.options
    var localContext, localPage, pageInformation, rev, site, slug, url, whenGotten, whenNotGotten;
  pageInformation = _arg.pageInformation
  , whenGotten = _arg.whenGotten
  , whenNotGotten = _arg.whenNotGotten
  , localContext = _arg.localContext;

  slug = pageInformation.slug
  , rev = pageInformation.rev
  , site = pageInformation.site;

  console.log(JSON.stringify(localContext),"!!!!!!!!!!!")
  if (site) {
    localContext = [];
  } else {
    site = localContext.shift();
  }


  options.request.options.localContext = localContext
  console.log(site)
  if (site === 'view' || site === 'extension') {
    site = 'local';
  }
  console.log(site)
  if (site != null) {
    if (site === 'local') {
      console.log(site)
      if (localPage = pageFromLocalStorage(pageInformation.slug)) {
        return callback({page:localPage, site:"extension"})
      } else if (localContext.length) {
        console.log("site", site)
        return Self.getPage(options, callback);
      } else {
        console.log("reached the end")
        return callback({err:true})
      }
    } else {
      url = "http://" + site + "/" + slug + ".json";
    }
  } else {
    url = "http://" + site + "/" + slug + ".json";
  }
  return $.ajax({
    type: 'GET',
    dataType: 'json',
    url: url + ("?random=" + (randomBytes(4))),
    success: function(page) {
      console.log("got page?", page)
      callback({page:page, site: site})
    },
    error: function(xhr, type, msg) {
      console.log(xhr, type, msg)
      if (localContext.length > 0) {
        Self.getPage(options, callback);
      } else if (localPage = pageFromLocalStorage(pageInformation.slug)) {
        return callback({page:localPage, site: "extension"})
      } else{
        console.log("calling back with err")
        callback({err:true})
      }
    }
  });
}

Steward.prototype.getFactories = function(options, callback){
  $.getJSON("/system/factories.json", function(data){
    callback({factories: data});
  })
}

Steward.prototype.getIcons = function(options, callback){
  url = "/images/external-link-ltr-icon.url"

  $.ajax(url, {
    cache: true
    , success: function(res, status) {
      callback({externalLink:"data:image/png;base64,"+ res})
    }
    , error: function(err){
      callback({err: true})
    }
  })
}

var synopsis = function(page) {
  var p1, p2, synopsis;

  if ((page != null) && (page.story != null)) {
    p1 = page.story[0];
    p2 = page.story[1];
    if (p1 && p1.type === 'paragraph') {
      synopsis || (synopsis = p1.text);
    }
    if (p2 && p2.type === 'paragraph') {
      synopsis || (synopsis = p2.text);
    }
    if (p1 && (p1.text != null)) {
      synopsis || (synopsis = p1.text);
    }
    if (p2 && (p2.text != null)) {
      synopsis || (synopsis = p2.text);
    }
    synopsis || (synopsis = (page.story != null) && ("A page with " + page.story.length + " items."));
  } else {
    synopsis = 'A page with no story.';
  }
  return synopsis;
};

Steward.prototype.updateSitemap = function(opts){
  console.log("update sitemap", opts)
  var sitemap = localStorage["#sitemap"]

  var entry = {
    slug: opts.slug
    , title: opts.page.title
    , date: opts.page.journal[opts.page.journal.length - 1].date
    , synopsis : synopsis(opts.page)
  }
  if (!sitemap){
    sitemap = [entry];
  } else {
    sitemap = JSON.parse(sitemap)
  }
  for (var i = 0  ; i < sitemap.length ; i++){
    console.log("scanning", i, entry)
    if (sitemap[i].slug > opts.slug){
      sitemap.splice(i,0,entry )
      console.log("inserting")
      break;
    } else if (sitemap[i].slug == opts.slug){
      console.log("replacing")
      sitemap.splice(i,1,entry)
      break;
    } else if (i == sitemap.length - 1){
      console.log("adding?")
      sitemap = sitemap.concat([entry]);
    }
  }
  localStorage["#sitemap"] = JSON.stringify(sitemap);

}

Steward.prototype.putThispage = function(options, callback){
  console.log("putThisPage", options.request.options.slug)
  localStorage[options.request.options.slug] = JSON.stringify(options.request.options.page)
  this.updateSitemap(options.request.options);
  console.log("sitemap?")
  callback()
}

Steward.prototype.getSitemap = function(options, callback) {
  var request, sitemapUrl;
  var site = options.request.options.site
  if (site){
    if (site !== "extension"){
    sitemapUrl = "http://" + site + "/system/sitemap.json";
    request = $.ajax({
      type: 'GET',
      dataType: 'json',
      url: sitemapUrl
    });
    request.done(function(data) {
      console.log("send back sitemap", data)
      callback({ sitemap : data})
    }).fail(function(data) {
      callback({err: true})
    });
  } else {
    if (localStorage["#sitemap"]){
      callback({sitemap : JSON.parse(localStorage["#sitemap"]) || []})
    } else {
      callback({err: true})
    }
  }
  } else {
    if (localStorage["#sitemap"]){
      callback({sitemap : JSON.parse(localStorage["#sitemap"]) || []})
    } else {
      callback({err: true})
    }
  }
}

Steward.prototype.getScript = function(options, callback){
  var url = options.request.options.url.split("/")
  var name = url[url.length - 1].split(".")[0]
  chrome.tabs.executeScript(options.sender.tab.id, {"file":"plugins/wiki-plugin-"+name+"/client/"+name+".chrome.js"}, function(res){
    if (chrome.runtime.lastError){
      chrome.tabs.executeScript(options.sender.tab.id, {"file":"plugins/wiki-plugin-"+name+"/client/"+name+".js"}, function(res){
        if (chrome.runtime.lastError){
          chrome.tabs.executeScript(options.sender.tab.id, {"file":options.request.options.url},function(res){
            if (chrome.runtime.lastError){
              console.log("third try fail")
            } else {
              callback({err:null})
            }
          })
        } else {
          callback({err:null})
        }
      })
    } else {
      callback({err:null})
    }
  })
}

Steward.prototype.getCss = function(options, callback){
  console.log("get css", options,callback)
  chrome.tabs.insertCSS(options.sender.tab.id, {"file": options.request.options.path}, function(){
    callback({err:null})
  })
}


var steward = new Steward()


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(request)
    if (request.get){
      steward.get(request.get, {request:request, sender:sender}, sendResponse)
    } else if (request.put){
      steward.put(request.put, {request:request, sender:sender}, sendResponse)
    }
    return true;
  }
);
