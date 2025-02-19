/**
 * Created by RTT.
 * Author: teocci@yandex.com on 2025-2월-13
 */
import BaseComponent from '../base/base-component.js'
import ToolbarComponent from '../components/toolbar-component.js'
import ViewerComponent from '../components/viewer-component.js'
import TOCComponent from '../components/toc-component.js'
import Restapi from '../restapi.js'

export default class ViewerModule extends BaseComponent {
    static TAG = 'viewer'

    static get instance() {
        this._instance = this._instance ?? new ViewerModule()

        return this._instance
    }

    /** @type {ToolbarComponent} */
    toolbar

    /** @type {ViewerComponent} */
    viewer

    /** @type {TOCComponent} */
    toc

    constructor($element) {
        super($element)

        this.initViewerModuleElements()
        this.initViewerModuleListeners()

        this.loadCollections()
    }

    initViewerModuleElements() {
        const $toolbar = document.getElementById('toolbar')
        const $viewer = document.getElementById('viewer')
        const $collections = document.getElementById('collections')

        if ($toolbar == null) throw new Error('Toolbar element not found.')
        if ($viewer == null) throw new Error('Viewer element not found.')
        if ($collections == null) throw new Error('Collections element not found.')

        this.toolbar = new ToolbarComponent($toolbar)
        this.viewer = new ViewerComponent($viewer)
        this.toc = new TOCComponent($collections)

        this.viewer.init()
        this.viewer.animate()
    }

    /**
     * Loads GIS data and passes it to the provided viewer instance.
     * If external data cannot be loaded, sample data is used.
     */
    loadCollections() {
        const asyncCollections = async () => {
            console.log('Loading GIS data...')
            console.log('pageInfo', pageInfo)

            const uuids = pageInfo.params?.collections ?? null
            const raw = await Restapi.fetchCollections(uuids)

            console.log({collections: raw})
            return raw
        }

        asyncCollections().then(raw => {
            this.viewer.buildGISScene(raw)
            this.toc.loadCollections(raw)
        })
    }

    initViewerModuleListeners() {
        this.toc.onClickHandler = ($element, uuid) => {
            if (this.toc.hasUUID(uuid)) {
                this.toc.removeUUID(uuid)
                this.viewer.unhighlightCollection(uuid)
                $element.classList.remove('active')
                return
            }

            this.toc.addUUID(uuid)
            this.viewer.highlightCollection(uuid)
            $element.classList.add('active')
        }

        this.toolbar.onItemClick = (e, key) => {
            switch (key) {
                case 'fit':
                    this.viewer.fitModel()
                    break
                case 'up-y':
                    this.viewer.upY()
                    break
                case 'up-z':
                    this.viewer.upZ()
                    break
                case 'snapshot':
                    const snapshot = this.viewer.renderImageAsDataUrl()
                    this.downloadDataUrl(snapshot)
                    break
                default:
                    console.warn('Unknown toolbar item', key)
            }
        }
    }

    /**
     * Downloads the provided data URL as an image file
     * @param {string} dataUrl - The data URL to download
     * @param {string} [filename='image'] - The name of the file to download (without extension)
     */
    downloadDataUrl(dataUrl, filename = `image-${hashID()}`) {
        // Create a link element
        const link = document.createElement('a');

        // Set link properties
        link.href = dataUrl;
        link.download = `${filename}.png`;

        // Add link to body, click it, and remove it
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
