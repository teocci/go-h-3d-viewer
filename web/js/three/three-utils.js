/**
 * Created by RTT.
 * Author: teocci@yandex.com on 2025-3월-14
 */
import * as THREE from '../../vendors/three/bin/three.module.js'
console.log('three-utils.js loaded')

const SCALE_FACTOR = 0.001
const scaleGeometry = g => {
    const [x, y, z] = g
    return {
        x: (x || 0) * SCALE_FACTOR,
        y: (y || 0) * SCALE_FACTOR,
        z: (z || 0) * SCALE_FACTOR,
    }
}
const asVector3 = g => new THREE.Vector3(g.x, g.y, g.z)

/**
 * Serialize a vector to a string.
 * @param {THREE.Vector3} v - The vector to serialize.
 * @param {number} [p = 3] - The number of decimal places to include.
 * @return {string} The serialized vector.
 */
const serializeVector = (v, p = 4) => `${v.x.toFixed(p)},${v.y.toFixed(p)},${v.z.toFixed(p)}`

export {scaleGeometry, asVector3, serializeVector}