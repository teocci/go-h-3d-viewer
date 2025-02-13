/**
 * Created by RTT.
 * Author: teocci@yandex.com on 2025-2월-12
 */

/**
 * Represents a point in GIS data.
 * @typedef {Object} GISPointData
 * @property {string} id - Unique identifier for the point.
 * @property {number[]} coordinates - Coordinates of the point in [x, y, z] format.
 */

/**
 * Represents a line in GIS data.
 * @typedef {Object} GISLineData
 * @property {string} id - Unique identifier for the line.
 * @property {string} start - ID of the starting point of the line.
 * @property {string} end - ID of the ending point of the line.
 */

/**
 * Represents a polyline in GIS data.
 * @typedef {Object} GISPolylineData
 * @property {string} id - Unique identifier for the polyline.
 * @property {string[]} nodes - Array of point IDs that form the polyline.
 */

/**
 * Represents a polygon in GIS data.
 * @typedef {Object} GISPolygonData
 * @property {string} id - Unique identifier for the polygon.
 * @property {number[][]} vertices - Array of coordinates defining the polygon's vertices, each in [x, y, z] format.
 */

/**
 * Represents GIS data for a system.
 * @typedef {Object} GISData
 * @property {GISPointData[]} points - Array of point coordinates in the system.
 * @property {GISLineData[]} lines - Array of lines connecting points.
 * @property {GISPolylineData[]} polylines - Array of polylines composed of multiple points.
 * @property {GISPolygonData[]} polygons - Array of polygons defining areas.
 */

/**
 * Represents a system with GIS data.
 * @typedef {Object} GISCollectionData
 * @property {string} name - The name of the system.
 * @property {string} uuid - The unique identifier for the system.
 * @property {GISData} gis - Geographic Information System data for the system.
 */

/**
 * Return a POST method options with JSON data. POST method's body cannot be empty.
 *
 * @param data
 * @return {?RequestInit}
 */
const postOptions = data => genOptions('POST', data)

/**
 * Generate options for fetch API.
 * Default method is POST.
 * Default headers is 'Content-Type': 'application/json'.
 * Default body is empty string.
 *
 * @param method
 * @param data
 * @return {?RequestInit}
 */
const genOptions = (method = 'POST', data) => ({
    method,
    headers: {
        'Content-Type': 'application/json',
    },
    body: isNil(data) ? '' : JSON.stringify(data),
})

export default class Restapi {
    /**
     * @param {Object} payload
     * @param {string} payload.username
     * @param {string} payload.password
     * @return {Promise<>}
     */
    static async fetchLogin(payload) {
        if (isNil(payload)) throw new Error('payload is not defined')
        if (isNilString(payload.username)) throw new Error('username is not defined')
        if (isNilString(payload.password)) throw new Error('password is not defined')

        const url = '/api/v1/auth/login'
        const options = postOptions(payload)
        const response = await fetch(url, options)
        if (!response.ok) throw new Error(`Failed to sign in: ${response.statusText}`)

        const json = await response.json()

        return isNil(json?.data) ? json : json.data
    }

    static async fetchLogout() {
        const url = '/api/v1/user/logout'
        const response = await fetch(url)
        return await response.json()
    }

    /**
     * @param {string[]} collections - The list of collections to fetch.
     * @return {Promise<GISCollectionData[]>} - The response object.
     */
    static async fetchCollections(collections) {
        if (isNilArray(collections)) throw new Error('collections is not defined')

        const params = new URLSearchParams()
        params.append('collections', collections.join(','))

        const url = `/api/v1/collections?${params.toString()}`
        const response = await fetch(url)

        return await response.json()
    }
}