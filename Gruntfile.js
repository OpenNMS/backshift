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
    'src/Backshift.Utilities.RrdGraphVisitor.js',
    'src/Backshift.Utilities.RrdGraphConverter.js',
    'src/Backshift.Graph.js',
    'src/Backshift.Data.js',
    'src/Backshift.Data.Mock.js',
    'src/Backshift.Data.Mock.TrigFnFactory.js',
    'src/Backshift.Data.Mock.Trig.js',
    'src/Backshift.Data.Newts.js',
    'src/Backshift.Data.OnmsRRD.js',
    'src/Backshift.Data.Factory.js',
    'src/Backshift.Legend.js',
    'src/Backshift.Legend.Rickshaw.js',
    'src/Backshift.Graph.js',
    'src/Backshift.Graph.Matrix.js',
    'src/Backshift.Graph.Flot.js',
    'src/Backshift.Graph.Rickshaw.js',
    'src/Backshift.Graph.C3.js'
  ];

  // Minimal set of files required for support in OpenNMS
  var onmsSrcFiles = [
    'src/Compat.js',
    'src/Backshift.js',
    'src/Backshift.Class.js',
    'src/Backshift.Class.Configurable.js',
    'src/Backshift.Utilities.RpnToJexlConverter.js',
    'src/Backshift.Utilities.RrdGraphVisitor.js',
    'src/Backshift.Utilities.RrdGraphConverter.js',
    'src/Backshift.Graph.js',
    'src/Backshift.Graph.C3.js',
    'src/Backshift.DataSource.js',
    'src/Backshift.DataSource.OpenNMS.js',
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
        dest: 'build/<%= pkg.name %>.min.js'
      },
      onmsBuild: {
        src: onmsSrcFiles,
        dest: 'build/<%= pkg.name %>.onms.min.js'
      }
    },
    concat: {
      build: {
        src: allSrcFiles,
        dest: 'build/<%= pkg.name %>.js'
      },
      onmsBuild: {
        src: onmsSrcFiles,
        dest: 'build/<%= pkg.name %>.onms.js'
      }
    },
    jsdoc: {
      build: {
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
