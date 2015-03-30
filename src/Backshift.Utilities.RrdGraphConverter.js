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

    this._visit(this.graphDef, this.resourceId);
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
      expression: this._rpnToJexl(rpnExpression)
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
      type: "stack",
      color: color
    });
  },

  _rpnToJexl: function(rpnExpression) {
    return "1.0";
  }

} );
