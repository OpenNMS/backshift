import Backshift from './Backshift';
import Utilities from './Backshift.Utilities';

const wrap = (func) => {
  return function (metricName, argument) {
    return {
      metricName: metricName,
      functionName: func.name,
      argument: argument,

      consolidate: function (data) {
        return func(data.columns[data.columnNameToIndex["timestamp"]],
                    data.columns[data.columnNameToIndex[metricName]],
                    argument);
      },
    };
  };
};

const valid = (value) => {
  return !isNaN(value) && isFinite(value);
};

const validateForEach = (timestamps, values, cb) => {
  let validCount = 0;
  for (let i = 0; i < timestamps.length; i++) {
    if (!valid(values[i])) {
      continue;
    }

    validCount++;

    cb(timestamps[i], values[i]);
  }

  return validCount;
};

/**
 * References:
 *   http://oss.oetiker.ch/rrdtool/doc/rrdgraph_data.en.html
 *   http://oss.oetiker.ch/rrdtool/doc/rrdgraph_rpn.en.html
 *
 * > Note that currently only aggregation functions work in VDEF rpn expressions.
 *
 * RRDtool currently supports a very limited subset of expressions - they must have the following form:
 * 'SERIES,[PARAMETER,]FUNCTION' whereas SERIES is a existing series and PARAMETER is a value.
 *
 * @author fooker
 */
class Consolidator extends Utilities {
  constructor() {
    super();

    const functions = {};

    this.minimum = functions['minimum'] = wrap(function minimum(timestamps, values) {
      let minimumTimestamp = undefined;
      let minimumValue = NaN;
  
      validateForEach(timestamps, values, function(timestamp, value) {
        if (isNaN(minimumValue) || value < minimumValue) {
          minimumTimestamp = timestamp;
          minimumValue = value;
        }
      });
  
      return [minimumTimestamp, minimumValue];
    });
  
    this.maximum = functions['maximum'] = wrap(function maximum(timestamps, values) {
      let maximumTimestamp = undefined;
      let maximumValue = NaN;
  
      validateForEach(timestamps, values, function(timestamp, value) {
        if (isNaN(maximumValue) || value > maximumValue) {
          maximumTimestamp = timestamp;
          maximumValue = value;
        }
      });
  
      return [maximumTimestamp, maximumValue];
    });
  
    this.average = functions['average'] = wrap(function average(timestamps, values) {
      let sum = 0.0;
  
      let cnt = validateForEach(timestamps, values, function(timestamp, value) {
        sum += value;
      });
  
      return [undefined, (sum / cnt)];
    });
  
    this.stdev = functions['stdev'] = wrap(function stdev(timestamps, values) {
      let sum = 0.0;
  
      let cnt = validateForEach(timestamps, values, function(timestamp, value) {
        sum += value;
      });
  
      let avg = (sum / cnt);
  
      let dev = 0.0;
      validateForEach(timestamps, values, function(timestamp, value) {
        dev += Math.pow((value - avg), 2.0);
      });
  
      return [undefined, Math.sqrt(dev / cnt)];
    });
  
    this.last = functions['last'] = wrap(function last(timestamps, values) {
      for (let i = timestamps.length - 1; i >= 0; i--) {
        if (valid(values[i])) {
          return [timestamps[i], values[i]];
        }
      }
  
      return [undefined, NaN];
    });
  
    this.first = functions['first'] = wrap(function first(timestamps, values) {
      for (let i = 0; i < timestamps.length; i++) {
        if (valid(values[i])) {
          return [timestamps[i], values[i]];
        }
      }
  
      return [undefined, NaN];
    });
  
    this.total = functions['total'] = wrap(function total(timestamps, values) {
      let sum = 0.0;
      let cnt = 0;
  
      // As we don't have a fixed step size, we can't include the first sample as RRDTool does
      for (let i = 1; i < timestamps.length; i++) {
        if (valid(values[i])) {
          sum += values[i] * (timestamps[i] - timestamps[i - 1]) / 1000.0;
          cnt += 1;
        }
      }
  
      if (cnt > 0) {
        return [undefined, sum];
      } else {
        return [undefined, NaN];
      }
    });
  
    this.percent = functions['percent'] = wrap(function percent(timestamps, values, argument) {
      let sortedValues = Array();
      for (let i = 0; i < timestamps.length; i++) {
        sortedValues.push(values[i]);
      }
  
      sortedValues.sort(function (a, b) {
        if (isNaN(a))
          return -1;
        if (isNaN(b))
          return 1;
  
        if (a == Number.POSITIVE_INFINITY)
            return 1;
        if (a == Number.NEGATIVE_INFINITY)
            return -1;
        if (b == Number.POSITIVE_INFINITY)
          return -1;
        if (b == Number.NEGATIVE_INFINITY)
          return 1;
  
        if (a < b)
          return -1;
        else
          return 1;
      });
  
      return [undefined, sortedValues[Math.round(argument * (sortedValues.length - 1) / 100.0)]];
    });
  
    this.percentnan = functions['percentnan'] = wrap(function percentnan(timestamps, values, argument) {
      let sortedValues = Array();
      validateForEach(timestamps, values, function(timestamp, value) {
        sortedValues.push(value);
      });
  
      sortedValues.sort();
  
      return [undefined, sortedValues[Math.round(argument * (sortedValues.length - 1) / 100.0)]];
    });

    // For backward compatibility with deprecated (G)PRINT syntax:
    functions['min'] = functions['minimum'];
    functions['max'] = functions['maximum'];

    this.functions = functions;
  }

  parse(tokens) {
    // Split tokens if a single expression is passed
    if (typeof tokens === 'string') {
      tokens = tokens.split(",");
    }

    let metricName = tokens.shift();

    let functionName = tokens.pop().toLowerCase();
    if (!(functionName in this.functions)) {
      Backshift.fail('Unknown correlation function: ' + functionName);
    }

    if (tokens.length > 1) {
      Backshift.fail('Too many input values in RPN express. RPN: ' + tokens);
    }

    let argument = parseFloat(tokens[0]); // The remaining token is used as parameter

    return this.functions[functionName](metricName, argument);
  }
}

Backshift.Utilities.Consolidator = Consolidator;
export default Consolidator;