/*

* Fix averages for stacked areas
* Hidden series shouldn't affect Y-axis range
* Default length/precision when not set
* Spacing after lf when no s is present
 */
(function ($) {
    var options = {
        legend: {
            statements: [],
            margin: { left: 5, right: 0, top: 0, bottom: 0 },
            style: {
                fontSize: 9,
                spaceWidth: 5,
                badgeSize: 10,
                lineSpacing: 5
            }
        }
    };

    function calculateLegendHeight(options) {
        var lineWidth = options.legend.style.lineSpacing + Math.max(options.legend.style.badgeSize, options.legend.style.fontSize);

        // Count the number of lines
        var numberOfLines = 0;
        var numberOfEntriesOnNewline = 0;

        $.each(options.legend.statements, function(idx) {
            var statement = options.legend.statements[idx];
            if (statement.value.indexOf("\\n") > -1) {
                numberOfLines++;
                numberOfEntriesOnNewline = 0;
            } else {
                numberOfEntriesOnNewline++;
            }
        });

        if (numberOfEntriesOnNewline > 0) {
            numberOfLines++;
        }

        return numberOfLines * lineWidth + options.legend.margin.top + options.legend.margin.bottom;
    }

    function tokenizeStatement(statement) {

        var hasBadgeToken = false;

        var state = 0, stack = [], tokens = [];

        for (var i = 0, len = statement.value.length; i < len; i++) {

            // The next index, bounded by the size of the string
            var nexti = Math.min(i+1, len - 1);

            var c = statement.value[i];
            var nextc = statement.value[nexti];

            if (c === '%' && nextc === 'g') {

                if (stack.length > 0) {
                    tokens.push({
                        type: 'text',
                        value: stack.join('')
                    });
                    stack = [];
                }
                tokens.push({
                    type: 'badge'
                });

                hasBadgeToken = true;

                i++;
            } else if (c === '%' && nextc === 's') {

                if (stack.length > 0) {
                    tokens.push({
                        type: 'text',
                        value: stack.join('')
                    });
                    stack = [];
                }
                tokens.push({
                    type: 'unit'
                });

                i++;
            } else if (c === '%' && nextc === '%') {

                stack.push('%');

                i++;
            } else if (c == '\\' && nextc == 'n') {
                if (stack.length > 0) {
                    tokens.push({
                        type: 'text',
                        value: stack.join('')
                    });
                    stack = [];
                }
                tokens.push({
                    type: 'newline'
                });

                i++;
            } else if (statement.value.slice(i).match(/^%(\d*)\.\d+lf/) !== null) {
                var slice = statement.value.slice(i);

                var regex = /^%(\d*)\.(\d+)lf/;

                var match = regex.exec(slice);

                var length = match[1];
                var precision = match[2];

                if (stack.length > 0) {
                    tokens.push({
                        type: 'text',
                        value: stack.join('')
                    });
                    stack = [];
                }

                tokens.push({
                    type: 'lf',
                    length: length !== null ? parseInt(length) : -1,
                    precision: parseInt(precision)
                });

                i += match[0].length - 1;
            } else {
                stack.push(c);
            }
        }

        // Always add a space to the end of the statement if there was a badge printed
        if (hasBadgeToken) {
            stack.push(" ");
        }

        if (stack.length > 0) {
            tokens.push({
                type: 'text',
                value: stack.join('')
            });
        }

       //console.log("'" + statement.value + "'");
       //console.log(JSON.stringify(tokens));

        return tokens;
    }

    function drawText(legendCtx, fontSize, text) {
        var canvasCtx = legendCtx.canvasCtx;

        canvasCtx.fillStyle="black";
        canvasCtx.font = fontSize + "px Monospace";
        canvasCtx.textAlign="left";
        canvasCtx.fillText(text, legendCtx.x, legendCtx.y + fontSize);

        var textSize = canvasCtx.measureText(text);
        legendCtx.x += textSize.width;
    }

    function reduceWithAggregate(aggregation, series) {

        var N = series.data.length, total = 0, y, yMin = NaN, yMax = NaN, last = NaN;

        if (aggregation === 'MIN') {

            $.each(series.data, function(idx) {
                y = series.data[idx][1];
                if (isNaN(y)) {
                    return;
                }
                if (isNaN(yMin) || y < yMin) {
                    yMin = y;
                }
            });
            return yMin;

        } else if (aggregation === 'MAX') {

            $.each(series.data, function(idx) {
                y = series.data[idx][1];
                if (isNaN(y)) {
                    return;
                }
                if (isNaN(yMax)  || y > yMax) {
                    yMax = y;
                }
            });
            return yMax;

        } else if (aggregation === "AVERAGE" || aggregation === "AVG") {

            N = 0;

            $.each(series.data, function(idx) {
                y = series.data[idx][1];
                if (isNaN(y)) {
                    return;
                }
                total += y;
                N++;
            });

            return N > 0 ? total / N : NaN;

        } else if (aggregation === "LAST") {

            $.each(series.data, function(idx) {
                y = series.data[idx][1];
                if (!isNaN(y)) {
                    last = y;
                }
            });

            return last;

        } else {
            throw "Unsupported aggregation: " + aggregation;
        }
    }

    function drawStatement(legendCtx, statement, options, allSeries) {

        var canvasCtx = legendCtx.canvasCtx;
        var spaceWidth = options.legend.style.spaceWidth;
        var badgeSize = options.legend.style.badgeSize;
        var fontSize = options.legend.style.fontSize;

        var series = undefined;
        if (statement.metric !== undefined) {
            $.each(allSeries, function(idx) {
                if (allSeries[idx].metric === statement.metric) {
                    series = allSeries[idx];
                }
            });

            if (series === undefined) {
                throw "No series with metric '" + statement.metric + "' was found.";
            }
        }

        var lastSymbol = "";
        var tokens = tokenizeStatement(statement);
        $.each(tokens, function(idx) {
            var token = tokens[idx];

            if (token.type === 'text') {

                drawText(legendCtx, fontSize, token.value);

            } else if (token.type === 'badge') {

                canvasCtx.fillStyle=series.color;
                canvasCtx.fillRect(legendCtx.x, legendCtx.y, badgeSize, badgeSize);

                canvasCtx.beginPath();
                canvasCtx.lineWidth="0.5";
                canvasCtx.strokeStyle="black";
                canvasCtx.rect(legendCtx.x, legendCtx.y, badgeSize, badgeSize);
                canvasCtx.stroke();

                legendCtx.x += badgeSize;

            } else if (token.type === 'newline') {

                legendCtx.y += options.legend.style.lineSpacing + Math.max(options.legend.style.badgeSize, options.legend.style.fontSize);
                legendCtx.x = legendCtx.xMin;

            } else if (token.type === 'unit') {

                if (lastSymbol === "") {
                    lastSymbol = " ";
                }

                drawText(legendCtx, fontSize, lastSymbol + " ");

            } else if (token.type === 'lf') {


                var value = reduceWithAggregate(statement.aggregation, series);
                var scaledValue = value;
                lastSymbol = "";

                if (!isNaN(value)) {
                    var prefix = d3.formatPrefix(value, token.precision);
                    lastSymbol = prefix.symbol;
                    scaledValue = prefix.scale(value);
                }

                var format = d3.format(token.length + "." + token.precision + "f");
                drawText(legendCtx, fontSize, format(scaledValue));

            } else {
                throw "Unsupported token: " + JSON.stringify(token);
            }
        });
    }

    function init(plot) {
        plot.hooks.processOptions.push(function (plot, options) {
            // Don't do anything if there are no statements in the legend
            if (options.legend.statements.length < 1) {
                return;
            }

            var legendHeight = calculateLegendHeight(options);
            options.grid.margin.bottom += legendHeight;

            plot.hooks.draw.push(function (plot, ctx) {
                var ctx = plot.getCanvas().getContext('2d');

                var legendCtx = {};
                legendCtx.canvasCtx = ctx;
                legendCtx.xMin = options.legend.margin.left;
                legendCtx.yMin = ctx.canvas.clientHeight - legendHeight + options.legend.margin.top;
                legendCtx.xMax = ctx.canvas.clientWidth - options.legend.margin.right;
                legendCtx.yMax = ctx.canvas.clientHeight - options.legend.margin.bottom;
                legendCtx.x = legendCtx.xMin;
                legendCtx.y = legendCtx.yMin;

                $.each(options.legend.statements, function(idx) {
                    drawStatement(legendCtx, options.legend.statements[idx], options, plot.getData());
                });

                ctx.save();
            });
        });
    }

    $.plot.plugins.push({
        init: init,
        options: options,
        name: 'legend',
        version: '1.0'
    });
})(jQuery);