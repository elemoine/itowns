/* global itowns, document, renderer, setupLoadingScreen */
// # Loading gpx file

// Define initial camera position
var positionOnGlobe = { longitude: 0.089, latitude: 42.8989, altitude: 80000 };

// `viewerDiv` will contain iTowns' rendering area (`<canvas>`)
var viewerDiv = document.getElementById('viewerDiv');

// Instanciate iTowns GlobeView*
var globeView = new itowns.GlobeView(viewerDiv, positionOnGlobe, { renderer: renderer });

var promises = [];

setupLoadingScreen(viewerDiv, globeView);

function addLayer(layerOptions) {
    var layer, type = layerOptions.type;
    if (type == 'color') {
        layer = new itowns.ColorLayer(layerOptions);
    } else if (type ==  'elevation') {
        layer = new itowns.ElevationLayer(layerOptions);
    }
    return globeView.addLayer(layer);
}
// Add one imagery layer to the scene
// This layer is defined in a json file but it could be defined as a plain js
// object. See Layer* for more info.
promises.push(itowns.Fetcher.json('./layers/JSONLayers/Ortho.json').then(addLayer));
// Add two elevation layers.
// These will deform iTowns globe geometry to represent terrain elevation.
promises.push(itowns.Fetcher.json('./layers/JSONLayers/WORLD_DTM.json').then(addLayer));
promises.push(itowns.Fetcher.json('./layers/JSONLayers/IGN_MNT_HIGHRES.json').then(addLayer));

exports.view = globeView;
