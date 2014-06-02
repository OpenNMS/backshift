/**
 * Created by jwhite on 5/21/14.
 */

describe('Backshift.Data.Mock', function () {
    it('should return an evenly fitted series full of zeros', function(done) {
        var dataProvider = new Backshift.Data.Mock({
            sources: [
                {
                    name: 'zero'
                }
            ],
            onFetchSuccess: function(dp) {
                // Verify the timestamps
                var ts = dp.getTimestamps();
                expect( ts.length ).toBe( 100 );
                expect( ts[0] ).toBe( 1300000000 );
                expect( ts[99] ).toBe( 1400000000 );

                // And the values - all zeroes in this case
                ts = dp.getValues('zero');
                expect( ts.length ).toBe( 100 );
                for (var i = 0; i < 100; i++) {
                    expect( ts[i] ).toBe( 0 );
                }

                done();
            }
        });

        dataProvider.fetch(1300000000, 1400000000, 100);
    });
});
