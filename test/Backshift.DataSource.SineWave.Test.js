/**
 * Created by jwhite on 5/21/14.
 */

describe('Backshift.DataSource.SineWave.Test', function () {
  it('should render a sine series', function (done) {
    var ds = new Backshift.DataSource.SineWave({
      metrics: [
        {
          name: 'sinWave',
          type: 'sin',
          amplitude: 5,
          hshift: 5,
          period: 32 * Math.PI
        }
      ]
    });

    ds.query(1300000000, 1400000000, 100).then(function (results) {
      // Verify the structure of the response
      expect(results.columns.length).toBe(2);
      expect(results.columnNames.length).toBe(2);
      expect(results.columnNames[0]).toBe('timestamp');
      expect(results.columnNames[1]).toBe('sinWave');

      // Verify the timestamps
      var t = results.columns[0];
      expect(t.length).toBe(100);
      expect(t[0]).toBe(1300000000);
      expect(t[99]).toBe(1400000000);

      // Verify the values
      var x = results.columns[1];
      expect(x[0]).toBeCloseTo(2.311297, 4);
      expect(x[50]).toBeCloseTo(3.03758356, 4);
      expect(x[99]).toBeCloseTo(0.912055230, 4);

      done();
    }, function () {
      done.fail();
    });
  });
});
