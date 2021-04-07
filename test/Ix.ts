import { eqString } from 'fp-ts/lib/Eq'
import * as O from 'fp-ts/lib/Option'
import * as _ from '../src/Ix'
import * as U from './util'

describe('Ix', () => {
  it('indexReadonlyMap', () => {
    const index = _.indexReadonlyMap(eqString)<number>().index('a')
    U.deepStrictEqual(index.getOption(new Map([])), O.none)
    U.deepStrictEqual(
      index.getOption(
        new Map([
          ['a', 1],
          ['b', 2]
        ])
      ),
      O.some(1)
    )
    U.deepStrictEqual(index.set(3)(new Map([['b', 2]])), new Map([['b', 2]]))
    U.deepStrictEqual(
      index.set(3)(
        new Map([
          ['a', 1],
          ['b', 2]
        ])
      ),
      new Map([
        ['a', 3],
        ['b', 2]
      ])
    )
    // same reference check
    const x = new Map([
      ['a', 1],
      ['b', 2]
    ])
    U.strictEqual(index.set(1)(x), x)
  })
})
