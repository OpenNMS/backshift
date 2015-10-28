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
      expect(model.metrics.length).toBe(7);
      expect(model.series.length).toBe(5);

      expect(model.printStatements.length).toBe(8);
      expect(model.printStatements[0].value).toBe("%g In (Passive)");
      expect(model.printStatements[1].value).toBe("Avg  : %8.2lf %s");
      expect(model.printStatements[2].value).toBe("Min  : %8.2lf %s");
      expect(model.printStatements[3].value).toBe("Max  : %8.2lf %s\\n");

      expect(model.printStatements.length).toBe(8);
      expect(model.printStatements[0].value).toBe("%g In (Passive)");
      expect(model.printStatements[1].value).toBe("Avg  : %8.2lf %s");
      expect(model.printStatements[2].value).toBe("Min  : %8.2lf %s");
      expect(model.printStatements[3].value).toBe("Max  : %8.2lf %s\\n");

      expect(model.title).toBe("TCP Open Connections");
      expect(model.verticalLabel).toBe("TCP Opens Per Second");
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
        "CDEF:weirdTestThing=octOut,8,*,{ifSpeed},/,{ifSpeed},*,{ifSpeed},/,100,* " +
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
      expect(model.metrics.length).toBe(14);

      // Find a specific metric that reference a value from strings.properties
      var percentIn, weirdThing, metric, k, n = model.metrics.length;
      for (k = 0; k < n; k++) {
        metric = model.metrics[k];
        if (metric.name === "minPercentIn") {
          percentIn = metric;
        } else if (metric.name === "weirdTestThing") {
          weirdThing = metric;
        }
      }

      // make sure it parses and replaces prefixes
      expect(percentIn).toBeDefined();
      expect(percentIn.name).toBe("minPercentIn");
      expect(percentIn.expression).toBe("(((minOctIn * 8) / ifHCOutOctets.ifSpeed) * 100)");

      // make sure it parses and replaces prefixes in *multiple* tokens
      expect(weirdThing).toBeDefined();
      expect(weirdThing.expression).toBe("(((((octOut * 8) / ifHCOutOctets.ifSpeed) * ifHCOutOctets.ifSpeed) / ifHCOutOctets.ifSpeed) * 100)");

      expect(model.series.length).toBe(5);
      expect(model.printStatements.length).toBe(8);
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
        "AREA:usedBytes#c17d11:\"  Used (Other)\"  " +
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
      expect(model.metrics.length).toBe(39);
      expect(model.series.length).toBe(7);
      expect(model.printStatements.length).toBe(28);

      expect(model.series[0].name).toBe("Used (Other)");

      expect(model.title).toBe("System Memory Stats");
      expect(model.verticalLabel).toBe("Bytes");
    });


    it('should convert graphs', function () {
      var lmsensors_temp = {
        "name": "lmsensors.temp",
        "title": "lmSensors Temperature Sensor",
        "columns": [
          "lms-temp"
        ],
        "command": "--title=\"Temperature on {lms-tempdevice}\" DEF:dtemp={rrd1}:lms-temp:AVERAGE DEF:minDtemp={rrd1}:lms-temp:MIN DEF:maxDtemp={rrd1}:lms-temp:MAX CDEF:btemp=dtemp,1024,/ CDEF:minBtemp=minDtemp,1024,/ CDEF:maxBtemp=maxDtemp,1024,/ AREA:btemp#fcaf3e LINE1:btemp#f57900:\"Temperature\\:\" GPRINT:btemp:AVERAGE:\" Avg  \\: %8.2lf %s\" GPRINT:btemp:MIN:\"Min  \\: %8.2lf %s\" GPRINT:btemp:MAX:\"Max  \\: %8.2lf %s\\n\" ",
        "externalValues": [],
        "propertiesValues": [
          "lms-tempdevice"
        ],
        "order": 58631,
        "types": [
          "lmTempIndex"
        ],
        "description": null,
        "width": null,
        "height": null,
        "suppress": []
      };

      var rrdGraphConverter = new Backshift.Utilities.RrdGraphConverter({
        graphDef: lmsensors_temp,
        resourceId: 'node[1].nodeSnmp[]'
      });
      var model = rrdGraphConverter.model;
      expect(model.metrics.length).toBe(6);
      expect(model.series.length).toBe(2);
      expect(model.series[1].name).toBe("Temperature:");

      expect(model.title).toBe("Temperature on {lms-tempdevice}");
    });

    it('should convert strafeping', function () {
      var strafeping = {
        "name": "strafeping",
        "title": "StrafePing",
        "columns": [
          "strafeping"
        ],
        "command": "--title=\"StrafePing Response Time\" --height 200 --width 600 --alt-autoscale-max --alt-y-grid --lower-limit 0 --vertical-label Seconds DEF:ping1Micro={rrd1}:ping1:AVERAGE CDEF:ping1=ping1Micro,1000000,/ DEF:ping2Micro={rrd1}:ping2:AVERAGE CDEF:ping2=ping2Micro,1000000,/ DEF:ping3Micro={rrd1}:ping3:AVERAGE CDEF:ping3=ping3Micro,1000000,/ DEF:ping4Micro={rrd1}:ping4:AVERAGE CDEF:ping4=ping4Micro,1000000,/ DEF:ping5Micro={rrd1}:ping5:AVERAGE CDEF:ping5=ping5Micro,1000000,/ DEF:ping6Micro={rrd1}:ping6:AVERAGE CDEF:ping6=ping6Micro,1000000,/ DEF:ping7Micro={rrd1}:ping7:AVERAGE CDEF:ping7=ping7Micro,1000000,/ DEF:ping8Micro={rrd1}:ping8:AVERAGE CDEF:ping8=ping8Micro,1000000,/ DEF:ping9Micro={rrd1}:ping9:AVERAGE CDEF:ping9=ping9Micro,1000000,/ DEF:ping10Micro={rrd1}:ping10:AVERAGE CDEF:ping10=ping10Micro,1000000,/ DEF:ping11Micro={rrd1}:ping11:AVERAGE CDEF:ping11=ping11Micro,1000000,/ DEF:ping12Micro={rrd1}:ping12:AVERAGE CDEF:ping12=ping12Micro,1000000,/ DEF:ping13Micro={rrd1}:ping13:AVERAGE CDEF:ping13=ping13Micro,1000000,/ DEF:ping14Micro={rrd1}:ping14:AVERAGE CDEF:ping14=ping14Micro,1000000,/ DEF:ping15Micro={rrd1}:ping15:AVERAGE CDEF:ping15=ping15Micro,1000000,/ DEF:ping16Micro={rrd1}:ping16:AVERAGE CDEF:ping16=ping16Micro,1000000,/ DEF:ping17Micro={rrd1}:ping17:AVERAGE CDEF:ping17=ping17Micro,1000000,/ DEF:ping18Micro={rrd1}:ping18:AVERAGE CDEF:ping18=ping18Micro,1000000,/ DEF:ping19Micro={rrd1}:ping19:AVERAGE CDEF:ping19=ping19Micro,1000000,/ DEF:ping20Micro={rrd1}:ping20:AVERAGE CDEF:ping20=ping20Micro,1000000,/ CDEF:cp1=ping1,0,0.14290626,LIMIT CDEF:cp2=ping2,0,0.14290626,LIMIT CDEF:cp3=ping3,0,0.14290626,LIMIT CDEF:cp4=ping4,0,0.14290626,LIMIT CDEF:cp5=ping5,0,0.14290626,LIMIT CDEF:cp6=ping6,0,0.14290626,LIMIT CDEF:cp7=ping7,0,0.14290626,LIMIT CDEF:cp8=ping8,0,0.14290626,LIMIT CDEF:cp9=ping9,0,0.14290626,LIMIT CDEF:cp10=ping10,0,0.14290626,LIMIT CDEF:cp11=ping11,0,0.14290626,LIMIT CDEF:cp12=ping12,0,0.14290626,LIMIT CDEF:cp13=ping13,0,0.14290626,LIMIT CDEF:cp14=ping14,0,0.14290626,LIMIT CDEF:cp15=ping15,0,0.14290626,LIMIT CDEF:cp16=ping16,0,0.14290626,LIMIT CDEF:cp17=ping17,0,0.14290626,LIMIT CDEF:cp18=ping18,0,0.14290626,LIMIT CDEF:cp19=ping19,0,0.14290626,LIMIT CDEF:cp20=ping20,0,0.14290626,LIMIT DEF:loss={rrd1}:loss:AVERAGE DEF:maxLoss={rrd1}:loss:MAX AREA:cp20#f0f0f0 AREA:cp19#dddddd AREA:cp18#cacaca AREA:cp17#b7b7b7 AREA:cp16#a4a4a4 AREA:cp15#919191 AREA:cp14#7e7e7e AREA:cp13#6b6b6b AREA:cp12#585858 AREA:cp11#454545 AREA:cp10#535353 AREA:cp9#666666 AREA:cp8#797979 AREA:cp7#8c8c8c AREA:cp6#9f9f9f AREA:cp5#b2b2b2 AREA:cp4#c5c5c5 AREA:cp3#d8d8d8 AREA:cp2#ebebeb AREA:cp1#fefefe DEF:medianMicro={rrd1}:median:AVERAGE CDEF:median=medianMicro,1000000,/ CDEF:ploss=loss,20,/,100,* CDEF:maxPloss=maxLoss,20,/,100,* GPRINT:median:AVERAGE:\"Median RTT (%.1lf %ss avg)\" LINE1:median#202020 CDEF:me0=loss,-1,GT,loss,0,LE,*,1,UNKN,IF,median,* CDEF:meL0=me0,0.0007145313,- CDEF:meH0=me0,0,*,0.0007145313,2,*,+ AREA:meL0 STACK:meH0#26ff00:0 CDEF:me1=loss,0,GT,loss,1,LE,*,1,UNKN,IF,median,* CDEF:meL1=me1,0.0007145313,- CDEF:meH1=me1,0,*,0.0007145313,2,*,+ AREA:meL1 STACK:meH1#00b8ff:1/20 CDEF:me2=loss,1,GT,loss,2,LE,*,1,UNKN,IF,median,* CDEF:meL2=me2,0.0007145313,- CDEF:meH2=me2,0,*,0.0007145313,2,*,+ AREA:meL2 STACK:meH2#0059ff:2/20 CDEF:me3=loss,2,GT,loss,3,LE,*,1,UNKN,IF,median,* CDEF:meL3=me3,0.0007145313,- CDEF:meH3=me3,0,*,0.0007145313,2,*,+ AREA:meL3 STACK:meH3#5e00ff:3/20 CDEF:me4=loss,3,GT,loss,4,LE,*,1,UNKN,IF,median,* CDEF:meL4=me4,0.0007145313,- CDEF:meH4=me4,0,*,0.0007145313,2,*,+ AREA:meL4 STACK:meH4#7e00ff:4/20 CDEF:me10=loss,4,GT,loss,10,LE,*,1,UNKN,IF,median,* CDEF:meL10=me10,0.0007145313,- CDEF:meH10=me10,0,*,0.0007145313,2,*,+ AREA:meL10 STACK:meH10#dd00ff:10/20 CDEF:me19=loss,10,GT,loss,19,LE,*,1,UNKN,IF,median,* CDEF:meL19=me19,0.0007145313,- CDEF:meH19=me19,0,*,0.0007145313,2,*,+ AREA:meL19 STACK:meH19#ff0000:19/20 COMMENT:\"\\l\" GPRINT:ploss:AVERAGE:\"Packet Loss\\: %.2lf %% average\" GPRINT:maxPloss:MAX:\"%.2lf %% maximum\" GPRINT:ploss:LAST:\"%.2lf %% current\\l\" COMMENT:\"\\s\"",
        "externalValues": [],
        "propertiesValues": [],
        "order": 15,
        "types": [
          "responseTime",
          "distributedStatus"
        ],
        "description": null,
        "width": null,
        "height": null,
        "suppress": []
      };

      var rrdGraphConverter = new Backshift.Utilities.RrdGraphConverter({
        graphDef: strafeping,
        resourceId: 'node[1].responseTime[127.0.0.1]'
      });
      var model = rrdGraphConverter.model;

      expect(model.metrics.length).toBe(87);
      expect(model.series.length).toBe(37);
      expect(model.printStatements.length).toBe(13);

      expect(model.metrics[0].name).toBe("ping1Micro");
      expect(model.metrics[0].attribute).toBe("strafeping");
      expect(model.metrics[0].datasource).toBe("ping1");

      expect(model.title).toBe("StrafePing Response Time");
    });

  });
});
