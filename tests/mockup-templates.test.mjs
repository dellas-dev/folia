import test from 'node:test'
import assert from 'node:assert/strict'

const templatesModule = await import(new URL('../lib/mockup-templates.ts', import.meta.url))

const { MOCKUP_BUNDLES } = templatesModule

test('mockup bundles are limited to the phase 1 eucalyptus wedding suite', () => {
  assert.equal(MOCKUP_BUNDLES.length, 1)
  assert.equal(MOCKUP_BUNDLES[0].id, 'eucalyptus-wedding-suite')
  assert.equal(MOCKUP_BUNDLES[0].label, 'Eucalyptus Wedding Suite')
})

test('phase 1 eucalyptus wedding suite exposes only the four supported product types', () => {
  const productTypes = MOCKUP_BUNDLES[0].templates.map((template) => template.productType)

  assert.deepEqual(productTypes, [
    'invitation-suite-flat-lay',
    'welcome-sign-on-easel',
    'place-card-tabletop',
    'table-number-mini-easel',
  ])
})
