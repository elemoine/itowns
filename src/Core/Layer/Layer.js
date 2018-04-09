import { EventDispatcher } from 'three';
import Picking from '../Picking';
import { STRATEGY_MIN_NETWORK_TRAFFIC } from './LayerUpdateStrategy';

/**
 * Fires when layer sequence change (meaning when the order of the layer changes in the view)
 * @event Layer#sequence-property-changed
 * @property new {object}
 * @property new.sequence {number} the new value of the layer sequence
 * @property previous {object}
 * @property previous.sequence {number} the previous value of the layer sequence
 * @property target {Layer} dispatched on layer
 * @property type {string} sequence-property-changed
*/
/**
 * Fires when layer opacity change
 * @event Layer#opacity-property-changed
 * @property new {object}
 * @property new.opacity {object} the new value of the layer opacity
 * @property previous {object}
 * @property previous.opacity {object} the previous value of the layer opacity
 * @property target {Layer} dispatched on layer
 * @property type {string} opacity-property-changed
*/
/**
 * Fires when layer visibility change
 * @event Layer#visible-property-changed
 * @property new {object}
 * @property new.visible {object} the new value of the layer visibility
 * @property previous {object}
 * @property previous.visible {object} the previous value of the layer visibility
 * @property target {Layer} dispatched on layer
 * @property type {string} visible-property-changed
*/

export const defineLayerProperty = function defineLayerProperty(layer, propertyName, defaultValue, onChange) {
    const existing = Object.getOwnPropertyDescriptor(layer, propertyName);
    if (!existing || !existing.set) {
        var property = layer[propertyName] == undefined ? defaultValue : layer[propertyName];
        Object.defineProperty(layer,
            propertyName,
            { get: () => property,
                set: (newValue) => {
                    if (property !== newValue) {
                        const event = { type: `${propertyName}-property-changed`, previous: {}, new: {} };
                        event.previous[propertyName] = property;
                        event.new[propertyName] = newValue;
                        property = newValue;
                        if (onChange) {
                            onChange(layer, propertyName);
                        }
                        layer.dispatchEvent(event);
                    }
                } });
    }
};

function changeOpacity(obj, layer) {
    if (obj.material) {
        // != undefined: we want the test to pass if opacity is 0
        if (obj.material.opacity != undefined) {
            obj.material.transparent = layer.opacity < 1.0;
            obj.material.opacity = layer.opacity;
        }
        if (obj.material.uniforms && obj.material.uniforms.opacity != undefined) {
            obj.material.transparent = layer.opacity < 1.0;
            obj.material.uniforms.opacity.value = layer.opacity;
        }
    }
}

function RootLayer(id, object3d) {
    if (!id) {
        throw new Error('Missing id parameter (RootLayer must have a unique id defined)');
    }
    if (!object3d || !object3d.isObject3D) {
        throw new Error('Missing/Invalid object3d parameter (must be a three.js Object3D instance)');
    }
    this._attachedLayers = [];

    if (object3d && object3d.type === 'Group' && object3d.name === '') {
        object3d.name = id;
    }

    Object.defineProperty(this, 'object3d', {
        value: object3d,
        writable: false,
    });

    Object.defineProperty(this, 'id', {
        value: id,
        writable: false,
    });

    defineLayerProperty(this, 'opacity', 1.0, (layer) => {
        layer.object3d.traverse((obj) => {
            if (obj.layer !== layer.id) {
                return;
            }
            changeOpacity(obj, layer);
            if (obj.content) {
                obj.content.traverse(o => changeOpacity(o, layer));
            }
        });
    });

    // Setup default picking method
    this.pickObjectsAt = (view, mouse) => Picking.pickObjectsAt(view, mouse, this.object3d);

    this.postUpdate = () => {};
}

RootLayer.prototype = Object.create(EventDispatcher.prototype);
RootLayer.prototype.constructor = RootLayer;

RootLayer.prototype.attach = function attach(layer) {
    if (!layer.update) {
        throw new Error(`Missing 'update' function -> can't attach layer ${layer.id}`);
    }
    this._attachedLayers.push(layer);
};

RootLayer.prototype.detach = function detach(layer) {
    const count = this._attachedLayers.length;
    this._attachedLayers = this._attachedLayers.filter(attached => attached.id != layer.id);
    return this._attachedLayers.length < count;
};

/**
 * Don't use directly constructor to instance a new Layer
 * use addLayer in {@link View}
 * @example
 * // add and create a new Layer
 * const newLayer = view.addLayer({options});
 *
 * // Change layer's visibilty
 * const layerToChange = view.getLayers(layer => layer.id == 'idLayerToChange')[0];
 * layerToChange.visible = false;
 * view.notifyChange(true); // update viewer
 *
 * // Change layer's opacity
 * const layerToChange = view.getLayers(layer => layer.id == 'idLayerToChange')[0];
 * layerToChange.opacity = 0.5;
 * view.notifyChange(true); // update viewer
 *
 * // Listen properties
 * const layerToListen = view.getLayers(layer => layer.id == 'idLayerToListen')[0];
 * layerToListen.addEventListener('visible-property-changed', (event) => console.log(event));
 * layerToListen.addEventListener('opacity-property-changed', (event) => console.log(event));
 * @constructor
 * @protected
 * @param      {Object}  options
 */
function Layer(options) {
    var extraOptions = options.options || {};
    var format = options.format;

    if (!format && extraOptions.mimetype) {
        console.warn('layer.options.mimetype is deprecated, please use layer.format');
        format = extraOptions.mimetype;
    }

    this.extent = options.extent;
    this.format = format;
    this.frozen = options.frozen;  // "frozen" default value
    this.name = options.name;
    this.networkOptions = options.networkOptions;
    this.options = extraOptions;
    this.projection = options.projection;
    this.protocol = options.protocol;
    this.ready = false;
    this.tileInsideLimit = undefined;
    this.tileTextureCount = undefined;
    this.update = options.update;
    this.updateStrategy = options.updateStrategy || { type: STRATEGY_MIN_NETWORK_TRAFFIC };
    this.url = options.url;
    this.whenReady = options.whenReady;

    Object.defineProperty(this, 'id', {
        value: options.id,
        writable: false,
    });

    defineLayerProperty(this, 'frozen', false);
}

Layer.prototype = Object.create(EventDispatcher.prototype);
Layer.prototype.constructor = Layer;


const ImageryLayers = {
    // move layer to new index
    // After the modification :
    //      * the minimum sequence will always be 0
    //      * the maximum sequence will always be layers.lenght - 1
    // the ordering of all layers (Except that specified) doesn't change
    moveLayerToIndex: function moveLayerToIndex(layer, newIndex, imageryLayers) {
        newIndex = Math.min(newIndex, imageryLayers.length - 1);
        newIndex = Math.max(newIndex, 0);
        const oldIndex = layer.sequence;

        for (const imagery of imageryLayers) {
            if (imagery.id === layer.id) {
                // change index of specified layer
                imagery.sequence = newIndex;
            } else if (imagery.sequence > oldIndex && imagery.sequence <= newIndex) {
                // down all layers between the old index and new index (to compensate the deletion of the old index)
                imagery.sequence--;
            } else if (imagery.sequence >= newIndex && imagery.sequence < oldIndex) {
                // up all layers between the new index and old index (to compensate the insertion of the new index)
                imagery.sequence++;
            }
        }
    },

    moveLayerDown: function moveLayerDown(layer, imageryLayers) {
        if (layer.sequence > 0) {
            this.moveLayerToIndex(layer, layer.sequence - 1, imageryLayers);
        }
    },

    moveLayerUp: function moveLayerUp(layer, imageryLayers) {
        const m = imageryLayers.length - 1;
        if (layer.sequence < m) {
            this.moveLayerToIndex(layer, layer.sequence + 1, imageryLayers);
        }
    },

    getColorLayersIdOrderedBySequence: function getColorLayersIdOrderedBySequence(imageryLayers) {
        const copy = Array.from(imageryLayers);
        copy.sort((a, b) => a.sequence - b.sequence);
        return copy.map(l => l.id);
    },
};

export { RootLayer, Layer, ImageryLayers };
