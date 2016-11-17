Backshift.namespace('Backshift.Utilities.RrdGraphConverter');

Backshift.Utilities.RrdGraphVisitor = Backshift.Class.create({
  initialize: function (args) {
    this.onInit(args);
  },

  onInit: function (args) {
    // Defined by subclasses
  },

  _visit: function (graphDef) {
    // Inspired from http://krasimirtsonev.com/blog/article/Simple-command-line-parser-in-JavaScript
    var CommandLineParser = (function () {
      var parse = function (str, lookForQuotes) {
        var args = [];
        var readingPart = false;
        var part = '';
        var n = str.length;
        for (var i = 0; i < n; i++) {
          if (str.charAt(i) === ' ' && !readingPart) {
            args.push(part);
            part = '';
          } else {
            if (str.charAt(i) === '\"' && lookForQuotes) {
              readingPart = !readingPart;
              part += str.charAt(i);
            } else {
              part += str.charAt(i);
            }
          }
        }
        args.push(part);
        return args;
      };
      return {
        parse: parse
      }
    })();

    var i, args, command, name, path, dsName, consolFun, rpnExpression, subParts, width, srcName,
        color, legend, aggregation, value, seriesName;
    var parts = CommandLineParser.parse(graphDef.command, true);
    var n = parts.length;
    for (i = 0; i < n; i++) {
      if (parts[i].indexOf("--") === 0) {
        args = /--(.*)=(.*)/.exec(parts[i]);
        if (args === null) {
          continue;
        }

        if (args[1] === "title") {
          this._onTitle(this.displayString(this._decodeString(args[2])));
        } else if (args[1] === "vertical-label") {
          this._onVerticalLabel(this.displayString(this._decodeString(args[2])));
        }
      }

      args = parts[i].match(/(\\.|[^:])+/g);
      if (args === null) {
        continue;
      }
      command = args[0];

      if (command === "DEF") {
        subParts = args[1].split("=");
        name = subParts[0];
        path = subParts[1];
        dsName = args[2];
        consolFun = args[3];
        this._onDEF(name, path, dsName, consolFun);
      } else if (command === "CDEF") {
        subParts = args[1].split("=");
        name = subParts[0];
        rpnExpression = subParts[1];
        this._onCDEF(name, rpnExpression);
      } else if (command === "VDEF") {
        subParts = args[1].split("=");
        name = subParts[0];
        rpnExpression = subParts[1];
        this._onVDEF(name, rpnExpression);
      } else if (command.match(/LINE/)) {
        width = parseInt(/LINE(\d+)/.exec(command));
        subParts = args[1].split("#");
        srcName = subParts[0];
        color = '#' + subParts[1];
        legend = this._decodeString(args[2]);
        this._onLine(srcName, color, legend, width);
      } else if (command === "AREA") {
        subParts = args[1].split("#");
        srcName = subParts[0];
        color = '#' + subParts[1];
        legend = this._decodeString(args[2]);
        this._onArea(srcName, color, legend);
      } else if (command === "STACK") {
        subParts = args[1].split("#");
        srcName = subParts[0];
        color = '#' + subParts[1];
        legend = this._decodeString(args[2]);
        this._onStack(srcName, color, legend);
      } else if (command === "GPRINT") {
        if (args.length == 3) {
          srcName = args[1];
          aggregation = undefined;
          value = this._decodeString(args[2]);
        } else {
          srcName = args[1];
          aggregation = args[2];
          value = this._decodeString(args[3]);
        }
        this._onGPrint(srcName, aggregation, value);
      } else if (command === "COMMENT") {
        value = this._decodeString(args[1]);
        this._onComment(value);
      }
    }
  },
  _onTitle: function (title) {

  },
  _onVerticalLabel: function (label) {

  },
  _onDEF: function (name, path, dsName, consolFun) {

  },
  _onCDEF: function (name, rpnExpression) {

  },
  _onVDEF: function (name, rpnExpression) {

  },
  _onLine: function (srcName, color, legend, width) {

  },
  _onArea: function (srcName, color, legend) {

  },
  _onStack: function (srcName, color, legend) {

  },
  _onGPrint: function (srcName, aggregation, value) {

  },
  _onComment: function (value) {

  },
  _seriesName: function(string) {

  },
  _decodeString: function (string) {
    if (string === undefined) {
      return string;
    }

    // Remove any quotes
    string = string.replace(/"/g, '');
    // Replace escaped colons
    string = string.replace("\\:", ':');

    return string;
  },
  displayString: function (string) {
    if (string === undefined) {
      return string;
    }

    // Remove any newlines
    string = string.replace("\\n", '');
    // Remove any leading/trailing whitespace
    string = string.trim();
    return string;
  }
});
