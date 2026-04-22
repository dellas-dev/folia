function solveLinear(A, b) {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]])

  for (let col = 0; col < n; col++) {
    let maxRow = col
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row
    }
    ;[M[col], M[maxRow]] = [M[maxRow], M[col]]

    for (let row = col + 1; row < n; row++) {
      if (M[col][col] === 0) continue
      const f = M[row][col] / M[col][col]
      for (let k = col; k <= n; k++) M[row][k] -= f * M[col][k]
    }
  }

  const x = new Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    let sum = M[i][n]
    for (let j = i + 1; j < n; j++) sum -= M[i][j] * x[j]
    x[i] = sum / M[i][i]
  }
  return x
}

export function computeHomography(src, dst) {
  const A = []
  const b = []

  for (let i = 0; i < 4; i++) {
    const { x: sx, y: sy } = src[i]
    const { x: dx, y: dy } = dst[i]

    A.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy])
    b.push(dx)

    A.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy])
    b.push(dy)
  }

  const h = solveLinear(A, b)
  h.push(1)

  return [
    [h[0], h[1], h[2]],
    [h[3], h[4], h[5]],
    [h[6], h[7], h[8]],
  ]
}

export function invertMatrix3x3(M) {
  const [[a, b, c], [d, e, f], [g, h, k]] = M
  const det = a * (e * k - f * h) - b * (d * k - f * g) + c * (d * h - e * g)
  if (Math.abs(det) < 1e-10) throw new Error('Homography is singular — corners may be degenerate')
  const inv = 1 / det
  return [
    [(e * k - f * h) * inv, (c * h - b * k) * inv, (b * f - c * e) * inv],
    [(f * g - d * k) * inv, (a * k - c * g) * inv, (c * d - a * f) * inv],
    [(d * h - e * g) * inv, (b * g - a * h) * inv, (a * e - b * d) * inv],
  ]
}

export function applyH(H, p) {
  const rx = H[0][0] * p.x + H[0][1] * p.y + H[0][2]
  const ry = H[1][0] * p.x + H[1][1] * p.y + H[1][2]
  const rw = H[2][0] * p.x + H[2][1] * p.y + H[2][2]
  return { x: rx / rw, y: ry / rw }
}

function cross2d(a, b, p) {
  return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)
}

export function isInsideQuad(p, quad) {
  const [a, b, c, d] = quad
  return (
    cross2d(a, b, p) >= 0 &&
    cross2d(b, c, p) >= 0 &&
    cross2d(c, d, p) >= 0 &&
    cross2d(d, a, p) >= 0
  )
}
