/**
 * Created by jwhite on 30/3/15.
 */
describe('Backshift.Utilities.RpnToJexlConverter', function () {

  var rpnConverter = new Backshift.Utilities.RpnToJexlConverter();

  var checkRpnConversion = function (sourceRpn, expectedJexl) {
    expect(rpnConverter.convert(sourceRpn)).toBe(expectedJexl);
  };

  describe('.convert', function () {
    it('should convert simple expressions', function () {
      checkRpnConversion("X,Y,+", "(X + Y)");
    });

    it('should convert conditional expressions', function () {
      checkRpnConversion("X,Y,Z,IF", "(X != 0 ? Y : Z)");
      checkRpnConversion("X,Y,LT", "(X < Y ? 1 : 0)");
    });

    it('should convert UN expressions', function () {
      checkRpnConversion("X,UN", "( (X == NaN) ? 1 : 0)");
    });

    it('should convert ISINF expressions', function () {
      checkRpnConversion("X,ISINF", "( (X == __inf) || (X == __neg_inf) ? 1 : 0)");
    });

    it('should convert MIN/MAX expressions', function () {
      checkRpnConversion("X,Y,MIN", "math:min(Y,X)");
      checkRpnConversion("X,Y,MAX", "math:max(Y,X)");
    });

    it('should convert MINNAN/MAXNAN expressions', function () {
      checkRpnConversion("X,Y,MINNAN", "( ( X == NaN ) ? Y : ( ( Y == NaN ) ? X : ( math:min(Y,X) ) ) )");
      checkRpnConversion("X,Y,MAXNAN", "( ( X == NaN ) ? Y : ( ( Y == NaN ) ? X : ( math:max(Y,X) ) ) )");
    });

    it('should convert LIMIT expressions', function () {
      checkRpnConversion("ping1,0,0.14290626,LIMIT", "( ( (0 == __inf) || (0 == __neg_inf) || (0.14290626 == __inf) || (0.14290626 == __neg_inf) || (ping1 == __inf) || (ping1 == __neg_inf) || (ping1 < 0) || (ping1 > 0.14290626) ) ? null : ping1 )");
    });

    it('should convert ADDNAN expressions', function () {
      checkRpnConversion("X,Y,ADDNAN", "( ( ( X == NaN ) && ( Y == NaN ) ) ? NaN : ( ( X == NaN ) ? Y : ( ( Y == NaN ) ? X : ( X + Y ) ) ) )");
    });

    it('should convert math expressions', function () {
      checkRpnConversion("X,SIN", "math:sin(X)");
      checkRpnConversion("X,COS", "math:cos(X)");
      checkRpnConversion("X,LOG", "math:log(X)");
      checkRpnConversion("X,EXP", "math:exp(X)");
      checkRpnConversion("X,SQRT", "math:sqrt(X)");
      checkRpnConversion("X,ATAN", "math:atan(X)");
      checkRpnConversion("Y,X,ATAN2", "math:atan2(Y,X)");
      checkRpnConversion("Y,X,ATAN2,RAD2DEG", "math:toDegrees(math:atan2(Y,X))");
      checkRpnConversion("X,FLOOR", "math:floor(X)");
      checkRpnConversion("X,CEIL", "math:ceil(X)");
      checkRpnConversion("X,ABS", "math:abs(X)");
    });

    it('should convert number constants', function () {
      checkRpnConversion("UNKN,INF,ATAN2", "math:atan2(NaN,__inf)");
    });
  });
});
