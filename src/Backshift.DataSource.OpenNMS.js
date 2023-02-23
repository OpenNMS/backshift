import 'jquery';

import Backshift from './Backshift';
import DataSource from './Backshift.DataSource';

/**
 * Created by jwhite on 6/6/14.
 */

class OpenNMS extends DataSource {
  constructor(args) {
    super(args);
    this._fetchFunction = this.post;
  }

  defaults() {
    return Object.assign({}, super.defaults(), {
      url: "http://127.0.0.1:8980/opennms/rest/measurements",
      username: null,
      password: null,
      fetchFunction: null,
    });
  }

  get fetchFunction() {
    return this._fetchFunction || this.post;
  }

  set fetchFunction(func) {
    this._fetchFunction = func; 
  }

  /* An overridable post method.
   *
   * @param {object} data A JSON object with data to POST.
   * @param {function} onSuccess A function to call on success.
   * @param {function} onFailure A function to call on failure.
   */
  post(url, data, onSuccess, onFailure) {
    const self = this;
    let withCredentials = self.username !== null && self.password !== null,
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

  }

  query(start, end, resolution, args) {
    const self = this;

    const dfd = jQuery.Deferred();
    const data = self._getQueryRequest(start, end, resolution);
    let success = function QuerySuccess(response) {
      if (response === undefined) {
        // This can happen if/when the server returns a 204
        response = {
          labels: [],
          timestamps: [],
          columns: []
        }
      }
      dfd.resolve(self._parseResponse(response));
    },
    failure = function QueryFailure(jqXmr, textStatus) {
      dfd.reject(textStatus);
    };

    this.fetchFunction(self.url, data, success, failure);

    return dfd.promise();
  }

  _getQueryRequest(start, end, resolution) {
    var queryRequest = {
      "start": start,
      "end": end,
      "step": resolution > 0 ? Math.floor((end - start) / resolution) : 1,
      "source": [],
      "expression": [],
      "filter": []
    };

    var timeDeltaInSeconds = end - start;

    var qrSource;
    Object.keys(this.metrics).forEach(function (key) {
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
      } else if (metric.type === 'filter') {
        queryRequest.filter.push({
          name: metric.name,
          parameter: metric.parameter
        });
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

    if (queryRequest.filter.length === 0) {
      delete queryRequest.filter;
    }

    return queryRequest;
  }

  _parseResponse(json) {
    var k, columns, columnNames, columnNameToIndex, constants, parts,
        numMetrics = json.labels.length;

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

        // All of the constants are prefixed with the label of the associated source, but
        // the graph definitions don't support this prefix, so we just cut the prefix
        // off the constant name
        parts = key.split('.');
        if (parts.length > 1) {
          key = parts[1];
          constants[key] = (value === undefined? null: value);
        }
      }
    }

    return {
      columns: columns,
      columnNames: columnNames,
      columnNameToIndex: columnNameToIndex,
      constants: constants
    };
  }
}

Backshift.DataSource.OpenNMS = OpenNMS;
export default OpenNMS;