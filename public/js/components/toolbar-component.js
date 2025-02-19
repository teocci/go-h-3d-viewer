/**
 * Created by RTT.
 * Author: teocci@yandex.com on 2025-2월-17
 */
import BaseComponent from '../base/base-component.js'

const TAG = 'toolbar'

const FIT_KEY = 'fit'
const UP_Y_KEY = 'up-y'
const UP_Z_KEY = 'up-z'
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
const SNAPSHOTS = {
    key: SNAPSHOTS_KEY,
    icon: `icon-${SNAPSHOTS_KEY}`,
}

const TOOLBAR_ITEM_LIST = [FIT, UP_Y, UP_Z, SNAPSHOTS]

const TOOLBAR_ITEMS = {
    [FIT_KEY]: FIT,
    [UP_Y_KEY]: UP_Y,
    [UP_Z_KEY]: UP_Z,
    [SNAPSHOTS_KEY]: SNAPSHOTS,
}

export default class ToolbarComponent extends BaseComponent {
    static TAG = TAG

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

    initToolbarModuleListeners() {
    }

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

    onItemClick(e, key) {
        console.log('ToolbarComponent.onItemClick', key)
    }
}