import { Group } from 'three';
import { globeCulling, preGlobeUpdate, globeSubdivisionControl,
         globeSchemeTileWMTS, globeSchemeTile1 } from '../Process/GlobeTileProcessing';
import SubdivisionControl from '../Process/SubdivisionControl';


/**
 */
function Globe(options) {
    Group.call(this);
}

Globe.prototype = Object.create(Group.prototype);

Globe.prototype.schemeTile = globeSchemeTileWMTS(globeSchemeTile1);

Globe.prototype.addLayer = function addLayer(layer) {
};

Globe.prototype.update = processTiledGeometryNode(globeCulling(2), _subdivision);

Globe.prototype.preUpdate = function preUpdate(context, layer, changeSources) {
    SubdivisionControl.preUpdate(context, layer);

    if (__DEBUG__) {
        layer._latestUpdateStartingLevel = 0;
    }

    preGlobeUpdate(context, layer);
    if (changeSources.has(undefined) || changeSources.size == 0) {
        return layer.level0Nodes;
    }
    let commonAncestor;
    for (const source of changeSources.values()) {
        if (source.isCamera) {
            // if the change is caused by a camera move, no need to bother
            // to find common ancestor: we need to update the whole tree:
            // some invisible tiles may now be visible
            return layer.level0Nodes;
        }
        if (source.layer === layer.id) {
            if (!commonAncestor) {
                commonAncestor = source;
            } else {
                commonAncestor = _commonAncestorLookup(commonAncestor, source);
                if (!commonAncestor) {
                    return layer.level0Nodes;
                }
            }
            if (commonAncestor.material == null) {
                commonAncestor = undefined;
            }
        }
    }
    if (commonAncestor) {
        if (__DEBUG__) {
            layer._latestUpdateStartingLevel = commonAncestor.level;
        }
        return [commonAncestor];
    } else {
        return layer.level0Nodes;
    }
};

function _commonAncestorLookup(a, b) {
    if (!a || !b) {
        return undefined;
    }
    if (a.level == b.level) {
        if (a.id == b.id) {
            return a;
        } else if (a.level != 0) {
            return _commonAncestorLookup(a.parent, b.parent);
        } else {
            return undefined;
        }
    } else if (a.level < b.level) {
        return _commonAncestorLookup(a, b.parent);
    } else {
        return _commonAncestorLookup(a.parent, b);
    }
}

function _subdivision(context, layer, node) {
    if (SubdivisionControl.hasEnoughTexturesToSubdivide(context, layer, node)) {
        return globeSubdivisionControl(2,
            options.maxSubdivisionLevel || 18,
            options.sseSubdivisionThreshold || 1.0,
            options.maxDeltaElevationLevel || 4)(context, layer, node);
    }
    return false;
}

export default Globe;
