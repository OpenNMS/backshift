/**
 * Created by jwhite on 5/22/14.
 */

Backshift.namespace('Backshift.Data.Mock.Trig.FnFactory');

Backshift.Data.Mock.TrigFnFactory = {};

Backshift.Data.Mock.TrigFnFactory.create = function (source) {
    var constr = source.type.toLowerCase();

    if (typeof Backshift.Data.Mock.TrigFnFactory[constr] !== "function") {
        throw {
            name: "Error",
            message: constr + " doesn't exist"
        };
    }

    return new Backshift.Data.Mock.TrigFnFactory[constr](source);
};

Backshift.Data.Mock.TrigFnFactory.sin = function(source) {
    this.amplitude = 1;
    if (source.amplitude !== undefined) {
        this.amplitude = source.amplitude;
    }

    this.hshift = 0;
    if (source.hshift !== undefined) {
        this.hshift = source.hshift;
    }

    this.vshift = 0;
    if (source.vshift !== undefined) {
        this.vshift = source.vshift;
    }

    this.period = 2 * Math.PI;
    if (source.period !== undefined) {
        this.period = source.period;
    }

    this.fn = function(x) {
        var B = (2 * Math.PI) / this.period;
        return this.amplitude * Math.sin(B * (x - this.hshift)) + this.vshift;
    };
};
