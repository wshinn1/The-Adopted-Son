import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Different sender addresses for different email types
const ACCOUNTS_EMAIL = 'The Adopted Son <accounts@theadoptedson.com>'
const NOREPLY_EMAIL = 'The Adopted Son <noreply@theadoptedson.com>'
const ADMIN_EMAIL = 'weshinn@gmail.com'

export async function sendTrialStartedEmail(email: string) {
  try {
    await resend.emails.send({
      from: ACCOUNTS_EMAIL,
      to: email,
      subject: 'Welcome to The Adopted Son — Your 14-Day Trial Has Begun',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Georgia, serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  <h1 style="font-size: 28px; font-weight: normal; margin-bottom: 24px;">Welcome to The Adopted Son</h1>
  
  <p style="font-size: 16px; margin-bottom: 16px;">
    Thank you for starting your free trial. For the next <strong>14 days</strong>, you have full access to all devotionals and spiritual content.
  </p>
  
  <p style="font-size: 16px; margin-bottom: 16px;">
    Each devotional is crafted to help you grow deeper in faith, find encouragement in Scripture, and walk more closely with God.
  </p>
  
  <div style="background: #f5f2ed; padding: 24px; border-radius: 12px; margin: 32px 0;">
    <p style="font-size: 16px; margin: 0 0 16px 0; font-style: italic;">
      "You can't wait for inspiration, you have to go after it with a club."
    </p>
    <p style="font-size: 14px; color: #666; margin: 0;">— Jack London</p>
  </div>
  
  <p style="font-size: 16px; margin-bottom: 24px;">
    Ready to make this a lasting journey? Subscribe anytime to ensure uninterrupted access:
  </p>
  
  <a href="https://theadoptedson.com/pricing" style="display: inline-block; background: #1a1a1a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px;">
    View Subscription Plans
  </a>
  
  <p style="font-size: 14px; color: #666; margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
    Questions? Simply reply to this email.<br>
    <a href="https://theadoptedson.com" style="color: #1a1a1a;">theadoptedson.com</a>
  </p>
</body>
</html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send trial started email:', error)
    return { success: false, error }
  }
}

export async function sendSubscriptionWelcomeEmail(email: string, planName: string) {
  try {
    // Send welcome email to subscriber
    await resend.emails.send({
      from: NOREPLY_EMAIL,
      to: email,
      subject: 'Thank You for Subscribing — The Adopted Son',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Georgia, serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  <h1 style="font-size: 28px; font-weight: normal; margin-bottom: 24px;">Thank You for Subscribing</h1>
  
  <p style="font-size: 16px; margin-bottom: 16px;">
    Your <strong>${planName}</strong> subscription is now active. You have unlimited access to all devotionals and content on The Adopted Son.
  </p>
  
  <p style="font-size: 16px; margin-bottom: 16px;">
    We're honored to be part of your spiritual journey. New devotionals are published regularly to help you grow in faith and find daily encouragement.
  </p>
  
  <div style="background: #f5f2ed; padding: 24px; border-radius: 12px; margin: 32px 0;">
    <h3 style="font-size: 18px; margin: 0 0 12px 0;">What's Included:</h3>
    <ul style="margin: 0; padding-left: 20px; font-size: 16px;">
      <li style="margin-bottom: 8px;">Unlimited access to all devotionals</li>
      <li style="margin-bottom: 8px;">Daily email delivery</li>
      <li style="margin-bottom: 8px;">Scripture references & downloadable content</li>
      <li style="margin-bottom: 8px;">Priority support</li>
    </ul>
  </div>
  
  <a href="https://theadoptedson.com/devotionals" style="display: inline-block; background: #1a1a1a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px;">
    Start Reading
  </a>
  
  <p style="font-size: 14px; color: #666; margin-top: 40px;">
    <a href="https://theadoptedson.com/account/billing" style="color: #666;">Manage your subscription</a>
  </p>
  
  <p style="font-size: 14px; color: #666; margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
    Questions? Simply reply to this email.<br>
    <a href="https://theadoptedson.com" style="color: #1a1a1a;">theadoptedson.com</a>
  </p>
</body>
</html>
      `,
    })

    // Notify admin of new subscriber
    await resend.emails.send({
      from: NOREPLY_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New Subscriber: ${email}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, sans-serif; line-height: 1.6; color: #1a1a1a; padding: 20px;">
  <h2 style="margin-bottom: 16px;">New Subscription</h2>
  <p><strong>Email:</strong> ${email}</p>
  <p><strong>Plan:</strong> ${planName}</p>
  <p><strong>Date:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}</p>
  <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e5e5;">
  <p style="font-size: 14px; color: #666;">
    <a href="https://theadoptedson.com/admin/subscribers" style="color: #1a1a1a;">View all subscribers</a>
  </p>
</body>
</html>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send subscription welcome email:', error)
    return { success: false, error }
  }
}

export async function sendPaymentReceiptEmail(
  email: string,
  details: {
    planName: string
    amount: number
    periodEnd: Date
  }
) {
  try {
    const formattedAmount = details.amount.toFixed(2)
    const formattedDate = details.periodEnd.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    await resend.emails.send({
      from: ACCOUNTS_EMAIL,
      to: email,
      subject: 'The Adopted Son - Payment Receipt',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Georgia, serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  <h1 style="font-size: 28px; font-weight: normal; margin-bottom: 24px;">Payment Receipt</h1>
  
  <p style="font-size: 16px; margin-bottom: 24px;">
    Thank you for your payment. Here are the details of your transaction:
  </p>
  
  <div style="background: #f5f2ed; padding: 24px; border-radius: 12px; margin: 24px 0;">
    <table style="width: 100%; border-collapse: collapse; font-size: 16px;">
      <tr>
        <td style="padding: 8px 0; color: #666;">Plan</td>
        <td style="padding: 8px 0; text-align: right; font-weight: bold;">${details.planName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666;">Amount</td>
        <td style="padding: 8px 0; text-align: right; font-weight: bold;">$${formattedAmount}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666;">Next billing date</td>
        <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formattedDate}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666;">Payment date</td>
        <td style="padding: 8px 0; text-align: right;">${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
      </tr>
    </table>
  </div>
  
  <p style="font-size: 14px; color: #666; margin-top: 24px;">
    You can manage your subscription anytime from your <a href="https://theadoptedson.com/account/billing" style="color: #1a1a1a;">account settings</a>.
  </p>
  
  <p style="font-size: 14px; color: #666; margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
    Questions about your payment? Simply reply to this email.<br>
    <a href="https://theadoptedson.com" style="color: #1a1a1a;">theadoptedson.com</a>
  </p>
</body>
</html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send payment receipt email:', error)
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
    While you're here, we'd love to invite you to create a free account. With an account you can save your favorite devotionals, track your reading, and access exclusive subscriber content.
  </p>

  <div style="background: #f5f2ed; padding: 28px; border-radius: 12px; margin: 0 0 32px 0;">
    <h3 style="font-size: 18px; font-weight: bold; margin: 0 0 12px 0;">What you get with an account:</h3>
    <ul style="margin: 0; padding-left: 20px; font-size: 15px; color: #333;">
      <li style="margin-bottom: 8px;">Free 14-day trial of all premium content</li>
      <li style="margin-bottom: 8px;">Save and bookmark devotionals</li>
      <li style="margin-bottom: 8px;">Full access to the devotional archive</li>
      <li style="margin-bottom: 8px;">Ad-free reading experience</li>
    </ul>
  </div>

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

  <div style="background: #f5f2ed; padding: 28px; border-radius: 12px; margin: 24px 0;">
    <h3 style="font-size: 17px; font-weight: bold; margin: 0 0 12px 0;">Start with a free account:</h3>
    <ul style="margin: 0; padding-left: 20px; font-size: 15px; color: #333;">
      <li style="margin-bottom: 8px;">Free 14-day trial of all premium content</li>
      <li style="margin-bottom: 8px;">New devotionals delivered to your inbox</li>
      <li style="margin-bottom: 8px;">Save and bookmark your favorites</li>
    </ul>
  </div>

  <a href="https://theadoptedson.com/auth/sign-up" style="display: inline-block; background: #1a1a1a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; margin-bottom: 16px;">
    Create a Free Account
  </a>

  <p style="font-size: 14px; color: #999; margin-top: 8px;">
    Already have an account? <a href="https://theadoptedson.com/auth/login" style="color: #555;">Sign in here</a>.
  </p>

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

export async function sendTrialEndingSoonEmail(email: string, daysLeft: number) {
  try {
    await resend.emails.send({
      from: ACCOUNTS_EMAIL,
      to: email,
      subject: `Your Trial Ends in ${daysLeft} Days — The Adopted Son`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Georgia, serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  <h1 style="font-size: 28px; font-weight: normal; margin-bottom: 24px;">Your Trial Ends Soon</h1>
  
  <p style="font-size: 16px; margin-bottom: 16px;">
    Just a friendly reminder — your free trial ends in <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong>.
  </p>
  
  <p style="font-size: 16px; margin-bottom: 16px;">
    We hope the devotionals have been a blessing to you. Subscribe now to continue your journey with uninterrupted access to all content.
  </p>
  
  <div style="background: #f5f2ed; padding: 24px; border-radius: 12px; margin: 32px 0;">
    <p style="font-size: 18px; margin: 0 0 8px 0; font-weight: bold;">Plans start at just $2.99/month</p>
    <p style="font-size: 14px; color: #666; margin: 0;">Or save 58% with our annual plan at $14.99/year</p>
  </div>
  
  <a href="https://theadoptedson.com/pricing" style="display: inline-block; background: #1a1a1a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px;">
    Subscribe Now
  </a>
  
  <p style="font-size: 14px; color: #666; margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
    Questions? Simply reply to this email.<br>
    <a href="https://theadoptedson.com" style="color: #1a1a1a;">theadoptedson.com</a>
  </p>
</body>
</html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send trial ending email:', error)
    return { success: false, error }
  }
}
