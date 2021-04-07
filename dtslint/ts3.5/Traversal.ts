import * as _ from '../../src/Traversal'
import { pipe } from 'fp-ts/lib/pipeable'

interface S {
  readonly a: string
  readonly b: number
  readonly c: boolean
}

//
// pick
//

// $ExpectError
pipe(_.id<S>(), _.pick())
// $ExpectError
pipe(_.id<S>(), _.pick('a'))

pipe(_.id<S>(), _.pick('a', 'b')) // $ExpectType Traversal<S, { readonly a: string; readonly b: number; }>

//
// component
//

// $ExpectError
pipe(_.id<{ 1: number }>(), _.component(1))

// $ExpectType readonly [string, number, boolean]
pipe(
  _.id<readonly [string, number, boolean]>(),
  _.component(1),
  _.modify((n) => n * 2)
)(['a', 1, true])
