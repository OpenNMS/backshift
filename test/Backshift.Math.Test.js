/**
 * Created by jwhite on 5/25/14.
 */

describe('Backshift.Math', function () {

  describe('.leastCommonMultiple', function () {
    var lcm = Backshift.Math.lcm;

    it('should return 0 if an empty list if given', function () {
      expect(lcm()).toBe(0);
      expect(lcm([])).toBe(0);
    });

    it('should calculate the least common multiple', function () {
      // Trivial case
      expect(lcm([1])).toBe(1);
      expect(lcm([2])).toBe(2);
      expect(lcm([7])).toBe(7);

      // Verified with Wolfram Alpha
      expect(lcm([9, 12, 21])).toBe(252);
      expect(lcm([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toBe(2520);
      expect(lcm([24, 214])).toBe(2568);

      // Order or duplicates should not affect the results
      expect(lcm([7, 4, 3, 2, 5, 6, 1, 10, 9, 8, 10, 3, 7])).toBe(2520);
    });
  });
});
