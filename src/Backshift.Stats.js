/**
 * Created by jwhite on 6/2/14.
 */

Backshift.namespace('Backshift.Stats');

Backshift.Stats = {};

Backshift.Stats.Maximum = function (array) {
  var k, max = NaN;
  for (k = array.length; k--;) {
    if (!isNaN(array[k])) {
      if (isNaN(max)) {
        max = array[k];
      } else if (array[k] > max) {
        max = array[k];
      }
    }
  }
  return max;
};

Backshift.Stats.Minimum = function (array) {
  var k, min = NaN;
  for (k = array.length; k--;) {
    if (!isNaN(array[k])) {
      if (isNaN(min)) {
        min = array[k];
      } else if (array[k] < min) {
        min = array[k];
      }
    }
  }
  return min;
};

/**
 * @param array
 * @returns number
 */
Backshift.Stats.Average = function (array) {
  if (array.length === 0) {
    return NaN;
  }
  var k, sum = 0, n = 0;
  for (k = array.length; k--;) {
    if (!isNaN(array[k])) {
      sum += array[k];
      n++;
    }
  }
  if (n < 1) {
    return NaN;
  }
  return sum / n;
};

/**
 * @param array
 * @returns number
 */
Backshift.Stats.StdDev = function (array) {
  if (array.length < 2) {
    return NaN;
  }

  // one pass calculation
  // http://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#On-line_algorithm
  var m = 0;
  var m2 = 0;
  var len = array.length;

  for (var i = 0; i < len; ++i) {
    if (isNaN(array[i])) {
      continue;
    }

    var v = array[i];
    var d = v - m;
    m += d / (i + 1);
    m2 += d * (v - m);
  }

  return Math.sqrt(m2 / (len - 1));
};

Backshift.Stats.Last = function (array) {
  var k;
  for (k = array.length; k--;) {
    if (!isNaN(array[k])) {
      return array[k];
    }
  }
  return NaN;
};

Backshift.Stats.First = function (array) {
  var k, n = array.length;
  for (k = 0; k < n; k++) {
    if (!isNaN(array[k])) {
      return array[k];
    }
  }
  return NaN;
};

/**
 * @param array
 * @returns number
 */
Backshift.Stats.Total = function (array) {
  if (array.length === 0) {
    return NaN;
  }
  var k, sum = 0;
  for (k = array.length; k--;) {
    if (!isNaN(array[k])) {
      sum += array[k];
    }
  }
  return sum;
};

Backshift.Stats.Map = {
  'max': Backshift.Stats.Maximum,
  'min': Backshift.Stats.Minimum,
  'avg': Backshift.Stats.Average,
  'stdev': Backshift.Stats.StdDev,
  'last': Backshift.Stats.Last,
  'first': Backshift.Stats.First,
  'total': Backshift.Stats.Total
};
