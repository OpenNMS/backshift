/**
 * Created by jwhite on 31/03/15.
 */

Backshift.namespace('Backshift.Graph.C3');

/**
 * Current issues:
 *   - Can't tell the difference between 0 and NaN without mouseover - use regions to identify these?
 *
 * Features to add:
 *   - Improved X-axis legend - the format should depend on the time-span
 *   - Add support for retrieving min/max and average values
 *   - Identify outages with regions: http://c3js.org/samples/region_timeseries.html
 *   - Identify events with grid lines: http://c3js.org/samples/grid_x_lines.html
 *
 * Notes:
 *   - Opacity for the area can be set with:
 *     .c3-area {
 *          stroke-width: 0;
 *          opacity: 1.0;
 *      }
 *
 */

/** A graph implementation that uses C3 */
Backshift.Graph.C3 = Backshift.Class.create(Backshift.Graph, {

  defaults: function ($super) {
    return Backshift.extend($super(), {
      width: undefined,
      height: undefined,
      title: undefined,
      verticalLabel: undefined,
      clipboardData: undefined,
      exportIconSizeRatio: 0.05, // relative size in pixels of "Export to CSV" icon - set to 0 to disable
      interactive: true, // whether to do fancier chart navigation with mouse input events
      step: false, // treats points a segments (similar to rrdgraph)
      zoom: true, // whether to allow zooming
    });
  },

  onInit: function () {
    this.columns = [];
    this.groups = [];
    this.colorMap = {};
    this.typeMap = {};
    this.nameMap = {};

    this.clipboardPrimed = false;
    // Only add the event listener if the export icon is enabled
    if (this.exportIconSizeRatio > 0) {
      document.addEventListener('copy', this._onClipboardCopy);
    }

    this.chart = null;
  },

  resize: function(size) {
    // Store the width/height for any subsequent renders
    this.width = size.width;
    this.height = size.height;
    // If we have a chart, resize it
    if (this.chart !== null) {
      this.chart.resize(size);
    }
  },

  destroy: function($super) {
    $super();
    // If we have a chart, destroy it
    if (this.chart !== null) {
      this.chart = this.chart.destroy();
    }
  },

  onRender: function () {
    this._updatePlot();
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

  _getDisplayName: function (name) {
    if (name === undefined || name === null) {
      return null;
    } else {
      return name;
    }
  },

  _getType: function (type, shouldStack) {
    var derivedType;
    if (shouldStack === true) {
      derivedType = "area";
    } else {
      derivedType = type;
    }

    if (this.step) {
      if (derivedType === "line") {
        derivedType = "step";
      }
      else if (derivedType === "area") {
        derivedType = "area-step";
      }
    }
    return derivedType;
  },

  onBeforeQuery: function() {
    this.showStatus('Loading...');
  },

  onQuerySuccess: function (results) {
    if (!results || !results.columns) {
      return;
    }
    var timestamps = results.columns[0];
    var series, values, i, j, numSeries, numValues, X, Y, columnName, shouldStack;
    numSeries = this.model.series.length;
    numValues = timestamps.length;

    // Reset the array of columns
    this.columns = [];

    // Build the timestamp column
    X = ['timestamp'];
    for (i = 0; i < numValues; i++) {
      X.push(timestamps[i]);
    }
    this.columns[0] = X;

    // Build a single group for the stacked elements
    var group = [];
    this.groups = [group];

    // Build the columns for the series
    for (i = 0; i < numSeries; i++) {
      columnName = "data" + i;
      series = this.model.series[i];
      values = results.columns[results.columnNameToIndex[series.metric]];

      Y = [columnName];

      for (j = 0; j < numValues; j++) {
        Y.push(values[j]);
      }

      this.columns[i + 1] = Y;

      this.colorMap[columnName] = series.color;
      this.nameMap[columnName] = this._getDisplayName(series.name);

      // Determine if this series should be stacked
      shouldStack = this._shouldStack(i);

      // If so, then add it to the group
      if (shouldStack) {
        group.push(columnName);
      }

      this.typeMap[columnName] = this._getType(series.type, shouldStack);
    }

    this.hideStatus();
    this._updatePlot();
  },

  onQueryFailed: function($super, reason) {
    $super(reason);
    this.showStatus('Query failed.');
  },

  showStatus: function(statusText) {
    var svg = d3.select(this.element).select('svg');
    if (svg) {
      var boundingRect = svg.node().getBoundingClientRect();

      svg.select('#chart-status-text').remove();
      if (statusText) {
        svg.append('text')
          .attr("id", "chart-status-text")
          .attr('x', boundingRect.width / 2)
          .attr('y', boundingRect.height / 2.5)
          .attr('text-anchor', 'middle')
          .style('font-size', '2.5em')
          .text(statusText);
      }
    }
  },

  hideStatus: function() {
    var svg = d3.select(this.element).select('svg');
    if (svg) {
      svg.select("#chart-status-text").remove();
    }
  },

  _onToggleCsvExport: function(el) {
    var iconColor = "black";
    if (this.clipboardPrimed) {
      window.backshift_c3_clipboard = undefined;
      this.clipboardPrimed = false;
    } else {
      iconColor = "green";
      var i, j, csv  = "";
      var numColumns = this.columns.length;
      var numRows = numColumns > 0 ? this.columns[0].length - 1 : 0;

      for (i = 0; i < numColumns; i++) {
        if (i == 0) {
          csv = "Timestamp";
        } else {
          csv += "," + this.nameMap[this.columns[i][0]];
        }
      }

      for (i = 1; i <= numRows; i++) {
        csv += "\n";
        for (j = 0; j < numColumns; j++) {
          if (j > 0) {
            csv += ",";
          }
          csv += this.columns[j][i];
        }
      }
      window.backshift_c3_clipboard = csv;
      this.clipboardPrimed = true;
    }
    d3.select(el).style("fill", iconColor);
  },

  _onClipboardCopy: function(e) {
    if (window.backshift_c3_clipboard === undefined) {
      return;
    }
    var isIe = (navigator.userAgent.toLowerCase().indexOf("msie") != -1
           || navigator.userAgent.toLowerCase().indexOf("trident") != -1);
    if (isIe) {
      window.clipboardData.setData('Text', window.backshift_c3_clipboard);
    } else {
      e.clipboardData.setData('text/plain', window.backshift_c3_clipboard);
    }
    e.preventDefault();
  },

  _onRendered: function() {
    var self = this;
    var svg = d3.select(this.element).select("svg");
    var boundingRect = svg.node().getBoundingClientRect();

    svg.select("#export-to-csv").remove();
    if (this.columns.length > 0 && this.exportIconSizeRatio > 0) {
      var sizeInPixels = Math.min(boundingRect.width, boundingRect.height) * this.exportIconSizeRatio;
      svg.append('text')
        .attr("id", "export-to-csv")
        .attr('x', boundingRect.width - sizeInPixels)
        .attr('y', sizeInPixels)
        .attr('font-family', 'FontAwesome')
        .attr('font-size', function(d) { return sizeInPixels + 'px'} )
        .text(function(d) { return '\uf0ce' })
        .on("click", function() { return self._onToggleCsvExport(this, self); });
    }
  },

  _updatePlot: function () {
    var self = this;

    var plotConfig = {
      bindto: d3.select(this.element),
      interaction: {
        enabled: this.interactive
      },
      data: {
        x: 'timestamp',
        columns: this.columns,
        types: this.typeMap,
        names: this.nameMap,
        colors: this.colorMap,
        groups: this.groups,
        order: null // stack order by data definition
      },
      size: {
        width: this.width,
        height: this.height
      },
      axis: {
        x: {
          type: 'timeseries',
          tick: {
          }
        },
        y: {
          label: self.verticalLabel,
          tick: {
            format: d3.format(".2s")
          }
        }
      },
      grid: {
        x: {
          show: true
        },
        y: {
          show: true
        }
      },
      transition: {
        duration: 0
      },
      point: {
        show: false
      },
      zoom: {
        enabled: this.zoom
      },
      onrendered: function () {
        self._onRendered()
      },
      title: {
        text: this.title
      },
      tooltip: {
        format: {
          title: function (d) { return d; },
          value: function (value, ratio, id) {
            return d3.format(".4s")(value);
          }
        }
      }
    };

    if (self.columns && self.columns.length > 0) {
      plotConfig.axis.x.tick.count = 30;

      var timestamps = self.columns[0];
      if (timestamps && timestamps.length >= 2) {
        // timestamp,value,...
        var oldest = timestamps[1];
        var newest = timestamps[timestamps.length - 1];
        var difference = newest - oldest;

        if (difference < 90000000) {
          // less than about a day - 14:01
          plotConfig.axis.x.tick.format = '%H:%M';
          plotConfig.axis.x.tick.count = 24;
        } else if (difference < 1209600000) {
          // less than 2 weeks - Tue Jul 28
          plotConfig.axis.x.tick.format = '%a %b %d';
          plotConfig.axis.x.tick.count = 14;
        } else if (difference < 7776000000) {
          // less than 90 days - Jul 28
          plotConfig.axis.x.tick.format = '%b %d';
          plotConfig.axis.x.tick.count = 30;
        } else {
          // more than 3 months - Jul 2015
          plotConfig.axis.x.tick.format = '%b %Y';
          plotConfig.axis.x.tick.count = 12;
        }
      }
    } else {
      delete plotConfig.axis.x.tick.count;
    }

    self.chart = c3.generate(plotConfig);
  }
});
