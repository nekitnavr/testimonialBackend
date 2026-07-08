const { canTransitionStatus } = require('../lib/utils')

describe('canTransitionStatus', () => {
    it('allows transition to the next status', () => {
        expect(canTransitionStatus('draft', 'recording')).toBe(true)
        expect(canTransitionStatus('recording', 'processing')).toBe(true)
        expect(canTransitionStatus('processing', 'completed')).toBe(true)
        expect(canTransitionStatus('completed', 'shared')).toBe(true)
    })

    it('rejects skipping a status', () => {
        expect(canTransitionStatus('draft', 'processing')).toBe(false)
        expect(canTransitionStatus('recording', 'completed')).toBe(false)
        expect(canTransitionStatus('draft', 'shared')).toBe(false)
    })

    it('rejects moving backwards', () => {
        expect(canTransitionStatus('processing', 'recording')).toBe(false)
        expect(canTransitionStatus('shared', 'draft')).toBe(false)
    })

    it('rejects staying on the same status', () => {
        expect(canTransitionStatus('draft', 'draft')).toBe(false)
        expect(canTransitionStatus('shared', 'shared')).toBe(false)
    })

    it('rejects a status that does not exist in the list', () => {
        expect(canTransitionStatus('draft', 'archived')).toBe(false)
        expect(canTransitionStatus('unknown', 'draft')).toBe(false)
    })
})
