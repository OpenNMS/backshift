/**
 * Created by jwhite on 6/3/14.
 */

describe('Backshift.Stats', function () {
    describe('.Maximum', function () {
        var max = Backshift.Stats.Maximum;
        it('should calculate the max value', function () {
            expect( max([]) ).toBeNaN();
            expect( max([0]) ).toBe(0);
            expect( max([-1, 2, 3, 4]) ).toBe(4);
            expect( max([NaN, -1, 2, 3, 4, NaN]) ).toBe(4);
            expect( max([NaN, NaN, NaN])).toBeNaN();
        });
    });
});