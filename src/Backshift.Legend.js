/**
 * Created by jwhite on 6/3/14.
 */
Backshift.namespace('Backshift.Legend');

Backshift.Legend  = Backshift.Class.create( Backshift.Class.Configurable, {
    initialize: function(args) {
        if (args.model === undefined) {
            Backshift.fail('Legend needs a model.');
        }
        this.model = args.model;

        if (args.element === undefined) {
            Backshift.fail('Legend needs an element.');
        }
        this.element = args.element;

        this.dp = args.dataProcessor;

        if (typeof args.model.legend === 'string') {
            // The legend is a string
            this.template = args.model.legend;
        } else if (Object.prototype.toString.call( args.model.legend ) === '[object Array]') {
            // The legend is an array of strings
            this.template = args.model.legend.join(' ');
        } else if (args.model.legend === undefined) {
            // The legend is not defined
            this.template = "";
        } else {
            Backshift.fail("Invalid legend '" + args.model.legend + "'");
        }

        this.configure(args);
    },
    defaults: function() {
        return {
            width: 400
        };
    },
    getSeriesContext: function(series) {
        var context = Backshift.clone(series);
        var values = this.dp.getValues(series.source);
        Backshift.keys(Backshift.Stats.Map).forEach( function(key) {
            context[key] = Backshift.Stats.Map[key](values);
        }, this);
        return context;
    },
    render: function() {
        var series = this.model.series,
            n = series.length, k;

        var context = {};
        for (k = 0; k < n; k++) {
            context[k] = this.getSeriesContext(series[k]);
        }

        context.series = [];
        for (k = 0; k < n; k++) {
            context.series.push(context[k]);
        }

        this.element.style.width = this.width;
        this.element.innerHTML = Mark.up(this.template, context);
    }
} );