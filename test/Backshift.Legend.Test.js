/**
 * Created by jwhite on 6/3/14.
 */

describe('Backshift.Legend', function () {
    var div;

    beforeEach(function () {
        div = d3.select('body').append('div');
    });

    afterEach(function () {
        div.remove();
    });

    describe('.render', function () {
        it('should render an empty div if no legend is specified', function() {
            var model = {
                series: [
                ]
            };

            var legend = new Backshift.Legend({
                model: model,
                width: 640,
                element: div.node(),
                dataProcessor: {
                    getValues: function() {return []; }
                }
            });
            legend.render();

            var html = "" + div.node().innerHTML;
            expect( html ).toBe("");
        });

        it('should work', function() {
            var model = {
                series: [
                    {
                        name: 'Sin Wave',
                        source: 'sin',
                        type: 'line'
                    }
                ],
                legend: [
                    "{{0.name}} Avg: {{0.avg}} Min: {{0.min}} Max: {{0.max}}",
                ]
            };

            var legend = new Backshift.Legend({
                model: model,
                width: 640,
                element: div.node(),
                dataProcessor: {
                    getValues: function() {return [0, 1, 2, 3]; }
                }
            });
            legend.render();

            var html = "" + div.node().innerHTML;
            expect( html ).toBe("Sin Wave Avg: 1.5 Min: 0 Max: 3");
        });
    });
});
