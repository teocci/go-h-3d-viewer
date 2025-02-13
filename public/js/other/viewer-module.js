import STLLoader from './loaders/stl-loader.js'
import OBJLoader from './loaders/obj-loader.js'
import FBXLoader from './loaders/fbx-loader.js'
import PYLLoader from './loaders/ply-loader.js'
import Viewer from './viewer.js'

/**
 * Created by RTT.
 * Author: teocci@yandex.com on 2022-7월-14
 */
export default class ViewerModule {
    static FORMAT_LIST = [
        {type: STLLoader.TAG, url: STL_FILE},
        {type: OBJLoader.TAG, url: OBJ_FILE},
        {type: FBXLoader.TAG, url: FBX_FILE},
        {type: PYLLoader.TAG, url: PYL_FILE},
    ]

    static get instance() {
        this._instance = this._instance ?? new ViewerModule()

        return this._instance
    }

    constructor() {
        this.viewers = new Map()

        this.initElement()
        this.initViewers()

        console.log({viewers: this.viewers})
    }

    initElement() {
        this.placeholder = document.getElementById('viewers')
    }

    initViewers() {
        ViewerModule.FORMAT_LIST.forEach(f => {
            const element = document.createElement('div')
            element.classList.add('viewer')
            this.placeholder.appendChild(element)

            const viewer = new Viewer(element)
            this.viewers.set(f.type, viewer)
        })
    }

    loadViewers() {
        ViewerModule.FORMAT_LIST.forEach(f => {
            const viewer = this.viewers.get(f.type)
            viewer.loadModel(f.type, f.url)
            if (f.type !== FBXLoader.TAG) viewer.onResize()
            viewer.animate()
        })
    }
}