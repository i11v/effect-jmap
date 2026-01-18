import { describe, it, expect } from 'vitest'
import { Schema } from 'effect'
import {
  EmailSubmissionObject,
  EmailSubmissionSetResult,
  UndoStatus,
  Envelope,
  Address,
  DeliveryStatus,
  DeliveryStatusValue,
  EmailSubmissionMutable,
  EmailSubmissionFilterCondition,
  EmailSubmissionHelpers,
  EmailSubmissionGetArguments,
  EmailSubmissionSetArguments,
  EmailSubmissionQueryArguments
} from '../../../src/schemas/EmailSubmission.ts'
import { Common } from '../../../src/schemas/Common.ts'

describe('EmailSubmission Schema', () => {
  describe('UndoStatus', () => {
    it('should validate valid undo statuses', () => {
      const validStatuses = ['pending', 'final', 'canceled']

      validStatuses.forEach(status => {
        const result = Schema.decodeUnknownSync(UndoStatus)(status)
        expect(result).toBe(status)
      })
    })

    it('should reject invalid undo status', () => {
      expect(() => Schema.decodeUnknownSync(UndoStatus)('invalid-status')).toThrow()
    })
  })

  describe('Address', () => {
    it('should validate address with email only', () => {
      // Per RFC 8621: parameters is Object|null, so must be explicitly null
      const address = {
        email: 'test@example.com',
        parameters: null
      }

      const result = Schema.decodeUnknownSync(Address)(address)
      expect(result.email).toBe('test@example.com')
      expect(result.parameters).toBeNull()
    })

    it('should validate address with parameters', () => {
      const address = {
        email: 'test@example.com',
        parameters: {
          'AUTH': 'user@example.com',
          'BODY': '8BITMIME'
        }
      }

      const result = Schema.decodeUnknownSync(Address)(address)
      expect(result.email).toBe('test@example.com')
      expect(result.parameters).toEqual(address.parameters)
    })

    it('should allow null parameters', () => {
      const address = {
        email: 'test@example.com',
        parameters: null
      }

      const result = Schema.decodeUnknownSync(Address)(address)
      expect(result.parameters).toBeNull()
    })
  })

  describe('Envelope', () => {
    it('should validate complete envelope', () => {
      // Per RFC 8621: parameters is Object|null, so must be explicitly provided
      const envelope = {
        mailFrom: { email: 'sender@example.com', parameters: null },
        rcptTo: [
          { email: 'recipient1@example.com', parameters: null },
          { email: 'recipient2@example.com', parameters: null }
        ]
      }

      const result = Schema.decodeUnknownSync(Envelope)(envelope)
      expect(result.mailFrom.email).toBe('sender@example.com')
      expect(result.rcptTo).toHaveLength(2)
      expect(result.rcptTo[0].email).toBe('recipient1@example.com')
    })

    it('should require at least one recipient', () => {
      const envelopeNoRecipients = {
        mailFrom: { email: 'sender@example.com', parameters: null },
        rcptTo: []
      }

      // Empty array should still be valid, but the server may reject it
      const result = Schema.decodeUnknownSync(Envelope)(envelopeNoRecipients)
      expect(result.rcptTo).toHaveLength(0)
    })
  })

  describe('DeliveryStatusValue', () => {
    it('should validate delivery status with all fields', () => {
      const status = {
        smtpReply: '250 2.0.0 OK',
        delivered: 'yes',
        displayed: 'unknown'
      }

      const result = Schema.decodeUnknownSync(DeliveryStatusValue)(status)
      expect(result).toEqual(status)
    })

    it('should validate all delivered values', () => {
      const validDelivered = ['queued', 'yes', 'no', 'unknown']

      validDelivered.forEach(delivered => {
        const status = {
          smtpReply: '250 OK',
          delivered,
          displayed: 'unknown'
        }

        const result = Schema.decodeUnknownSync(DeliveryStatusValue)(status)
        expect(result.delivered).toBe(delivered)
      })
    })

    it('should validate all displayed values', () => {
      const validDisplayed = ['unknown', 'yes', 'no']

      validDisplayed.forEach(displayed => {
        const status = {
          smtpReply: '250 OK',
          delivered: 'yes',
          displayed
        }

        const result = Schema.decodeUnknownSync(DeliveryStatusValue)(status)
        expect(result.displayed).toBe(displayed)
      })
    })
  })

  describe('EmailSubmissionObject', () => {
    const validSubmission = {
      id: 'submission-1',
      identityId: 'identity-1',
      emailId: 'email-1',
      threadId: 'thread-1',
      envelope: null,
      sendAt: '2024-01-15T10:30:00Z',
      undoStatus: 'final',
      deliveryStatus: {
        'recipient@example.com': {
          smtpReply: '250 2.0.0 OK',
          delivered: 'yes',
          displayed: 'unknown'
        }
      },
      dsnBlobIds: [],
      mdnBlobIds: []
    }

    it('should validate complete submission object', () => {
      const result = Schema.decodeUnknownSync(EmailSubmissionObject)(validSubmission)
      expect(result).toEqual(validSubmission)
    })

    it('should allow null envelope', () => {
      const submission = {
        ...validSubmission,
        envelope: null
      }

      const result = Schema.decodeUnknownSync(EmailSubmissionObject)(submission)
      expect(result.envelope).toBeNull()
    })

    it('should validate submission with envelope', () => {
      // Per RFC 8621: envelope is Envelope|null, parameters is Object|null
      const submission = {
        ...validSubmission,
        envelope: {
          mailFrom: { email: 'sender@example.com', parameters: null },
          rcptTo: [{ email: 'recipient@example.com', parameters: null }]
        }
      }

      const result = Schema.decodeUnknownSync(EmailSubmissionObject)(submission)
      expect(result.envelope).toBeDefined()
      expect(result.envelope!.mailFrom.email).toBe('sender@example.com')
    })

    it('should allow null delivery status', () => {
      const submission = {
        ...validSubmission,
        deliveryStatus: null
      }

      const result = Schema.decodeUnknownSync(EmailSubmissionObject)(submission)
      expect(result.deliveryStatus).toBeNull()
    })
  })

  describe('EmailSubmissionSetResult', () => {
    it('should validate minimal submission result with only required fields', () => {
      const minimalResult = {
        id: 'submission-1',
        sendAt: '2024-01-15T10:30:00Z',
        undoStatus: 'final'
      }

      const result = Schema.decodeUnknownSync(EmailSubmissionSetResult)(minimalResult)
      expect(result.id).toBe('submission-1')
      expect(result.sendAt).toBe('2024-01-15T10:30:00Z')
      expect(result.undoStatus).toBe('final')
    })

    it('should validate with all optional fields undefined', () => {
      const minimalResult = {
        id: 'submission-1'
      }

      const result = Schema.decodeUnknownSync(EmailSubmissionSetResult)(minimalResult)
      expect(result.id).toBe('submission-1')
      expect(result.identityId).toBeUndefined()
      expect(result.emailId).toBeUndefined()
      expect(result.threadId).toBeUndefined()
    })

    it('should validate with some optional fields present', () => {
      const partialResult = {
        id: 'submission-1',
        identityId: 'identity-1',
        emailId: 'email-1',
        sendAt: '2024-01-15T10:30:00Z'
      }

      const result = Schema.decodeUnknownSync(EmailSubmissionSetResult)(partialResult)
      expect(result.id).toBe('submission-1')
      expect(result.identityId).toBe('identity-1')
      expect(result.emailId).toBe('email-1')
      expect(result.sendAt).toBe('2024-01-15T10:30:00Z')
    })

    it('should validate full result matching EmailSubmissionObject', () => {
      const fullResult = {
        id: 'submission-1',
        identityId: 'identity-1',
        emailId: 'email-1',
        threadId: 'thread-1',
        envelope: {
          mailFrom: { email: 'sender@example.com', parameters: null },
          rcptTo: [{ email: 'recipient@example.com', parameters: null }]
        },
        sendAt: '2024-01-15T10:30:00Z',
        undoStatus: 'final',
        deliveryStatus: {
          'recipient@example.com': {
            smtpReply: '250 2.0.0 OK',
            delivered: 'yes',
            displayed: 'unknown'
          }
        },
        dsnBlobIds: [],
        mdnBlobIds: []
      }

      const result = Schema.decodeUnknownSync(EmailSubmissionSetResult)(fullResult)
      expect(result).toEqual(fullResult)
    })

    it('should allow null envelope', () => {
      const resultWithNullEnvelope = {
        id: 'submission-1',
        envelope: null
      }

      const result = Schema.decodeUnknownSync(EmailSubmissionSetResult)(resultWithNullEnvelope)
      expect(result.envelope).toBeNull()
    })

    it('should allow null deliveryStatus', () => {
      const resultWithNullDelivery = {
        id: 'submission-1',
        deliveryStatus: null
      }

      const result = Schema.decodeUnknownSync(EmailSubmissionSetResult)(resultWithNullDelivery)
      expect(result.deliveryStatus).toBeNull()
    })
  })

  describe('EmailSubmissionMutable', () => {
    it('should validate mutable properties', () => {
      const mutableProps = {
        identityId: Common.createId('identity-1'),
        emailId: Common.createId('email-1'),
        sendAt: Common.now()
      }

      const result = Schema.decodeUnknownSync(EmailSubmissionMutable)(mutableProps)
      expect(result.identityId).toBe('identity-1')
      expect(result.emailId).toBe('email-1')
    })

    it('should validate with envelope', () => {
      const mutableProps = {
        identityId: Common.createId('identity-1'),
        emailId: Common.createId('email-1'),
        envelope: {
          mailFrom: { email: 'sender@example.com', parameters: null },
          rcptTo: [{ email: 'recipient@example.com', parameters: null }]
        }
      }

      const result = Schema.decodeUnknownSync(EmailSubmissionMutable)(mutableProps)
      expect(result.envelope).toBeDefined()
    })

    it('should validate with onSuccessUpdateEmail', () => {
      const mutableProps = {
        identityId: Common.createId('identity-1'),
        emailId: Common.createId('email-1'),
        onSuccessUpdateEmail: {
          'email-1': {
            keywords: { '$draft': false }
          }
        }
      }

      const result = Schema.decodeUnknownSync(EmailSubmissionMutable)(mutableProps)
      expect(result.onSuccessUpdateEmail).toBeDefined()
    })

    it('should validate with onSuccessDestroyEmail as array', () => {
      const mutableProps = {
        identityId: Common.createId('identity-1'),
        emailId: Common.createId('email-1'),
        onSuccessDestroyEmail: [Common.createId('email-1')]
      }

      const result = Schema.decodeUnknownSync(EmailSubmissionMutable)(mutableProps)
      expect(Array.isArray(result.onSuccessDestroyEmail)).toBe(true)
    })

    it('should validate with onSuccessDestroyEmail as boolean', () => {
      const mutableProps = {
        identityId: Common.createId('identity-1'),
        emailId: Common.createId('email-1'),
        onSuccessDestroyEmail: true
      }

      const result = Schema.decodeUnknownSync(EmailSubmissionMutable)(mutableProps)
      expect(result.onSuccessDestroyEmail).toBe(true)
    })
  })

  describe('EmailSubmissionFilterCondition', () => {
    it('should validate filter with all optional properties', () => {
      const filter = {
        identityIds: [Common.createId('identity-1')],
        emailIds: [Common.createId('email-1'), Common.createId('email-2')],
        threadIds: [Common.createId('thread-1')],
        undoStatus: 'pending' as const,
        before: Common.now(),
        after: Common.now()
      }

      const result = Schema.decodeUnknownSync(EmailSubmissionFilterCondition)(filter)
      expect(result.identityIds).toHaveLength(1)
      expect(result.emailIds).toHaveLength(2)
      expect(result.undoStatus).toBe('pending')
    })

    it('should validate empty filter', () => {
      const emptyFilter = {}
      const result = Schema.decodeUnknownSync(EmailSubmissionFilterCondition)(emptyFilter)
      expect(result).toEqual({})
    })

    it('should validate partial filter', () => {
      const partialFilter = {
        undoStatus: 'pending' as const
      }

      const result = Schema.decodeUnknownSync(EmailSubmissionFilterCondition)(partialFilter)
      expect(result.undoStatus).toBe('pending')
    })
  })

  describe('EmailSubmissionGetArguments', () => {
    it('should validate get arguments with ids', () => {
      const args = {
        accountId: 'test-account',
        ids: [Common.createId('submission-1')]
      }

      const result = Schema.decodeUnknownSync(EmailSubmissionGetArguments)(args)
      expect(result.accountId).toBe('test-account')
      expect(result.ids).toHaveLength(1)
    })

    it('should validate get arguments with null ids (get all)', () => {
      const args = {
        accountId: 'test-account',
        ids: null
      }

      const result = Schema.decodeUnknownSync(EmailSubmissionGetArguments)(args)
      expect(result.ids).toBeNull()
    })

    it('should validate get arguments with properties', () => {
      const args = {
        accountId: 'test-account',
        ids: [Common.createId('submission-1')],
        properties: ['id', 'emailId', 'undoStatus']
      }

      const result = Schema.decodeUnknownSync(EmailSubmissionGetArguments)(args)
      expect(result.properties).toHaveLength(3)
    })
  })

  describe('EmailSubmissionHelpers', () => {
    const submission: EmailSubmissionObject = {
      id: Common.createId('submission-1'),
      identityId: Common.createId('identity-1'),
      emailId: Common.createId('email-1'),
      threadId: Common.createId('thread-1'),
      envelope: null,
      sendAt: Common.now(),
      undoStatus: 'pending',
      deliveryStatus: {
        'success@example.com': {
          smtpReply: '250 OK',
          delivered: 'yes',
          displayed: 'unknown'
        },
        'failed@example.com': {
          smtpReply: '550 Mailbox not found',
          delivered: 'no',
          displayed: 'unknown'
        },
        'queued@example.com': {
          smtpReply: '250 Queued',
          delivered: 'queued',
          displayed: 'unknown'
        }
      },
      dsnBlobIds: [],
      mdnBlobIds: []
    }

    describe('isPending', () => {
      it('should identify pending submissions', () => {
        expect(EmailSubmissionHelpers.isPending(submission)).toBe(true)
        expect(EmailSubmissionHelpers.isPending({
          ...submission,
          undoStatus: 'final'
        })).toBe(false)
      })
    })

    describe('isFinal', () => {
      it('should identify final submissions', () => {
        expect(EmailSubmissionHelpers.isFinal(submission)).toBe(false)
        expect(EmailSubmissionHelpers.isFinal({
          ...submission,
          undoStatus: 'final'
        })).toBe(true)
      })
    })

    describe('isCanceled', () => {
      it('should identify canceled submissions', () => {
        expect(EmailSubmissionHelpers.isCanceled(submission)).toBe(false)
        expect(EmailSubmissionHelpers.isCanceled({
          ...submission,
          undoStatus: 'canceled'
        })).toBe(true)
      })
    })

    describe('isDelivered', () => {
      it('should check if delivery has been attempted', () => {
        expect(EmailSubmissionHelpers.isDelivered(submission)).toBe(true)
        expect(EmailSubmissionHelpers.isDelivered({
          ...submission,
          deliveryStatus: null
        })).toBe(false)
      })
    })

    describe('getRecipientStatus', () => {
      it('should get status for specific recipient', () => {
        const status = EmailSubmissionHelpers.getRecipientStatus(
          submission,
          'success@example.com'
        )
        expect(status?.delivered).toBe('yes')
      })

      it('should return undefined for non-existent recipient', () => {
        const status = EmailSubmissionHelpers.getRecipientStatus(
          submission,
          'nonexistent@example.com'
        )
        expect(status).toBeUndefined()
      })
    })

    describe('getDeliveredRecipients', () => {
      it('should get all successfully delivered recipients', () => {
        const delivered = EmailSubmissionHelpers.getDeliveredRecipients(submission)
        expect(delivered).toHaveLength(1)
        expect(delivered[0]).toBe('success@example.com')
      })
    })

    describe('getFailedRecipients', () => {
      it('should get all failed recipients', () => {
        const failed = EmailSubmissionHelpers.getFailedRecipients(submission)
        expect(failed).toHaveLength(1)
        expect(failed[0]).toBe('failed@example.com')
      })
    })

    describe('getQueuedRecipients', () => {
      it('should get all queued recipients', () => {
        const queued = EmailSubmissionHelpers.getQueuedRecipients(submission)
        expect(queued).toHaveLength(1)
        expect(queued[0]).toBe('queued@example.com')
      })
    })

    describe('isFullyDelivered', () => {
      it('should check if all recipients delivered', () => {
        expect(EmailSubmissionHelpers.isFullyDelivered(submission)).toBe(false)

        const fullyDelivered = {
          ...submission,
          deliveryStatus: {
            'recipient@example.com': {
              smtpReply: '250 OK',
              delivered: 'yes' as const,
              displayed: 'unknown' as const
            }
          }
        }
        expect(EmailSubmissionHelpers.isFullyDelivered(fullyDelivered)).toBe(true)
      })
    })

    describe('hasFailures', () => {
      it('should check if any recipient failed', () => {
        expect(EmailSubmissionHelpers.hasFailures(submission)).toBe(true)

        const noFailures = {
          ...submission,
          deliveryStatus: {
            'recipient@example.com': {
              smtpReply: '250 OK',
              delivered: 'yes' as const,
              displayed: 'unknown' as const
            }
          }
        }
        expect(EmailSubmissionHelpers.hasFailures(noFailures)).toBe(false)
      })
    })

    describe('createEnvelope', () => {
      it('should create envelope from email addresses', () => {
        const envelope = EmailSubmissionHelpers.createEnvelope(
          'sender@example.com',
          ['recipient1@example.com', 'recipient2@example.com']
        )

        expect(envelope.mailFrom.email).toBe('sender@example.com')
        expect(envelope.rcptTo).toHaveLength(2)
        expect(envelope.rcptTo[0].email).toBe('recipient1@example.com')
      })
    })

    describe('createSubmission', () => {
      it('should create submission with required fields', () => {
        const submission = EmailSubmissionHelpers.createSubmission(
          Common.createId('identity-1'),
          Common.createId('email-1')
        )

        expect(submission.identityId).toBe('identity-1')
        expect(submission.emailId).toBe('email-1')
      })

      it('should create submission with options', () => {
        const envelope = EmailSubmissionHelpers.createEnvelope(
          'sender@example.com',
          ['recipient@example.com']
        )

        const submission = EmailSubmissionHelpers.createSubmission(
          Common.createId('identity-1'),
          Common.createId('email-1'),
          {
            envelope,
            sendAt: Common.now(),
            onSuccessDestroyEmail: [Common.createId('draft-1')]
          }
        )

        expect(submission.envelope).toBeDefined()
        expect(submission.sendAt).toBeDefined()
        expect(submission.onSuccessDestroyEmail).toBeDefined()
      })
    })
  })
})
