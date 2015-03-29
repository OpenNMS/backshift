/**
 * Created by jwhite on 5/23/14.
 */

Backshift.namespace('Backshift.Data.Newts');

/**
 * A data provider that interacts with Newts.
 *
 */
Backshift.Data.Newts = Backshift.Class.create( Backshift.Data, {

    onInit: function() {
        // Map the sources by resource name
        this.resources = {};
        Backshift.keys(this.sources).forEach( function(sourceName) {
            var source = this.sources[sourceName].def;
            var resource = source.resource;

            if (resource in this.resources) {
                this.resources[resource].push(source);
            } else {
                this.resources[resource] = [source];
            }
        }, this );

        // Determine the unique step sizes
        this.step_sizes = {};
        Backshift.keys(this.sources).forEach( function(sourceName) {
            var source = this.sources[sourceName].def;
            // Skip sources without a step, i.e. expressions
            if (source.step === undefined) {
                return;
            }

            if (source.step in this.step_sizes) {
                this.step_sizes[source.step] += 1;
            } else {
                this.step_sizes[source.step] = 1;
            }
        }, this);

        // and calculate their LCM
        this.step_sizes.lcm = Backshift.Math.lcm(Backshift.keys(this.step_sizes));
    },

    defaults: function($super) {
        return Backshift.extend( $super(), {
            url: "http://127.0.0.1:8000/",
            username: "newts",
            password: "newts"
        } );
    },

    onFetch: function(start, end, targetResolution, args) {
        // Determine the desired resolution
        var resolution = this.getResolutionInSeconds(start, end, targetResolution);

        // Fetch each resource individually
        Backshift.keys(this.resources).forEach( function(resource) {
            // Don't process anything if there aren't any sources
            var sources = this.resources[resource];
            if (sources.length < 1) {
                return;
            }

            // Build the report
            var report = JSON.stringify(this.getReport(sources));

            // Build the URL
            var url = new Backshift.Utilities.Url(this.url + 'measurements/' + resource)
                .andParam('start', start)
                .andParam('end', end)
                .andParam('resolution', resolution + "s")
                .toString();

            // Setup the callbacks
            var self = this;

            var onSuccess = function (measurements) {
                // (Re)build the store measurements
                var n = measurements.length;
                self.resizeTo(n);
                for (var i = 0; i < n; i++) {
                    var m = measurements[i].length;
                    self.timestamps[i] = Math.floor(measurements[i][0].timestamp / 1000);
                    for (var j = 0; j < m; j++) {
                        var measurement = measurements[i][j];
                        self.sources[measurement.name].values[i] = measurement.value;
                    }
                }
                self.onFetchSuccess(self, args);
                self.afterFetch(self, args);
            };

            var onFailure = function() {
                self.onFetchFail(self, args);
                self.afterFetch(self, args);
            };

            // Make the request
            this.getMeasurements(url, report, onSuccess, onFailure);
        }, this);
    },

    getReport: function(sources) {
        if (sources.length < 1) {
            throw "Cannot build a report with no sources.";
        }

        var report = {
            interval: NaN,
            datasources: [],
            expressions: [],
            exports: []
        };

        var i, n = sources.length;
        for (i = 0; i < n; i++) {
            var source = sources[i];

            if (source.step !== undefined) {
                if (isNaN(report.interval)) {
                    report.interval = source.step;
                } else if (report.interval !== source.step) {
                    throw "All of the steps must match for a given resource: " + report.interval + " vs " + source.step;
                }
            }

            if (source.expression === undefined) {
                // Assume its a data-source
                report.datasources.push(
                    {
                        label     : source.name,
                        source    : source.dsName,
                        function  : source.csFunc,
                        heartbeat : source.heartbeat
                    }
                );
            } else {
                // It's an expression
                report.expressions.push(
                    {
                        label     : source.name,
                        expression: source.expression
                    }
                );
            }

            report.exports.push(source.name);
        }

        return report;
    },

    /** Based on the time span (t0, t1) and requested resolution (R),
     *  determine the optimal resolution (r) that will be used to
     *  retrieve the measurements.
     *
     *  The optimal resolution should be a common multiple of all of the
     *  source's steps and be as close to (t1-t0) / R as possible.
     *
     */
    getResolutionInSeconds: function(start, end, targetResolution) {
        var targetResolutionInSeconds = (end - start) / targetResolution;

        var multiple = Math.ceil( targetResolutionInSeconds / this.step_sizes.lcm );
        if (multiple < 2) {
            multiple = 2; // The Newts API requires this to be at least 2.
        }

        return multiple * this.step_sizes.lcm;
    },

    getMeasurements: function(url, report, onSuccess, onError) {
        jQuery.ajax({
            url: url,
            username: this.username,
            password: this.password,
            xhrFields: {
                withCredentials: true
            },
            type: "POST",
            data: report,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: onSuccess,
            error:  onError
        });
    }
} );
