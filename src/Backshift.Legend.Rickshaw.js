/**
 * Created by jwhite on 6/3/14.
 */
Backshift.namespace('Backshift.Legend.Rickshaw');

Backshift.Legend.Rickshaw  = Backshift.Class.create( Backshift.Legend, {
    initialize: function($super, args) {
        this.graph = args.graph;
        args.width = this.graph.width;

        this.graphSeries = {};
        this.graph.series.forEach( function(s) {
            this.graphSeries[s.name] = s;
        }, this );

        $super(args);
    },
    getSeriesContext: function($super, series) {
        var context = $super(series);
        context.swatch = "<div style='display: inline-block; width: 10px; height: 10px; margin: 0 8px 0 0; background-color: " +
            this.graphSeries[series.name].color + "'></div>";
        return context;
    }
});