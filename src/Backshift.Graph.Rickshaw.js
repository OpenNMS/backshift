/**
 * Created by jwhite on 5/21/14.
 */

Backshift.namespace('Backshift.Graph.Rickshaw');

/** A graph implementation that uses Rickshaw */

Backshift.Graph.Rickshaw  = Backshift.Class.create( Backshift.Graph, {

    onInit: function() {
        this.graph = null;

        // Create empty arrays for the series data
        this.seriesData = {};
        var n = this.model.series.length;
        for (var i = 0; i < n; i++) {
            var series = this.model.series[i];
            this.seriesData[series.name] = [];
        }

        this.previewDiv = null;
        this.legendDiv = null;
    },

    updateSeriesData: function (dp) {
        var timestamps = dp.getTimestamps();

        var n = this.model.series.length;
        for (var i = 0; i < n; i++) {
            var series = this.model.series[i];
            var values = dp.getValues(series.source);
            var store = this.seriesData[series.name];

            // Clear the store
            while (store.length > 0) {
                store.pop();
            }

            // Push in the values
            var m = values.length;
            for (var j = 0; j < m; j++) {
                // Skip NaNs
                if (isNaN(values[j])) {
                    continue;
                }
                store.push({
                    x: timestamps[j],
                    y: values[j]
                });
            }

            //console.log(series.name + " has " + store.length + " points.");
        }

        // console.log("Series data used for Rickshaw", JSON.stringify(this.seriesData));

        if (this.graph !== null) {
            this.graph.update();
        }
    },

    getSeriesColor: function(series, fallback) {
        if (series.color !== undefined) {
            return series.color;
        } else {
            return fallback;
        }
    },

    onRender: function() {
        var container = d3.select(this.element);

        this.chartDiv = container.append("div");
        this.previewDiv = container.append("div");
        this.legendDiv = container.append("div");

        var palette = new Rickshaw.Color.Palette( { scheme: 'classic9' } );

        var rickshawSeries = [];
        var n = this.model.series.length;
        for (var i = 0; i < n; i++) {
            var series = this.model.series[i];
            rickshawSeries.push({
                name: series.name,
                data: this.seriesData[series.name],
                color: this.getSeriesColor(series, palette.color()),
                renderer: series.type
            });
        }

        this.graph = new Rickshaw.Graph( {
            element: this.chartDiv.node(),
            renderer: 'multi',
            width: this.width,
            height: this.height,
            min: 'auto',
            series: rickshawSeries,
            padding: {top: 0.02, left: 0.02, right: 0.02, bottom: 0.02}
        } );

        this.graph.render();

        var xAxis = new Rickshaw.Graph.Axis.Time({
            graph: this.graph,
            timeFixture: new Rickshaw.Fixtures.Time.Local()
        });

        xAxis.render();

        var yAxis = new Rickshaw.Graph.Axis.Y({
            graph: this.graph,
            tickFormat: Rickshaw.Fixtures.Number.formatKMBT
        });

        yAxis.render();

        this.legendDiv.node().style.paddingTop = '10px';
        this.legend = new Backshift.Legend.Rickshaw( {
            model: this.model,
            graph: this.graph,
            element: this.legendDiv.node(),
            dataProcessor: this.dp
        } );

        this.legend.render();

        /* var hoverDetail = */ new Rickshaw.Graph.HoverDetail( {
            graph: this.graph,
            xFormatter: function(x) {
                return new Date(x * 1000).toString();
            }
        } );
    },

    onFetchSuccess: function(dp) {
        this.updateSeriesData(dp);

        // Render the preview pane once the graph has data,
        // it fails to load intermittently otherwise
        var container = d3.select(this.element);

        if (this.model.preview) {
            var preview = new Rickshaw.Graph.RangeSlider.Preview( {
                graph: this.graph,
                element: this.previewDiv.node()
            } );

            preview.render();
        }

        // Update the legend with the latest values
        this.legend.render(this.dp);
    }

});
