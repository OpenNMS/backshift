/**
 * Created by jwhite on 5/21/14.
 */

Backshift.namespace('Backshift.Data.Mock');

/**
 * A data provider that allows the series values to be generated as a function of time.
 *
 * The timestamps are fitted evenly across the given range with the given resolution.
 *
 */
Backshift.Data.Mock = Backshift.Class.create( Backshift.Data, {
    defaults: function($super) {
        return Backshift.extend( $super(), {
            generator: function() { return 0; }
        } );
    },

    onFetch: function(start, end, resolution, args) {
        // Create/resize the arrays used to store the timestamps and values
        this.resizeTo(resolution);

        // Split the interval evenly into n points and use these as the timestamps
        for (var i = 0; i < resolution; i++) {
            this.timestamps[i] = start + (i / (resolution-1) ) * (end - start);
        }

        // Generate the values for every source at every timestamp using
        // the given generator function
        Backshift.keys(this.sources).forEach(function(key) {
            var source = this.sources[key];
            for (i = 0; i < resolution; i++) {
                source.values[i] = this.generator(this.timestamps[i], source.def);
            }
        }, this);

        this.onFetchSuccess(this, args);
        this.afterFetch(this, args);
    }
} );
