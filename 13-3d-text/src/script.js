import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { noise } from 'perlin'

const fontScale = 1.2;
const fontSize = .2*fontScale;
const fontDepth = .6 * fontScale;
const bevelSize = 0.02 * fontScale;
const bevelThickness = 0.02 * fontScale;
const totalDepth = fontDepth + bevelThickness;

/**
 * Base
 */

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Axis helper
const axisHelper = new THREE.AxisHelper();
// scene.add(axisHelper);

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const matcapTexture = textureLoader.load('/textures/matcaps/16.png')
const textMaterial = new THREE.MeshMatcapMaterial({matcap: matcapTexture})
const copy = `
Carbon Five is a digital product development
consultancy. We partner with our clients to
create exceptional products and grow effective
teams. Carbon Five is a digital product development
consultancy. We partner with our clients to
create exceptional products and grow effective
teams. Carbon Five is a digital product development
consultancy. We partner with our clients to
create exceptional products and grow effective
teams. Carbon Five is a digital product development
`

/**
 * Fonts
 */
const fontLoader = new THREE.FontLoader()
let text = [];
fontLoader.load('/fonts/helvetiker_bold.typeface.json', (font) => {
    const lineHeight = fontSize*80*font.data.lineHeight/100000

    const baseOffset = -2.25*fontScale;
    let offset = baseOffset;
    let voffset = 2;

    const letters = {}
    copy.split('').forEach((l,i) => {
        if (l == '\n') {
            voffset -= lineHeight
            offset = baseOffset
            return
        }
        let textGeometry = letters[l]
        if (!textGeometry) {
            textGeometry = new THREE.TextBufferGeometry(l, {
                font,
                size: fontSize,
                height: fontDepth,
                curveSegments: 10,
                bevelEnabled: true,
                bevelThickness: bevelThickness,
                bevelSize: bevelSize,
                bevelOffset: 0,
                bevelSegments: 10
            });
            textGeometry.computeBoundingBox();
            letters[l] = textGeometry
        }
        text[i] = new THREE.Mesh(textGeometry, textMaterial)
        text[i].position.x = offset
        text[i].position.y = voffset
        scene.add(text[i])
        offset += fontSize*font.data.glyphs[l].ha/980
    });
})

/**
 * Object
 */
const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100, 100),
    textMaterial
)

scene.add(plane)

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
camera.position.x = -.5
camera.position.y = -.5
camera.position.z = 1.2
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

/**
 * Animate
 */
const clock = new THREE.Clock()

const nscale = .25;
const xdscale = .15;
const ydscale = .15;
const tscale = .2;
const ndepth = 1;
const noffset = -fontDepth;

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)

    if (text) {
        text.forEach((t,i)=>{
            t.position.z = noffset + ndepth*noise.perlin3(
                nscale*t.position.x + xdscale*elapsedTime, 
                nscale*t.position.y + ydscale*elapsedTime,
                 tscale*elapsedTime)
        })
    }
}

tick()