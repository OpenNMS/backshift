/**
 * Datasource for OpenNMS' Near Real-Time Graphing (NRTG) feature.
 *
 * Requires Horizon 17.1.0 or greater.
 *
 * Created by jwhite on 11/29/2015.
 */
Backshift.namespace('Backshift.DataSource.NRTG');

Backshift.DataSource.NRTG = Backshift.Class.create(Backshift.DataSource, {
  defaults: function ($super) {
    return Backshift.extend($super(), {
      url: "http://127.0.0.1:8980/opennms/nrt/starter",
      callback: function(){},
      username: null,
      password: null,
      getFunction: null,
      slidingWindow: 30,
      pollingInterval: 1000
    });
  },

  onInit: function(args) {
    if (!this.getFunction) {
      this.getFunction = this.get;
    }

    if (this.metrics.length !== 1) {
      Backshift.fail('NRTG only supports streaming a single metric.');
    }

    // The last measurement set
    this.lastMeasurementSet = {};
    // Calculated rows
    this.rows = [];
    // Instance of the interval
    this.pollingIntervalId = null;
  },

  supportsQueries: function() {
    return false;
  },

  supportsStreaming: function() {
    return true;
  },

  startStreaming: function() {
    var self = this;
    var dfd = jQuery.Deferred();

    self.getFunction(this.url, {
      resourceId: self.metrics[0].resourceId,
      report: self.metrics[0].report
    }, function(nrtgCollectionDetails) {
      self.handleCollectionDetails(nrtgCollectionDetails);
      dfd.resolve();
    }, function(jqXmr, textStatus) {
      dfd.reject(textStatus);
    });

    return dfd.promise();
  },

  stopStreaming: function () {
    var self = this;
    if (self.pollingIntervalId !== null) {
      clearInterval(self.pollingIntervalId);
      self.pollingIntervalId = null;
    }
  },

  updatePollingInterval: function(pollingInterval) {
    var self = this;
    self.pollingInterval = pollingInterval;
    if (self.pollingIntervalId !== null) {
      clearInterval(self.pollingIntervalId);
      var poll = function() {self.poll();}.bind(self);
      self.pollingIntervalId = setInterval(poll, self.pollingInterval);
    }
  },

  updateSlidingWindow: function(slidingWindow) {
    var self = this;
    self.slidingWindow = slidingWindow;
    self._processRowsAndNotify();
  },

  handleCollectionDetails: function(nrtgCollectionDetails) {
    var self = this;

    // Build a graph definition using the data from the collection details
    var graph = {
      "command": nrtgCollectionDetails.rrdGraphString,
      "externalValues": [],
      "propertiesValues": [],
      "columns": self._metricMappingsToColumns(nrtgCollectionDetails.metricsMapping)
    };

    // Generate the model from the graph definition
    var rrdGraphConverter = new Backshift.Utilities.RrdGraphConverter({
      graphDef: graph,
      resourceId: self.metrics[0].resourceId,
      convertRpnToJexl: false
    });
    self.model = rrdGraphConverter.model;

    // Start polling
    self.collectionTaskId = nrtgCollectionDetails.collectionTaskId;
    var poll = function() {self.poll();}.bind(self);
    poll();
    self.pollingIntervalId = setInterval(poll, self.pollingInterval);
  },

  poll: function() {
    var self = this;
    if (self.pollInProgress === true) {
      // If another poll is already in progress, then skip this one
      return;
    }

    self.pollInProgress = true;
    self.getFunction(self.url, {
      poll: true,
      nrtCollectionTaskId: self.collectionTaskId
    }, function(data) {
      self.pollInProgress = false;

      // Compute the measurements
      self._calculateMeasurements(data.measurement_sets);

      // Issue the callback
      self._processRowsAndNotify();
    }, function(jqXmr, textStatus) {
      // If a poll fails, log it, but don't take any actions, we'll just try again next time
      self.pollInProgress = false;
      console.log("NRTG: Poll failed with '" + textStatus + "'.");
    });
  },

  _metricMappingsToColumns: function(metricsMapping) {
    var columns = [];
    for (var i = 1, nmetrics = Object.keys(metricsMapping).length; i <= nmetrics; i++) {
      var found = false;
      for (var key in metricsMapping) {
        if (metricsMapping.hasOwnProperty(key)) {
          if (metricsMapping[key].indexOf("{rrd" + i + "}") > -1) {
            columns.push(key);
            found = true;
            break;
          }
        }
      }

      if (!found) {
        Backshift.fail("Missing {rrd" + i + "}");
      }
    }
    return columns;
  },

  _calculateRate: function(lastMetric, newMetric) {
    if (lastMetric === null || newMetric === null) {
      return NaN;
    } else if (isNaN(lastMetric.value) || isNaN(newMetric.value)) {
      return NaN;
    }
    var valueDelta = newMetric.value - lastMetric.value;
    var timestampDeltaInMs = newMetric.timeStamp - lastMetric.timeStamp;
    return (valueDelta / timestampDeltaInMs) * 1000;
  },

  _calculateMeasurements: function(measurementSets) {
    var self = this;
    for (var i = 0, nsets = measurementSets.length; i < nsets; i++) {

      // Index the metrics by metricId
      var metricsById = {};
      var timestamp = 0;
      for (var j = 0, nmetrics = measurementSets[i].length; j < nmetrics; j++) {
        var metric = measurementSets[i][j];
        metricsById[metric.metricId] = metric;
        timestamp = metric.timeStamp;
      }

      // Calculate the measurements
      var rpnEvaluator = new Backshift.Utilities.RpnEvaluator();
      var row = {
        timestamp: timestamp
      };
      for (j = 0, nmetrics = self.model.metrics.length; j < nmetrics; j++) {
        var modelMetric = self.model.metrics[j];
        var isExpression = "expression" in modelMetric;

        var value = NaN;
        if (!isExpression) {
          if (modelMetric.attribute in metricsById) {
            var metric = metricsById[modelMetric.attribute];
            value = metric.value;

            // Convert counters to rates
            var isCounter = metric.metricType.indexOf("counter") > -1;
            if (isCounter) {
              var lastMetric = null;
              if (modelMetric.attribute in self.lastMeasurementSet) {
                  lastMetric = self.lastMeasurementSet[modelMetric.attribute];
              }
              value = self._calculateRate(lastMetric, metric);
            }
          }
        } else {
          value = rpnEvaluator.evaluate(modelMetric.expression, row);
        }

        row[modelMetric.name] = value;
      }

      // Save the results
      self.rows.push(row);
      self.lastMeasurementSet = metricsById;
    }
  },

  _processRowsAndNotify: function() {
    var self = this;

    // Limit the amount of rows processed if we're using a sliding window
    var indexOfFirstRow = 0;
    if (self.slidingWindow > 0) {
      // Only use a subset of the rows
      indexOfFirstRow = self.rows.length - self.slidingWindow;
      if (indexOfFirstRow < 0) {
        indexOfFirstRow = 0;
      }
    }

    // Convert the rows to columns
    var columns = {};
    for (var i = indexOfFirstRow, nrows = self.rows.length; i < nrows; i++) {
      var row = self.rows[i];
      for (var key in row) {
        if (!row.hasOwnProperty(key)) {
          continue;
        }

        if (key in columns) {
          columns[key].push(row[key]);
        } else {
          columns[key] = [row[key]];
        }
      }
    }

    // Drop any transient columns
    for (j = 0, nmetrics = self.model.metrics.length; j < nmetrics; j++) {
      var modelMetric = self.model.metrics[j];
      if (modelMetric.transient) {
        delete columns[modelMetric.name];
      }
    }

    // Index the columns
    var results = {
      columns: [],
      columnNames: [],
      columnNameToIndex: {}
    };

    $.each(columns, function (columnName, columnValues) {
      results.columns.push(columnValues);
      results.columnNames.push(columnName);
      results.columnNameToIndex[columnName] = results.columns.length - 1;
    });

    // Issue the callback
    self.callback(results);
  },

  /* An overridable GET method.
   *
   * @param {function} onSuccess A function to call on success.
   * @param {function} onFailure A function to call on failure.
   */
  get: function(url,  data, onSuccess, onFailure) {
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
      type: 'GET',
      cache: false,
      data: data,
      dataType: 'json',
      success: onSuccess,
      error: onFailure
    });
  }
});