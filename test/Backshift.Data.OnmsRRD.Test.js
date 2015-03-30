/**
 * Created by jwhite on 6/6/14.
 */

describe('Backshift.Data.OnmsRRD.Test', function () {
    it('should work', function(done) {
        var results = {
          "start": 0,
          "end": 1000,
          "step": 1,
          "timestamps": [0],
          "labels": ["context"],
          "columns":[
            {
              "values": [
                1
              ]
            }
          ]
        };

        var expectedQueryRequest = {
          "start": 0,
          "end": 1000,
          "step": 1,
          "source": [
            {
              "aggregation": "AVERAGE",
              "attribute": "SysRawContext",
              "label": "context",
              "resourceId": "node[1].nodeSnmp[]"
            }
          ]
        };

        spyOn(jQuery, "ajax").and.callFake(function (params) {
            // Verify the POSTed request
            expect( params.data ).toBe( JSON.stringify(expectedQueryRequest) );

            // Return the fixed results
            params.success(results);
        });

      var dataProvider = new Backshift.Data.OnmsRRD({
            url: "http://127.0.0.1:9000/",
            sources: [
                {
                  aggregation: "AVERAGE",
                  attribute: "SysRawContext",
                  name: "context",
                  resourceId: "node[1].nodeSnmp[]"
                }
            ],
            onFetchSuccess: function(dp) {
                // Verify the timestamps
                var ts = dp.getTimestamps();
                expect( ts.length ).toBe( 1 );
                expect( ts[0] ).toBe( 0 );

                // And the values - all ones in this case
                ts = dp.getValues("context");
                expect( ts.length ).toBe( 1 );
                for (var i = 0; i < 1; i++) {
                    expect( ts[i] ).toBe( 1 );
                }

                done();
            }
        });

        dataProvider.fetch(0, 1, 1);
    });
});
