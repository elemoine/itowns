import { Layer } from '../../src/Core/Layer/Layer';


function DebugLayer(options) {
    options = options || {};

    this.visible = options.visible;  // layer visibility default value

    Layer.call(this, options);
}

DebugLayer.prototype = Object.assign(Object.create(Layer.prototype), {
    type: 'debug',

    constructor: DebugLayer,
});

export default DebugLayer;
