import { Layer } from './Layer';
import { updateLayeredMaterialNodeElevation } from '../../Process/LayeredMaterialNodeProcessing';

function ElevationLayer(options) {
    options = options || {};
    options.update = updateLayeredMaterialNodeElevation;

    Layer.call(this, options);
}

ElevationLayer.prototype = Object.assign(Object.create(Layer.prototype), {
    type: 'elevation',

    constructor: ElevationLayer,
});

export default ElevationLayer;
