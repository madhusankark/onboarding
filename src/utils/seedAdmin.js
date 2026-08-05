const { User } = require('../models/User');

const seedAdminUser = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecret@123';

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      await User.create({
        name: process.env.ADMIN_NAME || 'System Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isActive: true
      });
      console.log(`Admin Account verified for ${adminEmail}`.green.bold);
    } else {
      admin.password = adminPassword;
      admin.role = 'admin';
      await admin.save();
      console.log(`Admin Account credentials synced for ${adminEmail}`.green.bold);
    }
  } catch (err) {
    console.error('Error seeding admin account:', err.message);
  }
};

module.exports = seedAdminUser;
