const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_SECURE || 'true') === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

async function sendOtpEmail(toEmail, toName, code, purpose) {
  const subject = purpose === 'register'
    ? 'Verify your email — Capacity Connect'
    : 'Your sign-in code — Capacity Connect';
  const action = purpose === 'register' ? 'complete your registration' : 'sign in';
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: toEmail,
    subject,
    text: `Hello ${toName},\n\nYour verification code is: ${code}\n\nEnter this code to ${action}. It expires in 5 minutes.\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>Hello ${toName},</p>
      <p>Your verification code is:</p>
      <p style="font-size:28px; font-weight:700; letter-spacing:6px">${code}</p>
      <p>Enter this code to ${action}. It expires in <b>5 minutes</b>.</p>
      <p style="color:#667">If you did not request this, you can ignore this email.</p>`
  });
}

async function sendPasswordNotice(toEmail, toName, tempPassword) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: toEmail,
    subject: 'Your administrator account — Capacity Connect',
    text: `Hello ${toName},\n\nAn administrator account was created for ${toEmail}.\nTemporary password: ${tempPassword}\n\nLog in and change this password immediately.`,
    html: `<p>Hello ${toName},</p><p>An administrator account was created for <b>${toEmail}</b>.</p>
      <p>Temporary password: <b>${tempPassword}</b></p>
      <p>Log in and change this password immediately.</p>`
  });
}

module.exports = { sendOtpEmail, sendPasswordNotice };
