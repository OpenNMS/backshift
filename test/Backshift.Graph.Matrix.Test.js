/**
 * Created by jwhite on 5/23/14.
 */

describe('Backshift.Graph.Matrix.Test', function () {
  var div;

  beforeEach(function () {
    div = d3.select('body').append('div');
  });

  afterEach(function () {
    div.remove();
  });

  describe('.render', function () {
    it("should render the data source's values to the given element", function (done) {
      var ds = new Backshift.DataSource.SineWave({
        metrics: [
          {
            name: 'sineWave',
            amplitude: 5,
            hshift: 5,
            period: 32 * Math.PI
          }
        ]
      });

      var graph = new Backshift.Graph.Matrix({
        element: div.node(),
        start: 1,
        end: 47,
        resolution: 1000,
        dataSource: ds
      });

      var timeBeforeRender = Date.now();
      graph.render();

      setTimeout(function(){
        // Make sure the timestamp is set in the meta-data
        var renderedAt = div.attr("data-rendered-at");
        expect(renderedAt >= timeBeforeRender).toBeTruthy();

        // Retrieve the rendered results from the div
        var results = JSON.parse(div.attr("data-results"));

        // The results should have two columns
        expect(results.columns.length).toBe(2);

        // And 1000 rows
        expect(results.columns[0].length).toBe(1000);

        // The first column should contain the timestamps
        expect(results.columns[0][0]).toBe(1);
        expect(results.columns[0][999]).toBe(47);

        done();
      }, 500);
    });
  });
});
