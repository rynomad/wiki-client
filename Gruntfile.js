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
      packageChrome: {
        src: ['./client.coffee'],
        dest: 'client/client.chromeExtension.max.js',
        options: {

          alias:["./lib/chrome/state.coffee:./state"
            , "./lib/chrome/steward.coffee:./steward"
            , "./lib/chrome/resolve.coffee:./lib/resolve.coffee"
            , "./lib/chrome/dropkick.coffee:./dropkick"
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
      },
      // build for local development version of the client will go here (once mapfile issues are resolved)

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
      }
    },

    uglify: {
      packageClient: {
        // uglify the client version for including in the NPM package,
        //   create a map so at least if needed we can get back to the generated javascript
        //   uglified version is 'client.js', so we don't need changes elsewhere.
        options: {
          sourceMap: true,
          sourceMapName: 'client/client.map',
          banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                  '<%= grunt.template.today("yyyy-mm-dd") %> */'
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

  // build without sourcemaps
  grunt.registerTask('build', ['clean',  'browserify:packageClient', 'browserify:packageChrome', 'browserify:testClient', 'uglify:packageClient', 'uglify:packageChrome']);

  // the default is to do the production build.
  grunt.registerTask('default', ['build']);

};
