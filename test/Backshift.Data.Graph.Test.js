/**
 * Created by jwhite on 5/23/14.
 */

describe('Backshift.Graph.Test', function () {
    var div;
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

    beforeEach(function () {
        div = d3.select('body').append('div');
    });

    afterEach(function () {
        div.remove();
    });

    describe('.timer', function () {
        it("should not trigger a refresh if the data is still fresh.", function() {
            var graph = new Backshift.Graph({
                model: model,
                element: div.node(),
                last: 15
            });
            expect( graph.isRefreshRequired() ).toBeTruthy();
            graph.render();
            expect( graph.isRefreshRequired() ).toBeFalsy();
        });

        it("should not trigger a refresh if a fetch is outstanding.", function() {
            var Graph = Backshift.Class.create(Backshift.Graph, {
                createDataProcessor: function () {
                    var self = this;
                    return {
                        fetch: function () {
                            self._beforeFetch();
                        }
                    };
                }
            });
            var graph = new Graph({
                model: model,
                element: div.node(),
                last: 15
            });
            expect( graph.isRefreshRequired() ).toBeTruthy();
            graph.render();
            expect( graph.isRefreshRequired() ).toBeFalsy();
        });
    });
});
