const { mergeFields } = require('../../lib/utils')

describe('mergeFields', () => {
    it('merges nested object fields without wiping unspecified subfields', () => {
        const target = { contactConsent: { enabled: false, text: 'old' } }
        mergeFields(target, { contactConsent: { text: 'new' } })

        expect(target.contactConsent).toEqual({ enabled: false, text: 'new' })
    })

    it('overwrites primitive fields directly', () => {
        const target = { name: 'old', rating: 3 }
        mergeFields(target, { name: 'new' })

        expect(target).toEqual({ name: 'new', rating: 3 })
    })

    it('replaces array fields wholesale rather than merging them', () => {
        const target = { tags: ['a', 'b'] }
        mergeFields(target, { tags: ['c'] })

        expect(target.tags).toEqual(['c'])
    })

    it('does not merge into a target field that does not currently hold an object', () => {
        const target = { settings: null }
        mergeFields(target, { settings: { enabled: true } })

        expect(target.settings).toEqual({ enabled: true })
    })
})
