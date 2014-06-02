/**
 * Created by jwhite on 5/21/14.
 */

describe('Backshift.Data.Mock.Trig.Test', function () {
    it('should return a sine series', function(done) {
        var dataProvider = new Backshift.Data.Mock.Trig({
            sources: [
                {
                    name: '2sin(x-5)',
                    type: 'sin',
                    amplitude: 2,
                    hshift: 5
                }
            ],
            onFetchSuccess: function(dp) {
                var t = dp.getTimestamps();
                expect( t.length ).toBe( 100 );

                var x = dp.getValues('2sin(x-5)');
                expect( x.length ).toBe( 100 );

                // Verify the values
                var f = function(x) { return 2 * Math.sin(x - 5) };
                expect( x[0] ).toBe( f(t[0]) );
                expect( x[17] ).toBe( f(t[17]) );
                expect( x[99] ).toBe( f(t[99]) );

                done();
            }
        });

        dataProvider.fetch(1300000000, 1400000000, 100);
    });
});
