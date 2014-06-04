/**
 * Created by jwhite on 5/21/14.
 */

describe('Backshift.Data.Newts.Test', function () {
    it('should use the measurements returned by the ajax call', function(done) {
        var measurementResults = [
            [
                {
                    "name": "ds1",
                    "timestamp": 1300000000000,
                    "value": 1
                }
            ],
            [
                {
                    "name": "ds1",
                    "timestamp": 1300000100000,
                    "value": 1
                }
            ],
            [
                {
                    "name": "ds1",
                    "timestamp": 1300000200000,
                    "value": 1
                }
            ],
            [
                {
                    "name": "ds1",
                    "timestamp": 1300000300000,
                    "value": 1
                }
            ],
            [
                {
                    "name": "ds1",
                    "timestamp": 1300000400000,
                    "value": 1
                }
            ]
        ];

        var expectedReport =  {
            interval: 300,
            datasources: [
                {
                    label     : "ds1",
                    source    : "temperature",
                    function  : "AVERAGE",
                    heartbeat : 600
                }
            ],
            expressions: [
                {
                    label: "ds1-2x",
                    expression: "2 * ds1"
                }
            ],
            exports: [
                "ds1",
                "ds1-2x"
            ]
        };

        spyOn(jQuery, "ajax").and.callFake(function (params) {
            // Verify the URL
            expect( params.url ).toBe( "http://127.0.0.1:9000/measurements/localhost?start=1300000000&end=1300000400&resolution=600s" );

            // Verify the POSTed report
            expect( params.data ).toBe( JSON.stringify(expectedReport) );

            // Return the given measurements
            params.success(measurementResults);
        });

        var dataProvider = new Backshift.Data.Newts({
            url: "http://127.0.0.1:9000/",
            sources: [
                {
                    name: "ds1",
                    resource: "localhost",
                    dsName: "temperature",
                    csFunc: "AVERAGE",
                    step: 300,
                    heartbeat: 600
                },
                {
                    name: "ds1-2x",
                    resource: "localhost",
                    expression: "2 * ds1"
                }
            ],
            onFetchSuccess: function(dp) {
                // Verify the timestamps
                var ts = dp.getTimestamps();
                expect( ts.length ).toBe( 5 );
                expect( ts[0] ).toBe( 1300000000 );
                expect( ts[4] ).toBe( 1300000400 );

                // And the values - all ones in this case
                ts = dp.getValues("ds1");
                expect( ts.length ).toBe( 5 );
                for (var i = 0; i < 5; i++) {
                    expect( ts[i] ).toBe( 1 );
                }

                done();
            }
        });

        dataProvider.fetch(1300000000, 1300000400, 10);
    });
});
