/**
 * Created by jwhite on 6/6/14.
 */

describe('Backshift.DataSource.OpenNMS.Test', function () {
  it('should query and parse the results from the Measurements API', function (done) {
    var results = {
      "start": 0,
      "end": 1000,
      "step": 1,
      "timestamps": [1000],
      "labels": ["context"],
      "columns": [
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
      "step": 1000,
      "source": [
        {
          "aggregation": "AVERAGE",
          "attribute": "SysRawContext",
          "label": "context",
          "resourceId": "node[1].nodeSnmp[]"
        }
      ],
      "expression": [
        {
          "value": "1 * 2.0",
          "label": "expr",
          "transient": true
        }
      ],
      "filter": [
        {
          "name":"Chomp",
          "parameter":[
            {
              "key":"stripNaNs",
              "value":"expr"
            }
          ]
        }
      ]
    };

    spyOn(jQuery, "ajax").and.callFake(function (params) {
      // Verify the URL
      expect(params.url).toBe("http://127.0.0.1:9000/");

      // Verify the POSTed request
      expect(params.data).toBe(JSON.stringify(expectedQueryRequest));

      // Return the fixed results
      params.success(results);
    });

    var ds = new Backshift.DataSource.OpenNMS({
      url: "http://127.0.0.1:9000/",
      metrics: [
        {
          aggregation: "AVERAGE",
          attribute: "SysRawContext",
          name: "context",
          resourceId: "node[1].nodeSnmp[]"
        },
        {
          name: "expr",
          expression: "1 * 2.0",
          transient: true
        },
        {
          type: "filter",
          name: "Chomp",
          parameter: [{
            key: "stripNaNs",
            value: "expr"
          }]
        }
      ]
    });

    ds.query(0, 1000, 1).then(function (results) {
      // Verify the timestamps
      var ts = results.columns[0];
      expect(ts.length).toBe(1);
      expect(ts[0]).toBe(1000);

      // And the values - all ones in this case
      ts = results.columns[1];
      expect(ts.length).toBe(1);
      for (var i = 0; i < 1; i++) {
        expect(ts[i]).toBe(1);
      }

      done();
    }, function () {
      done.fail();
    });
  });
});
