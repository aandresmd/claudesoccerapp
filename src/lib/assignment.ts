/**
 * Hungarian (Kuhn–Munkres) algorithm, minimization form.
 *
 * Takes a cost matrix with rows <= cols and returns, for each row, the column
 * it is matched to. Every row gets a distinct column and the total cost is
 * the minimum possible.
 */
function hungarianMin(cost: number[][]): number[] {
  const n = cost.length
  const m = cost[0]?.length ?? 0
  if (n === 0) return []
  if (n > m) throw new Error('hungarianMin requires rows <= cols')

  const INF = Number.MAX_SAFE_INTEGER / 4
  const u = new Array<number>(n + 1).fill(0)
  const v = new Array<number>(m + 1).fill(0)
  const matchedRow = new Array<number>(m + 1).fill(0) // row matched to each column
  const way = new Array<number>(m + 1).fill(0)

  for (let i = 1; i <= n; i++) {
    matchedRow[0] = i
    let j0 = 0
    const minv = new Array<number>(m + 1).fill(INF)
    const used = new Array<boolean>(m + 1).fill(false)
    do {
      used[j0] = true
      const i0 = matchedRow[j0]
      let delta = INF
      let j1 = 0
      for (let j = 1; j <= m; j++) {
        if (used[j]) continue
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j]
        if (cur < minv[j]) {
          minv[j] = cur
          way[j] = j0
        }
        if (minv[j] < delta) {
          delta = minv[j]
          j1 = j
        }
      }
      for (let j = 0; j <= m; j++) {
        if (used[j]) {
          u[matchedRow[j]] += delta
          v[j] -= delta
        } else {
          minv[j] -= delta
        }
      }
      j0 = j1
    } while (matchedRow[j0] !== 0)
    do {
      const j1 = way[j0]
      matchedRow[j0] = matchedRow[j1]
      j0 = j1
    } while (j0)
  }

  const result = new Array<number>(n).fill(-1)
  for (let j = 1; j <= m; j++) {
    if (matchedRow[j] > 0) result[matchedRow[j] - 1] = j - 1
  }
  return result
}

/**
 * Maximize total score assigning rows to columns (each at most once).
 * Returns the matched column for each row, or -1 when there are more rows
 * than columns and a row goes unmatched.
 */
export function bestAssignment(scores: number[][]): number[] {
  const rows = scores.length
  const cols = scores[0]?.length ?? 0
  if (rows === 0 || cols === 0) return new Array<number>(rows).fill(-1)

  let max = 0
  for (const row of scores) for (const s of row) max = Math.max(max, s)
  const toCost = (s: number) => max - s

  if (rows <= cols) {
    return hungarianMin(scores.map((row) => row.map(toCost)))
  }

  // More rows than columns: solve the transpose, then invert the matching.
  const t: number[][] = []
  for (let c = 0; c < cols; c++) t.push(scores.map((row) => toCost(row[c])))
  const colToRow = hungarianMin(t)
  const result = new Array<number>(rows).fill(-1)
  colToRow.forEach((row, col) => {
    if (row >= 0) result[row] = col
  })
  return result
}
