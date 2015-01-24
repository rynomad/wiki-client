(function() {
  var bind, embed, emit, parse;

  parse = function(text) {
    var args, line, result, _i, _len, _ref;
    if (text == null) {
      text = '';
    }
    result = {};
    _ref = text.split(/\r\n?|\n/);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      line = _ref[_i];
      if (args = line.match(/^\s*([A-Z]+)\s+([\w\-]+)\s*$/)) {
        result.player = args[1];
        result.key = args[2];
      } else {
        result.caption || (result.caption = ' ');
        result.caption += line + ' ';
      }
    }
    return result;
  };

  embed = function(_arg) {
    var key, player;
    player = _arg.player, key = _arg.key;
    switch (player) {
      case 'YOUTUBE':
        return "<iframe\n  width=\"420\" height=\"315\"\n  src=\"//www.youtube.com/embed/" + key + "?rel=0\"\n  frameborder=\"0\"\n  allowfullscreen>\n</iframe>";
      case 'VIMEO':
        return "<iframe\n  src=\"//player.vimeo.com/video/" + key + "?title=0&amp;byline=0&amp;portrait=0\"\n  width=\"420\" height=\"263\"\n  frameborder=\"0\"\n  allowfullscreen>\n</iframe>";
      default:
        return "(unknown player)";
    }
  };

  emit = function($item, item) {
    var result;
    result = parse(item.text);
    return $item.append("" + (embed(result)) + "\n<br>\n<i>" + (result.caption || "(no caption)") + "</i>");
  };

  bind = function($item, item) {
    return $item.dblclick(function() {
      return wiki.textEditor($item, item);
    });
  };

  if (typeof window !== "undefined" && window !== null) {
    window.plugins.video = {
      emit: emit,
      bind: bind
    };
  }

  if (typeof module !== "undefined" && module !== null) {
    module.exports = {
      parse: parse,
      embed: embed
    };
  }

}).call(this);

//# sourceMappingURL=video.js.map
