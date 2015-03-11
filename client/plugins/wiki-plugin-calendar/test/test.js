(function() {
  var report;

  report = require('./calendar');

  describe('calendar plugin', function() {
    describe('parsing', function() {
      it('recognizes decades', function() {
        expect(report.parse("1960 DECADE")).to.eql([
          {
            year: 1960,
            span: 'DECADE'
          }
        ]);
        expect(report.parse("DECADE 1960")).to.eql([
          {
            year: 1960,
            span: 'DECADE'
          }
        ]);
        return expect(report.parse("60S")).to.eql([
          {
            year: 1960,
            span: 'DECADE'
          }
        ]);
      });
      it('recognizes half decades', function() {
        expect(report.parse("60S EARLY")).to.eql([
          {
            year: 1960,
            span: 'EARLY'
          }
        ]);
        expect(report.parse("EARLY 60S")).to.eql([
          {
            year: 1960,
            span: 'EARLY'
          }
        ]);
        return expect(report.parse("LATE 60S")).to.eql([
          {
            year: 1960,
            span: 'LATE'
          }
        ]);
      });
      it('recognizes years', function() {
        return expect(report.parse("1960")).to.eql([
          {
            year: 1960,
            span: 'YEAR'
          }
        ]);
      });
      it('recognizes months', function() {
        expect(report.parse("1960 MAR")).to.eql([
          {
            year: 1960,
            month: 3,
            span: 'MONTH'
          }
        ]);
        expect(report.parse("MAR 1960")).to.eql([
          {
            year: 1960,
            month: 3,
            span: 'MONTH'
          }
        ]);
        return expect(report.parse("MARCH 1960")).to.eql([
          {
            year: 1960,
            month: 3,
            span: 'MONTH'
          }
        ]);
      });
      it('recognizes days', function() {
        expect(report.parse("MAR 5 1960")).to.eql([
          {
            year: 1960,
            month: 3,
            day: 5,
            span: 'DAY'
          }
        ]);
        expect(report.parse("1960 MAR 5")).to.eql([
          {
            year: 1960,
            month: 3,
            day: 5,
            span: 'DAY'
          }
        ]);
        return expect(report.parse("5 MAR 1960")).to.eql([
          {
            year: 1960,
            month: 3,
            day: 5,
            span: 'DAY'
          }
        ]);
      });
      return it('recognizes labels', function() {
        expect(report.parse("Ward's CHM Interview")).to.eql([
          {
            label: "Ward's CHM Interview"
          }
        ]);
        expect(report.parse("APRIL 24 2006 Ward's CHM Interview")).to.eql([
          {
            year: 2006,
            month: 4,
            day: 24,
            span: 'DAY',
            label: "Ward's CHM Interview"
          }
        ]);
        return expect(report.parse(" APRIL  24  2006\tWard's  CHM  Interview  ")).to.eql([
          {
            year: 2006,
            month: 4,
            day: 24,
            span: 'DAY',
            label: "Ward's CHM Interview"
          }
        ]);
      });
    });
    return describe('applying', function() {
      var interview, today;
      today = new Date(2013, 2 - 1, 3);
      interview = new Date(2006, 4 - 1, 24);
      it('recalls input', function() {
        var input, output, rows;
        input = {
          interview: {
            date: interview
          }
        };
        output = {};
        rows = report.parse("interview");
        return expect(report.apply(input, output, today, rows)).to.eql([
          {
            date: interview,
            label: 'interview'
          }
        ]);
      });
      return it('extends today', function() {
        var input, output, results, rows;
        input = {};
        output = {};
        rows = report.parse("APRIL 1 April Fools Day");
        results = report.apply(input, output, today, rows);
        expect(results).to.eql([
          {
            date: new Date(2013, 4 - 1),
            month: 4,
            day: 1,
            span: 'DAY',
            label: 'April Fools Day'
          }
        ]);
        return expect(output).to.eql({
          'April Fools Day': {
            date: new Date(2013, 4 - 1),
            span: 'DAY'
          }
        });
      });
    });
  });

}).call(this);
