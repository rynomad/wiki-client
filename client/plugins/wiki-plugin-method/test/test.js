(function() {
  var asValue, expect, method;

  method = require('../client/method');

  expect = require('expect.js');

  asValue = method.asValue;

  describe('method plugin', function() {
    describe('values', function() {
      var traits;
      traits = function(value) {
        return [method.asValue(value), method.asUnits(value), method.hasUnits(value)];
      };
      it('can be null', function() {});
      it('can be a number', function() {
        return expect(traits(100)).to.eql([100, [], false]);
      });
      it('can be a string', function() {
        return expect(traits("200")).to.eql([200, [], false]);
      });
      it('can be an array', function() {
        return expect(traits([300, 400, 500])).to.eql([300, [], false]);
      });
      it('can be an object', function() {
        return expect(traits({
          value: 400
        })).to.eql([400, [], false]);
      });
      it('can have units', function() {
        return expect(traits({
          value: 500,
          units: ['mph']
        })).to.eql([500, ['mph'], true]);
      });
      it('can have a value with units', function() {
        return expect(traits({
          value: {
            value: 600,
            units: ['ppm']
          }
        })).to.eql([600, ['ppm'], true]);
      });
      it('can have empty units', function() {
        return expect(traits({
          value: 700,
          units: []
        })).to.eql([700, [], false]);
      });
      return it('can be an array with units within', function() {
        return expect(traits([
          {
            value: 800,
            units: ['feet']
          }, 900
        ])).to.eql([800, ['feet'], true]);
      });
    });
    describe('simplify', function() {
      it('no units', function() {
        var value;
        value = method.simplify({
          value: 100
        });
        return expect(value).to.be(100);
      });
      return it('empty units', function() {
        var value;
        value = method.simplify({
          value: 200,
          units: []
        });
        return expect(value).to.be(200);
      });
    });
    describe('parsing', function() {
      it('recognizes numbers', function(done) {
        var state;
        state = {
          item: {
            text: "123"
          }
        };
        return method.dispatch(state, function(state) {
          expect(state.list).to.eql([123]);
          return done();
        });
      });
      it('defines values', function(done) {
        var state;
        state = {
          item: {
            text: "321 abc"
          }
        };
        return method.dispatch(state, function(state) {
          expect(state.output.abc).to.be(321);
          return done();
        });
      });
      it('retrieves values', function(done) {
        var state;
        state = {
          item: {
            text: "abc"
          },
          input: {
            abc: 456
          }
        };
        return method.dispatch(state, function(state) {
          expect(state.list).to.eql([456]);
          return done();
        });
      });
      return it('computes sums', function(done) {
        var state;
        state = {
          item: {
            text: "abc\n2000\nSUM\n1000\nSUM xyz"
          },
          input: {
            abc: 456
          }
        };
        return method.dispatch(state, function(state) {
          expect(state.output.xyz).to.be(3456);
          return done();
        });
      });
    });
    describe('errors', function() {
      it('illegal input', function(done) {
        var state;
        state = {
          item: {
            text: "!!!"
          },
          caller: {
            errors: []
          }
        };
        return method.dispatch(state, function(state) {
          expect(state.caller.errors[0].message).to.be("can't parse '!!!'");
          return done();
        });
      });
      it('undefined variable', function(done) {
        var state;
        state = {
          item: {
            text: "foo"
          },
          caller: {
            errors: []
          }
        };
        return method.dispatch(state, function(state) {
          expect(state.caller.errors[0].message).to.be("can't find value of 'foo'");
          return done();
        });
      });
      it('undefined function', function(done) {
        var state;
        state = {
          item: {
            text: "RUMBA"
          },
          caller: {
            errors: []
          }
        };
        return method.dispatch(state, function(state) {
          expect(state.caller.errors[0].message).to.be("don't know how to 'RUMBA'");
          return done();
        });
      });
      return it('precomputed checks', function(done) {
        var state;
        state = {
          item: {
            text: "2\n3\nSUM five",
            checks: {
              five: 6
            }
          },
          caller: {
            errors: []
          }
        };
        return method.dispatch(state, function(state) {
          expect(state.caller.errors[0].message).to.be("five != 6.0000");
          return done();
        });
      });
    });
    describe('unit parsing', function() {
      it('sorts words', function() {
        var units;
        units = method.parseUnits("Pound Foot");
        return expect(units).to.eql(["foot", "pound"]);
      });
      it('ignores extra spaces', function() {
        var units;
        units = method.parseUnits("  Pound    Foot   ");
        return expect(units).to.eql(["foot", "pound"]);
      });
      it('ignores non-word characters', function() {
        var units;
        units = method.parseUnits("$ & ¢");
        return expect(units).to.eql([]);
      });
      it('expands squares and cubes', function() {
        var units;
        units = method.parseUnits("Square Pound Cubic Foot");
        return expect(units).to.eql(["foot", "foot", "foot", "pound", "pound"]);
      });
      it('recognizes ratios', function() {
        var units;
        units = method.parseRatio("(Pounds / Square Foot)");
        return expect(units).to.eql({
          numerator: ["pounds"],
          denominator: ["foot", "foot"]
        });
      });
      it('recognizes non-ratios', function() {
        var units;
        units = method.parseRatio("(Foot Pound)");
        return expect(units).to.eql(["foot", "pound"]);
      });
      it('recognizes inversions', function() {
        var units;
        units = method.parseRatio("( / Seconds)");
        return expect(units).to.eql({
          numerator: [],
          denominator: ["seconds"]
        });
      });
      it('ignores text outside parens', function() {
        var units;
        units = method.parseLabel("Speed (MPH) Moving Average");
        return expect(units).to.eql({
          units: ["mph"]
        });
      });
      it('recognizes conversions as unit pairs', function() {
        var units;
        units = method.parseLabel("1.47	(Feet / Seconds) from (Miles / Hours) ");
        return expect(units).to.eql({
          units: {
            numerator: ['feet'],
            denominator: ['seconds']
          },
          from: {
            numerator: ['miles'],
            denominator: ['hours']
          }
        });
      });
      it('defines values as objects', function(done) {
        var state;
        state = {
          item: {
            text: "321 abc (mph)"
          }
        };
        return method.dispatch(state, function(state) {
          expect(state.output['abc (mph)']).to.eql({
            value: 321,
            units: ["mph"]
          });
          return done();
        });
      });
      return it('defines conversion constants as objects', function(done) {
        var state;
        state = {
          item: {
            text: "1.47 (Feet/Seconds) from (Miles/Hours)"
          }
        };
        return method.dispatch(state, function(state) {
          expect(state.output['(Feet/Seconds) from (Miles/Hours)']).to.eql({
            value: 1.47,
            units: {
              numerator: ['feet'],
              denominator: ['seconds']
            },
            from: {
              numerator: ['miles'],
              denominator: ['hours']
            }
          });
          return done();
        });
      });
    });
    describe('conversions', function() {
      var input;
      input = {
        "(fps) from (mph)": {
          value: 88 / 60,
          units: ['fps'],
          from: ['mph']
        },
        "speed": {
          value: 30,
          units: ['mph']
        }
      };
      it('apply to arguments', function(done) {
        var state;
        state = {
          input: input,
          item: {
            text: "30 (mph)\n44 (fps)\nSUM speed"
          }
        };
        return method.dispatch(state, function(state) {
          expect(state.output['speed']).to.eql({
            value: 88,
            units: ['fps']
          });
          return done();
        });
      });
      it('apply to variables', function(done) {
        var state;
        state = {
          input: input,
          item: {
            text: "speed\n44 (fps)\nSUM speed"
          }
        };
        return method.dispatch(state, function(state) {
          expect(state.output['speed']).to.eql({
            value: 88,
            units: ['fps']
          });
          return done();
        });
      });
      it('apply to results', function(done) {
        var state;
        state = {
          input: input,
          item: {
            text: "60 (mph)\nSUM (fps)"
          }
        };
        return method.dispatch(state, function(state) {
          expect(state.output['(fps)']).to.eql({
            value: 88,
            units: ['fps']
          });
          return done();
        });
      });
      it('selected from alternatives', function(done) {
        var alternatives, state;
        alternatives = {
          "speeding": {
            value: 120,
            units: ['mph']
          },
          "(fps) from (mph)": {
            value: 88 / 60,
            units: ['fps'],
            from: ['mph']
          },
          "(miles/hour) from (mph)": {
            value: 1,
            units: {
              numerator: ['miles'],
              denominator: ['hour']
            },
            from: ['mph']
          },
          "speed": {
            value: 88,
            units: ['fps']
          }
        };
        state = {
          input: alternatives,
          item: {
            text: "speeding\nSUM (fps)"
          }
        };
        return method.dispatch(state, function(state) {
          expect(state.output['(fps)']).to.eql({
            value: 88 * 2,
            units: ['fps']
          });
          return done();
        });
      });
      it('optional when units are acceptable', function(done) {
        var state;
        state = {
          input: input,
          item: {
            text: "60 (mph)\n30 (mph)\nSUM"
          }
        };
        return method.dispatch(state, function(state) {
          expect(state.list[0]).to.eql({
            value: 90,
            units: ['mph']
          });
          return done();
        });
      });
      it('reported when missing', function(done) {
        var state;
        state = {
          item: {
            text: "22 (fps)\n15 (mps)\nSUM"
          },
          caller: {
            errors: []
          }
        };
        return method.dispatch(state, function(state) {
          expect(state.list[0]).to.eql({
            value: 22,
            units: ['fps']
          });
          expect(state.caller.errors[0].message).to.be("can't convert to [mps] from [fps]");
          return done();
        });
      });
      return it('adds units to SHOW legend', function(done) {
        var state;
        state = {
          item: {
            text: "36 (in/yd)\nSHOW Mumble"
          }
        };
        return method.dispatch(state, function(state) {
          expect(state.show[0]).to.eql({
            legend: "Mumble<br>( in / yd )",
            readout: "36"
          });
          return done();
        });
      });
    });
    describe('products', function() {
      var input;
      input = {
        "(Feet/Seconds) per (Miles/Hours)": {
          value: 88 / 60,
          units: ['fps'],
          from: ['mph']
        },
        "side": {
          value: 6,
          units: ['Inches']
        }
      };
      it('repeats units', function(done) {
        var state;
        state = {
          input: input,
          item: {
            text: "side\nside\nPRODUCT area"
          }
        };
        return method.dispatch(state, function(state) {
          expect(state.list[0]).to.eql({
            value: 36,
            units: ['Inches', 'Inches']
          });
          return done();
        });
      });
      it('cancels units', function(done) {
        var state;
        state = {
          input: input,
          item: {
            text: "2 (yd)\n3 (ft/yd)\n12 (in/ft)\nPRODUCT height"
          }
        };
        return method.dispatch(state, function(state) {
          expect(state.list[0]).to.eql({
            value: 72,
            units: ['in']
          });
          return done();
        });
      });
      return it('invert units for ratio', function(done) {
        var state;
        state = {
          input: input,
          item: {
            text: "72 (in)\n2 (yd)\nRATIO"
          }
        };
        return method.dispatch(state, function(state) {
          expect(state.list[0]).to.eql({
            value: 36,
            units: {
              numerator: ['in'],
              denominator: ['yd']
            }
          });
          return done();
        });
      });
    });
    return describe('expressions', function() {
      it('can be lexed with literals', function() {
        var tokens;
        tokens = method.lexer('12+(345-678)*910');
        return expect(tokens).to.eql([12, '+', '(', 345, '-', 678, ')', '*', 910]);
      });
      it('can be lexed with variables', function() {
        var syms, tokens;
        syms = {
          alpha: 100,
          beta: 200
        };
        tokens = method.lexer('12+(alpha-678)*beta', syms);
        return expect(tokens).to.eql([12, '+', '(', 100, '-', 678, ')', '*', 200]);
      });
      it('can be constant', function() {
        var value;
        value = method.parser([12]);
        return expect(value).to.be(12);
      });
      it('do multiply first', function() {
        var value;
        value = method.parser([2, '+', 3, '*', 5]);
        return expect(value).to.be(17);
      });
      it('do parens first', function() {
        var value;
        value = method.parser(['(', 2, '+', 3, ')', '*', 5]);
        return expect(value).to.be(25);
      });
      it('applied by CALC', function(done) {
        var state;
        state = {
          item: {
            text: "CALC 12+(345-678)*910"
          }
        };
        return method.dispatch(state, function(state) {
          expect(state.list[0]).to.be(-303018);
          return done();
        });
      });
      it('applied by CALC with local variables', function(done) {
        var state;
        state = {
          local: {
            "Hourly Rate": 16.45,
            "Regular Hours": 40,
            "Overtime Hours": 12
          },
          item: {
            text: "CALC Rate * ( Regular + 1.5 * Overtime )"
          }
        };
        return method.dispatch(state, function(state) {
          expect(Math.round(state.list[0])).to.eql(954);
          return done();
        });
      });
      it('applied by CALC with recalled input variables', function(done) {
        var state;
        state = {
          input: {
            "Hourly Rate": 16.45,
            "Regular Hours": 40,
            "Overtime Hours": 12
          },
          item: {
            text: "Hourly Rate\nRegular Hours\nOvertime Hours\nCALC Rate * ( Regular + 1.5 * Overtime )"
          }
        };
        return method.dispatch(state, function(state) {
          expect(Math.round(state.list[0])).to.eql(954);
          return done();
        });
      });
      it('applied by CALC with computed variables and units', function(done) {
        var state;
        state = {
          item: {
            text: "20.00 Rate (dollar / hour)\n40 Regular (hour)\n12 Overtime (hour)\nCALC Rate * ( Regular + 1.5 * Overtime )"
          }
        };
        return method.dispatch(state, function(state) {
          expect(state.list[0]).to.eql({
            value: 1160.00,
            units: ['dollar']
          });
          return done();
        });
      });
      return it('applied by CALC with all operators, variables and units', function(done) {
        var state;
        state = {
          item: {
            text: "10 w (in)\n30 h (in)\n15 t (s)\nCALC t*(h/t + w/t - (h+w)/t)"
          }
        };
        return method.dispatch(state, function(state) {
          expect(state.list[0]).to.eql({
            value: 0,
            units: ['in']
          });
          return done();
        });
      });
    });
  });

}).call(this);

/*
//@ sourceMappingURL=test.js.map
*/