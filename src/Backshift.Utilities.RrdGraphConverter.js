import Backshift from './Backshift';
import RrdGraphVisitor from './Backshift.Utilities.RrdGraphVisitor';

const _expressionRegexp = new RegExp('\\{([^}]*)}', 'g');

class RrdGraphConverter extends RrdGraphVisitor {
  constructor() {
    super();
  }

  onInit(args) {
    this.graphDef = args.graphDef;
    this.resourceId = args.resourceId;
    this.convertRpnToJexl = args.convertRpnToJexl === undefined ? true : args.convertRpnToJexl;

    this.model = {
      metrics: [],
      values: [],
      series: [],
      printStatements: [],
      properties: {}
    };

    this.rpnConverter = new Backshift.Utilities.RpnToJexlConverter();
    this.consolidator = new Backshift.Utilities.Consolidator();

    // Replace strings.properties tokens
    var propertyValue, i, j, n, m;
    for (i = 0, n = this.graphDef.propertiesValues.length; i < n; i++) {
      propertyValue = this.graphDef.propertiesValues[i];
      this.model.properties[propertyValue] = undefined;
    }

    this._visit(this.graphDef);

    for (i = 0, n = this.model.values.length; i < n; i++) {
      var metric = this.model.values[i].expression.metricName;
      if (metric === undefined) {
        continue;
      }

      var foundSeries = false;
      for (j = 0, m = this.model.series.length; j < m; j++) {
        if (metric === this.model.series[j].metric) {
          foundSeries = true;
          break;
        }
      }

      if (!foundSeries) {
        var series = {
          metric: metric,
          type: "hidden"
        };
        this.model.series.push(series);
      }
    }

    // Determine the set of metric names that are used in the series / legends
    var nonTransientMetrics = {};
    for (i = 0, n = this.model.series.length; i < n; i++) {
      nonTransientMetrics[this.model.series[i].metric] = 1;
    }

    // Mark all other sources as transient - if we don't use their values, then don't return them
    for (i = 0, n = this.model.metrics.length; i < n; i++) {
      metric = this.model.metrics[i];
      metric.transient = !(metric.name in nonTransientMetrics);
    }
  }

  _onTitle(title) {
    this.model.title = title;
  }

  _onVerticalLabel(label) {
    this.model.verticalLabel = label;
  }

  _onDEF(name, path, dsName, consolFun) {
    var columnIndex = parseInt(/\{rrd(\d+)}/.exec(path)[1]) - 1;
    var attribute = this.graphDef.columns[columnIndex];

    this.prefix = name;
    this.model.metrics.push({
      name: name,
      attribute: attribute,
      resourceId: this.resourceId,
      datasource: dsName,
      aggregation: consolFun
    });
  }


  _onCDEF(name, rpnExpression) {
    var expression = rpnExpression;
    if(this.convertRpnToJexl) {
      expression = this.rpnConverter.convert(rpnExpression);
    }
    if (this.prefix) {
      expression = expression.replace(_expressionRegexp, this.prefix + '.$1');
    }
    this.model.metrics.push({
      name: name,
      expression: expression
    });
  }

  _onVDEF(name, rpnExpression) {
    this.model.values.push({
      name: name,
      expression:  this.consolidator.parse(rpnExpression),
    });
  }

  _onLine(srcName, color, legend, width) {
    var series = {
      name: this.displayString(legend),
      metric: srcName,
      type: "line",
      color: color
    };
    this.maybeAddPrintStatementForSeries(srcName, legend);
    this.model.series.push(series);
  }

  _onArea(srcName, color, legend) {
    var series = {
      name: this.displayString(legend),
      metric: srcName,
      type: "area",
      color: color
    };
    this.maybeAddPrintStatementForSeries(srcName, legend);
    this.model.series.push(series);
  }

  _onStack(srcName, color, legend) {
    var series = {
      name: this.displayString(legend),
      metric: srcName,
      type: "stack",
      color: color,
      legend: legend
    };
    this.maybeAddPrintStatementForSeries(srcName, legend);
    this.model.series.push(series);
  }

  _onGPrint(srcName, aggregation, format) {
    if (typeof aggregation === "undefined") {
      // Modern form
      this.model.printStatements.push({
        metric: srcName,
        format: format,
      });

    } else {
      // Deprecated form - create a intermediate VDEF
      var metricName = srcName + "_" + aggregation + "_" + Math.random().toString(36).substring(2);

      this.model.values.push({
        name: metricName,
        expression:  this.consolidator.parse([srcName, aggregation]),
      });

      this.model.printStatements.push({
        metric: metricName,
        format: format,
      });
    }
  }

  _onComment(format) {
    this.model.printStatements.push({
      format: format
    });
  }

  maybeAddPrintStatementForSeries(series, legend) {
    if (legend === undefined || legend === null || legend === "") {
      return;
    }

    this.model.printStatements.push({
      metric: series,
      value: NaN,
      format: "%g " + legend
    });
 }
}

Backshift.Utilities.RrdGraphConverter = RrdGraphConverter;
export default RrdGraphConverter;