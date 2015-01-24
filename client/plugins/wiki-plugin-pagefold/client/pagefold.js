(function() {
  var bind, emit;

  emit = function($item, item) {
    return $item.append("<div style=\"height: 10px; border-top: 2px solid lightgray; margin-top: 24px; text-align: center; position: relative; clear: both;\">\n	<span style=\"position: relative; top: -.8em; background: white; display: inline-block; color: gray; \">\n		&nbsp; " + item.text + " &nbsp;\n	</span>\n</div>");
  };

  bind = function($item, item) {
    return $item.dblclick(function() {
      return wiki.textEditor($item, item);
    });
  };

  window.plugins.pagefold = {
    emit: emit,
    bind: bind
  };

}).call(this);

/*
//@ sourceMappingURL=pagefold.js.map
*/