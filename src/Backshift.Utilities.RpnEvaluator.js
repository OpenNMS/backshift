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
