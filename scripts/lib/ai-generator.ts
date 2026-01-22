/**
 * AI Content Generator - Generates realistic email content using Claude Haiku
 *
 * Uses the Vercel AI SDK to generate natural-sounding email content
 * based on scenario specifications.
 */

import { Effect, Schema } from "effect"
import { generateText } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import type { ResolvedPersona } from "./scenario-parser.js"

/**
 * Generated email content
 */
export interface GeneratedContent {
  subject: string
  textBody: string
  htmlBody: string
}

/**
 * Schema for parsing AI response
 */
const GeneratedContentSchema = Schema.Struct({
  subject: Schema.String,
  textBody: Schema.String,
  htmlBody: Schema.String,
})

/**
 * Email generation parameters
 */
export interface EmailGenerationParams {
  topic: string
  tone: string
  from: ResolvedPersona
  to: ResolvedPersona[]
  cc?: ResolvedPersona[]
  isReply?: boolean
  replyContext?: string
  hasAttachments?: boolean
  attachmentNames?: string[]
  isEmpty?: boolean
  subjectOverride?: string
  bodyOverride?: string
  inlineImageCount?: number
}

/**
 * Build the AI prompt for email generation
 */
const buildPrompt = (params: EmailGenerationParams): string => {
  const recipientNames = params.to.map((p) => p.name).join(", ")
  const ccNames = params.cc?.map((p) => p.name).join(", ")

  let prompt = `Generate a realistic ${params.tone} email about: "${params.topic}"

From: ${params.from.name} <${params.from.email}>
To: ${recipientNames}`

  if (ccNames) {
    prompt += `\nCC: ${ccNames}`
  }

  if (params.isReply) {
    prompt += `\n\nThis is a reply to a previous email in the conversation.`
    if (params.replyContext) {
      prompt += ` The previous email was about: "${params.replyContext}"`
    }
  }

  if (params.hasAttachments && params.attachmentNames?.length) {
    prompt += `\n\nThis email has attachments: ${params.attachmentNames.join(", ")}. Reference them naturally in the body.`
  }

  if (params.inlineImageCount && params.inlineImageCount > 0) {
    prompt += `\n\nThe HTML body should reference ${params.inlineImageCount} inline image(s) using cid: URLs.`
  }

  if (params.isEmpty) {
    prompt += `\n\nThis should be a very brief, minimal email - just a quick acknowledgment or single-word response.`
  }

  prompt += `

Return a valid JSON object with exactly these fields:
{
  "subject": "email subject line",
  "textBody": "plain text version of the email body",
  "htmlBody": "HTML version of the email body with proper tags"
}

Guidelines:
- Keep the email realistic and appropriate for the tone
- The textBody should be plain text with no HTML
- The htmlBody should be properly formatted HTML (can include <p>, <br>, <strong>, <em>, <ul>, <li> tags)
- For ${params.tone} tone, use appropriate language and formality
- Include a proper greeting and signature
- Do not include the subject in the body`

  return prompt
}

/**
 * Generate email content using Claude Haiku
 */
export const generateEmailContent = (
  params: EmailGenerationParams
): Effect.Effect<GeneratedContent, Error> =>
  Effect.gen(function* () {
    // Handle overrides
    if (params.subjectOverride && params.bodyOverride) {
      return {
        subject: params.subjectOverride,
        textBody: params.bodyOverride,
        htmlBody: `<p>${params.bodyOverride}</p>`,
      }
    }

    // Handle empty body edge case
    if (params.isEmpty) {
      const subject = params.subjectOverride ?? params.topic
      const body = params.bodyOverride ?? "OK"
      return {
        subject,
        textBody: body,
        htmlBody: `<p>${body}</p>`,
      }
    }

    const prompt = buildPrompt(params)

    const result = yield* Effect.tryPromise({
      try: async () => {
        const { text } = await generateText({
          model: anthropic("claude-3-5-haiku-20241022"),
          prompt,
          maxTokens: 1000,
        })
        return text
      },
      catch: (error) =>
        new Error(`AI generation failed: ${error instanceof Error ? error.message : String(error)}`),
    })

    // Parse the JSON response
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return yield* Effect.fail(
        new Error(`Failed to parse AI response as JSON: ${result}`)
      )
    }

    const parsed = yield* Effect.try({
      try: () => JSON.parse(jsonMatch[0]!) as unknown,
      catch: () => new Error(`Invalid JSON in AI response: ${jsonMatch[0]}`),
    })

    const decoded = Schema.decodeUnknownEither(GeneratedContentSchema)(parsed)
    if (decoded._tag === "Left") {
      return yield* Effect.fail(
        new Error(`AI response validation failed: ${String(decoded.left)}`)
      )
    }

    // Apply subject override if provided
    const content = decoded.right
    if (params.subjectOverride) {
      content.subject = params.subjectOverride
    }

    // Add inline image references to HTML if needed
    if (params.inlineImageCount && params.inlineImageCount > 0) {
      const imgTags = Array.from({ length: params.inlineImageCount }, (_, i) =>
        `<img src="cid:inline-image-${i}@test.local" alt="Image ${i + 1}" />`
      ).join("\n")

      // Insert images before closing </body> or at end
      if (content.htmlBody.includes("</body>")) {
        content.htmlBody = content.htmlBody.replace(
          "</body>",
          `<div>${imgTags}</div></body>`
        )
      } else {
        content.htmlBody += `\n<div>${imgTags}</div>`
      }
    }

    return content
  })

/**
 * Generate content for a thread of emails
 *
 * Generates content for each email in sequence, passing context from
 * previous emails to maintain conversation coherence.
 */
export const generateThreadContent = (
  topic: string,
  tone: string,
  emails: Array<{
    from: ResolvedPersona
    to: ResolvedPersona[]
    cc?: ResolvedPersona[]
    replyToIndex?: number
  }>
): Effect.Effect<GeneratedContent[], Error> =>
  Effect.gen(function* () {
    const results: GeneratedContent[] = []

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i]!
      const isReply = email.replyToIndex !== undefined
      const replyContext = isReply && email.replyToIndex !== undefined
        ? results[email.replyToIndex]?.subject
        : undefined

      const content = yield* generateEmailContent({
        topic,
        tone,
        from: email.from,
        to: email.to,
        cc: email.cc,
        isReply,
        replyContext,
      })

      // For replies, add "Re: " prefix if not already present
      if (isReply && !content.subject.toLowerCase().startsWith("re:")) {
        const originalSubject = replyContext ?? topic
        content.subject = `Re: ${originalSubject}`
      }

      results.push(content)
    }

    return results
  })

/**
 * Fallback content generator for when AI is not available
 *
 * Generates placeholder content based on scenario parameters
 */
export const generateFallbackContent = (
  params: EmailGenerationParams
): GeneratedContent => {
  const subject = params.subjectOverride ?? params.topic
  const greeting = params.tone === "formal" ? "Dear" : "Hi"
  const recipientNames = params.to.map((p) => p.name.split(" ")[0]).join(", ")
  const signoff =
    params.tone === "formal"
      ? "Best regards"
      : params.tone === "casual"
        ? "Cheers"
        : "Thanks"

  const textBody = params.bodyOverride ??
    `${greeting} ${recipientNames},

This is regarding: ${params.topic}

${params.hasAttachments ? `Please find the attached file(s): ${params.attachmentNames?.join(", ") ?? "documents"}.\n\n` : ""}${signoff},
${params.from.name}`

  const htmlBody = `<!DOCTYPE html>
<html>
<body>
<p>${greeting} ${recipientNames},</p>
<p>This is regarding: ${params.topic}</p>
${params.hasAttachments ? `<p>Please find the attached file(s): ${params.attachmentNames?.join(", ") ?? "documents"}.</p>` : ""}
<p>${signoff},<br/>
${params.from.name}</p>
</body>
</html>`

  return { subject, textBody, htmlBody }
}

/**
 * Generate content with fallback to placeholder if AI fails
 */
export const generateContentWithFallback = (
  params: EmailGenerationParams,
  useAI: boolean = true
): Effect.Effect<GeneratedContent, never> =>
  Effect.gen(function* () {
    if (!useAI) {
      return generateFallbackContent(params)
    }

    const result = yield* Effect.either(generateEmailContent(params))

    if (result._tag === "Left") {
      console.warn(`AI generation failed, using fallback: ${result.left.message}`)
      return generateFallbackContent(params)
    }

    return result.right
  })
