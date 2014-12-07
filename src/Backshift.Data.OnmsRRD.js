/**
 * Created by jwhite on 6/6/14.
 */

Backshift.namespace('Backshift.Data.OnmsRRD');

Backshift.Data.OnmsRRD = Backshift.Class.create( Backshift.Data, {
    defaults: function($super) {
        return Backshift.extend( $super(), {
            url: "http://127.0.0.1:8980/opennms/rest/rrd",
            username: "admin",
            password: "admin"
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
                self.timestamps[i] = Number(metrics[i]["timestamp"]);
                for (var key in metrics[i].values) {
                    self.sources[key].values[i] = Number(metrics[i].values[key]);
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
                "{{sources}}<source aggregation=\"{{csFunc}}\" attribute=\"{{dsName}}\" label=\"{{name}}\" resource=\"{{resource}}\" />{{/sources}}" +
                "{{expressions}}<expression label=\"{{name}}\">{{expression}}</expression>{{/expressions}}" +
            "</query-request>";

        var nonExpressionSources = [];
        var expressionSources = [];
        Backshift.keys(this.sources).forEach( function(key) {
            var source = this.sources[key];
            if (source.def.dsName !== undefined) {
                nonExpressionSources.push(source.def);
            } else {
                expressionSources.push(source.def);
            }
        }, this );

        var context = {
            "start": start,
            "end": end,
            "step": Math.floor((end - start) / resolution),
            "sources": nonExpressionSources,
            "expressions": expressionSources
        };

        return Mark.up(xmlTemplate, context);
    },

    getResults: function(queryRequest, onSuccess, onError) {
        jQuery.ajax({
            url: this.url,
            username: this.username,
            password: this.password,
            xhrFields: {
                withCredentials: true
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
