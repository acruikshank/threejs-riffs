const sizes = {
    width: document.body.offsetWidth,
    height: document.body.offsetHeight
}

const scene = new THREE.Scene()
const geometry = new THREE.BoxGeometry(.5, .5, .5)

for (let i=0; i<4500; i++) {
    const z = 100*Math.random()
    const color = ((200+55*Math.random())<<16)+((130-3*z + 100*Math.random())<<8)+160
    const material = new THREE.MeshBasicMaterial({color})
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.x = parseInt(z/8*30*(Math.random()-.5))
    mesh.position.y = parseInt(z/8*24*(Math.random()-.5))
    mesh.position.z = -parseInt(z)
    mesh.rotation.x = z
    scene.add(mesh)
}

const camera = new THREE.PerspectiveCamera(80, sizes.width/sizes.height)
camera.position.z = 9
scene.add(camera)

const canvas = document.querySelector('.webgl')
const renderer = new THREE.WebGLRenderer({
    canvas,
})
renderer.setSize(sizes.width, sizes.height)

renderer.render(scene, camera)