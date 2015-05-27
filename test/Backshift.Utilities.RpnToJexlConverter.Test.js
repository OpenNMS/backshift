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
  });
});
