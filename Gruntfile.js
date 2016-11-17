module.exports = function (grunt) {

  var allSrcFiles = [
    'src/Compat.js',
    'src/Backshift.js',
    'src/Backshift.Class.js',
    'src/Backshift.Class.Configurable.js',
    'src/Backshift.Math.js',
    'src/Backshift.Stats.js',
    'src/Backshift.Utilities.Url.js',
    'src/Backshift.Utilities.RpnToJexlConverter.js',
    'src/Backshift.Utilities.RpnEvaluator.js',
    'src/Backshift.Utilities.Consolidator.js',
    'src/Backshift.Utilities.RrdGraphVisitor.js',
    'src/Backshift.Utilities.RrdGraphConverter.js',
    'src/Backshift.Graph.js',
    'src/Backshift.DataSource.js',
    'src/Backshift.DataSource.SineWave.js',
    'src/Backshift.DataSource.OpenNMS.js',
    'src/Backshift.DataSource.NRTG.js',
    'src/Backshift.Legend.js',
    'src/Backshift.Legend.Rickshaw.js',
    'src/Backshift.Graph.Matrix.js',
    'src/Backshift.Graph.Flot.js',
    'src/Backshift.Graph.Rickshaw.js',
    'src/Backshift.Graph.C3.js',
    'src/Backshift.Graph.DC.js'
  ];

  // Minimal set of files required for support in OpenNMS
  var onmsSrcFiles = [
    'src/Compat.js',
    'src/Backshift.js',
    'src/Backshift.Class.js',
    'src/Backshift.Class.Configurable.js',
    'src/Backshift.Utilities.RpnToJexlConverter.js',
    'src/Backshift.Utilities.RpnEvaluator.js',
    'src/Backshift.Utilities.Consolidator.js',
    'src/Backshift.Utilities.RrdGraphVisitor.js',
    'src/Backshift.Utilities.RrdGraphConverter.js',
    'src/Backshift.Graph.js',
    'src/Backshift.Graph.Flot.js',
    'src/Backshift.DataSource.js',
    'src/Backshift.DataSource.OpenNMS.js',
    'src/Backshift.DataSource.NRTG.js',
    'src/Loaded.js'
  ];

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        mangle: false,
        banner: '/*! <%= pkg.name %> <%= pkg.version %> - built on <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: allSrcFiles,
        dest: 'dist/<%= pkg.name %>.min.js'
      },
      onmsBuild: {
        src: onmsSrcFiles,
        dest: 'dist/<%= pkg.name %>.onms.min.js'
      }
    },
    concat: {
      build: {
        src: allSrcFiles,
        dest: 'dist/<%= pkg.name %>.js'
      },
      onmsBuild: {
        src: onmsSrcFiles,
        dest: 'dist/<%= pkg.name %>.onms.js'
      }
    },
    jsdoc: {
      build: {
        src: ['src/*.js'],
        options: {
          destination: 'dist/doc'
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
