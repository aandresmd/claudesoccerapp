import { describe, expect, it } from 'vitest'
import { stableStringify } from './stableJson'

describe('stableStringify', () => {
  it('serializes key-reordered objects identically (Firestore echo case)', () => {
    const local = { name: 'Sally', jersey: '15', available: true, ratings: { speed: 3, passing: 4 } }
    const fromFirestore = { available: true, jersey: '15', name: 'Sally', ratings: { passing: 4, speed: 3 } }
    expect(stableStringify(local)).toBe(stableStringify(fromFirestore))
  })

  it('still distinguishes genuinely different content', () => {
    expect(stableStringify({ a: 1 })).not.toBe(stableStringify({ a: 2 }))
  })

  it('sorts keys inside arrays of objects and survives a parse round-trip', () => {
    const value = { list: [{ b: 1, a: [{ z: 0, y: 1 }] }] }
    const json = stableStringify(value)
    expect(json).toBe('{"list":[{"a":[{"y":1,"z":0}],"b":1}]}')
    expect(JSON.parse(json)).toEqual(value)
  })
})
