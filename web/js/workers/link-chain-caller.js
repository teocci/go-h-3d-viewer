/**
 * Created by RTT.
 * Author: teocci@yandex.com on 2025-3월-14
 */
import LinkChainRunner from './link-chain-runner.js'

const TAG = 'link-chain'

const TARGET_LC_WORKER = LinkChainRunner.TARGET_LC_WORKER
const ACTION_PROCESS_LINK_CHAINS = LinkChainRunner.ACTION_PROCESS_LINK_CHAINS

export default class LinkChainCaller {
    constructor(path = '/js/workers/link-chain-worker.js') {
        try {
            this.worker = window.Worker ? new Worker(path, {name: TAG, type: 'module'}) : null
        } catch (err) {
            console.error('Error creating worker:', err)
            this.worker = null
        }
    }

    /**
     * Chain the links together.
     * @param {LinkGeometryData[]} links - The links to chain.
     * @param {function} callback - The callback to call with the resulting chains.
     */
    chainLinks(links, callback) {
        if (isNil(this.worker)) {
            this.runInline(links, callback)
            return
        }

        this.runInWorker(links, callback)
    }

    /**
     * Run the LinkChainRunner in a Web Worker.
     * @param {LinkGeometryData[]} links - The links to chain.
     * @param {function} callback - The callback to call with the resulting chains.
     */
    runInWorker(links, callback) {
        console.log('[worker] runInWorker:', {links, worker: this.worker, callback})
        this.worker.onmessage = e => {
            callback(e.data.chains)
        }
        this.worker.onerror = err => {
            console.error('Worker error:', {err})
        }

        this.worker.postMessage({
            links,
            action: ACTION_PROCESS_LINK_CHAINS,
            target: TARGET_LC_WORKER,
        })
    }

    /**
     * Run the LinkChainRunner inline.
     * @param {LinkGeometryData[]} links - The links to chain.
     * @param {function} callback - The callback to call with the resulting chains.
     */
    runInline(links, callback) {
        const worker = new LinkChainRunner(links)
        const chains = worker.process()
        callback(chains)
    }

    terminate() {
        if (isNil(this.worker)) return

        this.worker.terminate()
    }
}