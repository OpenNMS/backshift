Backshift.namespace('Backshift.Utilities.RrdGraphConverter');

Backshift.Utilities.RrdGraphConverter = Backshift.Class.create(Backshift.Utilities.RrdGraphVisitor, {

  onInit: function (args) {
    this.graphDef = args.graphDef;
    this.resourceId = args.resourceId;

    this.model = {
      metrics: [],
      series: []
    };

    this.rpnConverter = new Backshift.Utilities.RpnToJexlConverter();

    // Replace strings.properties tokens
    var propertyValue, i, n = this.graphDef.propertiesValues.length;
    for (i = 0; i < n; i++) {
      propertyValue = this.graphDef.propertiesValues[i];
      var re = new RegExp("\\{" + propertyValue + "}", "g");
      this.graphDef.command = this.graphDef.command.replace(re, propertyValue);
    }

    this._visit(this.graphDef);

    // Determine the set of metric names that are used in the series / legends
    var nonTransientMetrics = {};
    n = this.model.series.length;
    for (i = 0; i < n; i++) {
      nonTransientMetrics[this.model.series[i].metric] = 1;
    }

    // Mark all other sources as transient - if we don't use their values, then don't return them
    var metric;
    n = this.model.metrics.length;
    for (i = 0; i < n; i++) {
      metric = this.model.metrics[i];
      metric.transient = !(metric.name in nonTransientMetrics);
    }
  },

  _onTitle: function (title) {
    this.model.title = title;
  },

  _onVerticalLabel: function (label) {
    this.model.verticalLabel = label;
  },

  _onDEF: function (name, path, dsName, consolFun) {
    var columnIndex = parseInt(/\{rrd(\d+)}/.exec(path)[1]) - 1;
    var attribute = this.graphDef.columns[columnIndex];

    this.model.metrics.push({
      name: name,
      attribute: attribute,
      resourceId: this.resourceId,
      datasource: dsName,
      aggregation: consolFun
    });
  },

  _onCDEF: function (name, rpnExpression) {
    this.model.metrics.push({
      name: name,
      expression: this.rpnConverter.convert(rpnExpression)
    });
  },

  _onLine: function (srcName, color, legend, width) {
    this.model.series.push({
      name: legend,
      metric: srcName,
      type: "line",
      color: color
    });
  },

  _onArea: function (srcName, color, legend) {
    this.model.series.push({
      name: legend,
      metric: srcName,
      type: "area",
      color: color
    });
  },

  _onStack: function (srcName, color, legend) {
    this.model.series.push({
      name: legend,
      metric: srcName,
      type: "stack",
      color: color
    });
  }
});
