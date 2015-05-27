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
