/**
 * Created by jwhite on 31/03/15.
 */

Backshift.namespace('Backshift.Graph.Flot');

/** A graph implementation that uses Flot */
Backshift.Graph.Flot  = Backshift.Class.create( Backshift.Graph, {

    onInit: function() {
      this.plot = null;

      // Set the containers width/height
      jQuery(this.element).width(this.width).height(this.height);

      // Create empty arrays for the series data
      this.flotSeries = [];
      var n = this.model.series.length;
      for (var i = 0; i < n; i++) {
        //var series = this.model.series[i];

        this.flotSeries.push([]);
      }
    },

    onRender: function() {
      this._updatePlot();
    },

    _shouldStack: function(series, k) {
      // If there's stack following the area, set the area to stack
      if (series[k].type === "area") {
        var n = series.length;
        for (var i = k; i < n; i++) {
          if (series[i].type === "stack") {
            return 1;
          }
        }
      }
      return series[k].type === "stack";
    },

    onFetchSuccess: function(dp) {
      var timestamps = dp.getTimestamps();

      var series, values, i, j, numSeries, numValues, xy;
      numSeries = this.model.series.length;
      numValues = timestamps.length;

      for (i = 0; i < numSeries; i++) {
        series = this.model.series[i];
        values = dp.getValues(series.source);

        xy = [];
        for (j = 0; j < numValues; j++) {
          xy.push([timestamps[j] * 1000, values[j]])
        }

        this.flotSeries[i] = {
          data: xy,
          label: series.name,
          color: series.color,
          stack: this._shouldStack(this.model.series, i),
          lines: {
            show: true,
            fill: series.type === "stack" || series.type === "area",
            fillColor: series.color
          }
        };
      }

      this._updatePlot();
    },

    _updatePlot: function() {
      this.plot = jQuery.plot(this.element, this.flotSeries, {
        series: {
          shadowSize: 0	// Drawing is faster without shadows
        },
        canvas: true,
        grid: {
          labelMargin: 10,
          hoverable: true,
          borderWidth: 0
        },
        legend: {
          //noColumns: 0,
          backgroundOpacity: 0.5
        },
        xaxis: {
          mode: "time",
          timezone: "browser"
        },
        yaxis: {
          tickFormatter: function suffixFormatter(val, axis) {
            if (val > 1000000000)
              return (val / 1000000000).toFixed(axis.tickDecimals) + " GB";
            else if (val > 1000000)
              return (val / 1000000).toFixed(axis.tickDecimals) + " MB";
            else if (val > 1000)
              return (val / 1000).toFixed(axis.tickDecimals) + " kB";
            else
              return val.toFixed(axis.tickDecimals) + " B";
          }
        }
      });
    }
});
