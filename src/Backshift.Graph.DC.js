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
      step: false, // treats points a segments (similar to rrdgraph)
      zoom: true, // whether to allow zooming
      interpolate: 'linear', // if step is false, set the line interpolation
      tension: undefined, // if step is false, set the interpolation tension
    });
  },

  onInit: function () {
    // Used to hold a reference to the div that holds the status text
    this.statusBlock = null;
    this.idPrefix = new Date().getTime() + '' + Math.floor(Math.random() * 100000);
    this.crossfilter = crossfilter([]);
    this.dateDimension = this.crossfilter.dimension(function(d) {
      return d.timestamp;
    });
    this.renderGraphs();
  },

  onBeforeQuery: function() {
    this.showStatus('Loading...');
  },

  onQuerySuccess: function (results) {
    this.hideStatus();
    this.updateData(results);
  },

  onQueryFailed: function($super, reason) {
    $super(reason);
    this.showStatus('Query failed.');
    this.renderGraphs();
  },

  onCancel: function () {
    this.crossfilter.groupAll();
    this.crossfilter.remove();
  },

  showStatus: function(statusText) {
    var svg = this.chart.svg();

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
    var svg = this.chart.svg();
    svg.select("#chart-status-text").remove();
  },

  updateData: function (results) {
    var self = this,
      numRows = results.columns[0].length,
      numColumns = results.columnNames.length,
      rows = [],
      i,
      k, row;

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

    self.crossfilter.groupAll();
    self.crossfilter.remove();
    self.crossfilter.add(rows);

    var now = new Date(),
      minTime = self.dateDimension.bottom(1),
      maxTime = self.dateDimension.top(1);

    if (minTime.length === 0) {
      minTime = now;
    } else {
      minTime = minTime[0].timestamp;
    }
    if (maxTime.length === 0) {
      maxTime = now;
    } else {
      maxTime = maxTime[0].timestamp;
    }
    var difference = maxTime.getTime() - minTime.getTime();

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

    if (self.chart) {
      self.chart
        .elasticX(false)
        .elasticY(true)
        .x(d3.time.scale().domain([minTime, maxTime]))
        .round(xunits.round)
        .xUnits(xunits)
        .render();
    }

    self.renderGraphs();
  },

  renderGraphs: function () {
    var self = this, i, k;

    var timeFormat = d3.time.format('%Y-%m-%d %H:%M:%S');
    var numberFormat = d3.format('.2s');

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

    var columnGroups = [];

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
      return self.dateDimension.group().reduce(reduceAdd, reduceDel, reduceInitial);
    };

    for (i = 0; i < self.model.series.length; i++) {
      var columnName = self.model.series[i].metric;

      columnGroups[i] = getGroup(columnName);
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

      for (i = 0; i < self.model.series.length; i++) {
        var lastChart, lastSeries, nextSeries;
        if (charts.length > 0) {
          lastChart = charts[charts.length - 1];
        }

        ser = self.model.series[i];
        if (i > 0) {
          lastSeries = self.model.series[i-1];
        }
        if (self.model.series[i+1]) {
          nextSeries = self.model.series[i+1];
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

        if (this.step && currentChart) {
          currentChart.interpolate('step-after');
        } else if (this.interpolate && currentChart) {
          currentChart.interpolate(this.interpolate);
        }
        if (this.tension) {
          currentChart.tension(this.tension);
        }
      }

      if (colors.length) {
        charts[charts.length - 1].ordinalColors(colors);
      }

      var legendItemHeight = 10,
        legendItemGap = 5;

      chart
        .renderHorizontalGridLines(true)
        .renderVerticalGridLines(true)
        .width(self.width)
        .height(self.height)
        .margins({
          top: 30,
          right: 20,
          bottom: (legendItemHeight * 2) + legendItemGap + 40,
          left: 50
        })
        .transitionDuration(0)
        .mouseZoomable(this.zoom)
        .zoomOutRestrict(true)
        .dimension(self.dateDimension)
        ;

      chart
        .x(d3.scale.ordinal())
        .yAxisLabel(self.verticalLabel, 14)
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
        .y(self.height - ((legendItemHeight * 2) + legendItemGap) - 10)
        .itemHeight(legendItemHeight)
        .gap(legendItemGap)
        .legendWidth(self.width - 140)
        .horizontal(true)
        .autoItemWidth(true)
      ;
      chart.legend(legend);

      chart.xAxis().ticks(6);
      chart.yAxis().tickFormat(numberFormat);

      if (self.title) {
        chart.on('renderlet', function(chart) {
          var svg = chart.svg();
          svg.select('#' + id + '-chart-background').remove();
          svg.insert('rect', ':first-child')
            .attr('id', id + '-chart-background')
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
      self.chart = chart;
    }
  }
});
