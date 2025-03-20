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
 * @typedef {Object} NodeGeometryData
 * @property {number} id - The unique identifier of the node.
 * @property {string} guid - The globally unique identifier of the node.
 * @property {number} type - The type of the node.
 * @property {number[]} geometry - The 3D coordinates [x, y, z] of the node.
 */

/**
 * @typedef {Object} NodeListData
 * @property {string} uuid - The universally unique identifier for the NodeListData.
 * @property {NodeGeometryData[]} data - An array of nodes in the list.
 */

/**
 * @typedef {Object} LinkGeometryData
 * @property {number} id - The unique identifier of the link.
 * @property {string} guid - The globally unique identifier of the link.
 * @property {number} sequenceNo - The sequence number of the link.
 * @property {number} startNodeId - The unique identifier of the start node for the link.
 * @property {number} endNodeId - The unique identifier of the end node for the link.
 * @property {number} type - The type of the link.
 * @property {number[][]} geometry - The list of 3D coordinates [[x1, y1, z1], [x2, y2, z2]] that define the geometry of the link.
 */

/**
 * @typedef {Object} LinkListData
 * @property {LinkGeometryData[]} data - An array of links in the list.
 */

/**
 * @typedef {Object} NetworkData
 * @property {string} uuid - The universally unique identifier for the network.
 * @property {NodeGeometryData[]} nodes - The list of nodes in the network.
 * @property {LinkGeometryData[]} links - The list of links in the network.
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

    /**
     * Fetch Nodes and Links from the network with the provided UUID.
     * @param {string} uuid - The UUID of the network to fetch.
     * @return {Promise<NetworkData>}
     */
    static async fetchNetworkData(uuid) {
        if (isNilString(uuid)) throw new Error('Network UUID is required')

        const [nodesResponse, linksResponse] = await Promise.all([
            this.fetchNetworkNodes(uuid),
            this.fetchNetworkLinks(uuid),
        ])

        return {
            uuid,
            nodes: nodesResponse.data,
            links: linksResponse.data,
        }
    }

    /**
     * @param {string} uuid - The UUID of the collection to fetch.
     * @return {Promise<NodeListData>} - The response object.
     */
    static async fetchNetworkNodes(uuid) {
        // const url = `/api/v1/network/${uuid}/nodes`
        const url = `/json/network-dummy-nodes.json`

        return await this.fetchStreamedData(url)
    }

    /**
     * @param {string} uuid - The UUID of the collection to fetch.
     * @return {Promise<LinkListData>} - The response object.
     */
    static async fetchNetworkLinks(uuid) {
        // const url = `/api/v1/network/${uuid}/links`
        const url = `/json/network-dummy-links.json`

        return await this.fetchStreamedData(url)
    }

    /**
     * Helper function to fetch streamed JSON data
     * Handles progress tracking for large responses
     * @param {string} url - API endpoint URL
     * @param {Object} extended - Optional fetch configuration
     * @param {Function} onProgress - Optional callback for tracking download progress
     * @returns {Promise<Object>} The parsed JSON response
     */
    static async fetchStreamedData(url, extended = {}, onProgress = null) {
        // Set default options
        const fetchOptions = {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            ...extended,
        }

        try {
            // Start the fetch request
            const response = await fetch(url, fetchOptions)

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData?.error?.message || `Request failed with status ${response.status}`)
            }

            // Handle progress tracking if needed
            if (onProgress && response.body) {
                const contentLength = response.headers.get('Content-Length')
                const total = contentLength ? parseInt(contentLength, 10) : 0
                let loaded = 0

                // Create a new ReadableStream from the response body
                const reader = response.body.getReader()
                const stream = new ReadableStream({
                    async start(controller) {
                        while (true) {
                            const {done, value} = await reader.read()

                            if (done) {
                                controller.close()
                                break
                            }

                            loaded += value.length
                            controller.enqueue(value)

                            if (total > 0) {
                                onProgress({loaded, total, progress: loaded / total})
                            } else {
                                onProgress({loaded, total: null, progress: null})
                            }
                        }
                    },
                })

                // Create a new response with the stream
                const newResponse = new Response(stream, {
                    headers: response.headers,
                    status: response.status,
                    statusText: response.statusText,
                })

                // Parse the JSON from the stream
                return await newResponse.json()
            }

            // If no progress tracking, just parse the JSON directly
            return await response.json()
        } catch (error) {
            console.error(`Error fetching data from ${url}:`, error)
            throw error
        }
    }
}