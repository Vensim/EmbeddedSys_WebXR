import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class VRScene {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x505050);

        this.vrSession = null;

        this.initCamera();
        this.initRenderer();
        this.initControls();
        this.initSceneObjects();
        this.initLights();
        this.initControllers();
        this.initDebugInfo();
        this.initEventHandlers();

        this.movement = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            speed: 10
        };

        this.loadModel('./models/adafruit_huzzah32_esp32_feather.glb');
        this.animate();
        this.handleWindowResize();
    }

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 1.6, 3);
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true;
        this.renderer.xr.addEventListener('sessionstart', (event) => { this.vrSession = event.session; });

        document.body.appendChild(this.renderer.domElement);
        document.body.appendChild(VRButton.createButton(this.renderer));
    }

    initControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 1.6, 0);
        this.controls.update();
    }

    initSceneObjects() {
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x404040 });
        this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.receiveShadow = true;
        this.scene.add(this.floor);

        const cubeGeometry = new THREE.BoxGeometry();
        const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        this.cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        this.cube.position.set(0, 1.5, -3);
        this.cube.castShadow = true;
        this.scene.add(this.cube);
    }

    initLights() {
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(3, 10, 10);
        this.scene.add(directionalLight);
    }

    initControllers() {
        this.controller1 = this.renderer.xr.getController(0);
        this.controller2 = this.renderer.xr.getController(1);
        this.scene.add(this.controller1);
        this.scene.add(this.controller2);

        const controllerModelFactory = new XRControllerModelFactory();

        const controllerGrip1 = this.renderer.xr.getControllerGrip(0);
        controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
        this.scene.add(controllerGrip1);

        const controllerGrip2 = this.renderer.xr.getControllerGrip(1);
        controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
        this.scene.add(controllerGrip2);

        this.laserPointer1 = this.createLaserPointer(0xff0000);
        this.laserPointer2 = this.createLaserPointer(0x0000ff);
        this.controller1.add(this.laserPointer1);
        this.controller2.add(this.laserPointer2);
    }

    createLaserPointer(color) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -1)
        ]);

        const material = new THREE.LineBasicMaterial({ color });
        const line = new THREE.Line(geometry, material);
        line.scale.z = 15;

        return line;
    }

    intersectObjects(controller) {
        const raycaster = new THREE.Raycaster();
        const tempMatrix = new THREE.Matrix4();

        tempMatrix.identity().extractRotation(controller.matrixWorld);
        raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
        raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

        return raycaster.intersectObjects(this.scene.children, false);
    }

    onSelectStart(event) {
        const controller = event.target;
        const intersections = this.intersectObjects(controller);

        if (intersections.length > 0) {
            const intersected = intersections[0].object;
            intersected.material.emissive.b = 1;
            controller.userData.selected = intersected;
        }
    }

    onSelectEnd(event) {
        const controller = event.target;

        if (controller.userData.selected !== undefined) {
            controller.userData.selected.material.emissive.b = 0;
            controller.userData.selected = undefined;
        }
    }

    initEventHandlers() {
        this.controller1.addEventListener('selectstart', this.onSelectStart.bind(this));
        this.controller1.addEventListener('selectend', this.onSelectEnd.bind(this));
        this.controller2.addEventListener('selectstart', this.onSelectStart.bind(this));
        this.controller2.addEventListener('selectend', this.onSelectEnd.bind(this));

        this.controller1.addEventListener('connected', (event) => this.onControllerConnected(event, 1));
        this.controller2.addEventListener('connected', (event) => this.onControllerConnected(event, 2));
    }

    initDebugInfo() {
        this.debugCanvas = document.createElement('canvas');
        this.debugCanvas.width = 512*2;
        this.debugCanvas.height = 256*2;
        this.debugContext = this.debugCanvas.getContext('2d');
        this.debugContext.fillStyle = 'white';
        this.debugContext.font = '30x Arial';

        this.debugTexture = new THREE.Texture(this.debugCanvas);
        const debugMaterial = new THREE.MeshBasicMaterial({ map: this.debugTexture });

        const debugPlane = new THREE.PlaneGeometry(2, 1);
        const debugMesh = new THREE.Mesh(debugPlane, debugMaterial);
        debugMesh.position.set(0, 0.5 -2);
        this.scene.add(debugMesh);
    }

    updateDebugInfo(text) {
        this.debugContext.clearRect(0, 0, this.debugCanvas.width, this.debugCanvas.height);
        this.debugContext.fillText(text, 10, 50);
        this.debugTexture.needsUpdate = true;
    }

    loadModel(modelPath) {
        const loader = new GLTFLoader();
        loader.load(
            modelPath,
            (gltf) => {
                this.scene.add(gltf.scene);
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error) => {
                console.error('An error happened', error);
            }
        );
    }

    animate() {
        this.renderer.setAnimationLoop(this.render.bind(this));
    }

    render() {
        const vrOrientationText = this.getVROrientationText();
        const controller1Info = this.getControllerInfo(this.controller1, 1);
        const controller2Info = this.getControllerInfo(this.controller2, 2);

        this.updateDebugInfo(`${vrOrientationText}\n${controller1Info}\n${controller2Info}`);

        if (this.movement.forward) {
            this.camera.position.z -= this.movement.speed;
        }
        if (this.movement.backward) {
            this.camera.position.z += this.movement.speed;
        }
        if (this.movement.left) {
            this.camera.position.x -= this.movement.speed;
        }
        if (this.movement.right) {
            this.camera.position.x += this.movement.speed;
        }

        this.renderer.render(this.scene, this.camera);
    }

    getVROrientationText() {
        if (this.renderer.xr.getSession()) {
            const pose = this.renderer.xr.getCamera().matrixWorld.elements;
            return `VR Orientation: [${pose[0].toFixed(2)}, ${pose[5].toFixed(2)}, ${pose[10].toFixed(2)}]\n`;
        }
        return 'VR Orientation: N/A';
    }

    getControllerInfo(controller, index) {
        const gamepad = controller.userData.gamepad;
        if (gamepad) {
            const axes = gamepad.axes.map(a => a.toFixed(2)).join(', ');
            const buttons = gamepad.buttons.map((b, idx) => `Button ${idx}: ${b.pressed}`).join('\n');
            return `Controller ${index}\nAxes: [${axes}]\n${buttons}`;
        }
        return `Controller ${index} not connected`;
    }

    handleWindowResize() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    onControllerConnected(event, index) {
        const gamepad = event.data.gamepad;
        event.target.userData.gamepad = gamepad;

        const onGamepadUpdate = () => {
            if (gamepad.axes.length > 3) {
                const x = gamepad.axes[2];
                const y = gamepad.axes[3];
                this.movement.forward = y < -0.2;
                this.movement.backward = y > 0.2;
                this.movement.left = x < -0.2;
                this.movement.right = x > 0.2;
            }

            requestAnimationFrame(onGamepadUpdate);
        };

        onGamepadUpdate();
    }
}

new VRScene();