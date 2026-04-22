import type { MockupScenePreset } from '@/types'

export type MockupMode = 'mockup-ai' | 'scene-template'

type BaseRequestInput = {
  designR2Key: string
}

type MockupAiRequestInput = BaseRequestInput & {
  mode: 'mockup-ai'
  customPrompt?: string
  scenePreset?: MockupScenePreset
  sigma?: number
}

type SceneTemplateRequestInput = BaseRequestInput & {
  mode: 'scene-template'
  templateId: string
}

export type MockupRequestInput = MockupAiRequestInput | SceneTemplateRequestInput

export function buildMockupRequest(input: MockupRequestInput) {
  if (input.mode === 'scene-template') {
    return {
      endpoint: '/api/mockup/template',
      body: {
        design_r2_key: input.designR2Key,
        template_id: input.templateId,
      },
    }
  }

  return {
    endpoint: '/api/generate/mockup',
    body: {
      invitation_r2_key: input.designR2Key,
      scene_preset: input.scenePreset,
      custom_prompt: input.customPrompt,
      sigma: input.sigma,
    },
  }
}

export type VisualValidationIssue = {
  field: string
  message: string
}

export function buildVisualValidationError(
  details: VisualValidationIssue[],
  message = 'Invalid visual parameters.'
) {
  return {
    error: message,
    code: 'INVALID_VISUAL_PARAMS',
    details,
  }
}
