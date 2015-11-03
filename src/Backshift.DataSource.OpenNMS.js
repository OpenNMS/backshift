/**
 * Created by jwhite on 6/6/14.
 */

Backshift.namespace('Backshift.DataSource.OpenNMS');

Backshift.DataSource.OpenNMS = Backshift.Class.create(Backshift.DataSource, {
  defaults: function ($super) {
    return Backshift.extend($super(), {
      url: "http://127.0.0.1:8980/opennms/rest/measurements",
      username: null,
      password: null,
      fetchFunction: null,
    });
  },

  onInit: function(args) {
    if (!this.fetchFunction) {
      this.fetchFunction = this.post;
    }
  },

  /* An overridable post method.
   *
   * @param {object} data A JSON object with data to POST.
   * @param {function} onSuccess A function to call on success.
   * @param {function} onFailure A function to call on failure.
   */
  post: function(url, data, onSuccess, onFailure) {
    var self = this,
      withCredentials = self.username !== null && self.password !== null,
      headers = {};

    if (withCredentials) {
      headers['Authorization'] = "Basic " + window.btoa(self.username + ":" + self.password);
    }

    jQuery.ajax({
      url: url,
      xhrFields: {
        withCredentials: withCredentials
      },
      headers: headers,
      type: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json',
      dataType: 'json',
      success: onSuccess,
      error: onFailure
    });

  },

  query: function (start, end, resolution, args) {
    var self = this;
    var dfd = jQuery.Deferred();

    var data = self._getQueryRequest(start, end, resolution),
      success = function QuerySuccess(response) {
        dfd.resolve(self._parseResponse(response));
      },
      failure = function QueryFailure(jqXmr, textStatus) {
        dfd.reject(textStatus);
      };

    self.fetchFunction(self.url, data, success, failure);

    return dfd.promise();
  },

  _getQueryRequest: function (start, end, resolution) {
    var queryRequest = {
      "start": start,
      "end": end,
      "step": resolution > 0 ? Math.floor((end - start) / resolution) : 1,
      "source": [],
      "expression": []
    };

    var timeDeltaInSeconds = end - start;

    var qrSource;
    Backshift.keys(this.metrics).forEach(function (key) {
      var metric = this.metrics[key];
      if (metric.resourceId !== undefined) {
        qrSource = {
          aggregation: metric.aggregation,
          attribute: metric.attribute,
          label: metric.name,
          resourceId: metric.resourceId,
          transient: metric.transient
        };
        // Only set the datasource when it differs from the attribute name in order
        // to preserve backwards compatibility with 16.x (which does not recognize the datasource field)
        if (metric.datasource !== undefined && metric.attribute !== metric.datasource) {
          qrSource.datasource = metric.datasource;
        }
        queryRequest.source.push(qrSource);
      } else {
        qrSource = {
          value: metric.expression,
          label: metric.name,
          transient: metric.transient
        };
        qrSource.value = qrSource.value.replace("{diffTime}", timeDeltaInSeconds);
        queryRequest.expression.push(qrSource);
      }
    }, this);

    if (queryRequest.source.length === 0) {
      delete queryRequest.source;
    }

    if (queryRequest.expression.length === 0) {
      delete queryRequest.expression;
    }

    return queryRequest;
  },

  _parseResponse: function (json) {
    var k, columns, columnNames, columnNameToIndex, constants, numMetrics = json.labels.length;

    columns = new Array(1 + numMetrics);
    columnNames = new Array(1 + numMetrics);
    columnNameToIndex = {};

    columns[0] = json.timestamps;
    columnNames[0] = 'timestamp';
    columnNameToIndex['timestamp'] = 0;

    for (k = 0; k < numMetrics; k++) {
      columns[1 + k] = json.columns[k].values;
      columnNames[1 + k] = json.labels[k];
      columnNameToIndex[columnNames[1 + k]] = 1 + k;
    }

    if (json.constants) {
      constants = {};
      for (var c=0, len=json.constants.length, key, value, label; c < len; c++) {
        key = json.constants[c].key;
        value = json.constants[c].value;
        for (var l=0; l < numMetrics; l++) {
          label = json.labels[l];
          if (key.indexOf(label+'.') === 0) {
            // constant matches the label, extract the constant name
            key = key.substring((label+'.').length);
            constants[key] = (value === undefined? null: value);
          }
        }
      }
    }

    return {
      columns: columns,
      columnNames: columnNames,
      columnNameToIndex: columnNameToIndex,
      constants: constants,
    };
  }
});
