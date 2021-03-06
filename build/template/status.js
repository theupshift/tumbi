const Runic = require('../lib/runic')
const LogSet = require('../lib/set')
const Template = require('./template')
const Aequirys = require('aequirys')

module.exports = function ({term, root, type, line}, logs) {
  Template.call(this, {term, root, type, line})
  this.path = `./wiki/${this.file}.html`
  const set = new LogSet(logs.raw)

  const _p = n => `0${n}`.substr(-2)
  const _mark = x => x ? '&#120823;' : '&#120822;'
  const _calcCI = (...p) => p.reduce((i, v) => i += (v ? 1 : 0), 0)
  const _calcIndex = (CI, maxPoints) => CI === 0 ? 0 : CI / maxPoints

  const _dd = d => {
    const a = new Aequirys(d)
    const y = a.year.toString().slice(-2)
    const m = a.month
    const x = (+a.date).toString(15).toUpperCase()
    return `${x}${m}${y}`
  }

  const _hv = d => `${_p(d.getDate())}${_p(d.getMonth() + 1)}${d.getFullYear().toString().slice(-2)}`

  function organiseByType (db = database) {
    const types = {}
    for (let key in db) {
      const {type, name} = db[key]
      types[type] === undefined && (types[type] = [])
      types[type][types[type].length] = db[key]
    }
    return types
  }

  function _countTypes (tables = database) {
    const counts = {portal: 0, note: 0, page: 0}
    for (let key in tables) counts[tables[key].type]++
    return counts
  }

  function _lastUpdated () {
    const d = new Date()
    return `<p>▲ <span title="${_hv(d)}">${_dd(d)}</span>`
  }

  function _portalTable (portals) {
    let html = '', todo = 0

    const sorted = Object.keys(portals).sort((a, b) =>
      portals[a].term > portals[b].term ? 1 : -1
    )

    for (let i = 0, l = sorted.length; i < l; i++) {
      const {term, line} = portals[sorted[i]]
      const long = new Runic(line).html()
      const x = long.length > 0
      const y = long.indexOf('<img') > -1
      const CI = _calcCI(x, y)
      const indx = _calcIndex(CI, 2)

      if (indx > 0.5) continue
      todo++

      html += `${_mark(x)}${_mark(y)} <a href="./${term.toUrl()}.html">${term.toCap()}</a><br>`
    }

    const total = _countTypes().portal
    const fini = (total - todo) / total * 100

    return [
      '<p class="x">',
      `${total} Σ<br>`,
      `${todo} unfini<br>`,
      `${fini.toFixed(0)}% fini`,
      '<p>Info, media, links',
      `<p class="y">${html}`
    ].join('')
  }

  function _pageTable (pages) {
    let html = '', todo = 0

    const sorted = Object.keys(pages).sort((a, b) =>
      pages[a].term > pages[b].term ? 1 : -1
    )

    for (let i = 0, l = sorted.length; i < l; i++) {
      const {term, line} = pages[sorted[i]]
      const long = new Runic(line).html()
      const x = long.length > 0
      const y = long.indexOf('<img') > -1
      const z = long.indexOf('<a') > -1
      const CI = _calcCI(x, y, z)
      const indx = _calcIndex(CI, 3)

      if (indx > 0.7) continue
      todo++

      html += `${_mark(x)}${_mark(y)}${_mark(z)} <a href="./${term.toUrl()}.html">${term.toCap()}</a><br>`
    }

    const total = _countTypes().page
    const fini = (total - todo) / total * 100

    return [
      '<p class="x">',
      `${total} Σ<br>`,
      `${todo} unfini<br>`,
      `${fini.toFixed(0)}% fini`,
      `<p class="y">${html}`
    ].join('')
  }

  function _makeTables ({portal, page}) {
    return _portalTable(portal) + _pageTable(page)
  }

  function _undoc (s = set, tables = database) {
    const keys = Object.keys(tables)
    const pro = s.listProjects()
    const undoc = []

    for (let i = 0, l = pro.length; i < l; i++)
      if (keys.indexOf(pro[i].toUpperCase()) < 0)
        undoc[undoc.length] = pro[i]

    const total = pro.length
    const undocTotal = undoc.length
    const perc = (total - undocTotal) / total * 100

    return [
      `<p class="x">${total} projects<br>`,
      `${undocTotal} missing<br>`,
      `${perc.toFixed(0)}% fini`
    ].join('')
  }

  this.render = _ => {
    return [
      this.head(), this.header(),
      `<main>${this.core()}${_lastUpdated()}`,
      `${_undoc()}${_makeTables(organiseByType())}</main>`,
      this.footer()
    ].join('')
  }
}
