import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding TravlBok reference data...");

  // ---- Countries & Cities ----
  const morocco = await prisma.country.upsert({
    where: { code: "MA" },
    update: {},
    create: {
      code: "MA",
      name: { en: "Morocco", fr: "Maroc", ar: "المغرب" },
    },
  });

  const france = await prisma.country.upsert({
    where: { code: "FR" },
    update: {},
    create: {
      code: "FR",
      name: { en: "France", fr: "France", ar: "فرنسا" },
    },
  });

  const cityData = [
    { country: morocco, name: { en: "Marrakech", fr: "Marrakech", ar: "مراكش" } },
    { country: morocco, name: { en: "Casablanca", fr: "Casablanca", ar: "الدار البيضاء" } },
    { country: morocco, name: { en: "Fes", fr: "Fès", ar: "فاس" } },
    { country: morocco, name: { en: "Chefchaouen", fr: "Chefchaouen", ar: "شفشاون" } },
    { country: morocco, name: { en: "Tangier", fr: "Tanger", ar: "طنجة" } },
    { country: morocco, name: { en: "Agadir", fr: "Agadir", ar: "أكادير" } },
    { country: france, name: { en: "Paris", fr: "Paris", ar: "باريس" } },
  ];

  const cities: Record<string, Awaited<ReturnType<typeof prisma.city.create>>> = {};
  for (const c of cityData) {
    const existing = await prisma.city.findFirst({
      where: { countryId: c.country.id, name: { path: ["en"], equals: c.name.en } },
    });
    cities[c.name.en] = existing
      ? existing
      : await prisma.city.create({
          data: { countryId: c.country.id, name: c.name },
        });
  }

  // ---- Exchange rates (MAD base) ----
  const existingRates = await prisma.exchangeRate.count();
  if (existingRates === 0) {
    await prisma.exchangeRate.createMany({
      data: [
        { baseCurrency: "MAD", targetCurrency: "EUR", rate: 10.85, source: "MANUAL" },
        { baseCurrency: "MAD", targetCurrency: "USD", rate: 9.95, source: "MANUAL" },
      ],
    });
  }

  // ---- Amenities ----
  const hotelAmenityDefs = [
    { code: "WIFI", name: { en: "Free Wi-Fi", fr: "Wi-Fi gratuit", ar: "واي فاي مجاني" } },
    { code: "PARKING", name: { en: "Parking", fr: "Parking", ar: "موقف سيارات" } },
    { code: "POOL", name: { en: "Swimming pool", fr: "Piscine", ar: "مسبح" } },
    { code: "SPA", name: { en: "Spa", fr: "Spa", ar: "منتجع صحي" } },
    { code: "GYM", name: { en: "Fitness center", fr: "Salle de sport", ar: "صالة رياضية" } },
    { code: "RESTAURANT", name: { en: "Restaurant", fr: "Restaurant", ar: "مطعم" } },
    { code: "AIRPORT_SHUTTLE", name: { en: "Airport shuttle", fr: "Navette aéroport", ar: "خدمة نقل من وإلى المطار" } },
    { code: "PET_FRIENDLY", name: { en: "Pet friendly", fr: "Animaux acceptés", ar: "يسمح بالحيوانات الأليفة" } },
  ];
  const roomAmenityDefs = [
    { code: "BALCONY", name: { en: "Balcony", fr: "Balcon", ar: "شرفة" } },
    { code: "SEA_VIEW", name: { en: "Sea view", fr: "Vue sur mer", ar: "إطلالة على البحر" } },
    { code: "AC", name: { en: "Air conditioning", fr: "Climatisation", ar: "تكييف هواء" } },
    { code: "MINIBAR", name: { en: "Minibar", fr: "Minibar", ar: "ميني بار" } },
  ];

  for (const a of hotelAmenityDefs) {
    await prisma.amenity.upsert({
      where: { code: a.code },
      update: {},
      create: { code: a.code, category: "HOTEL", name: a.name },
    });
  }
  for (const a of roomAmenityDefs) {
    await prisma.amenity.upsert({
      where: { code: a.code },
      update: {},
      create: { code: a.code, category: "ROOM", name: a.name },
    });
  }

  // ---- Categories ----
  const hotelTypes = [
    { code: "RIAD", name: { en: "Riad", fr: "Riad", ar: "رياض" } },
    { code: "BOUTIQUE", name: { en: "Boutique hotel", fr: "Hôtel boutique", ar: "فندق بوتيك" } },
    { code: "RESORT", name: { en: "Resort", fr: "Complexe hôtelier", ar: "منتجع" } },
    { code: "APARTMENT", name: { en: "Apartment", fr: "Appartement", ar: "شقة" } },
  ];
  const vehicleCategories = [
    { code: "ECONOMY", name: { en: "Economy", fr: "Économique", ar: "اقتصادية" } },
    { code: "SUV", name: { en: "SUV", fr: "SUV", ar: "دفع رباعي" } },
    { code: "LUXURY", name: { en: "Luxury", fr: "Luxe", ar: "فاخرة" } },
  ];

  for (const c of hotelTypes) {
    await prisma.category.upsert({
      where: { type_code: { type: "HOTEL_TYPE", code: c.code } },
      update: {},
      create: { type: "HOTEL_TYPE", code: c.code, name: c.name },
    });
  }
  for (const c of vehicleCategories) {
    await prisma.category.upsert({
      where: { type_code: { type: "VEHICLE_CATEGORY", code: c.code } },
      update: {},
      create: { type: "VEHICLE_CATEGORY", code: c.code, name: c.name },
    });
  }

  // ---- Cancellation policies ----
  const flexiblePolicy = await prisma.cancellationPolicy.findFirst({
    where: { name: { path: ["en"], equals: "Flexible" } },
  }) ?? (await prisma.cancellationPolicy.create({
    data: {
      name: { en: "Flexible", fr: "Flexible", ar: "مرن" },
      description: {
        en: "Free cancellation up to 48 hours before check-in.",
        fr: "Annulation gratuite jusqu'à 48 heures avant l'arrivée.",
        ar: "إلغاء مجاني حتى 48 ساعة قبل الوصول.",
      },
      rules: { freeCancellationHours: 48, refundPercentAfter: 0 },
    },
  }));

  // ---- CMS pages ----
  const cmsPages = [
    {
      slug: "about",
      title: { en: "About TravlBok", fr: "À propos de TravlBok", ar: "عن TravlBok" },
      content: {
        en: { body: "TravlBok connects travelers with trusted hotels and car rental companies across Morocco and beyond. We help partners grow their business with modern tools, and help travelers book with confidence in their own language and currency." },
        fr: { body: "TravlBok met en relation les voyageurs avec des hôtels et loueurs de voitures de confiance au Maroc et au-delà. Nous aidons nos partenaires à développer leur activité grâce à des outils modernes, et permettons aux voyageurs de réserver en toute confiance dans leur langue et leur devise." },
        ar: { body: "يربط TravlBok المسافرين بفنادق وشركات تأجير سيارات موثوقة في المغرب وخارجه. نساعد شركاءنا على تنمية أعمالهم بأدوات حديثة، ونمكّن المسافرين من الحجز بثقة بلغتهم وعملتهم." },
      },
    },
    {
      slug: "terms",
      title: { en: "Terms and Conditions", fr: "Conditions générales", ar: "الشروط والأحكام" },
      content: {
        en: { body: "By using TravlBok you agree to book in good faith, provide accurate traveler information, and respect each partner's cancellation policy. Partners agree to honor confirmed bookings and keep listing information accurate. Full legal terms will be published here before commercial launch." },
        fr: { body: "En utilisant TravlBok, vous acceptez de réserver de bonne foi, de fournir des informations exactes sur les voyageurs et de respecter la politique d'annulation de chaque partenaire. Les partenaires s'engagent à honorer les réservations confirmées et à maintenir des informations exactes. Les conditions légales complètes seront publiées ici avant le lancement commercial." },
        ar: { body: "باستخدامك لـ TravlBok فإنك توافق على الحجز بحسن نية وتقديم معلومات دقيقة عن المسافرين واحترام سياسة الإلغاء الخاصة بكل شريك. يلتزم الشركاء بالوفاء بالحجوزات المؤكدة والحفاظ على دقة معلومات إعلاناتهم. سيتم نشر الشروط القانونية الكاملة هنا قبل الإطلاق التجاري." },
      },
    },
    {
      slug: "privacy",
      title: { en: "Privacy Policy", fr: "Politique de confidentialité", ar: "سياسة الخصوصية" },
      content: {
        en: { body: "TravlBok collects the information needed to process bookings and manage partner accounts: contact details, booking history, and payment status. We do not sell personal data. Partners can only access data related to their own organization." },
        fr: { body: "TravlBok collecte les informations nécessaires au traitement des réservations et à la gestion des comptes partenaires : coordonnées, historique de réservation et statut de paiement. Nous ne vendons pas de données personnelles. Les partenaires ne peuvent accéder qu'aux données liées à leur propre organisation." },
        ar: { body: "يجمع TravlBok المعلومات اللازمة لمعالجة الحجوزات وإدارة حسابات الشركاء: بيانات الاتصال وسجل الحجوزات وحالة الدفع. نحن لا نبيع البيانات الشخصية. لا يمكن للشركاء الوصول إلا إلى البيانات المتعلقة بمؤسستهم فقط." },
      },
    },
    {
      slug: "faq",
      title: { en: "Frequently Asked Questions", fr: "Questions fréquentes", ar: "الأسئلة الشائعة" },
      content: {
        en: {
          items: [
            { q: "How do I cancel a booking?", a: "Go to My Bookings and select Cancel Booking. Refund eligibility depends on the property or vehicle's cancellation policy." },
            { q: "What currencies can I pay in?", a: "TravlBok supports MAD, EUR and USD. You can switch currency from the top navigation." },
            { q: "How do I list my hotel or fleet?", a: "Click Become a partner, create an account, and submit your business details for review." },
          ],
        },
        fr: {
          items: [
            { q: "Comment annuler une réservation ?", a: "Allez dans Mes réservations et sélectionnez Annuler la réservation. L'éligibilité au remboursement dépend de la politique d'annulation de l'établissement ou du véhicule." },
            { q: "Dans quelles devises puis-je payer ?", a: "TravlBok prend en charge le MAD, l'EUR et l'USD. Vous pouvez changer de devise depuis le menu en haut de page." },
            { q: "Comment ajouter mon hôtel ou ma flotte ?", a: "Cliquez sur Devenir partenaire, créez un compte, puis soumettez les informations de votre entreprise pour validation." },
          ],
        },
        ar: {
          items: [
            { q: "كيف يمكنني إلغاء الحجز؟", a: "اذهب إلى حجوزاتي واختر إلغاء الحجز. تعتمد أهلية الاسترداد على سياسة الإلغاء الخاصة بالعقار أو المركبة." },
            { q: "بأي العملات يمكنني الدفع؟", a: "يدعم TravlBok الدرهم المغربي واليورو والدولار الأمريكي. يمكنك تغيير العملة من القائمة العلوية." },
            { q: "كيف أضيف فندقي أو أسطولي؟", a: "انقر على كن شريكاً، أنشئ حساباً، ثم أرسل معلومات نشاطك التجاري للمراجعة." },
          ],
        },
      },
    },
  ];

  for (const page of cmsPages) {
    await prisma.cmsPage.upsert({
      where: { slug: page.slug },
      update: {},
      create: { ...page, status: "PUBLISHED" },
    });
  }

  // ---- Global settings ----
  await prisma.globalSetting.upsert({
    where: { key: "platform" },
    update: {},
    create: {
      key: "platform",
      value: { defaultLocale: "en", defaultCurrency: "MAD", maintenanceMode: false },
    },
  });

  // ---- Super Admin user ----
  const adminEmail = "admin@travlbok.com";
  const adminPasswordHash = await hashPassword("TravlBok#Admin2026");
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      firstName: "TravlBok",
      lastName: "Admin",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
      locale: "en",
    },
  });
  console.log(`Super Admin ready: ${adminEmail} / TravlBok#Admin2026`);

  // ---- Subscription plans ----
  const planData: Array<{
    tier: "FREE" | "STARTER" | "PROFESSIONAL" | "BUSINESS" | "ENTERPRISE";
    name: { en: string; fr: string; ar: string };
    monthlyPrice: number;
    annualPrice: number;
    trialDays: number;
    maxProperties: number | null;
    maxRoomsPerProperty: number | null;
    maxVehicles: number | null;
    maxBranches: number | null;
    maxStaff: number | null;
    maxMonthlyBookings: number | null;
    featurePms: boolean;
    featureAnalytics: boolean;
    featureAffiliateTools: boolean;
    featureApiAccess: boolean;
    featurePrioritySupport: boolean;
    featureChannelManager: boolean;
    sortOrder: number;
  }> = [
    {
      tier: "FREE",
      name: { en: "Free", fr: "Gratuit", ar: "مجاني" },
      monthlyPrice: 0,
      annualPrice: 0,
      trialDays: 0,
      maxProperties: 1,
      maxRoomsPerProperty: 3,
      maxVehicles: 1,
      maxBranches: 1,
      maxStaff: 1,
      maxMonthlyBookings: 20,
      featurePms: false,
      featureAnalytics: false,
      featureAffiliateTools: false,
      featureApiAccess: false,
      featurePrioritySupport: false,
      featureChannelManager: false,
      sortOrder: 0,
    },
    {
      tier: "STARTER",
      name: { en: "Starter", fr: "Starter", ar: "المبتدئ" },
      monthlyPrice: 199,
      annualPrice: 1990,
      trialDays: 14,
      maxProperties: 3,
      maxRoomsPerProperty: 15,
      maxVehicles: 5,
      maxBranches: 2,
      maxStaff: 5,
      maxMonthlyBookings: 150,
      featurePms: false,
      featureAnalytics: true,
      featureAffiliateTools: false,
      featureApiAccess: false,
      featurePrioritySupport: false,
      featureChannelManager: false,
      sortOrder: 1,
    },
    {
      tier: "PROFESSIONAL",
      name: { en: "Professional", fr: "Professionnel", ar: "الاحترافي" },
      monthlyPrice: 499,
      annualPrice: 4990,
      trialDays: 14,
      maxProperties: 10,
      maxRoomsPerProperty: 60,
      maxVehicles: 20,
      maxBranches: 5,
      maxStaff: 20,
      maxMonthlyBookings: 800,
      featurePms: true,
      featureAnalytics: true,
      featureAffiliateTools: true,
      featureApiAccess: false,
      featurePrioritySupport: false,
      featureChannelManager: true,
      sortOrder: 2,
    },
    {
      tier: "BUSINESS",
      name: { en: "Business", fr: "Business", ar: "الأعمال" },
      monthlyPrice: 999,
      annualPrice: 9990,
      trialDays: 14,
      maxProperties: 30,
      maxRoomsPerProperty: null,
      maxVehicles: 100,
      maxBranches: 15,
      maxStaff: 60,
      maxMonthlyBookings: 3000,
      featurePms: true,
      featureAnalytics: true,
      featureAffiliateTools: true,
      featureApiAccess: true,
      featurePrioritySupport: true,
      featureChannelManager: true,
      sortOrder: 3,
    },
    {
      tier: "ENTERPRISE",
      name: { en: "Enterprise", fr: "Entreprise", ar: "المؤسسات" },
      monthlyPrice: 2499,
      annualPrice: 24990,
      trialDays: 30,
      maxProperties: null,
      maxRoomsPerProperty: null,
      maxVehicles: null,
      maxBranches: null,
      maxStaff: null,
      maxMonthlyBookings: null,
      featurePms: true,
      featureAnalytics: true,
      featureAffiliateTools: true,
      featureApiAccess: true,
      featurePrioritySupport: true,
      featureChannelManager: true,
      sortOrder: 4,
    },
  ];

  const plans: Record<string, Awaited<ReturnType<typeof prisma.subscriptionPlan.create>>> = {};
  for (const plan of planData) {
    const existing = await prisma.subscriptionPlan.findFirst({ where: { tier: plan.tier } });
    plans[plan.tier] = existing
      ? await prisma.subscriptionPlan.update({
          where: { id: existing.id },
          data: {
            featurePms: plan.featurePms,
            featureAnalytics: plan.featureAnalytics,
            featureAffiliateTools: plan.featureAffiliateTools,
            featureApiAccess: plan.featureApiAccess,
            featurePrioritySupport: plan.featurePrioritySupport,
            featureChannelManager: plan.featureChannelManager,
          },
        })
      : await prisma.subscriptionPlan.create({ data: plan });
  }
  console.log("Subscription plans seeded: Free, Starter, Professional, Business, Enterprise.");

  // ---- Demo hotel owner + hotel + rooms ----
  const demoHotelOwnerEmail = "owner@riad-demo.ma";
  const demoOwnerPasswordHash = await hashPassword("Partner#Demo2026");
  const demoOwner = await prisma.user.upsert({
    where: { email: demoHotelOwnerEmail },
    update: {},
    create: {
      email: demoHotelOwnerEmail,
      passwordHash: demoOwnerPasswordHash,
      firstName: "Yasmine",
      lastName: "Bennani",
      role: "HOTEL_OWNER",
      status: "ACTIVE",
      emailVerified: new Date(),
      locale: "fr",
    },
  });

  let demoOrg = await prisma.organization.findFirst({
    where: { legalName: "Riad Atlas SARL" },
  });
  if (!demoOrg) {
    demoOrg = await prisma.organization.create({
      data: {
        type: "HOTEL",
        legalName: "Riad Atlas SARL",
        displayName: "Riad Atlas",
        email: demoHotelOwnerEmail,
        baseCurrency: "MAD",
        verificationStatus: "APPROVED",
        reviewedAt: new Date(),
      },
    });
    await prisma.organizationMember.create({
      data: {
        organizationId: demoOrg.id,
        userId: demoOwner.id,
        role: "HOTEL_OWNER",
        status: "ACTIVE",
      },
    });
  }

  await prisma.subscription.upsert({
    where: { organizationId: demoOrg.id },
    update: {},
    create: {
      organizationId: demoOrg.id,
      planId: plans.PROFESSIONAL.id,
      status: "ACTIVE",
      billingInterval: "MONTHLY",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const riadCategory = await prisma.category.findUniqueOrThrow({
    where: { type_code: { type: "HOTEL_TYPE", code: "RIAD" } },
  });
  const wifi = await prisma.amenity.findUniqueOrThrow({ where: { code: "WIFI" } });
  const pool = await prisma.amenity.findUniqueOrThrow({ where: { code: "POOL" } });
  const spa = await prisma.amenity.findUniqueOrThrow({ where: { code: "SPA" } });

  let demoHotel = await prisma.hotel.findFirst({
    where: { organizationId: demoOrg.id, name: "Riad Atlas Marrakech" },
  });
  if (!demoHotel) {
    demoHotel = await prisma.hotel.create({
      data: {
        organizationId: demoOrg.id,
        name: "Riad Atlas Marrakech",
        description: {
          en: "A serene riad in the heart of the Marrakech medina, featuring a courtyard pool, rooftop terrace and traditional Moroccan hospitality.",
          fr: "Un riad paisible au cœur de la médina de Marrakech, avec piscine dans le patio, terrasse sur le toit et hospitalité marocaine traditionnelle.",
          ar: "رياض هادئ في قلب مدينة مراكش القديمة، يضم مسبحاً في الفناء وتراسًا على السطح وكرم ضيافة مغربي أصيل.",
        },
        categoryId: riadCategory.id,
        starRating: 4,
        countryId: morocco.id,
        cityId: cities["Marrakech"].id,
        address: "12 Derb El Hammam, Medina",
        phone: "+212 524 000 000",
        email: demoHotelOwnerEmail,
        parking: false,
        breakfast: true,
        restaurant: true,
        swimmingPool: true,
        spa: true,
        gym: false,
        wifi: true,
        airportShuttle: true,
        status: "PUBLISHED",
        submittedAt: new Date(),
        reviewedAt: new Date(),
        publishedAt: new Date(),
        amenities: { connect: [{ id: wifi.id }, { id: pool.id }, { id: spa.id }] },
      },
    });

    await prisma.roomType.create({
      data: {
        hotelId: demoHotel.id,
        name: "Deluxe Courtyard Room",
        roomTypeLabel: "Deluxe",
        description: {
          en: "Spacious room overlooking the courtyard pool, with hand-carved furniture and en-suite bathroom.",
          fr: "Chambre spacieuse donnant sur la piscine du patio, avec mobilier sculpté à la main et salle de bain privative.",
          ar: "غرفة واسعة تطل على مسبح الفناء، مع أثاث منحوت يدوياً وحمام خاص.",
        },
        maxGuests: 2,
        maxAdults: 2,
        maxChildren: 1,
        bedTypes: ["QUEEN"],
        numberOfBeds: 1,
        bathrooms: 1,
        roomSizeSqm: 24,
        breakfastIncluded: true,
        refundable: true,
        basePrice: 850,
        weekendPrice: 950,
        taxRatePercent: 10,
        cleaningFee: 50,
        currency: "MAD",
        availableQuantity: 4,
        minStay: 1,
        instantBooking: true,
        cancellationPolicyId: flexiblePolicy.id,
      },
    });

    await prisma.roomType.create({
      data: {
        hotelId: demoHotel.id,
        name: "Rooftop Suite",
        roomTypeLabel: "Suite",
        description: {
          en: "Our largest suite with private access to the rooftop terrace and Atlas Mountains views.",
          fr: "Notre plus grande suite avec accès privé à la terrasse sur le toit et vue sur les montagnes de l'Atlas.",
          ar: "أكبر أجنحتنا مع وصول خاص إلى التراس العلوي وإطلالة على جبال الأطلس.",
        },
        maxGuests: 3,
        maxAdults: 2,
        maxChildren: 2,
        bedTypes: ["KING"],
        numberOfBeds: 1,
        bathrooms: 1,
        roomSizeSqm: 38,
        breakfastIncluded: true,
        refundable: true,
        basePrice: 1450,
        weekendPrice: 1650,
        taxRatePercent: 10,
        cleaningFee: 80,
        currency: "MAD",
        availableQuantity: 2,
        minStay: 1,
        instantBooking: true,
        cancellationPolicyId: flexiblePolicy.id,
      },
    });
  }

  // ---- Demo car rental company + branch + vehicles ----
  const demoCarOwnerEmail = "owner@atlas-rentacar.ma";
  const demoCarOwnerHash = await hashPassword("Partner#Demo2026");
  const demoCarOwner = await prisma.user.upsert({
    where: { email: demoCarOwnerEmail },
    update: {},
    create: {
      email: demoCarOwnerEmail,
      passwordHash: demoCarOwnerHash,
      firstName: "Karim",
      lastName: "El Fassi",
      role: "CAR_RENTAL_OWNER",
      status: "ACTIVE",
      emailVerified: new Date(),
      locale: "fr",
    },
  });

  let carOrg = await prisma.organization.findFirst({
    where: { legalName: "Atlas Rent A Car SARL" },
  });
  if (!carOrg) {
    carOrg = await prisma.organization.create({
      data: {
        type: "CAR_RENTAL",
        legalName: "Atlas Rent A Car SARL",
        displayName: "Atlas Rent A Car",
        email: demoCarOwnerEmail,
        baseCurrency: "MAD",
        verificationStatus: "APPROVED",
        reviewedAt: new Date(),
      },
    });
    await prisma.organizationMember.create({
      data: {
        organizationId: carOrg.id,
        userId: demoCarOwner.id,
        role: "CAR_RENTAL_OWNER",
        status: "ACTIVE",
      },
    });
  }

  await prisma.subscription.upsert({
    where: { organizationId: carOrg.id },
    update: {},
    create: {
      organizationId: carOrg.id,
      planId: plans.STARTER.id,
      status: "ACTIVE",
      billingInterval: "MONTHLY",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  let branch = await prisma.carBranch.findFirst({
    where: { organizationId: carOrg.id },
  });
  if (!branch) {
    branch = await prisma.carBranch.create({
      data: {
        organizationId: carOrg.id,
        name: "Casablanca Airport Branch",
        countryId: morocco.id,
        cityId: cities["Casablanca"].id,
        address: "Mohammed V International Airport",
        phone: "+212 522 000 000",
        isMainBranch: true,
      },
    });
  }

  const economyCategory = await prisma.category.findUniqueOrThrow({
    where: { type_code: { type: "VEHICLE_CATEGORY", code: "ECONOMY" } },
  });
  const suvCategory = await prisma.category.findUniqueOrThrow({
    where: { type_code: { type: "VEHICLE_CATEGORY", code: "SUV" } },
  });

  const existingVehicles = await prisma.vehicle.count({ where: { organizationId: carOrg.id } });
  if (existingVehicles === 0) {
    await prisma.vehicle.create({
      data: {
        organizationId: carOrg.id,
        branchId: branch.id,
        categoryId: economyCategory.id,
        brand: "Dacia",
        model: "Sandero",
        year: 2023,
        color: "White",
        fuel: "PETROL",
        transmission: "MANUAL",
        seats: 5,
        doors: 5,
        description: {
          en: "Reliable and fuel-efficient hatchback, perfect for city driving.",
          fr: "Citadine fiable et économique en carburant, idéale pour la ville.",
          ar: "سيارة هاتشباك موثوقة وموفرة للوقود، مثالية للقيادة داخل المدينة.",
        },
        pricePerDay: 250,
        currency: "MAD",
        deposit: 3000,
        mileagePolicy: "UNLIMITED",
        fuelPolicy: "FULL_TO_FULL",
        gpsAvailable: true,
        status: "AVAILABLE",
        approvalStatus: "PUBLISHED",
        submittedAt: new Date(),
        reviewedAt: new Date(),
        publishedAt: new Date(),
      },
    });

    await prisma.vehicle.create({
      data: {
        organizationId: carOrg.id,
        branchId: branch.id,
        categoryId: suvCategory.id,
        brand: "Volkswagen",
        model: "Tiguan",
        year: 2024,
        color: "Grey",
        fuel: "DIESEL",
        transmission: "AUTOMATIC",
        seats: 5,
        doors: 5,
        description: {
          en: "Spacious SUV with automatic transmission, ideal for family trips across Morocco.",
          fr: "SUV spacieux à transmission automatique, idéal pour les voyages en famille à travers le Maroc.",
          ar: "سيارة دفع رباعي واسعة بناقل حركة أوتوماتيكي، مثالية لرحلات العائلة عبر المغرب.",
        },
        pricePerDay: 650,
        currency: "MAD",
        deposit: 6000,
        mileagePolicy: "LIMITED",
        mileageLimitKm: 250,
        fuelPolicy: "FULL_TO_FULL",
        gpsAvailable: true,
        childSeatAvailable: true,
        airportDeliveryAvailable: true,
        status: "AVAILABLE",
        approvalStatus: "PUBLISHED",
        submittedAt: new Date(),
        reviewedAt: new Date(),
        publishedAt: new Date(),
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
