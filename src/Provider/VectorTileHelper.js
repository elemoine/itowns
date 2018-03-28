import * as THREE from 'three';
import Fetcher from './Fetcher';
import VectorTileParser from '../Parser/VectorTileParser';
import Feature2Texture from '../Renderer/ThreeExtended/Feature2Texture';

const cache = new Map();
const pending = new Map();

function assignLayer(object, layer) {
    if (object) {
        object.layer = layer.id;
        object.layers.set(layer.threejsLayer);
        for (const c of object.children) {
            assignLayer(c, layer);
        }
        return object;
    }
}

const getVectorTileByUrl = function getVectorTileByUrl(url, tile, layer, coords) {
    const tileCache = cache.get(url);

    if (tileCache !== undefined) {
        return Promise.resolve(tileCache);
    }

    const promise = (pending.has(url)) ?
        pending.get(url) :
        Fetcher.arrayBuffer(url, layer.networkOptions);

    if (!pending.has(url)) {
        pending.set(url, promise);
    }

    return promise.then((buffer) => {
        const g = cache.get(url);
        if (g) {
            return Promise.resolve(g);
        }

        return VectorTileParser.parse(buffer, {
            format: 'application/x-protobuf;type=mapbox-vector',
            extent: tile.extent,
            filteringExtent: layer.extent,
            filter: layer.filter,
            origin: layer.origin,
            coords,
        });
    })
    .then((geojson) => {
        if (!cache.has(url)) {
            cache.set(url, geojson);
        }

        pending.delete(url);

        return Promise.resolve(geojson);
    });
};

const getVectorTileTextureByUrl = function getVectorTileTextureByUrl(url, tile, layer, coords) {
    if (layer.type !== 'color') return;

    return getVectorTileByUrl(url, tile, layer, coords).then((features) => {
        if (!features) {
            return;
        }

        // sort features before drawing
        if (layer.sort) {
            features.features.sort(layer.sort);
        }

        const colorCoords = coords;
        const result = { pitch: new THREE.Vector4(0, 0, 1, 1) };
        result.texture = Feature2Texture.createTextureFromFeature(
            features,
            coords.crs() == 'TMS' ? tile.extent : coords.as(tile.extent.crs()),
            256, layer.style);
        result.texture.extent = tile.extent;
        result.texture.coords = colorCoords;
        // result.texture.coords.zoom = tile.level;

        if (layer.transparent) {
            result.texture.premultiplyAlpha = true;
        }

        return result;
    });
};

const getVectorTileMeshByUrl = function getVectorTileMeshByUrl(url, tile, layer, coords) {
    if (layer.type !== 'geometry') return;

    return getVectorTileByUrl(url, tile, layer, coords).then(features => assignLayer(layer.convert(features), layer));
};

export default {
    getVectorTileByUrl,
    getVectorTileTextureByUrl,
    getVectorTileMeshByUrl,
};
