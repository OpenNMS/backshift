/**
 * Created by jwhite on 5/22/14.
 */

describe('Backshift.Graph.Richshaw.Test', function () {
    var div;

    beforeEach(function () {
        div = d3.select('body').append('div');
    });

    afterEach(function () {
        div.remove();
    });

    it('should render an canvas element within the div', function() {
        var model = {
            dataProcessor: {
                type: 'trig'
            },
            sources: [
                {
                    name: '2sin(x-5)',
                    type: 'sin',
                    amplitude: 5,
                    shift: 5,
                    period: 32 * Math.PI
                }
            ],
            series: [
                {
                    name: 'Sin Wave',
                    source: '2sin(x-5)',
                    type: 'line'
                }
            ]
        };

        var graph = new Backshift.Graph.Flot({
            model: model,
            element: div.node(),
            width: 640,
            height: 480,
            last: 15*60,
            interval: 1000
        });

        graph.render();

        var html = "" + div.node().innerHTML;
        expect( html ).toContain("canvas");
    });
});
