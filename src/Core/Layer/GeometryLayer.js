import { Layer } from './Layer';


function GeometryLayer(options) {
    options = options || {};

    Layer.call(this, options);

    this.convert = options.convert;
    this.filter = options.filter; // WFS
    this.level = options.level; // WFS
    this.onMeshCreated = options.onMeshCreated;
    this.size = options.size;
    this.threejsLayer = undefined;
    this.typeName = options.typeName; // WFS
    this.version = options.version; // WFS
}

GeometryLayer.prototype = Object.assign(Object.create(Layer.prototype), {
    type: 'geometry',

    constructor: GeometryLayer,
});

export default GeometryLayer;
