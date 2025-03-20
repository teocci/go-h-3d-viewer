/**
 * Created by RTT.
 * Author: teocci@yandex.com on 2025-2월-13
 */

export default class TOCComponent {
    /** @type {HTMLDivElement} */
    $element = null

    /** @type {HTMLDivElement} */
    $container = null

    /** @type {GISCollectionData} */
    data

    /** @type {Set<string>} */
    selectedUUIDs = new Set()

    constructor($element) {
        this.$element = $element
        this.init()
    }

    init() {
        const $wrapper = this.$element
        if (!$wrapper) {
            console.error('Collections container not found!')
            return
        }

        // Clear existing content
        $wrapper.innerHTML = ''

        // Create a container for the list
        const cardsContainer = document.createElement('div')
        cardsContainer.classList.add('cards-container')

        this.$element.append(cardsContainer)
        this.$container = cardsContainer
    }

    /**
     * Load the collections into the table of contents
     * @param {GISCollectionData[]} data - The GIS data containing points, lines, polylines, and polygons.
     */
    loadCollections(data) {
        if (isNilArray(data)) {
            console.error('No GIS data provided!')
            return
        }

        for (const collection of data) {
            const $card = this.createCardItem(collection)
            this.$container.append($card)
        }
    }

    /**
     * Create a card item for the network
     * @param {NetworkData} data - The network data to display.
     */
    loadNetwork(data) {
        if (isNilArray(data)) {
            console.error('No GIS data provided!')
            return
        }

        const collection = {
            uuid: data.uuid,
            name: `network-${shortUUID(data.uuid)}`,
            gis: {},
        }

        const $card = this.createCardItem(collection)
        this.$container.append($card)
    }

    /**
     * Create a card item for the collection
     * @param {GISCollectionData} collection - The GIS collection data to display.
     * @return {HTMLDivElement} - The card element.
     */
    createCardItem(collection) {
        const elementID = `components-${collection.uuid}`
        // Create the main collection item
        const $card = document.createElement('div')
        $card.classList.add('card')

        const $header = document.createElement('div')
        $header.classList.add('card-header')
        // $header.setAttribute('data-bs-toggle', 'collapse')
        // $header.setAttribute('data-bs-target', `#${elementID}`)
        // $header.setAttribute('aria-controls', `${elementID}`)
        // $header.ariaExpanded = 'false'
        $header.style.cursor = 'pointer'
        $header.textContent = collection.name
        $header.dataset.uuid = collection.uuid
        $header.onclick = () => {
            this.onClickHandler($header, collection.uuid)
        }

        const $body = document.createElement('div')
        $body.classList.add('card-body', 'p-0')

        const $list = this.createComponentsList(collection)
        if (!isNil($list)) $body.append($list)

        $card.append($header, $body)

        return $card
    }

    createComponentsList(collection) {
        if (isNil(collection) || isNil(collection.gis)) return null

        const {gis} = collection
        const $list = document.createElement('div')
        $list.classList.add('collapse', 'mt-2')
        $list.id = `components-${collection.uuid}`

        if (isNil(gis.points) || isNil(gis.lines) || isNil(gis.polylines) || isNil(gis.polygons)) return null

        const components = [
            {label: 'Points', items: gis.points, count: gis.points.length},
            {label: 'Lines', items: gis.lines, count: gis.lines.length},
            {label: 'Polylines', items: gis.polylines, count: gis.polylines.length},
            {label: 'Polygons', items: gis.polygons, count: gis.polygons.length},
        ]

        for (const {label, items, count} of components) {
            if (items.length > 0) {
                const $group = this.createComponentGroup(label, items, count)
                $list.append($group)
            }
        }

        return $list
    }

    createComponentGroup(label, items, count) {
        const $group = document.createElement('div')
        $group.classList.add('list-group')

        const $header = document.createElement('div')
        $header.classList.add('list-group-item', 'list-group-item-secondary', 'fw-bold')
        $header.textContent = label
        $header.dataset.count = count
        $group.append($header)

        for (const item of items) {
            const $item = document.createElement('div')
            $item.classList.add('list-group-item', 'list-group-item-component')
            $item.textContent = item.id

            $group.append($item)
        }

        return $group
    }

    addUUID(uuid) {
        this.selectedUUIDs.add(uuid)
    }

    removeUUID(uuid) {
        this.selectedUUIDs.delete(uuid)
    }

    hasUUID(uuid) {
        return this.selectedUUIDs.has(uuid)
    }

    onClickHandler($element, uuid) {
        console.log('TOCComponent.onClickHandler', uuid)
    }
}