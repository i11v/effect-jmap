// Mailbox schema and types
export {
  Mailbox,
  MailboxRole,
  MailboxRights,
  MailboxFilterCondition,
  MailboxGetArguments,
  MailboxGetResponse,
  MailboxSetArguments,
  MailboxSetResponse,
  MailboxQueryArguments,
  MailboxQueryResponse,
  MailboxQueryChangesArguments,
  MailboxQueryChangesResponse,
  MailboxMutable,
  StandardRoles,
  MailboxHelpers,
  type MailboxFilterCondition as MailboxFilterConditionType,
} from './schema.ts'

// Mailbox service
export {
  MailboxService,
  MailboxServiceLive,
  MailboxOperations,
  type MailboxServiceInterface,
} from './service.ts'
