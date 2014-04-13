module.exports = function ( grunt ){

  grunt.initConfig({
    watch: {
      options: {
        spawn: false,
        interrupt: true
      },
      js: {
        files: [
          "js/**/*.js"
        ],
        tasks: ["concat"]
      }
    }
  })

//  grunt.config("copy", {
//    copy: {
//      expand: true,
//      cwd: "js/",
//      src: "*.js",
//      dest: "extension/js/"
//    }
//  })

  grunt.config("concat", {
    options: {separator: ";\n"},
    concat: {
      files: {
        // options page script
        "extension/js/options.js": [
          "js/hud/src/hud.js",
          "js/hud/src/plugin/dom.js",
          "js/template/dust-core.min.js",
          "js/template/embraces.js",
          "templates/*.js",
          "js/options.js"
        ],
        // background script
        "extension/js/humm.js": [
          "js/api/util.js",
          "js/api/Hummingbird.js",
          "js/api/*.js"
        ]
      }
    }
  })

  grunt.loadNpmTasks("grunt-embrace")
  grunt.config("watch.embrace", {
    files: [
      "templates/*.dust"
    ],
    tasks: ["embrace", "concat"]
  })
  grunt.config("embrace", {
    compile: {
      options: {
        client: "js/template/",
        compile: true,
        concat: true,
        dust: {
          client: "js/template/"
        }
      },
      expand: true,
      cwd: "templates/",
      src: "*.dust",
      dest: "templates/",
      ext: ".js"
    }
  })

  grunt.loadNpmTasks("grunt-contrib-less")
  grunt.config("watch.less", {
    files: [
      "less/*.less"
    ],
    tasks: ["less"]
  })
  grunt.config("less", {
    options: {
      cleancss: true,
      strictMath: true
    },
    preprocess: {
      expand: true,
      flatten: true,
      cwd: "less/",
      src: ["*.less"],
      dest: "extension/css/",
      ext: ".css"
    }
  })

  grunt.loadNpmTasks("grunt-contrib-watch")
  grunt.loadNpmTasks("grunt-contrib-concat")
  grunt.loadNpmTasks("grunt-contrib-copy")

  grunt.registerTask("default", ["watch"])
}