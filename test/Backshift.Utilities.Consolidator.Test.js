/**
 * Created by fooker on 2016-11-16.
 */
describe('Backshift.Utilities.Consolidator', function () {

  var consolidator = new Backshift.Utilities.Consolidator();

  var ts = Date.now() - 7 * 24 * 60 * 60 * 1000; // A week ago

  describe('.parse', function () {
    it('should parse expressions without an argument', function () {
      var cf = consolidator.parse('SERIES1,AVERAGE');

      expect(cf.metricName).toBe('SERIES1');
      expect(cf.functionName).toBe('average');
      expect(cf.argument).toBeNaN();
      expect(cf.consolidate).toBeDefined();
    });
    it('should parse expressions with an argument', function () {
      var cf = consolidator.parse('SERIES1,95,PERCENT');

      expect(cf.metricName).toBe('SERIES1');
      expect(cf.functionName).toBe('percent');
      expect(cf.argument).toBe(95.0);
      expect(cf.consolidate).toBeDefined();
    });
  });

  function buildSeries() {
    return {
      columnNameToIndex: {
        'timestamp': 0,
        'my_series': 1,
      },
      columns: [
        Array.prototype.map.call(arguments, function (_, idx) { return ts + 1000 * idx; }),
        arguments,
      ]
    };
  }

  describe('function', function () {

    beforeEach(function () {
      jasmine.addMatchers({
        toBeMetricValue: function () {
          return {
            compare: function (actual, expectedTimestamp, expectedValue) {
              return {
                pass: (actual[0] === expectedTimestamp || (isNaN(actual[0]) && isNaN(expectedTimestamp))) &&
                      (Math.round(actual[1] / 0.0001) === Math.round(expectedValue / 0.0001) || (isNaN(actual[1]) && isNaN(expectedValue))),
                message: 'Expected ' + actual[1] + '@' + actual[0] + ' to be ' + expectedValue + '@' + expectedTimestamp,
              };
            }
          };
        }
      });
    });

    describe('minimum', function () {
      it('should be wrapped correctly', function () {
        expect(consolidator['minimum']('my_series').metricName).toBe('my_series');
        expect(consolidator['minimum']('my_series').functionName).toBe('minimum');
        expect(consolidator['minimum']('my_series').argument).toBeUndefined();
        expect(consolidator['minimum']('my_series').consolidate).toBeDefined();
      });
      it('should calculate correct result for empty series', function () {
        expect(consolidator['minimum']('my_series').consolidate(buildSeries())).toBeMetricValue(undefined, NaN);
      });
      it('should calculate correct result for single value series', function () {
        expect(consolidator['minimum']('my_series').consolidate(buildSeries(23.0))).toBeMetricValue(ts, 23.0);
        expect(consolidator['minimum']('my_series').consolidate(buildSeries(NaN))).toBeMetricValue(undefined, NaN);
      });
      it('should calculate correct result for multi value series', function () {
        expect(consolidator['minimum']('my_series').consolidate(
            buildSeries(23.0, 23.0, 23.0, 23.0, 23.0, 23.0)
        )).toBeMetricValue(ts + 1000 * 0, 23.0);
        expect(consolidator['minimum']('my_series').consolidate(
            buildSeries(1.0, 2.0, 3.0, 4.0, 5.0, 6.0)
        )).toBeMetricValue(ts + 1000 * 0, 1.0);
        expect(consolidator['minimum']('my_series').consolidate(
            buildSeries(NaN, 23.0, NaN, 23.0, NaN, 23.0)
        )).toBeMetricValue(ts + 1000 * 1, 23.0);
        expect(consolidator['minimum']('my_series').consolidate(
            buildSeries(NaN, 2.0, NaN, 4.0, NaN, 6.0)
        )).toBeMetricValue(ts + 1000 * 1, 2.0);
      });
    });

    describe('maximum', function () {
      it('should be wrapped correctly', function () {
        expect(consolidator['maximum']('my_series').metricName).toBe('my_series');
        expect(consolidator['maximum']('my_series').functionName).toBe('maximum');
        expect(consolidator['maximum']('my_series').argument).toBeUndefined();
        expect(consolidator['maximum']('my_series').consolidate).toBeDefined();
      });
      it('should calculate correct result for empty series', function () {
        expect(consolidator['maximum']('my_series').consolidate(buildSeries())).toBeMetricValue(undefined, NaN);
      });
      it('should calculate correct result for single value series', function () {
        expect(consolidator['maximum']('my_series').consolidate(buildSeries(23.0))).toBeMetricValue(ts, 23.0);
        expect(consolidator['maximum']('my_series').consolidate(buildSeries(NaN))).toBeMetricValue(undefined, NaN);
      });
      it('should calculate correct result for multi value series', function () {
        expect(consolidator['maximum']('my_series').consolidate(
            buildSeries(23.0, 23.0, 23.0, 23.0, 23.0, 23.0)
        )).toBeMetricValue(ts + 1000 * 0, 23.0);
        expect(consolidator['maximum']('my_series').consolidate(
            buildSeries(NaN, 23.0, NaN, 23.0, NaN, 23.0)
        )).toBeMetricValue(ts + 1000 * 1, 23.0);
        expect(consolidator['maximum']('my_series').consolidate(
            buildSeries(1.0, 2.0, 3.0, 4.0, 5.0, 6.0)
        )).toBeMetricValue(ts + 1000 * 5, 6.0);
        expect(consolidator['maximum']('my_series').consolidate(
            buildSeries(1.0, NaN, 3.0, NaN, 5.0, NaN)
        )).toBeMetricValue(ts + 1000 * 4, 5.0);
      });
    });

    describe('average', function () {
      it('should be wrapped correctly', function () {
        expect(consolidator['average']('my_series').metricName).toBe('my_series');
        expect(consolidator['average']('my_series').functionName).toBe('average');
        expect(consolidator['average']('my_series').argument).toBeUndefined();
        expect(consolidator['average']('my_series').consolidate).toBeDefined();
      });
      it('should calculate correct result for empty series', function () {
        expect(consolidator['average']('my_series').consolidate(buildSeries())).toBeMetricValue(undefined, NaN);
      });
      it('should calculate correct result for single value series', function () {
        expect(consolidator['average']('my_series').consolidate(buildSeries(23.0))).toBeMetricValue(undefined, 23.0);
        expect(consolidator['average']('my_series').consolidate(buildSeries(NaN))).toBeMetricValue(undefined, NaN);
      });
      it('should calculate correct result for multi value series', function () {
        expect(consolidator['average']('my_series').consolidate(
            buildSeries(1.0, 2.0, 3.0, 4.0, 5.0)
        )).toBeMetricValue(undefined, 3.0);
        expect(consolidator['average']('my_series').consolidate(
            buildSeries(NaN, 1.0, NaN, 2.0, NaN, 3.0)
        )).toBeMetricValue(undefined, 2.0);
      });
    });

    describe('stdev', function () {
      it('should be wrapped correctly', function () {
        expect(consolidator['stdev']('my_series').metricName).toBe('my_series');
        expect(consolidator['stdev']('my_series').functionName).toBe('stdev');
        expect(consolidator['stdev']('my_series').argument).toBeUndefined();
        expect(consolidator['stdev']('my_series').consolidate).toBeDefined();
      });
      it('should calculate correct result for empty series', function () {
        expect(consolidator['stdev']('my_series').consolidate(buildSeries())).toBeMetricValue(undefined, NaN);
      });
      it('should calculate correct result for single value series', function () {
        expect(consolidator['stdev']('my_series').consolidate(buildSeries(23.0))).toBeMetricValue(undefined, 0.0);
        expect(consolidator['stdev']('my_series').consolidate(buildSeries(NaN))).toBeMetricValue(undefined, NaN);
      });
      it('should calculate correct result for multi value series', function () {
        expect(consolidator['stdev']('my_series').consolidate(
            buildSeries(23.0, 23.0, 23.0, 23.0, 23.0, 23.0)
        )).toBeMetricValue(undefined, 0.0);
        expect(consolidator['stdev']('my_series').consolidate(
            buildSeries(1.0, 2.0, 3.0, 4.0, 5.0, 6.0)
        )).toBeMetricValue(undefined, 1.70782);
        expect(consolidator['stdev']('my_series').consolidate(
            buildSeries(1.0, NaN, 3.0, NaN, 5.0, NaN)
        )).toBeMetricValue(undefined, 1.63299);
        expect(consolidator['stdev']('my_series').consolidate(
            buildSeries(1.2, 1.9, 0.2, 0.6, 9.0, 2.0, 3.0, 4.0, 5.0, 6.0)
        )).toBeMetricValue(undefined, 2.61168);
      });
    });

    describe('last', function () {
      it('should be wrapped correctly', function () {
        expect(consolidator['last']('my_series').metricName).toBe('my_series');
        expect(consolidator['last']('my_series').functionName).toBe('last');
        expect(consolidator['last']('my_series').argument).toBeUndefined();
        expect(consolidator['last']('my_series').consolidate).toBeDefined();
      });
      it('should calculate correct result for empty series', function () {
        expect(consolidator['last']('my_series').consolidate(buildSeries())).toBeMetricValue(undefined, NaN);
      });
      it('should calculate correct result for single value series', function () {
        expect(consolidator['last']('my_series').consolidate(buildSeries(23.0))).toBeMetricValue(ts, 23.0);
        expect(consolidator['last']('my_series').consolidate(buildSeries(NaN))).toBeMetricValue(undefined, NaN);
      });
      it('should calculate correct result for multi value series', function () {
        expect(consolidator['last']('my_series').consolidate(
            buildSeries(23.0, 23.0, 23.0, 23.0, 23.0, 23.0)
        )).toBeMetricValue(ts + 1000 * 5, 23.0);
        expect(consolidator['last']('my_series').consolidate(
            buildSeries(1.0, 2.0, 3.0, 4.0, 5.0)
        )).toBeMetricValue(ts + 1000 * 4, 5.0);
        expect(consolidator['last']('my_series').consolidate(
            buildSeries(1.0, NaN, 2.0, NaN, 3.0, NaN)
        )).toBeMetricValue(ts + 1000 * 4, 3.0);
      });
    });

    describe('first', function () {
      it('should be wrapped correctly', function () {
        expect(consolidator['first']('my_series').metricName).toBe('my_series');
        expect(consolidator['first']('my_series').functionName).toBe('first');
        expect(consolidator['first']('my_series').argument).toBeUndefined();
        expect(consolidator['first']('my_series').consolidate).toBeDefined();
      });
      it('should calculate correct result for empty series', function () {
        expect(consolidator['first']('my_series').consolidate(buildSeries())).toBeMetricValue(undefined, NaN);
      });
      it('should calculate correct result for single value series', function () {
        expect(consolidator['first']('my_series').consolidate(buildSeries(23.0))).toBeMetricValue(ts, 23.0);
        expect(consolidator['first']('my_series').consolidate(buildSeries(NaN))).toBeMetricValue(undefined, NaN);
      });
      it('should calculate correct result for multi value series', function () {
        expect(consolidator['first']('my_series').consolidate(
            buildSeries(23.0, 23.0, 23.0, 23.0, 23.0, 23.0)
        )).toBeMetricValue(ts + 1000 * 0, 23.0);
        expect(consolidator['first']('my_series').consolidate(
            buildSeries(1.0, 2.0, 3.0, 4.0, 5.0)
        )).toBeMetricValue(ts + 1000 * 0, 1.0);
        expect(consolidator['first']('my_series').consolidate(
            buildSeries(NaN, 1.0, NaN, 2.0, NaN, 3.0)
        )).toBeMetricValue(ts + 1000 * 1, 1.0);
      });
    });

    describe('total', function () {
      it('should be wrapped correctly', function () {
        expect(consolidator['total']('my_series').metricName).toBe('my_series');
        expect(consolidator['total']('my_series').functionName).toBe('total');
        expect(consolidator['total']('my_series').argument).toBeUndefined();
        expect(consolidator['total']('my_series').consolidate).toBeDefined();
      });
      it('should calculate correct result for empty series', function () {
        expect(consolidator['total']('my_series').consolidate(buildSeries())).toBeMetricValue(undefined, NaN);
      });
      it('should calculate correct result for single value series', function () {
        expect(consolidator['total']('my_series').consolidate(buildSeries(23.0))).toBeMetricValue(undefined, NaN);
        expect(consolidator['total']('my_series').consolidate(buildSeries(NaN))).toBeMetricValue(undefined, NaN);
      });
      it('should calculate correct result for multi value series', function () {
        expect(consolidator['total']('my_series').consolidate(
            buildSeries(1.0, 2.0, 3.0, 4.0, 5.0)
        )).toBeMetricValue(undefined, 14.0);
        expect(consolidator['total']('my_series').consolidate(
            buildSeries(NaN, 1.0, NaN, 2.0, NaN, 3.0)
        )).toBeMetricValue(undefined, 6.0);
      });
    });

    describe('percent', function () {
      it('should be wrapped correctly', function () {
        expect(consolidator['percent']('my_series', 95.0).metricName).toBe('my_series');
        expect(consolidator['percent']('my_series', 95.0).functionName).toBe('percent');
        expect(consolidator['percent']('my_series', 95.0).argument).toBe(95.0);
        expect(consolidator['percent']('my_series', 95.0).consolidate).toBeDefined();
      });
      it('should calculate correct result for empty series', function () {
        expect(consolidator['percent']('my_series', 0.0).consolidate(buildSeries())).toBeMetricValue(undefined, NaN);
        expect(consolidator['percent']('my_series', 95.0).consolidate(buildSeries())).toBeMetricValue(undefined, NaN);
        expect(consolidator['percent']('my_series', 100.0).consolidate(buildSeries())).toBeMetricValue(undefined, NaN);
      });
      it('should calculate correct result for single value series', function () {
        expect(consolidator['percent']('my_series', 0.0).consolidate(buildSeries(23.0))).toBeMetricValue(undefined, 23.0);
        expect(consolidator['percent']('my_series', 95.0).consolidate(buildSeries(23.0))).toBeMetricValue(undefined, 23.0);
        expect(consolidator['percent']('my_series', 100.0).consolidate(buildSeries(23.0))).toBeMetricValue(undefined, 23.0);
        expect(consolidator['percent']('my_series', 0.0).consolidate(buildSeries(NaN))).toBeMetricValue(undefined, NaN);
        expect(consolidator['percent']('my_series', 95.0).consolidate(buildSeries(NaN))).toBeMetricValue(undefined, NaN);
        expect(consolidator['percent']('my_series', 100.0).consolidate(buildSeries(NaN))).toBeMetricValue(undefined, NaN);
      });
      it('should calculate correct result for multi value series', function () {
        expect(consolidator['percent']('my_series', 0.0).consolidate(
            buildSeries(1.0, 2.0, 3.0, 4.0, 5.0, 6.0)
        )).toBeMetricValue(undefined, 1.0);
        expect(consolidator['percent']('my_series', 70.0).consolidate(
            buildSeries(1.0, 2.0, 3.0, 4.0, 5.0, 6.0)
        )).toBeMetricValue(undefined, 5.0);
        expect(consolidator['percent']('my_series', 100.0).consolidate(
            buildSeries(1.0, 2.0, 3.0, 4.0, 5.0, 6.0)
        )).toBeMetricValue(undefined, 6.0);
        expect(consolidator['percent']('my_series', 70.0).consolidate(
            buildSeries(1.0, NaN, 3.0, NaN, 5.0, NaN)
        )).toBeMetricValue(undefined, 3.0);
        expect(consolidator['percent']('my_series', 20.0).consolidate(
            buildSeries(1.0, NaN, 3.0, NaN, 5.0, NaN)
        )).toBeMetricValue(undefined, NaN);
      });
    });

    describe('percentnan', function () {
      it('should be wrapped correctly', function () {
        expect(consolidator['percentnan']('my_series', 95.0).metricName).toBe('my_series');
        expect(consolidator['percentnan']('my_series', 95.0).functionName).toBe('percentnan');
        expect(consolidator['percentnan']('my_series', 95.0).argument).toBe(95.0);
        expect(consolidator['percentnan']('my_series', 95.0).consolidate).toBeDefined();
      });
      it('should calculate correct result for empty series', function () {
        expect(consolidator['percentnan']('my_series', 0.0).consolidate(buildSeries())).toBeMetricValue(undefined, NaN);
        expect(consolidator['percentnan']('my_series', 95.0).consolidate(buildSeries())).toBeMetricValue(undefined, NaN);
        expect(consolidator['percentnan']('my_series', 100.0).consolidate(buildSeries())).toBeMetricValue(undefined, NaN);
      });
      it('should calculate correct result for single value series', function () {
        expect(consolidator['percentnan']('my_series', 0.0).consolidate(buildSeries(23.0))).toBeMetricValue(undefined, 23.0);
        expect(consolidator['percentnan']('my_series', 95.0).consolidate(buildSeries(23.0))).toBeMetricValue(undefined, 23.0);
        expect(consolidator['percentnan']('my_series', 100.0).consolidate(buildSeries(23.0))).toBeMetricValue(undefined, 23.0);
        expect(consolidator['percentnan']('my_series', 0.0).consolidate(buildSeries(NaN))).toBeMetricValue(undefined, NaN);
        expect(consolidator['percentnan']('my_series', 95.0).consolidate(buildSeries(NaN))).toBeMetricValue(undefined, NaN);
        expect(consolidator['percentnan']('my_series', 100.0).consolidate(buildSeries(NaN))).toBeMetricValue(undefined, NaN);
      });
      it('should calculate correct result for multi value series', function () {
        expect(consolidator['percentnan']('my_series', 0.0).consolidate(
            buildSeries(1.0, 2.0, 3.0, 4.0, 5.0, 6.0)
        )).toBeMetricValue(undefined, 1.0);
        expect(consolidator['percentnan']('my_series', 70.0).consolidate(
            buildSeries(1.0, 2.0, 3.0, 4.0, 5.0, 6.0)
        )).toBeMetricValue(undefined, 5.0);
        expect(consolidator['percentnan']('my_series', 100.0).consolidate(
            buildSeries(1.0, 2.0, 3.0, 4.0, 5.0, 6.0)
        )).toBeMetricValue(undefined, 6.0);
        expect(consolidator['percentnan']('my_series', 70.0).consolidate(
            buildSeries(1.0, NaN, 3.0, NaN, 5.0, NaN)
        )).toBeMetricValue(undefined, 3.0);
        expect(consolidator['percentnan']('my_series', 20.0).consolidate(
            buildSeries(1.0, NaN, 3.0, NaN, 5.0, NaN)
        )).toBeMetricValue(undefined, 1.0);
      });
    });
  });
});
