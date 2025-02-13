import * as FFlate from 'https://unpkg.com/fflate@0.7.3/esm/index.mjs'

/**
 * Created by RTT.
 * Author: teocci@yandex.com on 2022-8월-17
 */
export default class DropZoner {
    /**
     * @param  {Element} placeholder
     * @param  {Element} inputElement
     */
    constructor(placeholder, inputElement) {
        this.placeholder = placeholder
        this.inputElement = inputElement

        this.listeners = {
            drop: [],
            dropstart: [],
            droperror: [],
        }

        this.onDragOver = this.onDragOver.bind(this)
        this.onDrop = this.onDrop.bind(this)
        this.onSelect = this.onSelect.bind(this)

        placeholder.ondragenter = this.onDragEnter
        placeholder.ondragover = this.onDragOver
        placeholder.ondrop = this.onDrop

        inputElement.onchange = this.onSelect
    }

    /**
     * @param  {string}   type
     * @param  {Function} callback
     * @return {DropZoner}
     */
    on(type, callback) {
        this.listeners[type].push(callback)
        return this
    }

    /**
     * @param  {string} type
     * @param  {Object} data
     * @return {DropZoner}
     */
    emit(type, data) {
        this.listeners[type].forEach(callback => callback(data))

        return this
    }

    /**
     * Destroys the instance.
     */
    destroy() {
        const placeholder = this.placeholder
        const inputElement = this.inputElement

        placeholder.removeEventListener('dragover', this.onDragOver, false)
        placeholder.removeEventListener('drop', this.onDrop, false)

        inputElement.removeEventListener('change', this.onSelect)

        delete this.placeholder
        delete this.inputElement
        delete this.listeners
    }

    /**
     * @param  {Event} e
     */
    onDragEnter(e) {
        e.stopPropagation()
        e.preventDefault()

        this.placeholder.textContent = ''
    }

    /**
     * @param  {Event} e
     */
    onDragOver(e) {
        e.stopPropagation()
        e.preventDefault()

        e.dataTransfer.dropEffect = 'copy' // Explicitly show this is a copy.
    }

    /**
     * References (and horror):
     * - https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/items
     * - https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/files
     * - https://code.flickr.net/2012/12/10/drag-n-drop/
     * - https://stackoverflow.com/q/44842247/1314762
     *
     * @param {DragEvent} event
     */
    onDrop(event) {
        event.stopPropagation()
        event.preventDefault()

        this.emit('dropstart')

        const files = Array.from(event.dataTransfer.files || [])
        const items = Array.from(event.dataTransfer.items || [])

        const filesCount = files.length
        const itemsCount = items.length

        console.log(`File Count: ${filesCount}\n`)
        console.log(`Items Count: ${itemsCount}\n`)

        if (filesCount === 0 && itemsCount === 0) {
            this.fail('Required drag-and-drop APIs are not supported in this browser.')
            return
        }

        // Prefer .items, which allow folder traversal if necessary.
        if (itemsCount > 0) {
            const entries = items.map(item => item.webkitGetAsEntry())

            if (entries[0].name.match(/\.zip$/)) {
                this.loadZip(items[0].getAsFile())
            } else {
                this.loadNextEntry(new Map(), entries)
            }

            return
        }

        // Fall back to .files, since folders can't be traversed.
        if (filesCount === 1 && files[0].name.match(/\.zip$/)) {
            this.loadZip(files[0])
        }

        this.emit('drop', {files: new Map(files.map(file => [file.name, file]))})
    }

    /**
     * @param  {Event} e
     */
    onSelect(e) {
        this.emit('dropstart')

        // HTML file inputs do not seem to support folders, so assume this is a flat file list.
        const files = [].slice.call(this.inputElement.files)

        // Automatically decompress a zip archive if it is the only file given.
        if (files.length === 1 && this.isZip(files[0])) {
            this.loadZip(files[0])
            return
        }

        const fileMap = new Map()
        files.forEach(file => fileMap.set(file.webkitRelativePath || file.name, file))

        this.emit('drop', {files: fileMap})
    }

    /**
     * Iterates through a list of FileSystemEntry objects, creates the fileMap
     * tree, and emits the result.
     * @param  {Map<string, File>} fileMap
     * @param  {Array<FileSystemEntry>} entries
     */
    loadNextEntry(fileMap, entries) {
        const entry = entries.pop()

        if (!entry) {
            this.emit('drop', {files: fileMap})
            return
        }

        if (entry.isFile) {
            const onSuccess = file => {
                fileMap.set(entry.fullPath, file)
                this.loadNextEntry(fileMap, entries)
            }
            const onError = () => console.error('Could not load file: %s', entry.fullPath)
            entry.file(onSuccess, onError)
        } else if (entry.isDirectory) {
            // readEntries() must be called repeatedly until it stops returning results.
            // https://www.w3.org/TR/2012/WD-file-system-api-20120417/#the-directoryreader-interface
            // https://bugs.chromium.org/p/chromium/issues/detail?id=378883
            const reader = entry.createReader()
            const readerCallback = newEntries => {
                if (newEntries.length) {
                    entries = entries.concat(newEntries)
                    reader.readEntries(readerCallback)
                } else {
                    this.loadNextEntry(fileMap, entries)
                }
            }
            reader.readEntries(readerCallback)
        } else {
            console.warn('Unknown asset type: ' + entry.fullPath)
            this.loadNextEntry(fileMap, entries)
        }
    }

    /**
     * Inflates a File in .ZIP format, creates the fileMap tree, and emits the
     * result.
     * @param  {File} file
     */
    loadZip(file) {
        const pending = []
        const fileMap = new Map()
        const archive = new FFlate.Unzip

        const traverse = node => {
            if (node.directory) {
                node.children.forEach(traverse)
            } else if (node.name[0] !== '.') {
                pending.push(new Promise(resolve => {
                    node.getData(new zip.BlobWriter(), blob => {
                        blob.name = node.name
                        fileMap.set(node.getFullname(), blob)
                        resolve()
                    })
                }))
            }
        }

        archive.importBlob(file, () => {
            traverse(archive.root)
            Promise.all(pending).then(() => {
                this.emit('drop', {files: fileMap, archive: file})
            })
        })
    }

    /**
     * @param  {File} file
     * @return {Boolean}
     */
    isZip(file) {
        return file.type === 'application/zip' || file.name.match(/\.zip$/)
    }

    /**
     * @param {string} message
     * @throws
     */
    fail(message) {
        this.emit('droperror', {message: message})
    }
}