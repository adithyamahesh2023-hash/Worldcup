import { createTransport } from 'nodemailer'

export async function sendVerificationRequest({
  identifier: email,
  url,
}: {
  identifier: string
  url: string
}) {
  const transport = createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  })

  const result = await transport.sendMail({
    to: email,
    from: process.env.EMAIL_FROM,
    subject: 'Sign in to World Cup Predictions',
    text: `Sign in to World Cup Predictions\n${url}\n\nThis link expires in 24 hours.`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">World Cup 2026 Predictions</h1>
        <p>Click the button below to sign in:</p>
        <a href="${url}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Sign In</a>
        <p style="color: #666; font-size: 14px;">Or copy this link: ${url}</p>
        <p style="color: #666; font-size: 14px;">This link expires in 24 hours.</p>
      </div>
    `,
  })

  const failed = result.rejected.concat(result.pending).filter(Boolean)
  if (failed.length) {
    throw new Error(`Email(s) (${failed.join(', ')}) could not be sent`)
  }
}