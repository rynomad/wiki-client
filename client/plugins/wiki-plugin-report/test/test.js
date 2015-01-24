(function() {
  var report;

  report = require('./report');

  describe('report plugin', function() {
    describe('parsing', function() {
      it('returns an array', function() {
        var schedule;
        schedule = report.parse("");
        return expect(schedule).to.eql([]);
      });
      it('parses intervals', function() {
        var issue;
        issue = report.parse("DAILY ward@example.com")[0];
        return expect(issue.interval).to.be('DAILY');
      });
      it('parses offsets', function() {
        var issue;
        issue = report.parse("WEEKLY TUESDAY NOON")[0];
        return expect(issue.offsets).to.eql(['TUESDAY', 'NOON']);
      });
      it('parses recipients', function() {
        var issue;
        issue = report.parse("DAILY ward@c2.com root@c2.com")[0];
        return expect(issue.recipients).to.eql(['ward@c2.com', 'root@c2.com']);
      });
      return it('parses multiple issues', function() {
        var schedule;
        schedule = report.parse("WEEKLY MONTHLY YEARLY");
        return expect(schedule).to.have.length(3);
      });
    });
    return describe('advancing', function() {
      it('handles weeks', function() {
        var count, date, issue;
        issue = report.parse("WEEKLY")[0];
        date = new Date(2012, 12 - 1, 25, 3, 4, 5);
        count = function(i) {
          return report.advance(date, issue, i);
        };
        expect(count(-1)).to.eql(new Date(2012, 12 - 1, 16));
        expect(count(0)).to.eql(new Date(2012, 12 - 1, 23));
        expect(count(1)).to.eql(new Date(2012, 12 - 1, 30));
        return expect(count(2)).to.eql(new Date(2013, 1 - 1, 6));
      });
      it('handles weeks with offsets (noon > now)', function() {
        var count, date, issue;
        issue = report.parse("WEEKLY TUESDAY NOON")[0];
        date = new Date(2012, 12 - 1, 25, 3, 4, 5);
        count = function(i) {
          return report.advance(date, issue, i);
        };
        expect(count(-1)).to.eql(new Date(2012, 12 - 1, 11, 12));
        expect(count(0)).to.eql(new Date(2012, 12 - 1, 18, 12));
        expect(count(1)).to.eql(new Date(2012, 12 - 1, 25, 12));
        return expect(count(2)).to.eql(new Date(2013, 1 - 1, 1, 12));
      });
      it('handles years with offsets (march < now)', function() {
        var count, date, issue;
        issue = report.parse("YEARLY MARCH FRIDAY EVENING")[0];
        date = new Date(2012, 12 - 1, 25, 3, 4, 5);
        count = function(i) {
          return report.advance(date, issue, i);
        };
        expect(count(-1)).to.eql(new Date(2011, 3 - 1, 4, 18));
        expect(count(0)).to.eql(new Date(2012, 3 - 1, 2, 18));
        expect(count(1)).to.eql(new Date(2013, 3 - 1, 1, 18));
        return expect(count(2)).to.eql(new Date(2014, 3 - 1, 7, 18));
      });
      return it('handles election day (election > now)', function() {
        var count, date, issue;
        issue = report.parse("YEARLY NOVEMBER MONDAY TUESDAY MORNING")[0];
        date = new Date(2016, 1, 2, 3, 4, 5);
        count = function(i) {
          return report.advance(date, issue, i);
        };
        expect(count(-1)).to.eql(new Date(2014, 11 - 1, 4, 6));
        expect(count(0)).to.eql(new Date(2015, 11 - 1, 3, 6));
        expect(count(1)).to.eql(new Date(2016, 11 - 1, 8, 6));
        return expect(count(2)).to.eql(new Date(2017, 11 - 1, 7, 6));
      });
    });
  });

}).call(this);

/*
//@ sourceMappingURL=test.js.map
*/