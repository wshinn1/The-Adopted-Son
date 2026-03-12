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
