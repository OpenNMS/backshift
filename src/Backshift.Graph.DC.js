/**
 * Created by jwhite on 5/23/14.
 */

Backshift.namespace('Backshift.Graph.DC');

/** Draws a table with all of the sources values. */
Backshift.Graph.DC = Backshift.Class.create(Backshift.Graph, {

  defaults: function ($super) {
    return Backshift.extend($super(), {
      width: undefined,
      height: undefined,
      title: undefined,
      verticalLabel: undefined,
      clipboardData: undefined,
      replaceDiv: false, // (experimental) whether or not to render off-screen in a new div and replace the old one
      exportIconSizeRatio: 0.05, // relative size in pixels of "Export to CSV" icon - set to 0 to disable
      interactive: true, // whether to do fancier chart navigation with mouse input events
      step: false, // treats points a segments (similar to rrdgraph)
      zoom: true, // whether to allow zooming
    });
  },

  onInit: function () {
    // Used to hold a reference to the div that holds the status text
    this.statusBlock = null;
    this.idPrefix = new Date().getTime() + '' + Math.floor(Math.random() * 100000);
  },

  onBeforeQuery: function () {
    this.timeBeforeQuery = Date.now();
    this.updateStatus("Querying...");
  },

  onQuerySuccess: function (results) {
    this.drawGraphs(results);
    var timeAfterQuery = Date.now();
    var queryDuration = Number((timeAfterQuery - this.timeBeforeQuery) / 1000).toFixed(2);
    this.updateStatus("Successfully retrieved data in " + queryDuration + " seconds.");
  },

  onQueryFailed: function () {
    this.updateStatus("Query failed.");
  },

  updateStatus: function (status) {
    /*
    if (this.statusBlock) {
      this.statusBlock.text(status);
    } else {
      this.statusBlock = d3.select(this.element).append("p").attr("align", "right").text(status);
    }
    */
  },

  drawGraphs: function (results) {
    var self = this,
      numRows = results.columns[0].length,
      numColumns = results.columnNames.length,
      rows = [],
      val,
      i,
      k, row;

    var timeFormat = d3.time.format('%Y-%m-%d %H:%M:%S');
    var numberFormat = d3.format('0.2f');

    /* make this element unique so we can refer to it when rendering */
    var dgName = self.element.getAttribute('data-graph-model');
    if (dgName === undefined) {
      dgName = self.element.getAttribute('data-graph-name');
    }
    var id = dgName + self.idPrefix;
    self.element.id = id;
    jQuery(self.element)
      .css('max-height', self.height)
      .css('max-width', self.width)
      .css('position', 'relative')
      .css('float', 'none');

    for (i = 0; i < numRows; i++) {
      row = {};
      for (k = 0; k < numColumns; k++) {
        val = results.columns[k][i];
        if (k === 0) { // timestamp
          val = new Date(val);
        }
        if (val === null || val === undefined || val === 'NaN' || isNaN(val)) {
          val = NaN;
        }
        row[results.columnNames[k]] = val;
      }
      rows.push(row);
    }

    var minTime = results.columns[0][0],
      maxTime = results.columns[0][numRows-1],
      difference = maxTime - minTime;

    numRows = rows.length;
    var columnNames = results.columnNames.splice(1);

    if (!self.crossfilter) {
      self.crossfilter = crossfilter([]);
    }
    self.crossfilter.remove();
    self.crossfilter.add(rows);

    var xunits;

    if (difference < 90000000) {
      xunits = d3.time.hours;
    } else if (difference < 1209600000) {
      xunits = d3.time.days;
    } else if (difference < 7776000000) {
      xunits = d3.time.months;
    } else {
      xunits = d3.time.years;
    }

    // dimension by timestamp
    var dateDimension = self.crossfilter.dimension(function(d) {
      return d.timestamp;
    });

    var columnGroups = [];
    var yMin = Number.POSITIVE_INFINITY;
    var yMax = Number.NEGATIVE_INFINITY;

    var getGroup = function(columnName) {
      var reduceAdd = function(p,v) {
        if (isNaN(v[columnName])) {
          p.nanCount++;
        } else {
          p.total += v[columnName];
        }
        if (p.nanCount > 0) {
          p.value = NaN;
        } else {
          p.value = p.total;
        }
        return p;
      };

      var reduceDel = function(p,v) {
        if (isNaN(v[columnName])) {
          p.nanCount--;
        } else {
          p.total -= v[columnName];
        }
        if (p.nanCount > 0) {
          p.value = NaN;
        } else {
          p.value = p.total;
        }
        return p;
      };

      var reduceInitial = function() {
        return {nanCount:0, total:0, value:NaN};
      };
      return dateDimension.group().reduce(reduceAdd, reduceDel, reduceInitial);
    };

    for (i = 0; i < self.series.length; i++) {
      var columnName = self.series[i].metric;

      columnGroups[i] = getGroup(columnName);

      // used for determining min/max for the entire graph; this is horribly inefficient
      var ydim = self.crossfilter.dimension(function(d) {
        return d[columnName];
      }).filterFunction(function(d) {
        return !isNaN(d);
      });

      var min = ydim.bottom(1)[0];
      var max = ydim.top(1)[0];
      yMin = Math.min(yMin, min[columnName]);
      yMax = Math.max(yMax, max[columnName]);
    }

    if (yMin < 0) {
      yMin = yMin * 1.1;
    } else {
      yMin = yMin * 0.9;
    }
    if (yMax > 0) {
      yMax = yMax * 1.1;
    } else {
      yMax = yMax * 0.9;
    }

    if (self.chart) {
      self.chart.redraw();
    } else {
      var chart = dc.compositeChart('#' + id);

      var charts = [], colors = [], ser, itemCount = 0,
        accessor = function(d) {
          return d.value.value;
        },
        definedFunc = function(d) {
          return !isNaN(d.y);
        }
      ;

      for (i = 0; i < self.series.length; i++) {
        var lastChart, lastSeries, nextSeries;
        if (charts.length > 0) {
          lastChart = charts[charts.length - 1];
        }

        ser = self.series[i];
        if (i > 0) {
          lastSeries = self.series[i-1];
        }
        if (self.series[i+1]) {
          nextSeries = self.series[i+1];
        }

        var currentChart;
        if (ser.type === 'area' && ser.name === undefined && nextSeries && nextSeries.type === 'line' && ser.metric === nextSeries.metric) {
          // the measurements API defines an area graph by returning
          // 2 segments: the "area", and the "line".  dc.js will automatically
          // fill the area if we give it a line graph, so we do this to merge
          // area/line tuples into one chart definition
        } else if (ser.type === 'area') {
          itemCount++;
          if (colors.length) {
            lastChart.ordinalColors(colors);
          }
          colors = [ser.color];
          currentChart = dc.lineChart(chart)
            .renderArea(true)
            .group(columnGroups[i], ser.name)
            .valueAccessor(accessor)
            .defined(definedFunc)
            ;
          charts.push(currentChart);
        } else if (ser.type === 'line') {
          itemCount++;
          if (colors.length) {
            lastChart.ordinalColors(colors);
          }
          colors = [ser.color];
          currentChart = dc.lineChart(chart)
            .group(columnGroups[i], ser.name)
            .valueAccessor(accessor)
            .defined(definedFunc)
            ;
          if (lastSeries && lastSeries.type === 'area' && lastSeries.metric === ser.metric) {
            // this line graph is actually part of the previous area graph
            // in the series, so treat it as an area
            currentChart.renderArea(true);
          }
          charts.push(currentChart);
        } else if (ser.type === 'stack') {
          itemCount++;
          lastChart.stack(columnGroups[i], ser.name);
          colors.push(ser.color);
        }
      }

      if (colors.length) {
        charts[charts.length - 1].ordinalColors(colors);
      }

      var legendItemHeight = 10,
        legendItemGap = 5;

      chart
        .renderHorizontalGridLines(true)
        .width(self.width)
        .height(self.height)
        .margins({
          top: 30,
          right: 20,
          bottom: (legendItemHeight * 2) + legendItemGap + 30,
          left: 45
        })
        .transitionDuration(0)
        .mouseZoomable(false)
        .zoomOutRestrict(true)
        .dimension(dateDimension)
        ;

      chart
        .x(d3.time.scale().domain([minTime, maxTime]))
        .round(xunits.round)
        .xUnits(xunits)
        ;

      chart
        .yAxisLabel(self.verticalLabel, 16)
        .elasticY(true)
        ;

      chart
        .renderTitle(true)
        .title(function(p) {
          return timeFormat(p.key) + ': ' + numberFormat(p.value.value);
        })
        ;

      var legend = dc.legend()
        .x(50)
        .y(self.height - ((legendItemHeight * 2) + legendItemGap))
        .itemHeight(legendItemHeight)
        .gap(legendItemGap)
        .legendWidth(self.width - 140)
        .horizontal(true)
        .autoItemWidth(true)
      ;
      chart.legend(legend);

      chart.xAxis().ticks(6);
      chart.yAxis().tickFormat(d3.format('.2s'));

      if (self.title) {
        chart.on('postRender', function(chart) {
          var svg = chart.svg();
          svg.insert('rect', ':first-child')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('fill', 'white');

          var boundingRect = svg.node().getBoundingClientRect();

          svg.select('#' + id + '-chart-title').remove();
          svg.append('text')
            .attr('id', id + '-chart-title')
            .attr('x', boundingRect.width / 2)
            .attr('y', '20')
            .attr('text-anchor', 'middle')
            .style('font-size', '1em')
            .text(self.title);
        });
      }

      chart
        .compose(charts)
        .brushOn(false)
        .render();
    }
  }
});
