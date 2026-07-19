import { db } from '../src/lib/db'

// Stylized coordinate system centered on a fictional business district "Meridian"
const CENTER = { lat: 28.6139, lng: 77.209 }

function jitter(base: number, amount: number) {
  return base + (Math.random() - 0.5) * amount
}

const categories = [
  { name: 'Hospitals', slug: 'hospitals', icon: 'Hospital', color: '#dc2626' },
  { name: 'Clinics', slug: 'clinics', icon: 'Stethoscope', color: '#db2777' },
  { name: 'Manufacturers', slug: 'manufacturers', icon: 'Factory', color: '#0f766e' },
  { name: 'Industrial Machinery', slug: 'industrial-machinery', icon: 'Cog', color: '#475569' },
  { name: 'Restaurants', slug: 'restaurants', icon: 'UtensilsCrossed', color: '#ea580c' },
  { name: 'Pharmacies', slug: 'pharmacies', icon: 'Pill', color: '#16a34a' },
  { name: 'Schools', slug: 'schools', icon: 'GraduationCap', color: '#7c3aed' },
  { name: 'Colleges', slug: 'colleges', icon: 'Building2', color: '#1d4ed8' },
  { name: 'Hotels', slug: 'hotels', icon: 'BedDouble', color: '#b45309' },
  { name: 'Wholesalers', slug: 'wholesalers', icon: 'Package', color: '#0891b2' },
  { name: 'Real Estate', slug: 'real-estate', icon: 'Building', color: '#be123c' },
  { name: 'Automotive', slug: 'automotive', icon: 'Car', color: '#1f2937' },
]

const img = (seed: string, w = 800, h = 600) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`

const businesses = [
  {
    name: 'Aarogya Multispecialty Hospital',
    tagline: 'Compassionate care, advanced medicine',
    description:
      'Aarogya Multispecialty Hospital is a 450-bed NABH-accredited facility delivering world-class care across cardiology, orthopedics, neurology, oncology and maternal health. With a 24x7 trauma center, 12 modular operation theaters and a dedicated transplant unit, we combine clinical excellence with human warmth.',
    category: 'Hospitals',
    verified: 'enterprise',
    rating: 4.7,
    reviewCount: 1284,
    area: 'Civil Lines',
    foundedYear: 1998,
    teamSize: '1000+',
    brandColor: '#dc2626',
    trending: true,
    featured: true,
    subCategories: ['Cardiology', 'Orthopedics', 'Neurology', 'Oncology', 'Pediatrics'],
    languages: ['English', 'Hindi', 'Punjabi'],
    paymentMethods: ['Cash', 'Card', 'UPI', 'Insurance', 'CGHS'],
    facilities: ['ICU', 'MRI', 'CT Scan', 'Pharmacy', 'Cafeteria', 'Parking', 'Ambulance'],
    deliveryOptions: ['Home sample collection', 'Teleconsultation'],
    certifications: ['NABH', 'ISO 9001:2015', 'NABL'],
    awards: ['Best Hospital 2023 — HealthCare Today', 'Excellence in Cardiac Care 2022'],
    promotion: { title: 'Free full-body health checkup', description: 'Comprehensive 64-parameter checkup on OPD visits above ₹2000', expires: '2025-12-31' },
    products: [] as any[],
    services: [
      { name: '24x7 Emergency & Trauma Care', pricing: 'From ₹1,500 consultation', duration: 'Round the clock', coverageArea: 'Citywide', deliverables: ['Immediate triage', 'Diagnostics', 'Stabilization'] },
      { name: 'Cardiac Catheterization', pricing: '₹45,000 – ₹1,80,000', duration: '1–3 hours', coverageArea: 'On-site', deliverables: ['Angiogram', 'Angioplasty', 'Stenting'] },
      { name: 'Joint Replacement Surgery', pricing: '₹1,80,000 – ₹3,50,000', duration: '2–4 hours + 5 day stay', coverageArea: 'On-site', deliverables: ['Total knee/hip replacement', 'Physiotherapy plan'] },
    ],
  },
  {
    name: 'Shakti Rice & Flour Mills',
    tagline: 'From grain to goodness since 1972',
    description:
      'Shakti Mills is a third-generation agro-processing enterprise producing premium rice, atta, besan and bespoke flour blends. Our automated 40 TPD plant services wholesalers, FMCG brands and export houses with consistent granularity, moisture control and hygiene-certified packaging.',
    category: 'Manufacturers',
    verified: 'premium',
    rating: 4.5,
    reviewCount: 318,
    area: 'Industrial Area Phase II',
    foundedYear: 1972,
    teamSize: '120',
    brandColor: '#0f766e',
    trending: true,
    featured: true,
    subCategories: ['Rice Milling', 'Flour Milling', 'Agro Processing', 'Packaged Foods'],
    languages: ['English', 'Hindi'],
    paymentMethods: ['Cash', 'UPI', 'NEFT', 'RTGS', 'Credit (verified buyers)'],
    facilities: ['40 TPD plant', 'Cold storage', 'Lab testing', 'Loading bay', 'GST warehouse'],
    deliveryOptions: ['Pan-India transport', 'Container export', 'FCL/LCL'],
    certifications: ['FSSAI', 'ISO 22000', 'APEDA Exporter'],
    awards: ['Top Agro Exporter 2023'],
    products: [
      { name: 'Sona Masoori Rice (Premium)', category: 'Rice', brand: 'Shakti Gold', priceMin: 52, priceMax: 58, availability: 'in_stock', featured: true, variants: ['5kg', '10kg', '25kg', '50kg'], specifications: [{ label: 'Grain length', value: '5.8mm' }, { label: 'Moisture', value: '<13%' }, { label: 'Broken', value: '<2%' }] },
      { name: 'Automatic Flour Mill Machine 30 TPD', category: 'Industrial Machinery', brand: 'Shakti Tech', priceMin: 1850000, priceMax: 2400000, availability: 'made_to_order', featured: true, variants: ['Chakki', 'Roller', 'Pulverizer'], specifications: [{ label: 'Capacity', value: '30 TPD' }, { label: 'Power', value: '75 kW' }, { label: 'Warranty', value: '2 years' }] },
      { name: 'Whole Wheat Atta (Stone Ground)', category: 'Flour', brand: 'Shakti Pure', priceMin: 38, priceMax: 44, availability: 'in_stock', variants: ['1kg', '5kg', '10kg', '30kg'], specifications: [{ label: 'Extraction', value: '95%' }, { label: 'Ash content', value: '<1.5%' }] },
      { name: 'Besan (Gram Flour)', category: 'Flour', brand: 'Shakti Pure', priceMin: 75, priceMax: 90, availability: 'low_stock', variants: ['500g', '1kg', '5kg'], specifications: [{ label: 'Protein', value: '22%' }] },
    ],
    services: [
      { name: 'Custom Flour Blending', pricing: 'On quote', duration: '3–7 days', coverageArea: 'Pan-India', deliverables: ['Formulation', 'Pilot batch', 'Production run'] },
    ],
  },
  {
    name: 'Nexus Precision Engineering',
    tagline: 'CNC machining for demanding industries',
    description:
      'Nexus Precision manufactures high-tolerance components for aerospace, defense and medical device OEMs. Our climate-controlled facility houses 5-axis machining centers, Swiss-type lathes and CMM inspection, enabling tolerances down to ±5 microns.',
    category: 'Industrial Machinery',
    verified: 'enterprise',
    rating: 4.8,
    reviewCount: 92,
    area: 'Industrial Area Phase I',
    foundedYear: 2008,
    teamSize: '80',
    brandColor: '#475569',
    featured: true,
    subCategories: ['CNC Machining', 'Fabrication', 'Tool Room', 'Quality Inspection'],
    languages: ['English'],
    paymentMethods: ['NEFT', 'RTGS', 'Letter of Credit'],
    facilities: ['5-axis CNC', 'Swiss lathe', 'CMM', 'EDM', 'Climate-controlled bay'],
    deliveryOptions: ['Pan-India', 'Export'],
    certifications: ['ISO 9001', 'AS9100D', 'ISO 13485'],
    awards: ['Aerospace Supplier of the Year 2022'],
    products: [
      { name: 'Stainless Steel Storage Tank 5000L', category: 'Tanks & Vessels', brand: 'NexusVessel', priceMin: 185000, priceMax: 320000, availability: 'made_to_order', featured: true, variants: ['SS304', 'SS316', 'Jacketed'], specifications: [{ label: 'Capacity', value: '5000 L' }, { label: 'Material', value: 'SS316L' }, { label: 'Pressure', value: '3 bar' }, { label: 'Finish', value: 'Mirror polish' }] },
      { name: 'Precision Machined Component (Custom)', category: 'Machined Parts', brand: 'Nexus', priceMin: 350, priceMax: 0, availability: 'made_to_order', variants: ['As per drawing'], specifications: [{ label: 'Tolerance', value: '±5 microns' }, { label: 'Material', value: 'Al / SS / Ti' }] },
    ],
    services: [
      { name: '5-Axis CNC Machining', pricing: 'From ₹1,200/hour', duration: '1–15 days', coverageArea: 'Global', deliverables: ['Finished parts', 'FAI report', 'CMM report'] },
      { name: 'Reverse Engineering', pricing: '₹15,000 – ₹80,000', duration: '3–7 days', coverageArea: 'Global', deliverables: ['3D model', 'Drawing pack', 'Prototype'] },
    ],
  },
  {
    name: 'Verde Pharmacy & Wellness',
    tagline: 'Your neighbourhood pharmacy, elevated',
    description:
      'Verde is a modern chain pharmacy combining prescription dispensing with nutrition, wellness and diagnostics. Cold-chain compliant, with 30-minute express delivery and pharmacist consultations via app.',
    category: 'Pharmacies',
    verified: 'verified',
    rating: 4.6,
    reviewCount: 542,
    area: 'Model Town',
    foundedYear: 2015,
    teamSize: '45',
    brandColor: '#16a34a',
    trending: true,
    subCategories: ['Retail Pharmacy', 'Wellness', 'Diagnostics', 'Surgical'],
    languages: ['English', 'Hindi'],
    paymentMethods: ['Cash', 'Card', 'UPI', 'Insurance'],
    facilities: ['Cold chain', 'Diagnostics lab', 'Drive-thru'],
    deliveryOptions: ['30-min express', 'Same day'],
    certifications: ['Drug License', 'FSSAI', 'ISO 9001'],
    products: [
      { name: 'Insulin Glargine 100IU/ml (3ml)', category: 'Medicine', brand: 'Glargine', priceMin: 720, priceMax: 880, availability: 'in_stock', featured: true, variants: ['3ml cartridge', '5ml vial'], specifications: [{ label: 'Storage', value: '2–8°C' }, { label: 'Schedule', value: 'H1' }] },
      { name: 'Multivitamin Daily Pack (30s)', category: 'Wellness', brand: 'Verde', priceMin: 249, priceMax: 349, availability: 'in_stock', variants: ['30s', '60s'], specifications: [{ label: 'Type', value: 'Vegetarian' }] },
    ],
    services: [
      { name: 'Home Sample Collection', pricing: 'From ₹299', duration: '30 min slot', coverageArea: '5 km radius', deliverables: ['Phlebotomy', 'Digital report in 6h'] },
    ],
  },
  {
    name: 'Meridian Global School',
    tagline: 'CBSE education with a global outlook',
    description:
      'Meridian Global School is a CBSE-affiliated K-12 institution blending rigorous academics with design thinking, robotics and the arts. Spread across a 12-acre green campus with smart classrooms, STEM labs and sports academies.',
    category: 'Schools',
    verified: 'premium',
    rating: 4.5,
    reviewCount: 388,
    area: 'Knowledge Park',
    foundedYear: 2004,
    teamSize: '220',
    brandColor: '#7c3aed',
    featured: true,
    subCategories: ['CBSE', 'Primary', 'Senior Secondary', 'Sports Academy'],
    languages: ['English', 'Hindi'],
    paymentMethods: ['Cash', 'Cheque', 'NEFT', 'UPI'],
    facilities: ['Smart classrooms', 'STEM labs', 'Sports complex', 'Library', 'Transport'],
    deliveryOptions: ['Bus routes'],
    certifications: ['CBSE Affiliated', 'ISO 21001'],
    awards: ['Excellence in STEM Education 2023'],
    products: [] as any[],
    services: [
      { name: 'Admissions 2025-26 (Grades Pre-Nursery – XI)', pricing: 'Fee ₹84,000 – ₹1,65,000/year', duration: 'Annual', coverageArea: 'Citywide bus', deliverables: ['Enrollment', 'ID', 'Kit'] },
    ],
  },
  {
    name: 'Saffron & Sage Restaurant',
    tagline: 'Modern Indian, rooted in tradition',
    description:
      'Saffron & Sage is a chef-driven fine-dining restaurant reimagining regional Indian cuisine through seasonal tasting menus and an open charcoal kitchen. Award-winning wine pairing and private dining.',
    category: 'Restaurants',
    verified: 'verified',
    rating: 4.7,
    reviewCount: 961,
    area: 'Hospitality District',
    foundedYear: 2019,
    teamSize: '60',
    brandColor: '#ea580c',
    trending: true,
    subCategories: ['Fine Dining', 'Indian', 'Bar'],
    languages: ['English', 'Hindi'],
    paymentMethods: ['Cash', 'Card', 'UPI'],
    facilities: ['Private dining', 'Bar', 'Valet', 'Wheelchair access'],
    deliveryOptions: ['In-house', 'Delivery partners'],
    certifications: ['FSSAI'],
    awards: ['Top 50 Restaurants 2023'],
    products: [] as any[],
    services: [
      { name: 'Tasting Menu (7 courses)', pricing: '₹3,500 per person', duration: '2 hours', coverageArea: 'On-site', deliverables: ['Curated menu', 'Wine pairing optional'] },
    ],
  },
  {
    name: 'The Grand Meridian Hotel',
    tagline: 'Five-star hospitality in the heart of the city',
    description:
      'A 220-key luxury hotel with skyline views, a rooftop infinity pool, award-winning spa and 14,000 sq.ft of banqueting. Member of Leading Hotels of the World.',
    category: 'Hotels',
    verified: 'enterprise',
    rating: 4.8,
    reviewCount: 2104,
    area: 'Central Avenue',
    foundedYear: 2011,
    teamSize: '400',
    brandColor: '#b45309',
    featured: true,
    subCategories: ['Luxury Hotel', 'Banquets', 'Spa'],
    languages: ['English', 'Hindi', 'French'],
    paymentMethods: ['Cash', 'Card', 'UPI', 'Corporate'],
    facilities: ['Pool', 'Spa', 'Gym', 'Banquets', 'Business center', 'Valet'],
    deliveryOptions: ['Airport transfer'],
    certifications: ['5 Star Classification', 'LEED Gold'],
    products: [] as any[],
    services: [
      { name: 'Deluxe Room (King)', pricing: '₹12,500/night', duration: 'Per night', coverageArea: 'On-site', deliverables: ['Room', 'Breakfast', 'Wi-Fi'] },
      { name: 'Banquet — Grand Ballroom', pricing: '₹3,50,000 + taxes', duration: 'Per event', coverageArea: 'On-site', deliverables: ['Hall', 'AV', 'Dinner for 400'] },
    ],
  },
  {
    name: 'Apex Wholesale Distributors',
    tagline: 'FMCG distribution at scale',
    description:
      'Apex is a leading distributor for 40+ FMCG brands, servicing 6,000 retailers across three states with a 60-vehicle fleet and 4 warehouses. Real-time stock visibility for partners.',
    category: 'Wholesalers',
    verified: 'premium',
    rating: 4.3,
    reviewCount: 156,
    area: 'Logistics Hub',
    foundedYear: 1995,
    teamSize: '180',
    brandColor: '#0891b2',
    subCategories: ['FMCG', 'Beverages', 'Personal Care'],
    languages: ['English', 'Hindi'],
    paymentMethods: ['NEFT', 'RTGS', 'Credit'],
    facilities: ['4 warehouses', 'Cold storage', '60 vehicles'],
    deliveryOptions: ['3-state network'],
    certifications: ['GST', 'FSSAI'],
    products: [
      { name: 'Packaged Drinking Water (1L x 12)', category: 'Beverages', brand: 'AquaPure', priceMin: 96, priceMax: 120, availability: 'in_stock', variants: ['12x1L', '24x500ml'], specifications: [{ label: 'Shelf life', value: '12 months' }] },
    ],
    services: [] as any[],
  },
  {
    name: 'Skyline Properties Realty',
    tagline: 'Find your address in the sky',
    description:
      'Skyline is a full-service real estate advisory specializing in residential and commercial transactions, leasing and property management. RERA-registered with a verified-listings guarantee.',
    category: 'Real Estate',
    verified: 'verified',
    rating: 4.4,
    reviewCount: 203,
    area: 'Business Bay',
    foundedYear: 2012,
    teamSize: '35',
    brandColor: '#be123c',
    subCategories: ['Residential', 'Commercial', 'Leasing', 'Property Management'],
    languages: ['English', 'Hindi'],
    paymentMethods: ['Cheque', 'NEFT'],
    facilities: ['RERA registered', 'Verified listings'],
    deliveryOptions: ['Site visits'],
    certifications: ['RERA'],
    products: [] as any[],
    services: [
      { name: 'Residential Sale Advisory', pricing: '1% of deal value', duration: '30–90 days', coverageArea: 'Citywide', deliverables: ['Shortlist', 'Site visits', 'Documentation'] },
    ],
  },
  {
    name: 'Velocity Motors Service',
    tagline: 'Authorized multi-brand car care',
    description:
      'Velocity is a multi-brand car service center with computerized diagnostics, OEM parts and factory-trained technicians. Pickup-drop, transparent estimates and 6-month service warranty.',
    category: 'Automotive',
    verified: 'verified',
    rating: 4.5,
    reviewCount: 478,
    area: 'Auto Enclave',
    foundedYear: 2016,
    teamSize: '28',
    brandColor: '#1f2937',
    trending: true,
    subCategories: ['Car Service', 'Diagnostics', 'Body Shop'],
    languages: ['English', 'Hindi'],
    paymentMethods: ['Cash', 'Card', 'UPI'],
    facilities: ['Diagnostic bay', 'Body shop', 'Pickup-drop'],
    deliveryOptions: ['Pickup-drop'],
    certifications: ['ISO 9001'],
    products: [] as any[],
    services: [
      { name: 'Periodic Service (Premium Sedan)', pricing: '₹4,999 – ₹7,499', duration: '4 hours', coverageArea: 'Citywide pickup', deliverables: ['Oil change', 'Filter', 'Inspection', 'Wash'] },
      { name: 'Computerized Diagnostics', pricing: '₹999', duration: '1 hour', coverageArea: 'On-site', deliverables: ['Error codes', 'Estimate'] },
    ],
  },
  {
    name: 'Bloom Dental & Aesthetic Clinic',
    tagline: 'Confidence, by design',
    description:
      'Bloom is a modern dental and aesthetic clinic offering aligners, implants, smile design and skin aesthetics. Digital scans, in-house lab and painless protocols.',
    category: 'Clinics',
    verified: 'verified',
    rating: 4.9,
    reviewCount: 412,
    area: 'Wellness Square',
    foundedYear: 2018,
    teamSize: '14',
    brandColor: '#db2777',
    recentlyVerified: true,
    subCategories: ['Dental', 'Dermatology', 'Aesthetics'],
    languages: ['English', 'Hindi'],
    paymentMethods: ['Cash', 'Card', 'UPI', 'EMI'],
    facilities: ['In-house lab', 'Digital scans'],
    deliveryOptions: ['Teleconsult'],
    certifications: ['Dental Council'],
    products: [] as any[],
    services: [
      { name: 'Clear Aligners', pricing: '₹80,000 – ₹1,80,000', duration: '6–18 months', coverageArea: 'On-site + tele', deliverables: ['Scan', 'Aligners', 'Retainers'] },
    ],
  },
  {
    name: 'Meridian Institute of Technology',
    tagline: 'Engineering futures since 1995',
    description:
      'A NAAC A+ engineering college offering B.Tech, M.Tech and MBA programs across 12 departments with strong industry tie-ups, research centers and 94% placement record.',
    category: 'Colleges',
    verified: 'premium',
    rating: 4.4,
    reviewCount: 689,
    area: 'Knowledge Park',
    foundedYear: 1995,
    teamSize: '320',
    brandColor: '#1d4ed8',
    subCategories: ['Engineering', 'Management', 'Research'],
    languages: ['English'],
    paymentMethods: ['Cheque', 'NEFT', 'UPI'],
    facilities: ['Research labs', 'Hostels', 'Library', 'Sports'],
    deliveryOptions: ['Hostel'],
    certifications: ['AICTE', 'NAAC A+', 'NBA'],
    products: [] as any[],
    services: [
      { name: 'B.Tech Admissions 2025', pricing: '₹1,40,000/year', duration: '4 years', coverageArea: 'On-campus', deliverables: ['Enrollment', 'Hostel optional'] },
    ],
  },
]

const reviewsSeed = [
  { authorName: 'Rohit Sharma', rating: 5, title: 'Exceptional experience', content: 'From the moment I walked in, the staff was attentive and professional. The facility is spotless and the doctors took time to explain everything clearly. Highly recommend.', verified: true, helpful: 42 },
  { authorName: 'Priya Nair', rating: 4, title: 'Great service, slight wait', content: 'Quality of care was excellent though I had to wait about 40 minutes past my appointment. The follow-up and digital reports were a nice touch.', verified: true, helpful: 18 },
  { authorName: 'Aman Verma', rating: 5, title: 'Worth every rupee', content: 'Transparent pricing and no unnecessary upselling. The team genuinely cares. Will return for sure.', verified: true, helpful: 27 },
  { authorName: 'Sneha Kapoor', rating: 5, title: 'Premium feel', content: 'Beautiful interiors, professional staff and the product exceeded expectations. The packaging was lovely too.', verified: false, helpful: 9 },
]

const reviewReplies = [
  'Thank you for your kind words! We are thrilled you had a great experience. — Management',
  'We appreciate the feedback and are working to reduce wait times. Hope to see you again soon!',
  'Thank you for trusting us! It means a lot to the team.',
]

async function main() {
  console.log('Clearing existing data...')
  await db.review.deleteMany()
  await db.product.deleteMany()
  await db.service.deleteMany()
  await db.business.deleteMany()
  await db.category.deleteMany()

  console.log('Seeding categories...')
  for (const c of categories) {
    await db.category.create({ data: { ...c, count: businesses.filter((b) => b.category === c.name).length } })
  }

  console.log('Seeding businesses...')
  let idx = 0
  for (const b of businesses) {
    const lat = jitter(CENTER.lat, 0.08)
    const lng = jitter(CENTER.lng, 0.1)
    const seed = b.name.replace(/&/g, "and").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase()

    const gallery = Array.from({ length: 6 }, (_, i) => img(`${seed}-g${i}`))

    const business = await db.business.create({
      data: {
        name: b.name,
        slug: seed,
        tagline: b.tagline,
        description: b.description,
        logo: img(`${seed}-logo`, 200, 200),
        coverImage: img(`${seed}-cover`, 1600, 600),
        gallery: JSON.stringify(gallery),
        category: b.category,
        subCategories: JSON.stringify(b.subCategories),
        verified: b.verified,
        rating: b.rating,
        reviewCount: b.reviewCount,
        lat,
        lng,
        address: `${b.area}, Meridian City ${100000 + idx * 7}`,
        area: b.area,
        city: 'Meridian City',
        state: 'Central Province',
        pincode: String(100000 + idx * 7),
        phone: `+91 9${String(800000000 + idx * 13579).slice(0, 9)}`,
        email: `contact@${seed}.in`,
        website: `https://${seed}.in`,
        whatsapp: `+91 9${String(800000000 + idx * 13579).slice(0, 9)}`,
        hours: JSON.stringify({
          days: [
            { day: 'Mon–Fri', open: '09:00', close: '20:00' },
            { day: 'Sat', open: '09:00', close: '18:00' },
            { day: 'Sun', open: 'Closed', close: 'Closed' },
          ],
          openNow: idx % 4 !== 3,
        }),
        isOpen: idx % 4 !== 3,
        foundedYear: b.foundedYear,
        teamSize: b.teamSize,
        languages: JSON.stringify(b.languages),
        paymentMethods: JSON.stringify(b.paymentMethods),
        facilities: JSON.stringify(b.facilities),
        deliveryOptions: JSON.stringify(b.deliveryOptions),
        social: JSON.stringify({ instagram: `@${seed}`, linkedin: `${seed}-official`, twitter: `@${seed}` }),
        certifications: JSON.stringify(b.certifications),
        awards: JSON.stringify((b as any).awards ?? []),
        viewCount: Math.floor(b.reviewCount * 8.4),
        responseTime: ['within an hour', 'within a few hours', 'within a day'][idx % 3],
        trending: b.trending ?? false,
        featured: b.featured ?? false,
        recentlyVerified: b.recentlyVerified ?? false,
        promotion: b.promotion ? JSON.stringify(b.promotion) : null,
        announcement: idx % 3 === 0
          ? JSON.stringify({ title: 'Now serving new locations', body: 'We have expanded our coverage area. Reach out to learn more.', date: '2025-01-15' })
          : null,
        brandColor: b.brandColor,
      },
    })

    for (const p of b.products) {
      await db.product.create({
        data: {
          businessId: business.id,
          name: p.name,
          slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          description: `${p.name} — manufactured and supplied by ${b.name}. Backed by ${b.certifications.join(', ')} certifications and a proven track record across ${b.subCategories.join(', ')}.`,
          images: JSON.stringify(Array.from({ length: 4 }, (_, i) => img(`${seed}-p${i}`, 800, 600))),
          category: p.category,
          brand: p.brand,
          priceMin: p.priceMin,
          priceMax: p.priceMax,
          variants: JSON.stringify(p.variants),
          specifications: JSON.stringify(p.specifications),
          availability: p.availability,
          documents: JSON.stringify(['Datasheet.pdf', 'Test Certificate.pdf']),
          faqs: JSON.stringify([
            { q: 'What is the minimum order quantity?', a: 'MOQ varies by product — please contact us for specifics.' },
            { q: 'Do you provide a warranty?', a: 'Yes, standard warranty applies. Extended warranty on request.' },
          ]),
          featured: p.featured ?? false,
          viewCount: Math.floor(Math.random() * 4000) + 200,
        },
      })
    }

    for (const s of b.services) {
      await db.service.create({
        data: {
          businessId: business.id,
          name: s.name,
          slug: s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          description: `${s.name} by ${b.name}. ${b.description.slice(0, 120)}`,
          pricing: s.pricing,
          duration: s.duration,
          coverageArea: s.coverageArea,
          requirements: JSON.stringify(['Valid ID', 'Prior appointment']),
          deliverables: JSON.stringify(s.deliverables),
          photos: JSON.stringify(Array.from({ length: 3 }, (_, i) => img(`${seed}-s${i}`, 800, 600))),
          faqs: JSON.stringify([{ q: 'How do I book?', a: 'Call us or request a quote through the platform.' }]),
        },
      })
    }

    const rcount = Math.min(6, Math.max(3, Math.floor(b.reviewCount / 250)))
    for (let i = 0; i < rcount; i++) {
      const r = reviewsSeed[i % reviewsSeed.length]
      await db.review.create({
        data: {
          businessId: business.id,
          authorName: r.authorName,
          authorAvatar: img(`${seed}-rv${i}-avatar`, 100, 100),
          rating: r.rating,
          title: r.title,
          content: r.content,
          photos: JSON.stringify(i % 2 === 0 ? [img(`${seed}-rv${i}-photo`, 600, 400)] : []),
          verified: r.verified,
          helpful: r.helpful + i,
          businessReply: i % 2 === 0 ? reviewReplies[i % reviewReplies.length] : null,
          createdAt: new Date(Date.now() - i * 86400000 * 5),
        },
      })
    }

    idx++
  }

  console.log(`Seeded ${businesses.length} businesses.`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
