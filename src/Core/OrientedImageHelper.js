import * as THREE from 'three';
import Coordinates from './Geographic/Coordinates';
import materialUV_VS from '../Renderer/Shader/debugUV_VS.glsl';
import materialUV_FS from '../Renderer/Shader/debugUV_FS.glsl';

const materialUV = new THREE.ShaderMaterial({
    uniforms: {},
    side: THREE.BackSide,
    vertexShader: materialUV_VS,
    fragmentShader: materialUV_FS,
});

export default {

    toCoordGeographic(ori) {
        return new Coordinates('EPSG:4326', ori.longitude, ori.latitude, ori.height);
    },

    parseInfoEastingNorthAltitudeToCoordinate(projection, info, offset) {
        return new Coordinates(projection, info.easting + offset.x, info.northing + offset.y, info.altitude + offset.z);
    },

    parseMicMacOrientationToMatrix(panoramic) {
        const d2r = Math.PI / 180;
        const euler = new THREE.Euler(
            panoramic.roll * d2r,
            panoramic.pitch * d2r,
            panoramic.heading * d2r,
            'XYZ');

        const matrixFromEuler = new THREE.Matrix4().makeRotationFromEuler(euler);

        // The three angles ω,ɸ,k are computed
        // for a traditionnal image coordinate system (X=colomns left to right and Y=lines bottom up)
        // and not for a computer vision compliant geometry (X=colomns left to right and Y=lines top down)
        // so we have to multiply to rotation matrix by this matrix :
        var inverseYZ = new THREE.Matrix4().set(
                1, 0, 0, 0,
                0, -1, 0, 0,
                0, 0, -1, 0,
                0, 0, 0, 1);

        matrixFromEuler.multiply(inverseYZ);

        return matrixFromEuler;
    },

    parseAircraftConventionOrientationToMatrix(panoramic) {
        const d2r = Math.PI / 180;
        const euler = new THREE.Euler(
            panoramic.tilt * d2r,
            panoramic.azimuth * d2r,
            panoramic.roll * d2r,
            'ZYX');

        const matrixFromEuler = new THREE.Matrix4().makeRotationFromEuler(euler);

        return matrixFromEuler;
    },

    setPicturePositionAndScale(object, distance, sizeX, sizeY, focale, ppaX, ppaY) {
        // compute picture size
        var Xreel = (sizeX * distance) / focale;
        var Yreel = (sizeY * distance) / focale;

        // compute ppa
        var ppaXReel = ((ppaX - sizeX / 2) * distance) / focale;
        var ppaYReel = (-(ppaY - sizeY / 2) * distance) / focale;

        // set position and scale
        object.scale.set(Xreel, Yreel, 1);
        object.position.set(ppaXReel, ppaYReel, distance);
        object.updateMatrixWorld();
    },

    // set object position to the coordinate
    // set object basic orientation: Z (blue) look to the sky, Y (green) to the north, X (red) to the east.
    initPositionAndOrientation(obj, coord) {
    // set axis position to the coordinate
        obj.position.copy(coord.xyz());
        // set orientation, looking at the sky (Z axis), so Y axis look to the north..
        obj.lookAt(coord.geodesicNormal.clone().add(obj.position));
    },

    computeOrientation(object, up, lookAt, quaternion) {
        object.up.set(up.x, up.y, up.z);
        object.lookAt(lookAt.x, lookAt.y, lookAt.z);
        object.quaternion.multiply(quaternion);
        object.updateMatrixWorld();
    },

    createTexturedPlane(textureUrl) {
        const texture = new THREE.TextureLoader().load(textureUrl);
        texture.flipY = false;
        var geometry = new THREE.PlaneGeometry(1, 1, 32);
        var material = new THREE.MeshBasicMaterial({
            map: texture,
            color: 0xffffff,
            side: THREE.BackSide,
            transparent: true,
            opacity: 1,
        });
        return new THREE.Mesh(geometry, material);
    },

    setupCamera(camera, coord, objectToLookAt, fov) {
        camera.position.copy(coord.xyz());
        camera.up.copy(coord.geodesicNormal);
        camera.lookAt(objectToLookAt.getWorldPosition());
        camera.fov = fov;
        camera.updateProjectionMatrix();
    },

    materialUV,
};
