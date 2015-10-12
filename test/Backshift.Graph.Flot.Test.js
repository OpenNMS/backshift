/**
 * Created by jwhite on 10/08/14.
 */

describe('Backshift.Graph.DC.Test', function () {
  var div;

  beforeEach(function () {
    div = d3.select('body').append('div');
  });

  afterEach(function () {
    div.remove();
  });

  it('should render an svg element within the div', function (done) {
    var ds = new Backshift.DataSource.SineWave({
      metrics: [
        {
          name: "sineWave",
          amplitude: 5,
          hshift: 5,
          period: 32 * Math.PI * 60
        }
      ]
    });

    var dcGraph = new Backshift.Graph.Flot({
      element: div.node(),
      width: 640,
      height: 480,
      last: 15 * 60,
      interval: 1000,
      dataSource: ds,
      title: "Wave",
      verticalLabel: "Units",
      series: [
        {
          name: "Sine Wave",
          metric: "sineWave",
          type: "line"
        }
      ]
    });

    dcGraph.render();

    setTimeout(function(){
      var html = "" + div.node().innerHTML;
      expect(html).toContain("canvas");

      done();
    }, 500);
  });
});
