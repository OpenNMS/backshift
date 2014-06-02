/**
 * Created by jwhite on 5/22/14.
 */

Backshift.namespace('Backshift.Data.Mock.Trig');

Backshift.Data.Mock.Trig = Backshift.Class.create( Backshift.Data.Mock, {
    defaults: function($super) {
        return Backshift.extend( $super(), {
            generator: this.trigonometricGenerator
        } );
    },

    trigonometricGenerator: function(x, source) {
        var trig = Backshift.Data.Mock.TrigFnFactory.create(source);
        return trig.fn(x);
    }
} );
