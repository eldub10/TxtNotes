// Generated on 2015-07-04 using generator-chromeapp 0.2.19
'use strict';

module.exports = function (grunt) {

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  // Get absolute path
  var path = require('path');

  // Configurable paths
  var config = {
    app: 'app',
    dist: 'www',
    tasks: grunt.cli.tasks
  };

  // Define the configuration for all the tasks
  grunt.initConfig({

    // Project settings
    config: config,

    // Watches files for changes and runs tasks based on the changed files
    watch: {
      js: {
        files: ['<%= config.app %>/scripts/{,*/}*.js'],
        options: {
          livereload: true
        }
      },
      gruntfile: {
        files: ['Gruntfile.js']
      },
      styles: {
        files: ['<%= config.app %>/styles/{,*/}*.css'],
        tasks: [],
        options: {
          livereload: true
        }
      },
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          '.tmp/styles/{,*/}*.css',
          '<%= config.app %>/*.html',
          '<%= config.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
          '<%= config.app %>/manifest.json',
          '<%= config.app %>/_locales/{,*/}*.json'
        ]
      }
    },

    // Grunt server and debug server settings
    connect: {
      options: {
        port: 9000,
        livereload: 35729,
        // change this to '0.0.0.0' to access the server from outside
        hostname: 'localhost',
        open: true,
      },
      server: {
        options: {
          middleware: function(connect) {
            return [
              connect.static('.tmp'),
              connect().use('/bower_components', connect.static('./bower_components')),
              connect.static(config.app)
            ];
          }
        }
      },
      chrome: {
        options: {
          open:
            {
              target: '--load-and-launch-app=' + path.resolve(config.app),
              appName: 'chrome',
            },
          base: [
            '<%= config.app %>'
          ]
        }
      }
    },

    // Empties folders to start fresh
    clean: {
      server: '.tmp',
      chrome: '.tmp',
      dist: {
        files: [{
          dot: true,
          src: [
            '.tmp',
            '<%= config.dist %>/*',
            '!<%= config.dist %>/.git*'
          ]
        }]
      }
    },

    // Reads HTML for usemin blocks to enable smart builds that automatically
    // concat, minify and revision files. Creates configurations in memory so
    // additional tasks can operate on them
    useminPrepare: {
      options: {
        dest: '<%= config.dist %>'
      },
      html: [
        '<%= config.app %>/main.html'
      ]
    },

    // Performs rewrites based on rev and the useminPrepare configuration
    usemin: {
      options: {
        assetsDirs: ['<%= config.dist %>', '<%= config.dist %>/images']
      },
      html: ['<%= config.dist %>/{,*/}*.html'],
      css: ['<%= config.dist %>/styles/{,*/}*.css']
    },

    // Copies remaining files to places other tasks can use
    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= config.app %>',
          dest: '<%= config.dist %>',
          src: [
            'images/{,*/}*.{jpg,png,gif}',
            '{,*/}*.html',
            '{,*/}manifest.json',
            'scripts/{,*/}background.js'
          ]
        }]
      },
      styles: {
        expand: true,
        dot: true,
        cwd: '<%= config.app %>/styles',
        dest: '.tmp/styles/',
        src: '{,*/}*.css'
      },
      apk: {
        expand: true,
        cwd: 'platforms/android/build/outputs/apk/',
        src: 'android-armv7-debug.apk',
        dest: 'package/',
        rename: function() {
          var manifest = grunt.file.readJSON('app/manifest.json');
          return 'package/txtnotes-' + manifest.version + '.apk';
        }
      }
    },

    // Run some tasks in parallel to speed up build process
    concurrent: {
      server: [
        'copy:styles'
      ],
      chrome: [
        'copy:styles'
      ],
      dist: [
        'copy:styles'
      ]
    },

    // Create Chrome crx package
    crx: {
      dist: {
        src: '<%= config.dist %>/**/*',
        dest: 'package/',
      },
    },

    // Cordova (cca)
    cordovacli: {
      options: {
        path: '/',
        cli: 'cca'  // cca or cordova
      },
      build_android: {
        options: {
          command: 'build',
          platforms: ['android']
        }
      }
    }

  }); //end grunt.initConfig

  grunt.registerTask('debug', function (platform) {
    var watch = grunt.config('watch');
    platform = platform || 'chrome';

    // Configure style task for debug:server task
    if (platform === 'server') {
      watch.styles.tasks = ['newer:copy:styles'];
      watch.styles.options.livereload = false;

    }

    // Configure updated watch task
    grunt.config('watch', watch);

    grunt.task.run([
      'clean:' + platform,
      'concurrent:' + platform,
      'connect:' + platform,
      'watch'
    ]);
  });

  grunt.registerTask('update_manifest', function (key, value) {
    var srcFile = "private.json";
    var destFile = "www/manifest.json";

    if (!grunt.file.exists(srcFile)) {
      grunt.warn("private.json needed for Google oauth2 client_id.");
    }
    var srcJson = grunt.file.readJSON(srcFile);
    var destJson = grunt.file.readJSON(destFile);

    // update client_id
    destJson.oauth2.client_id = srcJson.oauth2.client_id;
    destJson.android.oauth2.client_id = srcJson.android.oauth2.client_id;

    grunt.file.write(destFile, JSON.stringify(destJson, null, 2));
  });

  grunt.registerTask('build_crx', [
    'clean:dist',
    'useminPrepare',
    'concurrent:dist',
    'concat',
    'cssmin',
    'uglify',
    'copy:dist',
    'usemin',
    'update_manifest',
    'crx',
  ]);

  grunt.registerTask('build_apk', [
    'build_crx',
    'cordovacli',
    'copy:apk'
  ]);

  grunt.registerTask('build', [
    'build_apk'
  ]);

  grunt.registerTask('default', [
    'build'
  ]);

};
