module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // N.B. The development build includes paths in the mapfile, at the browserify step, that are not accessable
  //      from the browser.



  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    authors: {
      prior: [
        "Ward Cunningham <ward@c2.com>",
        "Stephen Judkins <stephen.judkins@gmail.com>",
        "Sam Goldstein <sam@aboutus.org>",
        "Steven Black <steveb@stevenblack.com>",
        "Don Park <don@donpark.org>",
        "Sven Dowideit <SvenDowideit@fosiki.com>",
        "Adam Solove <asolove@gmail.com>",
        "Nick Niemeir <nick.niemeir@gmail.com>",
        "Erkan Yilmaz <erkan77@gmail.com>",
        "Matt Niemeir <matt.niemeir@gmail.com>",
        "Daan van Berkel <daan.v.berkel.1980@gmail.com>",
        "Nicholas Hallahan <nick@theoutpost.io>",
        "Ola Bini <ola.bini@gmail.com>",
        "Danilo Sato <dtsato@gmail.com>",
        "Henning Schumann <henning.schumann@gmail.com>",
        "Michael Deardeuff <michael.deardeuff@gmail.com>",
        "Pete Hodgson <git@thepete.net>",
        "Marcin Cieslak <saper@saper.info>",
        "M. Kelley Harris (http://www.kelleyharris.com)",
        "Ryan Bennett <nomad.ry@gmail.com>",
        "Paul Rodwell <paul.rodwell@btinternet.com>",
        "David Turnbull <dturnbull@gmail.com>",
        "Austin King <shout@ozten.com>"
      ]
    },

    // tidy-up before we start the build
    clean: ['build/*', 'client/client.js', 'client/client.map', 'client/client.*.js', 'client/client.*.map', 'client/test/testclient.js'],

    browserify: {
      // build the client that we will include in the package
      packageClient: {
        src: ['./client.coffee'],
        dest: 'client/client.max.js',
        options: {
          transform: ['coffeeify'],
          browserifyOptions: {
            extensions: ".coffee"
          }
        }
      },

	  // build the browser testclient
      testClient: {
        src: ['./testclient.coffee'],
        dest: 'client/test/testclient.js',
        options: {
          transform: ['coffeeify'],
          browserifyOptions: {
            extensions: ".coffee"
          }
        }
      },
      packageChrome: {
        src: ['./client.coffee'],
        dest: 'client/client.chromeExtension.max.js',
        options: {

          alias:["./lib/chrome/state.coffee:./state"
            , "./lib/chrome/resolve.coffee:./lib/resolve.coffee"
          ],
          transform: ['coffeeify'],
          browserifyOptions: {
            extensions: ".coffee"
          }
        }
      },
      packageInjected: {
        src: ['./client/chrome/dropkick.coffee'],
        dest: "client/chrome/dropkick.js",
        options:{
          transform:['coffeeify'],
          browserifyOptions:{
            extensions: ".coffee"
          }
        }
      }
      // build for local development version of the client will go here (once mapfile issues are resolved)

      
    },

    uglify: {
      packageClient: {
        // uglify the client version for including in the NPM package,
        //   create a map so at least if needed we can get back to the generated javascript
        //   uglified version is 'client.js', so we don't need changes elsewhere.
        options: {
          sourceMap: true,
          sourceMapRoot: "/",
          sourceMapName: 'client/client.map',
          banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
                  '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
                  ' * Copyright <%= grunt.template.today("yyyy") %> <%= pkg.author.name %> and other contributors;' +
                  ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
        },
        files: {
          'client/client.js': ['client/client.max.js']
        }
      },
      packageChrome: {
        options:{
          sourceMap:true,
          sourceMapName: "client/client.chromeExtension.map",
          banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                  '<%= grunt.template.today("yyyy-mm-dd") %> */'
        },
        files: {
          'client/client.chromeExtension.js': ['client/client.chromeExtension.max.js']
        }
      }
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          require: 'coffee-script/register'
        },
        src: [
          'test/util.coffee',
          'test/random.coffee',
          'test/page.coffee',
          'test/lineup.coffee',
          'test/drop.coffee',
          'test/revision.coffee',
          'test/resolve.coffee',
          'test/wiki.coffee'
        ]
      }
    },

    watch: {
      all: {
        files: ['test/*.coffee', 'lib/*.coffee', '*.coffee'],
        tasks: ['build']
      }
    }
  });

  grunt.registerTask( "update-authors", function () {
    var getAuthors = require("grunt-git-authors"),
    done = this.async();

    getAuthors({
      priorAuthors: grunt.config( "authors.prior")
    }, function(error, authors) {
      if (error) {
        grunt.log.error(error);
        return done(false);
      }

      grunt.file.write("AUTHORS.txt",
      "Authors ordered by first contribution\n\n" +
      authors.join("\n") + "\n");
    });
  });

  // build without sourcemaps
  grunt.registerTask('build', ['clean', 'mochaTest', 'browserify', 'uglify']);

  // the default is to do the production build.
  grunt.registerTask('default', ['build']);

};
