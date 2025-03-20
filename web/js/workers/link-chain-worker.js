/**
 * Created by RTT.
 * Author: teocci@yandex.com on 2025-3월-14
 */
import LinkChainRunner from './link-chain-runner.js'

const TARGET_LC_WORKER = LinkChainRunner.TARGET_LC_WORKER
const ACTION_PROCESS_LINK_CHAINS = LinkChainRunner.ACTION_PROCESS_LINK_CHAINS

self.onmessage = event => {
    const {target, action} = event.data
    if (target !== TARGET_LC_WORKER || action !== ACTION_PROCESS_LINK_CHAINS) return

    console.log('[Worker] onmessage', {event})

    const {links} = event.data
    if (!links) throw new Error('[Worker] links must be an array')

    const processor = new LinkChainRunner(links)
    const chains = processor.process()
    self.postMessage({chains})
}

// onmessage = event => {
//     console.log('[Worker] onmessage', {event})
//     const {target, action} = event.data
//     if (target !== TARGET_LC_WORKER || action !== ACTION_PROCESS_LINK_CHAINS) return
//
//     const {links} = event.data
//     try {
//         const processor = new LinkChainRunner(links)
//         const chains = processor.process()
//         self.postMessage({chains})
//     } catch (error) {
//         self.postMessage({
//             error: {
//                 message: error.message,
//                 stack: error.stack,
//             },
//         })
//     }
// }