/**
 * Created by jwhite on 6/6/14.
 */

Backshift.namespace('Backshift.Data.OnmsRRD');

Backshift.Data.OnmsRRD = Backshift.Class.create( Backshift.Data, {
    defaults: function($super) {
        return Backshift.extend( $super(), {
            url: "http://127.0.0.1:8980/opennms/rest/rrd"
        } );
    },

    onFetch: function(start, end, resolution, args) {
        // Build the query request
        var queryRequest = this.getQueryRequest(start, end, resolution);

        // Setup the callbacks
        var self = this;

        var onSuccess = function (data) {
            // (Re)build the store measurements
            var metrics = data.metrics;
            var n = metrics.length;
            self.resizeTo(n);

            for (var i = 0; i < n; i++) {
                self.timestamps[i] = Number(metrics[i]["@timestamp"]);
                var m = metrics[i].values.entry.length;
                for (var j = 0; j < m; j++) {
                    var entry = metrics[i].values.entry[j];
                    self.sources[entry.key].values[i] = Number(entry.value);
                }
            }

            self.onFetchSuccess(self, args);
            self.afterFetch(self, args);
        };

        var onFailure = function() {
            self.onFetchFail(self, args);
            self.afterFetch(self, args);
        };

        // Make the call
        this.getResults(queryRequest, onSuccess, onFailure);
    },

    getQueryRequest: function(start, end, resolution) {
        var xmlTemplate = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
            "<query-request start=\"{{start}}\" end=\"{{end}}\" step=\"{{step}}\">" +
            "<series>" +
            "{{sources}}<entry><key>{{name}}</key><value attribute=\"{{dsName}}\" resource=\"{{resource}}\" aggregation=\"{{csFunc}}\"/></entry>{{/sources}}" +
            "</series>" +
            "</query-request>";

        var nonExpressionSources = [];
        Backshift.keys(this.sources).forEach( function(key) {
            var source = this.sources[key];
            if (source.def.dsName !== undefined) {
                nonExpressionSources.push(source.def);
            }
        }, this );

        var context = {
            "start": start,
            "end": end,
            "step": Math.floor((end - start) / resolution),
            "sources": nonExpressionSources
        };

        return Mark.up(xmlTemplate, context);
    },

    getResults: function(queryRequest, onSuccess, onError) {
        jQuery.ajax({
            url: this.url,
            username: 'admin',
            password: 'admin',
            xhrFields: {
                withCredentials: true
            },
            beforeSend: function(xhr) {
                xhr.setRequestHeader("Authentication", "Basic " + "YWRtaW46YWRtaW4="); //May need to use "Authorization" instead
            },
            type: "POST",
            data: queryRequest,
            contentType: "application/xml; charset=utf-8",
            dataType: "json",
            success: onSuccess,
            error:  onError
        });
    }
} );
