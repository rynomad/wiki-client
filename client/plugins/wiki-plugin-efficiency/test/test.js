(function() {
  var expectArraysEqual;

  require('./efficiency');

  expectArraysEqual = function(a1, a2, accuracy) {
    var diff, i, isItGood, length, _i, _ref, _results;
    if (accuracy == null) {
      accuracy = 0.1;
    }
    expect(a1.length).to.equal(a2.length);
    length = a1.length;
    _results = [];
    for (i = _i = 0, _ref = length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
      diff = Math.abs(a1[i] - a2[i]);
      isItGood = diff <= accuracy;
      _results.push(expect(isItGood).to.be.ok());
    }
    return _results;
  };

  describe('efficiency plugin', function() {
    var actual, actualArray, expected, expectedLuma, rgbt;
    it("max & min of array", function() {
      expect(6).to.equal(Math.max.apply(Math, [1, 2, 3, 4, 5, 6]));
      return expect(1).to.equal(Math.min.apply(Math, [1, 2, 3, 4, 5, 6]));
    });
    it("Get gray luma from 4-byte RGBT data. Two values", function() {});
    rgbt = [1, 1, 1, 1, 2, 2, 2, 2];
    expectedLuma = [1.0, 2.0];
    actualArray = window.plugins.efficiency.getGrayLumaFromRGBT(rgbt);
    expected = JSON.stringify(expectedLuma);
    actual = JSON.stringify(actualArray);
    expectArraysEqual(expectedLuma, actualArray);
    it("Get gray luma from 4-byte RGBT data. Three values", function() {});
    rgbt = [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3];
    expectedLuma = [1.0, 2.0, 3.0];
    actualArray = window.plugins.efficiency.getGrayLumaFromRGBT(rgbt);
    expected = JSON.stringify(expectedLuma);
    actual = JSON.stringify(actualArray);
    expectArraysEqual(expectedLuma, actualArray);
    it("calculateStrategy_GrayBinary 50% binary data", function() {
      var lumas, output;
      lumas = [0, 0, 255, 255];
      output = window.plugins.efficiency.calculateStrategy_GrayBinary(lumas);
      return expect('50.0').to.equal(output.toFixed(1));
    });
    it("calculateStrategy_GrayBinary 50% linear data", function() {
      var lumas, output;
      lumas = [1, 2, 3, 4];
      output = window.plugins.efficiency.calculateStrategy_GrayBinary(lumas);
      return expect('50.0').to.equal(output.toFixed(1));
    });
    it("calculateStrategy_GrayBinary 75% binary data", function() {
      var lumas, output;
      lumas = [0, 255, 255, 255];
      output = window.plugins.efficiency.calculateStrategy_GrayBinary(lumas);
      return expect('75.0').to.equal(output.toFixed(1));
    });
    it("calculateStrategy_GrayIterativeClustering 50% binary data", function() {
      var lumas, output;
      lumas = [0, 0, 255, 255];
      output = window.plugins.efficiency.calculateStrategy_GrayIterativeClustering(lumas);
      return expect('50.0').to.equal(output.toFixed(1));
    });
    it("calculateStrategy_GrayIterativeClustering 50% linear data", function() {
      var lumas, output;
      lumas = [1, 2, 3, 4];
      output = window.plugins.efficiency.calculateStrategy_GrayIterativeClustering(lumas);
      return expect('50.0').to.equal(output.toFixed(1));
    });
    return it("calculateStrategy_GrayIterativeClustering 75% binary data", function() {
      var lumas, output;
      lumas = [0, 255, 255, 255];
      output = window.plugins.efficiency.calculateStrategy_GrayIterativeClustering(lumas);
      return expect('75.0').to.equal(output.toFixed(1));
    });
  });

}).call(this);

/*
//@ sourceMappingURL=test.js.map
*/