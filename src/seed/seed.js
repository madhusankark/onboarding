const dotenv = require('dotenv');
dotenv.config();
require('colors');

const connectDB = require('../config/db');
const { User } = require('../models/User');
const { Provider } = require('../models/Provider');
const Category = require('../models/Category');
const Booking = require('../models/Booking');
const { Document } = require('../models/Document');

const CATEGORIES = [
  { name: 'Home Cleaning', slug: 'home-cleaning', icon: 'cleaning', description: 'Deep cleaning, regular housekeeping and maid services.', order: 1 },
  { name: 'Plumbing', slug: 'plumbing', icon: 'plumbing', description: 'Pipe fitting, leak repair, water heater installation.', order: 2 },
  { name: 'Electrical', slug: 'electrical', icon: 'electrical', description: 'Wiring, switchboards, appliance installation and repair.', order: 3 },
  { name: 'Carpentry', slug: 'carpentry', icon: 'carpentry', description: 'Furniture assembly, custom woodwork, repairs.', order: 4 },
  { name: 'Painting', slug: 'painting', icon: 'painting', description: 'Interior/exterior painting, texture and polish work.', order: 5 },
  { name: 'AC & Appliance Repair', slug: 'ac-appliance-repair', icon: 'appliance', description: 'AC servicing, fridge, washing machine and TV repair.', order: 6 },
  { name: 'Beauty & Salon', slug: 'beauty-salon', icon: 'beauty', description: 'Salon at home: haircut, facial, waxing, makeup.', order: 7 },
  { name: 'Pest Control', slug: 'pest-control', icon: 'pest', description: 'Cockroach, mosquito, rodent and termite control.', order: 8 }
];

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'm115@224';
const CUSTOMER_PASSWORD = process.env.DEMO_CUSTOMER_PASSWORD || 'Customer@123';
const PROVIDER_PASSWORD = process.env.DEMO_PROVIDER_PASSWORD || 'Provider@123';

const seed = async () => {
  await connectDB();
  console.log('Seeding rich dummy test data for Urban Company portal...'.cyan);

  // 1. Upsert Categories
  const categoryDocs = [];
  for (const cat of CATEGORIES) {
    const doc = await Category.findOneAndUpdate({ slug: cat.slug }, { $set: cat }, { upsert: true, new: true });
    categoryDocs.push(doc);
  }
  console.log(`Seeded ${categoryDocs.length} categories`.green);

  const getCatId = (slug) => {
    const found = categoryDocs.find((c) => c.slug === slug);
    return found ? found._id : categoryDocs[0]._id;
  };

  // 2. Admin User
  let admin = await User.findOne({ email: ADMIN_EMAIL });
  if (!admin) {
    admin = await User.create({
      name: 'System Operations Admin',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin'
    });
    console.log(`Created Admin account: ${ADMIN_EMAIL}`.green);
  } else {
    admin.password = ADMIN_PASSWORD;
    await admin.save();
    console.log(`Verified Admin account: ${ADMIN_EMAIL}`.yellow);
  }

  // 3. Customer Accounts
  const CUSTOMERS_DATA = [
    { name: 'Urban Customer', email: 'customer@gmail.com', password: CUSTOMER_PASSWORD },
    { name: 'Priya Sharma', email: 'priya.sharma@gmail.com', password: CUSTOMER_PASSWORD },
    { name: 'Rohit Verma', email: 'rohit.verma@gmail.com', password: CUSTOMER_PASSWORD }
  ];

  const customerUsers = [];
  for (const cData of CUSTOMERS_DATA) {
    let cUser = await User.findOne({ email: cData.email });
    if (!cUser) {
      cUser = await User.create({
        name: cData.name,
        email: cData.email,
        password: cData.password,
        role: 'customer'
      });
    }
    customerUsers.push(cUser);
  }
  console.log(`Seeded ${customerUsers.length} customer test accounts`.green);

  // 4. Provider Test Cases — Approved providers for ALL categories
  const PROVIDERS_DATA = [
    // ── PLUMBING ──────────────────────────────────────────────────────
    {
      name: 'Rahul Sharma',
      email: 'rahul.plumber@example.com', password: PROVIDER_PASSWORD,
      phone: '+91 98765 11111', city: 'Vijayawada', address: 'Plot 45, PVR Ripples Road',
      categories: [getCatId('plumbing'), getCatId('electrical')],
      skills: ['Pipe Leak Repair', 'Switchboard Wiring', 'Geyser Installation', 'Tap Fitting'],
      experienceYears: 6, experienceSummary: '6 years experience with 1500+ customer jobs completed.',
      serviceLocations: ['PVR Ripples', 'MG Road', 'Benz Circle', 'Vijayawada'],
      status: 'approved', profileCompletion: 100,
      submittedAt: new Date(Date.now() - 7 * 86400000), reviewedAt: new Date(Date.now() - 5 * 86400000)
    },
    {
      name: 'Mohan Plumbing Works',
      email: 'mohan.plumb@example.com', password: PROVIDER_PASSWORD,
      phone: '+91 98123 11222', city: 'Vijayawada', address: 'Governorpet, Vijayawada',
      categories: [getCatId('plumbing')],
      skills: ['Drainage Unblocking', 'Bathroom Fitting', 'Overhead Tank Repair', 'Shower Installation'],
      experienceYears: 8, experienceSummary: '8 years plumbing specialist for residential and commercial projects in Vijayawada.',
      serviceLocations: ['Governorpet', 'Benz Circle', 'PVR Ripples'],
      status: 'approved', profileCompletion: 100,
      submittedAt: new Date(Date.now() - 10 * 86400000), reviewedAt: new Date(Date.now() - 8 * 86400000)
    },

    // ── ELECTRICAL ───────────────────────────────────────────────────
    {
      name: 'Kiran Electrician',
      email: 'kiran.electrician@example.com', password: PROVIDER_PASSWORD,
      phone: '+91 98765 66666', city: 'Vijayawada', address: 'Near Benz Circle',
      categories: [getCatId('electrical')],
      skills: ['MCB Tripping Repair', 'Short Circuit Fix', 'Fan Installation', 'Inverter Wiring'],
      experienceYears: 7, experienceSummary: 'Licensed master electrician with 7+ years of residential wiring experience.',
      serviceLocations: ['Benz Circle', 'PVR Ripples', 'Vijayawada'],
      status: 'approved', profileCompletion: 100,
      submittedAt: new Date(Date.now() - 12 * 86400000), reviewedAt: new Date(Date.now() - 9 * 86400000)
    },
    {
      name: 'Srinivas Electrical Works',
      email: 'srini.elec@example.com', password: PROVIDER_PASSWORD,
      phone: '+91 90123 44556', city: 'Vijayawada', address: 'MG Road, Vijayawada',
      categories: [getCatId('electrical')],
      skills: ['Smart MCB Fitting', 'CCTV Wiring', 'LED Light Installation', 'Ceiling Fan Replacement'],
      experienceYears: 5, experienceSummary: 'Smart home wiring expert with CPRI certification.',
      serviceLocations: ['MG Road', 'Governorpet', 'PVR Ripples'],
      status: 'approved', profileCompletion: 100,
      submittedAt: new Date(Date.now() - 9 * 86400000), reviewedAt: new Date(Date.now() - 7 * 86400000)
    },

    // ── AC & APPLIANCE REPAIR ────────────────────────────────────────
    {
      name: 'Venkat AC Specialist',
      email: 'venkat.ac@example.com', password: PROVIDER_PASSWORD,
      phone: '+91 98765 77777', city: 'Vijayawada', address: 'MG Road Center',
      categories: [getCatId('ac-appliance-repair')],
      skills: ['Foam-Jet AC Service', 'Copper Pipe Gas Charging', 'PCB Board Repair', 'Split AC Installation'],
      experienceYears: 9, experienceSummary: 'Senior HVAC engineer certified by Daikin & Voltas for all AC models.',
      serviceLocations: ['MG Road', 'PVR Ripples', 'Vijayawada'],
      status: 'approved', profileCompletion: 100,
      submittedAt: new Date(Date.now() - 15 * 86400000), reviewedAt: new Date(Date.now() - 11 * 86400000)
    },
    {
      name: 'Ravi Appliance Care',
      email: 'ravi.appliance@example.com', password: PROVIDER_PASSWORD,
      phone: '+91 91234 77889', city: 'Vijayawada', address: 'Benz Circle Extension',
      categories: [getCatId('ac-appliance-repair')],
      skills: ['Refrigerator Gas Recharge', 'Washing Machine Repair', 'Microwave Oven Fix', 'Water Purifier Service'],
      experienceYears: 6, experienceSummary: '6 years home appliance repair specialist; 800+ jobs completed.',
      serviceLocations: ['Benz Circle', 'PVR Ripples', 'Governorpet'],
      status: 'approved', profileCompletion: 100,
      submittedAt: new Date(Date.now() - 11 * 86400000), reviewedAt: new Date(Date.now() - 9 * 86400000)
    },

    // ── HOME CLEANING ────────────────────────────────────────────────
    {
      name: 'Meena House Cleaning',
      email: 'meena.cleaning@example.com', password: PROVIDER_PASSWORD,
      phone: '+91 98765 88888', city: 'Vijayawada', address: 'Governorpet, Vijayawada',
      categories: [getCatId('home-cleaning')],
      skills: ['Full Home Deep Cleaning', 'Kitchen Degreasing', 'Bathroom Scrubbing', 'Sofa Shampooing'],
      experienceYears: 5, experienceSummary: 'Lead housekeeping supervisor trained in eco-friendly steam sanitization.',
      serviceLocations: ['Governorpet', 'Benz Circle', 'PVR Ripples'],
      status: 'approved', profileCompletion: 100,
      submittedAt: new Date(Date.now() - 14 * 86400000), reviewedAt: new Date(Date.now() - 10 * 86400000)
    },
    {
      name: 'CleanPro Services',
      email: 'cleanpro@example.com', password: PROVIDER_PASSWORD,
      phone: '+91 92345 88901', city: 'Vijayawada', address: 'PVR Ripples Road, Vijayawada',
      categories: [getCatId('home-cleaning')],
      skills: ['Bathroom Tile Scrubbing', 'Sofa Dry Cleaning', 'Mattress Disinfection', 'Window Glass Cleaning'],
      experienceYears: 4, experienceSummary: 'Hospital-grade sanitization team with trained female cleaning professionals.',
      serviceLocations: ['PVR Ripples', 'MG Road', 'Vijayawada Junction'],
      status: 'approved', profileCompletion: 100,
      submittedAt: new Date(Date.now() - 8 * 86400000), reviewedAt: new Date(Date.now() - 6 * 86400000)
    },

    // ── BEAUTY & SALON ───────────────────────────────────────────────
    {
      name: 'Anita Rao',
      email: 'anita.beauty@example.com', password: PROVIDER_PASSWORD,
      phone: '+91 98765 22222', city: 'Vijayawada', address: 'Benz Circle, Vijayawada',
      categories: [getCatId('beauty-salon')],
      skills: ['Pedicure & Manicure', 'Facial & Cleanup', 'Hair Care & Styling', 'Bridal Makeup'],
      experienceYears: 8, experienceSummary: 'Certified salon specialist from Lakme Institute with 8 years home salon expertise.',
      serviceLocations: ['Benz Circle', 'PVR Ripples', 'Governorpet'],
      status: 'approved', profileCompletion: 100,
      submittedAt: new Date(Date.now() - 10 * 86400000), reviewedAt: new Date(Date.now() - 8 * 86400000)
    },
    {
      name: 'Divya Beauty Studio',
      email: 'divya.beauty@example.com', password: PROVIDER_PASSWORD,
      phone: '+91 93456 22333', city: 'Vijayawada', address: 'MG Road, Vijayawada',
      categories: [getCatId('beauty-salon')],
      skills: ['RICA Waxing', 'Keratin Hair Treatment', 'D-Tan Cleanup', 'Eyebrow Threading'],
      experienceYears: 6, experienceSummary: 'Home salon expert with Jawed Habib certification. Specializes in bridal packages.',
      serviceLocations: ['MG Road', 'Benz Circle', 'PVR Ripples'],
      status: 'approved', profileCompletion: 100,
      submittedAt: new Date(Date.now() - 6 * 86400000), reviewedAt: new Date(Date.now() - 5 * 86400000)
    },
    {
      name: 'Preethi Salon at Home',
      email: 'preethi.salon@example.com', password: PROVIDER_PASSWORD,
      phone: '+91 94567 33444', city: 'Vijayawada', address: 'Governorpet Extension',
      categories: [getCatId('beauty-salon')],
      skills: ["Men's Haircut & Grooming", "Head Massage", "Anti-Dandruff Treatment", "Beard Trim & Style"],
      experienceYears: 5, experienceSummary: 'Unisex grooming specialist. 1200+ satisfied clients across Vijayawada.',
      serviceLocations: ['Governorpet', 'Benz Circle', 'Vijayawada'],
      status: 'approved', profileCompletion: 100,
      submittedAt: new Date(Date.now() - 7 * 86400000), reviewedAt: new Date(Date.now() - 6 * 86400000)
    },

    // ── PEST CONTROL ─────────────────────────────────────────────────
    {
      name: 'Sunil Pest Experts',
      email: 'sunil.pest@example.com', password: PROVIDER_PASSWORD,
      phone: '+91 98765 54321', city: 'Vijayawada', address: 'Governorpet',
      categories: [getCatId('pest-control')],
      skills: ['Odorless Cockroach Gel', 'Termite Treatment', 'Bed Bug Heat Treatment', 'Ant Control'],
      experienceYears: 4, experienceSummary: 'Government certified pest control technician using herbal non-toxic sprays.',
      serviceLocations: ['Governorpet', 'PVR Ripples', 'Benz Circle'],
      status: 'approved', profileCompletion: 100,
      submittedAt: new Date(Date.now() - 5 * 86400000), reviewedAt: new Date(Date.now() - 4 * 86400000)
    },

    // ── PAINTING ─────────────────────────────────────────────────────
    {
      name: 'Prakash Painter',
      email: 'prakash.painter@example.com', password: PROVIDER_PASSWORD,
      phone: '+91 98765 99999', city: 'Vijayawada', address: 'PVR Ripples, Vijayawada',
      categories: [getCatId('painting')],
      skills: ['Waterproof Coating', 'Asian Paints Texture', 'Interior Room Polish', 'Wall Putty Finish'],
      experienceYears: 10, experienceSummary: 'Master painter with 10 years experience delivering dust-free machine painting.',
      serviceLocations: ['PVR Ripples', 'Benz Circle', 'MG Road'],
      status: 'approved', profileCompletion: 100,
      submittedAt: new Date(Date.now() - 20 * 86400000), reviewedAt: new Date(Date.now() - 15 * 86400000)
    },

    // ── CARPENTRY ────────────────────────────────────────────────────
    {
      name: 'Ramesh Woodworks',
      email: 'ramesh.carpenter@example.com', password: PROVIDER_PASSWORD,
      phone: '+91 98765 12345', city: 'Vijayawada', address: 'Benz Circle, Vijayawada',
      categories: [getCatId('carpentry')],
      skills: ['Custom Wardrobe Repair', 'Door Lock Installation', 'Modular Kitchen Hinge Fix', 'TV Unit Assembly'],
      experienceYears: 6, experienceSummary: '6 years furniture craftsmanship and custom wooden fitting specialist.',
      serviceLocations: ['Benz Circle', 'PVR Ripples', 'Vijayawada'],
      status: 'approved', profileCompletion: 100,
      submittedAt: new Date(Date.now() - 8 * 86400000), reviewedAt: new Date(Date.now() - 6 * 86400000)
    },

    // ── PENDING / REJECTED / DRAFT (for admin demo) ───────────────────
    {
      name: 'Suresh Kumar',
      email: 'suresh.ac@example.com', password: PROVIDER_PASSWORD,
      phone: '+91 98765 33333', city: 'Vijayawada', address: 'Door 12-4, Benz Circle',
      categories: [getCatId('ac-appliance-repair')],
      skills: ['Foam-jet AC Service', 'Gas Leakage Fix', 'Compressor Repair', 'Washing Machine Servicing'],
      experienceYears: 4, experienceSummary: 'HVAC certified technician specializing in split and window AC servicing.',
      serviceLocations: ['Benz Circle', 'PVR Ripples', 'Governorpet'],
      status: 'pending', profileCompletion: 85, submittedAt: new Date(Date.now() - 1 * 86400000)
    },
    {
      name: 'Vikram Singh',
      email: 'vikram.clean@example.com', password: PROVIDER_PASSWORD,
      phone: '+91 98765 44444', city: 'Vijayawada', address: 'Governorpet',
      categories: [getCatId('home-cleaning'), getCatId('pest-control')],
      skills: ['Bathroom Deep Cleaning', 'Sofa Shampooing', 'Cockroach Control'],
      experienceYears: 2, experienceSummary: '2 years experience in residential deep cleaning.',
      serviceLocations: ['Governorpet', 'PVR Ripples'],
      status: 'rejected',
      rejectionRemarks: 'Government Aadhaar ID copy is blurry. Please re-upload a clear scanned copy.',
      profileCompletion: 65, submittedAt: new Date(Date.now() - 3 * 86400000), reviewedAt: new Date(Date.now() - 2 * 86400000)
    },
    {
      name: 'Amit Patel',
      email: 'amit.carpenter@example.com', password: PROVIDER_PASSWORD,
      phone: '+91 98765 55555', city: 'Vijayawada', address: 'MG Road, Vijayawada',
      categories: [getCatId('carpentry')],
      skills: ['Furniture Assembly', 'Door Lock Fitting', 'Cabinet Repair'],
      experienceYears: 1, experienceSummary: 'General woodwork and home furniture assembly specialist.',
      serviceLocations: ['MG Road', 'Vijayawada'],
      status: 'draft', profileCompletion: 35
    }
  ];

  const providerDocs = [];
  for (const pData of PROVIDERS_DATA) {
    let pUser = await User.findOne({ email: pData.email });
    if (!pUser) {
      pUser = await User.create({
        name: pData.name,
        email: pData.email,
        password: pData.password,
        role: 'provider'
      });
    }

    const providerProfile = await Provider.findOneAndUpdate(
      { user: pUser._id },
      {
        $set: {
          phone: pData.phone,
          city: pData.city,
          address: pData.address,
          categories: pData.categories,
          skills: pData.skills,
          experienceYears: pData.experienceYears,
          experienceSummary: pData.experienceSummary,
          serviceLocations: pData.serviceLocations,
          status: pData.status,
          rejectionRemarks: pData.rejectionRemarks || '',
          profileCompletion: pData.profileCompletion,
          submittedAt: pData.submittedAt || null,
          reviewedAt: pData.reviewedAt || null,
          profilePhoto: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80`
        }
      },
      { upsert: true, new: true }
    );
    providerDocs.push(providerProfile);

    // Seed dummy document records for provider verification lightbox
    await Document.deleteMany({ user: pUser._id });
    await Document.create([
      {
        user: pUser._id,
        documentType: 'government_id',
        label: 'Aadhaar Card Front & Back',
        filename: 'aadhaar_card.png',
        filePath: `${pUser._id}/aadhaar_card.png`,
        url: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80',
        mimeType: 'image/png',
        size: 245000,
        status: pData.status === 'rejected' ? 'rejected' : 'verified',

        adminRemark: pData.status === 'rejected' ? pData.rejectionRemarks : ''
      },
      {
        user: pUser._id,
        documentType: 'address_proof',
        label: 'Electricity Bill',
        filename: 'electricity_bill.pdf',
        filePath: `${pUser._id}/electricity_bill.pdf`,
        url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
        mimeType: 'application/pdf',
        size: 512000,
        status: 'verified'

      }
    ]);
  }
  console.log(`Seeded ${providerDocs.length} service provider test profiles (Approved, Pending, Rejected, Draft)`.green);

  // 5. Customer Bookings / Orders & Job Leads
  await Booking.deleteMany({});
  const rahulProv = providerDocs.find((p) => p.phone === '+91 98765 11111');
  const anitaProv = providerDocs.find((p) => p.phone === '+91 98765 22222');

  const BOOKINGS_DATA = [
    {
      customer: customerUsers[0]._id,
      customerName: customerUsers[0].name,
      customerPhone: '+91 98765 43210',
      provider: rahulProv._id,
      serviceName: 'Foam-jet AC Service & Repair',
      category: 'AC & Appliance Repair',
      price: 799,
      location: 'PVR Ripples, Vijayawada',
      date: '2026-08-05',
      timeSlot: '10:00 AM - 12:00 PM',
      status: 'assigned'
    },
    {
      customer: customerUsers[0]._id,
      customerName: customerUsers[0].name,
      customerPhone: '+91 98765 43210',
      provider: anitaProv._id,
      serviceName: 'Luxury Salon Pedicure & Facial Package',
      category: 'Beauty & Salon',
      price: 1299,
      location: 'Benz Circle, Vijayawada',
      date: '2026-08-06',
      timeSlot: '02:00 PM - 04:00 PM',
      status: 'in_progress'
    },
    {
      customer: customerUsers[1]._id,
      customerName: customerUsers[1].name,
      customerPhone: '+91 91234 56789',
      provider: rahulProv._id,
      serviceName: 'Bathroom Leakage & Tap Replacement',
      category: 'Plumbing',
      price: 499,
      location: 'Madhapur, Hyderabad',
      date: '2026-08-03',
      timeSlot: '11:00 AM - 01:00 PM',
      status: 'completed'
    },
    {
      customer: customerUsers[2]._id,
      customerName: customerUsers[2].name,
      customerPhone: '+91 99887 76655',
      provider: null,
      serviceName: 'Full House Deep Cleaning & Sanitization',
      category: 'Home Cleaning',
      price: 2499,
      location: 'Koramangala, Bengaluru',
      date: '2026-08-07',
      timeSlot: '09:00 AM - 01:00 PM',
      status: 'pending'
    }
  ];

  await Booking.insertMany(BOOKINGS_DATA);
  console.log(`Seeded ${BOOKINGS_DATA.length} customer bookings & provider job leads`.green);

  console.log('\n======================================================'.yellow.bold);
  console.log('🎉 DUMMY TEST DATA SEEDING COMPLETE!'.green.bold);
  console.log('======================================================'.yellow.bold);
  console.log('🔑 Credentials Configured via Environment Variables:');
  console.log(`  🛡️ Admin Login:     ${ADMIN_EMAIL}`);
  console.log('  👤 Customer Login:  customer@gmail.com');
  console.log('  🟢 Approved Partner: rahul.plumber@example.com');
  console.log('======================================================\n'.yellow.bold);

  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:'.red, err);
  process.exit(1);
});