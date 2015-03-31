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
            var i, k = data.timestamps.length;
            self.timestamps = data.timestamps;
            for (i = 0; i < k; i++) {
              // Convert ms to secs
              self.timestamps[i] /= 1000;
            }

            k = data.labels.length;
            for (i = 0; i < k; i++) {
              self.sources[data.labels[i]].values = data.columns[i].values;
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
      var queryRequest = {
        "start": start * 1000,
        "end": end * 1000,
        "step": Math.floor((end - start) / resolution),
        "source": [],
        "expression": []
      };

      var timeDeltaInSeconds = end - start;

      var qrSource;
      Backshift.keys(this.sources).forEach( function(key) {
          var source = this.sources[key];
          if (source.def.resourceId !== undefined) {
            qrSource = {
              aggregation: source.def.aggregation,
              attribute: source.def.attribute,
              label: source.def.name,
              resourceId: source.def.resourceId,
              transient: source.def.transient
            };
            queryRequest.source.push(qrSource);
          } else {
            qrSource = {
              value: source.def.expression,
              label: source.def.name,
              transient: source.def.transient
            };
            qrSource.value = qrSource.value.replace("{diffTime}", timeDeltaInSeconds);
            queryRequest.expression.push(qrSource);
          }
      }, this );

      if (queryRequest.source.length === 0) {
        delete queryRequest.source;
      }

      if (queryRequest.expression.length === 0) {
        delete queryRequest.expression;
      }

      return queryRequest;
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
            data: JSON.stringify(queryRequest),
            contentType: "application/json",
            dataType: "json",
            success: onSuccess,
            error:  onError
        });
    }
} );
