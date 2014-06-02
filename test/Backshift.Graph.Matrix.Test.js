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
        it("should render the data provider's values to the given element", function() {
            var model = {
                dataProcessor: {
                    type: 'trig'
                },
                sources: [
                    {
                        name: 'sin(x)',
                        type: 'sin'
                    }
                ]
            };

            var graph = new Backshift.Graph.Matrix({
                model: model,
                element: div.node(),
                start: 0,
                end: 97,
                resolution: 1000
            });

            var timeBeforeRender = Date.now();
            graph.render();

            // Make sure the timestamp is set in the meta-data
            var renderedAt = div.attr("data-rendered-at");
            expect( renderedAt >= timeBeforeRender ).toBeTruthy();

            // Retrieve the rendered matrix from the div
            var matrix = JSON.parse(div.attr("data-matrix"));

            // The matrix should have two columns
            expect( matrix.length ).toBe( 2 );

            // And 1000 rows
            expect( matrix[0].length ).toBe( 1000 );

            // The first column should contain the timestamps
            expect( matrix[0][0] ).toBe( 0 );
            expect( matrix[0][999] ).toBe( 97 );

            // The second should contain the values of the sine wave
            expect( matrix[1][0] ).toBe( 0 );
            expect( matrix[1][999] ).toBe( Math.sin(97) );
        });
    });
});
