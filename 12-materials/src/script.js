import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { MeshBasicMaterial } from 'three'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import * as dat from 'dat.gui'

/**
 * Debug
 */
const gui = new dat.GUI()

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const cubeTextureLoader = new THREE.CubeTextureLoader()


const doorColorTexture = textureLoader.load('/textures/door/color.jpg')
const doorAlphaTexture = textureLoader.load('/textures/door/alpha.jpg')
const doorAmbientOcclusionTexture = textureLoader.load('/textures/door/ambientOcclusion.jpg')
const doorHeightTexture = textureLoader.load('/textures/door/height.jpg')
const doorNormalTexture = textureLoader.load('/textures/door/normal.jpg')
const doorMetalnessTexture = textureLoader.load('/textures/door/metalness.jpg')
const doorRoughnessTexture = textureLoader.load('/textures/door/roughness.jpg')
const matcapTexture = textureLoader.load('/textures/matcaps/3.png')
const gradientTexture = textureLoader.load('/textures/gradients/5.jpg')
const displacementTexture = textureLoader.load('/textures/dis1.png')
const normalTexture = textureLoader.load('/textures/NormalMap.png')
gradientTexture.minFilter = THREE.NearestFilter
gradientTexture.magFilter = THREE.NearestFilter

const environmentMapTexture = cubeTextureLoader.load([
    '/textures/environmentMaps/1/px.jpg',
    '/textures/environmentMaps/1/nx.jpg',
    '/textures/environmentMaps/1/py.jpg',
    '/textures/environmentMaps/1/ny.jpg',
    '/textures/environmentMaps/1/pz.jpg',
    '/textures/environmentMaps/1/nz.jpg',
])
/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()
RectAreaLightUniformsLib.init();

/**
 * Objects
 */
// const material = new THREE.MeshBasicMaterial()
// material.color.set(0xff00ff)
// material.transparent = true
// material.opacity = .2
// material.alphaMap = doorAlphaTexture

// const material = new THREE.MeshNormalMaterial()
// material.flatShading = true

// const material = new THREE.MeshMatcapMaterial()
// material.matcap = matcapTexture

// const material = new THREE.MeshDepthMaterial()

// const material = new THREE.MeshLambertMaterial()

// const material = new THREE.MeshPhongMaterial({color: 0x222222})
// material.shininess = 100
// material.displacementMap = displacementTexture
// material.aoMap = displacementTexture
// material.displacementScale = .5
// gui.add(material, 'shininess').min(0).max(1000).step(.1)
// gui.add(material, 'displacementScale').min(0).max(5).step(.01)
// material.specular = new THREE.Color(0xff3399)

// const material = new THREE.MeshToonMaterial()
// material.gradientMap = gradientTexture

// const material = new THREE.MeshStandardMaterial()
// material.map = doorColorTexture
// material.aoMap = doorAmbientOcclusionTexture
// material.displacementMap = doorHeightTexture
// material.metalnessMap = doorMetalnessTexture
// material.roughnessMap = doorRoughnessTexture
// material.normalMap = doorNormalTexture
// material.alphaMap = doorAlphaTexture
// material.metalness = 0
// material.roughness = 1
// material.aoMapIntensity = 1
// material.displacementScale = .05
// material.normalScale.set(.5, .5)
// material.transparent = true
// gui.add(material, 'metalness').min(0).max(1).step(.0001)
// gui.add(material, 'roughness').min(0).max(1).step(.0001)
// gui.add(material, 'aoMapIntensity').min(0).max(10).step(.0001)
// gui.add(material, 'displacementScale').min(0).max(1).step(.0001)

const material = new THREE.MeshStandardMaterial({color: 0x000000})
material.metalness = 0.0
material.roughness = 0.4
material.displacementMap = displacementTexture
material.displacementScale = .5
gui.add(material, 'metalness').min(0).max(1).step(.0001)
gui.add(material, 'roughness').min(0).max(1).step(.0001)

// const sphere = new THREE.Mesh(
//     new THREE.SphereBufferGeometry(0.5, 64, 64),
//     material
// )
// sphere.position.x = -1.5
// sphere.geometry.setAttribute('uv2', new THREE.BufferAttribute(sphere.geometry.attributes.uv.array, 2))
material.displacementMap = displacementTexture
material.displacementScale = .8
material.normalMap = normalTexture
gui.add(material, 'displacementScale').min(0).max(2).step(.001).onChange(()=>
    material.normalScale.set(material.displacementScale,material.displacementScale))


const plane = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(2, 2, 128, 128),
    material
)
// plane.geometry.setAttribute('uv2', new THREE.BufferAttribute(plane.geometry.attributes.uv.array, 2))

// const torus = new THREE.Mesh(
//     new THREE.TorusBufferGeometry(0.3, 0.2, 64, 128),
//     material
// )
// torus.position.x = 1.5
// torus.geometry.setAttribute('uv2', new THREE.BufferAttribute(torus.geometry.attributes.uv.array, 2))

// scene.add(sphere, plane, torus)
scene.add(plane)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffff00, 0.5)
scene.add(ambientLight)

// const pointLight = new THREE.PointLight(0xffffff, 0.5)
// pointLight.position.x = -3
// pointLight.position.y = 0
// pointLight.position.z = 4
// scene.add(pointLight)

const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
directionalLight.position.set(-3,0,5)
directionalLight.target = plane
scene.add( directionalLight );


/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 1
camera.position.y = 1
camera.position.z = 2
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0x444444)

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{    
    const elapsedTime = clock.getElapsedTime()

    // sphere.rotation.x = .1*elapsedTime
    // plane.rotation.x = .1*elapsedTime
    // torus.rotation.x = .1*elapsedTime

    // sphere.rotation.y = .15*elapsedTime
    // plane.rotation.y = .15*elapsedTime
    // torus.rotation.y = .15*elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()