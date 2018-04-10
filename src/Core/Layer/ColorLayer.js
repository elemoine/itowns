import { Layer, defineLayerProperty } from './Layer';
import { updateLayeredMaterialNodeImagery } from '../../Process/LayeredMaterialNodeProcessing';


function ColorLayer(options) {
    options = options || {};
    options.update = updateLayeredMaterialNodeImagery;

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
