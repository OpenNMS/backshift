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
      checkRpnConversion("A,B,+", "(A + B)");
    });

    it('should convert conditional expressions', function () {
      checkRpnConversion("A,B,C,IF", "(A != 0 ? B : C)");
      checkRpnConversion("A,B,LT", "(A < B ? 1 : 0)");
    });

    it('should convert UN expressions', function () {
      checkRpnConversion("A,UN", "( (A == __inf) || (A == __neg_inf) ? 1 : 0)");
    });

    it('should convert LIMIT expressions', function () {
      checkRpnConversion("ping1,0,0.14290626,LIMIT", "( ( (0 == __inf) || (0 == __neg_inf) || (0.14290626 == __inf) || (0.14290626 == __neg_inf) || (ping1 == __inf) || (ping1 == __neg_inf) || (ping1 < 0) || (ping1 > 0.14290626) ) ? null : ping1 )");
    });
  });
});
