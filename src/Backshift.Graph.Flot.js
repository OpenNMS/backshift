/**
 * Created by jwhite on 10/12/14.
 */

Backshift.namespace('Backshift.Graph.Flot');

/** Renders the graph using Flot */
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
      step: false, // treats points as segments (similar to rrdgraph)
    });
  },

  onInit: function () {
    var container = jQuery(this.element);
    // Set the container dimensions, Flot's canvas will use 100% of the container div
    container.width(this.width);
    container.height(this.height);
  },

  showStatus: function(text) {
    if (this.chart) {
      var options = this.chart.getOptions(),
        canvas = this.chart.getCanvas();
      if (options) {
        if (!options._oldTitle) {
          options._oldTitle = options.title;
        }
        options.title = text;
        if (options.canvas && canvas) {
          this.chart.draw();
        }
      }
    }
  },

  hideStatus: function() {
    if (this.chart) {
      var options = this.chart.getOptions(),
        canvas = this.chart.getCanvas();
      if (options) {
        if (options._oldTitle) {
          options.title = options._oldTitle;
          delete options._oldTitle;
        }
        if (options.canvas && canvas) {
          this.chart.draw();
        }
      }
    }
  },

  onBeforeQuery: function () {
    this.showStatus('Loading...');
    this.doRender = true;
  },

  onQueryFailed: function () {
    this.showStatus('Query failed.');
  },

  onQuerySuccess: function (results) {
    this.hideStatus();
    if (this.doRender) {
      this.drawChart(results);
    }
  },

  onRender: function() {
    this.doRender = true;
    this.drawChart();
  },

  onCancel: function() {
    this.doRender = false;
    this.drawChart();
  },

  /**
   * Detects transparent-AREA + colored-STACK overlay pairs (the rrdtool method
   * for loss-colored median lines) and merges them into per-color-run segments
   * so that rendering is contiguous.
   *
   * Without this, each overlay series is mostly NaN (only valid at timestamps
   * matching its loss range), causing Flot to render isolated segments instead of
   * a continuous colored line.
   *
   * Only activates when enough overlay pairs are detected — see the threshold
   * check in step 1 — to avoid false matches on graphs that use a single
   * transparent-AREA + colored-STACK pair for an independent indicator overlay.
   */
  _mergeOverlaySegments: function (timestamps) {
    var self = this;
    var i, j, numValues = timestamps.length;
    if (numValues === 0) return;

    // Step 1: Find transparent-AREA + colored-STACK pairs in flotSeries.
    var overlayPairs = [];
    var overlayIndices = {};

    for (i = 0; i < this.flotSeries.length - 1; i++) {
      var curr = this.flotSeries[i];
      var next = this.flotSeries[i + 1];

      var isTransparentArea = curr.lines.fill === 0 && curr.color === undefined
                              && curr._modelType === "area";
      // Require a non-empty label on the STACK to distinguish loss-overlay pairs
      // (which always carry a legend like "0", "1/20", ...) from transparent-base
      // gray-diff band stacks (which have no legend and would otherwise match the
      // same transparent-AREA + colored-STACK shape).
      var stackHasLabel = next.label !== undefined && next.label !== null
                          && String(next.label).trim() !== "";
      var isColoredStack = next.color !== undefined
                           && next.lines.fill !== 0.0
                           && next.lines.fill !== 0
                           && stackHasLabel;

      if (isTransparentArea && isColoredStack) {
        overlayPairs.push({
          areaIdx: i,
          stackIdx: i + 1,
          stackSeries: next
        });
        overlayIndices[i] = true;
        overlayIndices[i + 1] = true;
        i++; // skip the STACK, already consumed
      }
    }

    // Require 6+ pairs to distinguish the loss-overlay pattern from
    // incidental single-pair matches on non-StrafePing graphs.
    if (overlayPairs.length < 6) return;

    // Guard: step 2 accesses overlayPairs[i].stackSeries.data[j] for every
    // j in [0, numValues). Every flotSeries built in drawChart has exactly
    // numValues data points, so this should always hold — but if a caller ever
    // hands us mismatched series lengths, bail out rather than read OOB.
    for (i = 0; i < overlayPairs.length; i++) {
      if (overlayPairs[i].stackSeries.data.length !== numValues) return;
    }

    // Step 2: Build merged timeline — at each timestamp, find which STACK is active.
    var merged = new Array(numValues);
    for (j = 0; j < numValues; j++) {
      merged[j] = null;
      for (i = 0; i < overlayPairs.length; i++) {
        var stackData = overlayPairs[i].stackSeries.data;
        var yVal = stackData[j][1];
        if (yVal !== null && yVal !== undefined && !isNaN(yVal)) {
          merged[j] = {
            timestamp: timestamps[j],
            yVal: yVal,
            yOffset: stackData[j][2],
            color: overlayPairs[i].stackSeries.color,
            label: overlayPairs[i].stackSeries.label
          };
          break; // first match wins (only one should be active per timestamp)
        }
      }
    }

    // Step 3: Segment by consecutive color runs.
    var segments = [];
    var currentSegment = null;

    for (j = 0; j < numValues; j++) {
      if (merged[j] === null) {
        // True data gap — close current segment
        if (currentSegment !== null) {
          currentSegment.endIdx = j;
          segments.push(currentSegment);
          currentSegment = null;
        }
        continue;
      }

      if (currentSegment === null || currentSegment.color !== merged[j].color) {
        // Start a new segment (first, after a gap, or color changed)
        if (currentSegment !== null) {
          currentSegment.endIdx = j;
          segments.push(currentSegment);
        }
        currentSegment = {
          color: merged[j].color,
          label: merged[j].label,
          startIdx: j,
          endIdx: null
        };
      }
    }
    if (currentSegment !== null) {
      currentSegment.endIdx = numValues;
      segments.push(currentSegment);
    }

    // Step 4: Create a flotSeries for each segment.
    var segmentSeries = [];
    for (i = 0; i < segments.length; i++) {
      var seg = segments[i];
      var segData = [];

      for (j = seg.startIdx; j < seg.endIdx; j++) {
        if (merged[j] !== null) {
          segData.push([merged[j].timestamp, merged[j].yVal, merged[j].yOffset]);
        }
      }

      // Boundary stitching: add a point at the next segment's first timestamp
      // using the next segment's Y value so the overlay line slopes to match
      // the median line at boundaries instead of holding flat.
      if (seg.endIdx < numValues && merged[seg.endIdx] !== null) {
        segData.push([merged[seg.endIdx].timestamp, merged[seg.endIdx].yVal, merged[seg.endIdx].yOffset]);
      }

      // Only the first segment of each color gets a legend label to avoid
      // duplicate legend entries.
      var isFirstOfColor = true;
      for (var k = 0; k < i; k++) {
        if (segments[k].color === seg.color) {
          isFirstOfColor = false;
          break;
        }
      }

      segmentSeries.push({
        label: isFirstOfColor ? seg.label : null,
        color: seg.color,
        lines: {
          show: true,
          fill: false,
          lineWidth: 2,
          steps: self.step ? true : false
        },
        data: segData,
        id: "overlay_segment_" + i,
        metric: null,
        nodatatable: true
      });
    }

    // Step 5: Hide original overlay pairs visually (keep them for the data
    // table, which requires all series to have the same data length) and
    // append merged segments for rendering.
    for (i = 0; i < this.flotSeries.length; i++) {
      if (overlayIndices[i]) {
        this.flotSeries[i].lines.show = false;
        this.flotSeries[i].lines.fill = 0;
      }
    }
    for (i = 0; i < segmentSeries.length; i++) {
      this.flotSeries.push(segmentSeries[i]);
    }
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

    var timestamps = [];
    if (results && results.columns) {
      timestamps = results.columns[0];
    }
    var series = {}, values, i, j, numSeries, numValues, X, Y, columnName, shouldStack, shouldFill, seriesValues, shouldShow;
    numSeries = this.model.series.length;
    numValues = timestamps.length;

    // Rendering will silently fail if the timestamps are not ordered, throw an exception if this is detected
    for (i = 1; i < numValues; i++) {
      if (timestamps[i] < timestamps[i-1]) {
        throw "Timestamps are not properly ordered! (" + timestamps[i] + " < " + timestamps[i-1] + ")";
      }
    }

    var from, to;
    if (numValues >= 2) {
      from = timestamps[0];
      to = timestamps[timestamps.length - 1];
    }

    this.flotSeries = [];
    this.hiddenFlotSeries = [];

    var lastSeriesToStackWith = null;

    // Build the columns for the series
    for (i = 0; i < numSeries; i++) {
      columnName = "data" + i;
      series = this.model.series[i];
      if (series.metric && results && results.columns) {
        values = results.columns[results.columnNameToIndex[series.metric]];
      }

      shouldStack = this._shouldStack(i);
      shouldFill = this.model.series[i].type === "stack" || this.model.series[i].type === "area";
      shouldShow = this.model.series[i].type !== "hidden";

      if (this.model.series[i].type === "area") {
          // Reset the last series to stack with everytime we encounter a new area, since the area
          // itself should stack over any previous areas
          lastSeriesToStackWith = null;
      }

      seriesValues = [];
      for (j = 0; j < numValues; j++) {
        var yOffset = 0;
        if (shouldStack && lastSeriesToStackWith != null) {
          yOffset = lastSeriesToStackWith.data[j][1];
        }
        var yVal = isNaN(values[j]) ? values[j] : values[j] + yOffset;

        seriesValues.push([timestamps[j], yVal, yOffset]);
      }

      var shouldShowLine = true;
      if (series.color === undefined) {
          // If the color is not specified the resulting element should be transparent.
          // Hide the line too, otherwise Flot auto-assigns a palette color (e.g. #edc240)
          // and paints a visible line along the transparent series' data.
          //
          // BEHAVIOR CHANGE: this also suppresses LINE commands that declare no
          // color (e.g. `LINE1:foo` with no `#color`). Those previously rendered
          // with an auto-assigned palette color; they now render as nothing. No
          // shipped OpenNMS graph definition uses that form, and an uncolored
          // AREA/STACK — the only place colorless series appear in practice — is
          // strictly a math placeholder for the stack below.
          shouldFill = 0.0; // No opacity
          shouldShowLine = false;
      }

      // Stacked fills with step rendering produce triangular gap artifacts between
      // layers because the top/bottom step transitions don't align across adjacent
      // stacks. Disable steps for stack-type series; lines, areas, and merged
      // overlay segments still honor the global step option.
      var useStepRendering = self.step && this.model.series[i].type !== "stack";

      var flotSeries = {
        label: series.name,
        color: series.color,
        _modelType: this.model.series[i].type,
        lines: {
          show: shouldShowLine,
          fill: shouldFill,
          fillColor: series.color,
          steps: useStepRendering ? true : false
        },
        data: seriesValues,
        originalY : values,
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

    // Post-process: merge loss-color overlay pairs into contiguous segments
    if (this.flotSeries.length > 0) {
      this._mergeOverlaySegments(timestamps);
    }

    var yaxisTickFormat = d3.format(".3s");

    var legendStatements = [];
    for (i = 0; i < self.model.printStatements.length; i++) {
      var printStatement = self.model.printStatements[i];

      if (printStatement.metric in this._values) {
        // Print statements referencing a VDEF
        var value = this._values[printStatement.metric];
        legendStatements.push({
          metric: value.metricName,
          value: value.value[1],
          timestamp: value.value[0],
          format: printStatement.format,
        });

      } else if (results) {
        // Print statements referencing a series without a concrete value (used for %g)
        legendStatements.push({
          metric: printStatement.metric,
          value: NaN,
          timestamp: undefined,
          format: printStatement.format,
        });
      }
    }

    var options = {
      canvas: true,
      title: self.title || '',
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
        axisLabel: self.verticalLabel || '',
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
        statements: legendStatements
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

    this.chart = jQuery.plot(container, this.flotSeries, options);

    // Limit the zooming and panning so that at least one point is always visible
    var yaxis = this.chart.getAxes().yaxis;
    this.chart.ranges = {
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
      timezone: "browser",
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
  },

  onDestroy: function() {
    if (this.chart && this.chart.destroy) {
      this.chart.shutdown();
      this.chart.destroy();
    }
  }
});
