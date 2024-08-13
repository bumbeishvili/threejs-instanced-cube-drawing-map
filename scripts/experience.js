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
    setupTextures() {

    }
    setupGeometryMaterialMesh() {
        const { scene, vertexShader, fragmentShader } = this.getState();
        console.log({vertexShader,fragmentShader})
        const material = new THREE.ShaderMaterial({
            // extensions: {
            //     derivatives: "#extension GL_OES_standard_derivatives : enable"
            // },
            side: THREE.DoubleSide,
            uniforms: {
                uTime: { value: 0 },
                uResolution: { value: new THREE.Vector4() }
            },
            vertexShader,
            fragmentShader
        })

        new GLTFLoader().load('./data/cube.glb', gltf => {
            const model = gltf.scene.children[0];
            console.log({material})
            model.material = material;
            scene.add(model);
        })

        this.setState({  material })
    }
    setupControls() {
        const { scene, width, height, canvas, camera } = this.getState();
        const controls = new OrbitControls(camera, canvas)
        controls.enableDamping = true
        this.setState({ controls });
    }
    setupCamera() {
        const { scene, width, height } = this.getState();
        const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000)
        camera.position.z = 3
        scene.add(camera)
        this.setState({ camera })

    }
    setupRenderer() {
        const { width, height, canvas } = this.getState();
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas
        })
        renderer.setClearColor('#001b47');
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.setState({ renderer })
    }

    tick() {
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