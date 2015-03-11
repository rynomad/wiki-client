(function() {
  var display, findData, formatTime;

  formatTime = function(time) {
    var am, d, h, mi, mo;
    d = new Date((time > 10000000000 ? time : time * 1000));
    mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
    h = d.getHours();
    am = h < 12 ? 'AM' : 'PM';
    h = h === 0 ? 12 : h > 12 ? h - 12 : h;
    mi = (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
    return "" + h + ":" + mi + " " + am + "<br>" + (d.getDate()) + " " + mo + " " + (d.getFullYear());
  };

  display = function(div, data) {
    var sample, time;
    time = data[0], sample = data[1];
    div.find('p:first').text(sample.toFixed(1));
    return div.find('p:last').html(formatTime(time));
  };

  findData = function(item, thumb) {
    var data, _i, _len, _ref;
    _ref = item.data;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      data = _ref[_i];
      if (data[0] === thumb) {
        return data;
      }
    }
    return null;
  };

  window.plugins.chart = {
    emit: function(div, item) {
      var captionElement, chartElement;
      chartElement = $('<p />').addClass('readout').appendTo(div).text(item.data.last().last());
      return captionElement = $('<p />').html(wiki.resolveLinks(item.caption)).appendTo(div);
    },
    bind: function(div, item) {
      var lastThumb;
      lastThumb = null;
      div.find('p:first').mousemove(function(e) {
        var data, sample, time;
        if ((data = item.data[Math.floor(item.data.length * e.offsetX / e.target.offsetWidth)]) == null) {
          return;
        }
        time = data[0], sample = data[1];
        if (time === lastThumb || null === (lastThumb = time)) {
          return;
        }
        display(div, data);
        return div.trigger('thumb', +time);
      }).dblclick(function() {
        return wiki.dialog("JSON for " + item.caption, $('<pre/>').text(JSON.stringify(item.data, null, 2)));
      });
      return $('.main').on('thumb', function(evt, thumb) {
        var data;
        if (thumb !== lastThumb && (data = findData(item, thumb))) {
          lastThumb = thumb;
          return display(div, data);
        }
      });
    }
  };

}).call(this);

/*
//@ sourceMappingURL=chart.js.map
*/