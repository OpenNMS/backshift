module.exports = function(grunt) {

  var srcFiles = [
      'src/Compat.js',
      'src/Backshift.js',
      'src/Backshift.Class.js',
      'src/Backshift.Class.Configurable.js',
      'src/Backshift.Math.js',
      'src/Backshift.Utilities.Url.js',
      'src/Backshift.Graph.js',
      'src/Backshift.Data.js',
      'src/Backshift.Data.Mock.js',
      'src/Backshift.Data.Mock.TrigFnFactory.js',
      'src/Backshift.Data.Mock.Trig.js',
      'src/Backshift.Data.Newts.js',
      'src/Backshift.Data.Factory.js',
      'src/Backshift.Graph.js',
      'src/Backshift.Graph.Matrix.js',
      'src/Backshift.Graph.Rickshaw.js'
  ];

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: srcFiles,
        dest: 'build/<%= pkg.name %>.min.js'
      }
    },
    concat: {
        dist: {
          src: srcFiles,
          dest: 'build/<%= pkg.name %>.js'
        }
    },
    jsdoc : {
        dist : {
            src: ['src/*.js'],
            options: {
                destination: 'build/doc'
            }
        }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.loadNpmTasks('grunt-jsdoc');

  // Default task(s).
  grunt.registerTask('default', ['uglify', 'concat', 'jsdoc']);

};
