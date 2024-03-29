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

    var funcOpReverse = function (op, numArgs) {
      return function (stack) {
        var i, ret = ")";
        for (i=0; i < numArgs; i++) {
          ret = ',' + stack.pop() + ret;
        }
        return op + '(' + ret.substring(1, ret.length);
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
    this.operators['POW'] = funcOpReverse('math:pow', 2);
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
    this.operators['{diffTime}'] = function() { return '(__diff_time / 1000)'; };

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

Backshift.namespace('Backshift.Utilities.RpnEvaluator');

/**
 * References:
 *   http://oss.oetiker.ch/rrdtool/doc/rrdgraph_rpn.en.html
 *   http://commons.apache.org/proper/commons-jexl/reference/syntax.html
 *
 * @author jesse
 */
Backshift.Utilities.RpnEvaluator = Backshift.Class.create({
  initialize: function () {
    this.operators = {};
    this._buildOperators();
  },

  _valueOf: function(token, context) {
    // Attempt to retrieve the named value from the context
    if (token in context) {
      if (context.hasOwnProperty(token)) {
         return context[token];
      }
    }

    // Otherwise, assume it's a number
    return parseFloat(token);
  },

  _buildOperators: function () {
    var self = this;

    var funcOp = function (op, numArgs) {
      return function (stack, context) {
        var values = new Array(numArgs);
        for (var i = 0; i < numArgs; i++) {
          values[i] = self._valueOf(stack.pop(), context);
        }
        values.reverse();
        return op.apply(null, values);
      };
    };

    var limitOp = function (stack, context) {
      var max = self._valueOf(stack.pop(), context);
      var min = self._valueOf(stack.pop(), context);
      var val = self._valueOf(stack.pop(), context);

      if (val === Number.POSITIVE_INFINITY || val === Number.NEGATIVE_INFINITY) {
        return NaN;
      }
      if (min == Number.POSITIVE_INFINITY || min === Number.NEGATIVE_INFINITY) {
        return NaN;
      }
      if (max == Number.POSITIVE_INFINITY || max === Number.NEGATIVE_INFINITY) {
        return NaN;
      }
      if (val < min || val > max) {
        return NaN;
      }
      return val;
    };

    var addNanOp = function (stack, context) {
      var b = self._valueOf(stack.pop(), context);
      var a = self._valueOf(stack.pop(), context);
      if (isNaN(a) && isNaN(b)) {
        return NaN;
      } else if (isNaN(a)) {
        return b;
      } else if (isNaN(b)) {
        return a;
      } else {
        return a + b;
      }
    };

    this.operators['+'] = funcOp(function(a,b) { return a + b; }, 2);
    this.operators['-'] = funcOp(function(a,b) { return a - b; }, 2);
    this.operators['*'] = funcOp(function(a,b) { return a * b; }, 2);
    this.operators['/'] = funcOp(function(a,b) { return a / b; }, 2);
    this.operators['%'] = funcOp(function(a,b) { return a % b; }, 2);
    this.operators['IF'] = funcOp(function(a,b,c) { return a != 0 ? b : c; }, 3);
    this.operators['UN'] = funcOp(function(a) { return isNaN(a) ? 0 : 1; }, 1);
    this.operators['LT'] = funcOp(function(a,b) { return a < b ? 1 : 0; }, 2);
    this.operators['LE'] = funcOp(function(a,b) { return a <= b ? 1 : 0; }, 2);
    this.operators['GT'] = funcOp(function(a,b) { return a > b ? 1 : 0; }, 2);
    this.operators['GE'] = funcOp(function(a,b) { return a >= b ? 1 : 0; }, 2);
    this.operators['EQ'] = funcOp(function(a,b) { return a == b ? 1 : 0; }, 2);
    this.operators['NE'] = funcOp(function(a,b) { return a != b ? 1 : 0; }, 2);
    this.operators['MIN'] = funcOp(function(a,b) { return Math.min(a,b); }, 2);
    this.operators['MAX'] = funcOp(function(a,b) { return Math.max(a,b); }, 2);
    this.operators['MINNAN'] = funcOp(function(a,b) { if (isNaN(a)) { return b; } if (isNaN(b)) { return a; } return Math.min(a,b); }, 2);
    this.operators['MAXNAN'] = funcOp(function(a,b) { if (isNaN(a)) { return b; } if (isNaN(b)) { return a; } return Math.max(a,b); }, 2);
    this.operators['ISINF'] = funcOp(function(a) { return (a === Number.POSITIVE_INFINITY || a === Number.NEGATIVE_INFINITY) ? 1 : 0; }, 1);
    this.operators['LIMIT'] = limitOp;
    this.operators['ADDNAN'] = addNanOp;
    this.operators['POW'] = funcOp(function(a, b) { return Math.pow(a, b); }, 2);
    this.operators['SIN'] = funcOp(function(a) { return Math.sin(a); }, 1);
    this.operators['COS'] = funcOp(function(a) { return Math.cos(a); }, 1);
    this.operators['LOG'] = funcOp(function(a) { return Math.log(a); }, 1);
    this.operators['EXP'] = funcOp(function(a) { return Math.exp(a); }, 1);
    this.operators['SQRT'] = funcOp(function(a) { return Math.sqrt(a); }, 1);
    this.operators['ATAN'] = funcOp(function(a) { return Math.atan(a); }, 1);
    this.operators['ATAN2'] = funcOp(function(a,b) { return Math.atan(a,b); }, 2);
    this.operators['FLOOR'] = funcOp(function(a) { return Math.floor(a); }, 1);
    this.operators['CEIL'] = funcOp(function(a) { return Math.ceil(a); }, 1);
    this.operators['RAD2DEG'] = funcOp(function(a) { return a * (180/Math.PI) }, 1);
    this.operators['DEG2RAD'] = funcOp(function(a) { return a * (Math.PI/180) }, 1);
    this.operators['ABS'] = funcOp(function(a) { return Math.abs(a) }, 1);
    this.operators['UNKN'] = funcOp(function() { return NaN; }, 0);
    this.operators['INF'] = funcOp(function() { return Number.POSITIVE_INFINITY; }, 0);
    this.operators['NEGINF'] = funcOp(function() { return Number.NEGATIVE_INFINITY; }, 0);
  },

  evaluate: function(rpn, context) {
    var token, tokens, n, i, stack = [];
    tokens = rpn.split(",");
    n = tokens.length;
    for (i = 0; i < n; i++) {
      token = tokens[i];
      if (this._isOperator(token)) {
        stack.push(this._eval(token, stack, context));
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

  _eval: function (token, stack, context) {
    return this.operators[token](stack, context);
  }

});

Backshift.namespace('Backshift.Utilities.Consolidator');

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
Backshift.Utilities.Consolidator = Backshift.Class.create(function() {
  var functions = {};

  var clazz = {
    initialize: function () {
    },

    parse: function(tokens) {
      // Split tokens if a single expression is passed
      if (typeof tokens === 'string') {
        tokens = tokens.split(",");
      }

      var metricName = tokens.shift();

      var functionName = tokens.pop().toLowerCase();
      if (!(functionName in functions)) {
        Backshift.fail('Unknown correlation function: ' + functionName);
      }

      if (tokens.length > 1) {
        Backshift.fail('Too many input values in RPN express. RPN: ' + tokens);
      }

      var argument = parseFloat(tokens[0]); // The remaining token is used as parameter

      return functions[functionName](metricName, argument);
    },
  };

  function valid(value) {
    return !isNaN(value) && isFinite(value);
  }

  function forEach(timestamps, values, cb) {
    var validCount = 0;
    for (var i = 0; i < timestamps.length; i++) {
      if (!valid(values[i])) {
        continue;
      }

      validCount++;

      cb(timestamps[i], values[i]);
    }

    return validCount;
  }

  function wrap(func) {
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
  }

  clazz['minimum'] = functions['minimum'] = wrap(function minimum(timestamps, values) {
    var minimumTimestamp = undefined;
    var minimumValue = NaN;

    forEach(timestamps, values, function(timestamp, value) {
      if (isNaN(minimumValue) || value < minimumValue) {
        minimumTimestamp = timestamp;
        minimumValue = value;
      }
    });

    return [minimumTimestamp, minimumValue];
  });

  clazz['maximum'] = functions['maximum'] = wrap(function maximum(timestamps, values) {
    var maximumTimestamp = undefined;
    var maximumValue = NaN;

    forEach(timestamps, values, function(timestamp, value) {
      if (isNaN(maximumValue) || value > maximumValue) {
        maximumTimestamp = timestamp;
        maximumValue = value;
      }
    });

    return [maximumTimestamp, maximumValue];
  });

  clazz['average'] = functions['average'] = wrap(function average(timestamps, values) {
    var sum = 0.0;

    var cnt = forEach(timestamps, values, function(timestamp, value) {
      sum += value;
    });

    return [undefined, (sum / cnt)];
  });

  clazz['stdev'] = functions['stdev'] = wrap(function stdev(timestamps, values) {
    var sum = 0.0;

    var cnt = forEach(timestamps, values, function(timestamp, value) {
      sum += value;
    });

    var avg = (sum / cnt);

    var dev = 0.0;
    forEach(timestamps, values, function(timestamp, value) {
      dev += Math.pow((value - avg), 2.0);
    });

    return [undefined, Math.sqrt(dev / cnt)];
  });

  clazz['last'] = functions['last'] = wrap(function last(timestamps, values) {
    for (var i = timestamps.length - 1; i >= 0; i--) {
      if (valid(values[i])) {
        return [timestamps[i], values[i]];
      }
    }

    return [undefined, NaN];
  });

  clazz['first'] = functions['first'] = wrap(function first(timestamps, values) {
    for (var i = 0; i < timestamps.length; i++) {
      if (valid(values[i])) {
        return [timestamps[i], values[i]];
      }
    }

    return [undefined, NaN];
  });

  clazz['total'] = functions['total'] = wrap(function total(timestamps, values) {
    var sum = 0.0;
    var cnt = 0;

    // As we don't have a fixed step size, we can't include the first sample as RRDTool does
    for (var i = 1; i < timestamps.length; i++) {
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

  clazz['percent'] = functions['percent'] = wrap(function percent(timestamps, values, argument) {
    var sortedValues = Array();
    for (var i = 0; i < timestamps.length; i++) {
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

  clazz['percentnan'] = functions['percentnan'] = wrap(function percentnan(timestamps, values, argument) {
    var sortedValues = Array();
    forEach(timestamps, values, function(timestamp, value) {
      sortedValues.push(value);
    });

    sortedValues.sort();

    return [undefined, sortedValues[Math.round(argument * (sortedValues.length - 1) / 100.0)]];
  });

  // For backward compatibility with deprecated (G)PRINT syntax:
  functions['min'] = functions['minimum'];
  functions['max'] = functions['maximum'];

  return clazz;
}());

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
      } else if (command === "VDEF") {
        subParts = args[1].split("=");
        name = subParts[0];
        rpnExpression = subParts[1];
        this._onVDEF(name, rpnExpression);
      } else if (command.match(/LINE/)) {
        width = parseInt(/LINE(\d+)/.exec(command));
        subParts = args[1].split("#");
        srcName = subParts[0];
        color = this._getColor(subParts[1]);
        legend = this._decodeString(args[2]);
        this._onLine(srcName, color, legend, width);
      } else if (command === "AREA") {
        subParts = args[1].split("#");
        srcName = subParts[0];
        color = this._getColor(subParts[1]);
        legend = this._decodeString(args[2]);
        this._onArea(srcName, color, legend);
      } else if (command === "STACK") {
        subParts = args[1].split("#");
        srcName = subParts[0];
        color = this._getColor(subParts[1]);
        legend = this._decodeString(args[2]);
        this._onStack(srcName, color, legend);
      } else if (command === "GPRINT") {
        if (args.length === 3) {
          srcName = args[1];
          aggregation = undefined;
          value = this._decodeString(args[2]);
        } else {
          srcName = args[1];
          aggregation = args[2];
          value = this._decodeString(args[3]);
        }
        this._onGPrint(srcName, aggregation, value);
      } else if (command === "COMMENT") {
        value = this._decodeString(args[1]);
        this._onComment(value);
      }
    }
  },
  _getColor: function (color) {
     if (color === undefined || color === "") {
       return undefined;
     }
     return '#' + color;
  },
  _onTitle: function (title) {

  },
  _onVerticalLabel: function (label) {

  },
  _onDEF: function (name, path, dsName, consolFun) {

  },
  _onCDEF: function (name, rpnExpression) {

  },
  _onVDEF: function (name, rpnExpression) {

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

    this.prefix = name;
    this.model.metrics.push({
      name: name,
      attribute: attribute,
      resourceId: this.resourceId,
      datasource: dsName,
      aggregation: consolFun
    });
  },

  _expressionRegexp: new RegExp('\\{([^}]*)}', 'g'),

  _onCDEF: function (name, rpnExpression) {
    var expression = rpnExpression;
    if(this.convertRpnToJexl) {
      expression = this.rpnConverter.convert(rpnExpression);
    }
    if (this.prefix) {
      expression = expression.replace(this._expressionRegexp, this.prefix + '.$1');
    }
    this.model.metrics.push({
      name: name,
      expression: expression
    });
  },

  _onVDEF: function (name, rpnExpression) {
    this.model.values.push({
      name: name,
      expression:  this.consolidator.parse(rpnExpression),
    });
  },

  _onLine: function (srcName, color, legend, width) {
    var series = {
      name: this.displayString(legend),
      metric: srcName,
      type: "line",
      color: color
    };
    this.maybeAddPrintStatementForSeries(srcName, legend);
    this.model.series.push(series);
  },

  _onArea: function (srcName, color, legend) {
    var series = {
      name: this.displayString(legend),
      metric: srcName,
      type: "area",
      color: color
    };
    this.maybeAddPrintStatementForSeries(srcName, legend);
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
    this.maybeAddPrintStatementForSeries(srcName, legend);
    this.model.series.push(series);
  },

  _onGPrint: function (srcName, aggregation, format) {
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
  },

  _onComment: function (format) {
    this.model.printStatements.push({
      format: format
    });
  },

  maybeAddPrintStatementForSeries: function(series, legend) {
    if (legend === undefined || legend === null || legend === "") {
      return;
    }

    this.model.printStatements.push({
      metric: series,
      value: NaN,
      format: "%g " + legend
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
  },

  startStreaming: function () {
    var self = this;
    if (self.dataSource && self.dataSource.supportsStreaming() && !self.isStreaming) {
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
      if (self.dataSource && self.dataSource.supportsStreaming()) {
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

/**
 * Created by jwhite on 10/12/14.
 */

Backshift.namespace('Backshift.Graph.Flot');

/** Renders the graph using Flot */
Backshift.Graph.Flot = Backshift.Class.create(Backshift.Graph, {

  defaults: function ($super) {
    return Backshift.extend($super(), {
      width: '100%',
      height: '100%',
      title: undefined,
      verticalLabel: undefined,
      zoom: true, // whether to allow zooming
      xaxisFont: undefined, // flot "font" spec, see http://flot.googlecode.com/svn/trunk/API.txt for details
      yaxisFont: undefined, // flot "font" spec
      legendFontSize: undefined, // font size (integer)
      ticks: undefined, // number of x-axis ticks, defaults to a value based on the width
    });
  },

  onInit: function () {
    var container = jQuery(this.element);
    // Set the container dimensions, Flot's canvas will use 100% of the container div
    container.width(this.width);
    container.height(this.height);
  },

  showStatus: function(text) {
    if (this.chart) {
      var options = this.chart.getOptions(),
        canvas = this.chart.getCanvas();
      if (options) {
        if (!options._oldTitle) {
          options._oldTitle = options.title;
        }
        options.title = text;
        if (options.canvas && canvas) {
          this.chart.draw();
        }
      }
    }
  },

  hideStatus: function() {
    if (this.chart) {
      var options = this.chart.getOptions(),
        canvas = this.chart.getCanvas();
      if (options) {
        if (options._oldTitle) {
          options.title = options._oldTitle;
          delete options._oldTitle;
        }
        if (options.canvas && canvas) {
          this.chart.draw();
        }
      }
    }
  },

  onBeforeQuery: function () {
    this.showStatus('Loading...');
    this.doRender = true;
  },

  onQueryFailed: function () {
    this.showStatus('Query failed.');
  },

  onQuerySuccess: function (results) {
    this.hideStatus();
    if (this.doRender) {
      this.drawChart(results);
    }
  },

  onRender: function() {
    this.doRender = true;
    this.drawChart();
  },

  onCancel: function() {
    this.doRender = false;
    this.drawChart();
  },

  _shouldStack: function (k) {
    // If there's stack following the area, set the area to stack
    if (this.model.series[k].type === "area") {
      var n = this.model.series.length;
      for (var i = k; i < n; i++) {
        if (this.model.series[i].type === "stack") {
          return 1;
        }
      }
    }
    return this.model.series[k].type === "stack";
  },

  drawChart: function (results) {
    var self = this;
    var container = jQuery(this.element);

    var timestamps = [];
    if (results && results.columns) {
      timestamps = results.columns[0];
    }
    var series = {}, values, i, j, numSeries, numValues, X, Y, columnName, shouldStack, shouldFill, seriesValues, shouldShow;
    numSeries = this.model.series.length;
    numValues = timestamps.length;

    // Rendering will silently fail if the timestamps are not ordered, throw an exception if this is detected
    for (i = 1; i < numValues; i++) {
      if (timestamps[i] < timestamps[i-1]) {
        throw "Timestamps are not properly ordered! (" + timestamps[i] + " < " + timestamps[i-1] + ")";
      }
    }

    var from, to;
    if (numValues >= 2) {
      from = timestamps[0];
      to = timestamps[timestamps.length - 1];
    }

    this.flotSeries = [];
    this.hiddenFlotSeries = [];

    var lastSeriesToStackWith = null;

    // Build the columns for the series
    for (i = 0; i < numSeries; i++) {
      columnName = "data" + i;
      series = this.model.series[i];
      if (series.metric && results && results.columns) {
        values = results.columns[results.columnNameToIndex[series.metric]];
      }

      shouldStack = this._shouldStack(i);
      shouldFill = this.model.series[i].type === "stack" || this.model.series[i].type === "area";
      shouldShow = this.model.series[i].type !== "hidden";

      if (this.model.series[i].type === "area") {
          // Reset the last series to stack with everytime we encounter a new area, since the area
          // itself should stack over any previous areas
          lastSeriesToStackWith = null;
      }

      seriesValues = [];
      for (j = 0; j < numValues; j++) {
        var yOffset = 0;
        if (shouldStack && lastSeriesToStackWith != null) {
          yOffset = lastSeriesToStackWith.data[j][1];
        }
        var yVal = isNaN(values[j]) ? values[j] : values[j] + yOffset;

        seriesValues.push([timestamps[j], yVal, yOffset]);
      }

      if (series.color === undefined) {
          // If the color is not specified the resulting element should be transparent
          shouldFill = 0.0; // No opacity
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
        originalY : values,
        id: columnName,
        metric: series.metric,
        nodatatable: (series.name === undefined || series.name === null || series.name === '')
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

    var yaxisTickFormat = d3.format(".3s");

    var legendStatements = [];
    for (i = 0; i < self.model.printStatements.length; i++) {
      var printStatement = self.model.printStatements[i];

      if (printStatement.metric in this._values) {
        // Print statements referencing a VDEF
        var value = this._values[printStatement.metric];
        legendStatements.push({
          metric: value.metricName,
          value: value.value[1],
          timestamp: value.value[0],
          format: printStatement.format,
        });

      } else if (results) {
        // Print statements referencing a series without a concrete value (used for %g)
        legendStatements.push({
          metric: printStatement.metric,
          value: NaN,
          timestamp: undefined,
          format: printStatement.format,
        });
      }
    }

    var options = {
      canvas: true,
      title: self.title || '',
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
        tickFormatter: yaxisTickFormat
      },
      yaxes: [{
        position: 'left',
        axisLabel: self.verticalLabel || '',
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
        statements: legendStatements
      },
      hiddenSeries: this.hiddenFlotSeries,
      tooltip: {
        show: true
      },
      datatable: {
        xaxis: {
          label: 'Date/Time',
          format: function(x) {
            var format = d3.time.format("%c");
            return format(new Date(x));
          }
        },
        yaxis: {
          ignoreColumnsWithNoLabel: true,
          format: function(y) {
            try {
              return yaxisTickFormat(y);
            } catch (err) {
              return NaN;
            }
          }
        }
      },
      zoom: {
        interactive: true
      },
      pan: {
        interactive: true
      }
    };

    this.addTimeAxis(options, from, to);

    if (self.xaxisFont) {
      options.xaxis.font = self.getFontSpec(self.xaxisFont);
    }
    if (self.yaxisFont) {
      options.yaxis.font = self.getFontSpec(self.yaxisFont);
    }
    if (self.legendFontSize) {
      if (!options.legend.style) {
        options.legend.style = {};
      }
      options.legend.style.fontSize = this.legendFontSize;
    }

    this.chart = jQuery.plot(container, this.flotSeries, options);

    // Limit the zooming and panning so that at least one point is always visible
    var yaxis = this.chart.getAxes().yaxis;
    this.chart.ranges = {
      yaxis: { panRange: [yaxis.min, yaxis.max], zoomRange: false}, xaxis: { panRange: [from,to], zoomRange: null }
    };
  },

  getFontSpec: function(fontSpec) {
    var ret = {
      size: 'inherit',
      family: 'inherit',
      style: 'inherit',
      weight: 'inherit',
      variant: 'inherit',
      color: 'inherit',
    };
    if (fontSpec) {
      if (fontSpec.size) {
        ret.size = fontSpec.size;
      }
      if (fontSpec.family) {
        ret.family = fontSpec.family;
      }
      if (fontSpec.style) {
        ret.style = fontSpec.style;
      }
      if (fontSpec.weight) {
        ret.weight = fontSpec.weight;
      }
      if (fontSpec.variant) {
        ret.variant = fontSpec.variant;
      }
      if (fontSpec.color) {
        ret.color = fontSpec.color;
      }
    }
    return ret;
  },

  drawHook: function(plot, canvascontext) {
    var cx = canvascontext.canvas.clientWidth / 2;
    canvascontext.font="15px sans-serif";
    canvascontext.textAlign = 'center';
    canvascontext.fillText(plot.getOptions().title, cx, 15);
  },

  addTimeAxis: function(options, from, to) {
    var elem = jQuery(this.element);
    var ticks = this.ticks || (elem.width() / 100);

    options.xaxis = {
      mode: "time",
      timezone: "browser",
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
  },

  onDestroy: function() {
    if (this.chart && this.chart.destroy) {
      this.chart.shutdown();
      this.chart.destroy();
    }
  }
});

/**
 * Created by jwhite on 5/22/14.
 */

Backshift.namespace('Backshift.DataSource');

/**
 * Abstract data-source used to retrieve time series data.
 *
 * @constructor
 * @param {object} args Dictionary of arguments.
 * @param          [args.metrics]
 */
Backshift.DataSource = Backshift.Class.create(Backshift.Class.Configurable, {

  initialize: function (args) {
    if (args.metrics === undefined || args.metrics.length === 0) {
      Backshift.fail('DataSource needs one or more metrics.');
    }

    this.metrics = args.metrics;

    this.configure(args);

    this.onInit(args);
  },

  defaults: function () {
    return {};
  },

  /**
   * @param {number} [start] Milliseconds since the Unix epoch.
   * @param {number} [end] Milliseconds since the Unix epoch.
   * @param {number} [resolution] Desired number of points.
   * @param {object} [args] Additional parameter that is passed to the callbacks.
   */
  query: function (start, end, resolution, args) {
    // Defined by subclasses
  },

  supportsQueries: function() {
    return true;
  },

  supportsStreaming: function() {
    return false;
  },

  onInit: function (args) {
    // Defined by subclasses
  }
});

/**
 * Created by jwhite on 6/6/14.
 */

Backshift.namespace('Backshift.DataSource.OpenNMS');

Backshift.DataSource.OpenNMS = Backshift.Class.create(Backshift.DataSource, {
  defaults: function ($super) {
    return Backshift.extend($super(), {
      url: "http://127.0.0.1:8980/opennms/rest/measurements",
      username: null,
      password: null,
      fetchFunction: null,
    });
  },

  onInit: function(args) {
    if (!this.fetchFunction) {
      this.fetchFunction = this.post;
    }
  },

  /* An overridable post method.
   *
   * @param {object} data A JSON object with data to POST.
   * @param {function} onSuccess A function to call on success.
   * @param {function} onFailure A function to call on failure.
   */
  post: function(url, data, onSuccess, onFailure) {
    var self = this,
      withCredentials = self.username !== null && self.password !== null,
      headers = {};

    if (withCredentials) {
      headers['Authorization'] = "Basic " + window.btoa(self.username + ":" + self.password);
    }

    jQuery.ajax({
      url: url,
      xhrFields: {
        withCredentials: withCredentials
      },
      headers: headers,
      type: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json',
      dataType: 'json',
      success: onSuccess,
      error: onFailure
    });

  },

  query: function (start, end, resolution, args) {
    var self = this;
    var dfd = jQuery.Deferred();

    var data = self._getQueryRequest(start, end, resolution),
      success = function QuerySuccess(response) {
        if (response === undefined) {
          // This can happen if/when the server returns a 204
          response = {
            labels: [],
            timestamps: [],
            columns: []
          }
        }
        dfd.resolve(self._parseResponse(response));
      },
      failure = function QueryFailure(jqXmr, textStatus) {
        dfd.reject(textStatus);
      };

    self.fetchFunction(self.url, data, success, failure);

    return dfd.promise();
  },

  _getQueryRequest: function (start, end, resolution) {
    var queryRequest = {
      "start": start,
      "end": end,
      "step": resolution > 0 ? Math.floor((end - start) / resolution) : 1,
      "source": [],
      "expression": [],
      "filter": []
    };

    var timeDeltaInSeconds = end - start;

    var qrSource;
    Backshift.keys(this.metrics).forEach(function (key) {
      var metric = this.metrics[key];
      if (metric.resourceId !== undefined) {
        qrSource = {
          aggregation: metric.aggregation,
          attribute: metric.attribute,
          label: metric.name,
          resourceId: metric.resourceId,
          transient: metric.transient
        };
        // Only set the datasource when it differs from the attribute name in order
        // to preserve backwards compatibility with 16.x (which does not recognize the datasource field)
        if (metric.datasource !== undefined && metric.attribute !== metric.datasource) {
          qrSource.datasource = metric.datasource;
        }
        queryRequest.source.push(qrSource);
      } else if (metric.type === 'filter') {
        queryRequest.filter.push({
          name: metric.name,
          parameter: metric.parameter
        });
      } else {
        qrSource = {
          value: metric.expression,
          label: metric.name,
          transient: metric.transient
        };
        qrSource.value = qrSource.value.replace("{diffTime}", timeDeltaInSeconds);
        queryRequest.expression.push(qrSource);
      }
    }, this);

    if (queryRequest.source.length === 0) {
      delete queryRequest.source;
    }

    if (queryRequest.expression.length === 0) {
      delete queryRequest.expression;
    }

    if (queryRequest.filter.length === 0) {
      delete queryRequest.filter;
    }

    return queryRequest;
  },

  _parseResponse: function (json) {
    var k, columns, columnNames, columnNameToIndex, constants, parts,
        numMetrics = json.labels.length;

    columns = new Array(1 + numMetrics);
    columnNames = new Array(1 + numMetrics);
    columnNameToIndex = {};

    columns[0] = json.timestamps;
    columnNames[0] = 'timestamp';
    columnNameToIndex['timestamp'] = 0;

    for (k = 0; k < numMetrics; k++) {
      columns[1 + k] = json.columns[k].values;
      columnNames[1 + k] = json.labels[k];
      columnNameToIndex[columnNames[1 + k]] = 1 + k;
    }

    if (json.constants) {
      constants = {};
      for (var c=0, len=json.constants.length, key, value, label; c < len; c++) {
        key = json.constants[c].key;
        value = json.constants[c].value;

        // All of the constants are prefixed with the label of the associated source, but
        // the graph definitions don't support this prefix, so we just cut the prefix
        // off the constant name
        parts = key.split('.');
        if (parts.length > 1) {
          key = parts[1];
          constants[key] = (value === undefined? null: value);
        }
      }
    }

    return {
      columns: columns,
      columnNames: columnNames,
      columnNameToIndex: columnNameToIndex,
      constants: constants
    };
  }
});

/**
 * Datasource for OpenNMS' Near Real-Time Graphing (NRTG) feature.
 *
 * Requires Horizon 17.1.0 or greater.
 *
 * Created by jwhite on 11/29/2015.
 */
Backshift.namespace('Backshift.DataSource.NRTG');

Backshift.DataSource.NRTG = Backshift.Class.create(Backshift.DataSource, {
  defaults: function ($super) {
    return Backshift.extend($super(), {
      url: "http://127.0.0.1:8980/opennms/nrt/starter",
      callback: function(){},
      username: null,
      password: null,
      getFunction: null,
      slidingWindow: 30,
      pollingInterval: 1000
    });
  },

  onInit: function(args) {
    if (!this.getFunction) {
      this.getFunction = this.get;
    }

    if (this.metrics.length !== 1) {
      Backshift.fail('NRTG only supports streaming a single metric.');
    }

    // The last measurement set
    this.lastMeasurementSet = {};
    // Calculated rows
    this.rows = [];
    // Instance of the interval
    this.pollingIntervalId = null;
  },

  supportsQueries: function() {
    return false;
  },

  supportsStreaming: function() {
    return true;
  },

  startStreaming: function() {
    var self = this;
    var dfd = jQuery.Deferred();

    self.getFunction(this.url, {
      resourceId: self.metrics[0].resourceId,
      report: self.metrics[0].report
    }, function(nrtgCollectionDetails) {
      self.handleCollectionDetails(nrtgCollectionDetails);
      dfd.resolve();
    }, function(jqXmr, textStatus) {
      dfd.reject(textStatus);
    });

    return dfd.promise();
  },

  stopStreaming: function () {
    var self = this;
    if (self.pollingIntervalId !== null) {
      clearInterval(self.pollingIntervalId);
      self.pollingIntervalId = null;
    }
  },

  updatePollingInterval: function(pollingInterval) {
    var self = this;
    self.pollingInterval = pollingInterval;
    if (self.pollingIntervalId !== null) {
      clearInterval(self.pollingIntervalId);
      var poll = function() {self.poll();}.bind(self);
      self.pollingIntervalId = setInterval(poll, self.pollingInterval);
    }
  },

  updateSlidingWindow: function(slidingWindow) {
    var self = this;
    self.slidingWindow = slidingWindow;
    self._processRowsAndNotify();
  },

  handleCollectionDetails: function(nrtgCollectionDetails) {
    var self = this;

    // Build a graph definition using the data from the collection details
    var graph = {
      "command": nrtgCollectionDetails.rrdGraphString,
      "externalValues": [],
      "propertiesValues": [],
      "columns": self._metricMappingsToColumns(nrtgCollectionDetails.metricsMapping)
    };

    // Generate the model from the graph definition
    var rrdGraphConverter = new Backshift.Utilities.RrdGraphConverter({
      graphDef: graph,
      resourceId: self.metrics[0].resourceId,
      convertRpnToJexl: false
    });
    self.model = rrdGraphConverter.model;

    // Start polling
    self.collectionTaskId = nrtgCollectionDetails.collectionTaskId;
    var poll = function() {self.poll();}.bind(self);
    poll();
    self.pollingIntervalId = setInterval(poll, self.pollingInterval);
  },

  poll: function() {
    var self = this;
    if (self.pollInProgress === true) {
      // If another poll is already in progress, then skip this one
      return;
    }

    self.pollInProgress = true;
    self.getFunction(self.url, {
      poll: true,
      nrtCollectionTaskId: self.collectionTaskId
    }, function(data) {
      self.pollInProgress = false;

      // Compute the measurements
      self._calculateMeasurements(data.measurement_sets);

      // Issue the callback
      self._processRowsAndNotify();
    }, function(jqXmr, textStatus) {
      // If a poll fails, log it, but don't take any actions, we'll just try again next time
      self.pollInProgress = false;
      console.log("NRTG: Poll failed with '" + textStatus + "'.");
    });
  },

  _metricMappingsToColumns: function(metricsMapping) {
    var columns = [];
    for (var i = 1, nmetrics = Object.keys(metricsMapping).length; i <= nmetrics; i++) {
      var found = false;
      for (var key in metricsMapping) {
        if (metricsMapping.hasOwnProperty(key)) {
          if (metricsMapping[key].indexOf("{rrd" + i + "}") > -1) {
            columns.push(key);
            found = true;
            break;
          }
        }
      }

      if (!found) {
        Backshift.fail("Missing {rrd" + i + "}");
      }
    }
    return columns;
  },

  _calculateRate: function(lastMetric, newMetric) {
    if (lastMetric === null || newMetric === null) {
      return NaN;
    } else if (isNaN(lastMetric.value) || isNaN(newMetric.value)) {
      return NaN;
    }
    var valueDelta = newMetric.value - lastMetric.value;
    var timestampDeltaInMs = newMetric.timeStamp - lastMetric.timeStamp;
    return (valueDelta / timestampDeltaInMs) * 1000;
  },

  _calculateMeasurements: function(measurementSets) {
    var self = this;
    for (var i = 0, nsets = measurementSets.length; i < nsets; i++) {

      // Index the metrics by metricId
      var metricsById = {};
      var timestamp = 0;
      for (var j = 0, nmetrics = measurementSets[i].length; j < nmetrics; j++) {
        var metric = measurementSets[i][j];
        metricsById[metric.metricId] = metric;
        timestamp = metric.timeStamp;
      }

      // Calculate the measurements
      var rpnEvaluator = new Backshift.Utilities.RpnEvaluator();
      var row = {
        timestamp: timestamp
      };
      for (j = 0, nmetrics = self.model.metrics.length; j < nmetrics; j++) {
        var modelMetric = self.model.metrics[j];
        var isExpression = "expression" in modelMetric;

        var value = NaN;
        if (!isExpression) {
          if (modelMetric.attribute in metricsById) {
            var metric = metricsById[modelMetric.attribute];
            value = metric.value;

            // Convert counters to rates
            var isCounter = metric.metricType.indexOf("counter") > -1;
            if (isCounter) {
              var lastMetric = null;
              if (modelMetric.attribute in self.lastMeasurementSet) {
                  lastMetric = self.lastMeasurementSet[modelMetric.attribute];
              }
              value = self._calculateRate(lastMetric, metric);
            }
          }
        } else {
          value = rpnEvaluator.evaluate(modelMetric.expression, row);
        }

        row[modelMetric.name] = value;
      }

      // Save the results
      self.rows.push(row);
      self.lastMeasurementSet = metricsById;
    }
  },

  _processRowsAndNotify: function() {
    var self = this;

    // Limit the amount of rows processed if we're using a sliding window
    var indexOfFirstRow = 0;
    if (self.slidingWindow > 0) {
      // Only use a subset of the rows
      indexOfFirstRow = self.rows.length - self.slidingWindow;
      if (indexOfFirstRow < 0) {
        indexOfFirstRow = 0;
      }
    }

    // Convert the rows to columns
    var columns = {};
    for (var i = indexOfFirstRow, nrows = self.rows.length; i < nrows; i++) {
      var row = self.rows[i];
      for (var key in row) {
        if (!row.hasOwnProperty(key)) {
          continue;
        }

        if (key in columns) {
          columns[key].push(row[key]);
        } else {
          columns[key] = [row[key]];
        }
      }
    }

    // Drop any transient columns
    for (j = 0, nmetrics = self.model.metrics.length; j < nmetrics; j++) {
      var modelMetric = self.model.metrics[j];
      if (modelMetric.transient) {
        delete columns[modelMetric.name];
      }
    }

    // Index the columns
    var results = {
      columns: [],
      columnNames: [],
      columnNameToIndex: {}
    };

    $.each(columns, function (columnName, columnValues) {
      results.columns.push(columnValues);
      results.columnNames.push(columnName);
      results.columnNameToIndex[columnName] = results.columns.length - 1;
    });

    // Issue the callback
    self.callback(results);
  },

  /* An overridable GET method.
   *
   * @param {function} onSuccess A function to call on success.
   * @param {function} onFailure A function to call on failure.
   */
  get: function(url,  data, onSuccess, onFailure) {
    var self = this,
        withCredentials = self.username !== null && self.password !== null,
        headers = {};

    if (withCredentials) {
      headers['Authorization'] = "Basic " + window.btoa(self.username + ":" + self.password);
    }

    jQuery.ajax({
      url: url,
      xhrFields: {
        withCredentials: withCredentials
      },
      headers: headers,
      type: 'GET',
      cache: false,
      data: data,
      dataType: 'json',
      success: onSuccess,
      error: onFailure
    });
  }
});
// Register as an AMD module,
if ( typeof define === "function" && define.amd ) {
    define(['d3'], Backshift);
}
