import { d3 } from './d3';

import Backshift from './Backshift';

/**
 * Created by jwhite on 5/21/14.
 */

/** The core graph implementation */
class Graph extends Backshift {
  constructor(args) {
    super();

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
  }

  defaults() {
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
  }

  render() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.onRender();
    if (this.beginOnRender) {
      this.begin();
    }
  }

  begin() {
    this.onBegin();
    this.refresh();
    this.createTimer();
    if (this.stream) {
      this.startStreaming();
    }
  }

  cancel() {
    this.destroyTimer();
    this.stopStreaming();
    this.onCancel();
  }

  resize(size) {
    // Implemented by subclasses
  }

  destroy() {
    this.hideStatus();
    this.destroyTimer();
    this.onDestroy();
  }

  createTimer() {
    const self = this;
    self.destroyTimer();
    self.timer = setInterval(function () {
      if (self.shouldRefresh()) {
        self.refresh();
      }
    }, self.checkInterval);
  }

  destroyTimer() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  setStart(start) {
    this.start = start;
    this.refresh();
  }

  setEnd(end) {
    this.end = end;
    this.refresh();
  }

  refresh() {
    const self = this;

    if (!self.dataSource || !self.dataSource.supportsQueries()) {
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
  }

  startStreaming() {
    const self = this;
    if (self.dataSource && self.dataSource.supportsStreaming() && !self.isStreaming) {
      self.isStreaming = true;
      self.dataSource.callback = function(results) {
        self.updateValues(results);
        self.updateTextFields(results);
        self.onQuerySuccess(results);
      };
      this.dataSource.startStreaming();
    }
  }

  stopStreaming() {
    const self = this;
    if (self.isStreaming) {
      self.isStreaming = false;
      if (self.dataSource && self.dataSource.supportsStreaming()) {
        self.dataSource.stopStreaming();
      }
    }
  }

  updateValues(results) {
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
  }

  updateTextFields(results) {
    const self = this;

    var title = self._title,
      verticalLabel = self._verticalLabel,
      value,
      re;

    if (self.model && self.model.properties) {
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
  }

  shouldRefresh() {
    // Don't refresh in another query is already in progress
    if (this.queryInProgress) {
      return false;
    }

    // Don't refresh if disabled.
    if (this.refreshRate === 0) {
      return false;
    }

    return this.lastSuccessfulQuery <= Date.now() - this.refreshRate;
  }

  getTimeSpan() {
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
  }

  getResolution() {
    if (this.resolution > 0) {
      return this.resolution;
    } else {
      return this.width;
    }
  }

  showStatus(statusText) {
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
  }

  hideStatus() {
    if (this.statusElement) {
      this.statusElement.remove();
    }
  }

  onInit(args) {
    // Implemented by subclasses
  }

  onRender() {
    // Implemented by subclasses
  }

  onBegin() {
    // Implemented by subclasses
  }

  onCancel() {
    // Implemented by subclasses
  }

  onBeforeQuery() {
    // Implemented by subclasses
  }

  onQuerySuccess(results) {
    // Implemented by subclasses
  }

  onQueryFailed(reason) {
    console.log("Query failed with: " + reason);
  }

  onAfterQuery() {
    // Implemented by subclasses
  }

  onDestroy() {
    // Implemented by subclasses
  }
}

Backshift.Graph = Graph;
export default Graph;