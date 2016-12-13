/**
 * Created by jwhite on 5/21/14.
 */

Backshift.namespace('Backshift.Graph');

/** The core graph implementation */
Backshift.Graph = Backshift.Class.create(Backshift.Class.Configurable, {
  initialize: function (args) {
    if (args.dataSource === undefined) {
      Backshift.fail('Graph needs a data source.');
    }
    this.dataSource = args.dataSource;

    if (args.element === undefined) {
      Backshift.fail('Graph needs an element.');
    }

    this.element = args.element;
    this.model = args.model || {};
    if (!this.model.metrics) {
      this.model.metrics = [];
    }
    if (!this.model.series) {
      this.model.series = [];
    }
    if (!this.model.values) {
      this.model.values = [];
    }
    if (!this.model.printStatements) {
      this.model.printStatements = [];
    }
    this._title = args.title || this.model.title;
    this._verticalLabel = args.verticalLabel || this.model.verticalLabel;
    this._regexes = {};

    this._values = {};

    this.configure(args);

    this.queryInProgress = false;
    this.lastSuccessfulQuery = 0;
    this.timer = null;

    this.onInit(args);
  },

  defaults: function () {
    return {
      width: 400,
      height: 240,
      resolution: 0,
      start: 0,
      end: 0,
      last: 0,
      refreshRate: 0,
      beginOnRender: true,
      stream: true,
      checkInterval: 15 * 1000 // 15 seconds
    };
  },

  render: function () {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.onRender();
    if (this.beginOnRender) {
      this.begin();
    }
  },

  begin: function () {
    this.onBegin();
    this.refresh();
    this.createTimer();
    if (this.stream) {
      this.startStreaming();
    }
  },

  cancel: function () {
    this.destroyTimer();
    this.stopStreaming();
    this.onCancel();
  },

  resize: function(size) {
    // Implemented by subclasses
  },

  destroy: function() {
    this.hideStatus();
    this.destroyTimer();
    this.onDestroy();
  },

  createTimer: function () {
    var self = this;
    self.destroyTimer();
    self.timer = setInterval(function () {
      if (self.shouldRefresh()) {
        self.refresh();
      }
    }, self.checkInterval);
  },

  destroyTimer: function () {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  setStart: function (start) {
    this.start = start;
    this.refresh();
  },

  setEnd: function (end) {
    this.end = end;
    this.refresh();
  },

  refresh: function () {
    var self = this;

    if (!self.dataSource.supportsQueries()) {
      return;
    }

    var timeSpan = this.getTimeSpan();
    this.queryInProgress = true;
    this.onBeforeQuery();
    this.dataSource.query(timeSpan.start, timeSpan.end, this.getResolution()).then(function (results) {
      self.queryInProgress = false;
      self.lastSuccessfulQuery = Date.now();
      self.updateValues(results);
      self.updateTextFields(results);
      self.onQuerySuccess(results);
      self.onAfterQuery();
    }, function (reason) {
      self.queryInProgress = false;
      self.onQueryFailed(reason);
      self.onAfterQuery();
    });
  },

  startStreaming: function () {
    var self = this;
    if (self.dataSource.supportsStreaming() && !self.isStreaming) {
      self.isStreaming = true;
      self.dataSource.callback = function(results) {
        self.updateValues(results);
        self.updateTextFields(results);
        self.onQuerySuccess(results);
      };
      this.dataSource.startStreaming();
    }
  },

  stopStreaming: function() {
    var self = this;
    if (self.isStreaming) {
      self.isStreaming = false;
      if (self.dataSource.supportsStreaming()) {
        self.dataSource.stopStreaming();
      }
    }
  },

  updateValues: function(results) {
    this._values = {};
    for (var i = 0; i < this.model.values.length; i++) {
      var value = this.model.values[i];

      this._values[value.name] = {
        metricName: value.expression.metricName,
        functionName: value.expression.functionName,
        argument: value.expression.argument,
        value: value.expression.consolidate(results),
      };
    }
  },

  updateTextFields: function(results) {
    var self = this;

    var title = self._title,
      verticalLabel = self._verticalLabel,
      value,
      re;

    if (self.model.properties) {
      for (var prop in self.model.properties) {
        if (!self._regexes[prop]) {
          self._regexes[prop] = new RegExp("\\{" + prop + "}", "g");
        }
        re = self._regexes[prop];

        if (results.constants && results.constants[prop]) {
          value = results.constants[prop];
        } else {
          value = "null";
        }
        if (title) { title = title.replace(re, value); }
        if (verticalLabel) { verticalLabel = verticalLabel.replace(re, value); }
      }
    }

    self.title = title;
    self.verticalLabel = verticalLabel;
  },

  shouldRefresh: function () {
    // Don't refresh in another query is already in progress
    if (this.queryInProgress) {
      return false;
    }

    // Don't refresh if disabled.
    if (this.refreshRate === 0) {
      return false;
    }

    return this.lastSuccessfulQuery <= Date.now() - this.refreshRate;
  },

  getTimeSpan: function () {
    if (this.start === 0 && this.end === 0 && this.last === 0) {
      Backshift.fail('Graph needs start and end, or last to be non-zero.');
    }

    var timeSpan = {};
    if (this.last > 0) {
      timeSpan.end = Date.now();
      timeSpan.start = timeSpan.end - this.last;
    } else {
      timeSpan.end = this.end;
      timeSpan.start = this.start;
    }
    return timeSpan;
  },

  getResolution: function () {
    if (this.resolution > 0) {
      return this.resolution;
    } else {
      return this.width;
    }
  },

  showStatus: function (statusText) {
    if (this.statusElement) {
      this.statusElement.text(statusText);
    } else if (this.element) {
      this.statusElement = d3.select(this.element)
        .insert('div', ':first-child');
      this.statusElement
        .attr('align', 'center')
        .attr('class', 'backshift-status')
        .text(statusText);
    }
  },

  hideStatus: function () {
    if (this.statusElement) {
      this.statusElement.remove();
    }
  },

  onInit: function (args) {
    // Implemented by subclasses
  },

  onRender: function () {
    // Implemented by subclasses
  },

  onBegin: function () {
    // Implemented by subclasses
  },

  onCancel: function () {
    // Implemented by subclasses
  },

  onBeforeQuery: function () {
    // Implemented by subclasses
  },

  onQuerySuccess: function (results) {
    // Implemented by subclasses
  },

  onQueryFailed: function (reason) {
    console.log("Query failed with: " + reason);
  },

  onAfterQuery: function () {
    // Implemented by subclasses
  },

  onDestroy: function () {
    // Implemented by subclasses
  }
});
