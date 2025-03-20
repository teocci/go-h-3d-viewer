/**
 * Created by RTT.
 * Author: teocci@yandex.com on 2025-2월-10
 */

import ViewerComponent from './components/viewer-component.js'

const sampleGISData = {
    'points': [
        {'id': 'n1', 'coordinates': [0, 0, 0]},
        {'id': 'n2', 'coordinates': [10, 0, 0]},
        {'id': 'n3', 'coordinates': [10, 10, 0]},
        {'id': 'n4', 'coordinates': [0, 10, 0]},
        {'id': 'n5', 'coordinates': [5, 5, 10]},
    ],
    'lines': [
        {'id': 'l1', 'start': 'n1', 'end': 'n2'},
        {'id': 'l2', 'start': 'n2', 'end': 'n3'},
    ],
    'polylines': [
        {'id': 'pl1', 'nodes': ['n1', 'n2', 'n3', 'n4']},
    ],
    'polygons': [
        {'id': 'pg1', 'vertices': [[15, 0, 0], [25, 0, 0], [25, 10, 0], [15, 10, 0]]},
    ],
}

/**
 * Loads GIS data and passes it to the provided viewer instance.
 * If external data cannot be loaded, sample data is used.
 * @param {ViewerComponent} viewer - The Viewer instance.
 */
function loadGISData(viewer) {
    const fetchGISData = async () => {
        let data
        try {
            const response = await fetch('api/v1/data')
            const raw = await response.json()
            data = raw?.gis ?? raw
        } catch (error) {
            console.warn('Could not load external GIS data, using sample data.', error)
            data = sampleGISData
        }

        console.log({data})
        return data
    }

    fetchGISData().then(data => viewer.loadCollections(data))
}

const $viewer = document.getElementById('viewers')

window.onload = () => {
    console.log('init')

    if ($viewer == null) throw new Error('Viewer element not found.')

    const viewer = new ViewerComponent($viewer)

    // Initialize scene and start animation loop.
    viewer.init()
    viewer.animate()

    loadGISData(viewer)
}