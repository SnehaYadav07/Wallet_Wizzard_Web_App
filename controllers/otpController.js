const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
// Forgot password
const forgot_password= async (req, res) => {
    const { email } = req.body;
  
    try {
      
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      
      const resetToken = jwt.sign({ userId: user._id }, 'secret', { expiresIn: '1h' });
      // Save the reset token to the user document
      user.resetToken = resetToken;
      await user.save();
  
      // Send password reset email to the user
      const transporter = nodemailer.createTransport({
        // Configure your email provider here
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
      });
  
      const mailOptions = {
        from: "Wallet Wizard",
        to: email,
        subject: 'Password Reset Link',
        html: `
          <p>Hello ${user.username},</p>
          <p>You have requested to reset your password. Please click the following link to proceed:</p>
          <a href="http://localhost:3000/reset-password/${resetToken}">Reset Password</a>
        `,
      };
  
      await transporter.sendMail(mailOptions);
  
      res.json({ message: 'Password reset email sent' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  // Reset password
  const reset_password= async (req, res) => {
    const { resetToken, newPassword } = req.body;
  
    try {
      // Verify the reset token
      const decodedToken = jwt.verify(resetToken, 'secret');
      if (!decodedToken) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }
  
      // Find the user associated with the reset token
      const user = await User.findOne({ _id: decodedToken.userId, resetToken });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
  
      // Update the user's password and reset token
      user.password = hashedPassword;
      user.resetToken = undefined;
      await user.save();
  
      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  module.exports ={forgot_password,reset_password};