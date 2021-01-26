import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ImageUtils } from 'three'

/**
 * Textures
 */

 const loadingManager = new THREE.LoadingManager()

 loadingManager.onProgress = (file, x, y) => console.log('onprogress', file, x, y)

const textureLoader = new THREE.TextureLoader(loadingManager)
const textures = Array(16).fill().map((x,i)=>textureLoader.load(`./textures/meat/${i+1}.jpg`))
    .filter((x,i)=>!!~[15,4,7,8,10,13].indexOf(i))
    // .filter((x,i)=>!!~[0,1,2,3,6,9,11,14].indexOf(i))

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()
const group = new THREE.Group()
scene.add(group)

/**
 * Object
 */
const cubeGeometry = new THREE.BoxBufferGeometry(1,1,1)

let chooseIndex = 4
const chooseTexture = ()=>textures[(chooseIndex++)%textures.length]
const setCube = (m, s, cx, cy, cz, x, y, z) => {
    m.scale.set(s*.999,s*.999,s*.999)
    m.position.set(cx + s*x, cy + s*y, cz + s*z)
    m.material.side = THREE.DoubleSide
}
const fract = (d,s,cx,cy,cz) => {
    if (d < 1) return

    const cubeMeshes = Array(9).fill().map((x,i)=>new THREE.Mesh(cubeGeometry, new THREE.MeshBasicMaterial({ map: chooseTexture() })))
    setCube(cubeMeshes[0], s, cx, cy, cz, 0, 0, 0)
    setCube(cubeMeshes[1], s, cx, cy, cz, 1, 1, 1)
    setCube(cubeMeshes[2], s, cx, cy, cz, -1, 1, 1)
    setCube(cubeMeshes[3], s, cx, cy, cz, 1, -1, 1)
    setCube(cubeMeshes[4], s, cx, cy, cz, -1, -1, 1)
    setCube(cubeMeshes[5], s, cx, cy, cz, 1, 1, -1)
    setCube(cubeMeshes[6], s, cx, cy, cz, -1, 1, -1)
    setCube(cubeMeshes[7], s, cx, cy, cz, 1, -1, -1)
    setCube(cubeMeshes[8], s, cx, cy, cz, -1, -1, -1)
    cubeMeshes.forEach((m,i)=>group.add(m))
    fract(d-1, s/3, cx+s, cy, cz+s)
    fract(d-1, s/3, cx-s, cy, cz+s)
    fract(d-1, s/3, cx, cy+s, cz+s)
    fract(d-1, s/3, cx, cy-s, cz+s)
    fract(d-1, s/3, cx, cy, cz+s)
    fract(d-1, s/3, cx+s, cy, cz-s)
    fract(d-1, s/3, cx-s, cy, cz-s)
    fract(d-1, s/3, cx, cy+s, cz-s)
    fract(d-1, s/3, cx, cy-s, cz-s)
    fract(d-1, s/3, cx, cy, cz-s)
    fract(d-1, s/3, cx, cy+s, cz)
    fract(d-1, s/3, cx, cy-s, cz)
    fract(d-1, s/3, cx+s, cy+s, cz)
    fract(d-1, s/3, cx+s, cy, cz)
    fract(d-1, s/3, cx+s, cy-s, cz)
    fract(d-1, s/3, cx-s, cy+s, cz)
    fract(d-1, s/3, cx-s, cy, cz)
    fract(d-1, s/3, cx-s, cy-s, cz)
}
fract(2,1,0,0,0)
group.rotation.x = Math.PI/4

const background = new THREE.Mesh(cubeGeometry, new THREE.MeshBasicMaterial({ map: chooseTexture() }))
scene.add(background)
background.scale.set(100,100,100)
background.material.side = THREE.BackSide


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
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, .6, 100)
camera.position.z = 1.2
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.autoRotate = true
controls.autoRotateSpeed = -.3
controls.enableZoom = false
controls.minPolarAngle = Math.PI/2
controls.maxPolarAngle = Math.PI/2
controls.enablePan = false

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    group.rotation.y = .01*elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

loadingManager.onLoad = tick