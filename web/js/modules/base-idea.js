// Import Three.js and OrbitControls from the unpkg CDN using version v0.173.0.
import * as THREE from 'https://unpkg.com/three@0.173.0/build/three.module.js'
import {OrbitControls} from 'https://unpkg.com/three@0.173.0/examples/jsm/controls/OrbitControls.js'

let scene, camera, renderer, controls

// Initialize scene and start animation loop.
init()
animate()
loadGISData()

/**
 * Initializes the Three.js scene, camera, renderer, controls, and lighting.
 */
function init() {
    // Create a new scene and set the background color.
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)

    // Set up the camera with a 75° field of view.
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000,
    )
    camera.position.set(20, 20, 20)

    // Create the renderer with antialiasing enabled.
    renderer = new THREE.WebGLRenderer({antialias: true})
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    // Add orbit controls for interactive scene navigation.
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    // Add ambient and directional lighting.
    const ambientLight = new THREE.AmbientLight(0x404040, 1.2)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(20, 20, 20)
    scene.add(directionalLight)

    // Adjust the camera and renderer when the window is resized.
    window.addEventListener('resize', onWindowResize, false)
}

/**
 * Handles window resize events.
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

/**
 * The main animation loop.
 */
function animate() {
    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
}

/**
 * Loads GIS data for the gas piping network.
 * It first attempts to load an external JSON file. If that fails, sample data is used.
 */
async function loadGISData() {
    let data
    try {
        const response = await fetch('data/gispiping.json')
        data = await response.json()
    } catch (error) {
        console.warn('Could not load external GIS data, using sample data.', error)
        data = getSampleGISData()
    }
    buildGISScene(data)
}

/**
 * Returns sample GIS data representing points, lines, polylines, and polygons.
 */
function getSampleGISData() {
    return {
        'points': [
            {'id': 'n1', 'coordinates': [0, 0, 0]},
            {'id': 'n2', 'coordinates': [10, 0, 0]},
            {'id': 'n3', 'coordinates': [10, 10, 0]},
            {'id': 'n4', 'coordinates': [0, 10, 0]},
            {'id': 'n5', 'coordinates': [5, 5, 10]},
        ],
        'lines': [
            {'id': 'l1', 'start': 'n1', 'end': 'n2'},
            {'id': 'l2', 'start': 'n2', 'end': 'n3'},
        ],
        'polylines': [
            {'id': 'pl1', 'nodes': ['n1', 'n2', 'n3', 'n4']},
        ],
        'polygons': [
            {'id': 'pg1', 'vertices': [[15, 0, 0], [25, 0, 0], [25, 10, 0], [15, 10, 0]]},
        ],
    }
}

/**
 * Builds the 3D scene using the provided GIS data.
 */
function buildGISScene(data) {
    // Map each point id to its THREE.Vector3 position.
    const pointMap = {}
    const sphereMaterial = new THREE.MeshStandardMaterial({color: 0xff0000})
    const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16)
    data.points.forEach(point => {
        const [x, y, z] = point.coordinates
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
        sphere.position.set(x, y, z)
        scene.add(sphere)
        pointMap[point.id] = new THREE.Vector3(x, y, z)
    })

    // Draw lines as tubes connecting two points.
    const tubeMaterial = new THREE.MeshStandardMaterial({color: 0x0000ff})
    data.lines.forEach(line => {
        const start = pointMap[line.start]
        const end = pointMap[line.end]
        if (start && end) {
            const path = new THREE.LineCurve3(start, end)
            const tubeGeometry = new THREE.TubeGeometry(
                path,
                20,    // tubularSegments
                0.2,   // tubeRadius
                8,     // radialSegments
                false,  // closed
            )
            const tube = new THREE.Mesh(tubeGeometry, tubeMaterial)
            scene.add(tube)
        }
    })

    // Draw each polyline as a group of nodes (spheres) and links (tubes).
    data.polylines.forEach(polyline => {
        const group = new THREE.Group()
        const polySphereMaterial = new THREE.MeshStandardMaterial({color: 0x00ff00})
        const polySphereGeometry = new THREE.SphereGeometry(0.4, 16, 16)
        const polyTubeMaterial = new THREE.MeshStandardMaterial({color: 0xffff00})

        const nodes = polyline.nodes.map(id => pointMap[id])
        // Add spheres for each node.
        nodes.forEach(pos => {
            if (pos) {
                const sphere = new THREE.Mesh(polySphereGeometry, polySphereMaterial)
                sphere.position.copy(pos)
                group.add(sphere)
            }
        })
        // Connect consecutive nodes with tubes.
        for (let i = 0; i < nodes.length - 1; i++) {
            const start = nodes[i]
            const end = nodes[i + 1]
            if (start && end) {
                const path = new THREE.LineCurve3(start, end)
                const tubeGeometry = new THREE.TubeGeometry(
                    path,
                    20,
                    0.15,
                    8,
                    false,
                )
                const tube = new THREE.Mesh(tubeGeometry, polyTubeMaterial)
                group.add(tube)
            }
        }
        scene.add(group)
    })

    // Draw polygons as extruded shapes.
    data.polygons.forEach(polygon => {
        const vertices = polygon.vertices
        if (vertices.length < 3) return

        // Create a 2D shape assuming vertices are roughly on the XY plane.
        const shape = new THREE.Shape()
        const [x0, y0, z0] = vertices[0]
        shape.moveTo(x0, y0)
        for (let i = 1; i < vertices.length; i++) {
            const [x, y] = vertices[i]
            shape.lineTo(x, y)
        }
        shape.lineTo(x0, y0) // Close the shape.

        // Extrude the shape to create a 3D object.
        const extrudeSettings = {
            steps: 1,
            depth: 2,
            bevelEnabled: false,
        }
        const extrudeGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
        const polygonMaterial = new THREE.MeshStandardMaterial({color: 0x888888})
        const polygonMesh = new THREE.Mesh(extrudeGeometry, polygonMaterial)
        polygonMesh.position.z = z0 || 0
        scene.add(polygonMesh)
    })
}
