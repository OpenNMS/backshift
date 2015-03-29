/**
 * Created by jwhite on 29/3/15.
 */

describe('Backshift.Utilities.RrdGraphConverter', function () {
  describe('.convert', function () {
    var rrdGraphConverter = new Backshift.Utilities.RrdGraphConverter();

    it('should convert graphs', function () {
      var mib2_tcpopen = {
        "name": "mib2.tcpopen",
        "title": "TCP Open Connections",
        "columns": [
          "tcpActiveOpens",
          "tcpPassiveOpens"
        ],
        "command": "--title=\"TCP Open Connections\" --vertical-label=\"TCP Opens Per Second\" DEF:actOpen={rrd1}:tcpActiveOpens:AVERAGE DEF:minActOpen={rrd1}:tcpActiveOpens:MIN DEF:maxActOpen={rrd1}:tcpActiveOpens:MAX DEF:passOpen={rrd2}:tcpPassiveOpens:AVERAGE DEF:minPassOpen={rrd2}:tcpPassiveOpens:MIN DEF:maxPassOpen={rrd2}:tcpPassiveOpens:MAX CDEF:negActOpen=0,actOpen,- AREA:passOpen#73d216 LINE1:passOpen#4e9a06:\"In (Passive)\" GPRINT:passOpen:AVERAGE:\"Avg  \\: %8.2lf %s\" GPRINT:passOpen:MIN:\"Min  \\: %8.2lf %s\" GPRINT:passOpen:MAX:\"Max  \\: %8.2lf %s\\n\" AREA:negActOpen#3465a4 LINE1:negActOpen#204a87:\"Out (Active)\" GPRINT:actOpen:AVERAGE:\"Avg  \\: %8.2lf %s\" GPRINT:actOpen:MIN:\"Min  \\: %8.2lf %s\" GPRINT:actOpen:MAX:\"Max  \\: %8.2lf %s\\n\"",
        "externalValues": [],
        "propertiesValues": [],
        "order": 36865,
        "types": [
          "nodeSnmp"
        ],
        "description": null,
        "width": null,
        "height": null,
        "suppress": []
      };

      var model = rrdGraphConverter.convert(mib2_tcpopen);
      expect( model.sources.length).toBe(1);
    });
  });
});
