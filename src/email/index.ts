// Email schema and types
export {
  Email,
  EmailBodyPart,
  EmailBody,
  EmailBodyValues,
  EmailHeader,
  EmailHeaders,
  EmailAttachment,
  EmailFilterCondition,
  EmailGetArguments,
  EmailGetResponse,
  EmailSetArguments,
  EmailSetResponse,
  EmailQueryArguments,
  EmailQueryResponse,
  EmailQueryChangesArguments,
  EmailQueryChangesResponse,
  EmailCopyArguments,
  EmailCopyResponse,
  EmailImportArguments,
  EmailImportResponse,
  EmailMutable,
  StandardProperties,
  EmailHelpers,
  type EmailFilterCondition as EmailFilterConditionType,
} from './schema.ts'

// Email service
export {
  EmailService,
  EmailServiceLive,
  EmailOperations,
  type EmailServiceInterface,
} from './service.ts'

// Email utilities
export {
  MimeTypes,
  HTMLUtils,
  AttachmentUtils,
  KeywordUtils,
  BodyUtils,
  BinaryUtils,
  EmailProcessing,
  EmailProcessingError,
} from './utils.ts'
