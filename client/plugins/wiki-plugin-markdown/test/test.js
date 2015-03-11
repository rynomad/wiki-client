(function() {
  var expect, markdown;

  markdown = require('../client/markdown');

  expect = require('expect.js');

  describe('markdown plugin', function() {
    describe('headers', function() {
      it('can turn ### into h3', function() {
        var result;
        result = markdown.expand('###heading');
        return expect(result).to.be('<h3>heading</h3>');
      });
      it('will ignore ### most places', function() {
        var result;
        result = markdown.expand('  ###heading');
        return expect(result).to.be('  ###heading');
      });
      it('will turn # into h3 too', function() {
        var result;
        result = markdown.expand('#heading');
        return expect(result).to.be('<h3>heading</h3>');
      });
      return it('can do ### on many lines', function() {
        var result;
        result = markdown.expand('###one\n###two');
        return expect(result).to.be('<h3>one</h3>\n<h3>two</h3>');
      });
    });
    describe('emphasis', function() {
      it('can turn * ... * into italic', function() {
        var result;
        result = markdown.expand('hello *world*');
        return expect(result).to.be('hello <i>world</i>');
      });
      it('can turn _ ... _ into italic', function() {
        var result;
        result = markdown.expand('hello _world_');
        return expect(result).to.be('hello <i>world</i>');
      });
      it('can convert multipe italic per line', function() {
        var result;
        result = markdown.expand('_hello_ _world_');
        return expect(result).to.be('<i>hello</i> <i>world</i>');
      });
      it('can convert multiple words per italic', function() {
        var result;
        result = markdown.expand('_hello world_');
        return expect(result).to.be('<i>hello world</i>');
      });
      it('must start with non-blank', function() {
        var result;
        result = markdown.expand('hello_ world_');
        return expect(result).to.be('hello_ world_');
      });
      it('must end with non-blank', function() {
        var result;
        result = markdown.expand('_hello _world');
        return expect(result).to.be('_hello _world');
      });
      it('can convert a single non-blank', function() {
        var result;
        result = markdown.expand('_x_');
        return expect(result).to.be('<i>x</i>');
      });
      it('can turn ** ... ** into bold', function() {
        var result;
        result = markdown.expand('hello **world**');
        return expect(result).to.be('hello <b>world</b>');
      });
      it('can turn __ ... __ into bold', function() {
        var result;
        result = markdown.expand('hello __world__');
        return expect(result).to.be('hello <b>world</b>');
      });
      it('can convert multipe bold per line', function() {
        var result;
        result = markdown.expand('__hello__ __world__');
        return expect(result).to.be('<b>hello</b> <b>world</b>');
      });
      return it('can convert multiple words per bold', function() {
        var result;
        result = markdown.expand('__hello world__');
        return expect(result).to.be('<b>hello world</b>');
      });
    });
    return describe('unordered lists', function() {
      it('can turn * lines into lists', function() {
        var result;
        result = markdown.expand('*hello world');
        return expect(result).to.be('<li>hello world</li>');
      });
      it('can tell * lines from italic', function() {
        var result;
        result = markdown.expand('*hello *world*');
        return expect(result).to.be('<li>hello <i>world</i></li>');
      });
      it('can skip space before * lines', function() {
        var result;
        result = markdown.expand('  *hello world');
        return expect(result).to.be('<li>hello world</li>');
      });
      it('can turn - lines into lists', function() {
        var result;
        result = markdown.expand('-hello world');
        return expect(result).to.be('<li>hello world</li>');
      });
      it('can turn lines into incomplete tasks', function() {
        var result;
        result = markdown.expand('-[ ] hello world');
        return expect(result).to.be('<li><span class=task line=0>[ ]</span> hello world</li>');
      });
      return it('can turn lines into complete tasks', function() {
        var result;
        result = markdown.expand('-[x] hello world');
        return expect(result).to.be('<li><span class=task line=0>[x]</span> hello world</li>');
      });
    });
  });

}).call(this);

//# sourceMappingURL=test.js.map
