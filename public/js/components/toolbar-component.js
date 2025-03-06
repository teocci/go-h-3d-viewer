/**
 * Created by RTT.
 * Author: teocci@yandex.com on 2025-2월-17
 */
import BaseComponent from '../base/base-component.js'
import ViewerComponent from './viewer-component.js'

const TAG = 'toolbar'

const FIT_KEY = 'fit'
const UP_Y_KEY = 'up-y'
const UP_Z_KEY = 'up-z'
const PATH_KEY = 'path'
const SNAPSHOTS_KEY = 'snapshot'

const FIT = {
    key: FIT_KEY,
    icon: `icon-${FIT_KEY}`,
}
const UP_Y = {
    key: UP_Y_KEY,
    icon: `icon-${UP_Y_KEY}`,
}
const UP_Z = {
    key: UP_Z_KEY,
    icon: `icon-${UP_Z_KEY}`,
}
const PATH = {
    key: PATH_KEY,
    icon: 'icon-measure-distance',
}
const SNAPSHOTS = {
    key: SNAPSHOTS_KEY,
    icon: `icon-${SNAPSHOTS_KEY}`,
}

const TOOLBAR_ITEM_LIST = [FIT, UP_Y, UP_Z, PATH, SNAPSHOTS]

const TOOLBAR_ITEMS = {
    [FIT_KEY]: FIT,
    [UP_Y_KEY]: UP_Y,
    [UP_Z_KEY]: UP_Z,
    [PATH_KEY]: PATH,
    [SNAPSHOTS_KEY]: SNAPSHOTS,
}

export default class ToolbarComponent extends BaseComponent {
    static TAG = TAG

    static FIT_KEY = FIT_KEY
    static UP_Y_KEY = UP_Y_KEY
    static UP_Z_KEY = UP_Z_KEY
    static PATH_KEY = PATH_KEY
    static SNAPSHOTS_KEY = SNAPSHOTS_KEY

    constructor($element) {
        super($element)

        this.initToolbarModuleElements()
        this.initToolbarModuleListeners()
    }

    initToolbarModuleElements() {
        const $wrapper = this.dom
        $wrapper.classList.add('toolbar')

        console.log('initToolbarModuleElements', {$wrapper})

        const $list = document.createElement('div')
        $list.classList.add('toolbar-items')

        this.createToolbarItems($list)

        $wrapper.append($list)
    }

    initToolbarModuleListeners() {}

    createToolbarItems($list) {
        for (const item of TOOLBAR_ITEM_LIST) {
            const $item = this.createToolbarItem(item)
            $list.appendChild($item)
        }
    }

    createToolbarItem(item) {
        const $item = document.createElement('div')
        $item.classList.add('toolbar-item', `item-${item.key}`)
        $item.dataset.key = item.key
        $item.onclick = e => this.onItemClick(e, item.key)

        const $icon = document.createElement('div')
        $icon.classList.add('icon-box')

        const $i = document.createElement('i')
        $i.classList.add('icon', item.icon)

        $icon.append($i)
        $item.append($icon)

        return $item
    }

    /**
     * Returns the toolbar item with the provided key
     *
     * @param {string} key - The key of the item to return
     * @returns {HTMLElement|null} The toolbar item with the provided key, or null if not found
     */
    itemByKey(key) {
        const $wrapper = this?.dom ?? null
        if (isNil($wrapper)) return null

        return $wrapper.querySelector(`.toolbar-item[data-key="${key}"]`) ?? null
    }

    activateItem(key) {
        const $item = this.itemByKey(key)
        if (isNil($item)) return

        $item.classList.add('active')
    }

    deactivateItem(key) {
        const $item = this.itemByKey(key)
        if (isNil($item)) return

        $item.classList.remove('active')
    }

    toggleItem(key, force) {
        const $item = this.itemByKey(key)
        if (isNil($item)) return

        $item.classList.toggle('active', force)
    }

    onItemClick(e, key) {
        console.log('ToolbarComponent.onItemClick', key)
    }
}