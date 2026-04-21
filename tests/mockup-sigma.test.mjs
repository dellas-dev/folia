import test from 'node:test'
import assert from 'node:assert/strict'

const sigmaModule = await import(new URL('../lib/mockup/sigma.ts', import.meta.url))

const {
  clampBlurSigma,
  DEFAULT_MOCKUP_SIGMA,
  normalizeInternalBlurSigma,
  parseMockupSigmaInput,
  SHARP_BLUR_SIGMA_MAX,
  SHARP_BLUR_SIGMA_MIN,
} = sigmaModule

test('parseMockupSigmaInput accepts undefined and uses route defaulting', () => {
  assert.deepEqual(parseMockupSigmaInput(undefined), { ok: true, value: undefined })
})

test('parseMockupSigmaInput accepts a valid numeric sigma', () => {
  assert.deepEqual(parseMockupSigmaInput(0.3), { ok: true, value: 0.3 })
  assert.deepEqual(parseMockupSigmaInput('1.2'), { ok: true, value: 1.2 })
})

test('parseMockupSigmaInput rejects out-of-range sigma payloads', () => {
  const tooSmall = parseMockupSigmaInput(0.22)
  assert.equal(tooSmall.ok, false)
  if (tooSmall.ok) throw new Error('Expected invalid sigma result')
  assert.match(tooSmall.error, /sigma must be between 0\.3 and 1000/i)

  const tooLarge = parseMockupSigmaInput(SHARP_BLUR_SIGMA_MAX + 1)
  assert.equal(tooLarge.ok, false)
})

test('normalizeInternalBlurSigma clamps unsafe internal values', () => {
  assert.equal(normalizeInternalBlurSigma(0.22), SHARP_BLUR_SIGMA_MIN)
  assert.equal(normalizeInternalBlurSigma(Number.NaN), DEFAULT_MOCKUP_SIGMA)
  assert.equal(normalizeInternalBlurSigma(SHARP_BLUR_SIGMA_MAX + 5), SHARP_BLUR_SIGMA_MAX)
  assert.equal(clampBlurSigma(0.22), SHARP_BLUR_SIGMA_MIN)
})
