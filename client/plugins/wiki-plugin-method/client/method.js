(function() {
  var annotate, asUnits, asValue, avg, bind, coerce, conversions, difference, dispatch, emit, emptyArray, evaluate, extend, findFactor, hasUnits, ident, inspect, isEqual, lexer, packUnits, parseLabel, parseRatio, parseUnits, parser, print, printUnits, product, ratio, round, simplify, sum, unpackUnits;

  conversions = null;

  asValue = function(obj) {
    if (obj == null) {
      return NaN;
    }
    switch (obj.constructor) {
      case Number:
        return obj;
      case String:
        return +obj;
      case Array:
        return asValue(obj[0]);
      case Object:
        return asValue(obj.value);
      case Function:
        return asValue(obj());
      default:
        return NaN;
    }
  };

  asUnits = function(obj) {
    if (obj == null) {
      return [];
    }
    switch (obj.constructor) {
      case Number:
        return [];
      case String:
        return [];
      case Array:
        return asUnits(obj[0]);
      case Object:
        if (obj.units != null) {
          return obj.units;
        } else if (obj.value != null) {
          return asUnits(obj.value);
        } else {
          return [];
        }
        break;
      case Function:
        return units(obj());
      default:
        return [];
    }
  };

  parseUnits = function(string) {
    var units;
    string = string.toLowerCase();
    string = string.replace(/\bsquare\s+(\w+)\b/, "$1 $1");
    string = string.replace(/\bcubic\s+(\w+)\b/, "$1 $1 $1");
    units = string.match(/(\w+)/g);
    if (units == null) {
      return [];
    }
    return units.sort();
  };

  parseRatio = function(string) {
    var ratio, units;
    if (ratio = string.match(/^\((.+?)\/(.+?)\)$/)) {
      return {
        numerator: parseUnits(ratio[1]),
        denominator: parseUnits(ratio[2])
      };
    } else if (units = string.match(/^\((.+?)\)$/)) {
      return parseUnits(units[1]);
    } else {
      return void 0;
    }
  };

  parseLabel = function(string) {
    var phrases, result;
    if (phrases = string.match(/(\(.+?\)).*?(\(.+?\))?[^(]*$/)) {
      result = {};
      result.units = parseRatio(phrases[1]);
      if (phrases[2]) {
        result.from = parseRatio(phrases[2]);
      }
    }
    return result;
  };

  extend = function(object, properties) {
    var key, val;
    for (key in properties) {
      val = properties[key];
      object[key] = val;
    }
    return object;
  };

  emptyArray = function(obj) {
    return obj.constructor === Array && obj.length === 0;
  };

  simplify = function(obj) {
    if (obj == null) {
      return NaN;
    }
    switch (obj.constructor) {
      case Number:
        return obj;
      case String:
        return +obj;
      case Array:
        return simplify(obj[0]);
      case Object:
        if (obj.units === void 0) {
          return simplify(obj.value);
        } else if (emptyArray(obj.units)) {
          return simplify(obj.value);
        } else {
          return obj;
        }
        break;
      case Function:
        return simplify(obj());
      default:
        return NaN;
    }
  };

  inspect = function(obj) {
    if (obj == null) {
      return "nullish";
    }
    switch (obj.constructor) {
      case Number:
        return obj;
      case String:
        return obj;
      case Array:
        return JSON.stringify(obj).replace(/\"/g, '');
      case Object:
        return JSON.stringify(obj).replace(/\"/g, '');
      case Function:
        return 'functionish';
      default:
        return "wierdish";
    }
  };

  findFactor = function(to, from) {
    var label, value;
    for (label in conversions) {
      value = conversions[label];
      if ((value.from != null) && isEqual(from, value.from)) {
        if (isEqual(to, value.units)) {
          return asValue(value);
        }
      }
      if ((value.from != null) && isEqual(to, value.from)) {
        if (isEqual(from, value.units)) {
          return 1 / (asValue(value));
        }
      }
    }
    return null;
  };

  hasUnits = function(obj) {
    return !emptyArray(asUnits(obj));
  };

  isEqual = function(a, b) {
    return (inspect(a)) === (inspect(b));
  };

  coerce = function(toUnits, value) {
    var factor, fromUnits;
    if (isEqual(toUnits, fromUnits = asUnits(simplify(value)))) {
      return value;
    } else if (factor = findFactor(toUnits, fromUnits)) {
      return {
        value: factor * asValue(value),
        units: toUnits
      };
    } else {
      throw new Error("can't convert to " + (inspect(toUnits)) + " from " + (inspect(fromUnits)));
    }
  };

  unpackUnits = function(value) {
    var denominator, numerator, u, v;
    v = asValue(value);
    u = asUnits(value);
    if (u.constructor === Array) {
      numerator = u;
      denominator = [];
    } else {
      numerator = u.numerator;
      denominator = u.denominator;
    }
    return [v, numerator, denominator];
  };

  packUnits = function(nums, denoms) {
    var d, keep, n, unit, where, _i, _len, _ref, _ref1;
    n = (_ref = []).concat.apply(_ref, nums);
    d = (_ref1 = []).concat.apply(_ref1, denoms);
    keep = [];
    for (_i = 0, _len = d.length; _i < _len; _i++) {
      unit = d[_i];
      if ((where = n.indexOf(unit)) === -1) {
        keep.push(unit);
      } else {
        n.splice(where, 1);
      }
    }
    if (keep.length) {
      return {
        numerator: n.sort(),
        denominator: keep.sort()
      };
    } else {
      return n.sort();
    }
  };

  printUnits = function(units) {
    if (emptyArray(units)) {
      return '';
    } else if (units.constructor === Array) {
      return "( " + (units.join(' ')) + " )";
    } else {
      return "( " + (units.numerator.join(' ')) + " / " + (units.denominator.join(' ')) + " )";
    }
  };

  sum = function(v) {
    return simplify(v.reduce(function(sum, each) {
      var toUnits, value;
      toUnits = asUnits(simplify(each));
      value = coerce(toUnits, sum);
      return {
        value: asValue(value) + asValue(each),
        units: toUnits
      };
    }));
  };

  difference = function(v) {
    var toUnits, value;
    toUnits = asUnits(simplify(v[1]));
    value = coerce(toUnits, v[0]);
    return {
      value: asValue(value) - asValue(v[1]),
      units: toUnits
    };
  };

  product = function(v) {
    return simplify(v.reduce(function(prod, each) {
      var e, ed, en, p, pd, pn, _ref, _ref1;
      _ref = unpackUnits(prod), p = _ref[0], pn = _ref[1], pd = _ref[2];
      _ref1 = unpackUnits(each), e = _ref1[0], en = _ref1[1], ed = _ref1[2];
      return {
        value: p * e,
        units: packUnits([pn, en], [pd, ed])
      };
    }));
  };

  ratio = function(v) {
    var d, dd, dn, n, nd, nn, _ref, _ref1;
    _ref = unpackUnits(v[0]), n = _ref[0], nn = _ref[1], nd = _ref[2];
    _ref1 = unpackUnits(v[1]), d = _ref1[0], dn = _ref1[1], dd = _ref1[2];
    return simplify({
      value: n / d,
      units: packUnits([nn, dd], [nd, dn])
    });
  };

  avg = function(v) {
    return sum(v) / v.length;
  };

  round = function(n) {
    if (n == null) {
      return '?';
    }
    if (n.toString().match(/\.\d\d\d/)) {
      return n.toFixed(2);
    } else {
      return n;
    }
  };

  annotate = function(text) {
    if (text == null) {
      return '';
    }
    return " <span title=\"" + text + "\">*</span>";
  };

  print = function(report, value, hover, line, comment, color) {
    var long;
    if (report == null) {
      return;
    }
    long = '';
    if (line.length > 40) {
      long = line;
      line = "" + (line.substr(0, 20)) + " ... " + (line.substr(-15));
    }
    return report.push("<tr style=\"background:" + color + ";\">\n  <td style=\"width: 20%; text-align: right; padding: 0 4px;\" title=\"" + (hover || '') + "\">\n    <b>" + (round(asValue(value))) + "</b>\n  <td title=\"" + long + "\">" + line + (annotate(comment)) + "</td>");
  };

  ident = function(str, syms) {
    var label, regexp, value;
    if (str.match(/^\d+(\.\d+)?(e\d+)?$/)) {
      return Number(str);
    } else {
      regexp = new RegExp("\\b" + str + "\\b");
      for (label in syms) {
        value = syms[label];
        if (label.match(regexp)) {
          return value;
        }
      }
      throw new Error("can't find value for '" + str + "'");
    }
  };

  lexer = function(str, syms) {
    var buf, c, i, tmp;
    if (syms == null) {
      syms = {};
    }
    buf = [];
    tmp = "";
    i = 0;
    while (i < str.length) {
      c = str[i++];
      if (c === " ") {
        continue;
      }
      if (c === "+" || c === "-" || c === "*" || c === "/" || c === "(" || c === ")") {
        if (tmp) {
          buf.push(ident(tmp, syms));
          tmp = "";
        }
        buf.push(c);
        continue;
      }
      tmp += c;
    }
    if (tmp) {
      buf.push(ident(tmp, syms));
    }
    return buf;
  };

  parser = function(lexed) {
    var expr, fact, term;
    fact = function() {
      var c, _ref;
      c = lexed.shift();
      if ((_ref = typeof c) === "number" || _ref === "object") {
        return c;
      }
      if (c === "(") {
        c = expr();
        if (lexed.shift() !== ")") {
          throw new Error("missing paren");
        }
        return c;
      }
      throw new Error("missing value");
    };
    term = function() {
      var c, o, _ref;
      c = fact();
      while ((_ref = lexed[0]) === "*" || _ref === "/") {
        o = lexed.shift();
        if (o === "*") {
          c = product([c, term()]);
        }
        if (o === "/") {
          c = ratio([c, term()]);
        }
      }
      return c;
    };
    expr = function() {
      var c, o, _ref;
      c = term();
      while ((_ref = lexed[0]) === "+" || _ref === "-") {
        o = lexed.shift();
        if (o === "+") {
          c = sum([c, term()]);
        }
        if (o === "-") {
          c = difference([c, term()]);
        }
      }
      return c;
    };
    return expr();
  };

  dispatch = function(state, done) {
    var apply, args, attach, change, color, comment, count, err, hover, input, label, line, list, local, lookup, output, polynomial, previous, result, s, show, units, v, value, _ref, _ref1;
    state.list || (state.list = []);
    state.input || (state.input = {});
    state.output || (state.output = {});
    state.local || (state.local = {});
    state.lines || (state.lines = state.item.text.split("\n"));
    line = state.lines.shift();
    if (line == null) {
      return done(state);
    }
    attach = function(search) {
      var elem, source, _i, _len, _ref;
      _ref = wiki.getDataNodes(state.div);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        elem = _ref[_i];
        if ((source = $(elem).data('item')).text.indexOf(search) >= 0) {
          return source.data;
        }
      }
      throw new Error("can't find dataset with caption " + search);
    };
    lookup = function(v) {
      var row, table;
      table = attach('Tier3ExposurePercentages');
      if (isNaN(v[0])) {
        return NaN;
      }
      if (isNaN(v[1])) {
        return NaN;
      }
      row = _.find(table, function(row) {
        return asValue(row.Exposure) === v[0] && asValue(row.Raw) === v[1];
      });
      if (row == null) {
        throw new Error("can't find exposure " + v[0] + " and raw " + v[1]);
      }
      return asValue(row.Percentage);
    };
    polynomial = function(v, subtype) {
      var result, row, table;
      table = attach('Tier3Polynomials');
      row = _.find(table, function(row) {
        return ("" + row.SubType + " Scaled") === subtype && asValue(row.Min) <= v && asValue(row.Max) > v;
      });
      if (row == null) {
        throw new Error("can't find applicable polynomial for " + v + " in '" + subtype + "'");
      }
      result = asValue(row.C0);
      result += asValue(row.C1) * v;
      result += asValue(row.C2) * Math.pow(v, 2);
      result += asValue(row.C3) * Math.pow(v, 3);
      result += asValue(row.C4) * Math.pow(v, 4);
      result += asValue(row.C5) * Math.pow(v, 5);
      result += asValue(row.C6) * Math.pow(v, 6);
      if (asValue(row['One minus'])) {
        result = 1 - result;
      }
      return Math.min(1, Math.max(0, result));
    };
    show = function(list, legend) {
      var readout, value;
      value = sum(list);
      if (emptyArray(asUnits(parseLabel(legend)))) {
        legend += "<br>" + (printUnits(asUnits(value)));
      }
      readout = Number(asValue(value)).toLocaleString('en');
      state.show || (state.show = []);
      state.show.push({
        readout: readout,
        legend: legend
      });
      return value;
    };
    apply = function(name, list, label) {
      var result, toUnits;
      if (label == null) {
        label = '';
      }
      result = (function() {
        switch (name) {
          case 'SUM':
            return sum(list);
          case 'AVG':
          case 'AVERAGE':
            return avg(list);
          case 'MIN':
          case 'MINIMUM':
            return _.min(list);
          case 'MAX':
          case 'MAXIMUM':
            return _.max(list);
          case 'RATIO':
            return ratio(list);
          case 'ACCUMULATE':
            return (sum(list)) + (output[label] || input[label] || 0);
          case 'FIRST':
            return list[0];
          case 'PRODUCT':
            return product(list);
          case 'LOOKUP':
            return lookup(list);
          case 'POLYNOMIAL':
            return polynomial(list[0], label);
          case 'SHOW':
            return show(list, label);
          case 'CALC':
            return parser(lexer(label, state.local));
          default:
            throw new Error("don't know how to '" + name + "'");
        }
      })();
      if (name === 'CALC' || emptyArray(toUnits = asUnits(parseLabel(label)))) {
        return result;
      } else {
        return coerce(toUnits, result);
      }
    };
    color = '#eee';
    value = comment = hover = null;
    conversions = input = state.input;
    output = state.output;
    local = state.local;
    list = state.list;
    label = null;
    try {
      if (args = line.match(/^([0-9.eE-]+) +([\w \.%(){},&\*\/+-]+)$/)) {
        result = +args[1];
        units = parseLabel(label = args[2]);
        if (units) {
          result = extend({
            value: result
          }, units);
        }
        local[label] = output[label] = value = result;
      } else if (args = line.match(/^([A-Z]+) +([\w \.%(){},&\*\/+-]+)$/)) {
        _ref = [apply(args[1], list, args[2]), [], list.length], value = _ref[0], list = _ref[1], count = _ref[2];
        color = '#ddd';
        hover = "" + args[1] + " of " + count + " numbers\n= " + (asValue(value)) + " " + (printUnits(asUnits(value)));
        label = args[2];
        if (((output[label] != null) || (input[label] != null)) && !state.item.silent) {
          previous = asValue(output[label] || input[label]);
          if (Math.abs(change = value / previous - 1) > 0.0001) {
            comment = "previously " + previous + "\nΔ " + (round(change * 100)) + "%";
          }
        }
        local[label] = output[label] = value;
        if ((s = state.item.checks) && (v = s[label]) !== void 0) {
          if (asValue(v).toFixed(4) !== asValue(value).toFixed(4)) {
            color = '#faa';
            label += " != " + (asValue(v).toFixed(4));
            if (state.caller) {
              state.caller.errors.push({
                message: label
              });
            }
          }
        }
      } else if (args = line.match(/^([A-Z]+)$/)) {
        _ref1 = [apply(args[1], list), [], list.length], value = _ref1[0], list = _ref1[1], count = _ref1[2];
        local[args[1]] = value;
        color = '#ddd';
        hover = "" + args[1] + " of " + count + " numbers\n= " + (asValue(value)) + " " + (printUnits(asUnits(value)));
      } else if (line.match(/^[0-9\.eE-]+$/)) {
        value = +line;
        label = '';
      } else if (args = line.match(/^ *([\w \.%(){},&\*\/+-]+)$/)) {
        if (output[args[1]] != null) {
          local[args[1]] = value = output[args[1]];
        } else if (input[args[1]] != null) {
          local[args[1]] = value = input[args[1]];
        } else {
          color = '#edd';
          comment = "can't find value of '" + line + "'";
        }
      } else {
        color = '#edd';
        comment = "can't parse '" + line + "'";
      }
    } catch (_error) {
      err = _error;
      color = '#edd';
      value = null;
      comment = err.message;
    }
    if ((state.caller != null) && color === '#edd') {
      state.caller.errors.push({
        message: comment
      });
    }
    state.list = list;
    if ((value != null) && !isNaN(asValue(value))) {
      state.list.push(value);
    }
    print(state.report, value, hover, label || line, comment, color);
    return dispatch(state, done);
  };

  bind = function(div, item) {};

  emit = function(div, item, done) {
    var candidates, elem, input, output, state, _i, _len;
    input = {};
    output = {};
    candidates = $(".item:lt(" + ($('.item').index(div)) + ")");
    for (_i = 0, _len = candidates.length; _i < _len; _i++) {
      elem = candidates[_i];
      elem = $(elem);
      if (elem.hasClass('radar-source')) {
        _.extend(input, elem.get(0).radarData());
      } else if (elem.hasClass('data')) {
        _.extend(input, elem.data('item').data[0]);
      }
    }
    div.addClass('radar-source');
    div.get(0).radarData = function() {
      return output;
    };
    div.mousemove(function(e) {
      if ($(e.target).is('td')) {
        return $(div).triggerHandler('thumb', $(e.target).text());
      }
    });
    div.dblclick(function(e) {
      if (e.shiftKey) {
        return wiki.dialog("JSON for Method plugin", $('<pre/>').text(JSON.stringify(item, null, 2)));
      } else {
        return wiki.textEditor(state.div, state.item);
      }
    });
    state = {
      div: div,
      item: item,
      input: input,
      output: output,
      report: []
    };
    return dispatch(state, function(state) {
      var $show, each, label, table, text, value, _j, _len1, _ref, _ref1, _ref2;
      if (state.show) {
        state.div.addClass("data");
        state.div.append($show = $("<div>"));
        _ref = state.show;
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          each = _ref[_j];
          $show.append($("<p class=readout>" + each.readout + "</p>\n<p class=legend>" + each.legend + "</p>"));
        }
      } else {
        text = state.report.join("\n");
        table = $('<table style="width:100%; background:#eee; padding:.8em; margin-bottom:5px;"/>').html(text);
        state.div.append(table);
        if (input['debug']) {
          _ref1 = state.output;
          for (label in _ref1) {
            value = _ref1[label];
            state.div.append($("<p class=error>" + label + " =><br> " + (inspect(value)) + "</p>"));
          }
        }
        if (output['debug']) {
          _ref2 = state.input;
          for (label in _ref2) {
            value = _ref2[label];
            state.div.append($("<p class=error>" + label + " =><br> " + (inspect(value)) + "</p>"));
          }
        }
      }
      return setTimeout(done, 10);
    });
  };

  evaluate = function(caller, item, input, done) {
    var state;
    state = {
      caller: caller,
      item: item,
      input: input,
      output: {}
    };
    return dispatch(state, function(state, input) {
      return done(state.caller, state.output);
    });
  };

  if (typeof window !== "undefined" && window !== null) {
    window.plugins.method = {
      emit: emit,
      bind: bind,
      "eval": evaluate
    };
  }

  if (typeof module !== "undefined" && module !== null) {
    module.exports = {
      lexer: lexer,
      parser: parser,
      dispatch: dispatch,
      asValue: asValue,
      asUnits: asUnits,
      hasUnits: hasUnits,
      simplify: simplify,
      parseUnits: parseUnits,
      parseRatio: parseRatio,
      parseLabel: parseLabel
    };
  }

}).call(this);

/*
//@ sourceMappingURL=method.js.map
*/