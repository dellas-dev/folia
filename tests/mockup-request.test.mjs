import test from 'node:test'
import assert from 'node:assert/strict'

const requestModule = await import(new URL('../lib/mockup/request.ts', import.meta.url))

const { buildMockupRequest, buildVisualValidationError } = requestModule

test('buildMockupRequest uses the AI mockup route with AI-only payload', () => {
  const request = buildMockupRequest({
    mode: 'mockup-ai',
    designR2Key: 'users/demo/design.png',
    scenePreset: 'minimal-travertine',
    customPrompt: 'soft neutral studio',
    sigma: 0.5,
  })

  assert.equal(request.endpoint, '/api/generate/mockup')
  assert.deepEqual(request.body, {
    invitation_r2_key: 'users/demo/design.png',
    scene_preset: 'minimal-travertine',
    custom_prompt: 'soft neutral studio',
    sigma: 0.5,
  })
})

test('buildMockupRequest uses the template warp route with template payload', () => {
  const request = buildMockupRequest({
    mode: 'scene-template',
    designR2Key: 'users/demo/design.png',
    templateId: 'rustic-flatlay',
  })

  assert.equal(request.endpoint, '/api/mockup/template')
  assert.deepEqual(request.body, {
    design_r2_key: 'users/demo/design.png',
    template_id: 'rustic-flatlay',
  })
})

test('buildVisualValidationError returns structured 422-style details', () => {
  assert.deepEqual(
    buildVisualValidationError([{ field: 'sigma', message: 'sigma must be between 0.3 and 1000.' }]),
    {
      error: 'Invalid visual parameters.',
      code: 'INVALID_VISUAL_PARAMS',
      details: [{ field: 'sigma', message: 'sigma must be between 0.3 and 1000.' }],
    }
  )
})
