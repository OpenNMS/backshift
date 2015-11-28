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
      zoom: true, // whether to allow zooming
      xaxisFont: undefined, // flot "font" spec, see http://flot.googlecode.com/svn/trunk/API.txt for details
      yaxisFont: undefined, // flot "font" spec
      legendFontSize: undefined, // font size (integer)
      ticks: undefined, // number of x-axis ticks, defaults to a value based on the width
    });
  },

  onInit: function () {
    var container = jQuery(this.element);
    // Set the container dimensions, Flot's canvas will use 100% of the container div
    container.width(this.width);
    container.height(this.height);
  },


  onBeforeQuery: function () {
    this.showStatus('Loading...');
  },

  onQueryFailed: function () {
    this.showStatus('Query failed.');
  },

  onQuerySuccess: function (results) {
    this.hideStatus();
    this.drawChart(results);
  },

  _shouldStack: function (k) {
    // If there's stack following the area, set the area to stack
    if (this.model.series[k].type === "area") {
      var n = this.model.series.length;
      for (var i = k; i < n; i++) {
        if (this.model.series[i].type === "stack") {
          return 1;
        }
      }
    }
    return this.model.series[k].type === "stack";
  },

  drawChart: function (results) {
    var self = this;
    var container = jQuery(this.element);

    var timestamps = results.columns[0];
    var series, values, i, j, numSeries, numValues, X, Y, columnName, shouldStack, shouldFill, seriesValues, shouldShow;
    numSeries = this.model.series.length;
    numValues = timestamps.length;

    var from = timestamps[0];
    var to = timestamps[timestamps.length - 1];

    this.flotSeries = [];
    this.hiddenFlotSeries = [];

    var lastSeriesToStackWith = null;

    // Build the columns for the series
    for (i = 0; i < numSeries; i++) {
      columnName = "data" + i;
      series = this.model.series[i];
      values = results.columns[results.columnNameToIndex[series.metric]];

      shouldStack = this._shouldStack(i);
      shouldFill = this.model.series[i].type === "stack" || this.model.series[i].type === "area";
      shouldShow = this.model.series[i].type !== "hidden";

      seriesValues = [];
      for (j = 0; j < numValues; j++) {
        var yOffset = 0;
        if (shouldStack && lastSeriesToStackWith != null) {
          yOffset = lastSeriesToStackWith.data[j][1];
        }
        var yVal = isNaN(values[j]) ? values[j] : values[j] + yOffset;

        seriesValues.push([timestamps[j], yVal, yOffset]);
      }

      var flotSeries = {
        label: series.name,
        color: series.color,
        lines: {
          show: true,
          fill: shouldFill,
          fillColor: series.color
        },
        data: seriesValues,
        id: columnName,
        metric: series.metric,
        nodatatable: (series.name === undefined || series.name === null || series.name === '')
      };

      if (shouldShow) {
        this.flotSeries.push(flotSeries);

        if (shouldStack) {
          lastSeriesToStackWith = flotSeries;
        }
      } else {
        this.hiddenFlotSeries.push(flotSeries);
      }
    }

    var yaxisTickFormat = d3.format(".3s");

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
        tickFormatter: yaxisTickFormat
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
      legend: {
        show: false,
        statements: self.model.printStatements
      },
      hiddenSeries: this.hiddenFlotSeries,
      tooltip: {
        show: true
      },
      datatable: {
        xaxis: {
          label: 'Date/Time',
          format: function(x) {
            var format = d3.time.format("%c");
            return format(new Date(x));
          }
        },
        yaxis: {
          ignoreColumnsWithNoLabel: true,
          format: function(y) {
            try {
              return yaxisTickFormat(y);
            } catch (err) {
              return NaN;
            }
          }
        }
      },
      zoom: {
        interactive: true
      },
      pan: {
        interactive: true
      }
    };

    this.addTimeAxis(options, from, to);

    if (self.xaxisFont) {
      options.xaxis.font = self.getFontSpec(self.xaxisFont);
    }
    if (self.yaxisFont) {
      options.yaxis.font = self.getFontSpec(self.yaxisFont);
    }
    if (self.legendFontSize) {
      if (!options.legend.style) {
        options.legend.style = {};
      }
      options.legend.style.fontSize = this.legendFontSize;
    }

    var chart = jQuery.plot(container, this.flotSeries, options);

    // Limit the zooming and panning so that at least one point is always visible
    var yaxis = chart.getAxes().yaxis;
    chart.ranges = {
      yaxis: { panRange: [yaxis.min, yaxis.max], zoomRange: false}, xaxis: { panRange: [from,to], zoomRange: null }
    };
  },

  getFontSpec: function(fontSpec) {
    var ret = {
      size: 'inherit',
      family: 'inherit',
      style: 'inherit',
      weight: 'inherit',
      variant: 'inherit',
      color: 'inherit',
    };
    if (fontSpec) {
      if (fontSpec.size) {
        ret.size = fontSpec.size;
      }
      if (fontSpec.family) {
        ret.family = fontSpec.family;
      }
      if (fontSpec.style) {
        ret.style = fontSpec.style;
      }
      if (fontSpec.weight) {
        ret.weight = fontSpec.weight;
      }
      if (fontSpec.variant) {
        ret.variant = fontSpec.variant;
      }
      if (fontSpec.color) {
        ret.color = fontSpec.color;
      }
    }
    return ret;
  },

  drawHook: function(plot, canvascontext) {
    var cx = canvascontext.canvas.clientWidth / 2;
    canvascontext.font="15px sans-serif";
    canvascontext.textAlign = 'center';
    canvascontext.fillText(plot.getOptions().title, cx, 15);
  },

  addTimeAxis: function(options, from, to) {
    var elem = jQuery(this.element);
    var ticks = this.ticks || (elem.width() / 100);

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
