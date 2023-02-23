import { ascending, descending, extent, groups, max, min, quantile, range, sum } from 'd3-array';
import { axisBottom, axisLeft, axisRight, axisTop } from 'd3-axis';
import { brush, brushX } from 'd3-brush';
import { dispatch } from 'd3-dispatch';
import { easeQuad } from 'd3-ease';
import { format } from 'd3-format';
import { geoPath, geoAlbersUsa } from 'd3-geo';
import { hierarchy, partition } from 'd3-hierarchy';
import { interpolate, interpolateHcl, interpolateNumber } from 'd3-interpolate';
import { scaleBand, scaleLinear, scaleOrdinal, scaleQuantize, scaleTime } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';
import { event as ev, mouse, pointer, select } from 'd3-selection';
import {
    arc,
    area,
    curveBasis,
    curveBasisClosed,
    curveBasisOpen,
    curveBundle,
    curveCardinal,
    curveCardinalClosed,
    curveCardinalOpen,
    curveLinear,
    curveLinearClosed,
    curveMonotoneX,
    curveStep,
    curveStepAfter,
    curveStepBefore,
    line,
    pie,
    stack,
    symbol
} from 'd3-shape';
import { timeDay, timeHour, timeMinute, timeMonth, timeSecond, timeWeek, timeYear } from 'd3-time';
import { timeFormat } from 'd3-time-format';
import { timerFlush } from 'd3-timer';
import { version } from 'd3';
import { zoom, zoomIdentity } from 'd3-zoom';

if (window.d3 === undefined) {
    window.d3 = {};
}

const d3 = window.d3;

// d3-array
d3.ascending = ascending;
d3.descending = descending;
d3.extent = extent;
d3.groups = groups;
d3.max = max;
d3.min = min;
d3.quantile = quantile;
d3.range = range;
d3.sum = sum;

// d3-axis
d3.axisBottom = axisBottom;
d3.axisLeft = axisLeft;
d3.axisRight = axisRight;
d3.axisTop = axisTop;

// d3-brush
d3.brush = brush;
d3.brushX = brushX;

// d3-dispatch
d3.dispatch = dispatch;

// d3-ease
d3.easeQuad = easeQuad;

// d3-format
d3.format = format;

// d3-geo
d3.geoPath = geoPath;
d3.geoAlbersUsa = geoAlbersUsa;

// d3-hierarchy
d3.hierarchy = hierarchy;
d3.partition = partition;

// d3-interpolate
d3.interpolate = interpolate;
d3.interpolateHcl = interpolateHcl;
d3.interpolateNumber = interpolateNumber;

// d3-scale
d3.scaleBand = scaleBand;
d3.scaleLinear = scaleLinear;
d3.scaleOrdinal = scaleOrdinal;
d3.scaleQuantize = scaleQuantize;
d3.scaleTime = scaleTime;

// d3-scale-chromatic
d3.schemeCategory10 = schemeCategory10;

// d3-selection
d3.event = ev;
d3.mouse = mouse;
d3.pointer = pointer;
d3.select = select;

// d3-shape
d3.arc = arc;
d3.area = area;
d3.curveBasis = curveBasis;
d3.curveBasisClosed = curveBasisClosed;
d3.curveBasisOpen = curveBasisOpen;
d3.curveBundle = curveBundle;
d3.curveCardinal = curveCardinal;
d3.curveCardinalClosed = curveCardinalClosed;
d3.curveCardinalOpen = curveCardinalOpen;
d3.curveLinear = curveLinear;
d3.curveLinearClosed = curveLinearClosed;
d3.curveMonotoneX = curveMonotoneX;
d3.curveStep = curveStep;
d3.curveStepAfter = curveStepAfter;
d3.curveStepBefore = curveStepBefore;
d3.line = line;
d3.pie = pie;
d3.stack = stack;
d3.symbol = symbol;

// d3-time
d3.timeDay = timeDay;
d3.timeHour = timeHour;
d3.timeMinute = timeMinute;
d3.timeMonth = timeMonth;
d3.timeSecond = timeSecond;
d3.timeWeek = timeWeek;
d3.timeYear = timeYear;

// d3-time-format
d3.timeFormat = timeFormat;

// d3-timer
d3.timerFlush = timerFlush;

// d3-version
d3.version = version;

// d3-zoom
d3.zoom = zoom;
d3.zoomIdentity = zoomIdentity;

export { d3 };