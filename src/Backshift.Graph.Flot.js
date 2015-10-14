/**
 * Created by jwhite on 10/12/14.
 */

Backshift.namespace('Backshift.Graph.Flot');

/** Renders the graoh using Flot */
Backshift.Graph.Flot = Backshift.Class.create(Backshift.Graph, {

  defaults: function ($super) {
    return Backshift.extend($super(), {
      width: '100%',
      height: '100%',
      title: undefined,
      verticalLabel: undefined,
      zoom: true // whether to allow zooming
    });
  },

  onInit: function () {
    var container = $(this.element);
    // Set the container dimensions, Flot's canvas will use 100% of the container div
    container.width(this.width);
    container.height(this.height);
  },

  onQuerySuccess: function (results) {
    this.drawChart(results);
  },

  _shouldStack: function (k) {
    // If there's stack following the area, set the area to stack
    if (this.series[k].type === "area") {
      var n = this.series.length;
      for (var i = k; i < n; i++) {
        if (this.series[i].type === "stack") {
          return 1;
        }
      }
    }
    return this.series[k].type === "stack";
  },

  drawChart: function (results) {
    var self = this;
    var container = $(this.element);

    var timestamps = results.columns[0];
    var series, values, i, j, numSeries, numValues, X, Y, columnName, shouldStack, shouldFill, seriesValues, shouldShow;
    numSeries = this.series.length;
    numValues = timestamps.length;

    var from = timestamps[0];
    var to = timestamps[timestamps.length - 1];

    this.flotSeries = [];

    var lastSeriesToStackWith = null;

    // Build the columns for the series
    for (i = 0; i < numSeries; i++) {
      columnName = "data" + i;
      series = this.series[i];
      values = results.columns[results.columnNameToIndex[series.metric]];

      shouldStack = this._shouldStack(i);
      shouldFill = this.series[i].type === "stack" || this.series[i].type === "area";
      shouldShow = this.series[i].type !== "hidden";

      seriesValues = [];
      for (j = 0; j < numValues; j++) {
        var yOffset = 0;
        if (shouldStack && lastSeriesToStackWith != null) {
          yOffset = lastSeriesToStackWith.data[j][1];
        }
        var yVal = values[j] + yOffset;

        seriesValues.push([timestamps[j], yVal, yOffset]);
      }

      var flotSeries = {
        label: series.name,
        color: series.color,
        lines: {
          show: shouldShow,
          fill: shouldFill,
          fillColor: series.color
        },
        data: seriesValues,
        id: columnName,
        metric: series.metric
      };

      this.flotSeries.push(flotSeries);

      if (shouldStack) {
        lastSeriesToStackWith = flotSeries;
      }
    }

    var legendStatements = [];

    var options = {
      canvas: true,
      title: self.title,
      axisLabels: {
        show: true
      },
      hooks: {
        draw: [self.drawHook]
      },
      series: {
        lines:  {
          zero: false
        },
        bars:   {
          fill: 1,
          barWidth: 1,
          zero: false,
          lineWidth: 0
        },
        points: {
          fill: 1,
          fillColor: false
        },
        shadowSize: 1
      },
      yaxis: {
        tickFormatter: d3.format(".2s")
      },
      yaxes: [{
        position: 'left',
        axisLabel: self.verticalLabel,
        axisLabelUseHtml: false,
        axisLabelUseCanvas: true
      }],
      xaxis: { },
      grid: {
        minBorderMargin: 0,
        markings: [],
        backgroundColor: null,
        borderWidth: 0,
        hoverable: true,
        color: '#c8c8c8',
        margin: { left: 0, right: 0, top: 25, bottom: 0 }
      },
      selection: {
        mode: "x",
        color: '#666'
      },
      zoom: {
        interactive: true
      },
      pan: {
        interactive: true
      },
      legend: {
        show: false,
        statements: self.printStatements
      }
    };

    this.addTimeAxis(options, from, to);

    $.plot(container, this.flotSeries, options);
  },

  drawHook: function(plot, canvascontext) {
    var cx = canvascontext.canvas.clientWidth / 2;
    canvascontext.font="15px sans-serif";
    canvascontext.textAlign = 'center';
    canvascontext.fillText(plot.getOptions().title, cx, 15);
  },

  addTimeAxis: function(options, from, to) {
    var elem = $(this.element);
    var ticks = elem.width() / 100;

    options.xaxis = {
      mode: "time",
      min: from,
      max: to,
      label: "Datetime",
      ticks: ticks,
      timeformat: this.time_format(ticks, from, to)
    };
  },

  time_format: function(ticks, min, max) {
    if (min && max && ticks) {
      var secPerTick = ((max - min) / ticks) / 1000;

      if (secPerTick <= 45) {
        return "%H:%M:%S";
      }
      if (secPerTick <= 7200) {
        return "%H:%M";
      }
      if (secPerTick <= 80000) {
        return "%m/%d %H:%M";
      }
      if (secPerTick <= 2419200) {
        return "%m/%d";
      }
      return "%Y-%m";
    }

    return "%H:%M";
  }
});
