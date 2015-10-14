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
            } else if (statement.value.slice(i, -1).match(/^%\d+\.\d+lf/)) {
                var slice = statement.value.slice(i, -1);

                var regex = /^%(\d+)\.(\d+)lf/;

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
                    length: parseInt(length),
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

       // console.log("'" + statement.value + "'");
       // console.log(JSON.stringify(tokens));

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
                // TODO: The GPRINT statements may reference a DEF which is not included a series, Eugh.
                console.log("No series with metric '" + statement.metric + "' was found. Skipping.");
                return;
            }
        }

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

                drawText(legendCtx, fontSize, "M ");

            } else if (token.type === 'lf') {

                var num = Array(token.length + 1).join('X');
                num += ".";
                num += Array(token.precision + 1).join('Y');

                drawText(legendCtx, fontSize, num);

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