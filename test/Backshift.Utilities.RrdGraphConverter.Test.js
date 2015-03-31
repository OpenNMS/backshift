/**
 * Created by jwhite on 29/3/15.
 */

describe('Backshift.Utilities.RrdGraphConverter', function () {
  describe('.convert', function () {
    it('should convert graphs', function () {
      var mib2_tcpopen = {
        "name": "mib2.tcpopen",
        "title": "TCP Open Connections",
        "columns": [
          "tcpActiveOpens",
          "tcpPassiveOpens"
        ],
        "command": "--title=\"TCP Open Connections\" --vertical-label=\"TCP Opens Per Second\" " +
          "DEF:actOpen={rrd1}:tcpActiveOpens:AVERAGE " +
          "DEF:minActOpen={rrd1}:tcpActiveOpens:MIN " +
          "DEF:maxActOpen={rrd1}:tcpActiveOpens:MAX " +
          "DEF:passOpen={rrd2}:tcpPassiveOpens:AVERAGE " +
          "DEF:minPassOpen={rrd2}:tcpPassiveOpens:MIN " +
          "DEF:maxPassOpen={rrd2}:tcpPassiveOpens:MAX " +
          "CDEF:negActOpen=0,actOpen,- " +
          "AREA:passOpen#73d216 " +
          "LINE1:passOpen#4e9a06:\"In (Passive)\" " +
          "GPRINT:passOpen:AVERAGE:\"Avg  \\: %8.2lf %s\" " +
          "GPRINT:passOpen:MIN:\"Min  \\: %8.2lf %s\" " +
          "GPRINT:passOpen:MAX:\"Max  \\: %8.2lf %s\\n\" " +
          "AREA:negActOpen#3465a4 " +
          "LINE1:negActOpen#204a87:\"Out (Active)\" " +
          "GPRINT:actOpen:AVERAGE:\"Avg  \\: %8.2lf %s\" " +
          "GPRINT:actOpen:MIN:\"Min  \\: %8.2lf %s\" " +
          "GPRINT:actOpen:MAX:\"Max  \\: %8.2lf %s\\n\" ",
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

      var rrdGraphConverter = new Backshift.Utilities.RrdGraphConverter({
        graphDef: mib2_tcpopen,
        resourceId: 'node[1].nodeSnmp[]'
      });
      var model = rrdGraphConverter.model;
      expect(model.sources.length).toBe(7);
      expect(model.series.length).toBe(4);
    });

    it('should convert graphs', function () {
      var mib2_hc_traffic_in_out = {
        "name": "mib2.HCtraffic-inout",
        "title": "InOut Traffic (High Speed)",
        "columns": [
          "ifHCInOctets",
          "ifHCOutOctets"
        ],
        "command": "--title=\"In/Out Traffic Utilization (High Speed)\" --vertical-label=\"Percent utilization\" " +
        "DEF:octIn={rrd1}:ifHCInOctets:AVERAGE " +
        "DEF:minOctIn={rrd1}:ifHCInOctets:MIN " +
        "DEF:maxOctIn={rrd1}:ifHCInOctets:MAX " +
        "DEF:octOut={rrd2}:ifHCOutOctets:AVERAGE " +
        "DEF:minOctOut={rrd2}:ifHCOutOctets:MIN " +
        "DEF:maxOctOut={rrd2}:ifHCOutOctets:MAX " +
        "CDEF:percentIn=octIn,8,*,{ifSpeed},/,100,* " +
        "CDEF:minPercentIn=minOctIn,8,*,{ifSpeed},/,100,* " +
        "CDEF:maxPercentIn=maxOctIn,8,*,{ifSpeed},/,100,* " +
        "CDEF:percentOut=octOut,8,*,{ifSpeed},/,100,* " +
        "CDEF:minPercentOut=minOctOut,8,*,{ifSpeed},/,100,* " +
        "CDEF:maxPercentOut=maxOctOut,8,*,{ifSpeed},/,100,* " +
        "CDEF:percentOutNeg=0,percentOut,- AREA:percentIn#73d216 " +
        "LINE1:percentIn#4e9a06:\"In \" " +
        "GPRINT:percentIn:AVERAGE:\"Avg \\: %8.2lf %s\" " +
        "GPRINT:percentIn:MIN:\"Min \\: %8.2lf %s\" " +
        "GPRINT:percentIn:MAX:\"Max \\: %8.2lf %s\\n\" " +
        "AREA:percentOutNeg#729fcf LINE1:percentOutNeg#3465a4:\"Out\" " +
        "GPRINT:percentOut:AVERAGE:\"Avg \\: %8.2lf %s\" " +
        "GPRINT:percentOut:MIN:\"Min \\: %8.2lf %s\" " +
        "GPRINT:percentOut:MAX:\"Max \\: %8.2lf %s\\n\" ",
        "externalValues": [],
        "propertiesValues": [
          "ifSpeed"
        ],
        "order": 23797,
        "types": [
          "interfaceSnmp"
        ],
        "description": null,
        "width": null,
        "height": null,
        "suppress": [
          "mib2.traffic-inout"
        ]
      };

      var rrdGraphConverter = new Backshift.Utilities.RrdGraphConverter({
        graphDef: mib2_hc_traffic_in_out,
        resourceId: 'node[1].nodeSnmp[]'
      });
      var model = rrdGraphConverter.model;
      expect(model.sources.length).toBe(13);

      // Find a specific source that reference a value from strings.properties
      var source, k, n = model.sources.length;
      for (k = 0; k < n; k++) {
        source = model.sources[k];
        if (source.name === "minPercentIn") {
          break;
        }
      }
      expect(source.name).toBe("minPercentIn");
      expect(source.expression).toBe("(((minOctIn * 8) / ifSpeed) * 100)");

      expect(model.series.length).toBe(4);
    });

    it('should convert graphs', function () {
      var netsnmp_memStats = {
        "name": "netsnmp.memStats",
        "title": "System Memory Stats",
        "columns": [
          "memAvailSwap",
          "memTotalReal",
          "memAvailReal",
          "memBuffer",
          "memCached",
          "memShared"
        ],
        "command": "--title=\"System Memory Stats\" --width 565 --height 200 --lower-limit 0 --base=1024 --vertical-label=\"Bytes\" " +
        "DEF:memavailswap={rrd1}:memAvailSwap:AVERAGE " +
        "DEF:minMemavailswap={rrd1}:memAvailSwap:MIN " +
        "DEF:maxMemavailswap={rrd1}:memAvailSwap:MAX " +
        "DEF:memtotalreal={rrd2}:memTotalReal:AVERAGE " +
        "DEF:minMemtotalreal={rrd2}:memTotalReal:MIN " +
        "DEF:maxMemtotalreal={rrd2}:memTotalReal:MAX " +
        "DEF:memavailreal={rrd3}:memAvailReal:AVERAGE " +
        "DEF:minMemavailreal={rrd3}:memAvailReal:MIN " +
        "DEF:maxMemavailreal={rrd3}:memAvailReal:MAX " +
        "DEF:membuffer={rrd4}:memBuffer:AVERAGE " +
        "DEF:minMembuffer={rrd4}:memBuffer:MIN " +
        "DEF:maxMembuffer={rrd4}:memBuffer:MAX " +
        "DEF:memcached={rrd5}:memCached:AVERAGE " +
        "DEF:minMemcached={rrd5}:memCached:MIN " +
        "DEF:maxMemcached={rrd5}:memCached:MAX " +
        "DEF:memshared={rrd6}:memShared:AVERAGE " +
        "DEF:minMemshared={rrd6}:memShared:MIN " +
        "DEF:maxMemshared={rrd6}:memShared:MAX " +
        "CDEF:memavailswapBytes=memavailswap,1024,* " +
        "CDEF:minMemavailswapBytes=minMemavailswap,1024,* " +
        "CDEF:maxMemavailswapBytes=maxMemavailswap,1024,* " +
        "CDEF:memtotalrealBytes=memtotalreal,1024,* " +
        "CDEF:minMemtotalrealBytes=minMemtotalreal,1024,* " +
        "CDEF:maxMemtotalrealBytes=maxMemtotalreal,1024,* " +
        "CDEF:memavailrealBytes=memavailreal,1024,* " +
        "CDEF:minMemavailrealBytes=minMemavailreal,1024,* " +
        "CDEF:maxMemavailrealBytes=maxMemavailreal,1024,* " +
        "CDEF:membufferBytes=membuffer,1024,* " +
        "CDEF:minMembufferBytes=minMembuffer,1024,* " +
        "CDEF:maxMembufferBytes=maxMembuffer,1024,* " +
        "CDEF:memcachedBytes=memcached,1024,* " +
        "CDEF:minMemcachedBytes=minMemcached,1024,* " +
        "CDEF:maxMemcachedBytes=maxMemcached,1024,* " +
        "CDEF:memsharedBytes=memshared,UN,0,memshared,IF,1024,* " +
        "CDEF:minMemsharedBytes=minMemshared,UN,0,minMemshared,IF,1024,* " +
        "CDEF:maxMemsharedBytes=maxMemshared,UN,0,maxMemshared,IF,1024,* " +
        "CDEF:usedBytes=memtotalrealBytes,membufferBytes,-,memcachedBytes,-,memsharedBytes,-,memavailrealBytes,- " +
        "CDEF:minUsedBytes=minMemtotalrealBytes,minMembufferBytes,-,minMemcachedBytes,-,minMemsharedBytes,-,minMemavailrealBytes,- " +
        "CDEF:maxUsedBytes=maxMemtotalrealBytes,maxMembufferBytes,-,maxMemcachedBytes,-,maxMemsharedBytes,-,maxMemavailrealBytes,- " +
        "AREA:usedBytes#c17d11:\"Used (Other)\" " +
        "GPRINT:usedBytes:AVERAGE:\"    Avg  \\: %8.2lf %s\" " +
        "GPRINT:usedBytes:MIN:\"Min  \\: %8.2lf %s\" " +
        "GPRINT:usedBytes:MAX:\"Max  \\: %8.2lf %s\\n\" " +
        "STACK:membufferBytes#edd400:\"IO Buff Ram \" " +
        "GPRINT:membufferBytes:AVERAGE:\"    Avg  \\: %8.2lf %s\" " +
        "GPRINT:membufferBytes:MIN:\"Min  \\: %8.2lf %s\" " +
        "GPRINT:membufferBytes:MAX:\"Max  \\: %8.2lf %s\\n\" " +
        "STACK:memsharedBytes#000a44:\"Shared Mem    \" " +
        "GPRINT:memsharedBytes:AVERAGE:\"  Avg  \\: %8.2lf %s\" " +
        "GPRINT:memsharedBytes:MIN:\"Min  \\: %8.2lf %s\" " +
        "GPRINT:memsharedBytes:MAX:\"Max  \\: %8.2lf %s\\n\" " +
        "STACK:memcachedBytes#4e9a06:\"Filesystem Cache\" " +
        "GPRINT:memcachedBytes:AVERAGE:\"Avg  \\: %8.2lf %s\" " +
        "GPRINT:memcachedBytes:MIN:\"Min  \\: %8.2lf %s\" " +
        "GPRINT:memcachedBytes:MAX:\"Max  \\: %8.2lf %s\\n\" " +
        "STACK:memavailrealBytes#8ae234:\"Avail Real Mem\" " +
        "GPRINT:memavailrealBytes:AVERAGE:\"  Avg  \\: %8.2lf %s\" " +
        "GPRINT:memavailrealBytes:MIN:\"Min  \\: %8.2lf %s\" " +
        "GPRINT:memavailrealBytes:MAX:\"Max  \\: %8.2lf %s\\n\" " +
        "STACK:memavailswapBytes#cc0000:\"Total Swap    \" " +
        "GPRINT:memavailswapBytes:AVERAGE:\"  Avg  \\: %8.2lf %s\" " +
        "GPRINT:memavailswapBytes:MIN:\"Min  \\: %8.2lf %s\" " +
        "GPRINT:memavailswapBytes:MAX:\"Max  \\: %8.2lf %s\\n\" " +
        "LINE2:memtotalrealBytes#204a87:\"Total Real Mem\" " +
        "GPRINT:memtotalrealBytes:AVERAGE:\"  Avg  \\: %8.2lf %s\" " +
        "GPRINT:memtotalrealBytes:MIN:\"Min  \\: %8.2lf %s\" " +
        "GPRINT:memtotalrealBytes:MAX:\"Max  \\: %8.2lf %s\\n\" ",
        "externalValues": [],
        "propertiesValues": [],
        "order": 682,
        "types": [
          "nodeSnmp"
        ],
        "description": null,
        "width": 565,
        "height": 200,
        "suppress": [
          "netsnmp.memStatsNoShared"
        ]
      };

      var rrdGraphConverter = new Backshift.Utilities.RrdGraphConverter({
        graphDef: netsnmp_memStats,
        resourceId: 'node[1].nodeSnmp[]'
      });
      var model = rrdGraphConverter.model;
      expect(model.sources.length).toBe(39);
      expect(model.series.length).toBe(7);
    });
  });
});
