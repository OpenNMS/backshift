/**
 * Created by jwhite on 11/28/15.
 */
describe('Backshift.Utilities.RpnEvaluator', function () {

  var rpnEvaluator = new Backshift.Utilities.RpnEvaluator();

  var eval = function (rpn, context, expectedValue) {

    var actualValue = rpnEvaluator.evaluate(rpn, context);
    if (isNaN(expectedValue)) {
      expect(actualValue).toBeNaN();
    } else {
      expect(actualValue).toBeCloseTo(expectedValue, 6);
    }
  };

  describe('.evaluate', function () {
    it('should evaluate simple expressions', function () {
      // X + Y
      eval("X,Y,+", {'X': 1, 'Y': 1}, 2);
    });


    it('should evaluate conditional expressions', function () {
      // (X != 0 ? Y : Z)
      eval("X,Y,Z,IF", {'X': 1, 'Y': 2, 'Z': 3}, 2);
      eval("X,Y,Z,IF", {'X': 0, 'Y': 2, 'Z': 3}, 3);

      // (X < Y ? 1 : 0)
      eval("X,Y,LT", {'X': 1, 'Y': 2}, 1);
      eval("X,Y,LT", {'X': 2, 'Y': 1}, 0);
    });

    it('should evaluate UN expressions', function () {
      // (X == NaN) ? 1 : 0
      eval("X,UN", {'X': 1}, 1);
      eval("X,UN", {'X': NaN}, 0);
    });

    it('should evaluate ISINF expressions', function () {
      // (X == __inf) || (X == __neg_inf) ? 1 : 0
      eval("X,ISINF", {'X': Number.POSITIVE_INFINITY}, 1);
      eval("X,ISINF", {'X': Number.NEGATIVE_INFINITY}, 1);
      eval("X,ISINF", {'X': 0}, 0);
    });

    it('should evaluate MIN/MAX expressions', function () {
      eval("X,Y,MIN", {'X': 1, 'Y': 2}, 1);
      eval("X,Y,MAX", {'X': 1, 'Y': 2}, 2);
    });

    it('should evaluate MINNAN/MAXNAN expressions', function () {
      // ( X == NaN ) ? Y : ( ( Y == NaN ) ? X : ( math:min(Y,X) ) )
      eval("X,Y,MINNAN", {'X': NaN, 'Y': 2}, 2);
      // ( X == NaN ) ? Y : ( ( Y == NaN ) ? X : ( math:max(Y,X) ) )
      eval("X,Y,MAXNAN", {'X': NaN, 'Y': 2}, 2);
    });

    it('should evaluate LIMIT expressions', function () {
      // ( (0 == __inf) || (0 == __neg_inf) || (0.14290626 == __inf) || (0.14290626 == __neg_inf) || (ping1 == __inf) || (ping1 == __neg_inf) || (ping1 < 0) || (ping1 > 0.14290626) ) ? NaN : ping1
      eval("ping1,0,0.14290626,LIMIT", {'ping1': 1}, NaN);
      eval("ping1,0,0.14290626,LIMIT", {'ping1': 0.1}, 0.1);
    });

    it('should evaluate ADDNAN expressions', function () {
      // ( ( X == NaN ) && ( Y == NaN ) ) ? NaN : ( ( X == NaN ) ? Y : ( ( Y == NaN ) ? X : ( X + Y ) ) )
      eval("X,Y,ADDNAN", {"X": 1, "Y": 2}, 3);
      eval("X,Y,ADDNAN", {"X": 1, "Y": NaN}, 1);
      eval("X,Y,ADDNAN", {"X": NaN, "Y": 1}, 1);
    });

    it('should evaluate math expressions', function () {
      eval("X,SIN", {"X": Math.PI/2}, 1);
      eval("X,COS", {"X": 0}, 1);
      eval("X,LOG", {"X": Math.E}, 1);
      eval("X,SQRT", {"X": 1}, 1);
      eval("X,ATAN", {"X": 1}, Math.PI/4);
      eval("Y,X,ATAN2", {"X": 8, "Y": 4}, 1.3258176636680326);
      eval("X,FLOOR", {"X": 1.1}, 1);
      eval("X,CEIL", {"X": 1.1}, 2);
      eval("X,ABS", {"X": -1}, 1);
    });
  });
});
