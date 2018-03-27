/* global itowns, document, renderer, orientedImageGUI  */
// # Simple Globe viewer

// Define initial camera position
var positionOnGlobe = {
    longitude: 2.423814,
    latitude: 48.844882,
    altitude: 100 };

var promises = [];

// `viewerDiv` will contain iTowns' rendering area (`<canvas>`)
var viewerDiv = document.getElementById('viewerDiv');

// Instanciate iTowns GlobeView*
var globeView = new itowns.GlobeView(viewerDiv, positionOnGlobe, {
    renderer: renderer,
    handleCollision: false,
    sseSubdivisionThreshold: 6,
    noControls: true,
});

// globeView.controls.minDistance = 0;

function addLayerCb(layer) {
    return globeView.addLayer(layer);
}

// Define projection that we will use (taken from https://epsg.io/3946, Proj4js section)
itowns.proj4.defs('EPSG:3946',
    '+proj=lcc +lat_1=45.25 +lat_2=46.75 +lat_0=46 +lon_0=3 +x_0=1700000 +y_0=5200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');

// Add one imagery layer to the scene
// This layer is defined in a json file but it could be defined as a plain js
// object. See Layer* for more info.
promises.push(itowns.Fetcher.json('./layers/JSONLayers/Ortho.json').then(addLayerCb));

// Add two elevation layers.
// These will deform iTowns globe geometry to represent terrain elevation.
promises.push(itowns.Fetcher.json('./layers/JSONLayers/WORLD_DTM.json').then(addLayerCb));
promises.push(itowns.Fetcher.json('./layers/JSONLayers/IGN_MNT_HIGHRES.json').then(addLayerCb));

var layerMontBlanc = {
    panoramic: {
        latitude: 45.9228208442959,
        height: 4680.55588294683,
        longitude: 6.83256920100156,
        azimuth: 526.3900321920207,
        roll: 2.1876227239518276,
        tilt: -11.668910605126001,
        azimuth_: 0,
        roll_: 0,
        tilt_: 0,
        image: "./orientedImages/MontBlanc.jpg",
    },
    camera: {
        size: [6490, 4408],
        focale: 1879.564256099287 * 4.4,
        ppaX: 3245,
        ppaY: 2204,
        // Define starting referential : Aircarft orientation
        // from basic orientation ( Y (green) to the north, X (red) to east, Z (blue) is the vertical)
        // here we are creating the classic aircraft axises
        // first we look at the north, (north is on the Y axis in basic orientation), so Z axis will point to the north
        lookAt: { x: 0, y: 1, z: 0 },
        // then set the up vector to look to the ground, (the ground is oppisition of Z in basic orientation), so Y axis will point to the ground
        up: { x: 0, y: 0, z: -1 },
        // after that, X axis will naturally point the east.
        
    },
    distance: 4000,
    opacity: 0.8,
    orientation: true,
}

function updatePlanePositionAndScale(layer) {
    itowns.OrientedImageHelper.setPicturePositionAndScale(layer.plane, layer.distance, layer.camera.size[0], layer.camera.size[1], layer.camera.focale, layer.camera.ppaX, layer.camera.ppaY);
}

function initPicture(layer, coord, rotationMatrix) {

    var coordView = new itowns.Coordinates(globeView.referenceCrs, 0, 0, 0);
    coord.as(globeView.referenceCrs, coordView);
    
    // create object referential to show basic orientation
    var referential = new itowns.THREE.Object3D();
    globeView.scene.add(referential);
    
    // set axis basic orientation
    itowns.OrientedImageHelper.initPositionAndOrientation(referential, coordView);

    // add second object: orientation
    var orientation = new itowns.THREE.Object3D();
    referential.add(orientation);

    // compute and store the quaternion
    var quaternion = new itowns.THREE.Quaternion().setFromRotationMatrix(rotationMatrix);

    // compute orientation
    itowns.OrientedImageHelper.computeOrientation(orientation, layer.camera.up, layer.camera.lookAt, quaternion);

    // create a textured plane, representing the picture.
    layer.plane = itowns.OrientedImageHelper.createTexturedPlane(layer.panoramic.image);

    orientation.add(layer.plane);

    // update plane position and scale from layer informations
    updatePlanePositionAndScale(layer);

    // update all the hierarchy
    referential.updateMatrixWorld(true);

    itowns.OrientedImageHelper.setupCamera(globeView.camera.camera3D, coordView, layer.plane, 45);
    
    globeView.notifyChange();

    new itowns.FirstPersonControls(globeView);
}

var coord = itowns.OrientedImageHelper.toCoordGeographic(layerMontBlanc.panoramic);
var rotationMatrix = itowns.OrientedImageHelper.parseAircraftConventionOrientationToMatrix(layerMontBlanc.panoramic);

initPicture(layerMontBlanc, coord, rotationMatrix);

exports.view = globeView;
exports.initialPosition = positionOnGlobe;
