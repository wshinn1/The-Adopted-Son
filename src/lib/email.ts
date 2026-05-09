import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const ACCOUNTS_EMAIL = 'The Adopted Son <accounts@theadoptedson.com>'
const NOREPLY_EMAIL = 'The Adopted Son <noreply@theadoptedson.com>'
const ADMIN_EMAIL = 'weshinn@gmail.com'

export async function sendGivingConfirmationEmail(
  email: string,
  details: {
    name: string
    amount: number
    isRecurring: boolean
    note?: string
  }
) {
  try {
    const formattedAmount = (details.amount / 100).toFixed(2)
    const subject = details.isRecurring
      ? 'Thank You for Your Monthly Giving — The Adopted Son'
      : 'Thank You for Your Gift — The Adopted Son'

    await resend.emails.send({
      from: ACCOUNTS_EMAIL,
      to: email,
      subject,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Georgia, serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  <h1 style="font-size: 28px; font-weight: normal; margin-bottom: 24px;">Thank You, ${details.name}.</h1>

  <p style="font-size: 16px; margin-bottom: 16px;">
    Your ${details.isRecurring ? 'monthly gift' : 'gift'} of <strong>$${formattedAmount}</strong> has been received. We are deeply grateful for your generosity and support.
  </p>

  ${details.note ? `
  <div style="background: #f5f2ed; padding: 20px; border-radius: 8px; margin: 24px 0;">
    <p style="font-size: 14px; color: #666; margin: 0 0 4px 0;">Your note:</p>
    <p style="font-size: 15px; margin: 0; font-style: italic;">"${details.note}"</p>
  </div>
  ` : ''}

  <p style="font-size: 16px; margin-bottom: 16px;">
    Your giving helps us continue creating devotionals and resources that draw people closer to God. Thank you for being part of this mission.
  </p>

  ${details.isRecurring ? `
  <p style="font-size: 14px; color: #666; margin-top: 24px;">
    Your monthly giving can be managed by contacting us at <a href="mailto:accounts@theadoptedson.com" style="color: #1a1a1a;">accounts@theadoptedson.com</a>.
  </p>
  ` : ''}

  <p style="font-size: 14px; color: #aaa; margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
    <a href="https://theadoptedson.com" style="color: #aaa;">theadoptedson.com</a>
  </p>
</body>
</html>
      `,
    })

    await resend.emails.send({
      from: NOREPLY_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New Giving: $${formattedAmount} from ${details.name}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, sans-serif; line-height: 1.6; color: #1a1a1a; padding: 20px;">
  <h2 style="margin-bottom: 16px;">New Giving Received</h2>
  <p><strong>Name:</strong> ${details.name}</p>
  <p><strong>Email:</strong> ${email}</p>
  <p><strong>Amount:</strong> $${formattedAmount}</p>
  <p><strong>Type:</strong> ${details.isRecurring ? 'Monthly recurring' : 'One-time'}</p>
  ${details.note ? `<p><strong>Note:</strong> ${details.note}</p>` : ''}
  <p><strong>Date:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}</p>
  <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e5e5;">
  <p style="font-size: 14px; color: #666;">
    <a href="https://theadoptedson.com/admin/givings" style="color: #1a1a1a;">View all givings</a>
  </p>
</body>
</html>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send giving confirmation email:', error)
    return { success: false, error }
  }
}

export async function sendNewsletterWelcomeEmail(email: string, firstName: string) {
  try {
    await resend.emails.send({
      from: NOREPLY_EMAIL,
      to: email,
      subject: 'You\'re in — Welcome to The Adopted Son Newsletter',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Georgia, serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  <h1 style="font-size: 28px; font-weight: normal; margin-bottom: 8px;">Welcome, ${firstName}.</h1>
  <p style="font-size: 18px; color: #555; margin-bottom: 32px; font-style: italic;">You're now subscribed to The Adopted Son.</p>

  <p style="font-size: 16px; margin-bottom: 16px;">
    Thank you for signing up. You'll receive new devotionals and updates directly in your inbox — words written to encourage you in your identity as a child of God.
  </p>

  <p style="font-size: 16px; margin-bottom: 32px;">
    While you're here, we'd love to invite you to create a free account so you can save your favorite devotionals and track your reading.
  </p>

  <a href="https://theadoptedson.com/auth/sign-up" style="display: inline-block; background: #1a1a1a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; margin-bottom: 16px;">
    Create Your Free Account
  </a>

  <p style="font-size: 14px; color: #999; margin-top: 8px;">
    Already have an account? <a href="https://theadoptedson.com/auth/login" style="color: #555;">Sign in here</a>.
  </p>

  <p style="font-size: 14px; color: #aaa; margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
    You're receiving this because you signed up at theadoptedson.com.<br>
    <a href="https://theadoptedson.com/unsubscribe?email=${encodeURIComponent(email)}" style="color: #aaa;">Unsubscribe</a> &nbsp;·&nbsp;
    <a href="https://theadoptedson.com" style="color: #aaa;">theadoptedson.com</a>
  </p>
</body>
</html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send newsletter welcome email:', error)
    return { success: false, error }
  }
}

export async function sendContactFormAdmin({
  name,
  email,
  message,
}: {
  name: string
  email: string
  message: string
}) {
  try {
    await resend.emails.send({
      from: NOREPLY_EMAIL,
      to: ADMIN_EMAIL,
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  <h2 style="margin-bottom: 24px;">New Contact Form Submission</h2>
  <p><strong>Name:</strong> ${name}</p>
  <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #1a1a1a;">${email}</a></p>
  <div style="background: #f5f2ed; padding: 20px; border-radius: 8px; margin-top: 16px;">
    <p style="margin: 0; white-space: pre-wrap;">${message}</p>
  </div>
  <p style="font-size: 13px; color: #999; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5;">
    Submitted ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET
  </p>
</body>
</html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send contact admin email:', error)
    return { success: false, error }
  }
}

export async function sendContactFormConfirmation({
  name,
  email,
}: {
  name: string
  email: string
}) {
  try {
    await resend.emails.send({
      from: NOREPLY_EMAIL,
      to: email,
      subject: 'We received your message — The Adopted Son',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Georgia, serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  <h1 style="font-size: 26px; font-weight: normal; margin-bottom: 8px;">Thanks for reaching out, ${name}.</h1>
  <p style="font-size: 16px; color: #555; margin-bottom: 24px;">
    We received your message and will get back to you as soon as possible.
  </p>

  <p style="font-size: 16px; margin-bottom: 16px;">
    While you wait, we'd love to invite you to explore The Adopted Son — a collection of devotionals written to encourage you in your identity as a child of God.
  </p>

  <a href="https://theadoptedson.com/devotionals" style="display: inline-block; background: #1a1a1a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; margin-bottom: 16px;">
    Read Devotionals
  </a>

  <p style="font-size: 14px; color: #aaa; margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
    <a href="https://theadoptedson.com" style="color: #aaa;">theadoptedson.com</a>
  </p>
</body>
</html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send contact confirmation email:', error)
    return { success: false, error }
  }
}
