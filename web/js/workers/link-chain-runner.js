/**
 * Created by RTT.
 * Author: teocci@yandex.com on 2025-3월-14
 */

import {asVector3, scaleGeometry, serializeVector} from '../three/three-utils.js'

const TARGET_LC_WORKER = 'link-chain-worker'
const ACTION_PROCESS_LINK_CHAINS = 'process-link-chains'

/**
 * @typedef {Object} NodePreprocessedData
 * @property {string} key - The serialized node key
 * @property {Object} geometry - The 3D coordinates [x, y, z] of the node.
 * @property {number} geometry.x - The x-coordinate of the node.
 * @property {number} geometry.y - The y-coordinate of the node.
 * @property {number} geometry.z - The z-coordinate of the node.
 */

/**
 * @typedef {Object} LinkPreprocessedData
 * @property {number} index - The index of the node.
 * @property {LinkGeometryData} link - The link data.
 * @property {string} sKey - Serialized start node key.
 * @property {string} eKey - Serialized end node key.
 * @property {Object} start - The start node geometry.
 * @property {number} start.x - The end node geometry.
 * @property {number} start.y - The end node geometry.
 * @property {number} start.z - The end node geometry.
 * @property {Object} end - The end node geometry.
 * @property {number} end.x - The end node geometry.
 * @property {number} end.y - The end node geometry.
 * @property {number} end.z - The end node geometry.
 */

export default class LinkChainRunner {
    static TARGET_LC_WORKER = TARGET_LC_WORKER
    static ACTION_PROCESS_LINK_CHAINS = ACTION_PROCESS_LINK_CHAINS

    /** @type {LinkGeometryData[]} */
    links

    /** @type {LinkPreprocessedData[]} */
    linkData

    /** @type {Map<string, Set<number>>} */
    nodeToLinks = new Map()

    /** @type {Uint8Array} */
    used

    /** @type {LinkPreprocessedData[][]} */
    chains

    /**
     * Create a new LinkChainRunner instance.
     * @param {LinkGeometryData[]} links - The links to process.
     */
    constructor(links) {
        this.links = links
        this.linkData = []
        this.chains = []
    }

    preprocess() {
        const size = this.links.length
        this.linkData = new Array(size)
        // Using a typed array for performance on large datasets.
        this.used = new Uint8Array(size)

        for (let i = 0; i < size; i++) {
            const link = this.links[i]
            const [a, b] = link.geometry

            const start = asVector3(scaleGeometry(a))
            const end = asVector3(scaleGeometry(b))

            const sKey = serializeVector(start)
            const eKey = serializeVector(end)

            this.linkData[i] = {i, link, sKey, eKey, start, end}

            this.mapNode(sKey, i)
            this.mapNode(eKey, i)
        }
    }

    /**
     * Map a link index to a node.
     *
     * @param {string} k - The serialized node key.
     * @param {number} v - The link index.
     */
    mapNode(k, v) {
        if (!this.nodeToLinks.has(k)) {
            this.nodeToLinks.set(k, new Set())
        }

        this.nodeToLinks.get(k).add(v)
    }

    /**
     * Get the links mapped to a node.
     *
     * @param {string} k - The serialized node
     * @return {number[]} - The links mapped to the node.
     */
    mappedNode(k) {
        return Array.from(this.nodeToLinks.get(k)) || []
    }

    /**
     * Build a chain starting from an endpoint.
     *
     * @param {string} endpointKey - The node key that is an endpoint.
     * @param {number} firstIndex - The starting link index from the endpoint.
     * @return {LinkPreprocessedData[]} - The chain of links.
     */
    buildChainFromEndpoint(endpointKey, firstIndex) {
        const chain = []
        let key = endpointKey
        let index = firstIndex

        while (index != null && !this.used[index]) {
            this.used[index] = 1
            const link = this.linkData[index]
            chain.push(link)

            const nextNode = (key === link.sKey) ? link.eKey : link.sKey
            if (this.isEndpoint(nextNode)) break

            // Find the next link from nextNode that has not yet been used.
            const candidates = this.mappedNode(nextNode)
            let nextLinkIndex = null
            for (const candidate of candidates) {
                if (this.used[candidate]) continue

                nextLinkIndex = candidate
                break
            }
            if (nextLinkIndex === null) break

            key = nextNode
            index = nextLinkIndex
        }
        return chain
    }

    /**
     * Build a chain for links that form a closed loop (cycle).
     *
     * @param {number} startLinkIndex - The starting link index.
     * @return {LinkPreprocessedData[]} - The cycle chain.
     */
    buildCycleChain(startLinkIndex) {
        const chain = []
        const firstLink = this.linkData[startLinkIndex]
        this.used[startLinkIndex] = 1
        chain.push(firstLink)

        // Arbitrarily choose a starting node (here, the sKey).
        const startNode = firstLink.sKey
        let currentNode = firstLink.eKey
        let index = null

        while (true) {
            const candidates = this.mappedNode(currentNode)
            let found = false
            for (const candidate of candidates) {
                if (this.used[candidate]) continue

                index = candidate
                found = true
                break
            }
            if (!found) break

            const nextLink = this.linkData[index]
            this.used[index] = 1
            chain.push(nextLink)

            // Determine the next node.
            const nextNode = (currentNode === nextLink.sKey) ? nextLink.eKey : nextLink.sKey
            if (nextNode === startNode) break

            currentNode = nextNode
        }

        return chain
    }

    /**
     * Normalize a chain by reorienting links so that the end of one link matches the start of the next.
     * For chains built from endpoints, the chain will start with the provided endpoint.
     *
     * @param {LinkPreprocessedData[]} chain - The chain to normalize.
     * @param {string} [forcedEP] - Optional. The endpoint that should start the chain.
     * @return {LinkPreprocessedData[]} - The normalized chain.
     */
    normalizeChain(chain, forcedEP) {
        if (chain.length < 2) return chain

        const normalized = []
        let firstLink = chain[0]

        if (forcedEP) {
            if (firstLink.sKey !== forcedEP && firstLink.eKey === forcedEP) firstLink = this.flipLink(firstLink)
        }

        normalized.push(firstLink)
        let endpoint = firstLink.eKey
        for (let i = 1; i < chain.length; i++) {
            let link = chain[i]

            if (link.sKey !== endpoint && link.eKey === endpoint) {
                link = this.flipLink(link)
            }

            normalized.push(link)
            endpoint = link.eKey
        }

        return normalized
    }

    /**
     * Flip a link so that its start and end properties are swapped.
     *
     * @param {LinkPreprocessedData} link - The link to flip.
     * @return {LinkPreprocessedData} - The flipped link.
     */
    flipLink(link) {
        return {
            ...link,
            sKey: link.eKey,
            eKey: link.sKey,
            start: link.end,
            end: link.start,
        }
    }

    /**
     * Process the links and return the chains.
     * @return {LinkPreprocessedData[][]}
     */
    process() {
        this.preprocess()

        const size = this.links.length

        // for (const [k, indexes] of this.nodeToLinks.entries()) {
        //     if (this.isNotEndpoint(k)) continue
        //
        //     for (const i of indexes) {
        //         if (this.isNotUsed(i)) continue
        //
        //         const chain = this.buildChainFromEndpoint(k, i)
        //         if (chain.length < 1) continue
        //
        //         const normalized = this.normalizeChain(chain, k)
        //         this.chains.push(normalized)
        //     }
        // }

        for (let i = 0; i < size; i++) {
            if (this.isUsed(i)) continue

            const chain = this.buildCycleChain(i)
            if (chain.length < 1) continue

            const normalized = this.normalizeChain(chain)
            this.chains.push(normalized)

            if (this.chains.length >= 100) break
        }

        return this.chains
    }


    /**
     * Process the links and return the chains.
     * The resulting chains are normalized so that the links are
     * reoriented in order (the end of one link matches the start of the next).
     * @return {LinkPreprocessedData[][]}
     */
    processSimple() {
        this.preprocess()
        const size = this.links.length
        for (let i = 0; i < size; i++) {
            if (this.used[i]) continue

            const { startKey, endKey } = this.linkData[i]
            let chain = (!this.isEndpoint(startKey) && this.isEndpoint(endKey))
                ? this.mergeChain(i, endKey, startKey)
                : this.mergeChain(i, startKey, endKey)

            // Normalize the chain ordering and orientation.
            chain = this.normalizeChainSimple(chain)
            this.chains.push(chain)
        }
        return this.chains
    }

    /**
     * Normalize the chain so that the links are in sequential order.
     * Each link is reoriented if necessary so that the end of one link
     * is the start of the next. For an open chain, the first link is forced
     * to start with the endpoint that appears only once.
     *
     * @param {LinkPreprocessedData[]} chain - The unnormalized chain.
     * @return {LinkPreprocessedData[]} The normalized chain.
     */
    normalizeChain(chain) {
        if (!chain.length) return chain

        // Build a frequency map for each node in the chain using a plain object.
        const nodeFrequency = {}
        for (let i = 0, len = chain.length; i < len; i++) {
            const link = chain[i]
            nodeFrequency[link.startKey] = (nodeFrequency[link.startKey] || 0) + 1
            nodeFrequency[link.endKey] = (nodeFrequency[link.endKey] || 0) + 1
        }

        // Identify endpoints: nodes that appear only once.
        const endpoints = []
        for (const key in nodeFrequency) {
            if (nodeFrequency[key] === 1) {
                endpoints.push(key)
            }
        }

        let startNode
        if (endpoints.length > 0) {
            // For an open chain, choose one endpoint as the starting node.
            // If the first link already has one of these endpoints, use that.
            if (chain[0].startKey === endpoints[0] || chain[0].endKey !== endpoints[0]) {
                startNode = endpoints[0]
            } else {
                startNode = endpoints[1]
            }
        } else {
            // For a closed chain, use the start of the first link.
            startNode = chain[0].startKey
        }

        const normalizedChain = []
        // Reorient the first link if needed.
        let firstLink = chain[0]
        if (firstLink.startKey !== startNode && firstLink.endKey === startNode) {
            firstLink = {
                ...firstLink,
                startKey: firstLink.endKey,
                endKey: firstLink.startKey,
                start: firstLink.end,
                end: firstLink.start,
            }
        }
        normalizedChain.push(firstLink)

        // For each subsequent link, flip its orientation if needed so that its start matches the previous link's end.
        for (let i = 1, len = chain.length; i < len; i++) {
            let current = chain[i]
            const prev = normalizedChain[i - 1]
            if (current.startKey !== prev.endKey && current.endKey === prev.endKey) {
                current = {
                    ...current,
                    startKey: current.endKey,
                    endKey: current.startKey,
                    start: current.end,
                    end: current.start,
                }
            }
            normalizedChain.push(current)
        }
        return normalizedChain
    }

    /**
     * Helper function that builds a chain from two segments
     *
     * @param {number} i - The starting link index
     * @param {string} l - The node key to build the left segment
     * @param {string} r - The node key to build the right segment
     * @return {LinkPreprocessedData[]} The combined chain
     */
    mergeChain(i, l, r) {
        const leftSegment = this.traverseChain(i, l)
        const rightSegment = this.traverseChain(i, r)
        leftSegment.reverse()
        return leftSegment.concat(rightSegment.slice(1))
    }

    /**
     * Traverse a chain of links starting from the given index.
     * @param {number} startIndex - The index of the starting link.
     * @param {string} nodeKey - The serialized node key.
     * @return {LinkPreprocessedData[]}
     */
    traverseChain(startIndex, nodeKey) {
        const segment = []
        let index = startIndex
        let key = nodeKey

        while (index != null && !this.used[index]) {
            this.used[index] = 1
            const link = this.linkData[index]
            segment.push(link)

            const nextKey = key === link.sKey ? link.eKey : link.sKey
            if (this.isEndpoint(nextKey)) break

            const candidates = this.mappedNode(nextKey)

            let nextIndex = null
            for (const candidate of candidates) {
                if (candidate === index || this.used[candidate]) continue

                nextIndex = candidate
                break
            }
            if (nextIndex == null) break

            key = nextKey
            index = nextIndex
        }

        return segment
    }

    /**
     * Check if a node is an endpoint.
     * @param {string} nodeKey - The serialized node key.
     * @return {boolean} - True if the node is an endpoint.
     */
    isEndpoint(nodeKey) {
        const connected = this.mappedNode(nodeKey)
        return connected?.length !== 2
    }

    /**
     * Check if a node is not an endpoint.
     * @param {string} nodeKey - The serialized node key.
     * @return {boolean} - True if the node is an endpoint.
     */
    isNotEndpoint(nodeKey) {
        const connected = this.mappedNode(nodeKey)
        return connected?.length === 2
    }

    /**
     * Check if a link has been used.
     * @param {number} index - The index of the link to check.
     * @return {boolean} - True if the link has been used.
     */
    isUsed(index) {
        return !!this.used[index]
    }

    /**
     * Check if a link has not been used.
     * @param {number} index - The index of the link to check.
     * @return {boolean} - True if the link has not been used.
     */
    isNotUsed(index) {
        return !this.used[index]
    }
}