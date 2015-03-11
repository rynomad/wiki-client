
/*
 * Federated Wiki : Markdown Plugin
 *
 * Licensed under the MIT license.
 * https://github.com/fedwiki/wiki-plugin-markdown/blob/master/LICENSE.txt
 */

(function() {
  var bind, emit, emphasis, escape, expand, headers, lineNumber, lists, toggle;

  lineNumber = 0;

  headers = function(line) {
    return line = line.replace(/^#+(.*)$/, '<h3>$1</h3>');
  };

  emphasis = function(line) {
    line = line.replace(/\*\*(\S.*?\S)\*\*/g, '<b>$1</b>');
    line = line.replace(/\_\_(\S.*?\S)\_\_/g, '<b>$1</b>');
    line = line.replace(/\*(\S.*?\S)\*/g, '<i>$1</i>');
    line = line.replace(/\_(\S.*?\S)\_/g, '<i>$1</i>');
    line = line.replace(/\*\*(\S)\*\*/g, '<b>$1</b>');
    line = line.replace(/\_\_(\S)\_\_/g, '<b>$1</b>');
    line = line.replace(/\*(\S)\*/g, '<i>$1</i>');
    return line = line.replace(/\_(\S)\_/g, '<i>$1</i>');
  };

  lists = function(line) {
    lineNumber++;
    line = line.replace(/^ *[*-] *(\[[ x]\])(.*)$/, "<li><span class=task line=" + lineNumber + ">$1</span>$2</li>");
    return line = line.replace(/^ *[*-](.*)$/, '<li>$1</li>');
  };

  escape = function(line) {
    return line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  expand = function(text) {
    var line;
    lineNumber = -1;
    return ((function() {
      var _i, _len, _ref, _results;
      _ref = text.split(/\n/);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        line = _ref[_i];
        _results.push(emphasis(headers(lists(escape(line)))));
      }
      return _results;
    })()).join("\n");
  };

  emit = function($item, item) {
    return $item.append("<p>\n  " + (wiki.resolveLinks(item.text, expand)) + "\n</p>");
  };

  toggle = function(item, lineNumber) {
    var lines;
    lines = item.text.split(/\n/);
    lines[lineNumber] = lines[lineNumber].replace(/\[[ x]\]/, function(box) {
      if (box === '[x]') {
        return '[ ]';
      } else {
        return '[x]';
      }
    });
    return item.text = lines.join("\n");
  };

  bind = function($item, item) {
    $item.dblclick(function() {
      return wiki.textEditor($item, item);
    });
    return $item.find('.task').click(function(e) {
      toggle(item, $(e.target).attr('line'));
      $item.empty();
      emit($item, item);
      bind($item, item);
      return wiki.pageHandler.put($item.parents('.page:first'), {
        type: 'edit',
        id: item.id,
        item: item
      });
    });
  };

  if (typeof window !== "undefined" && window !== null) {
    window.plugins.markdown = {
      emit: emit,
      bind: bind
    };
  }

  if (typeof module !== "undefined" && module !== null) {
    module.exports = {
      expand: expand
    };
  }

}).call(this);

//# sourceMappingURL=markdown.js.map
