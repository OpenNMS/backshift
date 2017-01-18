/**
 * Created by jwhite on 6/6/14.
 */

describe('Backshift.DataSource.NRTG', function () {

  describe('_metricMappingsToColumns', function() {
    it('should order the mappings by rrd index', function () {
      var ds = new Backshift.DataSource.NRTG({
        url: "http://127.0.0.1:8980/opennms/nrt/starter",
        metrics: [{
          resourceId: 'node[1].nodeSnmp[]',
          report: 'mib2.tcpopen'
        }]
      });

      var columns = ds._metricMappingsToColumns({
        ".1.3.6.1.4.1.2021.4.13.0": "{rrd6}:memShared",
        ".1.3.6.1.4.1.2021.4.14.0": "{rrd4}:memBuffer",
        ".1.3.6.1.4.1.2021.4.5.0": "{rrd2}:memTotalReal",
        ".1.3.6.1.4.1.2021.4.6.0": "{rrd3}:memAvailReal",
        ".1.3.6.1.4.1.2021.4.15.0": "{rrd5}:memCached",
        ".1.3.6.1.4.1.2021.4.4.0": "{rrd1}:memAvailSwap"
      });

      expect(columns.length).toBe(6);
      expect(columns[0]).toBe(".1.3.6.1.4.1.2021.4.4.0");
      expect(columns[1]).toBe(".1.3.6.1.4.1.2021.4.5.0");
      expect(columns[2]).toBe(".1.3.6.1.4.1.2021.4.6.0");
      expect(columns[3]).toBe(".1.3.6.1.4.1.2021.4.14.0");
      expect(columns[4]).toBe(".1.3.6.1.4.1.2021.4.15.0");
      expect(columns[5]).toBe(".1.3.6.1.4.1.2021.4.13.0");
    })
  });

  it('can stream measurements from NRTG data for simple graph', function (done) {
    var nrtgCollectionDetails = {
      "collectionTaskId": "NrtCollectionTaskId_1448666190626",
      "rrdGraphString": "--watermark=\"NRTG Alpha 1.0\" --slope-mode --width=960 --height=400 " +
        "--title=\"TCP Open Connections\" " +
        "--vertical-label=\"TCP Opens Per Second\" " +
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
        "GPRINT:actOpen:MAX:\"Max  \\: %8.2lf %s\\n\"",
      "metricsMapping": {
        ".1.3.6.1.2.1.6.5.0": "{rrd1}:tcpActiveOpens",
        ".1.3.6.1.2.1.6.6.0": "{rrd2}:tcpPassiveOpens"
      }
    };

    var measurementSets = {
      "measurement_sets": [
        [{
          "metricId": ".1.3.6.1.2.1.6.5.0",
          "metricType": "counter32",
          "netInterface": "127.0.0.1",
          "nodeId": 1,
          "service": "SNMP",
          "timeStamp": 1448656996747,
          "onmsLogicMetricId": "node[1].nodeSnmp[].tcpActiveOpens",
          "value": 11610
        }, {
          "metricId": ".1.3.6.1.2.1.6.6.0",
          "metricType": "counter32",
          "netInterface": "127.0.0.1",
          "nodeId": 1,
          "service": "SNMP",
          "timeStamp": 1448656996747,
          "onmsLogicMetricId": "node[1].nodeSnmp[].tcpPassiveOpens",
          "value": 3251
        }],
        [{
          "metricId": ".1.3.6.1.2.1.6.5.0",
          "metricType": "counter32",
          "netInterface": "127.0.0.1",
          "nodeId": 1,
          "service": "SNMP",
          "timeStamp": 1448656997749,
          "onmsLogicMetricId": "node[1].nodeSnmp[].tcpActiveOpens",
          "value": 11710
        }, {
          "metricId": ".1.3.6.1.2.1.6.6.0",
          "metricType": "counter32",
          "netInterface": "127.0.0.1",
          "nodeId": 1,
          "service": "SNMP",
          "timeStamp": 1448656997749,
          "onmsLogicMetricId": "node[1].nodeSnmp[].tcpPassiveOpens",
          "value": 3276
        }]
      ]
    };

    var requestNumber = 0;
    spyOn(jQuery, "ajax").and.callFake(function (params) {
      requestNumber += 1;
      if (requestNumber === 1) {
        // Verify the URL
        expect(params.url).toBe("http://127.0.0.1:8980/opennms/nrt/starter");

        expect(params.data.resourceId).toBe('node[1].nodeSnmp[]');
        expect(params.data.report).toBe('mib2.tcpopen');

        // Return the fixed collection details
        params.success(nrtgCollectionDetails);
      } else if (requestNumber === 2) {
        // Verify the URL
        expect(params.url).toBe("http://127.0.0.1:8980/opennms/nrt/starter");

        expect(params.data.poll).toBe(true);
        expect(params.data.nrtCollectionTaskId).toBe('NrtCollectionTaskId_1448666190626');

        // Return the fixed measurement set
        params.success(measurementSets);
      }
    });

    var callback = function(results) {
      expect(results.columnNames.length).toBe(4);
      expect("timestamp" in results.columnNameToIndex).toBeTruthy();
      expect("passOpen" in results.columnNameToIndex).toBeTruthy();
      expect("negActOpen" in results.columnNameToIndex).toBeTruthy();
      expect("actOpen" in results.columnNameToIndex).toBeTruthy();

      var id = results.columnNameToIndex["timestamp"];
      expect(results.columns[id].length).toBe(2);
      expect(results.columns[id][0]).toBe(1448656996747);
      expect(results.columns[id][1]).toBe(1448656997749);

      id = results.columnNameToIndex["actOpen"];
      expect(results.columns[id].length).toBe(2);
      expect(results.columns[id][0]).toBeNaN();
      expect(results.columns[id][1]).toBeCloseTo(100,0.2);

      id = results.columnNameToIndex["negActOpen"];
      expect(results.columns[id].length).toBe(2);
      expect(results.columns[id][0]).toBeNaN();
      expect(results.columns[id][1]).toBeCloseTo(-100,0.2);

      ds.stopStreaming();
      done();
    };

    var ds = new Backshift.DataSource.NRTG({
      url: "http://127.0.0.1:8980/opennms/nrt/starter",
      metrics: [{
        resourceId: 'node[1].nodeSnmp[]',
        report: 'mib2.tcpopen'
      }],
      callback: callback
    });

    ds.startStreaming();
  });

  it('can calculate rates', function() {
      var ds = new Backshift.DataSource.NRTG({
          pollingInterval: 1000,
          metrics: [{
              resourceId: 'node[1].nodeSnmp[]',
              report: 'mib2.tcpopen'
          }]
      });
      // Both null
      expect(ds._calculateRate(null, null)).toBeNaN();
      // One null
      expect(ds._calculateRate(null, {value: 1, timeStamp: 1000})).toBeNaN();
      expect(ds._calculateRate({value: 1, timeStamp: 1000}, null)).toBeNaN();
      // One NaN
      expect(ds._calculateRate({value: NaN, timeStamp: 1000}, {value: 1, timeStamp: 1001})).toBeNaN();
      // Same value should always give 0
      expect(ds._calculateRate({value: 1, timeStamp: 1000}, {value: 1, timeStamp: 1001})).toBe(0);
      // Non-zero rates
      expect(ds._calculateRate({value: 0, timeStamp: 1000}, {value: 1000, timeStamp: 2000})).toBe(1000);
      expect(ds._calculateRate({value: 500, timeStamp: 1000}, {value: 2500, timeStamp: 2000})).toBe(2000);
      // Same values as above, but with an interval of 2000ms instead of 1000ms
      expect(ds._calculateRate({value: 0, timeStamp: 1000}, {value: 1000, timeStamp: 3000})).toBe(500);
      expect(ds._calculateRate({value: 500, timeStamp: 1000}, {value: 2500, timeStamp: 3000})).toBe(1000);
  });

  it('can stream measurements from NRTG data for complex graph', function (done) {
    var nrtgCollectionDetails = {
      "collectionTaskId": "NrtCollectionTaskId_1448733509054",
      "rrdGraphString": "--watermark=\"NRTG Alpha 1.0\" --slope-mode --width=960 --height=400 --title=\"System Memory Stats\" " +
        "--width 565 --height 200 --lower-limit 0 --base=1024 --vertical-label=\"Bytes\" " +
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
        "GPRINT:memtotalrealBytes:MAX:\"Max  \\: %8.2lf %s\\n\"",
      "metricsMapping": {
        ".1.3.6.1.4.1.2021.4.13.0": "{rrd6}:memShared",
        ".1.3.6.1.4.1.2021.4.14.0": "{rrd4}:memBuffer",
        ".1.3.6.1.4.1.2021.4.5.0": "{rrd2}:memTotalReal",
        ".1.3.6.1.4.1.2021.4.6.0": "{rrd3}:memAvailReal",
        ".1.3.6.1.4.1.2021.4.15.0": "{rrd5}:memCached",
        ".1.3.6.1.4.1.2021.4.4.0": "{rrd1}:memAvailSwap"
      }
    };

    var measurementSets = {
      "measurement_sets": [
      [{
        "metricId": ".1.3.6.1.4.1.2021.4.4.0",
        "metricType": "int32",
        "netInterface": "127.0.0.1",
        "nodeId": 1,
        "service": "SNMP",
        "timeStamp": 1448733509065,
        "onmsLogicMetricId": "node[1].nodeSnmp[].memAvailSwap",
        "value": 16457724
      }, {
        "metricId": ".1.3.6.1.4.1.2021.4.13.0",
        "metricType": "int32",
        "netInterface": "127.0.0.1",
        "nodeId": 1,
        "service": "SNMP",
        "timeStamp": 1448733509065,
        "onmsLogicMetricId": "node[1].nodeSnmp[].memShared",
        "value": 1225336
      }, {
        "metricId": ".1.3.6.1.4.1.2021.4.14.0",
        "metricType": "int32",
        "netInterface": "127.0.0.1",
        "nodeId": 1,
        "service": "SNMP",
        "timeStamp": 1448733509065,
        "onmsLogicMetricId": "node[1].nodeSnmp[].memBuffer",
        "value": 348660
      }, {
        "metricId": ".1.3.6.1.4.1.2021.4.6.0",
        "metricType": "int32",
        "netInterface": "127.0.0.1",
        "nodeId": 1,
        "service": "SNMP",
        "timeStamp": 1448733509065,
        "onmsLogicMetricId": "node[1].nodeSnmp[].memAvailReal",
        "value": 23059136
      }, {
        "metricId": ".1.3.6.1.4.1.2021.4.15.0",
        "metricType": "int32",
        "netInterface": "127.0.0.1",
        "nodeId": 1,
        "service": "SNMP",
        "timeStamp": 1448733509065,
        "onmsLogicMetricId": "node[1].nodeSnmp[].memCached",
        "value": 5139736
      }, {
        "metricId": ".1.3.6.1.4.1.2021.4.5.0",
        "metricType": "int32",
        "netInterface": "127.0.0.1",
        "nodeId": 1,
        "service": "SNMP",
        "timeStamp": 1448733509065,
        "onmsLogicMetricId": "node[1].nodeSnmp[].memTotalReal",
        "value": 32824488
      }],
      [{
        "metricId": ".1.3.6.1.4.1.2021.4.4.0",
        "metricType": "int32",
        "netInterface": "127.0.0.1",
        "nodeId": 1,
        "service": "SNMP",
        "timeStamp": 1448733509091,
        "onmsLogicMetricId": "node[1].nodeSnmp[].memAvailSwap",
        "value": 16457724
      }, {
        "metricId": ".1.3.6.1.4.1.2021.4.13.0",
        "metricType": "int32",
        "netInterface": "127.0.0.1",
        "nodeId": 1,
        "service": "SNMP",
        "timeStamp": 1448733509091,
        "onmsLogicMetricId": "node[1].nodeSnmp[].memShared",
        "value": 1225336
      }, {
        "metricId": ".1.3.6.1.4.1.2021.4.14.0",
        "metricType": "int32",
        "netInterface": "127.0.0.1",
        "nodeId": 1,
        "service": "SNMP",
        "timeStamp": 1448733509091,
        "onmsLogicMetricId": "node[1].nodeSnmp[].memBuffer",
        "value": 348660
      }, {
        "metricId": ".1.3.6.1.4.1.2021.4.6.0",
        "metricType": "int32",
        "netInterface": "127.0.0.1",
        "nodeId": 1,
        "service": "SNMP",
        "timeStamp": 1448733509091,
        "onmsLogicMetricId": "node[1].nodeSnmp[].memAvailReal",
        "value": 23059136
      }, {
        "metricId": ".1.3.6.1.4.1.2021.4.15.0",
        "metricType": "int32",
        "netInterface": "127.0.0.1",
        "nodeId": 1,
        "service": "SNMP",
        "timeStamp": 1448733509091,
        "onmsLogicMetricId": "node[1].nodeSnmp[].memCached",
        "value": 5139736
      }, {
        "metricId": ".1.3.6.1.4.1.2021.4.5.0",
        "metricType": "int32",
        "netInterface": "127.0.0.1",
        "nodeId": 1,
        "service": "SNMP",
        "timeStamp": 1448733509091,
        "onmsLogicMetricId": "node[1].nodeSnmp[].memTotalReal",
        "value": 32824488
      }],
      [{
        "metricId": ".1.3.6.1.4.1.2021.4.4.0",
        "metricType": "int32",
        "netInterface": "127.0.0.1",
        "nodeId": 1,
        "service": "SNMP",
        "timeStamp": 1448733510085,
        "onmsLogicMetricId": "node[1].nodeSnmp[].memAvailSwap",
        "value": 16457724
      }, {
        "metricId": ".1.3.6.1.4.1.2021.4.13.0",
        "metricType": "int32",
        "netInterface": "127.0.0.1",
        "nodeId": 1,
        "service": "SNMP",
        "timeStamp": 1448733510085,
        "onmsLogicMetricId": "node[1].nodeSnmp[].memShared",
        "value": 1225336
      }, {
        "metricId": ".1.3.6.1.4.1.2021.4.14.0",
        "metricType": "int32",
        "netInterface": "127.0.0.1",
        "nodeId": 1,
        "service": "SNMP",
        "timeStamp": 1448733510085,
        "onmsLogicMetricId": "node[1].nodeSnmp[].memBuffer",
        "value": 348660
      }, {
        "metricId": ".1.3.6.1.4.1.2021.4.6.0",
        "metricType": "int32",
        "netInterface": "127.0.0.1",
        "nodeId": 1,
        "service": "SNMP",
        "timeStamp": 1448733510085,
        "onmsLogicMetricId": "node[1].nodeSnmp[].memAvailReal",
        "value": 23059136
      }, {
        "metricId": ".1.3.6.1.4.1.2021.4.15.0",
        "metricType": "int32",
        "netInterface": "127.0.0.1",
        "nodeId": 1,
        "service": "SNMP",
        "timeStamp": 1448733510085,
        "onmsLogicMetricId": "node[1].nodeSnmp[].memCached",
        "value": 5139736
      }, {
        "metricId": ".1.3.6.1.4.1.2021.4.5.0",
        "metricType": "int32",
        "netInterface": "127.0.0.1",
        "nodeId": 1,
        "service": "SNMP",
        "timeStamp": 1448733510085,
        "onmsLogicMetricId": "node[1].nodeSnmp[].memTotalReal",
        "value": 32824488
      }]
    ]};

    var requestNumber = 0;
    spyOn(jQuery, "ajax").and.callFake(function (params) {
      requestNumber += 1;
      if (requestNumber === 1) {
        // Verify the URL
        expect(params.url).toBe("http://127.0.0.1:8980/opennms/nrt/starter");

        expect(params.data.resourceId).toBe('node[1].nodeSnmp[]');
        expect(params.data.report).toBe('netsnmp.memStats');

        // Return the fixed collection details
        params.success(nrtgCollectionDetails);
      } else if (requestNumber === 2) {
        // Verify the model
        expect(ds.model.metrics.length).toBe(39);
        var found = false;
        for (var i = 0, nmetrics = ds.model.metrics.length; i < nmetrics; i++) {
          var modelMetric = ds.model.metrics[i];
          if (modelMetric.name === "memavailreal") {
            expect(modelMetric.attribute).toBe(".1.3.6.1.4.1.2021.4.6.0");
            found = true;
          }
        }
        expect(found).toBeTruthy();

        // Verify the URL
        expect(params.url).toBe("http://127.0.0.1:8980/opennms/nrt/starter");

        expect(params.data.poll).toBe(true);
        expect(params.data.nrtCollectionTaskId).toBe('NrtCollectionTaskId_1448733509054');

        // Return the fixed measurement set
        params.success(measurementSets);
      }
    });

    var callback = function(results) {
      expect(results.columnNames.length).toBe(8);
      expect("timestamp" in results.columnNameToIndex).toBeTruthy();
      expect("usedBytes" in results.columnNameToIndex).toBeTruthy();
      expect("memtotalrealBytes" in results.columnNameToIndex).toBeTruthy();
      expect("membufferBytes" in results.columnNameToIndex).toBeTruthy();
      expect("memcachedBytes" in results.columnNameToIndex).toBeTruthy();
      expect("memsharedBytes" in results.columnNameToIndex).toBeTruthy();
      expect("memavailrealBytes" in results.columnNameToIndex).toBeTruthy();

      var id = results.columnNameToIndex["timestamp"];
      expect(results.columns[id].length).toBe(3);
      expect(results.columns[id][0]).toBe(1448733509065);
      expect(results.columns[id][1]).toBe(1448733509091);
      expect(results.columns[id][2]).toBe(1448733510085);

      id = results.columnNameToIndex["memavailrealBytes"];
      expect(results.columns[id].length).toBe(3);
      expect(results.columns[id][0]).toBeCloseTo(23059136*1024,4);
      expect(results.columns[id][1]).toBeCloseTo(23059136*1024,4);
      expect(results.columns[id][2]).toBeCloseTo(23059136*1024,4);

      id = results.columnNameToIndex["usedBytes"];
      expect(results.columns[id].length).toBe(3);
      expect(results.columns[id][0]).toBeCloseTo(4379602944,4);
      expect(results.columns[id][1]).toBeCloseTo(4379602944,4);
      expect(results.columns[id][2]).toBeCloseTo(4379602944,4);

      ds.stopStreaming();
      done();
    };

    var ds = new Backshift.DataSource.NRTG({
      url: "http://127.0.0.1:8980/opennms/nrt/starter",
      metrics: [{
        resourceId: 'node[1].nodeSnmp[]',
        report: 'netsnmp.memStats'
      }],
      callback: callback
    });

    ds.startStreaming();
  });
});
