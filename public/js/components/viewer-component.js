/**
 * Created by RTT.
 * Author: teocci@yandex.com on 2025-2월-10
 */
// import * as THREE from 'https://unpkg.com/three@0.173.0/build/three.module.js'
// import {OrbitControls} from 'https://unpkg.com/three@0.173.0/examples/jsm/controls/OrbitControls.js'

import * as THREE from 'three'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import GISSceneBuilder from './gis-scene-builder.js'

const BACKGROUND_COLOR = 0xd6d6d6
const WHITE_LIGHT_COLOR = 0xffffff

const AMBIENT_LIGHT_INTENSITY = 0.6
const DIRECTIONAL_LIGHT_INTENSITY = 0.8
const SECONDARY_LIGHT_INTENSITY = 0.4

export default class ViewerComponent {
    constructor($element) {
        this.scene = null
        this.camera = null
        this.renderer = null
        this.controls = null
        this.gisBuilder = null

        this.modelCenter = new THREE.Vector3()

        // Selection and tooltip properties
        this.raycaster = new THREE.Raycaster()
        this.mouse = new THREE.Vector2()
        this.selectedObject = null
        this.$tooltip = null
        this.hoveredObject = null

        this.$element = $element ?? document.body
    }

    /**
     * Initializes the Three.js scene, camera, renderer, controls, and lighting.
     */
    init() {
        // Create the scene and set a background color.
        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color(BACKGROUND_COLOR)

        // Create the camera with a 75° field of view.
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000,
        )
        this.camera.position.set(20, 20, 20)

        // Create the renderer with antialiasing enabled.
        this.renderer = new THREE.WebGLRenderer({antialias: true})
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.$element.append(this.renderer.domElement)

        // Add OrbitControls for scene navigation.
        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.configureControls()

        this.addLighting()

        this.gisBuilder = new GISSceneBuilder(this.scene)

        this.initTooltip()
        this.initEventListeners()
    }

    /**
     * Configures the OrbitControls for intuitive navigation.
     */
    configureControls() {
        this.controls.enableDamping = true
        this.controls.dampingFactor = 0.05

        // Zoom with mouse wheel
        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            RIGHT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.DOLLY,
        }
        this.controls.enableRotate = true
        this.controls.rotateSpeed = 0.8

        this.controls.enablePan = true
        this.controls.panSpeed = 1.0

        this.controls.enableZoom = true
        this.controls.zoomSpeed = 1.0

        // Smooth rotation
        this.controls.rotateSpeed = 0.8

        // Prevent complete vertical rotation
        this.controls.minPolarAngle = 0
        this.controls.maxPolarAngle = Math.PI / 1.5

        // Enable smooth camera movements
        this.controls.enableSmoothing = true
        this.controls.smoothTime = 0.5

        // Set initial target
        this.controls.target.set(this.modelCenter)
    }

    /**
     * Adds ambient and directional lights to brighten the scene.
     */
    addLighting() {
        const ambientLight = new THREE.AmbientLight(WHITE_LIGHT_COLOR, AMBIENT_LIGHT_INTENSITY)
        this.scene.add(ambientLight)

        const directionalLight = new THREE.DirectionalLight(WHITE_LIGHT_COLOR, DIRECTIONAL_LIGHT_INTENSITY)
        directionalLight.position.set(20, 20, 20)
        directionalLight.castShadow = true // Enable shadows for better depth perception
        this.scene.add(directionalLight)

        // Add a second directional light from a different angle
        const secondaryLight = new THREE.DirectionalLight(WHITE_LIGHT_COLOR, SECONDARY_LIGHT_INTENSITY)
        secondaryLight.position.set(-20, -20, -20)
        this.scene.add(secondaryLight)
    }

    initTooltip() {
        this.$tooltip = document.createElement('div')
        this.$tooltip.style.display = 'none'
        this.$tooltip.style.position = 'absolute'
        this.$tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'
        this.$tooltip.style.color = 'white'
        this.$tooltip.style.padding = '8px'
        this.$tooltip.style.borderRadius = '4px'
        this.$tooltip.style.fontSize = '14px'
        this.$tooltip.style.pointerEvents = 'none'
        this.$tooltip.style.zIndex = '1000'

        document.body.appendChild(this.$tooltip)
    }

    initEventListeners() {
        const $canvas = this.renderer.domElement
        $canvas.onmousemove = event => {
            this.onMouseMove(event)
        }
        $canvas.onclick = event => {
            console.log('onclick')
            this.onMouseClick(event)
        }

        // Listen for window resize events.
        window.onresize = () => this.onWindowResize()
    }

    /**
     * Handles window resize events.
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(window.innerWidth, window.innerHeight)
    }

    onMouseMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect()
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

        // Update tooltip position
        this.$tooltip.style.left = `${event.clientX + 15}px`
        this.$tooltip.style.top = `${event.clientY + 15}px`

        // Update raycaster and check for intersections
        this.raycaster.setFromCamera(this.mouse, this.camera)
        const intersects = this.raycaster.intersectObjects(this.scene.children, true)

        // Handle hover effects
        if (intersects.length > 0) {
            const object = this.findParentWithId(intersects[0].object)
            if (object && object.userData.id) {
                if (this.hoveredObject !== object) {
                    if (this.hoveredObject && !this.isSelected(this.hoveredObject)) {
                        this.resetMaterial(this.hoveredObject)
                    }
                    this.hoveredObject = object
                    if (!this.isSelected(object)) {
                        this.highlightObject(object, 0.4) // Less intense highlight for hover
                    }
                }
                this.showTooltip(object.userData.id)
            } else {
                this.hideTooltip()
                if (this.hoveredObject && !this.isSelected(this.hoveredObject)) {
                    this.resetMaterial(this.hoveredObject)
                }
                this.hoveredObject = null
            }
        } else {
            this.hideTooltip()
            if (this.hoveredObject && !this.isSelected(this.hoveredObject)) {
                this.resetMaterial(this.hoveredObject)
            }
            this.hoveredObject = null
        }
    }

    onMouseClick(event) {
        const rect = this.renderer.domElement.getBoundingClientRect()
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

        // Update raycaster and check for intersections
        this.raycaster.setFromCamera(this.mouse, this.camera)
        const intersects = this.raycaster.intersectObjects(this.scene.children, true)

        if (intersects.length > 0) {
            const object = this.findParentWithId(intersects[0].object)
            if (object && object.userData.id) {
                if (this.selectedObject === object) {
                    // Deselect if clicking the same object
                    this.resetMaterial(object)
                    this.selectedObject = null
                } else {
                    if (this.selectedObject) {
                        this.resetMaterial(this.selectedObject)
                    }
                    this.selectedObject = object
                    this.highlightObject(object, 0.8) // More intense highlight for selection
                }
            }
        } else if (this.selectedObject) {
            // Deselect when clicking empty space
            this.resetMaterial(this.selectedObject)
            this.selectedObject = null
        }
    }

    /**
     * Finds the parent object with an ID in the hierarchy.
     * @param {OBJElement} object - The object to search from.
     * @param {OBJElement} object.parent - The parent object to check.
     * @param {Object} object.userData - The user data object containing an ID.
     * @return {OBJElement | null} - The parent object with an ID or null if not found.
     */
    findParentWithId(object) {
        let current = object
        while (current) {
            if (current.userData && current.userData.id) return current
            current = current.parent
        }

        return null
    }

    isSelected(object) {
        return this.selectedObject === object
    }

    highlightCollection(uuid) {
        this.gisBuilder.highlightCollection(uuid)
    }

    unhighlightCollection(uuid) {
        this.gisBuilder.unhighlightCollection(uuid)
    }

    highlightObject(object, intensity) {
        if (object.material) {
            console.log({object})

            const {materialMode, type} = object.userData
            const material = this.highlightedMaterial(type) || object.material.clone()
            material.emissiveIntensity = intensity ?? 0.5
            object.userData.originalMaterial = this.material(materialMode, type) || object.material
            object.material = material
        }
    }

    material(mode, type) {
        return this.gisBuilder.materials[mode][type]
    }

    highlightedMaterial(type) {
        return this.gisBuilder.materials.highlighted[type]
    }

    criticalMaterial(type) {
        return this.gisBuilder.materials.critical[type]
    }

    defaultMaterial(type) {
        return this.gisBuilder.materials.default[type]
    }

    resetMaterial(object) {
        if (object.material && object.userData.originalMaterial) {
            object.material = object.userData.originalMaterial
            delete object.userData.originalMaterial
        }
    }

    /**
     * Starts the animation loop.
     */
    animate() {
        requestAnimationFrame(() => this.animate())
        this.controls.update()
        this.renderer.render(this.scene, this.camera)
    }

    cleanup() {
        // Remove tooltip when viewer is destroyed
        if (this.$tooltip && this.$tooltip.parentNode) {
            this.$tooltip.parentNode.removeChild(this.$tooltip)
        }
    }

    /**
     * Builds the 3D GIS scene based on the provided data.
     * @param {GISCollectionData[]} data - The GIS data containing points, lines, polylines, and polygons.
     */
    buildGISScene(data) {
        this.gisBuilder.buildScene(data)
        this.calculateModelCenter()
        this.centerCameraOnModel()
    }

    /**
     * Calculates the center of mass of the loaded model
     * @returns {THREE.Vector3} The center point of the model
     */
    calculateModelCenter() {
        const boundingBox = new THREE.Box3()

        // Calculate bounding box for all objects except helpers
        this.scene.children.forEach(child => {
            if (!(child instanceof THREE.AxesHelper)) {
                boundingBox.expandByObject(child)
            }
        })

        // Get the center of the bounding box
        boundingBox.getCenter(this.modelCenter)
        return this.modelCenter
    }

    /**
     * Centers the camera on the model and adjusts the distance based on model size
     */
    centerCameraOnModel() {
        // Create a bounding box containing all objects in the scene
        const boundingBox = new THREE.Box3()

        // Calculate bounding box excluding axes helper
        this.scene.children.forEach(child => {
            boundingBox.expandByObject(child)
        })

        // Get the center and size of the bounding box
        const center = new THREE.Vector3()
        boundingBox.getCenter(center)

        const size = new THREE.Vector3()
        boundingBox.getSize(size)

        // Calculate the radius of the bounding sphere
        const radius = Math.max(size.x, size.y, size.z) * 0.5

        // Set camera position relative to the center
        // Position camera at an angle that shows depth
        const distance = radius * 1.25
        this.camera.position.set(
            center.x + distance,
            center.y + distance,
            center.z + distance,
        )

        this.camera.lookAt(center)
        this.controls.target.copy(center)
        this.controls.update()
    }

    showTooltip(text) {
        this.$tooltip.textContent = `ID: ${text}`
        this.$tooltip.style.display = 'block'
    }

    hideTooltip() {
        this.$tooltip.style.display = 'none'
    }
}