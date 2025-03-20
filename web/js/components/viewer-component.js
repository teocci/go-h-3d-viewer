/**
 * Created by RTT.
 * Author: teocci@yandex.com on 2025-2월-10
 */
// import * as THREE from 'https://unpkg.com/three@0.173.0/build/three.module.js'
// import {OrbitControls} from 'https://unpkg.com/three@0.173.0/examples/jsm/controls/OrbitControls.js'

import * as THREE from 'three'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import GISSceneBuilder from './gis-scene-builder.js'

/**
 * Represents a face in a 3D geometry.
 *
 * @typedef {Object} Face3
 * @property {number} a - Index of the first vertex.
 * @property {number} b - Index of the second vertex.
 * @property {number} c - Index of the third vertex.
 * @property {THREE.Vector3} normal - The normal vector of the face.
 * @property {number} materialIndex - Index of the material used for this face.
 */

/**
 * Represents the result of an intersection test performed by Raycaster.intersectObject.
 *
 * @typedef {Object} ThreeIntersection
 * @property {number} distance - The distance between the origin of the ray and the intersection point.
 * @property {THREE.Vector3} point - The point of intersection in world coordinates.
 * @property {Face3 | null} face - The intersected face (only available for geometry-based objects).
 * @property {number} faceIndex - The index of the intersected face.
 * @property {THREE.Object3D} object - The intersected object.
 * @property {THREE.Vector2 | undefined} uv - The U,V coordinates at the point of intersection (if applicable).
 * @property {THREE.Vector2 | undefined} uv1 - The second set of U,V coordinates at the point of intersection (if applicable).
 * @property {THREE.Vector3} normal - The interpolated normal vector at the intersection point.
 * @property {number | undefined} instanceId - The index number of the instance where the ray intersects an InstancedMesh (if applicable).
 */

const BASE_ORIGIN = new THREE.Vector3()
const BASE_DIRECTION = new THREE.Vector3(0, 0, -1)

const CAMERA_FOV = 75
const CAMERA_ASPECT = window.innerWidth / window.innerHeight
const CAMERA_NEAR = 0.001
const CAMERA_FAR = 10000

const BACKGROUND_COLOR = 0xd6d6d6
const WHITE_LIGHT_COLOR = 0xffffff

const AMBIENT_LIGHT_INTENSITY = 0.6
const DIRECTIONAL_LIGHT_INTENSITY = 0.8
const SECONDARY_LIGHT_INTENSITY = 0.4

const MIN_DISTANCE = 0.001

// Optimization constants
const NODE_GEOMETRY_SEGMENTS = 8 // Reduced from 16
const TUBE_GEOMETRY_SEGMENTS = 6 // Reduced from 20
const TUBE_RADIAL_SEGMENTS = 4 // Reduced from 8
const FRUSTUM_CULLING_MARGIN = 1.2 // Margin for frustum culling
const OCTREE_MAX_DEPTH = 8
const OCTREE_MAX_OBJECTS = 10
const LOD_LEVELS = 3
const LOD_DISTANCES = [50, 150, 300]
const INSTANCING_THRESHOLD = 100 // Minimum count to use instancing

const EVENT_PATH_SELECTION_MODE_CHANGE_KEY = 'pathselectionmodechange'
const EVENT_PATH_SELECTION_DONE_KEY = 'pathselectiondone'

const PATH_SELECTION_EVENT_LIST = [
    EVENT_PATH_SELECTION_MODE_CHANGE_KEY,
    EVENT_PATH_SELECTION_DONE_KEY,
]
const isSupportedEvent = key => PATH_SELECTION_EVENT_LIST.includes(key)
const isNotSupportedEvent = key => !isSupportedEvent(key)

/**
 * Returns the position of an object in the scene.
 *
 * @param {THREE.Object3D} object - The object to get the position of.
 * @return {THREE.Vector3|null} - The position of the object or null if the object is null or has no position.
 */
const pointPosition = object => {
    if (isNil(object) || isNil(object?.position)) return null

    const startPosition = new THREE.Vector3()
    return startPosition.copy(object.position)
}

export default class ViewerComponent {
    static EVENT_PATH_SELECTION_MODE_CHANGE_KEY = EVENT_PATH_SELECTION_MODE_CHANGE_KEY
    static EVENT_PATH_SELECTION_DONE_KEY = EVENT_PATH_SELECTION_DONE_KEY

    constructor($element) {
        this.scene = null
        this.camera = null
        this.renderer = null
        this.controls = null
        this.gisBuilder = null

        this.model = {
            center: new THREE.Vector3(),
            size: new THREE.Vector3(),
            boundingSphere: null,
        }

        // Selection and tooltip properties
        this.raycaster = new THREE.Raycaster(BASE_ORIGIN, BASE_DIRECTION)
        this.mouse = new THREE.Vector2()
        this.selectedObject = null
        this.$tooltip = null
        this.hoveredObject = null

        this.$element = $element ?? document.body

        // Performance monitoring
        this.stats = null
        this.frameTime = 0
        this.lastTime = 0
        this.frames = 0
        this.avgFrameTime = 0

        this.lodManager = null
        this.octree = null

        this.frustum = new THREE.Frustum()
        this.frustrumMatrix = new THREE.Matrix4()

        this.renderQueue = new Map()
        this.renderId = null

        this.animationFrameId = null

        this.throttles = {
            update: {
                lastCall: 0,
                interval: 100,  // ms
            },
            hover: {
                lastCall: 0,
                interval: 200,  // ms
            },
        }

        this.initPathSelection()
    }

    get holderSize() {
        const width = this.$element.clientWidth || window.innerWidth
        const height = this.$element.clientHeight || window.innerHeight

        return {width, height}
    }

    get rendererCanvas() {
        return this?.renderer?.domElement ?? null
    }

    get imageSize() {
        const size = new THREE.Vector2()
        this.renderer.getSize(size)
        return {
            width: Number.isInteger(size.x),
            height: Number.isInteger(size.y),
        }
    }

    /**
     * Returns the position of the starting point of the path.
     * @return {THREE.Vector3|null} - The position of the starting point or null if
     * the starting point is null or has no position.
     */
    get pathStartPosition() {
        if (isNil(this.pathStart) || isNil(this.pathStart?.position)) return null

        return pointPosition(this.pathStart)
    }

    /**
     * Returns the position of the ending point of the path.
     * @return {THREE.Vector3|null} - The position of the ending point or null if
     * the ending point is null or has no position.
     */
    get pathEndPosition() {
        if (isNil(this.pathEnd) || isNil(this.pathEnd?.position)) return null

        return pointPosition(this.pathEnd)
    }

    /**
     * Returns the intersections of the raycaster with objects in the scene.
     * @return {ThreeIntersection[]} - The objects intersected by the raycaster.
     */
    get raycasterIntersections() {
        this.raycaster.setFromCamera(this.mouse, this.camera)
        return this.raycaster.intersectObjects(this.scene.children, true)
    }

    /**
     * Get all objects visible within camera frustum
     * @returns {THREE.Object3D[]}
     */
    get visibleObjects() {
        this.frustrumMatrix.multiplyMatrices(
            this.camera.projectionMatrix,
            this.camera.matrixWorldInverse,
        )
        this.frustum.setFromProjectionMatrix(this.frustrumMatrix)

        let visibleObjects = []
        if (this.octree) {
            visibleObjects = this.octree.getObjectsInFrustum(this.frustum)
            return visibleObjects
        }

        this.scene.traverse(object => {
            if (object.isMesh && (!object.frustumCulled || this.isInFrustum(object))) {
                visibleObjects.push(object)
            }
        })

        return visibleObjects
    }

    /**
     * Initializes the Three.js scene, camera, renderer, controls, and lighting.
     */
    init() {
        // Create the scene and set a background color.
        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color(BACKGROUND_COLOR)

        this.camera = new THREE.PerspectiveCamera(
            CAMERA_FOV,
            CAMERA_ASPECT,
            CAMERA_NEAR,
            CAMERA_FAR,
        )
        this.camera.position.set(20, 20, 20)

        const {width, height} = this.holderSize

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
            precision: 'mediump',
            logarithmicDepthBuffer: true,
        })
        this.renderer.setPixelRatio(window.devicePixelRatio, 2)
        this.renderer.setSize(width, height)
        this.renderer.shadowMap.enabled = false

        const $canvas = this.rendererCanvas
        this.$element.append($canvas)

        // Add OrbitControls for scene navigation.
        this.controls = new OrbitControls(this.camera, $canvas)
        this.configureControls()

        this.initLighting()

        this.gisBuilder = new GISSceneBuilder(this.scene)

        this.initPerformanceMonitoring()

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

        this.controls.rotateSpeed = 0.8

        // Prevent complete vertical rotation
        this.controls.minPolarAngle = 0
        this.controls.maxPolarAngle = Math.PI / 1.5

        // Enable smooth camera movements
        this.controls.enableSmoothing = true
        this.controls.smoothTime = 0.5

        // Set initial target
        this.controls.target.set(0, 0, 0)

        this.controls.maxUpdateRate = 30
    }

    /**
     * Adds ambient and directional lights to brighten the scene.
     */
    initLighting() {
        const ambientLight = new THREE.AmbientLight(WHITE_LIGHT_COLOR, AMBIENT_LIGHT_INTENSITY)
        this.scene.add(ambientLight)

        const directionalLight = new THREE.DirectionalLight(WHITE_LIGHT_COLOR, DIRECTIONAL_LIGHT_INTENSITY)
        directionalLight.position.set(20, 20, 20)
        directionalLight.castShadow = false
        this.scene.add(directionalLight)

        // Add a second directional light from a different angle
        const secondaryLight = new THREE.DirectionalLight(WHITE_LIGHT_COLOR, SECONDARY_LIGHT_INTENSITY)
        secondaryLight.position.set(-20, -20, -20)
        this.scene.add(secondaryLight)
    }

    /**
     * Initialize performance monitoring tools
     */
    initPerformanceMonitoring() {
        this.lastTime = performance.now()
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
        const $canvas = this.rendererCanvas
        // $canvas.onmousemove = event => {
        //     this.onMouseMove(event)
        // }
        $canvas.onmousemove = this.throttle(event => {
            this.onMouseMove(event)
        }, 'hover')

        $canvas.onclick = event => {
            this.onMouseClick(event)
        }

        // Listen for window resize events.
        // window.onresize = () => this.onWindowResize()
        window.onresize = this.throttle(() => this.onWindowResize())
        window.onkeydown = e => {
            if (e.key === 'Escape' && this.isPathSelectionActive) {
                this.deactivatePathSelection()
            }
        }
    }

    /**
     * Handles window resize events.
     */
    onWindowResize() {
        const {width, height} = this.holderSize

        const pixelCount = width * height
        const pixelRatio = pixelCount > 2000000 ? 1 : Math.min(window.devicePixelRatio, 2)

        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()

        this.renderer.setSize(width, height)
        this.renderer.setPixelRatio(pixelRatio)
    }

    /**
     * Updates the mouse position based on the event.
     * @param {MouseEvent} event - The mouse event.
     */
    onMouseMove(event) {
        this.updateMousePosition(event)
        this.updateTooltipPosition(event)

        const intersects = this.raycasterIntersections
        this.handleHover(intersects)
    }

    onMouseClick(event) {
        this.updateMousePosition(event)
        const intersects = this.raycasterIntersections

        if (this.isPathSelectionActive) {
            this.handlePathSelection(intersects)
            return
        }

        this.handleSelection(intersects)
    }

    /**
     * Handles hover effects for objects in the scene.
     * @param {ThreeIntersection[]} intersects - The objects intersected by the raycaster.
     */
    handleHover(intersects) {
        if (intersects.length === 0) {
            this.clearHover()
            return
        }

        const object = this.findParentWithOUID(intersects[0].object)
        if (!object) {
            this.clearHover()
            return
        }

        if (isNil(object)) return

        if (this.hoveredObject && this.hoveredObject.uuid === object.uuid) return

        if (this.hoveredObject && this.engageHover(this.hoveredObject)) {
            this.resetMaterial(this.hoveredObject)
        }
        this.hoveredObject = object
        if (this.engageHover(object)) {
            this.highlightObject(object, 0.4)
        }
        this.showTooltip(object.userData.label)
    }

    /**
     * Handles object selection in the scene.
     * @param {ThreeIntersection[]} intersects - The objects intersected by the raycaster.
     */
    handleSelection(intersects) {
        this.clearSelection()

        if (intersects.length === 0) return

        const object = this.findParentWithOUID(intersects[0].object)
        if (!object || !object.userData.ouid) return

        if (this.isSelected(object)) return

        this.selectedObject = object
        this.highlightObject(object, 0.8)
    }

    initPathSelection() {
        this.isPathSelectionActive = false
        this.pathStart = null
        this.pathEnd = null
        this.pathSelection = []
    }

    handlePathSelection(intersects) {
        if (intersects.length === 0) return

        const object = this.findParentWithOUID(intersects[0].object)
        if (!object || object.userData.type !== 'point' || !object.userData.ouid) return

        if (this.isPathStart(object)) {
            this.deactivatePathSelection()
            return
        }

        if (isNil(this.pathStart)) {
            this.pathStart = object
            this.highlightObject(object, 0.4)
            return
        }

        if (isNil(this.pathEnd)) {
            const startPosition = this.pathStartPosition
            const endPosition = pointPosition(object)
            const distance = startPosition.distanceTo(endPosition)

            if (distance < MIN_DISTANCE) {
                console.warn('Ending point is too close to the starting point. ' +
                    'Please select a distinct endpoint.')
                return
            }

            this.pathEnd = object
            this.highlightObject(object, 0.4)

            this.onPathSelectionDone()

            this.deactivatePathSelection()
        }
    }

    activatePathSelection() {
        this.isPathSelectionActive = true
        this.pathStart = null
        this.pathEnd = null
        this.pathSelection = []
        this.dispatchPathSelectionModeChange()
    }

    deactivatePathSelection() {
        this.clearPathSelection()
        this.dispatchPathSelectionModeChange()
    }

    /**
     * Clears the selection of an object.
     */
    clearSelection() {
        const object = this.selectedObject
        if (isNil(object)) return

        this.resetMaterial(object)
        this.selectedObject = null
    }

    /**
     * Clears the hover effect and hides the tooltip.
     */
    clearHover() {
        this.hideTooltip()
        if (this.hoveredObject && this.engageHover(this.hoveredObject)) {
            this.resetMaterial(this.hoveredObject)
        }
        this.hoveredObject = null
    }

    clearPathSelection() {
        if (this.pathStart) this.resetMaterial(this.pathStart)
        if (this.pathEnd) this.resetMaterial(this.pathEnd)
        this.initPathSelection()
    }

    dispatchPathSelectionModeChange() {
        const enabled = this.isPathSelectionActive
        this.dispatchPathSelectionEvent(EVENT_PATH_SELECTION_MODE_CHANGE_KEY, {enabled})
    }

    /**
     * Dispatches the path selection done event with the start and end points.
     *
     * @param {THREE.Vector3} start - The starting point of the path.
     * @param {THREE.Vector3} end - The ending point of the path.
     */
    dispatchPathSelectionDone(start, end) {
        this.dispatchPathSelectionEvent(EVENT_PATH_SELECTION_DONE_KEY, {start, end})
    }

    dispatchPathSelectionEvent(key, detail) {
        if (isNotSupportedEvent(key)) return

        const event = new CustomEvent(key, {detail})
        document.dispatchEvent(event)
    }

    clearSelectionAndHighlights() {
        this.clearSelection()
        this.clearPathSelection()
    }

    updateCameraRatio(w, h) {
        this.camera.aspect = w / h
        this.camera.updateProjectionMatrix()
    }

    /**
     * Resizes the renderer to specific dimensions
     * @param {number} w - Width in pixels
     * @param {number} h - Height in pixels
     */
    resizeRenderer(w, h) {
        if (w && h) {
            this.renderer.setSize(w, h)
        } else {
            // If no dimensions provided, use container size
            const containerWidth = this.$element.clientWidth || window.innerWidth
            const containerHeight = this.$element.clientHeight || window.innerHeight
            this.renderer.setSize(containerWidth, containerHeight)
        }
        this.render()
    }

    render() {
        if (isNil(this.renderer)) throw new Error('Renderer not initialized.')
        if (isNil(this.scene)) throw new Error('Scene not initialized.')
        if (isNil(this.camera)) throw new Error('Camera not initialized.')

        this.renderer.render(this.scene, this.camera)
    }

    /**
     * Updates the mouse position based on the event.
     * @param {MouseEvent} event - The mouse event.
     */
    updateMousePosition(event) {
        const rect = this.renderer.domElement.getBoundingClientRect()
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }

    /**
     * Updates the position of the tooltip based on the event.
     * @param {MouseEvent} event - The mouse event.
     */
    updateTooltipPosition(event) {
        this.$tooltip.style.left = `${event.clientX + 15}px`
        this.$tooltip.style.top = `${event.clientY + 15}px`
    }

    /**
     * Finds the parent object with an ID in the hierarchy.
     * @param {THREE.Object3D|*} object - The object to search from.
     * @return {THREE.Object3D|null} - The parent object with an ID or null if not found.
     */
    findParentWithOUID(object) {
        let current = object
        while (current) {
            if (current.userData && current.userData.ouid) return current

            current = current.parent
        }

        return null
    }

    /**
     * Check if object is within camera frustum (plus margin)
     * @param {THREE.Object3D | THREE.Mesh} object - The object to check.
     * @returns {boolean} - True if the object is in the frustum, false otherwise.
     */
    isInFrustum(object) {
        if (!object?.isMesh && !object?.isLine && !object?.isPoints) return false
        if (!object.geometry) return false

        if (!object.geometry.boundingSphere) {
            object.geometry.computeBoundingSphere()
        }

        const boundingSphere = object.geometry.boundingSphere.clone()
        boundingSphere.radius *= FRUSTUM_CULLING_MARGIN
        boundingSphere.applyMatrix4(object.matrixWorld)

        return this.frustum.intersectsSphere(boundingSphere)
    }

    /**
     * Checks if an object is selected.
     * @param {THREE.Object3D} object - The object to check.
     * @return {boolean} - True if the object is selected, false otherwise.
     */
    isSelected(object) {
        return object && this.selectedObject && this.selectedObject.uuid === object.uuid
    }

    isPathStart(object) {
        return object && this.pathStart && this.pathStart.uuid === object.uuid
    }

    isPathEnd(object) {
        return object && this.pathEnd && this.pathEnd.uuid === object.uuid
    }

    isPathSelection(object) {
        if (isNil(object)) return false

        return this.isPathStart(object) || this.isPathEnd(object)
    }

    avoidHover(object) {
        return isNil(object) || this.isSelected(object) || this.isPathSelection(object)
    }

    isNotSelected(object) {
        return !this.isSelected(object)
    }

    isNotPathStart(object) {
        return !this.isPathStart(object)
    }

    isNotPathEnd(object) {
        return !this.isPathEnd(object)
    }

    isNotPathSelection(object) {
        return !this.isPathSelection(object)
    }

    engageHover(object) {
        return !isNil(object) && this.isNotSelected(object) && this.isNotPathSelection(object)
    }

    /**
     * Highlights a collection of objects in the scene.
     * @param {string} uuid - The UUID of the collection to highlight.
     */
    highlightCollection(uuid) {
        this.gisBuilder.highlightCollection(uuid)
    }

    /**
     * Unhighlights a collection of objects in the scene.
     * @param uuid - The UUID of the collection to unhighlight.
     */
    unhighlightCollection(uuid) {
        this.gisBuilder.unhighlightCollection(uuid)
    }

    /**
     * Highlights a single object in the scene.
     * @param {THREE.Object3D | THREE.Mesh} object - The object to highlight.
     * @param {THREE.MeshStandardMaterial} object.material - The material of the object.
     * @param {number} intensity - The intensity of the highlight.
     */
    highlightObject(object, intensity) {
        if (object.material) {
            const {materialMode, type} = object.userData
            const material = this.highlightedMaterial(type) || object.material.clone()
            material.emissiveIntensity = intensity ?? 0.5

            object.userData.originalMaterial = this.material(materialMode, type) || object.material
            object.material = material
        }
    }

    /**
     * Resets the material of an object to its original state.
     * @param {THREE.Object3D} object - The object to reset the material of.
     * @param {THREE.MeshStandardMaterial} object.userData.originalMaterial - The original material of the object.
     * @param {THREE.MeshStandardMaterial} object.material - The current material of the object.
     */
    resetMaterial(object) {
        if (object.material && object.userData.originalMaterial) {
            object.material = object.userData.originalMaterial
            delete object.userData.originalMaterial
        }
    }

    /**
     * Returns the material for the specified mode and type.
     * @param {string} mode - The mode of the material (default, highlighted, critical)
     * @param {string} type - The type of the material (point, line, polyline, polygon)
     * @return {THREE.MeshStandardMaterial} - The material for the specified mode and type.
     */
    material(mode, type) {
        return this.gisBuilder.materials[mode][type]
    }

    /**
     * Returns the highlighted material for the specified type.
     * @param {string} type - The type of the material (point, line, polyline, polygon)
     * @return {THREE.MeshStandardMaterial} - The highlighted material for the specified type.
     */
    highlightedMaterial(type) {
        return this.gisBuilder.materials.highlighted[type]
    }

    /**
     * Returns the critical material for the specified type.
     * @param {string} type - The type of the material (point, line, polyline, polygon)
     * @return {THREE.MeshStandardMaterial} - The highlighted material for the specified type.
     */
    criticalMaterial(type) {
        return this.gisBuilder.materials.critical[type]
    }

    /**
     * Returns the default material for the specified type.
     * @param {string} type - The type of the material (point, line, polyline, polygon)
     * @return {THREE.MeshStandardMaterial} - The highlighted material for the specified type.
     */
    defaultMaterial(type) {
        return this.gisBuilder.materials.default[type]
    }

    /**
     * Starts the animation loop.
     */
    animate() {
        requestAnimationFrame(this.animate.bind(this))
        this.controls.update()
        this.renderer.render(this.scene, this.camera)
    }

    cleanup() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId)
            this.animationFrameId = null
        }

        // Remove tooltip when viewer is destroyed
        if (this.$tooltip && this.$tooltip.parentNode) {
            this.$tooltip.parentNode.removeChild(this.$tooltip)
        }

        this.renderer?.dispose()
        this.scene?.traverse(object => {
            if (object.geometry) object.geometry.dispose()
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose())
                } else {
                    object.material.dispose()
                }
            }
        })

        // Clear collections
        this.gisBuilder?.collections.clear()
        this.gisBuilder?.networks.clear()
    }

    /**
     * Throttles function calls for performance
     * @param {Function} fn - Function to throttle
     * @param {string} type - Throttle type ('update', 'hover', etc)
     */
    throttle(fn, type = 'update') {
        return (...args) => {
            const now = performance.now()
            const throttleInfo = this.throttles[type]

            if (!throttleInfo) return fn(...args)

            if (now - throttleInfo.lastCall >= throttleInfo.interval) {
                throttleInfo.lastCall = now
                return fn(...args)
            }
        }
    }

    /**
     * Loads the network data into the scene
     * @param {NetworkData} data - The network data containing nodes and links.
     */
    loadNetwork(data) {
        this.gisBuilder.buildNetwork(data)
        this.updateModelCenterSize()
        this.centerCameraOnModel()
    }

    /**
     * Builds the 3D GIS scene based on the provided data.
     * @param {GISCollectionData[]} data - The GIS data containing points, lines, polylines, and polygons.
     */
    loadCollections(data) {
        this.gisBuilder.buildScene(data)
        this.updateModelCenterSize()
        this.centerCameraOnModel()
    }

    /**
     * Calculates the center of mass of the loaded model
     * @returns {THREE.Vector3} The center point of the model
     */
    updateModelCenterSize() {
        const boundingBox = new THREE.Box3()
        this.scene.children.forEach(child => {
            if ((child instanceof THREE.AxesHelper)) return

            boundingBox.expandByObject(child)
        })

        boundingBox.getCenter(this.model.center)
        boundingBox.getSize(this.model.size)
    }

    /**
     * Centers the camera on the model and adjusts the distance based on model size
     */
    centerCameraOnModel() {
        const {center, size} = this.model

        const radius = Math.max(size.x, size.y, size.z) * 0.5
        const distance = radius / Math.sin(0.95 * this.camera.fov * Math.PI / 180)
        this.camera.position.set(
            center.x + distance,
            center.y + distance,
            center.z + distance,
        )

        this.camera.lookAt(center)
        this.controls.target.copy(center)
        this.controls.update()
    }

    fitModel() {
        this.centerCameraOnModel()
    }

    upY() {
        const {scene, camera} = this
        scene.up.set(0, 1, 0)
        camera.up.set(0, 1, 0)
        camera.lookAt(scene.position)
        console.log('Up vector set to Y-axis:', camera.up)
    }

    upZ() {
        const {scene, camera} = this
        scene.up.set(0, 0, 1)
        camera.up.set(0, 0, 1)
        camera.lookAt(scene.position)
        console.log('Up vector set to Z-axis:', camera.up)

    }

    /**
     * Gets the current image rendered in the canvas as a data URL
     * @param {number} w - The desired width of the output image
     * @param {number} h - The desired height of the output image
     * @param {boolean} isAlpha - Whether to render with a transparent background
     * @returns {string} The image as a data URL
     */
    renderImageAsDataUrl(w = 1980, h = 1020, isAlpha = false) {
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            preserveDrawingBuffer: true,
            alpha: isAlpha,
        })
        renderer.setSize(w, h)

        const bg = this.scene.background
        if (isAlpha) {
            this.scene.background = null
        }

        renderer.render(this.scene, this.camera)
        const dataUrl = renderer.domElement.toDataURL('image/png')

        this.scene.background = bg
        renderer.dispose()

        return dataUrl
    }

    /**
     * Shows a tooltip with the provided text at the current mouse position.
     * @param {string} text - The text to display in the tooltip.
     */
    showTooltip(text) {
        this.$tooltip.textContent = `ID: ${text}`
        this.$tooltip.style.display = 'block'
    }

    hideTooltip() {
        this.$tooltip.style.display = 'none'
    }

    /**
     * Handles the path selection process.
     */
    onPathSelectionDone() {
        const start = this.pathStartPosition
        const end = this.pathEndPosition

        this.dispatchPathSelectionDone(start, end)
    }
}