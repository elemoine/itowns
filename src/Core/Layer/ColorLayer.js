import { Layer, defineLayerProperty } from './Layer';


function ColorLayer(options) {
    options = options || {};

    Layer.call(this, options);

    defineLayerProperty(this, 'visible', true);
    defineLayerProperty(this, 'opacity', 1.0);
    defineLayerProperty(this, 'sequence', 0);
}

ColorLayer.prototype = Object.assign(Object.create(Layer.prototype), {
    type: 'color',

    constructor: ColorLayer,
});

export default ColorLayer;
