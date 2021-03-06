// Karma configuration

module.exports = function(config) {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',


        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],


        // list of files / patterns to load in the browser - order matters
        files: [
            'node_modules/d3/d3.min.js',
            'node_modules/jquery/dist/jquery.min.js',
            'node_modules/c3/c3.min.js',
            'node_modules/crossfilter/crossfilter.min.js',
            'node_modules/dcjs/dc.min.js',
            'node_modules/flot/jquery.flot.js',
            'node_modules/flot/jquery.flot.time.js',
            'node_modules/flot/jquery.flot.stack.js',
            'node_modules/flot/jquery.flot.navigate.js',
            'node_modules/flot/jquery.flot.resize.js',
            'node_modules/flot-axislabels/jquery.flot.axislabels.js',
            'node_modules/flot-legend/jquery.flot.legend.min.js',
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
            'src/Backshift.DataSource.NRTG.js',
            'src/Backshift.DataSource.OpenNMS.js',
            'src/Backshift.DataSource.SineWave.js',
            'src/Backshift.Graph.js',
            'src/Backshift.Graph.Matrix.js',
            'src/Backshift.Graph.C3.js',
            'src/Backshift.Graph.DC.js',
            'src/Backshift.Graph.Flot.js',
            'test/*.Test.js'
        ],

        // list of files to exclude
        exclude: [

        ],


        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {

        },


        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress'],


        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['PhantomJS'],

        customLaunchers: {
          Chrome_Without_Security: {
            base: 'Chrome',
            flags: ['--disable-web-security'],
          },
        },



        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false
    });
};
