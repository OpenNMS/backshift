/**
 * Created by jwhite on 5/22/14.
 */

Backshift.namespace('Backshift.DataSource.SineWave');

Backshift.DataSource.SineWave = Backshift.Class.create(Backshift.DataSource, {
  defaults: function ($super) {
    return Backshift.extend($super(), {});
  },

  query: function (start, end, resolution, args) {
    if (resolution <= 0) {
      // Use millisecond resolution if none is specified
      resolution = end - end;
    }

    var self = this;
    var dfd = jQuery.Deferred();
    var k, t, column, columns, columnNames, columnNameToIndex, numMetrics = self.metrics.length;

    columns = new Array(1 + numMetrics);
    columnNames = new Array(1 + numMetrics);
    columnNameToIndex = {};

    for (k = 0; k <= numMetrics; k++) {
      column = new Array(resolution);
      columns[k] = column;

      if (k === 0) {
        columnNames[k] = 'timestamp';

        for (t = 0; t < resolution; t++) {
          column[t] = start + t / (resolution - 1) * (end - start);
        }
      } else {
        columnNames[k] = self.metrics[k - 1].name;

        for (t = 0; t < resolution; t++) {
          column[t] = self._sin(columns[0][t], self.metrics[k - 1]);
        }
      }

      columnNameToIndex[columnNames[k]] = k;
    }

    dfd.resolve({
      columns: columns,
      columnNames: columnNames,
      columnNameToIndex: columnNameToIndex
    });
    return dfd.promise();
  },

  _sin: function (t, metric) {
    var amplitude = 1, hshift = 0, vshift = 0, period = 2 * Math.PI;

    if (metric.amplitude !== undefined) {
      amplitude = metric.amplitude;
    }

    if (metric.hshift !== undefined) {
      hshift = metric.hshift;
    }

    if (metric.vshift !== undefined) {
      vshift = metric.vshift;
    }

    if (period !== undefined) {
      period = metric.period;
    }

    var B = (2 * Math.PI) / period;
    return amplitude * Math.sin(B * (t - hshift)) + vshift;
  }
});
