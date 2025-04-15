/**
 * Created by RTT.
 * Author: teocci@yandex.com on 2025-2월-12
 */

/**
 * @typedef {Object} NodeEntyData
 * @property {string} key - The key of the node.
 * @property {number[]} id - The unique identifier of the node.
 * @property {string[]} guid - The globally unique identifier of the node.
 * @property {number} type - The type of the node.
 */

/**
 * Represents the geometric data structure for a network visualization.
 * @typedef {Object} NetworkGeometryData
 * @property {string} uuid - Unique identifier for the network data.
 * @property {THREE.Group} group - The group identifier for the network.
 * @property {Map<>} nodeMap - Mapping of points in the network.
 * @property {Object} meshGroups - Container for 3D mesh groups.
 * @property {THREE.Group} meshGroups.nodes - Three.js Group containing node meshes.
 * @property {THREE.Group} meshGroups.links - Three.js Group containing link meshes.
 * @property {Object} stats - Statistics for the network.
 * @property {Object} stats.nodes - Statistics for the nodes.
 * @property {Object} stats.links - Statistics for the links.
 */

import * as THREE
    from 'three'
import LinkChainCaller
    from '../workers/link-chain-caller.js'
import {
    asVector3,
    scaleGeometry,
    serializeVector,
} from '../three/three-utils.js'
import LinkChainRunner
    from '../workers/link-chain-runner.js'

const CHUNK_SIZE = 10000
const LOD_THRESHOLD = 50
const lodSettings = n => {
    return n < 6 ? {tubularSegments: Math.max(n * 5, 8), radialSegments: 4} :
        n < 16 ? {tubularSegments: Math.max(n * 3, 12), radialSegments: 5} :
            {tubularSegments: Math.max(n * 2, 18), radialSegments: 3}
}

export default class GISSceneBuilder {
    constructor(scene) {
        this.scene = scene
        this.collections = new Map()
        this.networks = new Map()
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
            point: new THREE.SphereGeometry(0.2, 16, 16),
            polylineNode: new THREE.SphereGeometry(0.4, 16, 16),
        }
    }

    /**
     * Builds the 3D GIS network from the provided data
     * @param {NetworkData} data - The network data to build
     */
    buildNetwork(data) {
        const {nodes, links, uuid} = data
        const group = new THREE.Group()

        const nodeMap = new Map()
        const meshGroups = {
            nodes: new THREE.Group(),
            links: new THREE.Group(),
        }

        const stats = {
            nodes: {total: 0, unique: 0, avg: {}, min: {}, max: {}},
            links: {total: 0, unique: 0, avg: {}, min: {}, max: {}},
        }

        /** @type {NetworkGeometryData} */
        const networkData = {
            uuid,
            group,
            nodeMap,
            meshGroups,
            stats,
        }

        // this.addNodeAsSphere(nodes, networkData)
        this.addLinksAsChains(links, networkData)

        console.log({stats: networkData.stats})

        console.log({
            networkNodes: meshGroups.nodes.children.length,
            networkLinks: meshGroups.links.children.length,
        })

        Object.values(meshGroups).forEach(g => {
            group.add(g)
        })

        this.scene.add(group)
        this.networks.set(uuid, networkData)
    }

    /**
     * Adds nodes to the network.
     * Many nodes may share the same coordinates (but have different IDs and guids),
     * so we deduplicate nodes by their position.
     * @param {NodeGeometryData[]} nodes - The list of nodes to add to the network
     * @param {NetworkGeometryData} network - The network data to add the nodes to
     */
    addNodes(nodes, network) {
        const geometry = this.geometries.point
        const material = this.materials.default.point

        const stats = network.stats.nodes

        for (const node of nodes) {
            const {x, y, z} = scaleGeometry(node.geometry)

            const key = `${x},${y},${z}`
            let sphere = network.nodeMap.get(key)

            if (isNil(sphere)) {
                sphere = new THREE.Mesh(geometry, material)
                sphere.position.set(x, y, z)
                sphere.userData.ouid = randomUUID()
                sphere.userData.ids = []
                sphere.userData.guids = []
                sphere.userData.type = 'point'
                sphere.userData.materialMode = 'default'

                const size = stats.total + 1
                stats.avg.x = ((stats.avg.x || 0) * stats.total + x) / size
                stats.avg.y = ((stats.avg.y || 0) * stats.total + y) / size
                stats.avg.z = ((stats.avg.z || 0) * stats.total + z) / size

                stats.min.x = Math.min(stats.min.x || Number.MAX_VALUE, x)
                stats.min.y = Math.min(stats.min.y || Number.MAX_VALUE, y)
                stats.min.z = Math.min(stats.min.z || Number.MAX_VALUE, z)

                stats.max.x = Math.max(stats.max.x || Number.MIN_VALUE, x)
                stats.max.y = Math.max(stats.max.y || Number.MIN_VALUE, y)
                stats.max.z = Math.max(stats.max.z || Number.MIN_VALUE, z)
                stats.unique++

                network.meshGroups.nodes.add(sphere)
                network.nodeMap.set(key, sphere)
            }

            sphere.userData.ids.push(node.id)
            sphere.userData.guids.push(node.guid)
            sphere.userData.label = `Node ${sphere.userData.ids.join(',')}`

            if (stats.total++ > 99999) break
        }
    }

    chainLinks(links) {
        const linkCount = links.length
        const linkData = new Array(linkCount)

        const startMap = {}
        const endMap = {}
        for (let i = 0; i < linkCount; i++) {
            const link = links[i]
            const [a, b] = link.geometry

            const start = asVector3(scaleGeometry(a))
            const end = asVector3(scaleGeometry(b))

            if (!start || !end) continue

            linkData[i] = {link, start, end}
            if (!start || !end) continue

            const sKey = serializeVector(start)
            const eKey = serializeVector(end)

            if (!startMap[sKey]) startMap[sKey] = []
            if (!endMap[eKey]) endMap[eKey] = []

            startMap[sKey].push(i)
            endMap[eKey].push(i)
        }

        const used = new Set()
        const chains = []
        for (let i = 0; i < linkData.length; i++) {
            if (used.has(i)) continue

            const chain = []
            let current = i
            while (true) {
                if (used.has(current)) break

                used.add(current)
                chain.unshift(linkData[current])

                const curStartKey = serializeVector(linkData[current].start)
                const candidates = endMap[curStartKey]

                if (!candidates || candidates.length < 1) break

                let found = false
                for (const candidateIndex of candidates) {
                    if (used.has(candidateIndex)) continue

                    current = candidateIndex
                    found = true
                    break
                }

                if (!found) break
            }

            current = i
            while (true) {
                if (!linkData[current]) break

                const curEndKey = serializeVector(linkData[current].end)
                const candidates = startMap[curEndKey]

                if (!candidates || candidates.length < 1) break

                let found = false
                for (const candidateIndex of candidates) {
                    if (used.has(candidateIndex)) continue

                    used.add(candidateIndex)
                    chain.push(linkData[candidateIndex])
                    current = candidateIndex
                    found = true
                    break
                }

                if (!found) break
            }

            chains.push(chain)
        }

        return chains
    }

    /**
     * Updates statistical values for nodes and links.
     * @param {Object} stats - The statistics object to update.
     * @param {number} x - X value to update.
     * @param {number} y - Y value to update.
     * @param {number} z - Z value to update.
     */
    updateStats(stats, x, y, z) {
        const size = stats.total + 1
        stats.avg.x = ((stats.avg.x || 0) * (size - 1) + x) / size
        stats.avg.y = ((stats.avg.y || 0) * (size - 1) + y) / size
        stats.avg.z = ((stats.avg.z || 0) * (size - 1) + z) / size

        stats.min.x = Math.min(stats.min.x ?? Number.MAX_VALUE, x)
        stats.min.y = Math.min(stats.min.y ?? Number.MAX_VALUE, y)
        stats.min.z = Math.min(stats.min.z ?? Number.MAX_VALUE, z)

        stats.max.x = Math.max(stats.max.x ?? Number.MIN_VALUE, x)
        stats.max.y = Math.max(stats.max.y ?? Number.MIN_VALUE, y)
        stats.max.z = Math.max(stats.max.z ?? Number.MIN_VALUE, z)
    }

    /**
     * Adds nodes to the network.
     * Many nodes may share the same coordinates (but have different IDs and guids),
     * so we deduplicate nodes by their position.
     * @param {NodeGeometryData[]} nodes - The list of nodes to add to the network
     * @param {NetworkGeometryData} network - The network data to add the nodes to
     */
    addNodeAsSphere(nodes, network) {
        const geometry = this.geometries.point
        const material = this.materials.default.point

        const stats = network.stats.nodes
        const meshGroup = network.meshGroups.nodes
        const nodeMap = network.nodeMap

        for (const node of nodes) {
            const {x, y, z} = scaleGeometry(node.geometry)
            const key = `${x},${y},${z}`

            let sphere = network.nodeMap.get(key)
            if (isNil(sphere)) {
                sphere = new THREE.Mesh(geometry, material)
                sphere.position.set(x, y, z)
                sphere.userData = {
                    ouid: randomUUID(),
                    ids: [],
                    guids: [],
                    type: 'point',
                    materialMode: 'default',
                }

                this.updateStats(stats, x, y, z)

                network.meshGroups.nodes.add(sphere)
                network.nodeMap.set(key, sphere)

                stats.unique++
            }

            sphere.userData.ids.push(node.id)
            sphere.userData.guids.push(node.guid)
            sphere.userData.label = `Node ${sphere.userData.ids.join(',')}`

            if (stats.total++ > 99999) break
        }
    }

    addLinksAsChains(links, network, lineWidth = 0.05) {
        const material = this.materials.default.line
        const stats = network.stats.links

        const processor = new LinkChainRunner(links)
        const chains = processor.process()

        this.createTubesFromChains(chains, network, lineWidth, material, stats)
    }

    /**
     * Adds links to the network using a worker to chain them together.
     * This is useful for large datasets where chaining links in the main thread would block the UI.
     * @param {LinkGeometryData[]} links - The list of links to add to the network.
     * Each link must have a geometry property.
     * @param {NetworkGeometryData} network - The network data to which the links will be added.
     * @param {number} [lineWidth=0.05] - The width of the line. Default is 0.05 if not provided.
     */
    addLinksUsingWorker(links, network, lineWidth = 0.05) {
        const material = this.materials.default.line
        const stats = network.stats.links

        try {
            const caller = new LinkChainCaller()

            caller.chainLinks(links, chains => {
                this.createTubesFromChains(chains, network, lineWidth, material, stats)
                this.onTubesBuilt(network)

                // console.log({stats: network.stats})
                //
                // console.log({
                //     networkNodes: network.meshGroups.nodes.children.length,
                //     networkLinks: network.meshGroups.links.children.length,
                // })
                //
                // Object.values(network.meshGroups).forEach(g => {
                //     network.group.add(g)
                // })
                //
                // this.scene.add(network.group)
                // this.networks.set(network.uuid, network)
            })

        } catch (err) {
            console.error('Error creating worker:', err)
            this.worker = null
        }
    }

    onSphereBuilt(network) {
        console.log('Spheres built:', network.stats.nodes)
        console.log({
            networkNodes: network.meshGroups.nodes.children.length,
        })

        network.group.add(network.meshGroups.nodes)
    }

    onTubesBuilt(network) {
        console.log('Tubes built:', network.stats.links)
        console.log({
            networkLinks: network.meshGroups.links.children.length,
        })

        network.group.add(network.meshGroups.links)
    }

    addLinksUsingChunks(links, network, lineWidth = 0.05) {
        const material = this.materials.default.line
        const stats = network.stats.links

        const totalChunks = Math.ceil(links.length / CHUNK_SIZE)
        for (let chunk = 0; chunk < totalChunks; chunk++) {
            const start = chunk * CHUNK_SIZE
            const end = Math.min((chunk + 1) * CHUNK_SIZE, links.length)
            const linksChunk = links.slice(start, end)

            const chains = this.chainLinks(linksChunk)

            // Create tubes for each chain
            this.createTubesFromChains(chains, network, lineWidth, material, stats)

            // Allow GC to reclaim memory between chunks
            if (chunk % 5 === 4) {
                linksChunk.length = 0
                chains.length = 0

                setTimeout(() => {}, 0)
            }

            console.log(`Processed chunk ${chunk + 1} of ${totalChunks}`)

            if (chunk > 9) break
        }
    }

    /**
     * Creates tube geometries from chains of link data
     * @private
     * @param {LinkPreprocessedData[][]} chains - The list of chains to create tubes from (each chain is a list of links)
     * @param {NetworkGeometryData} network - The network data to add the tubes to
     * @param {number} lineWidth - The width of the line
     * @param {THREE.Material} material - The material to use for the tubes
     * @param {Object} stats - The statistics object to update with the tube data
     * @returns {void}
     */
    createTubesFromChains(chains, network, lineWidth, material, stats) {
        if (isNilArray(chains)) return console.warn('No chains found')

        // const singles = []
        const others = []

        let count = 0
        for (const chain of chains) {
            if (chain.length === 0) continue

            const points = []
            const startIds = []
            const endIds = []
            const sequences = []

            points.push(asVector3(chain[0].start))

            const size = chain.length
            for (let i = 0; i < size; i++) {
                const item = chain[i]

                if (item.sKey === item.eKey) continue

                points.push(asVector3(item.end))
                startIds.push(item.link.startNodeId)
                endIds.push(item.link.endNodeId)
                sequences.push(item.link.sequenceNo)

                const dx = Math.abs(item.end.x - item.start.x)
                const dy = Math.abs(item.end.y - item.start.y)
                const dz = Math.abs(item.end.z - item.start.z)

                this.updateStats(stats, dx, dy, dz)

                stats.total++
            }

            const length = points.length
            if (length < 3) {
                if (length === 2) others.push([...points])
                // if (length === 1) singles.push(points[0])
                continue
            }

            const {tubularSegments, radialSegments} = lodSettings(length)

            const radius = lineWidth
            const closed = false

            const curve = new THREE.CatmullRomCurve3(points, closed)
            const geometry = new THREE.TubeGeometry(
                curve,
                tubularSegments,
                radius,
                radialSegments,
                closed,
            )

            if (count++ < 5) console.log({chain, points})
            if (count > 49910 && count < 49913) console.log({chain, points, count})

            const mesh = new THREE.Mesh(geometry, material)
            mesh.userData.ouid = randomUUID()
            mesh.userData.label = `Chain[${length}] ${count}`
            mesh.userData.type = 'line'
            mesh.userData.materialMode = 'default'
            mesh.userData.startIds = startIds
            mesh.userData.endIds = endIds
            mesh.userData.sequences = sequences

            network.meshGroups.links.add(mesh)
        }

        if (others.length > 0) {
            const mesh = this.buildInstanceOfSegments(others, lineWidth, material)
            network.meshGroups.links.add(mesh)
        }

        // if (singles.length > 0) {
        //     const mesh = this.buildInstanceOfPoints(singles, lineWidth, material)
        //     network.meshGroups.links.add(mesh)
        // }
    }

    buildInstanceOfPoints(points) {
        const geometry = this.geometries.point
        const material = this.materials.default.point
        const mesh = new THREE.InstancedMesh(
            geometry,
            material,
            points.length,
        )
        const matrix = new THREE.Matrix4()

        for (let i = 0; i < points.length; i++) {
            const point = points[i]
            matrix.setPosition(point.x, point.y, point.z)
            mesh.setMatrixAt(i, matrix)
        }

        mesh.instanceMatrix.needsUpdate = true
        mesh.userData = {
            ouid: randomUUID(),
            type: 'point',
            materialMode: 'default',
        }

        return mesh
    }

    buildInstanceOfSegments(pairs, lineWidth, material) {
        const geometry = new THREE.CylinderGeometry(
            lineWidth,
            lineWidth,
            1,
            8,
            1,
        )

        // Move pivot point to bottom of cylinder
        geometry.translate(0, 0.5, 0)

        // Create instanced mesh
        const mesh = new THREE.InstancedMesh(
            geometry,
            material,
            pairs.length,
        )

        // Temporary variables
        const matrix = new THREE.Matrix4()
        const position = new THREE.Vector3()
        const target = new THREE.Vector3()
        const direction = new THREE.Vector3()

        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i]

            position.copy(pair[0])
            target.copy(pair[1])

            // Calculate direction and length
            direction.subVectors(target, position)
            const length = direction.length()

            // Normalize direction
            direction.normalize()

            // Calculate quaternion to rotate from (0,1,0) to direction
            const quaternion = new THREE.Quaternion()
            const upVector = new THREE.Vector3(0, 1, 0)
            quaternion.setFromUnitVectors(upVector, direction)

            // Create matrix
            matrix.makeRotationFromQuaternion(quaternion)
            matrix.scale(new THREE.Vector3(1, length, 1))
            matrix.setPosition(position)

            mesh.setMatrixAt(i, matrix)
        }

        mesh.instanceMatrix.needsUpdate = true

        mesh.userData.ouid = randomUUID()
        mesh.userData.label = `Connections[${pairs.length}]`
        mesh.userData.type = 'line'
        mesh.userData.materialMode = 'default'

        return mesh
    }

    /**
     * Adds links to the network
     * Each link connects two nodes (startNodeId and endNodeId) or may provide its own geometry.
     * Here, we use the link's provided geometry (an array of two coordinate arrays) to draw a line.
     * @param {LinkGeometryData[]} links - The list of links to add to the network
     * @param {NetworkGeometryData} network - The network data to add the nodes to
     */
    addLinks(links, network) {
        const material = this.materials.default.line
        const polylines = []
        let currentPolyline = null

        const stats = network.stats.links
        for (const link of links) {
            const [a, b] = link.geometry

            const start = asVector3(scaleGeometry(a))
            const end = asVector3(scaleGeometry(b))

            const points = [start, end]
            if (!start || !end) continue

            const d = {
                x: Math.abs(end.x - start.x),
                y: Math.abs(end.y - start.y),
                z: Math.abs(end.z - start.z),
            }

            const size = stats.total + 1
            stats.avg.x = ((stats.avg.x || 0) * stats.total + d.x) / size
            stats.avg.y = ((stats.avg.y || 0) * stats.total + d.y) / size
            stats.avg.z = ((stats.avg.z || 0) * stats.total + d.z) / size

            stats.min.x = Math.min(stats.min.x || Number.MAX_VALUE, d.x)
            stats.min.y = Math.min(stats.min.y || Number.MAX_VALUE, d.y)
            stats.min.z = Math.min(stats.min.z || Number.MAX_VALUE, d.z)

            stats.max.x = Math.max(stats.max.x || Number.MIN_VALUE, d.x)
            stats.max.y = Math.max(stats.max.y || Number.MIN_VALUE, d.y)
            stats.max.z = Math.max(stats.max.z || Number.MIN_VALUE, d.z)

            const geometry = new THREE.BufferGeometry().setFromPoints(points)
            const line = new THREE.Line(geometry, material)
            line.userData.id = link.id
            line.userData.sequense = link.sequenceNo
            line.userData.startNodeId = link.startNodeId
            line.userData.endNodeId = link.endNodeId
            line.userData.type = 'line'
            line.userData.materialMode = 'default'

            stats.unique++

            network.meshGroups.links.add(line)

            if (stats.total++ > 99999) break
        }
    }

    /**
     * Adds links to the network
     * Each link connects two nodes (startNodeId and endNodeId) or may provide its own geometry.
     * Here, we use the link's provided geometry (an array of two coordinate arrays) to draw a line.
     * @param {LinkGeometryData[]} links - The list of links to add to the network
     * @param {NetworkGeometryData} network - The network data to add the nodes to
     */
    addLinksAsTubes(links, network) {
        const material = this.materials.default.line

        const stats = network.stats.links
        for (const link of links) {
            const [a, b] = link.geometry

            const start = asVector3(scaleGeometry(a))
            const end = asVector3(scaleGeometry(b))

            const d = {
                x: Math.abs(end.x - start.x),
                y: Math.abs(end.y - start.y),
                z: Math.abs(end.z - start.z),
            }

            const size = stats.total + 1
            stats.avg.x = ((stats.avg.x || 0) * stats.total + d.x) / size
            stats.avg.y = ((stats.avg.y || 0) * stats.total + d.y) / size
            stats.avg.z = ((stats.avg.z || 0) * stats.total + d.z) / size

            stats.min.x = Math.min(stats.min.x || Number.MAX_VALUE, d.x)
            stats.min.y = Math.min(stats.min.y || Number.MAX_VALUE, d.y)
            stats.min.z = Math.min(stats.min.z || Number.MAX_VALUE, d.z)

            stats.max.x = Math.max(stats.max.x || Number.MIN_VALUE, d.x)
            stats.max.y = Math.max(stats.max.y || Number.MIN_VALUE, d.y)
            stats.max.z = Math.max(stats.max.z || Number.MIN_VALUE, d.z)

            if (start && end) {
                const direction = new THREE.Vector3().subVectors(end, start)
                const height = direction.length()

                const radiusTop = 0.15
                const radiusBottom = 0.15
                const radialSegments = 8

                const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
                geometry.translate(0, height / 2, 0)

                const tube = new THREE.Mesh(geometry, material)
                tube.userData.id = link.id
                tube.userData.sequense = link.sequenceNo
                tube.userData.startNodeId = link.startNodeId
                tube.userData.endNodeId = link.endNodeId
                tube.userData.type = 'line'
                tube.userData.materialMode = 'default'

                tube.position.copy(start)
                tube.lookAt(end)
                tube.rotateX(Math.PI / 2)

                stats.unique++

                network.meshGroups.links.add(tube)
            }

            // if (stats.total++ > 99999) break
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

        this.addPoints(collection.gis.points, collectionData)
        this.addLines(collection.gis.lines, collectionData)
        this.addPolylines(collection.gis.polylines, collectionData)
        this.addPolygons(collection.gis.polygons, collectionData)

        Object.values(collectionData.meshGroups).forEach(group => {
            collectionGroup.add(group)
        })

        this.scene.add(collectionGroup)

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