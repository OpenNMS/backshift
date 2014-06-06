/**
 * Created by jwhite on 5/22/14.
 */

Backshift.namespace('Backshift.Data.Factory');

Backshift.Data.Factory = {};

Backshift.Data.Factory.create = function (def, args) {
    var constr = def.type.toLowerCase();

    if (typeof Backshift.Data.Factory[constr] !== "function") {
        Backshift.fail("Data provider " + constr + " doesn't exist");
    }

    Backshift.keys(def).forEach( function(key) {
        args[key] = def[key];
    });

    return new Backshift.Data.Factory[constr](args);
};

Backshift.Data.Factory.trig = function(args) {
    return new Backshift.Data.Mock.Trig(args);
};

Backshift.Data.Factory.newts = function(args) {
    return new Backshift.Data.Newts(args);
};

Backshift.Data.Factory.onmsrrd = function(args) {
    return new Backshift.Data.OnmsRRD(args);
};
