(function() {
  var createFakeLocalStorage, pluginCtor;

  pluginCtor = require('./changes');

  createFakeLocalStorage = function(initialContents) {
    var fake, getStoreSize, keys, store;
    if (initialContents == null) {
      initialContents = {};
    }
    store = initialContents;
    keys = function() {
      var k, _, _results;
      _results = [];
      for (k in store) {
        _ = store[k];
        _results.push(k);
      }
      return _results;
    };
    getStoreSize = function() {
      return keys().length;
    };
    fake = {
      setItem: function(k, v) {
        return store[k] = v;
      },
      getItem: function(k) {
        return store[k];
      },
      key: function(i) {
        return keys()[i];
      },
      removeItem: function(k) {
        return delete store[k];
      }
    };
    Object.defineProperty(fake, 'length', {
      get: getStoreSize
    });
    return fake;
  };

  describe('changes plugin', function() {
    var $div, clickDeleteForPageWithSlug, expectNumberOfPagesToBe, fakeLocalStore, installPlugin, makePlugin;
    fakeLocalStore = void 0;
    $div = void 0;
    beforeEach(function() {
      $div = $('<div/>');
      return fakeLocalStore = createFakeLocalStorage();
    });
    makePlugin = function() {
      return pluginCtor($, {
        localStorage: fakeLocalStore
      });
    };
    installPlugin = function() {
      var plugin;
      plugin = makePlugin();
      plugin.emit($div, {});
      return plugin.bind($div, {});
    };
    expectNumberOfPagesToBe = function(expectedLength) {
      return expect($div.find('li a').length).to.be(expectedLength);
    };
    clickDeleteForPageWithSlug = function(slug) {
      return $div.find("li a[data-page-name='" + slug + "']").siblings('button').trigger('click');
    };
    it("renders 'empty' when there are no local changes", function() {
      installPlugin();
      expect($div.html()).to.contain('empty');
      return expectNumberOfPagesToBe(0);
    });
    return describe('some pages in local store', function() {
      beforeEach(function() {
        return fakeLocalStore = createFakeLocalStorage({
          page1: JSON.stringify({
            title: "A Page"
          }),
          page2: JSON.stringify({
            title: "Another Page"
          }),
          page3: JSON.stringify({
            title: "Page the Third"
          })
        });
      });
      it("doesn't render 'empty'", function() {
        installPlugin();
        return expect($div.html()).not.to.contain('empty');
      });
      it("lists each page found in the local store", function() {
        var allTitles;
        installPlugin();
        expectNumberOfPagesToBe(3);
        allTitles = $div.find('li a').map(function(_, a) {
          return $(a).html();
        }).toArray().join('');
        expect(allTitles).to.contain('A Page');
        expect(allTitles).to.contain('Another Page');
        return expect(allTitles).to.contain('Page the Third');
      });
      it("removes a page from local store", function() {
        installPlugin();
        expect(fakeLocalStore.getItem('page2')).to.be.ok();
        clickDeleteForPageWithSlug('page2');
        return expect(fakeLocalStore.getItem('page2')).not.to.be.ok();
      });
      return it("updates the plugin div when a page is removed", function() {
        installPlugin();
        expectNumberOfPagesToBe(3);
        clickDeleteForPageWithSlug('page2');
        return expectNumberOfPagesToBe(2);
      });
    });
  });

}).call(this);

/*
//@ sourceMappingURL=test.js.map
*/