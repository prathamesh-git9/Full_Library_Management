const nodemailer = require('nodemailer');
const config = require('../config');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: config.EMAIL_HOST,
    port: config.EMAIL_PORT,
    secure: config.EMAIL_PORT === 465, // true for 465, false for other ports
    auth: {
      user: config.EMAIL_USER,
      pass: config.EMAIL_PASS
    }
  });
};

// Email templates
const emailTemplates = {
  dueDateReminder: (userName, bookTitle, dueDate) => ({
    subject: '📚 Book Due Date Reminder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">📚 Library Management System</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${userName}!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            This is a friendly reminder that your borrowed book <strong>"${bookTitle}"</strong> is due on <strong>${new Date(dueDate).toLocaleDateString()}</strong>.
          </p>
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>⚠️ Important:</strong> Please return the book on time to avoid late fees.
            </p>
          </div>
          <p style="color: #666; font-size: 14px;">
            If you need to renew the book, please visit the library or use our online system.
          </p>
        </div>
        <div style="background: #343a40; padding: 20px; text-align: center;">
          <p style="color: #adb5bd; margin: 0; font-size: 14px;">
            © 2024 Library Management System. All rights reserved.
          </p>
        </div>
      </div>
    `
  }),

  overdueNotice: (userName, bookTitle, daysOverdue, fineAmount) => ({
    subject: '🚨 Overdue Book Notice',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🚨 Overdue Notice</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${userName}!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Your borrowed book <strong>"${bookTitle}"</strong> is overdue by <strong>${daysOverdue} day${daysOverdue > 1 ? 's' : ''}</strong>.
          </p>
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #721c24;">
              <strong>💰 Fine Amount:</strong> $${fineAmount.toFixed(2)}
            </p>
          </div>
          <p style="color: #666; font-size: 14px;">
            Please return the book immediately to avoid additional charges. You can pay the fine at the library or through our online system.
          </p>
        </div>
        <div style="background: #343a40; padding: 20px; text-align: center;">
          <p style="color: #adb5bd; margin: 0; font-size: 14px;">
            © 2024 Library Management System. All rights reserved.
          </p>
        </div>
      </div>
    `
  }),

  reservationAvailable: (userName, bookTitle) => ({
    subject: '📖 Reserved Book Available',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #00b894 0%, #00a085 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">📖 Book Available</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${userName}!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Great news! The book you reserved <strong>"${bookTitle}"</strong> is now available for pickup.
          </p>
          <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #155724;">
              <strong>📅 Pickup Deadline:</strong> You have 3 days to pick up the book before the reservation expires.
            </p>
          </div>
          <p style="color: #666; font-size: 14px;">
            Please visit the library to collect your reserved book. If you have any questions, feel free to contact us.
          </p>
        </div>
        <div style="background: #343a40; padding: 20px; text-align: center;">
          <p style="color: #adb5bd; margin: 0; font-size: 14px;">
            © 2024 Library Management System. All rights reserved.
          </p>
        </div>
      </div>
    `
  }),

  welcomeEmail: (userName, role) => ({
    subject: '🎉 Welcome to Library Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🎉 Welcome!</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${userName}!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Welcome to our Library Management System! Your account has been successfully created with <strong>${role}</strong> privileges.
          </p>
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #0c5460;">
              <strong>📚 What you can do:</strong><br>
              • Browse and search books<br>
              • Borrow and return books<br>
              • Rate and review books<br>
              • Manage your account
            </p>
          </div>
          <p style="color: #666; font-size: 14px;">
            If you have any questions or need assistance, please don't hesitate to contact our support team.
          </p>
        </div>
        <div style="background: #343a40; padding: 20px; text-align: center;">
          <p style="color: #adb5bd; margin: 0; font-size: 14px;">
            © 2024 Library Management System. All rights reserved.
          </p>
        </div>
      </div>
    `
  }),

  passwordReset: (userName, resetLink) => ({
    subject: '🔐 Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fd79a8 0%, #e84393 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🔐 Password Reset</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${userName}!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            You requested a password reset for your Library Management System account.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>⚠️ Security Note:</strong> This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
            </p>
          </div>
        </div>
        <div style="background: #343a40; padding: 20px; text-align: center;">
          <p style="color: #adb5bd; margin: 0; font-size: 14px;">
            © 2024 Library Management System. All rights reserved.
          </p>
        </div>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (to, template, data) => {
  try {
    const transporter = createTransporter();
    const emailTemplate = emailTemplates[template](...data);
    
    const mailOptions = {
      from: config.EMAIL_FROM,
      to: to,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Send bulk emails
const sendBulkEmails = async (recipients, template, data) => {
  const results = [];
  
  for (const recipient of recipients) {
    const result = await sendEmail(recipient.email, template, [recipient.name, ...data]);
    results.push({
      email: recipient.email,
      success: result.success,
      error: result.error
    });
    
    // Add delay between emails to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
};

// Send due date reminders
const sendDueDateReminders = async (borrows) => {
  const results = [];
  
  for (const borrow of borrows) {
    if (borrow.user.email && borrow.user.preferences?.notifications?.email) {
      const result = await sendEmail(
        borrow.user.email,
        'dueDateReminder',
        [borrow.user.firstName, borrow.book.title, borrow.dueDate]
      );
      
      results.push({
        borrowId: borrow._id,
        userEmail: borrow.user.email,
        success: result.success,
        error: result.error
      });
    }
  }
  
  return results;
};

// Send overdue notices
const sendOverdueNotices = async (overdueBorrows) => {
  const results = [];
  
  for (const borrow of overdueBorrows) {
    if (borrow.user.email && borrow.user.preferences?.notifications?.email) {
      const daysOverdue = Math.ceil((new Date() - new Date(borrow.dueDate)) / (1000 * 60 * 60 * 24));
      const fineAmount = daysOverdue * config.FINE_PER_DAY;
      
      const result = await sendEmail(
        borrow.user.email,
        'overdueNotice',
        [borrow.user.firstName, borrow.book.title, daysOverdue, fineAmount]
      );
      
      results.push({
        borrowId: borrow._id,
        userEmail: borrow.user.email,
        success: result.success,
        error: result.error
      });
    }
  }
  
  return results;
};

// Send reservation available notifications
const sendReservationAvailable = async (reservations) => {
  const results = [];
  
  for (const reservation of reservations) {
    if (reservation.user.email && reservation.user.preferences?.notifications?.email) {
      const result = await sendEmail(
        reservation.user.email,
        'reservationAvailable',
        [reservation.user.firstName, reservation.book.title]
      );
      
      results.push({
        reservationId: reservation._id,
        userEmail: reservation.user.email,
        success: result.success,
        error: result.error
      });
    }
  }
  
  return results;
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
  if (user.email) {
    return await sendEmail(
      user.email,
      'welcomeEmail',
      [user.firstName, user.role]
    );
  }
  return { success: false, error: 'No email address provided' };
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetLink) => {
  if (user.email) {
    return await sendEmail(
      user.email,
      'passwordReset',
      [user.firstName, resetLink]
    );
  }
  return { success: false, error: 'No email address provided' };
};

// Test email configuration
const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    console.error('Email configuration test failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  sendBulkEmails,
  sendDueDateReminders,
  sendOverdueNotices,
  sendReservationAvailable,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  testEmailConfiguration
};
