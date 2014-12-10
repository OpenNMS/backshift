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

    getSeriesType: function(series) {
        var type = series.type;
        if (type === "area") {
            type = "stack";
        }
        return type;
    },

    onRender: function() {
        var yAxisWidth = 30;
        var legendLeftMargin = Math.floor(yAxisWidth / 2);

        var containerDiv = d3.select(this.element);
        var containerEl = containerDiv.node();
        containerEl.style.width = (this.width + yAxisWidth) + "px";

        this.yAxisDiv = containerDiv.append("div");
        var yAxisEl = this.yAxisDiv.node();
        yAxisEl.style.width = yAxisWidth + "px";
        yAxisEl.style.height = this.height + "px";
        yAxisEl.style.float = "left";

        this.chartDiv = containerDiv.append("div");
        var chartEl = this.chartDiv.node();
        chartEl.style.width = this.width + "px";
        chartEl.style.height = this.height + "px";
        chartEl.style.float = "left";

        /*
         var xAxisHeight = 30;
        this.xAxisDiv = containerDiv.append("div");
        var xAxisEl = this.xAxisDiv.node();
        xAxisEl.style.width = this.width + "px";
        xAxisEl.style.height = xAxisHeight + "px";
        xAxisEl.style.marginLeft = yAxisWidth + "px";
        chartEl.style.float = "left";
        */

        this.previewDiv = containerDiv.append("div");
        var previewEl = this.previewDiv.node();
        previewEl.style.width = this.width + "px";
        previewEl.style.marginLeft = yAxisWidth + "px";
        previewEl.style.float = "left";

        this.legendDiv = containerDiv.append("div");
        var legendEl = this.legendDiv.node();
        legendEl.style.width = (this.width + yAxisWidth - legendLeftMargin) + "px";
        legendEl.style.paddingTop = "10px";
        legendEl.style.marginLeft = legendLeftMargin + "px";
        legendEl.style.clear = "both";

        var palette = new Rickshaw.Color.Palette( { scheme: 'classic9' } );

        var rickshawSeries = [];
        var n = this.model.series.length;
        for (var i = 0; i < n; i++) {
            var series = this.model.series[i];
            rickshawSeries.push({
                name: series.name,
                data: this.seriesData[series.name],
                color: this.getSeriesColor(series, palette.color()),
                renderer: this.getSeriesType(series)
            });
        }

        this.graph = new Rickshaw.Graph( {
            element: chartEl,
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
            orientation: 'bottom',
            /* element: xAxisEl, */
            timeFixture: new Rickshaw.Fixtures.Time.Local()
        });

        xAxis.render();

        var yAxis = new Rickshaw.Graph.Axis.Y({
            graph: this.graph,
            orientation: 'left',
            element: yAxisEl,
            tickFormat: Rickshaw.Fixtures.Number.formatKMBT
        });

        yAxis.render();

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
