import * as THREE from 'three';

import {
    OrbitControls
} from 'three/examples/jsm/controls/OrbitControls';
import {
    GLTFLoader
} from 'three/examples/jsm/loaders/GLTFLoader';

// import {
//     OrbitControls,GLTFL
// } from 'three/examples/jsm';
import Stats from 'three/examples/jsm/libs/stats.module';


console.log({ GLTFLoader })

// console.log(THREE)

export default class Experience {
    constructor() {
        // Defining state attributes
        const attrs = {
            id: "ID" + Math.floor(Math.random() * 1000000),
            width: window.innerWidth - 0,
            height: window.innerHeight - 0,
            marginTop: 0,
            marginBottom: 0,
            marginRight: 0,
            marginLeft: 0,
            canvas: null,
            scene: null,
            texture: null,
            geometry: null,
            material: null,
            mesh: null,
            camera: null,
            controls: null,
            renderer: null,
            container: "body",
            defaultFont: "Helvetica",
            vertexShader: null,
            fragmentShader: null,
            data: null,
            barModel: null,
            ambientLight: null,
            spotLight: null,
            gridSize: 120,
            ambientOcclusionTexture: null,

        };

        // Defining accessors
        this.getState = () => attrs;
        this.setState = (d) => Object.assign(attrs, d);

        // Automatically generate getter and setters for chart object based on the state properties;
        Object.keys(attrs).forEach((key) => {
            //@ts-ignore
            this[key] = function (_) {
                if (!arguments.length) {
                    return attrs[key];
                }
                attrs[key] = _;
                return this;
            };
        });

        // Custom enter exit update pattern initialization (prototype method)
        this.initializeEnterExitUpdatePattern();
    }


    render() {
        this.setDynamicContainer();
        this.drawCanvasAndWrapper();
        this.setupScene()
        this.setupTextures();
        this.addLights();
        this.setupGeometryMaterialMesh();
        this.setupCamera()
        this.setupControls()
        this.setupRenderer();



        this.tick();

        return this;
    }

    setupScene() {
        const scene = new THREE.Scene()
        this.setState({ scene })

    }
    addLights() {
        const { scene } = this.getState();
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.9);
        scene.add(ambientLight)

        const spotLight = new THREE.SpotLight(0xffaaaa, 330);
        spotLight.position.set(-80, 200, -80);
        let target = new THREE.Object3D();
        target.position.set(0, -80, 200)
        spotLight.target = target;
        spotLight.angle = 4;
        spotLight.penumbra = 1.5;
        spotLight.decay = 0.75;
        spotLight.distance = 3000;

        scene.add(spotLight)
        this.setState({ ambientLight, spotLight })
    }
    setupTextures() {
        const texture = new THREE.TextureLoader().load('./assets/texture-ambient-occlusion.png');
        texture.flipY = false;
        this.setState({ texture, ambientOcclusionTexture: texture })
    }
    setupGeometryMaterialMesh() {
        const { scene, vertexShader, fragmentShader, texture, ambientOcclusionTexture } = this.getState();
        console.log({ vertexShader, fragmentShader })


        let material = new THREE.MeshPhysicalMaterial({
            //color: 0x0000D3,
            map: ambientOcclusionTexture,
            roughness: 0.5,
            aoMap: ambientOcclusionTexture,
            aoMapIntensity: 0.15,
        })


        let uniforms = {
            uTime: { value: 0 },
            uTextureMask: { value: new THREE.TextureLoader().load('./assets/texture-mask-graph.png') },
            uAOMap: ambientOcclusionTexture,
            uLightColor: { value: new THREE.Color('#fff9f9') },
            uColorOne: { value: new THREE.Color('#06082d') },
            uColorTwo: { value: new THREE.Color('#020284') },
            uColorThree: { value: new THREE.Color('#0000ff') },
            uColorFour: { value: new THREE.Color('#71c7f5') },
        }

        material.onBeforeCompile = (shader) => {
            Object.assign(shader.uniforms, uniforms);
            shader.vertexShader = shader.vertexShader.replace(
                `#include <common>`,
                `#include <common>
                uniform sampler2D uTextureMask;
                attribute vec2 aInstanceUV;
                uniform vec3 uLightColor;
                uniform vec3 uColorOne;
                uniform vec3 uColorTwo;
                uniform vec3 uColorThree;
                uniform vec3 uColorFour;
                varying float vHeight;
                varying float vHeightUV;
                `
            )

            shader.vertexShader = shader.vertexShader.replace(
                `#include <begin_vertex>`,
                `#include <begin_vertex>
                vHeightUV = clamp(position.y*2.,0.,1.0);
                vec4 transition = texture2D(uTextureMask,aInstanceUV);
                transformed *= transition.r;
                //vHeight = transformed.b;
                `
            )


            shader.fragmentShader = shader.fragmentShader.replace(
                `#include <common>`,
                `#include <common>
                uniform vec3 uLightColor;
                uniform vec3 uColorOne;
                uniform vec3 uColorTwo;
                uniform vec3 uColorThree;
                uniform vec3 uColorFour;
                varying float vHeight;
                varying float vHeightUV;
                `
            )


            shader.fragmentShader = shader.fragmentShader.replace(
                `#include <color_fragment>`,
                `#include <color_fragment>

                 vec3 highlight = mix(uColorThree,uColorFour,vHeightUV);
                 diffuseColor.rgb = mix(uColorTwo, uColorThree, vHeightUV);
                `
            )
            console.log('shader replaced')


        }


        new GLTFLoader().load('./assets/cube.glb', gltf => {
            const model = gltf.scene.children[0];
            model.material = material;

            let geometry = model.geometry;
            geometry.scale(40, 40, 40)
            scene.add(model)

            this.setState({ barModel: model, geometry });
            this.addInstancedMesh();
        })

        this.setState({ material })
    }

    addInstancedMesh() {
        const { gridSize, scene, camera, barModel, ambientOcclusionTexture, geometry, renderer, material } = this.getState();
        // scene.add(barModel);
        console.log({ geometry, material })
        let instanceCount = gridSize * gridSize;
        let instancedMesh = new THREE.InstancedMesh(
            geometry,
            material,
            instanceCount
        )
        console.log({ material })
        let dummy = new THREE.Object3D();
        let w = 60;
        let instanceUV = new Float32Array(instanceCount * 2)
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                instanceUV.set([i / gridSize, j / gridSize], (i * gridSize + j) * 2);
                dummy.position.set(
                    w * (i - gridSize / 2),
                    0,
                    w * (j - gridSize / 2)
                )
                dummy.updateMatrix();
                instancedMesh.setMatrixAt(i * gridSize + j, dummy.matrix)
            }
        }
        console.log({ instanceUV })
        geometry.setAttribute('aInstanceUV', new THREE.InstancedBufferAttribute(instanceUV, 2));
        scene.add(instancedMesh)

    }

    setupCamera() {
        const { scene, width, height } = this.getState();
        let frustumSize = height;
        let aspect = width / height;
        const perspectiveCamera = new THREE.PerspectiveCamera(70, aspect, 0.1, 1000)
        perspectiveCamera.position.z = 3

        const orthographicCamera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2,
            frustumSize * aspect / 2,
            frustumSize / 2,
            frustumSize / -2,
            -2000,
            2000
        )
        orthographicCamera.position.z = 3;
        let camera = perspectiveCamera;
        camera = orthographicCamera;
        scene.add(camera)
        this.setState({ camera })

    }

    setupControls() {
        const { scene, width, height, canvas, camera } = this.getState();
        const controls = new OrbitControls(camera, canvas)
        // controls.enableDamping = true
        controls.enableRotate = true;
        controls.minPolarAngle = 0; // radians
        controls.maxPolarAngle = Math.PI; // radians
        this.setState({ controls });
    }
    setupRenderer() {
        const { width, height, canvas } = this.getState();
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas
        })
        renderer.setClearColor('#06082B');
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.physicallyCorrectLights = true;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.setState({ renderer })
    }

    tick() {
        console.log('ticking')
        const { scene, renderer, camera, controls } = this.getState();
        controls.update()
        renderer.render(scene, camera)
        window.requestAnimationFrame(this.tick.bind(this))
    }


    drawCanvasAndWrapper() {
        const {
            canvasContainer,
            width,
            height,
            defaultFont,
        } = this.getState();

        // Draw Canvas
        const canvas = canvasContainer
            ._add({
                tag: "canvas",
                className: "webgl"
            })
            .attr("width", width)
            .attr("height", height)
            .attr("font-family", defaultFont)
            .node()

        this.setState({ canvas });
    }

    initializeEnterExitUpdatePattern() {
        d3.selection.prototype._add = function (params) {
            var container = this;
            var className = params.className;
            var elementTag = params.tag;
            var data = params.data || [className];
            var exitTransition = params.exitTransition || null;
            var enterTransition = params.enterTransition || null;
            // Pattern in action
            var selection = container.selectAll("." + className).data(data, (d, i) => {
                if (typeof d === "object") {
                    if (d.id) {
                        return d.id;
                    }
                }
                return i;
            });
            if (exitTransition) {
                exitTransition(selection);
            } else {
                selection.exit().remove();
            }

            const enterSelection = selection.enter().append(elementTag);
            if (enterTransition) {
                enterTransition(enterSelection);
            }
            selection = enterSelection.merge(selection);
            selection.attr("class", className);
            return selection;
        };
    }

    setDynamicContainer() {
        const attrs = this.getState();

        //Drawing containers
        var canvasContainer = d3.select(attrs.container);
        var containerRect = canvasContainer.node().getBoundingClientRect();
        if (containerRect.width > 0) attrs.width = containerRect.width;

        d3.select(window).on("resize." + attrs.id, function () {
            var containerRect = canvasContainer.node().getBoundingClientRect();
            if (containerRect.width > 0) attrs.width = containerRect.width;

            const { width, height, renderer, camera } = attrs;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });

        this.setState({ canvasContainer });
    }
}