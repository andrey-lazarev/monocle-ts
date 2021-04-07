import { Getter } from '../../src'
import * as U from '../util'

type Point = {
  readonly x: number
  readonly y: number
}

const _x = new Getter<Point, number>((p: Point): number => p.x)

describe('Getter', () => {
  const eg0 = { x: 42, y: -1 }

  it('get', () => {
    U.strictEqual(_x.get(eg0), 42)
  })
})
