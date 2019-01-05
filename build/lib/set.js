/*
 * Calculate average
 * @param {Array=} v - Values
 * @return {number} Average
 */
function avg (v = []) {
  const l = v.length;
  return l === 0 ? 0 : sum(v) / l;
}

/**
 * Calculate maximum value
 * @param {Array=} v - Values
 * @return {number} Maximum
 */
function max (v = []) {
  return v.length === 0 ? 0 : Math.max(...v);
}

/**
 * Calculate minimum value
 * @param {Array=} v - Values
 * @return {number} Minimum
 */
function min (v = []) {
  return v.length === 0 ? 0 : Math.min(...v);
}

/**
 * Add leading zeroes
 * @return {string}
 */
Number.prototype.pad = function () {
  return `0${this}`.substr(-2);
}

/**
 * Calculate range
 * @param {Array=} v - Values
 * @return {number} Range
 */
function range (v = []) {
  return v.length === 0 ? 0 : max(v) - min(v);
}

/**
 * Calculate standard deviation
 * @param {Array=} v - Values
 * @return {number} Standard deviation
 */
function sd (v = []) {
  const l = v.length;
  if (l === 0) return 0;
  const x = avg(v);
  let y = 0;
  for (let i = 0; i < l; i++) y += (v[i] - x) ** 2;
  return Math.sqrt(y / (l - 1));
}

/**
 * Convert decimal to time
 * @param {number} x
 * @return {string} Time
 */
function convertToTime (x) {
  const min = x % 1;
  const tail = +(min * 60).toFixed(0);
  return `${x - min}:${tail.pad()}`;
}

/**
 * Calculate sum
 * @param {Array=} v - Values
 * @return {number} Sum
 */
function sum (v = []) {
  const l = v.length;
  if (l === 0) return 0;
  let x = 0;
  for (let i = 0; i < l; i++) x += v[i];
  return x;
}

/**
 * Calculate trend
 * @param {number} a
 * @param {number} b
 * @return {string} Trend
 */
function trend (a, b) {
  const t = (a - b) / b * 100;
  return `${t < 0 ? '' : '+'}${t.toFixed(2)}%`;
}


/**
 * Add days to date
 * @param {number=} i - Increment
 * @return {Date}
 */
Date.prototype.addDays = function (i = 1) {
  const d = new Date(this.valueOf());
  d.setDate(d.getDate() + i);
  return d;
};

/**
 * Display timestamp
 * @return {string} Timestamp
 */
Date.prototype.stamp = function () {
  const x = `${this.getHours()}${this.getMinutes()}`;
  return x in c_stamp ? c_stamp[x] : c_stamp[x] = this.formatTime();
}

/**
 * Convert to date ID
 * @return {string} YYYYMMDD
 */
Date.prototype.toDate = function () {
  const y = this.getFullYear();
  const m = this.getMonth().pad();
  const d = this.getDate().pad();
  return `${y}${m}${d}`;
}

/**
 * Convert to decimal time
 * @param {Date} d
 * @return {string} Decimal beat
 */
Date.prototype.toDec = function () {
  const d = new Date(this);
  const b = new Date(d).setHours(0, 0, 0);
  const v = (d - b) / 864E5;
  const t = v.toFixed(6).substr(2,6);
  return t.substr(0, 3);
}

/**
 * Convert to hexadecimal
 * @return {string} Hex
 */
Date.prototype.toHex = function () {
  const d = new Date(this);
  d.setMilliseconds(0);
  return (+d / 1E3).toString(16);
}

/**
 * Convert hexadecimal to decimal
 * @param {string} h
 * @return {number} Decimal
 */
function convertHex (h) {
   return parseInt(h, 16);
}

/**
 * Calculate duration
 * @param {Date} s - Start
 * @param {Date} e - End
 * @return {number} Duration (1 = 1h)
 */
function duration (s, e) {
  return e === undefined ? 0 : (+e - +s) / 36E5;
}

/**
 * List dates
 * @param {Date}  s - Start
 * @param {Date=} e - End
 * @return {Array} List
 */
function listDates (s, e = new Date) {
  const l = [];

  let n = new Date(s);
  n.setHours(0, 0, 0, 0);

  for (; n <= e;) {
    l[l.length] = n;
    n = n.addDays(1);
  }

  return l;
}

/**
 * Calculate offset
 * @param {string} h
 * @param {number} d - Duration in seconds
 * @return {string} Offset in hexadecimal
 */
function offset (h, d) {
  return (convertHex(h) + d).toString(16);
}

/**
 * Convert hex time to epoch time
 * @param {string} h
 * @return {number} Epoch time
 */
function toEpoch (h) {
  return h in c_unix ? c_unix[h] : c_unix[h] = new Date(convertHex(h) * 1E3);
}

module.exports = class LogSet {

  /**
   * Construct set
   * @param {Array=} ent
   */
  constructor(ent = []) {
    this.logs = ent;
  }

  get count () { return this.logs.length; }
  get last ()  { return this.logs.slice(-1)[0]; }
  get lh ()    { return this.logHours(); }

  get avgLh() {return avg(this.listDurations());}

  lastUpdated () {
    return this.last.end.ago();
  }

  /**
   * Get logs by date
   * @param {Date=} d
   * @return {Array} Entries
   */
  byDate (d = new Date) {
    const l = this.count;
    if (
      l === 0
      || typeof d !== 'object'
      || +d > +new Date
    ) return [];

    const logs = [];

    function match (a) {
      return a.getFullYear() === d.getFullYear()
        && a.getMonth() === d.getMonth()
        && a.getDate() === d.getDate();
    }

    for (let i = 0; i < l; i++) {
      const {start, end} = this.logs[i];
      if (end !== undefined && match(start)) logs[logs.length] = this.logs[i];
    }

    return logs;
  }

  /**
   * Get logs by day
   * @param {number} d - Day of the week
   * @return {Array} Entries
   */
  byDay (d) {
    if (
      this.count === 0
      || typeof d !== 'number'
      || d < 0 || d > 6
    ) return [];
    return this.logs.filter(({start, end}) =>
      end !== undefined && start.getDay() === d
    );
  }

  /**
   * Get logs by month
   * @param {number} m - Month
   * @return {Array} Entries
   */
  byMonth (m) {
    if (
      this.count === 0
      || typeof m !== 'number'
      || m < 0 || m > 11
    ) return [];
    return this.logs.filter(({start, end}) =>
      end !== undefined && start.getMonth() === m
    );
  }

  /**
   * Get logs by period
   * @param {Date}  start
   * @param {Date=} end
   * @return {Array} Entries
   */
  byPeriod (start, end = new Date) {
    if (
      this.count === 0
      || typeof start !== 'object'
      || typeof end !== 'object'
      || start > end
    ) return [];

    let logs = [];
    for (let now = start; now <= end;) {
      logs = logs.concat(this.byDate(now));
      now = now.addDays(1);
    }

    return logs;
  }

  /**
   * Get logs by project
   * @param {string} term - Project
   * @param {Array=} list - Projects
   * @return {Array} Entries
   */
  byProject (term, list = this.listProjects()) {
    if (
      this.count === 0
      || typeof term !== 'string'
      || !Array.isArray(list)
      || list.indexOf(term) < 0
    ) return [];
    return this.logs.filter(({end, project}) =>
      end !== undefined && project === term
    );
  }

  /**
   * Get logs by sector
   * @param {string} term - Sector
   * @param {Array=} list - Sectors
   * @return {Array} Entries
   */
  bySector (term, list = this.listSectors()) {
    if (
      this.count === 0
      || typeof term !== 'string'
      || !Array.isArray(list)
      || list.indexOf(term) < 0
    ) return [];
    return this.logs.filter(({end, sector}) =>
      end !== undefined && sector === term
    );
  }

  /**
   * Calculate coverage
   * @return {number} Coverage
   */
  coverage () {
    const l = this.count;
    if (l === 0) return 0;

    const {end, start} = this.logs[0];
    const endd = l === 1 ? end : this.last.start;
    const dif = (endd - start) / 864E5;
    let n = dif << 0;
    n = n === dif ? n : n + 1;

    return (25 * this.logHours()) / (6 * n);
  }

  /**
   * Calculate average log hours per day
   * @return {number} Average log hours
   */
  dailyAvg () {
    const se = this.sortEntries();
    const l = se.length;
    return l === 0 ? 0 :
      se.reduce((s, c) => s + new LogSet(c).lh, 0) / l;
  }

  /**
   * Count entries per day
   * @return {Array} Entries per day
   */
  entryCounts () {
    if (this.count === 0) return 0;
    const sorted = this.sortEntries();
    const l = sorted.length;
    const counts = [];
    for (let i = 0; i < l; i++) {
      counts[counts.length] = sorted[i].length;
    }
    return counts;
  }

  /**
   * List durations
   * @return {Array} List
   */
  listDurations () {
    const d = [];
    const l = this.count;
    if (l === 0) return d;

    const n = this.last.end === undefined ? 2 : 1;
    for (let i = l - n; i >= 0; i--) {
      d[d.length] = this.logs[i].dur;
    }
    return d;
  }

  /**
   * List focus
   * @param {number=} mode - Sector (0) or project (1)
   * @return {Array} List
   */
  listFocus (mode = 0) {
    const l = [];
    if (mode < 0 || mode > 1) return l;
    const sort = this.sortEntries();
    const sl = sort.length;
    if (sl === 0) return l;

    const key = `list${mode === 0 ? 'Sectors' : 'Projects'}`;

    for (let i = 0; i < sl; i++) {
      if (sort[i].length === 0) continue;
      l[l.length] = 1 / new LogSet(sort[i])[key]().length;
    }

    return l;
  }

  /**
   * List projects
   * @return {Array} List
   */
  listProjects () {
    const l = this.count;
    if (l === 0) return [];

    const n = this.last.end === undefined ? 2 : 1
    const list = new Set();

    for (let i = l - n; i >= 0; i--) {
      list.add(this.logs[i].project);
    }

    return [...list];
  }

  /**
   * List sectors
   * @return {Array} List
   */
  listSectors () {
    const l = this.count;
    if (l === 0) return [];

    const n = this.last.end === undefined ? 2 : 1;
    const list = new Set();

    for (let i = l - n; i >= 0; i--) {
      list.add(this.logs[i].sector);
    }

    return [...list];
  }

  /**
   * Calculate logged hours
   * @return {number} Logged hours
   */
  logHours () {
    return this.count === 0 ? 0 : sum(this.listDurations());
  }

  /**
   * Calculate project counts
   * @return {Array} Counts
   */
  projectCounts () {
    if (this.count === 0) return [];
    const sorted = this.sortEntries();
    const counts = [];

    for (let i = 0, l = sorted.length; i < l; i++) {
      let set = new Set();
      for (let o = 0; o < sorted[i].length; o++) {
        set.add(sorted[i][o].project);
      }
      counts[counts.length] = [...set].length;
    }

    return counts;
  }

  /**
   * Calculate project focus
   * @return {number} Focus
   */
  projectFocus () {
    const l = this.listProjects().length;
    return l === 0 ? 0 : 1 / l;
  }

  /**
   * Sort entries
   * @param {Date=} end
   * @return {Array} Sorted entries
   */
  sortEntries (end = new Date) {
    const el = this.count;
    if (el === 0) return [];

    const list = listDates(this.logs[0].start, end);
    const dates = {};

    for (let i = 0, l = list.length; i < l; i++) {
      dates[list[i].toDate()] = [];
    }

    for (let i = 0; i < el; i++) {
      const x = this.logs[i].start.toDate();
      x in dates && (dates[x][dates[x].length] = this.logs[i]);
    }

    return Object.keys(dates).map(i => dates[i]);
  }

  /**
   * TODO
   * Sort values
   * @param {number=} mode - Sector (0) | project (1)
   * @return {Array} Sorted values
   */
  sortValues (mode = 0) {
    if (
      this.count === 0
      || typeof mode !== 'number'
      || mode < 0 || mode > 1
    ) return [];

    const lhe = this.lh;
    const sorted = [];
    const tmp = {};
    let list = [];
    let func = '';

    if (mode === 0) {
      list = this.listSectors();
      func = 'bySector';
    } else {
      list = this.listProjects();
      func = 'byProject';
    }

    let hours = [], percs = [];

    for (let i = list.length - 1; i >= 0; i--) {
      const lh = new LogSet(this[func](list[i])).lh;
      tmp[list[i]] = {p: lh / lhe * 100, h: lh};
    }

    const keys = Object.keys(tmp).sort((a, b) => tmp[a].h - tmp[b].h);
    for (let i = keys.length - 1; i >= 0; i--) {
      const {h, p} = tmp[keys[i]];
      sorted[sorted.length] = {h, p, n: keys[i]};
    }

    return sorted;
  }
}