/**
 * Created by RTT.
 * Author: teocci@yandex.com on 2025-2월-12
 */

import * as THREE from 'three'

export default class GISSceneBuilder {
    constructor(scene) {
        this.scene = scene
        this.collections = new Map()
        this.materials = {
            default: {
                point: new THREE.MeshStandardMaterial({color: 0xff0000}),
                line: new THREE.MeshStandardMaterial({color: 0x0000ff}),
                polyline: {
                    node: new THREE.MeshStandardMaterial({color: 0x00ff00}),
                    link: new THREE.MeshStandardMaterial({color: 0xffff00}),
                },
                polygon: new THREE.MeshStandardMaterial({color: 0x888888}),
            },
            highlighted: {
                point: new THREE.MeshStandardMaterial({
                    color: 0xff9900,
                    emissive: 0xff9900,
                    emissiveIntensity: 0.5,
                }),
                line: new THREE.MeshStandardMaterial({
                    color: 0x0099ff,
                    emissive: 0x0099ff,
                    emissiveIntensity: 0.5,
                }),
                polyline: {
                    node: new THREE.MeshStandardMaterial({
                        color: 0x00ffff,
                        emissive: 0x00ffff,
                        emissiveIntensity: 0.5,
                    }),
                    link: new THREE.MeshStandardMaterial({
                        color: 0xff00ff,
                        emissive: 0xff00ff,
                        emissiveIntensity: 0.5,
                    }),
                },
                polygon: new THREE.MeshStandardMaterial({
                    color: 0xcccccc,
                    emissive: 0xcccccc,
                    emissiveIntensity: 0.5,
                }),
            },
            critical: {
                point: new THREE.MeshStandardMaterial({
                    color: 0xea86ff,
                    emissive: 0xea86ff,
                    emissiveIntensity: 0.5,
                }),
                line: new THREE.MeshStandardMaterial({
                    color: 0xea86ff,
                    emissive: 0xea86ff,
                    emissiveIntensity: 0.5,
                }),
                polyline: {
                    node: new THREE.MeshStandardMaterial({
                        color: 0xea86ff,
                        emissive: 0xea86ff,
                        emissiveIntensity: 0.5,
                    }),
                    link: new THREE.MeshStandardMaterial({
                        color: 0xea86ff,
                        emissive: 0xea86ff,
                        emissiveIntensity: 0.5,
                    }),
                },
                polygon: new THREE.MeshStandardMaterial({
                    color: 0xcccc33,
                    emissive: 0xcccc33,
                    emissiveIntensity: 0.5,
                }),
            },
        }

        // Reusable geometries
        this.geometries = {
            point: new THREE.SphereGeometry(0.5, 16, 16),
            polylineNode: new THREE.SphereGeometry(0.4, 16, 16),
        }
    }

    /**
     * Builds the 3D GIS scene for multiple collections
     * @param {GISCollectionData[]} collections - Array of GIS collections
     */
    buildScene(collections) {
        collections.forEach(collection => this.addCollection(collection))
    }

    /**
     * Adds a single collection to the scene
     * @param {GISCollectionData} collection - The GIS collection to add
     */
    addCollection(collection) {
        const collectionGroup = new THREE.Group()
        const pointMap = new Map()

        // Store references for the collection
        const collectionData = {
            group: collectionGroup,
            pointMap: pointMap,
            meshGroups: {
                points: new THREE.Group(),
                lines: new THREE.Group(),
                polylines: new THREE.Group(),
                polygons: new THREE.Group(),
            },
        }

        // Add points
        this.addPoints(collection.gis.points, collectionData)

        // Add lines
        this.addLines(collection.gis.lines, collectionData)

        // Add polylines
        this.addPolylines(collection.gis.polylines, collectionData)

        // Add polygons
        this.addPolygons(collection.gis.polygons, collectionData)

        // Add all mesh groups to the collection group
        Object.values(collectionData.meshGroups).forEach(group => {
            collectionGroup.add(group)
        })

        // Add the collection group to the scene
        this.scene.add(collectionGroup)

        // Store the collection reference
        this.collections.set(collection.uuid, collectionData)
    }

    /**
     * Adds points to the collection
     * @private
     */
    addPoints(points, collectionData) {
        points.forEach(point => {
            const [x, y, z] = point.coordinates
            const sphere = new THREE.Mesh(
                this.geometries.point,
                this.materials.default.point,
            )
            sphere.position.set(x, y, z)
            sphere.userData.id = point.id
            sphere.userData.type = 'point'
            sphere.userData.materialMode = 'default'
            collectionData.meshGroups.points.add(sphere)
            collectionData.pointMap.set(point.id, new THREE.Vector3(x, y, z))
        })
    }

    /**
     * Adds lines to the collection
     * @private
     */
    addLines(lines, collectionData) {
        lines.forEach(line => {
            // const material = ['lF10', 'lF11'].includes(line.id) ?
            //     this.materials.critical.line :
            //     this.materials.default.line

            const material = this.materials.default.line

            const start = collectionData.pointMap.get(line.start)
            const end = collectionData.pointMap.get(line.end)
            if (start && end) {
                const path = new THREE.LineCurve3(start, end)
                const tubeGeometry = new THREE.TubeGeometry(path, 20, 0.2, 8, false)
                const tube = new THREE.Mesh(tubeGeometry, material)
                tube.userData.id = line.id
                tube.userData.type = 'line'
                tube.userData.materialMode = 'default'
                collectionData.meshGroups.lines.add(tube)
            }
        })
    }

    /**
     * Adds polylines to the collection
     * @private
     */
    addPolylines(polylines, collectionData) {
        polylines.forEach(polyline => {
            const nodes = polyline.nodes.map(id => collectionData.pointMap.get(id))

            // Add nodes
            nodes.forEach(pos => {
                if (pos) {
                    const sphere = new THREE.Mesh(
                        this.geometries.polylineNode,
                        this.materials.default.polyline.node,
                    )
                    sphere.position.copy(pos)
                    sphere.userData.materialMode = 'default'
                    collectionData.meshGroups.polylines.add(sphere)
                }
            })

            // Add links between nodes
            for (let i = 0; i < nodes.length - 1; i++) {
                const start = nodes[i]
                const end = nodes[i + 1]
                if (start && end) {
                    const path = new THREE.LineCurve3(start, end)
                    const tubeGeometry = new THREE.TubeGeometry(path, 20, 0.15, 8, false)
                    const tube = new THREE.Mesh(tubeGeometry, this.materials.default.polyline.link)
                    tube.userData.materialMode = 'default'
                    collectionData.meshGroups.polylines.add(tube)
                }
            }
        })
    }

    /**
     * Adds polygons to the collection
     * @private
     */
    addPolygons(polygons, collectionData) {
        polygons.forEach(polygon => {
            const vertices = polygon.vertices
            if (vertices.length < 3) return

            const shape = new THREE.Shape()
            const [x0, y0, z0] = vertices[0]
            shape.moveTo(x0, y0)

            for (let i = 1; i < vertices.length; i++) {
                const [x, y] = vertices[i]
                shape.lineTo(x, y)
            }
            shape.lineTo(x0, y0)

            const extrudeSettings = {
                steps: 1,
                depth: 2,
                bevelEnabled: false,
            }

            const extrudeGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
            const polygonMesh = new THREE.Mesh(extrudeGeometry, this.materials.default.polygon)
            polygonMesh.position.z = z0 || 0
            polygonMesh.userData.materialMode = 'default'
            collectionData.meshGroups.polygons.add(polygonMesh)
        })
    }

    highlightCollection(collectionId) {
        this.toggleHighlight(collectionId, true)
    }

    unhighlightCollection(collectionId) {
        this.toggleHighlight(collectionId, false)
    }

    /**
     * Toggles highlighting for a specific collection
     * @param {string} uuid - The UUID of the collection to highlight
     * @param {boolean} highlight - Whether to highlight or unhighlight
     */
    toggleHighlight(uuid, highlight) {
        const collection = this.collections.get(uuid)
        if (!collection) return

        const materials = highlight ? this.materials.highlighted : this.materials.default
        const mode = highlight ? 'highlighted' : 'default'

        // Update materials for all mesh groups
        collection.meshGroups.points.children.forEach(mesh => {
            mesh.material = materials.point
            mesh.userData.materialMode = mode
        })

        collection.meshGroups.lines.children.forEach(mesh => {
            mesh.material = materials.line
            mesh.userData.materialMode = mode
        })

        collection.meshGroups.polylines.children.forEach(mesh => {
            // Check if the mesh is a node (sphere) or link (tube)
            if (mesh.geometry.type === 'SphereGeometry') {
                mesh.material = materials.polyline.node
            } else {
                mesh.material = materials.polyline.link
            }
            mesh.userData.materialMode = mode
        })

        collection.meshGroups.polygons.children.forEach(mesh => {
            mesh.material = materials.polygon
            mesh.userData.materialMode = mode
        })
    }

    /**
     * Removes a collection from the scene
     * @param {string} collectionId - The UUID of the collection to remove
     */
    removeCollection(collectionId) {
        const collection = this.collections.get(collectionId)
        if (collection) {
            this.scene.remove(collection.group)
            this.collections.delete(collectionId)
        }
    }
}