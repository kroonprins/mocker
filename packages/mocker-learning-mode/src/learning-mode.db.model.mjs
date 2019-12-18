
class QueryOpts {
  constructor (sortQuery = undefined, skip = 0, limit = undefined) {
    this.sortQuery = sortQuery
    this.skip = skip
    this.limit = limit
  }

  // TODO add debug logging?
  static fromQueryParams (query) {
    if (!query) {
      return undefined
    }

    let sortQuery
    if (query.sort && typeof query.sort === 'string') {
      sortQuery = {}
      for (const prop of query.sort.split(',')) {
        if (!prop) {
          continue
        }
        if (prop.startsWith('-')) {
          if (prop.length === 1) {
            continue
          }
          sortQuery[prop.substr(1)] = -1
        } else {
          sortQuery[prop] = 1
        }
      }
    }

    let skip = Number(query.skip)
    if (isNaN(skip)) {
      skip = 0
    }
    let limit = Number(query.limit)
    if (isNaN(limit)) {
      limit = undefined
    }

    return new QueryOpts(sortQuery, skip, limit)
  }

  toString () {
    const sortQuery = JSON.stringify(this.sortQuery)
    return `QueryOpts[sortQuery=[${sortQuery}], skip=[${this.skip}], limit=[${this.limit}]`
  }
}

export {
  QueryOpts
}
