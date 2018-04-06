import { Layer, defineLayerProperty } from './Layer';


function ElevationLayer(options) {
    options = options || {};

    Layer.call(this, options);

    defineLayerProperty(this, 'frozen', false);
}

ElevationLayer.prototype = Object.assign(Object.create(Layer.prototype), {
    type: 'elevation',

    constructor: ElevationLayer,
});

export default ElevationLayer;
