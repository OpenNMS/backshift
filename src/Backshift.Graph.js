/**
 * Created by jwhite on 5/21/14.
 */

Backshift.namespace('Backshift.Graph');

/** The core graph implementation */
Backshift.Graph = Backshift.Class.create( Backshift.Class.Configurable, {
    initialize: function(args) {
        if (args.model === undefined) {
            Backshift.fail('Graph needs a model.');
        }
        this.validateModel(args.model);
        this.model = args.model;

        if (args.element === undefined) {
            Backshift.fail('Graph needs an element.');
        }
        this.element = args.element;

        this.dp = this.createDataProcessor();

        this.configure(args);

        if (this.start === 0 && this.end === 0 && this.last === 0) {

            Backshift.fail('Graph needs start and end, or last to be non-zero.');
        }

        this.fetchInProgress = false;
        this.lastSuccessfulFetch = 0;
        this.timer = null;

        this.onInit(args);
    },

    defaults: function() {
        return {
            width: 400,
            height: 240,
            resolution: 0,
            start: 0,
            end: 0,
            last: 0,
            refreshRate: 30*1000,
            checkInterval: 1000
        };
    },

    validateModel: function(model) {
        if (model.dataProcessor === undefined) {
            Backshift.fail('Model must contain a data processor.');
        }
    },

    createDataProcessor: function() {
        var self = this;
        return Backshift.Data.Factory.create(this.model.dataProcessor, {
            sources: this.model.sources,
            beforeFetch: function(dp, args) {
                self._beforeFetch(dp, args);
            },
            onFetchSuccess: function(dp, args) {
                self._onFetchSuccess(dp, args);
            },
            onFetchFail: function(dp, args) {
                self.onFetchFail(dp, args);
            },
            afterFetch: function(dp, args) {
                self._afterFetch(dp, args);
            },
            onNewData: function(dp, args) {
                self.onNewData(dp, args);
            }
        });
    },

    render: function() {
        if (this.timer !== null) {
            clearInterval(this.timer);
            this.timer = null;
        }

        this.onRender();
        this.refresh();
        this.createTimer();
    },

    createTimer: function() {
        var self = this;
        this.timer = setInterval(function () {
            if (self.isRefreshRequired()) {
                self.refresh();
            }
        }, this.checkInterval);
    },

    setStart: function(start) {
        this.start = start;
        this.refresh();
    },

    setEnd: function(end) {
        this.end = end;
        this.refresh();
    },

    refresh: function() {
        var timeSpan = this.getTimeSpan();
        this.dp.fetch(timeSpan.start, timeSpan.end, this.getResolution());
    },

    isRefreshRequired: function() {
        // Don't refresh in another fetch is currently in progress
        if (this.fetchInProgress) {
            return false;
        }

        // Don't refresh if disabled.
        if (this.refreshRate === 0) {
            return false;
        }

        return this.lastSuccessfulFetch <= Date.now() - this.refreshRate;
    },

    getTimeSpan: function() {
        var timeSpan = {};
        if (this.last > 0) {
            timeSpan.end = Math.floor(Date.now() / 1000);
            timeSpan.start = timeSpan.end - this.last;
        } else {
            timeSpan.end = this.end;
            timeSpan.start = this.start;
        }
        return timeSpan;
    },

    getResolution: function() {
        if (this.resolution > 0) {
            return this.resolution;
        } else {
            return this.width;
        }
    },

    _beforeFetch: function(dp, args) {
        this.fetchInProgress = true;
        this.beforeFetch(dp, args);
    },

    _afterFetch: function(dp, args) {
        this.fetchInProgress = false;
        this.afterFetch(dp, args);
    },

    _onFetchSuccess: function(dp, args) {
        this.lastSuccessfulFetch = Date.now();
        this.onFetchSuccess(dp, args);
    },

    onInit: function(args) {
        // Implemented by subclasses
    },

    onRender: function() {
        // Implemented by subclasses
    },

    beforeFetch: function(dp, args) {
        // Implemented by subclasses
    },

    onFetchSuccess: function(dp, args) {
        // Implemented by subclasses
    },

    onFetchFail: function(dp, args) {
        // Implemented by subclasses
    },

    afterFetch: function(dp, args) {
        // Implemented by subclasses
    },

    onNewData: function(dp, args) {
        // Implemented by subclasses
    }
});
