import { identity } from 'fp-ts/lib/function'
import * as Id from 'fp-ts/lib/Identity'
import * as O from 'fp-ts/lib/Option'
import { pipe } from 'fp-ts/lib/pipeable'
import * as A from 'fp-ts/lib/ReadonlyArray'
import { ReadonlyNonEmptyArray } from 'fp-ts/lib/ReadonlyNonEmptyArray'
import { ReadonlyRecord } from 'fp-ts/lib/ReadonlyRecord'
import * as _ from '../src/Lens'
import * as Op from '../src/Optional'
import * as T from '../src/Traversal'
import * as U from './util'

describe('Lens', () => {
  describe('pipeables', () => {
    it('imap', () => {
      interface S {
        readonly a: number
      }
      const sa: _.Lens<S, number> = pipe(
        _.id<S>(),
        _.imap(
          (s) => s.a,
          (a) => ({ a })
        )
      )
      U.deepStrictEqual(sa.get({ a: 1 }), 1)
      U.deepStrictEqual(sa.set(2)({ a: 1 }), { a: 2 })
    })
  })

  it('compose', () => {
    interface S {
      readonly a: A
    }
    interface A {
      readonly b: number
    }
    const sa = pipe(_.id<S>(), _.prop('a'))
    const ab = pipe(_.id<A>(), _.prop('b'))
    const sb = _.Category.compose(ab, sa)
    U.deepStrictEqual(sb.get({ a: { b: 1 } }), 1)
    U.deepStrictEqual(sb.set(2)({ a: { b: 1 } }), { a: { b: 2 } })
  })

  it('composeTraversal', () => {
    interface S {
      readonly a: ReadonlyArray<number>
    }
    const sa = pipe(_.id<S>(), _.prop('a'))
    const ab = T.fromTraversable(A.readonlyArray)<number>()
    const sb = pipe(sa, _.composeTraversal(ab))
    U.deepStrictEqual(sb.modifyF(Id.identity)((n) => n * 2)({ a: [1, 2, 3] }), { a: [2, 4, 6] })
  })

  it('id', () => {
    interface S {
      readonly a: number
    }
    const ss = _.id<S>()
    const s: S = { a: 1 }
    U.deepStrictEqual(ss.get(s), s)
    U.deepStrictEqual(ss.set(s)(s), s)
  })

  it('fromNullable', () => {
    interface S {
      readonly a?: number
    }
    const sa = pipe(_.id<S>(), _.prop('a'), _.fromNullable)
    const s: S = { a: 1 }
    U.deepStrictEqual(sa.getOption(s), O.some(1))
    U.deepStrictEqual(sa.getOption({}), O.none)
    // same reference check
    U.strictEqual(sa.set(1)(s), s)
  })

  it('modifyF', () => {
    // same reference check
    interface S {
      readonly a: number
    }
    const input = { a: 1 }
    const sa: _.Lens<S, number> = _.lens(
      (s) => s.a,
      (a) => (s) => ({ ...s, a })
    )
    U.strictEqual(pipe(sa, _.modifyF(Id.identity)(identity))(input), input)
  })

  it('modify', () => {
    interface S {
      readonly a: number
    }
    const f = pipe(
      pipe(_.id<S>(), _.prop('a')),
      _.modify((a) => a * 2)
    )
    U.deepStrictEqual(f({ a: 1 }), { a: 2 })
    // same reference check
    const input = { a: 1 }
    const sa: _.Lens<S, number> = _.lens(
      (s) => s.a,
      (a) => (s) => ({ ...s, a })
    )
    U.strictEqual(pipe(sa, _.modify(identity))(input), input)
  })

  it('prop', () => {
    interface S {
      readonly a: {
        readonly b: number
      }
    }
    const sa = pipe(_.id<S>(), _.prop('a'), _.prop('b'))
    const s: S = { a: { b: 1 } }
    U.strictEqual(sa.get(s), 1)
    U.deepStrictEqual(sa.set(2)(s), { a: { b: 2 } })
    // same reference check
    U.strictEqual(sa.set(1)(s), s)
  })

  it('pick', () => {
    interface S {
      readonly a: string
      readonly b: number
      readonly c: boolean
    }
    const sa = pipe(_.id<S>(), _.pick('a', 'b'))
    const s: S = { a: 'a', b: 1, c: true }
    U.deepStrictEqual(sa.get(s), { a: 'a', b: 1 })
    U.deepStrictEqual(sa.set({ a: 'a', b: 2 })(s), { a: 'a', b: 2, c: true })
    // same reference check
    U.strictEqual(sa.set({ a: 'a', b: 1 })(s), s)
  })

  it('omit', () => {
    interface S {
      readonly a: string
      readonly b: number
      readonly c: boolean
    }
    const sa = pipe(_.id<S>(), _.omit('c'))
    const s: S = { a: 'a', b: 1, c: true }
    U.deepStrictEqual(sa.get(s), { a: 'a', b: 1 })
    U.deepStrictEqual(sa.set({ a: 'a', b: 2 })(s), { a: 'a', b: 2, c: true })
    // same reference check
    U.strictEqual(sa.set({ a: 'a', b: 1 })(s), s)
  })

  it('component', () => {
    interface S {
      readonly a: readonly [string, number]
    }
    const sa = pipe(_.id<S>(), _.prop('a'), _.component(1))
    const s: S = { a: ['a', 1] }
    U.strictEqual(sa.get(s), 1)
    U.deepStrictEqual(sa.set(2)(s), { a: ['a', 2] })
    // same reference check
    U.strictEqual(sa.set(1)(s), s)
  })

  it('index', () => {
    interface S {
      readonly a: ReadonlyArray<number>
    }
    const optional = pipe(_.id<S>(), _.prop('a'), _.index(0))
    U.deepStrictEqual(optional.getOption({ a: [] }), O.none)
    U.deepStrictEqual(optional.getOption({ a: [1] }), O.some(1))
    U.deepStrictEqual(optional.set(2)({ a: [] }), { a: [] })
    U.deepStrictEqual(optional.set(2)({ a: [1] }), { a: [2] })
    // same reference check
    const empty: S = { a: [] }
    const full: S = { a: [1] }
    U.strictEqual(optional.set(1)(empty), empty)
    U.strictEqual(optional.set(1)(full), full)
  })

  it('indexNonEmpty', () => {
    interface S {
      readonly a: ReadonlyNonEmptyArray<number>
    }
    const optional = pipe(_.id<S>(), _.prop('a'), _.indexNonEmpty(1))
    U.deepStrictEqual(optional.getOption({ a: [1] }), O.none)
    U.deepStrictEqual(optional.getOption({ a: [1, 2] }), O.some(2))
    U.deepStrictEqual(optional.set(3)({ a: [1] }), { a: [1] })
    U.deepStrictEqual(optional.set(3)({ a: [1, 2] }), { a: [1, 3] })
    // same reference check
    const full: S = { a: [1, 2] }
    U.strictEqual(optional.set(2)(full), full)
  })

  it('key', () => {
    interface S {
      readonly a: ReadonlyRecord<string, number>
    }
    const sa = pipe(_.id<S>(), _.prop('a'), _.key('k'))
    const empty: S = { a: {} }
    const full: S = { a: { k: 1, j: 2 } }
    U.deepStrictEqual(sa.getOption(empty), O.none)
    U.deepStrictEqual(sa.getOption(full), O.some(1))
    U.deepStrictEqual(sa.set(2)(full), { a: { k: 2, j: 2 } })
    // same reference check
    U.strictEqual(sa.set(2)(empty), empty)
    U.strictEqual(sa.set(1)(full), full)
  })

  it('traverse', () => {
    type S = ReadonlyArray<string>
    const sa = pipe(_.id<S>(), _.traverse(A.readonlyArray))
    const modify = pipe(
      sa,
      T.modify((s) => s.toUpperCase())
    )
    U.deepStrictEqual(modify(['a']), ['A'])
  })

  it('compose', () => {
    interface S {
      readonly a: A
    }
    interface A {
      readonly b: number
    }
    const sa = pipe(_.id<S>(), _.prop('a'))
    const ab = pipe(_.id<A>(), _.prop('b'))
    const sb = pipe(sa, _.compose(ab))
    U.deepStrictEqual(sb.get({ a: { b: 1 } }), 1)
    U.deepStrictEqual(sb.set(2)({ a: { b: 1 } }), { a: { b: 2 } })
  })

  it('composeOptional', () => {
    interface S {
      readonly a: string
    }
    const sa = pipe(_.id<S>(), _.prop('a'))
    const ab: Op.Optional<string, string> = Op.optional(
      (s) => (s.length > 0 ? O.some(s[0]) : O.none),
      (a) => (s) => (s.length > 0 ? a + s.substring(1) : s)
    )
    const sb = pipe(sa, _.composeOptional(ab))
    U.deepStrictEqual(sb.getOption({ a: '' }), O.none)
    U.deepStrictEqual(sb.getOption({ a: 'ab' }), O.some('a'))
    U.deepStrictEqual(sb.set('c')({ a: '' }), { a: '' })
    U.deepStrictEqual(sb.set('c')({ a: 'ab' }), { a: 'cb' })
  })

  it('atKey', () => {
    type S = ReadonlyRecord<string, number>
    const sa = pipe(_.id<S>(), _.atKey('a'))
    U.deepStrictEqual(sa.get({ a: 1 }), O.some(1))
    U.deepStrictEqual(sa.set(O.some(2))({ a: 1, b: 2 }), { a: 2, b: 2 })
    U.deepStrictEqual(sa.set(O.some(1))({ b: 2 }), { a: 1, b: 2 })
    U.deepStrictEqual(sa.set(O.none)({ a: 1, b: 2 }), { b: 2 })
  })

  it('filter', () => {
    interface S {
      readonly a: number
    }
    const sa = pipe(
      _.id<S>(),
      _.prop('a'),
      _.filter((n) => n > 0)
    )
    U.deepStrictEqual(sa.getOption({ a: 1 }), O.some(1))
    U.deepStrictEqual(sa.getOption({ a: -1 }), O.none)
    U.deepStrictEqual(sa.set(2)({ a: 1 }), { a: 2 })
    U.deepStrictEqual(sa.set(2)({ a: -1 }), { a: -1 })
  })

  it('findFirst', () => {
    type S = ReadonlyArray<number>
    const optional = pipe(
      _.id<S>(),
      _.findFirst((n) => n > 0)
    )
    U.deepStrictEqual(optional.getOption([]), O.none)
    U.deepStrictEqual(optional.getOption([-1, -2, -3]), O.none)
    U.deepStrictEqual(optional.getOption([-1, 2, -3]), O.some(2))
    U.deepStrictEqual(optional.set(3)([]), [])
    U.deepStrictEqual(optional.set(3)([-1, -2, -3]), [-1, -2, -3])
    U.deepStrictEqual(optional.set(3)([-1, 2, -3]), [-1, 3, -3])
    U.deepStrictEqual(optional.set(4)([-1, -2, 3]), [-1, -2, 4])
  })

  it('findFirstNonEmpty', () => {
    type S = ReadonlyNonEmptyArray<number>
    const optional = pipe(
      _.id<S>(),
      _.findFirstNonEmpty((n) => n > 0)
    )
    U.deepStrictEqual(optional.getOption([-1, -2, -3]), O.none)
    U.deepStrictEqual(optional.getOption([-1, 2, -3]), O.some(2))
    U.deepStrictEqual(optional.set(3)([-1, -2, -3]), [-1, -2, -3])
    U.deepStrictEqual(optional.set(3)([-1, 2, -3]), [-1, 3, -3])
    U.deepStrictEqual(optional.set(4)([-1, -2, 3]), [-1, -2, 4])
  })

  it('modifyF', () => {
    interface S {
      readonly a: number
    }
    const sa: _.Lens<S, number> = pipe(_.id<S>(), _.prop('a'))
    const f = pipe(
      sa,
      _.modifyF(O.option)((n) => (n > 0 ? O.some(n * 2) : O.none))
    )
    U.deepStrictEqual(f({ a: 1 }), O.some({ a: 2 }))
    U.deepStrictEqual(f({ a: -1 }), O.none)
  })

  it('rename', () => {
    interface S {
      readonly a: string
      readonly b: number
      readonly c: boolean
    }
    const sa = pipe(_.id<S>(), _.pick('a', 'b'), _.rename('a', 'd'))
    U.deepStrictEqual(sa.get({ a: 'a', b: 1, c: true }), { d: 'a', b: 1 })
    U.deepStrictEqual(sa.set({ d: 'b', b: 2 })({ a: 'a', b: 1, c: true }), { a: 'b', b: 2, c: true })
  })
})
