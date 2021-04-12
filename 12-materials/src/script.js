import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import { gsap } from 'gsap'

/**
 * TODO:
 * 1. Add page 0
 * 2. Add page 5 with robot
 * 3. Color correct hemisphere light
 * 4. Page 1-2 transition is fast
 * 5. [Done] Get rid of x tilt on page 3
 * 6. [Done] Fix ease for rotations on page 3 so it doesn't happen late.
 * 7. [Done] Change break out so it's it breaks apart on x as well as z. And simpify group rotation.
 * 8. [Done] Fix edges on matrix/infill texture.
 */

/**
 * Debug
 */
const gui = new dat.GUI()
const matColor = 0x484848
const metalness = .7241
const roughness = .6699
const displacement = .473
const objectX = 0
const objectY = 0
const objectZ = -0.19
const alColor = 0x273561
const hoverHeight = 1
const hoverDepth = 2
const panelWidth = 2.42
const page0ZOffset = 1.3

// const cameraX = 0
// const cameraY = 0
// const cameraZ = 5

const cameraX = 0
const cameraY = -1.19
const cameraZ = .14

const camera2X = -3.549
const camera2Y = 1.1968
const camera2Z = 4.5758

const floorColor = 0xaaaaaa
const windowColor = 0x000000

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()

const matrixTexture = textureLoader.load('./textures/matrix.png')
matrixTexture.wrapS = matrixTexture.wrapT = THREE.RepeatWrapping
const infillTexture = textureLoader.load('./textures/infill.png')
infillTexture.wrapS = infillTexture.wrapT = THREE.RepeatWrapping

/**
 * Base
 */

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Panel geometry
 * Geometry is a cuboid with for vertices in the back, NxN in the front and 2*N vertices on the sides.
 * The back shares vertices with the sides at the corners. The sides are divided into slices with 2
 * vertices on the back edge and 2 shared with the front. The layout is:
 * [0 - N-1]: back left side
 * [N - M+N-1]: back top
 * [M+N - M+2N-1]: back right
 * [M+2N - 2(M+N)-1]: back bottom
 * [2(M+N) - 2(M+N)+ M*N]: front left to right, top to bottom
 */

const lerp = (a, b, x) => a + x*(b-a)
const panelGeometry = (w, h, d, M, N, uvScale, zfn) => {
    const l=-w/2, r=w/2, t=h/2, b=-h/2, bk = -d/2, f=d/2
    const vertices = []
    for (let i=0; i<N; i++) vertices.push(l, lerp(b,t,i/(N-1)), bk) // back left, bottom to top
    for (let i=0; i<M; i++) vertices.push(lerp(l,r,i/(M-1)), t, bk) // back top, left to right
    for (let i=0; i<N; i++) vertices.push(r, lerp(t,b,i/(N-1)), bk) // back right, top to bottom
    for (let i=0; i<M; i++) vertices.push(lerp(r,l,i/(M-1)), b, bk) // back bottom, right to left
    for (let j=0; j<N; j++) for (let i=0; i<M; i++) 
        vertices.push(lerp(l,r,i/(M-1)), lerp(b,t,j/(N-1)), f + zfn(i/(M-1), j/(N-1)))
    const indices = []
    indices.push(0, N, M+N, 0, M+N, M+2*N)  // back rectangle
    const so = 2*(M+N)
    for (let i=0; i<N-1; i++) indices.push(i, so+i*M, so+(i+1)*M, i, so+(i+1)*M, i+1)
    for (let i=0; i<M-1; i++) indices.push(N+i, so+(N-1)*M+i, so+(N-1)*M+i+1, N+i, so+(N-1)*M+i+1, N+i+1)
    for (let i=0; i<N-1; i++) indices.push(M+N+i, so+(N-i)*M-1, so+(N-i-1)*M-1, M+N+i, so+(N-i-1)*M-1, M+N+i+1)
    for (let i=0; i<M-1; i++) indices.push(M+2*N+i, so+M-i-1, so+M-i-2, M+2*N+i, so+M-i-2, M+2*N+i+1)
    for (let i=0; i<M-1; i++) for (let j=0; j<N-1; j++)
        indices.push(so+i+j*M, so+i+(j+1)*M+1, so+i+(j+1)*M, so+i+j*M, so+i+j*M+1, so+i+(j+1)*M+1)

    const geometry = new THREE.BufferGeometry();
    geometry.setIndex(indices)
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

    if (uvScale > 0) {
        const uv = []
        for (let i=0; i<N; i++) uv.push(uvScale*(l-d), uvScale*lerp(b,t,i/(N-1))) // back left, bottom to top
        for (let i=0; i<M; i++) uv.push(uvScale*lerp(l,r,i/(M-1)), uvScale*(t+d)) // back top, left to right
        for (let i=0; i<N; i++) uv.push(uvScale*(r+d), uvScale*lerp(t,b,i/(N-1))) // back right, top to bottom
        for (let i=0; i<M; i++) uv.push(uvScale*lerp(r,l,i/(M-1)), uvScale*(b-d)) // back bottom, right to left
        for (let j=0; j<N; j++) for (let i=0; i<M; i++) uv.push(uvScale*lerp(l,r,i/(M-1)), uvScale*lerp(b,t,j/(N-1)))
        uv[0] = uvScale * l, uv[1] = uvScale * b
        uv[2*N] = uvScale * l, uv[2*N+1] = uvScale * t
        uv[2*(N+M)] = uvScale * r, uv[2*(N+M)+1] = uvScale * t
        uv[2*(2*N+M)] = uvScale * r, uv[2*(2*N+M)+1] = uvScale * b
        geometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( uv, 2 ) );
    }
 
    geometry.computeVertexNormals()
    return geometry
}

/**
 * Materials
 */

const material = new THREE.MeshStandardMaterial({color: matColor})
material.metalness = metalness
material.roughness = roughness
gui.addColor({matColor: material.color.getHex()}, 'matColor')
    .onChange((c)=>material.color.setHex(c))
gui.add(material, 'metalness').min(0).max(1).step(.0001)
gui.add(material, 'roughness').min(0).max(1).step(.0001)

const sideMaterial = new THREE.MeshStandardMaterial({color: matColor})
sideMaterial.transparent = true
sideMaterial.metalness = metalness
sideMaterial.roughness = roughness
sideMaterial.opacity = 1

const matrixMat = new THREE.MeshStandardMaterial({color: 0x999999})
matrixMat.side = THREE.DoubleSide
matrixMat.transparent = true
matrixMat.map = matrixTexture
matrixMat.metalness = 0
matrixMat.roughness = 1
matrixMat.opacity = 0

const infillMat = new THREE.MeshStandardMaterial({color: 0x999999})
infillMat.side = THREE.DoubleSide
infillMat.transparent = true
infillMat.map = infillTexture
infillMat.metalness = 0
infillMat.roughness = 1
infillMat.opacity = 0

const floorMaterial = new THREE.MeshPhongMaterial({color: 0x1d1f24})
const floorGui = gui.addFolder('floor')
floorGui.addColor({floorColor: material.color.getHex()}, 'floorColor')
    .onChange((c)=>floorMaterial.color.setHex(c))
floorMaterial.emissive = new THREE.Color(0x1a1a1a)
floorMaterial.transparent = true
floorMaterial.opacity = 0

const windowMaterial = new THREE.MeshStandardMaterial({color: windowColor})
const windowGui = gui.addFolder('window')
windowGui.addColor({windowColor: material.color.getHex()}, 'windowColor')
    .onChange((c)=>windowMaterial.color.setHex(c))
windowMaterial.metalness = 0.4
windowMaterial.roughness = 0.3
windowMaterial.transparent = true
windowMaterial.opacity = 0
windowGui.add(windowMaterial, 'metalness').min(0).max(1).step(.0001)
windowGui.add(windowMaterial, 'roughness').min(0).max(1).step(.0001)


/**
 * Objects
 */

const zfn = (tx,ty,w,h) => (x,y) => {
    const c = .5
    const xp = tx + x*w, yp = ty + y*h
    const dx = xp-1.9, dy = yp-.5, r = Math.sqrt(dx*dx + dy*dy)
    return .015*Math.exp(1-.8*r)*Math.sin(9*Math.PI*Math.pow(r,.75))
}

const rotation = {x: 0.244, y: .296, z: 0}
const rotGui = gui.addFolder('rotation')
const rOnChange = ()=>{
    cutout1.rotation.set(rotation.x, rotation.y, rotation.z)
    cutout2Group.rotation.set(rotation.x, rotation.y, rotation.z)
    cutout3.rotation.set(rotation.x, rotation.y, rotation.z)
}

const cutout1 = new THREE.Mesh(    
    panelGeometry(panelWidth/3, 2.1, .2, 528, 128, 0, zfn(0,0,2/3,2.1)),
    sideMaterial
)
cutout1.position.set(objectX-panelWidth/3,objectY,objectZ - page0ZOffset)

const cutout2 = new THREE.Mesh(    
    panelGeometry(panelWidth/3, 2.1, .2, 528, 128, 0, zfn(2/3,0,2/3,2.1)),
    material
)

const cutout3 = new THREE.Mesh(    
    panelGeometry(panelWidth/3, 2.1, .2, 528, 128, 0, zfn(4/3,0,2/3,2.1)),
    sideMaterial
)
cutout3.position.set(objectX+panelWidth/3,objectY,objectZ - page0ZOffset)

const infillCutout = new THREE.Mesh(    
    panelGeometry(panelWidth/3, 2.1, .2, 528, 128, 13.1, zfn(2/3,0,2/3,2.1)),
    infillMat
)

const matrixCutout = new THREE.Mesh(    
    panelGeometry(panelWidth/3, 2.1, .2, 528, 128, 12.55, zfn(2/3,0,2/3,2.1)),
    matrixMat
)

const floorGeometry = new THREE.BoxBufferGeometry(6, .075, 1)
const floor1 = new THREE.Mesh(floorGeometry, floorMaterial)
floor1.position.set(0, 1.05, -.75)
const floor2 = new THREE.Mesh(floorGeometry, floorMaterial)
floor2.position.set(0, 0, -.75)
const floor3 = new THREE.Mesh(floorGeometry, floorMaterial)
floor3.position.set(0, -1.05, -.75)

const buildingGroup = new THREE.Group()
buildingGroup.visable = false
buildingGroup.add(floor1, floor2, floor3)

const windowGeometry = new THREE.BoxBufferGeometry(.49, 1, .02)
Array(12).fill().forEach((_,i)=>Array(2).fill().forEach((_,j) => {
    const window = new THREE.Mesh(windowGeometry, windowMaterial)
    window.position.set(-2.75 + .5*i, -.5+j, -.3)
    buildingGroup.add(window)
}))

const sectionGeometry = new THREE.BoxBufferGeometry(2/3, 2, .3)
const section1 = new THREE.Mesh(material, sectionGeometry)

const cutout2Group = new THREE.Group();
cutout2Group.add(cutout2)
cutout2Group.add(infillCutout)
cutout2Group.add(matrixCutout)
cutout2Group.position.set(objectX,objectY,objectZ - page0ZOffset)

// scene.add(sphere, plane, torus)
scene.add(cutout1, cutout2Group, cutout3, buildingGroup)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(alColor, 0.5)
const ambientFolder = gui.addFolder('ambient')
ambientFolder.addColor({color: ambientLight.color.getHex()}, 'color')
    .onChange((c)=>ambientLight.color.setHex(c))
ambientFolder.add(ambientLight, 'intensity').min(0).max(1).step(.01)
scene.add(ambientLight)

// const pointLight = new THREE.PointLight(0xffffff, 0.5)
// pointLight.position.x = -3
// pointLight.position.y = 0
// pointLight.position.z = 4
// scene.add(pointLight)

const hemiLight = new THREE.HemisphereLight( 0x313641, 0xf2f2f2, 1 );
const hemiFolder = gui.addFolder("hemi light")
hemiFolder.addColor({sky: hemiLight.color.getHex()}, "sky").onChange((c)=>hemiLight.color = new THREE.Color(c))
hemiFolder.addColor({ground: hemiLight.groundColor.getHex()}, "ground").onChange((c)=>hemiLight.groundColor = new THREE.Color(c))
hemiFolder.add(hemiLight, 'intensity').min(0).max(1).step(.01)
scene.add(hemiLight)

const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
directionalLight.position.set(.67,-0.21,4.5)
const directionalGui = gui.addFolder("directional light")
directionalGui.add(directionalLight.position, 'x').min(-5).max(5).step(.01)
directionalGui.add(directionalLight.position, 'y').min(-5).max(5).step(.01)
directionalGui.add(directionalLight.position, 'z').min(-5).max(5).step(.01)
directionalGui.add(directionalLight, 'intensity').min(0).max(1).step(.01)
directionalGui.addColor({color: directionalLight.color.getHex()}, "color").onChange((c)=>directionalLight.color = new THREE.Color(c))
directionalLight.target = cutout2Group
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

    // postprocessing.composer.setSize( width, height );
})

/**
 * Camera
 */

// Base camera
const camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 0.1, 100)
global.cam = camera
camera.position.x = cameraX
camera.position.y = cameraY
camera.position.z = cameraZ

const cameraGui = gui.addFolder('cameraPosition')
cameraGui.add(camera.position,'x',-3,3,.01)
cameraGui.add(camera.position,'y',-3,3,.01)
cameraGui.add(camera.position,'z',-3,3,.01)

scene.add(camera)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0x1f2126)

/**
 * Effects
 */

/*

const renderPass = new RenderPass( scene, camera );

const bokehPass = new BokehPass( scene, camera, {
    focus: 1.0,
    aperture: 0.025,
    maxblur: 0.01,

    width: sizes.width,
    height: sizes.height
} );

const composer = new EffectComposer( renderer );

composer.addPass( renderPass );
composer.addPass( bokehPass );

const postprocessing = {};
postprocessing.composer = composer;
postprocessing.bokeh = bokehPass;

const effectController = {
    focus: 500.0,
    aperture: 5,
    maxblur: 0.01
};

const matChanger = function ( ) {
    postprocessing.bokeh.uniforms[ "focus" ].value = effectController.focus;
    postprocessing.bokeh.uniforms[ "aperture" ].value = effectController.aperture * 0.00001;
    postprocessing.bokeh.uniforms[ "maxblur" ].value = effectController.maxblur;
};

const dofGui = gui.addFolder('dof');
dofGui.add( effectController, "focus", 10.0, 3000.0, 10 ).onChange( matChanger );
dofGui.add( effectController, "aperture", 0, 10, 0.1 ).onChange( matChanger );
dofGui.add( effectController, "maxblur", 0.0, 0.01, 0.001 ).onChange( matChanger );
dofGui.close();

matChanger();

const ssaoPass = new SSAOPass( scene, camera, sizes.width, sizes.height );
ssaoPass.kernelRadius = 16;
composer.addPass( ssaoPass );

const ssaoGui = gui.addFolder("ssao")
ssaoGui.add( ssaoPass, 'output', {
    'Default': SSAOPass.OUTPUT.Default,
    'SSAO Only': SSAOPass.OUTPUT.SSAO,
    'SSAO Only + Blur': SSAOPass.OUTPUT.Blur,
    'Beauty': SSAOPass.OUTPUT.Beauty,
    'Depth': SSAOPass.OUTPUT.Depth,
    'Normal': SSAOPass.OUTPUT.Normal
} ).onChange( function ( value ) { ssaoPass.output = parseInt( value ); } );
ssaoGui.add( ssaoPass, 'kernelRadius' ).min( 0 ).max( 32 );
ssaoGui.add( ssaoPass, 'minDistance' ).min( 0.001 ).max( 0.02 );
ssaoGui.add( ssaoPass, 'maxDistance' ).min( 0.01 ).max( 0.3 );
*/

/**
 * Animate
 */

rotGui.add(rotation, 'x').min(-Math.PI/4).max(Math.PI/4).step(.001).onChange(rOnChange)
rotGui.add(rotation, 'y').min(-Math.PI/4).max(Math.PI/4).step(.001).onChange(rOnChange)
rotGui.add(rotation, 'z').min(-Math.PI/4).max(Math.PI/4).step(.001).onChange(rOnChange)

const page2Camera = new THREE.Vector3(camera2X, camera2Y, camera2Z)
const page2CameraGui = gui.addFolder('page 2 camera')
page2CameraGui.add(page2Camera,'x',-3,3,.01).onChange(()=>camera.position.x = page2Camera.x)
page2CameraGui.add(page2Camera,'y',-3,3,.01).onChange(()=>camera.position.y = page2Camera.y)
page2CameraGui.add(page2Camera,'z',0,6,.01).onChange(()=>camera.position.z = page2Camera.z)

const page1Duration = 1

const page0Transition=()=>{
    buildingGroup.visible = false
    gsap.to(cutout1.position, {x:objectX-panelWidth/3, y:objectY, z:objectZ - page0ZOffset, duration: page1Duration})
    gsap.to(cutout2Group.position, {x:objectX, y:objectY, z:objectZ - page0ZOffset, duration: page1Duration})
    gsap.to(cutout3.position, {x:objectX+panelWidth/3, y:objectY, z:objectZ - page0ZOffset, duration: page1Duration})
}
gui.add({page0: page0Transition}, 'page0')

const page1Transition=()=>{
    buildingGroup.visible = false
    gsap.to(camera.position, {x:cameraX, y:cameraY, z:cameraZ, duration:page1Duration})
    gsap.to(floorMaterial, {opacity:0, duration:page1Duration})
    gsap.to(windowMaterial, {opacity:0, duration:page1Duration})
    gsap.to(cutout1.position, {x:objectX-panelWidth/3, y:objectY, z:objectZ, duration: page1Duration})
    gsap.to(cutout2Group.position, {x:objectX, y:objectY, z:objectZ, duration: page1Duration})
    gsap.to(cutout3.position, {x:objectX+panelWidth/3, y:objectY, z:objectZ, duration: page1Duration})
    gsap.to(cutout1.rotation, {x:0, y:0, z:0, duration: page3Duration})
    gsap.to(cutout2Group.rotation, {x:0, y:0, z:0, duration: page3Duration})
    gsap.to(cutout3.rotation, {x:0, y:0, z:0, duration: page3Duration})
}
gui.add({page1: page1Transition}, 'page1')

const page2EaseExp = 2
const page2Ease = x=>x<.5?.5*Math.pow(2*x,page2EaseExp):1-.5*Math.pow(2-2*x, page2EaseExp)
const page2Duration = 3
const page2Transition=()=>{
    buildingGroup.visible = true
    gsap.to(camera.position, {x:page2Camera.x, y:page2Camera.y, z:page2Camera.z, duration:page2Duration, ease:page2Ease})
    gsap.to(floorMaterial, {opacity:1, duration:page2Duration, ease:page2Ease})
    gsap.to(windowMaterial, {opacity:.5, duration:page2Duration, ease:page2Ease})
    gsap.to(cutout1.position, {x:objectX-panelWidth/3, y:objectY, z:objectZ, duration: page2Duration})
    gsap.to(cutout2Group.position, {x:objectX, y:objectY, z:objectZ, duration: page2Duration})
    gsap.to(cutout3.position, {x:objectX+panelWidth/3, y:objectY, z:objectZ, duration: page2Duration})
    gsap.to(cutout1.rotation, {x:0, y:0, z:0, duration: page3Duration})
    gsap.to(cutout2Group.rotation, {x:0, y:0, z:0, duration: page3Duration})
    gsap.to(cutout3.rotation, {x:0, y:0, z:0, duration: page3Duration})
}
gui.add({page2: page2Transition}, 'page2')

const page3Duration = 1
const rotEase = x => Math.pow(x, 2)
const page3Transition=()=>{
    gsap.to(camera.position, {x:0, y:.2, z:8, duration:page3Duration, ease:page2Ease})
    gsap.to(cutout1.position, {x:-2.5, y:hoverHeight, z:hoverDepth, duration: page3Duration})
    gsap.to(cutout1.rotation, {x:rotation.x, y:rotation.y, z:rotation.z, duration: page3Duration})
    gsap.to(cutout2Group.position, {x: 0, y:hoverHeight, z:hoverDepth, duration: page3Duration})
    gsap.to(cutout2Group.rotation, {x:rotation.x, y:rotation.y, z:rotation.z, duration: page3Duration})
    gsap.to(cutout3.position, {x: 2.5, y:hoverHeight, z:hoverDepth, duration: page3Duration})
    gsap.to(cutout3.rotation, {x:rotation.x, y:rotation.y, z:rotation.z, duration: page3Duration})
    gsap.to(floorMaterial, {opacity:0, duration:page3Duration, ease:page2Ease})
    gsap.to(windowMaterial, {opacity:0, duration:page3Duration, ease:page2Ease})
    gsap.to(matrixMat, {opacity:0, duration:page4Duration, ease:page3Duration})
    gsap.to(infillMat, {opacity:0, duration:page4Duration, ease:page3Duration})
    gsap.to(sideMaterial, {opacity:1, duration:page4Duration, ease:page3Duration})
    gsap.to(cutout2.position, {z:0, duration:page4Duration, ease:page4Duration})
    gsap.to(matrixCutout.position, {z:0, duration:page4Duration, ease:page4Duration})

    gsap.to(cutout2.rotation, {x:0, y:0, z:0, duration: page4Duration})
    gsap.to(infillCutout.rotation, {x:0, y:0, z:0, duration: page4Duration})
    gsap.to(matrixCutout.rotation, {x:0, y:0, z:0, duration: page4Duration})
    gsap.to(cutout2.position, {x:0, z:0, duration:page4Duration})
    gsap.to(matrixCutout.position, {x:0, z:0, duration:page4Duration})
}
gui.add({page3: page3Transition}, 'page3')

const page4Duration = 1.5
const opInEase = x => 1-Math.pow(1-x, 2)
const easeIn = x => Math.pow(x, 2)
const easeOut = x => 1 - Math.pow(1-x, 2)
const page4Transition=()=>{
    gsap.to(camera.position, {x:0, y:.2, z:8, duration:page4Duration, ease:page2Ease})
    gsap.to(cutout1.position, {x:-2.5, y:hoverHeight, z:hoverDepth, duration: page4Duration})
    gsap.to(cutout1.rotation, {x:rotation.x, y:rotation.y, z:rotation.z, duration: page4Duration})
    gsap.to(cutout2Group.position, {x: 0, y:hoverHeight, z:hoverDepth, duration: page4Duration})
    gsap.to(cutout3.position, {x: 2.5, y:hoverHeight, z:hoverDepth, duration: page4Duration})
    gsap.to(cutout3.rotation, {x:rotation.x, y:rotation.y, z:rotation.z, duration: page4Duration})
    gsap.to(floorMaterial, {opacity:0, duration:page4Duration, ease:opInEase})
    gsap.to(windowMaterial, {opacity:0, duration:page4Duration, ease:opInEase})
    gsap.to(sideMaterial, {opacity:0, duration:page4Duration/2, ease:opInEase})

    gsap.to(matrixMat, {opacity:1, duration:page4Duration/4, ease:opInEase})
    gsap.to(infillMat, {opacity:1, duration:page4Duration/4, ease:opInEase})

    gsap.to(cutout2Group.rotation, {x:0, y:0, z:0, duration: page4Duration/2})
    gsap.to(cutout2.position, {x: .75, z:.75, duration:page4Duration/2})
    gsap.to(matrixCutout.position, {x: -.75, z:-.75, duration:page4Duration/2, onComplete: page4Transition2})
}
const page4Transition2=()=>{
    gsap.to(cutout2.position, {x:2.5, z:0, duration:page4Duration/2})
    gsap.to(matrixCutout.position, {x:-2.5, z:-.75, duration:page4Duration/2})

    gsap.to(cutout2.rotation, {x:rotation.x, y:rotation.y, z:rotation.z, duration: page4Duration/2})
    gsap.to(infillCutout.rotation, {x:rotation.x, y:rotation.y, z:rotation.z, duration: page4Duration/2})
    gsap.to(matrixCutout.rotation, {x:rotation.x, y:rotation.y, z:rotation.z, duration: page4Duration/2})
}
gui.add({page4: page4Transition}, 'page4')


// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.addEventListener('change', ()=>{
    // page2Camera.set(camera.position.x, camera.position.y, camera.position.z)
    page2CameraGui.updateDisplay()
})

const clock = new THREE.Clock()

const tick = () =>
{    
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)
    // postprocessing.composer.render( 0.1 );

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
page1Transition()