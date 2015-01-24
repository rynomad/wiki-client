(function() {
  var escape;

  escape = function(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };
  window.plugins.code = (function() {
    var load;

    function code() {}

    load = function(callback) {
      console.log("load called")
      chrome.runtime.sendMessage({get:"css", options:{path:"plugins/wiki-plugin-code/client/prettify.css"}}, function(response){
        console.log("prettify.css loaded")
        wiki.getScript('plugins/wiki-plugin-code/client/prettify.js', callback);
      });
      console.log("load")
    };

    code.emit = function(div, item) {
      return load(function() {
        return div.append("<pre class='prettyprint'>" + (prettyPrintOne(escape(item.text))) + "</pre>");
      });
    };

    code.bind = function(div, item) {
      return load(function() {
        return div.dblclick(function() {
          return wiki.textEditor(div, item);
        });
      });
    };
    return code;

  })();

}).call(this);

/*
//@ sourceMappingURL=code.js.map
*/
