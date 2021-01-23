import './style.css'
import * as THREE from 'three'

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Object
const geometry = new THREE.BoxGeometry(.1, .1, 1)
const material = new THREE.MeshBasicMaterial({ color: 0xf0f6ff })

const M = 80
const N = 50
const meshes = Array(M).fill().map(x=>Array(N).fill().map(x=>new THREE.Mesh(geometry, material)))
meshes.forEach((r,i)=>r.forEach((mesh,j)=>{
    mesh.position.x = i-M/2
    mesh.position.y = j-N/2
    scene.add(mesh)    
}))

// Sizes
const sizes = {
    width: 1660,
    height: 1034
}

// Camera
const camera = new THREE.PerspectiveCamera(55, sizes.width / sizes.height)
scene.add(camera)

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)

const clock = new THREE.Clock()

const tick = () => {    
    renderer.render(scene, camera)
    // mesh.position.x += dTheta * deltaTime
    // mesh.rotation.y = dTheta * clock.getElapsedTime()
    const time = clock.getElapsedTime()
    const theta = .25*Math.sin(.13 * time)
    const cameraOffset = 50
    camera.position.x = cameraOffset*Math.sin(theta)
    camera.position.z = cameraOffset*Math.cos(theta)
    camera.position.y = 2*Math.sin(theta)

    const phi = .5+(1.25*(Math.sin(.1*time)+.5*Math.cos(.3*time)) + 4)%1

    meshes.forEach((r,i)=>r.forEach((mesh,j)=>{
        let {x, y} = mesh.position
        mesh.scale.z = 60*Math.sin(.05*Math.sqrt(x*x+y*y) - phi)
    }))

    camera.lookAt(new THREE.Vector3(0,0,0))
    requestAnimationFrame(tick)
}
tick()
