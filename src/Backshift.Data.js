/**
 * Created by jwhite on 5/22/14.
 */

Backshift.namespace('Backshift.Data');

/**
 * A data provider.
 *
 * @constructor
 * @param {object} args Dictionary of arguments.
 * @param {number} [args.start] Seconds since the Unix epoch.
 * @param {number} [args.end] Seconds since the Unix epoch.
 * @param {number} [args.last] Length of sliding window. start = now - last, end = now.
 * @param {number} [args.resolution] Desired number of points. Infinity for finest.
 * @param          [args.sources] Source definitions. See @.
 */
Backshift.Data = Backshift.Class.create( Backshift.Class.Configurable, {

    initialize: function(args) {
        if (args.sources === undefined || args.sources.length === 0) {
            Backshift.fail('Data provider needs one or more sources.');
        }

        this.sources = {};
        for (var i = 0; i < args.sources.length; i++) {
            this.sources[args.sources[i].name] = {
                "def": args.sources[i],
                "values": []
            };
        }

        this.timestamps = [];

        this.configure(args);

        this.onInit(args);
    },

    defaults: function() {
        return {
            beforeFetch: function() {},
            onFetchSuccess: function() {},
            onFetchFail: function() {},
            afterFetch: function() {},
            onNewData: function() {}
        };
    },

    /**
     * @param {number} [start] Seconds since the Unix epoch.
     * @param {number} [end] Seconds since the Unix epoch.
     * @param {number} [resolution] Desired number of points.
     * @param {object} [args] Additional parameter that is passed to the callbacks.
     */
    fetch: function(start, end, resolution, args) {
        this.beforeFetch(this, args);
        this.onFetch(start, end, resolution, args);
    },

    getTimestamps: function() {
        return this.timestamps;
    },

    getValues: function(sourceName) {
        if (!(sourceName in this.sources)) {
            throw sourceName + " was not added to the data processor.";
        }

        return this.sources[sourceName].values;
    },

    getMatrix: function() {
        // Use the timestamps as the first column
        var labels = ['timestamp'];
        var mat = [this.getTimestamps()];

        Backshift.keys(this.sources).forEach( function(key) {
            var source = this.sources[key];
            labels.push(key);
            mat.push(source.values);
        }, this);

        mat.labels = labels;
        return mat;
    },

    onInit: function(args) {
        // Defined by subclasses
    },

    onFetch: function(start, end, resolution, args) {
        // Defined by subclasses
    },

    resizeTo: function(n) {
        // Create a new array iff the size has changed
        if (this.timestamps === undefined || this.timestamps.length != n) {
            this.timestamps = new Array(n);
        }

        Backshift.keys(this.sources).forEach( function(key) {
            if (this.sources[key].values === undefined || this.sources[key].values.length != n) {
                this.sources[key].values = new Array(n);
            }
        }, this);
    }
} );
