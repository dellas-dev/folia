import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'hello@folia.ai'

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.RESEND_API_KEY) {
    return
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  })
}

export async function sendPurchaseConfirmationEmail({
  to,
  planName,
  creditsAdded,
}: {
  to: string
  planName: string
  creditsAdded: number
}) {
  return sendEmail({
    to,
    subject: `Your Folia ${planName} purchase is active`,
    html: `<p>Your Folia purchase is confirmed.</p><p>Plan: <strong>${planName}</strong><br />Credits added: <strong>${creditsAdded}</strong></p>`,
  })
}

export async function sendSubscriptionStatusEmail({
  to,
  subject,
  body,
}: {
  to: string
  subject: string
  body: string
}) {
  return sendEmail({
    to,
    subject,
    html: `<p>${body}</p>`,
  })
}

export async function sendLowCreditsWarningEmail({ to, credits }: { to: string; credits: number }) {
  return sendEmail({
    to,
    subject: 'Your Folia credits are running low',
    html: `<p>You only have <strong>${credits}</strong> credits left in Folia.</p>`,
  })
}
