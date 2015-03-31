Backshift.namespace('Backshift.Utilities.RrdGraphConverter');

/**
 * Reference: https://github.com/j-white/opennms/blob/feature-rrd-rest/opennms-webapp/src/main/java/org/opennms/web/rest/rrd/graph/NGGraphModelBuilder.java
 */
Backshift.Utilities.RrdGraphConverter  = Backshift.Class.create( Backshift.Utilities.RrdGraphVisitor, {

  onInit: function(args) {
    this.graphDef = args.graphDef;
    this.resourceId = args.resourceId;

    this.model = {
      sources: [],
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

    // Determine the set of source names that are used in the series / legends
    var nonTransientSources = {};
    n = this.model.series.length;
    for (i = 0; i < n; i++) {
      nonTransientSources[this.model.series[i].source] = 1;
    }

    // Mark all other sources as transient - if we don't use their values, then don't return them
    var source;
    n = this.model.sources.length;
    for (i = 0; i < n; i++) {
      source = this.model.sources[i];
      source.transient = !(source.name in nonTransientSources);
    }
  },

  _onDEF: function(name, path, dsName, consolFun) {
    var columnIndex = parseInt(/\{rrd(\d+)}/.exec(path)[1]) - 1;
    var attribute = this.graphDef.columns[columnIndex];

    this.model.sources.push({
      name: name,
      resourceId: this.resourceId,
      attribute: attribute,
      aggregation: consolFun
    });
  },

  _onCDEF: function(name, rpnExpression) {
    this.model.sources.push({
      name: name,
      expression: this.rpnConverter.convert(rpnExpression)
    });
  },

  _onLine: function(srcName, color, legend, width) {
    this.model.series.push({
      name: legend,
      source: srcName,
      type: "line",
      color: color
    });
  },

  _onArea: function(srcName, color, legend) {
    this.model.series.push({
      name: legend,
      source: srcName,
      type: "area",
      color: color
    });
  },

  _onStack: function(srcName, color, legend) {
    this.model.series.push({
      name: legend,
      source: srcName,
      type: "stack",
      color: color
    });
  }
} );
