import chai from 'chai'
import { QueryOpts } from './../../lib/learning-mode.db.model'
import { Logger, PinoLogger } from './../../lib/logging'
import { config } from './../../lib/config'

const expect = chai.expect

// could split this up so that not all test run synchronously
const test = async () => {
  try {
    config
      .registerProperty('logging.level.startup', 'debug')
      .registerType(Logger, PinoLogger)

    const queryOpts = QueryOpts.fromQueryParams({
      sort: '-col1,col2,col3,-col4',
      limit: '10',
      skip: '5',
      something: 'else'
    })
    expect(queryOpts.sortQuery).to.deep.equal({
      col1: -1,
      col2: 1,
      col3: 1,
      col4: -1
    })
    expect(queryOpts.limit).to.equal(10)
    expect(queryOpts.skip).to.equal(5)

    const noLimit = QueryOpts.fromQueryParams({
      sort: '-col1,col2,col3,-col4',
      skip: '5',
      something: 'else'
    })
    expect(noLimit.limit).to.equal(undefined)

    const noSkip = QueryOpts.fromQueryParams({
      sort: '-col1,col2,col3,-col4',
      something: 'else'
    })
    expect(noSkip.skip).to.equal(0)

    const noSort = QueryOpts.fromQueryParams({
      something: 'else'
    })
    expect(noSort.sortQuery).to.equal(undefined)

    const emptySort = QueryOpts.fromQueryParams({
      sort: '',
      something: 'else'
    })
    expect(emptySort.sortQuery).to.equal(undefined)

    const oneColumnSort = QueryOpts.fromQueryParams({
      sort: 'a',
      something: 'else'
    })
    expect(oneColumnSort.sortQuery).to.deep.equal({
      a: 1
    })

    const descendingSort = QueryOpts.fromQueryParams({
      sort: '-a',
      something: 'else'
    })
    expect(descendingSort.sortQuery).to.deep.equal({
      a: -1
    })

    const incorrectSortBecauseMissingColumnName = QueryOpts.fromQueryParams({
      sort: '-',
      something: 'else'
    })
    expect(incorrectSortBecauseMissingColumnName.sortQuery).to.deep.equal({})

    const skippingWrongCommas = QueryOpts.fromQueryParams({
      sort: ',a,,-b,',
      something: 'else'
    })
    expect(skippingWrongCommas.sortQuery).to.deep.equal({
      a: 1,
      b: -1
    })
  } finally {
    config.reset()
  }
}

export {
  test
}
