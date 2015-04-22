/**
 * Created by jwhite on 31/03/15.
 */

Backshift.namespace('Backshift.Graph.C3');

/**
 * Current issues:
 *   - All of the columns appear in the legend, we only want to display those with name != undefined
 *   - The x-axis gets crowded when looking at a weekly timespan
 *
 * Features to add:
 *   - Identify outages with regions: http://c3js.org/samples/region_timeseries.html
 *   - Identify events with grid lines: http://c3js.org/samples/grid_x_lines.html
 *
 * Notes:
 *   - Opacity for the area can be set with:
 *     .c3-area {
            stroke-width: 0;
            opacity: 1.0;
        }
 *
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
        return " ";
      } else {
        return name;
      }
    },

    _getType: function(type, shouldStack) {
      var derivedType,
          step = true; // treat points a segments (similar to rrdgraph)
      if (shouldStack === true) {
        derivedType = "area";
      } else {
        derivedType = type;
      }

      if (step) {
        if (derivedType === "line") {
          derivedType = "step";
        }
        else if (derivedType === "area") {
          derivedType = "area-step";
        }
      }
      return derivedType;
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

        this.typeMap[columnName] = this._getType(series.type, shouldStack);
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
            type: 'timeseries'/*,
            lines: [
              {value: 1, text: 'Lable 1'},
              {value: 3, text: 'Lable 3', position: 'middle'},
              {value: 4.5, text: 'Lable 4.5', position: 'start'}
            ]*/
          },
          y : {
            label: this.model.verticalLabel,
            tick: {
              format: d3.format("s")
            }
          }/*,
          y2: {
            show: true,
            tick: {
              format: d3.format("e")
            }
          }*/
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
