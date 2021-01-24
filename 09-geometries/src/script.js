import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'


/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Object
const S = 7, CLOUDS=5, R = 20, N = 50, M = 120

const sets = Array(S).fill().map(()=>[])
const cloudPoints = Array(CLOUDS).fill().map(()=>[])
const innerPoints = []
let currentSet = null, currentCloud = null
const addToRandomSet = (pts, i, j) => {
    pts.forEach(p=>innerPoints.push(p))
    if (currentSet == null || Math.random() < .1) {
        currentSet = Math.random()<.2
            ? sets[0]
            : sets[Math.floor(Math.random()*(sets.length-1)*Math.max(0,1-1.3*i/N))+1]
    }
    pts.forEach(p=>currentSet.push(p))

    if (Math.random() < .2) {
        currentCloud = Math.random() < .8 ? cloudPoints[Math.floor(Math.random()*cloudPoints.length)] : null
    }
    if (currentCloud == null) return 
    pts.slice(0,3).forEach(p=>currentCloud.push(p))
    pts.slice(6).forEach(p=>currentCloud.push(p))
    pts.slice(3,6).forEach(p=>currentCloud.push(p))
}

for (let i=0; i<N; i++) {
    const phi0 = Math.PI*i/(2*N), phi1 = Math.PI*(i+1)/(2*N)
    const r0 = R*Math.cos(phi0), r1 = R*Math.cos(phi1)
    const y0 = R*Math.sin(phi0), y1 = R*Math.sin(phi1)
    const M0 = Math.floor(r0*M/R)
    const M1 = Math.floor(r1*M/R)

    for (let j=0; j<M0; j++) {
        const theta0 = j*2*Math.PI/M0
        const theta1 = (j+1)*2*Math.PI/M0
        if (i == N-1) {
            addToRandomSet([
                r0*Math.sin(theta0), y0, r0*Math.cos(theta0),
                r0*Math.sin(theta1), y0, r0*Math.cos(theta1),
                0, R, 0
            ], i, j)
        } else {
            const q = 2*Math.PI/M1
            const theta2 = q*Math.floor(theta1/q+.0001)
            addToRandomSet([
                r0*Math.sin(theta0), y0, r0*Math.cos(theta0),
                r0*Math.sin(theta1), y0, r0*Math.cos(theta1),
                r1*Math.sin(theta2), y1, r1*Math.cos(theta2),
            ], i, j)
        }
        if (i<N-1 && j<M1) {
            const theta0 = j*2*Math.PI/M1
            const theta1 = (j+1)*2*Math.PI/M1
            const q = 2*Math.PI/M0
            const theta2 = q*Math.floor(theta1/q-.0001)
            addToRandomSet([
                r1*Math.sin(theta0), y1, r1*Math.cos(theta0),
                r0*Math.sin(theta2), y0, r0*Math.cos(theta2),
                r1*Math.sin(theta1), y1, r1*Math.cos(theta1),
            ], i, j)
        }
    }
}

const buildMeshes = sets => {
    const materials = sets.map(()=>new THREE.MeshBasicMaterial({ color: 0x555555, wireframe: false }))
    const geometries = sets.map(()=>new THREE.BufferGeometry())
    sets.forEach((s,i)=>geometries[i].setAttribute('position', new THREE.BufferAttribute(new Float32Array(s),3)))
    const meshes = geometries.map((g,i)=>new THREE.Mesh(g,materials[i]))
    meshes.forEach(m=>scene.add(m))
    return {materials, meshes}
}

const {materials, meshes} = buildMeshes(sets)
materials[0].color = new THREE.Color(0xff1166)
materials.slice(1).forEach((m,i)=>{
    const c = 60//-4*i
    m.color=new THREE.Color((c<<16) + (c<<8) + c)
})
const clouds = buildMeshes(cloudPoints)
const cloudRotationOffset = clouds.meshes.map(()=>2*Math.PI*Math.random())
clouds.meshes.forEach((m,i)=>{
    const s = 50+10*i
    m.scale.set(s,s,s)
})
clouds.materials.forEach((m,i)=>{
    const c = 80-30*i
    m.color=new THREE.Color(((1.8*c)<<16) + ((1.7*c)<<8) + (1.5*c)|0)
})
const inner = buildMeshes([innerPoints])
inner.meshes.forEach((m,i)=>(s=>m.scale.set(s,s,s))(.99))
inner.materials.forEach((m,i)=>m.color=new THREE.Color(0x000000))

// Sizes
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

// Camera
const camera = new THREE.PerspectiveCamera(55, sizes.width / sizes.height, 0.1, 5000)
camera.position.z = -37
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.enablePan = false
controls.enableZoom = false
controls.maxPolarAngle = 1.1*Math.PI/2
controls.autoRotate = true
controls.autoRotateSpeed = -.3
controls.target = new THREE.Vector3(0,1.1*R/2,0)

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Animate
const clock = new THREE.Clock()

const rotQuant = 50
const rotations = Array(meshes.length).fill(0)
const rotateAway = (shell, i) => new Promise(resolve => {
    const possibleRotations = Array(S+1).fill().map((x,j)=>rotations[i]+j-parseInt((S+1)/2))//.filter(r=>!~rotations.indexOf(r))
    const nextRot = possibleRotations[Math.floor(possibleRotations.length*Math.random())]
    const delta = Math.abs(nextRot-rotations[i])
    rotations[i] = nextRot
    gsap.to(shell.rotation, {y:rotations[i]*2*Math.PI/rotQuant, duration:.1*delta, ease: 'none', onComplete: resolve})
})
const rotateBack = (shell, i, rotation) => new Promise(resolve => {
    const delta = Math.abs(rotation-rotations[i])
    rotations[i] = rotation
    gsap.to(shell.rotation, {y:rotations[i]*2*Math.PI/rotQuant, duration:.1*delta, ease: 'none', onComplete: resolve})
})
const so = .015, si = .004, sc = .003
const scaleIn=()=>new Promise(resolve=>meshes.forEach((m,i)=> gsap.to(m.scale, {x:1-si*i, y:1-si*i, z:1-si*i, duration:.4, ease:'none', onComplete:i?undefined:resolve})))
const scaleOut=()=>new Promise(resolve=>meshes.forEach((m,i)=> gsap.to(m.scale, {x:1+so*i*i, y:1+so*i*i, z:1+so*i*i, duration:.75, onComplete:i?undefined:resolve})))
const scaleCenter=()=>new Promise(resolve=>meshes.forEach((m,i)=> gsap.to(m.scale, {x:1+sc*i, y:1+sc*i, z:1+sc*i, duration:.3, onComplete:i?undefined:resolve})))
const animate = async () => {
    while (true) {
        await scaleCenter()
        await new Promise(r=>setTimeout(r,1250))
        await scaleOut()
        const movement = Math.floor(3*Math.random())+1
        for (let j=0; j<movement; j++) {
            for (let i=0; i<meshes.length; i++) {
                await rotateAway(meshes[i], i)
            }
        }
        for (let i=0; i<meshes.length-1; i++) {
            await rotateBack(meshes[i], i, rotations[meshes.length-1])
        }
        // await scaleIn()
    }
}
animate()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // update clouds
    clouds.meshes.forEach((m,i)=> m.rotation.y = .01*elapsedTime / (5*i+1) + cloudRotationOffset[i])

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()