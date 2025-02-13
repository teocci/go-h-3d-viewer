/**
 * Created by RTT.
 * Author: teocci@yandex.com on 2022-6월-10
 */
const REGEX_SNAKE_CASE = /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g
const REGEX_CAMEL_CASE = /[^a-zA-Z0-9]+(.)/g
const REGEX_PASCAL_CASE = /\w\S*/g

const isObject = o => !!o && 'object' === typeof o
const isArray = a => !!a && a.constructor === Array
const isMap = m => !!m && m.constructor === Map
const isDate = d => !!d && d.constructor === Date
const isFunction = f => !!f && 'function' === typeof f

const isBoolean = b => 'boolean' === typeof b
const isNumber = n => 'number' === typeof n
const isString = s => 'string' === typeof s

const isPositive = n => isNumber(n) && n > 0

const isNull = o => o === null
const isUndefined = o => o === undefined
const isNil = o => o == null

const isNumeric = n => (isNumber(n) && !isNaN(n)) || (isString(n) && !isNaN(n) && !isNaN(parseFloat(n)))
const isStringObj = (s, instance = false) => {
    return typeof s === 'string' || (instance && s instanceof String)
}

const isEmptyString = s => {
    if (!isString(s)) return false
    const st = s.trim()
    return st === '' || st.length < 1
}
const isEmptyArray = a => isArray(a) && a.length < 1
const isEmptyMap = m => isMap(m) && m.size < 1
const isEmptyObject = o => {
    if (isNil(o)) return false
    if (o.constructor !== Object) return false
    return Object.keys(o).length < 1
}

const isNilNumber = n => isNil(n) || !isNumeric(n)
const isNilString = s => isNil(s) || isEmptyString(s)
const isNilArray = a => isNil(a) || isEmptyArray(a)
const isNilMap = m => isNil(m) || isEmptyMap(m)

const isFalsy = o => !o
const isTruthy = o => !!o

const isFalse = b => b === false
const isTrue = b => b === true

const isObjectInstance = o => isObject(o) && o.constructor === Object
const objectHasProperties = o => {
    if (o == null) return false
    if (o.constructor !== Object) return false
    for (const i in o) return true
    return false
}

const serialize = o => JSON.stringify(o)
const unserialize = s => JSON.parse(s)

const trimSpaces = s => s && s.replace(/\s+/g, ' ').trim()
const toSnakeCase = s => s && trimSpaces(s).match(REGEX_SNAKE_CASE).map(x => x.toLowerCase()).join('_')
const toKebabCase = s => s && trimSpaces(s).match(REGEX_SNAKE_CASE).map(x => x.toLowerCase()).join('-')
const toCamelCase = s => s && toSnakeCase(s).toLowerCase()
    .replace(REGEX_CAMEL_CASE, (m, chr) => chr.toUpperCase())
const toPascalCase = s => s && trimSpaces(s).toLowerCase()
    .replace(REGEX_PASCAL_CASE, m => `${m.charAt(0).toUpperCase()}${m.substring(1).toLowerCase()}`)

const classExtender = (base, c) => class c extends base {
}
const cloner = o => {
    let idx = 1
    const process = v => {
        if (isArray(v)) return cloneArray(v)
        else if (isObject(v)) return cloneObject(v)
        else return v
    }
    const register = (old, o) => {
        old.__idx = idx
        oldObjects[idx] = old
        newObjects[idx] = o
        idx++
    }
    const cloneObject = o => {
        if (!isUndefined(o.__idx)) return newObjects[o.__idx]

        const obj = {}
        for (const prop in o) {
            if (prop === '__idx') continue
            obj[prop] = process(o[prop])
        }
        register(o, obj)

        return obj
    }
    const cloneArray = a => {
        if (!isUndefined(a.__idx)) return newObjects[a.__idx]

        const arr = a.map((v) => process(v))
        register(a, arr)

        return arr
    }
    const oldObjects = {}
    const newObjects = {}

    let tmp
    if (isArray(o)) tmp = cloneArray(o)
    else if (isObject(o)) tmp = cloneObject(o)
    else return o

    for (const id in oldObjects) delete oldObjects[id].__idx

    return tmp
}

const simpleMerge = (...os) => os.reduce((p, o) => ({...p, ...o}), {})
const merger = (...os) => {
    const merged = {}
    const length = os.length
    let [deep] = os

    deep = isBoolean(deep) ? deep : false
    let i = deep ? 1 : 0

    // Loop through each object and conduct a merge
    for (; i < length; i++) mergeObject(merged, os[i], deep)

    return merged
}
const mergeArrays = (base, ...adders) => {
    const merged = cloner(base)

    for (let adder of adders) {
        if (!isArray(adder)) adder = [adder]

        for (let i = 0; i < adder.length; i++) {
            const v = adder[i]
            switch (true) {
                case isDate(v):
                    console.log({v})
                    merged[i] = new Date(v.getTime())
                    break
                case isArray(v):
                    merged[i] = mergeArrays(merged[i] || [], ...v)
                    break
                case isObject(v):
                    merged[i] = merger(true, merged[i] || {}, v)
                    break
                default:
                    merged[i] = v
            }
        }
    }

    return merged
}

// Merge the object into the extended object
const mergeObject = (merged, o, deep) => {
    for (const prop in o) {
        if (!o.hasOwnProperty(prop)) continue
        const v = o[prop]
        if (!deep) {
            merged[prop] = v
            continue
        }

        switch (true) {
            case isDate(v):
                console.log({v})
                merged[prop] = new Date(v.getTime())
                break
            case isArray(v):
                const mp = merged[prop]

                const m = v.reduce((arr, e, i) => {
                    arr[i] = isDate(e) || isArray(e) ? cloner(e) :
                        (isObject(e) ? (isNil(mp) ? cloner(e) : merger(true, e, mp[i])) : e)
                    return arr
                }, [])
                merged[prop] = m
                break
            case isObject(v):
                merged[prop] = merger(true, merged[prop], v)
                break
            default:
                merged[prop] = v
        }
        // If deep merge and property is an object, merge properties
        // merged[prop] = deep && isObject(o[prop]) ? merger(true, merged[prop], o[prop]) : o[prop]
    }
}

const rand = (min, max) => Math.floor(Math.random() * (max - min) + min)
const truncate = (n, p) => Math.trunc(n * Math.pow(10, p)) / Math.pow(10, p)
const round = (n, p) => Math.trunc((n + Number.EPSILON) * Math.pow(10, p)) / Math.pow(10, p)

const addPadding = (n, length = null) => String(n).padStart(length ?? 2, '0')

const fnv32a = (str, asString = true) => {
    let h = 0x811c9dc5
    for (let i = 0; i < str.length; ++i) {
        h ^= str.charCodeAt(i)
        h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)
    }

    h = h >>> 0

    return asString ? (h).toString(16) : h
}

const hash53 = (str, seed = 0, asString = true) => {
    const len = str.length
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed
    for (let i = 0, ch; i < len; i++) {
        ch = str.charCodeAt(i)
        h1 = Math.imul(h1 ^ ch, 2654435761)
        h2 = Math.imul(h2 ^ ch, 1597334677)
    }

    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
    const h = 4294967296 * (2097151 & h2) + (h1 >>> 0)

    return asString ? h.toString(16) : h
}

const hashID = (size = 6) => {
    const MASK = 0x3d
    const LETTERS = 'abcdefghijklmnopqrstuvwxyz'
    const NUMBERS = '1234567890'
    const charset = `${NUMBERS}${LETTERS}${LETTERS.toUpperCase()}_-`.split('')

    const bytes = new Uint8Array(size)
    crypto.getRandomValues(bytes)

    return bytes.reduce((acc, byte) => `${acc}${charset[byte & MASK]}`, '')
}

const utcToKRDateTime = s => {
    if (isNilString(s)) return null

    const date = new Date(s)
    const options = {
        dateStyle: 'medium',
        timeStyle: 'medium',
        hour12: false,
        timeZone: 'Asia/Seoul',
    }

    return utcToFormat(date, options)
}

const utcToKRDate = s => {
    if (isNilString(s)) return null

    const date = new Date(s)

    return utcToFormat(date, {
        dateStyle: 'medium',
    })
}

const utcToFormat = (date, options) => {
    const formatter = new Intl.DateTimeFormat('ko-KR', options)
    return formatter.format(date)
}

const maxDateTime = (a, b) => {
    if (isNil(a) && isNil(b)) return null
    if (isNil(a)) return b
    if (isNil(b)) return a

    return a > b ? a : b
}

const fetcherGET = async url => {
    const options = {
        method: 'GET',
        credentials: 'include',
    }

    const response = await fetch(url, options)
    return await response.json()
}

const downloadURL = (url, filename) => {
    const $link = document.createElement('a')
    if ($link.download === undefined) return

    $link.href = url
    $link.download = filename
    $link.style.visibility = 'hidden'
    $link.click()
}

// Check if item exists in local storage
const existsInLocalStorage = k => {
    return localStorage.getItem(k) !== null
}

const notExistsInLocalStorage = k => {
    return localStorage.getItem(k) === null
}

// Save data to local storage
const toLocalStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data))
}

// Retrieve data from local storage
const fromLocalStorage = k => {
    const data = localStorage.getItem(k)
    return JSON.parse(data)
}

// Delete data from local storage
const removeFromLocalStorage = k => {
    localStorage.removeItem(k)
}

// Clear all data from local storage
const clearLocalStorage = () => {
    localStorage.clear()
}

const encodeId = (id, b = 'station') => `${b}-${id}`

const decodeId = k => {
    const regex = /(?<id>\d+)/
    const {groups: {id}} = regex.exec(k) ?? {}

    return id ? parseInt(id) : null
}

const mergeArraysNoDuplicates = (a, b) => {
    return [...new Set([...(a ?? []), ...b ?? []])]
}

function printObject(o) {
    console.log('')
    console.log(`${o.constructor.name} {`)
    for (const key in o) console.log(`  ${key}: ${o[key]}`)
    console.log('}')
}

function serializeDate() {
    const now = new Date()
    return `${now.getFullYear()}${addPadding(now.getMonth() + 1)}${addPadding(now.getDate())}${addPadding(now.getHours())}${addPadding(
        now.getMinutes())}`
}

function distanceFormatter(d, precision = 2) {
    const rx = /\.0+$|(\.\d*[1-9])0+$/
    const lookup = [
        {value: 1, symbol: ''},
        {value: 1e3, symbol: 'k'},
        {value: 1e6, symbol: 'M'},
        {value: 1e9, symbol: 'G'},
        {value: 1e12, symbol: 'T'},
        {value: 1e15, symbol: 'P'},
        {value: 1e18, symbol: 'E'},
    ]
    const item = lookup.slice().reverse().find(item => d >= item.value) ?? {value: 1, symbol: ''}
    const val = (d / item.value).toFixed(precision).replace(rx, '$1')

    return `${val} ${item.symbol}m`
}

function wait(ms, fn) {
    const start = performance.now()
    let end = start
    while (end < start + ms) end = performance.now()
    if (fn instanceof Function) fn()
}

const countHyphens = s => (s.match(/-/g) || []).length

const krDateAsTimestamp = s => {
    if (isEmptyString(s)) return null

    const raw = s.trim().replace(/\.$/, '').replace(/\s+/g, ' ')

    const parts = raw.split('.').map(part => part.trim())
    if (parts.length === 3) {
        const [year, month, day] = parts
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    throw new Error('Invalid date format')
}

const krDateAsISO = s => {
    if (isEmptyString(s)) return null

    const [year, month, day] = s.trim()
        .replace(/\.$/, '')
        .split('.')
        .map(part => part.trim().padStart(2, '0'))

    if (year?.length === 4 && month?.length > 0 && day?.length > 0) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }

    throw new Error('Invalid date format')
}

const format24Hours = s => {
    if (isEmptyString(s)) return null

    let hours, minutes

    if (/^\d{1,2}$/.test(s)) {
        hours = s
        minutes = '00'
    } else if (/^\d{1,2}:\d{2}$/.test(s)) {
        [hours, minutes] = s.split(':')
    } else if (/^\d{3,4}$/.test(s)) {
        const end = s.length === 4 ? 2 : 1
        hours = s.slice(0, end)
        minutes = s.slice(end)
    } else {
        throw new Error('Invalid input format')
    }

    // Pad the hours with a leading zero if necessary
    hours = hours.padStart(2, '0')

    return `${hours}${minutes}`
}

const formatCRN = crn => {
    if (!crn) return null
    if (typeof crn === 'string' && crn.length !== 10) return crn

    return crn.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3')
}

const formatSSN = ssn => {
    if (!ssn) return null
    if (typeof ssn === 'string' && ssn.length !== 13) return ssn

    return ssn.replace(/(\d{6})(\d{7})/, '$1-$2')
}

const formatPhone = phone => {
    if (isEmptyString(phone)) return null

    if (phone.length === 10) return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
    if (phone.length === 11) return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')

    return phone
}

const unformatNumber = phone => {
    if (isEmptyString(phone)) return null

    return phone.replace(/-/g, '')
}

const haveEqualStringValues = (a, b) => {
    if (isNil(a) && isNil(b)) return false
    if (isNil(a) || isNil(b)) return false

    a = `${a}`.toLowerCase()
    b = `${b}`.toLowerCase()

    return a === b
}

/**
 * @typedef {Object} PageInfoParams
 * @property {string} [key] - The string key of the object.
 * @property {any} [value] - The value of the object, which can be a number, string, boolean, or any other type.
 *
 * Retrieve the parameters from the page info object
 *
 * @return {PageInfoParams}
 */
const pageParams = () => {
    return pageInfo.params ?? {}
}

/**
 * @param {string} url - URL to add parameters to
 * @param {Object<string, string>} params - Parameters to add to the URL
 */
const addUrlParameter = (url, params) => {
    const urlObj = new URL(url)
    const searchParams = new URLSearchParams(urlObj.search)

    for (const [k, v] of Object.entries(params)) {
        searchParams.append(k, v)
    }
    urlObj.search = searchParams.toString()

    return urlObj.toString()
}

const redirectToWithDelay = (url, delay = 300) => {
    setTimeout(() => {window.location.href = url}, delay)
}

const reloadPageWithDelay = (delay = 200) => {
    setTimeout(() => {window.location.reload()}, delay)
}

const redirectToLogin = () => {
    window.location.href = `${ROOT_PATH}/login`
}

const redirectToProfile = () => {
    window.location.href = `${ROOT_PATH}/user/profile`
}

const redirectToOrderList = stationId => {
    window.location.href = `${ROOT_PATH}/order/list/${stationId}`
}

const redirectTo = url => {
    window.location.href = url
}

const reloadPage = () => {
    window.location.reload()
}

const openInNewTab = (url) => {
    window.open(url, '_blank')
}
