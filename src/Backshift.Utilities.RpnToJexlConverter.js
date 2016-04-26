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
