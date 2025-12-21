// EmailSubmission schema and types
export {
  EmailSubmissionObject,
  EmailSubmissionSetResult,
  EmailSubmissionMutable,
  Address,
  Envelope,
  UndoStatus,
  DeliveryStatus,
  DeliveryStatusValue,
  EmailSubmissionFilterCondition,
  EmailSubmissionGetArguments,
  EmailSubmissionGetResponse,
  EmailSubmissionSetArguments,
  EmailSubmissionSetResponse,
  EmailSubmissionQueryArguments,
  EmailSubmissionQueryResponse,
  EmailSubmissionQueryChangesArguments,
  EmailSubmissionQueryChangesResponse,
  EmailSubmissionChangesArguments,
  EmailSubmissionChangesResponse,
  EmailSubmissionHelpers,
} from './schema.ts'

// EmailSubmission service
export {
  EmailSubmissionService,
  EmailSubmissionServiceLive,
  EmailSubmissionOperations,
  type EmailSubmissionServiceInterface,
} from './service.ts'
