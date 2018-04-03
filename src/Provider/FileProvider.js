import * as THREE from 'three';

function readFile(file) {
    return new Promise((resolve, reject) => {
        var fr = new FileReader();
        fr.onload = () => { resolve(fr.result); };
        fr.onerror = () => { fr.abort(); reject(new DOMException('FileReader error.')); };
        fr.readAsBinaryString(file);
    });
}

export default {
    preprocessDataLayer(layer) {
        const file = layer.file;
        const format = file.type || file.name.split('.').pop().toLowerCase();
        const parser = layer.parser || layer.parsers[format];
        if (!parser)
        {
            throw new Error('no parser');
        }

        layer.update = layer.update || (() => {});
        layer.object3d = layer.object3d || new THREE.Group();
        return readFile(file).then(content => parser.parse(content, layer)).then((obj) => { layer.object3d.add(obj); });
    },

    executeCommand(/* command */) {},
};
