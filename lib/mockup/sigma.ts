export const SHARP_BLUR_SIGMA_MIN = 0.3
export const SHARP_BLUR_SIGMA_MAX = 1000
export const DEFAULT_MOCKUP_SIGMA = SHARP_BLUR_SIGMA_MIN

type SigmaParseResult =
  | { ok: true; value: number | undefined }
  | { ok: false; error: string }

function isBlank(value: unknown) {
  return value === undefined || value === null || value === ''
}

export function clampBlurSigma(value: number) {
  return Math.min(SHARP_BLUR_SIGMA_MAX, Math.max(SHARP_BLUR_SIGMA_MIN, value))
}

export function normalizeInternalBlurSigma(value: number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_MOCKUP_SIGMA
  }

  return clampBlurSigma(value)
}

export function parseMockupSigmaInput(input: unknown): SigmaParseResult {
  if (isBlank(input)) {
    return { ok: true, value: undefined }
  }

  const parsed = typeof input === 'string' ? Number(input.trim()) : input

  if (typeof parsed !== 'number' || !Number.isFinite(parsed)) {
    return {
      ok: false,
      error: `sigma must be a number between ${SHARP_BLUR_SIGMA_MIN} and ${SHARP_BLUR_SIGMA_MAX}.`,
    }
  }

  if (parsed < SHARP_BLUR_SIGMA_MIN || parsed > SHARP_BLUR_SIGMA_MAX) {
    return {
      ok: false,
      error: `sigma must be between ${SHARP_BLUR_SIGMA_MIN} and ${SHARP_BLUR_SIGMA_MAX}.`,
    }
  }

  return { ok: true, value: parsed }
}
