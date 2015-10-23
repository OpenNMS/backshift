/**
 * Created by jwhite on 6/1/14.
 */

// Addresses an issue with PhantomJS - see https://github.com/ariya/phantomjs/issues/10522
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1),
      fToBind = this,
      fNOP = function () {
      },
      fBound = function () {
        return fToBind.apply(this instanceof fNOP && oThis
            ? this
            : oThis,
          aArgs.concat(Array.prototype.slice.call(arguments)));
      };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}

/* jshint -W079 */

var Backshift = Backshift || {};

Backshift.namespace = function (ns_string) {
  var parts = ns_string.split('.'),
    parent = Backshift,
    i;

  // split redundant leading global
  if (parts[0] === 'Backshift') {
    parts = parts.slice(1);
  }

  for (i = 0; i < parts.length; i += 1) {
    // create a property if it doesn't exist
    if (typeof parent[parts[i]] === "undefined") {
      parent[parts[i]] = {};
    }
    parent = parent[parts[i]];
  }

  return parent;
};

Backshift.keys = function (obj) {
  var keys = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      keys.push(key);
    }
  }
  return keys;
};

Backshift.extend = function (destination, source) {
  for (var property in source) {
    if (source.hasOwnProperty(property)) {
      destination[property] = source[property];
    }
  }
  return destination;
};

Backshift.rows = function (matrix) {
  var ncols = matrix.length;
  if (ncols === 0) {
    return [];
  }
  var nrows = matrix[0].length;

  var rows = new Array(nrows);
  for (var i = 0; i < nrows; i++) {
    var row = new Array(ncols);
    for (var j = 0; j < ncols; j++) {
      row[j] = matrix[j][i];
    }
    rows[i] = row;
  }

  return rows;
};

Backshift.fail = function (msg) {
  console.log("Error: " + msg);
  throw "Error: " + msg;
};

Backshift.clone = function (obj) {
  return JSON.parse(JSON.stringify(obj));
};

/* Adapted from https://github.com/Jakobo/PTClass */

/*
 Copyright (c) 2005-2010 Sam Stephenson

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */
/* Based on Alex Arnell's inheritance implementation. */
/** section: Language
 * class Class
 *
 *  Manages Prototype's class-based OOP system.
 *
 *  Refer to Prototype's web site for a [tutorial on classes and
 *  inheritance](http://prototypejs.org/learn/class-inheritance).
 **/
(function (globalContext) {
  /* ------------------------------------ */
  /* Import from object.js                */
  /* ------------------------------------ */
  var _toString = Object.prototype.toString,
    NULL_TYPE = 'Null',
    UNDEFINED_TYPE = 'Undefined',
    BOOLEAN_TYPE = 'Boolean',
    NUMBER_TYPE = 'Number',
    STRING_TYPE = 'String',
    OBJECT_TYPE = 'Object',
    FUNCTION_CLASS = '[object Function]';

  function isFunction(object) {
    return _toString.call(object) === FUNCTION_CLASS;
  }

  function extend(destination, source) {
    for (var property in source) if (source.hasOwnProperty(property)) // modify protect primitive slaughter
      destination[property] = source[property];
    return destination;
  }

  function keys(object) {
    //if (Type(object) !== OBJECT_TYPE) { throw new TypeError(); }
    var results = [];
    for (var property in object) {
      if (object.hasOwnProperty(property)) {
        results.push(property);
      }
    }
    return results;
  }

  function Type(o) {
    switch (o) {
      case null:
        return NULL_TYPE;
      case (void 0):
        return UNDEFINED_TYPE;
    }
    var type = typeof o;
    switch (type) {
      case 'boolean':
        return BOOLEAN_TYPE;
      case 'number':
        return NUMBER_TYPE;
      case 'string':
        return STRING_TYPE;
    }
    return OBJECT_TYPE;
  }

  function isUndefined(object) {
    return typeof object === "undefined";
  }

  /* ------------------------------------ */
  /* Import from Function.js              */
  /* ------------------------------------ */
  var slice = Array.prototype.slice;

  function argumentNames(fn) {
    var names = fn.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
      .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
      .replace(/\s+/g, '').split(',');
    return names.length == 1 && !names[0] ? [] : names;
  }

  function wrap(fn, wrapper) {
    var __method = fn;
    return function () {
      var a = update([bind(__method, this)], arguments);
      return wrapper.apply(this, a);
    }
  }

  function update(array, args) {
    var arrayLength = array.length, length = args.length;
    while (length--) array[arrayLength + length] = args[length];
    return array;
  }

  function merge(array, args) {
    array = slice.call(array, 0);
    return update(array, args);
  }

  function bind(fn, context) {
    if (arguments.length < 2 && isUndefined(arguments[0])) return this;
    var __method = fn, args = slice.call(arguments, 2);
    return function () {
      var a = merge(args, arguments);
      return __method.apply(context, a);
    }
  }

  /* ------------------------------------ */
  /* Import from Prototype.js             */
  /* ------------------------------------ */
  var emptyFunction = function () {
  };

  var Class = (function () {

    // Some versions of JScript fail to enumerate over properties, names of which
    // correspond to non-enumerable properties in the prototype chain
    var IS_DONTENUM_BUGGY = (function () {
      for (var p in {toString: 1}) {
        // check actual property name, so that it works with augmented Object.prototype
        if (p === 'toString') return false;
      }
      return true;
    })();

    function subclass() {
    };
    function create() {
      var parent = null, properties = [].slice.apply(arguments);
      if (isFunction(properties[0]))
        parent = properties.shift();

      function klass() {
        this.initialize.apply(this, arguments);
      }

      extend(klass, Class.Methods);
      klass.superclass = parent;
      klass.subclasses = [];

      if (parent) {
        subclass.prototype = parent.prototype;
        klass.prototype = new subclass;
        try {
          parent.subclasses.push(klass)
        } catch (e) {
        }
      }

      for (var i = 0, length = properties.length; i < length; i++)
        klass.addMethods(properties[i]);

      if (!klass.prototype.initialize)
        klass.prototype.initialize = emptyFunction;

      klass.prototype.constructor = klass;
      return klass;
    }

    function addMethods(source) {
      var ancestor = this.superclass && this.superclass.prototype,
        properties = keys(source);

      // IE6 doesn't enumerate `toString` and `valueOf` (among other built-in `Object.prototype`) properties,
      // Force copy if they're not Object.prototype ones.
      // Do not copy other Object.prototype.* for performance reasons
      if (IS_DONTENUM_BUGGY) {
        if (source.toString != Object.prototype.toString)
          properties.push("toString");
        if (source.valueOf != Object.prototype.valueOf)
          properties.push("valueOf");
      }

      for (var i = 0, length = properties.length; i < length; i++) {
        var property = properties[i], value = source[property];
        if (ancestor && isFunction(value) &&
          argumentNames(value)[0] == "$super") {
          var method = value;
          value = wrap((function (m) {
            return function () {
              return ancestor[m].apply(this, arguments);
            };
          })(property), method);

          value.valueOf = bind(method.valueOf, method);
          value.toString = bind(method.toString, method);
        }
        this.prototype[property] = value;
      }

      return this;
    }

    return {
      create: create,
      Methods: {
        addMethods: addMethods
      }
    };
  })();

  if (globalContext.exports) {
    globalContext.exports.Class = Class;
  }
  else {
    globalContext.Class = Class;
  }
})(Backshift);
/**
 * Created by jwhite on 5/23/14.
 */

Backshift.namespace('Backshift.Class.Configurable');

Backshift.Class.Configurable = Backshift.Class.create({
  configure: function (args) {
    args = args || {};

    Backshift.keys(this.defaults()).forEach(function (key) {
      if (!args.hasOwnProperty(key)) {
        this[key] = this[key] || this.defaults()[key];
        return;
      }

      if (this.defaults()[key] !== null && typeof this.defaults()[key] == 'object') {

        Backshift.keys(this.defaults()[key]).forEach(function (k) {

          this[key][k] =
            args[key][k] !== undefined ? args[key][k] :
              this[key][k] !== undefined ? this[key][k] :
                this.defaults()[key][k];
        }, this);

      } else {
        this[key] =
          args[key] !== undefined ? args[key] :
            this[key] !== undefined ? this[key] :
              this.defaults()[key];
      }

    }, this);
  }
});

/**
 * Created by jwhite on 5/25/14.
 */

Backshift.namespace('Backshift.Math');

Backshift.Math = {};

/**
 * Compute the least common multiple of an integer array.
 *
 * Shamelessly stolen from http://rosettacode.org/wiki/Least_common_multiple#JavaScript
 *
 * @param A an array of integers
 * @returns {number} the lcm
 */
Backshift.Math.lcm = function (A) {
  if (A === undefined || A.length < 1) {
    return 0;
  }
  var n = A.length, a = Math.abs(A[0]);
  for (var i = 1; i < n; i++) {
    var b = Math.abs(A[i]), c = a;
    while (a && b) {
      a > b ? a %= b : b %= a;
    }
    a = Math.abs(c * A[i]) / (a + b);
  }
  return a;
};

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

Backshift.namespace('Backshift.Utilities.Url');

Backshift.Utilities.Url = Backshift.Class.create({
  initialize: function (baseUrl) {
    this.url = baseUrl;
    this.paramCount = 0;
  },
  andParam: function (kw, parameter) {
    var sep = this.paramCount > 0 ? "&" : "?";

    if (parameter !== undefined) {
      this.paramCount += 1;
      this.url = this.url + sep + kw + "=" + parameter;
    }

    return this;
  },
  toString: function () {
    return this.url;
  }
});

Backshift.namespace('Backshift.Utilities.RpnToJexlConverter');

/**
 * References:
 *   http://oss.oetiker.ch/rrdtool/doc/rrdgraph_rpn.en.html
 *   http://commons.apache.org/proper/commons-jexl/reference/syntax.html
 *
 * @author jesse
 */
Backshift.Utilities.RpnToJexlConverter = Backshift.Class.create({
  initialize: function () {
    this.operators = {};
    this._buildOperators();
  },

  _buildOperators: function () {
    var simpleOp = function (op) {
      return function (stack) {
        var b = stack.pop();
        var a = stack.pop();
        return "(" + a + " " + op + " " + b + ")";
      };
    };

    var funcOp = function (op, numArgs) {
      return function (stack) {
        var i, ret = op + "(";
        for (i=0; i < numArgs; i++) {
          ret += stack.pop() + ',';
        }
        return ret.substring(0, ret.length - 1) + ')';
      };
    };

    var ifOp = function (stack) {
      var c = stack.pop();
      var b = stack.pop();
      var a = stack.pop();
      return "(" + a + " != 0 ? " + b + " : " + c + ")";
    };

    var unOp = function (stack) {
      var a = stack.pop();
      return "( (" + a + " == NaN) ? 1 : 0)";
    };

    var infOp = function (stack) {
      var a = stack.pop();
      return "( (" + a + " == __inf) || (" + a + " == __neg_inf) ? 1 : 0)";
    };

    var booleanOp = function (op) {
      return function (stack) {
        var b = stack.pop();
        var a = stack.pop();
        return "(" + a + " " + op + " " + b + " ? 1 : 0)";
      };
    };

    var limitOp = function (stack) {
      var max = stack.pop();
      var min = stack.pop();
      var val = stack.pop();
      return "( " +
        "( " +
          "(" + min + " == __inf) || (" + min + " == __neg_inf) " +
          "|| (" + max + " == __inf) || (" + max + " == __neg_inf) " +
          "|| (" + val + " == __inf) || (" + val + " == __neg_inf) " +
          "|| (" + val + " < " + min + ") " +
          "|| (" + val + " > " + max + ") " +
        ") ? NaN : " + val + " " +
      ")";
    };

    var minMaxNanOp = function(op) {
      return function (stack) {
        var b = stack.pop();
        var a = stack.pop();
        return "( " +
          "( " + a + " == NaN ) ? " + b + " : ( " +
            "( " + b + " == NaN ) ? " + a + " : ( " +
              op + "(" + b + "," + a + ") " +
            ") " +
          ") " +
        ")";
      }
    };

    var addNanOp = function (stack) {
      var b = stack.pop();
      var a = stack.pop();
      return "( " +
        "( " +
          "( " + a + " == NaN ) && " +
          "( " + b + " == NaN ) " +
        ") ? NaN : ( " +
          "( " + a + " == NaN ) ? " + b + " : ( " +
            "( " + b + " == NaN ) ? " + a + " : ( " + a + " + " + b + " ) " +
          ") " +
        ") " +
      ")";
    };

    var atan2Op = function (stack) {
      var x = stack.pop();
      var y = stack.pop();
      return "math:atan2(" + y + "," + x + ")";
    };

    this.operators['+'] = simpleOp('+');
    this.operators['-'] = simpleOp('-');
    this.operators['*'] = simpleOp('*');
    this.operators['/'] = simpleOp('/');
    this.operators['%'] = simpleOp('%');
    this.operators['IF'] = ifOp;
    this.operators['UN'] = unOp;
    this.operators['LT'] = booleanOp('<');
    this.operators['LE'] = booleanOp('<=');
    this.operators['GT'] = booleanOp('>');
    this.operators['GE'] = booleanOp('>=');
    this.operators['EQ'] = booleanOp('==');
    this.operators['NE'] = booleanOp('!=');
    this.operators['MIN'] = funcOp('math:min', 2);
    this.operators['MAX'] = funcOp('math:max', 2);
    this.operators['MINNAN'] = minMaxNanOp('math:min');
    this.operators['MAXNAN'] = minMaxNanOp('math:max');
    this.operators['ISINF'] = infOp;
    this.operators['LIMIT'] = limitOp;
    this.operators['ADDNAN'] = addNanOp;
    this.operators['SIN'] = funcOp('math:sin', 1);
    this.operators['COS'] = funcOp('math:cos', 1);
    this.operators['LOG'] = funcOp('math:log', 1);
    this.operators['EXP'] = funcOp('math:exp', 1);
    this.operators['SQRT'] = funcOp('math:sqrt', 1);
    this.operators['ATAN'] = funcOp('math:atan', 1);
    this.operators['ATAN2'] = atan2Op;
    this.operators['FLOOR'] = funcOp('math:floor', 1);
    this.operators['CEIL'] = funcOp('math:ceil', 1);
    this.operators['RAD2DEG'] = funcOp('math:toDegrees', 1);
    this.operators['DEG2RAD'] = funcOp('math:toRadians', 1);
    this.operators['ABS'] = funcOp('math:abs', 1);
    this.operators['UNKN'] = function() { return 'NaN'; };
    this.operators['INF'] = function() { return '__inf'; };
    this.operators['NEGINF'] = function() { return '__neg_inf'; };

  },

  convert: function (rpn) {
    var token, tokens, n, i, stack = [];
    tokens = rpn.split(",");
    n = tokens.length;
    for (i = 0; i < n; i++) {
      token = tokens[i];
      if (this._isOperator(token)) {
        stack.push(this._toExpression(token, stack));
      } else {
        stack.push(token);
      }
    }

    if (stack.length === 1) {
      return stack.pop();
    } else {
      Backshift.fail('Too many input values in RPN express. RPN: ' + rpn + ' Stack: ' + JSON.stringify(stack));
    }
  },

  _isOperator: function (token) {
    return token in this.operators;
  },

  _toExpression: function (token, stack) {
    return this.operators[token](stack);
  }

});

Backshift.namespace('Backshift.Utilities.RrdGraphConverter');

Backshift.Utilities.RrdGraphVisitor = Backshift.Class.create({
  initialize: function (args) {
    this.onInit(args);
  },

  onInit: function (args) {
    // Defined by subclasses
  },

  _visit: function (graphDef) {
    // Inspired from http://krasimirtsonev.com/blog/article/Simple-command-line-parser-in-JavaScript
    var CommandLineParser = (function () {
      var parse = function (str, lookForQuotes) {
        var args = [];
        var readingPart = false;
        var part = '';
        var n = str.length;
        for (var i = 0; i < n; i++) {
          if (str.charAt(i) === ' ' && !readingPart) {
            args.push(part);
            part = '';
          } else {
            if (str.charAt(i) === '\"' && lookForQuotes) {
              readingPart = !readingPart;
              part += str.charAt(i);
            } else {
              part += str.charAt(i);
            }
          }
        }
        args.push(part);
        return args;
      };
      return {
        parse: parse
      }
    })();

    var i, args, command, name, path, dsName, consolFun, rpnExpression, subParts, width, srcName,
        color, legend, aggregation, value, seriesName;
    var parts = CommandLineParser.parse(graphDef.command, true);
    var n = parts.length;
    for (i = 0; i < n; i++) {
      if (parts[i].indexOf("--") === 0) {
        args = /--(.*)=(.*)/.exec(parts[i]);
        if (args === null) {
          continue;
        }

        if (args[1] === "title") {
          this._onTitle(this.displayString(this._decodeString(args[2])));
        } else if (args[1] === "vertical-label") {
          this._onVerticalLabel(this.displayString(this._decodeString(args[2])));
        }
      }

      args = parts[i].match(/(\\.|[^:])+/g);
      if (args === null) {
        continue;
      }
      command = args[0];

      if (command === "DEF") {
        subParts = args[1].split("=");
        name = subParts[0];
        path = subParts[1];
        dsName = args[2];
        consolFun = args[3];
        this._onDEF(name, path, dsName, consolFun);
      } else if (command === "CDEF") {
        subParts = args[1].split("=");
        name = subParts[0];
        rpnExpression = subParts[1];
        this._onCDEF(name, rpnExpression);
      } else if (command.match(/LINE/)) {
        width = parseInt(/LINE(\d+)/.exec(command));
        subParts = args[1].split("#");
        srcName = subParts[0];
        color = '#' + subParts[1];
        legend = this._decodeString(args[2]);
        this._onLine(srcName, color, legend, width);
      } else if (command === "AREA") {
        subParts = args[1].split("#");
        srcName = subParts[0];
        color = '#' + subParts[1];
        legend = this._decodeString(args[2]);
        this._onArea(srcName, color, legend);
      } else if (command === "STACK") {
        subParts = args[1].split("#");
        srcName = subParts[0];
        color = '#' + subParts[1];
        legend = this._decodeString(args[2]);
        this._onStack(srcName, color, legend);
      } else if (command === "GPRINT") {
        srcName = args[1];
        aggregation = args[2];
        value = this._decodeString(args[3]);
        this._onGPrint(srcName, aggregation, value);
      } else if (command === "COMMENT") {
        value = this._decodeString(args[1]);
        this._onComment(value);
      }
    }
  },
  _onTitle: function (title) {

  },
  _onVerticalLabel: function (label) {

  },
  _onDEF: function (name, path, dsName, consolFun) {

  },
  _onCDEF: function (name, rpnExpression) {

  },
  _onLine: function (srcName, color, legend, width) {

  },
  _onArea: function (srcName, color, legend) {

  },
  _onStack: function (srcName, color, legend) {

  },
  _onGPrint: function (srcName, aggregation, value) {

  },
  _onComment: function (value) {

  },
  _seriesName: function(string) {

  },
  _decodeString: function (string) {
    if (string === undefined) {
      return string;
    }

    // Remove any quotes
    string = string.replace(/"/g, '');
    // Replace escaped colons
    string = string.replace("\\:", ':');

    return string;
  },
  displayString: function (string) {
    if (string === undefined) {
      return string;
    }

    // Remove any newlines
    string = string.replace("\\n", '');
    // Remove any leading/trailing whitespace
    string = string.trim();
    return string;
  }
});

Backshift.namespace('Backshift.Utilities.RrdGraphConverter');

Backshift.Utilities.RrdGraphConverter = Backshift.Class.create(Backshift.Utilities.RrdGraphVisitor, {

  onInit: function (args) {
    this.graphDef = args.graphDef;
    this.resourceId = args.resourceId;

    this.model = {
      metrics: [],
      series: [],
      printStatements: []
    };

    this.rpnConverter = new Backshift.Utilities.RpnToJexlConverter();

    // Replace strings.properties tokens
    var propertyValue, i, j, n, m, metric;
    for (i = 0, n = this.graphDef.propertiesValues.length; i < n; i++) {
      propertyValue = this.graphDef.propertiesValues[i];
      var re = new RegExp("\\{" + propertyValue + "}", "g");
      this.graphDef.command = this.graphDef.command.replace(re, propertyValue);
    }

    this._visit(this.graphDef);

    for (i = 0, n = this.model.printStatements.length; i < n; i++) {
      metric = this.model.printStatements[i].metric;
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
    var series = {
      name: this.displayString(legend),
      metric: srcName,
      type: "line",
      color: color
    };
    this.maybeAddPrintStatementForSeries(series.metric, legend);
    this.model.series.push(series);
  },

  _onArea: function (srcName, color, legend) {
    var series = {
      name: this.displayString(legend),
      metric: srcName,
      type: "area",
      color: color
    };
    this.maybeAddPrintStatementForSeries(series.metric, legend);
    this.model.series.push(series);
  },

  _onStack: function (srcName, color, legend) {
    var series = {
      name: this.displayString(legend),
      metric: srcName,
      type: "stack",
      color: color,
      legend: legend
    };
    this.maybeAddPrintStatementForSeries(series.metric, legend);
    this.model.series.push(series);
  },

  _onGPrint: function (srcName, aggregation, value) {
    this.model.printStatements.push({
      metric: srcName,
      aggregation: aggregation,
      value: value
    });
  },

  _onComment: function (value) {
    this.model.printStatements.push({
      value: value
    });
  },

  maybeAddPrintStatementForSeries: function(metric, legend) {
    if (legend === undefined || legend === null || legend === "") {
      return;
    }

    this.model.printStatements.push({
      metric: metric,
      value: "%g " + legend
    });
 }
});

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

    this.series = args.series;

    this.printStatements = args.printStatements;

    this.configure(args);

    if (this.start === 0 && this.end === 0 && this.last === 0) {
      Backshift.fail('Graph needs start and end, or last to be non-zero.');
    }

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
  },

  cancel: function () {
    this.destroyTimer();
    this.onCancel();
  },

  resize: function(size) {
    // Implemented by subclasses
  },

  destroy: function() {
    this.destroyTimer();
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
    var timeSpan = this.getTimeSpan();
    this.queryInProgress = true;
    this.onBeforeQuery();
    this.dataSource.query(timeSpan.start, timeSpan.end, this.getResolution()).then(function (results) {
      self.queryInProgress = false;
      self.lastSuccessfulQuery = Date.now();
      self.onQuerySuccess(results);
      self.onAfterQuery();
    }, function (reason) {
      self.queryInProgress = false;
      self.onQueryFailed(reason);
      self.onAfterQuery();
    })
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
  }
});

/**
 * Created by jwhite on 5/23/14.
 */

Backshift.namespace('Backshift.Graph.Matrix');

/** Draws a table with all of the sources values. */
Backshift.Graph.Matrix = Backshift.Class.create(Backshift.Graph, {

  onInit: function () {
    // Used to hold a reference to the div that holds the status text
    this.statusBlock = null;
  },

  onBeforeQuery: function () {
    this.timeBeforeQuery = Date.now();
    this.updateStatus("Querying...");
  },

  onQuerySuccess: function (results) {
    this.drawMatrix(results);
    var timeAfterQuery = Date.now();
    var queryDuration = Number((timeAfterQuery - this.timeBeforeQuery) / 1000).toFixed(2);
    this.updateStatus("Successfully retrieved data in " + queryDuration + " seconds.");
  },

  onQueryFailed: function () {
    this.updateStatus("Query failed.");
  },

  updateStatus: function (status) {
    if (this.statusBlock) {
      this.statusBlock.text(status);
    } else {
      this.statusBlock = d3.select(this.element).append("p").attr("align", "right").text(status);
    }
  },

  drawMatrix: function (results) {
    var numRows = results.columns[0].length,
      numColumns = results.columnNames.length,
      rows = new Array(numRows),
      i,
      k;

    /* Format the columns into rows of the form:
      [
        {
          'timestamp': 100,
          'metric1': 1,
          'metric2': 2
        },
      ]
     */
    for (i = 0; i < numRows; i++) {
      rows[i] = {};
      for (k = 0; k < numColumns; k++) {
        rows[i][results.columnNames[k]] = results.columns[k][i];
      }
    }

    // Retrieve the current status, if present
    var status = "";
    if (this.statusBlock) {
      status = this.statusBlock.text();
    }

    // Empty the div
    d3.select(this.element).selectAll("*").remove();

    // Re-append the status
    this.statusBlock = d3.select(this.element).append("p").attr("align", "right").text(status);

    // Draw the table
    this.tabulate(this.element, rows, results.columnNames);

    // Add some meta-data to the div
    d3.select(this.element)
      .attr("data-results", JSON.stringify(results));

    d3.select(this.element)
      .attr("data-rendered-at", Date.now());
  },

  /** Builds an HTML table using D3.
   *
   *  Shamelessly stolen from http://www.d3noob.org/2013/02/add-html-table-to-your-d3js-graph.html */
  tabulate: function (element, data, columns) {
    var table = d3.select(element).append("table")
        .attr("style", "font-size: 10px"),
      thead = table.append("thead"),
      tbody = table.append("tbody");

    // Append the header row
    thead.append("tr")
      .selectAll("th")
      .data(columns)
      .enter()
      .append("th")
      .text(function (column) {
        return column;
      });

    // Create a row for each object in the data
    var rows = tbody.selectAll("tr")
      .data(data)
      .enter()
      .append("tr");

    // Create a cell in each row for each column
    rows.selectAll("td")
      .data(function (row) {
        return columns.map(function (column) {
          return {column: column, value: row[column]};
        });
      })
      .enter()
      .append("td")
      .attr("style", "font-family: Courier; padding:0 15px 0 15px;")
      .attr("align", "center")
      .html(function (d) {
        return Number(d.value).toFixed(4);
      });

    return table;
  }
});

/**
 * Created by jwhite on 10/12/14.
 */

Backshift.namespace('Backshift.Graph.Flot');

/** Renders the graoh using Flot */
Backshift.Graph.Flot = Backshift.Class.create(Backshift.Graph, {

  defaults: function ($super) {
    return Backshift.extend($super(), {
      width: '100%',
      height: '100%',
      title: undefined,
      verticalLabel: undefined,
      zoom: true // whether to allow zooming
    });
  },

  onInit: function () {
    var container = $(this.element);
    // Set the container dimensions, Flot's canvas will use 100% of the container div
    container.width(this.width);
    container.height(this.height);
    // Used to hold a reference to the div that holds the status text
    this.statusBlock = null;
  },


  onBeforeQuery: function () {
    this.updateStatus("Loading...");
  },

  updateStatus: function (status) {
    if (this.statusBlock) {
      this.statusBlock.text(status);
    } else {
      this.statusBlock = d3.select(this.element).append("h3").attr("align", "center").text(status);
    }
  },

  onQueryFailed: function () {
    this.updateStatus("Query failed.");
  },

  onQuerySuccess: function (results) {
    this.drawChart(results);
  },

  _shouldStack: function (k) {
    // If there's stack following the area, set the area to stack
    if (this.series[k].type === "area") {
      var n = this.series.length;
      for (var i = k; i < n; i++) {
        if (this.series[i].type === "stack") {
          return 1;
        }
      }
    }
    return this.series[k].type === "stack";
  },

  drawChart: function (results) {
    var self = this;
    var container = $(this.element);

    var timestamps = results.columns[0];
    var series, values, i, j, numSeries, numValues, X, Y, columnName, shouldStack, shouldFill, seriesValues, shouldShow;
    numSeries = this.series.length;
    numValues = timestamps.length;

    var from = timestamps[0];
    var to = timestamps[timestamps.length - 1];

    this.flotSeries = [];
    this.hiddenFlotSeries = [];

    var lastSeriesToStackWith = null;

    // Build the columns for the series
    for (i = 0; i < numSeries; i++) {
      columnName = "data" + i;
      series = this.series[i];
      values = results.columns[results.columnNameToIndex[series.metric]];

      shouldStack = this._shouldStack(i);
      shouldFill = this.series[i].type === "stack" || this.series[i].type === "area";
      shouldShow = this.series[i].type !== "hidden";

      seriesValues = [];
      for (j = 0; j < numValues; j++) {
        var yOffset = 0;
        if (shouldStack && lastSeriesToStackWith != null) {
          yOffset = lastSeriesToStackWith.data[j][1];
        }
        var yVal = values[j] + yOffset;

        seriesValues.push([timestamps[j], yVal, yOffset]);
      }

      var flotSeries = {
        label: series.name,
        color: series.color,
        lines: {
          show: true,
          fill: shouldFill,
          fillColor: series.color
        },
        data: seriesValues,
        id: columnName,
        metric: series.metric
      };

      if (shouldShow) {
        this.flotSeries.push(flotSeries);

        if (shouldStack) {
          lastSeriesToStackWith = flotSeries;
        }
      } else {
        this.hiddenFlotSeries.push(flotSeries);
      }
    }

    var options = {
      canvas: true,
      title: self.title,
      axisLabels: {
        show: true
      },
      hooks: {
        draw: [self.drawHook]
      },
      series: {
        lines:  {
          zero: false
        },
        bars:   {
          fill: 1,
          barWidth: 1,
          zero: false,
          lineWidth: 0
        },
        points: {
          fill: 1,
          fillColor: false
        },
        shadowSize: 1
      },
      yaxis: {
        tickFormatter: d3.format(".2s")
      },
      yaxes: [{
        position: 'left',
        axisLabel: self.verticalLabel,
        axisLabelUseHtml: false,
        axisLabelUseCanvas: true
      }],
      xaxis: { },
      grid: {
        minBorderMargin: 0,
        markings: [],
        backgroundColor: null,
        borderWidth: 0,
        hoverable: true,
        color: '#c8c8c8',
        margin: { left: 0, right: 0, top: 25, bottom: 0 }
      },
      selection: {
        mode: "x",
        color: '#666'
      },
      legend: {
        show: false,
        statements: self.printStatements
      },
      hiddenSeries: this.hiddenFlotSeries,
      tooltip: {
        show: true
      }
    };

    this.addTimeAxis(options, from, to);

    $.plot(container, this.flotSeries, options);
  },

  drawHook: function(plot, canvascontext) {
    var cx = canvascontext.canvas.clientWidth / 2;
    canvascontext.font="15px sans-serif";
    canvascontext.textAlign = 'center';
    canvascontext.fillText(plot.getOptions().title, cx, 15);
  },

  addTimeAxis: function(options, from, to) {
    var elem = $(this.element);
    var ticks = elem.width() / 100;

    options.xaxis = {
      mode: "time",
      min: from,
      max: to,
      label: "Datetime",
      ticks: ticks,
      timeformat: this.time_format(ticks, from, to)
    };
  },

  time_format: function(ticks, min, max) {
    if (min && max && ticks) {
      var secPerTick = ((max - min) / ticks) / 1000;

      if (secPerTick <= 45) {
        return "%H:%M:%S";
      }
      if (secPerTick <= 7200) {
        return "%H:%M";
      }
      if (secPerTick <= 80000) {
        return "%m/%d %H:%M";
      }
      if (secPerTick <= 2419200) {
        return "%m/%d";
      }
      return "%Y-%m";
    }

    return "%H:%M";
  }
});

/**
 * Created by jwhite on 31/03/15.
 */

Backshift.namespace('Backshift.Graph.C3');

/**
 * Current issues:
 *   - Can't tell the difference between 0 and NaN without mouseover - use regions to identify these?
 *
 * Features to add:
 *   - Improved X-axis legend - the format should depend on the time-span
 *   - Add support for retrieving min/max and average values
 *   - Identify outages with regions: http://c3js.org/samples/region_timeseries.html
 *   - Identify events with grid lines: http://c3js.org/samples/grid_x_lines.html
 *
 * Notes:
 *   - Opacity for the area can be set with:
 *     .c3-area {
 *          stroke-width: 0;
 *          opacity: 1.0;
 *      }
 *
 */

/** A graph implementation that uses C3 */
Backshift.Graph.C3 = Backshift.Class.create(Backshift.Graph, {

  defaults: function ($super) {
    return Backshift.extend($super(), {
      width: undefined,
      height: undefined,
      title: undefined,
      verticalLabel: undefined,
      clipboardData: undefined,
      exportIconSizeRatio: 0.05, // relative size in pixels of "Export to CSV" icon - set to 0 to disable
      interactive: true, // whether to do fancier chart navigation with mouse input events
      step: false, // treats points a segments (similar to rrdgraph)
      zoom: true, // whether to allow zooming
    });
  },

  onInit: function () {
    this.columns = [];
    this.groups = [];
    this.colorMap = {};
    this.typeMap = {};
    this.nameMap = {};
    this.chartMessage = "Loading...";

    this.clipboardPrimed = false;
    // Only add the event listener if the export icon is enabled
    if (this.exportIconSizeRatio > 0) {
      document.addEventListener('copy', this._onClipboardCopy);
    }

    this.chart = null;
  },

  resize: function(size) {
    // Store the width/height for any subsequent renders
    this.width = size.width;
    this.height = size.height;
    // If we have a chart, resize it
    if (this.chart !== null) {
      this.chart.resize(size);
    }
  },

  destroy: function($super) {
    $super();
    // If we have a chart, destroy it
    if (this.chart !== null) {
      this.chart = this.chart.destroy();
    }
  },

  onRender: function () {
    this._updatePlot();
  },

  _shouldStack: function (k) {
    // If there's stack following the area, set the area to stack
    if (this.series[k].type === "area") {
      var n = this.series.length;
      for (var i = k; i < n; i++) {
        if (this.series[i].type === "stack") {
          return 1;
        }
      }
    }
    return this.series[k].type === "stack";
  },

  _getDisplayName: function (name) {
    if (name === undefined || name === null) {
      return null;
    } else {
      return name;
    }
  },

  _getType: function (type, shouldStack) {
    var derivedType;
    if (shouldStack === true) {
      derivedType = "area";
    } else {
      derivedType = type;
    }

    if (this.step) {
      if (derivedType === "line") {
        derivedType = "step";
      }
      else if (derivedType === "area") {
        derivedType = "area-step";
      }
    }
    return derivedType;
  },

  onQuerySuccess: function (results) {
    var timestamps = results.columns[0];
    var series, values, i, j, numSeries, numValues, X, Y, columnName, shouldStack;
    numSeries = this.series.length;
    numValues = timestamps.length;

    // Reset the array of columns
    this.columns = [];

    // Build the timestamp column
    X = ['timestamp'];
    for (i = 0; i < numValues; i++) {
      X.push(timestamps[i]);
    }
    this.columns[0] = X;

    // Build a single group for the stacked elements
    var group = [];
    this.groups = [group];

    // Build the columns for the series
    for (i = 0; i < numSeries; i++) {
      columnName = "data" + i;
      series = this.series[i];
      values = results.columns[results.columnNameToIndex[series.metric]];

      Y = [columnName];

      for (j = 0; j < numValues; j++) {
        Y.push(values[j]);
      }

      this.columns[i + 1] = Y;

      this.colorMap[columnName] = series.color;
      this.nameMap[columnName] = this._getDisplayName(series.name);

      // Determine if this series should be stacked
      shouldStack = this._shouldStack(i);

      // If so, then add it to the group
      if (shouldStack) {
        group.push(columnName);
      }

      this.typeMap[columnName] = this._getType(series.type, shouldStack);
    }

    this.chartMessage = null;
    this._updatePlot();
  },

  onQueryFailed: function($super, reason) {
    $super(reason);
    this.chartMessage = "Query failed.";
  },

  _onToggleCsvExport: function(el) {
    var iconColor = "black";
    if (this.clipboardPrimed) {
      window.backshift_c3_clipboard = undefined;
      this.clipboardPrimed = false;
    } else {
      iconColor = "green";
      var i, j, csv  = "";
      var numColumns = this.columns.length;
      var numRows = numColumns > 0 ? this.columns[0].length - 1 : 0;

      for (i = 0; i < numColumns; i++) {
        if (i == 0) {
          csv = "Timestamp";
        } else {
          csv += "," + this.nameMap[this.columns[i][0]];
        }
      }

      for (i = 1; i <= numRows; i++) {
        csv += "\n";
        for (j = 0; j < numColumns; j++) {
          if (j > 0) {
            csv += ",";
          }
          csv += this.columns[j][i];
        }
      }
      window.backshift_c3_clipboard = csv;
      this.clipboardPrimed = true;
    }
    d3.select(el).style("fill", iconColor);
  },

  _onClipboardCopy: function(e) {
    if (window.backshift_c3_clipboard === undefined) {
      return;
    }
    var isIe = (navigator.userAgent.toLowerCase().indexOf("msie") != -1
           || navigator.userAgent.toLowerCase().indexOf("trident") != -1);
    if (isIe) {
      window.clipboardData.setData('Text', window.backshift_c3_clipboard);
    } else {
      e.clipboardData.setData('text/plain', window.backshift_c3_clipboard);
    }
    e.preventDefault();
  },

  _onRendered: function() {
    var self = this;
    var svg = d3.select(this.element).select("svg");
    var boundingRect = svg.node().getBoundingClientRect();

    svg.select("#chart-title").remove();
    if (this.chartMessage !== null) {
      svg.append('text')
        .attr("id", "chart-title")
        .attr('x', boundingRect.width / 2)
        .attr('y', boundingRect.height / 2.5)
        .attr('text-anchor', 'middle')
        .style('font-size', '2.5em')
        .text(this.chartMessage);
    }

    svg.select("#export-to-csv").remove();
    if (this.columns.length > 0 && this.exportIconSizeRatio > 0) {
      var sizeInPixels = Math.min(boundingRect.width, boundingRect.height) * this.exportIconSizeRatio;
      svg.append('text')
        .attr("id", "export-to-csv")
        .attr('x', boundingRect.width - sizeInPixels)
        .attr('y', sizeInPixels)
        .attr('font-family', 'FontAwesome')
        .attr('font-size', function(d) { return sizeInPixels + 'px'} )
        .text(function(d) { return '\uf0ce' })
        .on("click", function() { return self._onToggleCsvExport(this, self); });
    }
  },

  _updatePlot: function () {
    var self = this;

    var plotConfig = {
      bindto: d3.select(this.element),
      interaction: {
        enabled: this.interactive
      },
      data: {
        x: 'timestamp',
        columns: this.columns,
        types: this.typeMap,
        names: this.nameMap,
        colors: this.colorMap,
        groups: this.groups,
        order: null // stack order by data definition
      },
      size: {
        width: this.width,
        height: this.height
      },
      axis: {
        x: {
          type: 'timeseries',
          tick: {
          }
        },
        y: {
          label: self.verticalLabel,
          tick: {
            format: d3.format(".2s")
          }
        }
      },
      grid: {
        x: {
          show: true
        },
        y: {
          show: true
        }
      },
      transition: {
        duration: 0
      },
      point: {
        show: false
      },
      zoom: {
        enabled: this.zoom
      },
      onrendered: function () {
        self._onRendered()
      },
      title: {
        text: this.title
      },
      tooltip: {
        format: {
          title: function (d) { return d; },
          value: function (value, ratio, id) {
            return d3.format(".4s")(value);
          }
        }
      }
    };

    if (self.columns && self.columns.length > 0) {
      plotConfig.axis.x.tick.count = 30;

      var timestamps = self.columns[0];
      if (timestamps && timestamps.length >= 2) {
        // timestamp,value,...
        var oldest = timestamps[1];
        var newest = timestamps[timestamps.length - 1];
        var difference = newest - oldest;

        if (difference < 90000000) {
          // less than about a day - 14:01
          plotConfig.axis.x.tick.format = '%H:%M';
          plotConfig.axis.x.tick.count = 24;
        } else if (difference < 1209600000) {
          // less than 2 weeks - Tue Jul 28
          plotConfig.axis.x.tick.format = '%a %b %d';
          plotConfig.axis.x.tick.count = 14;
        } else if (difference < 7776000000) {
          // less than 90 days - Jul 28
          plotConfig.axis.x.tick.format = '%b %d';
          plotConfig.axis.x.tick.count = 30;
        } else {
          // more than 3 months - Jul 2015
          plotConfig.axis.x.tick.format = '%b %Y';
          plotConfig.axis.x.tick.count = 12;
        }
      }
    } else {
      delete plotConfig.axis.x.tick.count;
    }

    self.chart = c3.generate(plotConfig);
  }
});

/**
 * Created by jwhite on 5/23/14.
 */

Backshift.namespace('Backshift.Graph.DC');

/** Draws a table with all of the sources values. */
Backshift.Graph.DC = Backshift.Class.create(Backshift.Graph, {

  defaults: function ($super) {
    return Backshift.extend($super(), {
      width: undefined,
      height: undefined,
      title: undefined,
      verticalLabel: undefined,
      step: false, // treats points a segments (similar to rrdgraph)
      zoom: true, // whether to allow zooming
      interpolate: 'linear', // if step is false, set the line interpolation
      tension: undefined, // if step is false, set the interpolation tension
    });
  },

  onInit: function () {
    // Used to hold a reference to the div that holds the status text
    this.statusBlock = null;
    this.idPrefix = new Date().getTime() + '' + Math.floor(Math.random() * 100000);
    this.crossfilter = crossfilter([]);
    this.dateDimension = this.crossfilter.dimension(function(d) {
      return d.timestamp;
    });
    this.statusMessage = "Loading...";
    this.renderGraphs();
  },

  onQuerySuccess: function (results) {
    this.statusMessage = null;
    this.updateData(results);
  },

  onQueryFailed: function($super, reason) {
    $super(reason);
    this.statusMessage = "Query failed.";
    this.renderGraphs();
  },

  onCancel: function () {
    this.crossfilter.groupAll();
    this.crossfilter.remove();
  },

  updateData: function (results) {
    var self = this,
      numRows = results.columns[0].length,
      numColumns = results.columnNames.length,
      rows = [],
      i,
      k, row;

    for (i = 0; i < numRows; i++) {
      row = {};
      for (k = 0; k < numColumns; k++) {
        val = results.columns[k][i];
        if (k === 0) { // timestamp
          val = new Date(val);
        }
        if (val === null || val === undefined || val === 'NaN' || isNaN(val)) {
          val = NaN;
        }
        row[results.columnNames[k]] = val;
      }
      rows.push(row);
    }

    self.crossfilter.groupAll();
    self.crossfilter.remove();
    self.crossfilter.add(rows);

    var now = new Date(),
      minTime = self.dateDimension.bottom(1),
      maxTime = self.dateDimension.top(1);

    if (minTime.length === 0) {
      minTime = now;
    } else {
      minTime = minTime[0].timestamp;
    }
    if (maxTime.length === 0) {
      maxTime = now;
    } else {
      maxTime = maxTime[0].timestamp;
    }
    var difference = maxTime.getTime() - minTime.getTime();

    var xunits;
    if (difference < 90000000) {
      xunits = d3.time.hours;
    } else if (difference < 1209600000) {
      xunits = d3.time.days;
    } else if (difference < 7776000000) {
      xunits = d3.time.months;
    } else {
      xunits = d3.time.years;
    }

    if (self.chart) {
      self.chart
        .elasticX(false)
        .elasticY(true)
        .x(d3.time.scale().domain([minTime, maxTime]))
        .round(xunits.round)
        .xUnits(xunits)
        .render();
    }

    self.renderGraphs();
  },

  renderGraphs: function () {
    var self = this, i, k;

    var timeFormat = d3.time.format('%Y-%m-%d %H:%M:%S');
    var numberFormat = d3.format('.2s');

    /* make this element unique so we can refer to it when rendering */
    var dgName = self.element.getAttribute('data-graph-model');
    if (dgName === undefined) {
      dgName = self.element.getAttribute('data-graph-name');
    }
    var id = dgName + self.idPrefix;
    self.element.id = id;
    jQuery(self.element)
      .css('max-height', self.height)
      .css('max-width', self.width)
      .css('position', 'relative')
      .css('float', 'none');

    var columnGroups = [];

    var getGroup = function(columnName) {
      var reduceAdd = function(p,v) {
        if (isNaN(v[columnName])) {
          p.nanCount++;
        } else {
          p.total += v[columnName];
        }
        if (p.nanCount > 0) {
          p.value = NaN;
        } else {
          p.value = p.total;
        }
        return p;
      };

      var reduceDel = function(p,v) {
        if (isNaN(v[columnName])) {
          p.nanCount--;
        } else {
          p.total -= v[columnName];
        }
        if (p.nanCount > 0) {
          p.value = NaN;
        } else {
          p.value = p.total;
        }
        return p;
      };

      var reduceInitial = function() {
        return {nanCount:0, total:0, value:NaN};
      };
      return self.dateDimension.group().reduce(reduceAdd, reduceDel, reduceInitial);
    };

    for (i = 0; i < self.series.length; i++) {
      var columnName = self.series[i].metric;

      columnGroups[i] = getGroup(columnName);
    }

    if (self.chart) {
      self.chart.redraw();
    } else {
      var chart = dc.compositeChart('#' + id);

      var charts = [], colors = [], ser, itemCount = 0,
        accessor = function(d) {
          return d.value.value;
        },
        definedFunc = function(d) {
          return !isNaN(d.y);
        }
      ;

      for (i = 0; i < self.series.length; i++) {
        var lastChart, lastSeries, nextSeries;
        if (charts.length > 0) {
          lastChart = charts[charts.length - 1];
        }

        ser = self.series[i];
        if (i > 0) {
          lastSeries = self.series[i-1];
        }
        if (self.series[i+1]) {
          nextSeries = self.series[i+1];
        }

        var currentChart;
        if (ser.type === 'area' && ser.name === undefined && nextSeries && nextSeries.type === 'line' && ser.metric === nextSeries.metric) {
          // the measurements API defines an area graph by returning
          // 2 segments: the "area", and the "line".  dc.js will automatically
          // fill the area if we give it a line graph, so we do this to merge
          // area/line tuples into one chart definition
        } else if (ser.type === 'area') {
          itemCount++;
          if (colors.length) {
            lastChart.ordinalColors(colors);
          }
          colors = [ser.color];
          currentChart = dc.lineChart(chart)
            .renderArea(true)
            .group(columnGroups[i], ser.name)
            .valueAccessor(accessor)
            .defined(definedFunc)
            ;
          charts.push(currentChart);
        } else if (ser.type === 'line') {
          itemCount++;
          if (colors.length) {
            lastChart.ordinalColors(colors);
          }
          colors = [ser.color];
          currentChart = dc.lineChart(chart)
            .group(columnGroups[i], ser.name)
            .valueAccessor(accessor)
            .defined(definedFunc)
            ;
          if (lastSeries && lastSeries.type === 'area' && lastSeries.metric === ser.metric) {
            // this line graph is actually part of the previous area graph
            // in the series, so treat it as an area
            currentChart.renderArea(true);
          }
          charts.push(currentChart);
        } else if (ser.type === 'stack') {
          itemCount++;
          lastChart.stack(columnGroups[i], ser.name);
          colors.push(ser.color);
        }

        if (this.step && currentChart) {
          currentChart.interpolate('step-after');
        } else if (this.interpolate && currentChart) {
          currentChart.interpolate(this.interpolate);
        }
        if (this.tension) {
          currentChart.tension(this.tension);
        }
      }

      if (colors.length) {
        charts[charts.length - 1].ordinalColors(colors);
      }

      var legendItemHeight = 10,
        legendItemGap = 5;

      chart
        .renderHorizontalGridLines(true)
        .renderVerticalGridLines(true)
        .width(self.width)
        .height(self.height)
        .margins({
          top: 30,
          right: 20,
          bottom: (legendItemHeight * 2) + legendItemGap + 40,
          left: 50
        })
        .transitionDuration(0)
        .mouseZoomable(this.zoom)
        .zoomOutRestrict(true)
        .dimension(self.dateDimension)
        ;

      chart
        .x(d3.scale.ordinal())
        .yAxisLabel(self.verticalLabel, 14)
        .elasticY(true)
        ;

      chart
        .renderTitle(true)
        .title(function(p) {
          return timeFormat(p.key) + ': ' + numberFormat(p.value.value);
        })
        ;

      var legend = dc.legend()
        .x(50)
        .y(self.height - ((legendItemHeight * 2) + legendItemGap) - 10)
        .itemHeight(legendItemHeight)
        .gap(legendItemGap)
        .legendWidth(self.width - 140)
        .horizontal(true)
        .autoItemWidth(true)
      ;
      chart.legend(legend);

      chart.xAxis().ticks(6);
      chart.yAxis().tickFormat(numberFormat);

      if (self.title) {
        chart.on('renderlet', function(chart) {
          var svg = chart.svg();
          svg.select('#' + id + '-chart-background').remove();
          svg.insert('rect', ':first-child')
            .attr('id', id + '-chart-background')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('fill', 'white');

          var boundingRect = svg.node().getBoundingClientRect();

          svg.select('#' + id + '-chart-title').remove();
          svg.append('text')
            .attr('id', id + '-chart-title')
            .attr('x', boundingRect.width / 2)
            .attr('y', '20')
            .attr('text-anchor', 'middle')
            .style('font-size', '1em')
            .text(self.title);
        });
      }

      chart
        .compose(charts)
        .brushOn(false)
        .render();
      self.chart = chart;
    }

    // Draw the status message
    var svg = self.chart.svg();
    svg.select('#' + id + '-chart-status').remove();
    if (this.statusMessage !== null) {
      var boundingRect = svg.node().getBoundingClientRect();

      svg.append('text')
          .attr("id", id + '-chart-status')
          .attr('x', boundingRect.width / 2)
          .attr('y', boundingRect.height / 2.5)
          .attr('text-anchor', 'middle')
          .style('font-size', '2.5em')
          .text(this.statusMessage);
    }
  }
});
