/**
 * Created by jwhite on 31/03/15.
 */

Backshift.namespace('Backshift.Graph.C3');

/**
 * Current issues:
 *   - All of the columns apear in the legend, we only want to display those with name != undefined
 *   - The color/opacity of the areas fills are off
 *
 * Features to add:
 *   - Identify regions with NaNs: http://c3js.org/samples/region_timeseries.html
 */

/** A graph implementation that uses C3 */
Backshift.Graph.C3  = Backshift.Class.create( Backshift.Graph, {

    onInit: function() {
      this.plot = null;

      this.columns = [];
      this.groups = [];
      this.colorMap = {};
      this.typeMap = {};
      this.nameMap = {};
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

    _getName: function(name) {
      if (name === undefined || name === null) {
        return null;
      } else {
        return name;
      }
    },

    onFetchSuccess: function(dp) {
      var timestamps = dp.getTimestamps();

      var series, values, i, j, numSeries, numValues, X, Y, columnName, shouldStack;
      numSeries = this.model.series.length;
      numValues = timestamps.length;

      // Reset the array of columns
      this.columns = [];

      // Build the timestamp column
      X = ['timestamp'];
      for (i = 0; i < numValues; i++) {
        X.push(timestamps[i] * 1000);
      }
      this.columns[0] = X;

      // Build a single group for the stacked elements
      var group = [];
      this.groups = [group];

      // Build the columns for the series
      for (i = 0; i < numSeries; i++) {
        columnName = "data" + i;
        series = this.model.series[i];
        values = dp.getValues(series.source);

        Y = [columnName];
        for (j = 0; j < numValues; j++) {
          Y.push(values[j])
        }

        this.columns[i+1] = Y;

        this.colorMap[columnName] = series.color;
        this.nameMap[columnName] = this._getName(series.name);

        // Determine if this series should be stacked
        shouldStack = this._shouldStack(this.model.series, i);

        // If so, then add it to the group
        if (shouldStack) {
          group.push(columnName);
        }

        this.typeMap[columnName] = shouldStack ? "area" : series.type;
      }

      this._updatePlot();
    },

    _onRendered: function() {
      var svg = d3.select(this.element).select("svg");
      if (this.model.title !== undefined) {
        svg.select("#chart-title").remove();
        svg.append('text')
          .attr("id", "chart-title")
          .attr('x', svg.node().getBoundingClientRect().width / 2)
          .attr('y', 16)
          .attr('text-anchor', 'middle')
          .style('font-size', '1.4em')
          .text(this.model.title)
      }
    },

    _updatePlot: function() {
      var self = this;
      this.plot = c3.generate({
        bindto: d3.select(this.element),
        data: {
          x: 'timestamp',
          columns: this.columns,
          types: this.typeMap,
          names: this.nameMap,
          colors: this.colorMap,
          groups: this.groups,
          order: null // stack order by data definition
        },
        axis: {
          x: {
            type: 'timeseries'
          },
          y : {
            label: this.model.verticalLabel,
            tick: {
              format: d3.format("s")
            }
          },
          y2: {
            show: true,
            tick: {
              format: d3.format("e")
            }
          }
        },
        point: {
          show: false
        },
        zoom: {
          enabled: true
        },
        onrendered: function () {
          self._onRendered();
        }
        /*,
        subchart: {
          show: true
        }*/
      });
    }
});
