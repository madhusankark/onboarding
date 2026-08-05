const { User } = require('../models/User');

const seedAdminUser = async () => {
  try {
    let admin = await User.findOne({ email: 'admin@gmail.com' });
    if (!admin) {
      await User.create({
        name: 'System Admin',
        email: 'admin@gmail.com',
        password: 'm115@224',
        role: 'admin',
        isActive: true
      });
      console.log('Default Admin Account seeded: admin@gmail.com / m115@224'.green.bold);
    } else {
      admin.password = 'm115@224';
      admin.role = 'admin';
      await admin.save();
      console.log('Default Admin Account updated: admin@gmail.com / m115@224'.green.bold);
    }
  } catch (err) {
    console.error('Error seeding admin account:', err.message);
  }
};

module.exports = seedAdminUser;
