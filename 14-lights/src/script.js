import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import { noise } from 'perlin'

const hsegs = 38, vsegs = 12, steps = 4
const angle = 2*Math.PI/hsegs
const radius = .8
const height = 2

/**
 * Base
 */
// Debug
// const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, .25)
scene.add(ambientLight)

// const colors = [0xff9900, 0xeeff22, 0x99ff33, 0x22ccff, 0xff22ff]
const colors = [0xff9900, 0xeeff22, 0xff22ff]
for (let i=0; i<colors.length; i++) {
    const pointLight = new THREE.PointLight(colors[i], 2, 100)
    const theta = i*2*Math.PI/colors.length
    const r = 3
    pointLight.position.set(r*Math.cos(theta), 5*height/6, r*Math.sin(theta))
scene.add(pointLight)
}

/**
 * Objects
 */
// Material
const material = new THREE.MeshStandardMaterial()
material.roughness = 0.75
material.metalness = 1.8

// Objects
const wedgeShape = new THREE.Shape()
    .moveTo(0,0)
    .ellipse(0, 0, radius, radius, 0, angle, false)
    .lineTo(0,0)
    .lineTo(radius, 0)
const wedgeGeometry = new THREE.ExtrudeGeometry(wedgeShape, { steps: steps, depth: height/vsegs, bevelEnabled: false})

const segs = Array(hsegs).fill().map((_,i)=>Array(vsegs).fill().map((_,j)=>{
    const wedge = new THREE.Mesh(wedgeGeometry, material)
    wedge.rotateX(-Math.PI/2)
    wedge.rotateZ(i*angle)
    wedge.position.y = j*height/vsegs
    return wedge
}))
segs.forEach(row=>row.forEach(wedge=>scene.add(wedge)))

// const plane = new THREE.Mesh(new THREE.PlaneGeometry(100, 100, 1, 1), material)
// plane.rotateX(-Math.PI/2)
// scene.add(plane)

// const plane2 = new THREE.Mesh(new THREE.PlaneGeometry(100, 100, 1, 1), material)
// plane2.rotateX(Math.PI/2)
// plane2.position.y = height
// scene.add(plane2)

const geometry = new THREE.CylinderGeometry( radius*4, radius*4, height, 32 );
const cyMat = new THREE.MeshStandardMaterial({color: 0x111111})
cyMat.roughness = 0.8
cyMat.metalness = 1.2
cyMat.side = THREE.BackSide
const cylinder = new THREE.Mesh( geometry, cyMat );
cylinder.position.y = height/2
scene.add( cylinder );


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
camera.position.x = 0
camera.position.y = height/2
camera.position.z = 2
camera.lookAt(0,height/2,0)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.autoRotate = true
controls.autoRotateSpeed = .5
controls.maxPolarAngle = Math.PI/2
controls.minPolarAngle = Math.PI/2
controls.enableZoom = false
controls.target.set(0,height/2,0)
controls.update()

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

const spacial = .3
const temporal = .08
const hwind = .4
const vwind = .2
const noffset = 1.2
const nscale = .6
const min = .9
const max = 1.4

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    segs.forEach((row,i)=>row.forEach((wedge,j)=>{
        const scale= Math.min(max, Math.max(min, noffset + nscale*noise.perlin3(
            i*spacial + hwind*elapsedTime, 
            j*spacial + vwind*elapsedTime,
            temporal*elapsedTime)))
        wedge.scale.set(scale, scale, 1)
    }))

    // Update objects
    // wedge.rotation.y = 0.1 * elapsedTime
    // wedge.rotation.x = 0.15 * elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)

}

tick()