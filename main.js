import * as THREE from 'three';
import WebXRPolyfill from 'webxr-polyfill';

new WebXRPolyfill();

let scene, camera, renderer, info, errorMsg;

function init() {
    info = document.getElementById('info');
    errorMsg = document.getElementById('error');

    if (navigator.xr) {
        navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
            if (supported) {
                info.style.display = 'none';
                setupScene();
            } else {
                showErrorMessage();
            }
        }).catch(showErrorMessage);
    } else {
        showErrorMessage();
    }
}

function showErrorMessage() {
    info.style.display = 'none';
    errorMsg.style.display = 'block';
}

function setupScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;

    document.body.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;

    renderer.setAnimationLoop(() => {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
    });

    // Create an XR session
    navigator.xr.requestSession('immersive-vr').then(session => {
        renderer.xr.setSession(session);
    }).catch(err => {
        console.error('Failed to start XR session', err);
        showErrorMessage();
    });
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();