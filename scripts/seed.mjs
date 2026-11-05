import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clean existing data
  await prisma.activityLog.deleteMany();
  await prisma.importJob.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.recurringEntry.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.entry.deleteMany();
  await prisma.bookMember.deleteMany();
  await prisma.book.deleteMany();
  await prisma.category.deleteMany();
  await prisma.paymentMode.deleteMany();
  await prisma.businessMember.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Create Demo User
  const demoUser = await prisma.user.create({
    data: {
      name: "Nazim Merchant",
      email: "demo@cashbook.in",
      phone: "9876543210",
      passwordHash: passwordHash,
      businessType: "Kirana / Retail Store",
      currency: "INR",
      language: "en",
    },
  });

  // Secondary team member for testing sharing
  const staffUser = await prisma.user.create({
    data: {
      name: "Rahul Sharma (Store Manager)",
      email: "rahul@cashbook.in",
      phone: "9876500001",
      passwordHash: passwordHash,
      businessType: "Services",
      currency: "INR",
      language: "en",
    },
  });

  console.log("👤 Created demo users:", demoUser.email, staffUser.email);

  // 2. Create Primary Business: SSF Anakkayam Sector Finance ledger
  const business1 = await prisma.business.create({
    data: {
      name: "SSF Anakkayam Sector Finance ledger",
      type: "Services & Organization",
      currency: "INR",
      phone: "+91 98765 43210",
      address: "Sector Office, Anakkayam, Malappuram",
      members: {
        create: [
          { userId: demoUser.id, role: "OWNER" },
          { userId: staffUser.id, role: "EDITOR" },
        ],
      },
    },
  });

  // Secondary Business: Personal & Freelance
  const business2 = await prisma.business.create({
    data: {
      name: "Personal & Home Ledger",
      type: "Personal",
      currency: "INR",
      members: {
        create: [{ userId: demoUser.id, role: "OWNER" }],
      },
    },
  });

  // 3. Create Categories for Retail Store
  const categoriesData = [
    { name: "Counter Sales", type: "IN", color: "#10b981", icon: "TrendingUp" },
    { name: "Customer Payment", type: "IN", color: "#059669", icon: "UserCheck" },
    { name: "Wholesale Inventory", type: "OUT", color: "#2563eb", icon: "Package" },
    { name: "Shop Rent", type: "OUT", color: "#d97706", icon: "Home" },
    { name: "Electricity & Utilities", type: "OUT", color: "#ea580c", icon: "Zap" },
    { name: "Staff Salary", type: "OUT", color: "#9333ea", icon: "Users" },
    { name: "Tea & Refreshments", type: "OUT", color: "#e11d48", icon: "Coffee" },
    { name: "Packaging & Bags", type: "OUT", color: "#0284c7", icon: "ShoppingBag" },
    { name: "Other Expenses", type: "BOTH", color: "#64748b", icon: "MoreHorizontal" },
  ];

  const catMap = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({
      data: {
        ...cat,
        businessId: business1.id,
      },
    });
    catMap[cat.name] = created;
  }

  // Categories for Personal Business
  await prisma.category.createMany({
    data: [
      { businessId: business2.id, name: "Salary / Freelance", type: "IN", color: "#10b981", icon: "Briefcase" },
      { businessId: business2.id, name: "Groceries", type: "OUT", color: "#2563eb", icon: "ShoppingCart" },
      { businessId: business2.id, name: "Dining & Food", type: "OUT", color: "#e11d48", icon: "Coffee" },
      { businessId: business2.id, name: "House Rent", type: "OUT", color: "#d97706", icon: "Home" },
    ],
  });

  // 4. Create Payment Modes
  const modesData = [
    { name: "Cash", icon: "Banknote" },
    { name: "UPI / QR Code", icon: "QrCode" },
    { name: "Bank Transfer (NEFT/IMPS)", icon: "Building2" },
    { name: "Cheque", icon: "FileText" },
    { name: "Credit / Debit Card", icon: "CreditCard" },
  ];

  const modeMap = {};
  for (const mode of modesData) {
    const created = await prisma.paymentMode.create({
      data: {
        ...mode,
        businessId: business1.id,
      },
    });
    modeMap[mode.name] = created;
  }

  // 5. Create 2 Books for Nazim General Store
  const book1 = await prisma.book.create({
    data: {
      businessId: business1.id,
      name: "Daily Counter Cashbook",
      type: "CASH",
      currency: "INR",
      initialBalance: 5000, // Opening Cash
      members: {
        create: [
          { userId: demoUser.id, role: "OWNER" },
          { userId: staffUser.id, role: "EDITOR" },
        ],
      },
    },
  });

  const book2 = await prisma.book.create({
    data: {
      businessId: business1.id,
      name: "Supplier & Khata Ledger",
      type: "CREDIT_DEBIT",
      currency: "INR",
      initialBalance: 0,
      members: {
        create: [
          { userId: demoUser.id, role: "OWNER" },
          { userId: staffUser.id, role: "EDITOR" },
        ],
      },
    },
  });

  // Also 1 Book in Personal Business
  const personalBook = await prisma.book.create({
    data: {
      businessId: business2.id,
      name: "Monthly Home Expenses",
      type: "CASH",
      currency: "INR",
      initialBalance: 20000,
      members: {
        create: [{ userId: demoUser.id, role: "OWNER" }],
      },
    },
  });

  console.log("📚 Created books:", book1.name, book2.name, personalBook.name);

  // 6. Generate 20 realistic entries for Book 1 (Daily Counter Cashbook)
  const now = new Date();
  const getPastDate = (daysAgo, hours = 10, minutes = 30) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const rawEntriesBook1 = [
    { daysAgo: 10, time: "09:00", type: "IN", amount: 5000, remark: "Opening float from bank withdrawal", cat: "Counter Sales", mode: "Cash", party: "Store Opening" },
    { daysAgo: 9, time: "11:15", type: "IN", amount: 14500, remark: "Morning counter retail sales", cat: "Counter Sales", mode: "Cash", party: "Walk-in Customers" },
    { daysAgo: 9, time: "14:30", type: "OUT", amount: 1200, remark: "Plastic bags and cartons purchase", cat: "Packaging & Bags", mode: "Cash", party: "Crown Packaging" },
    { daysAgo: 9, time: "18:45", type: "IN", amount: 8200, remark: "Evening UPI QR code collections", cat: "Counter Sales", mode: "UPI / QR Code", party: "GPay QR" },
    { daysAgo: 8, time: "10:30", type: "OUT", amount: 6500, remark: "Paid Amul Dairy distributor for milk & butter", cat: "Wholesale Inventory", mode: "Bank Transfer (NEFT/IMPS)", party: "Amul Agency" },
    { daysAgo: 8, time: "13:00", type: "IN", amount: 4500, remark: "Old dues cleared by customer Mr. Verma", cat: "Customer Payment", mode: "UPI / QR Code", party: "Verma Ji" },
    { daysAgo: 8, time: "17:15", type: "OUT", amount: 350, remark: "Chai & biscuits for delivery boys", cat: "Tea & Refreshments", mode: "Cash", party: "Raju Tea Stall" },
    { daysAgo: 7, time: "12:00", type: "IN", amount: 18400, remark: "Weekend mega grocery sales", cat: "Counter Sales", mode: "Cash", party: "Retail Counter" },
    { daysAgo: 7, time: "19:30", type: "OUT", amount: 4200, remark: "Commercial Electricity Bill payment", cat: "Electricity & Utilities", mode: "UPI / QR Code", party: "State Electricity Board" },
    { daysAgo: 6, time: "11:00", type: "OUT", amount: 12000, remark: "Shop Monthly Rent advance", cat: "Shop Rent", mode: "Bank Transfer (NEFT/IMPS)", party: "Landlord Mr. Kapoor" },
    { daysAgo: 6, time: "15:30", type: "IN", amount: 9600, remark: "FMCG dry fruits and oil retail sale", cat: "Counter Sales", mode: "Cash", party: "Walk-in Counter" },
    { daysAgo: 5, time: "10:45", type: "OUT", amount: 8500, remark: "Rice & wheat sacks consignment", cat: "Wholesale Inventory", mode: "Cheque", party: "Punjab Agro Corp" },
    { daysAgo: 5, time: "16:00", type: "IN", amount: 11200, remark: "Afternoon retail counter receipts", cat: "Counter Sales", mode: "Cash", party: "Retail Counter" },
    { daysAgo: 4, time: "11:20", type: "OUT", amount: 250, remark: "Floor cleaner & pest control spray", cat: "Other Expenses", mode: "Cash", party: "Sanitary Mart" },
    { daysAgo: 4, time: "17:40", type: "IN", amount: 7800, remark: "Card machine swipe settlements", cat: "Counter Sales", mode: "Credit / Debit Card", party: "HDFC POS" },
    { daysAgo: 3, time: "10:15", type: "OUT", amount: 5000, remark: "Part salary advance to helper Mahesh", cat: "Staff Salary", mode: "Cash", party: "Mahesh Helper" },
    { daysAgo: 3, time: "16:30", type: "IN", amount: 13400, remark: "Diwali sweets & gift packs pre-order advance", cat: "Counter Sales", mode: "UPI / QR Code", party: "Sunrise Apartments RWA" },
    { daysAgo: 2, time: "12:00", type: "OUT", amount: 3400, remark: "Spices and masala replenishment", cat: "Wholesale Inventory", mode: "UPI / QR Code", party: "Everest Wholesalers" },
    { daysAgo: 1, time: "14:10", type: "IN", amount: 15600, remark: "Counter cash collection", cat: "Counter Sales", mode: "Cash", party: "Walk-in Customers" },
    { daysAgo: 0, time: "11:00", type: "IN", amount: 6200, remark: "Today's opening session retail sales", cat: "Counter Sales", mode: "UPI / QR Code", party: "Counter Sales" },
  ];

  let currentBalanceBook1 = book1.initialBalance;
  for (const item of rawEntriesBook1) {
    const isCashIn = item.type === "IN";
    if (isCashIn) {
      currentBalanceBook1 += item.amount;
    } else {
      currentBalanceBook1 -= item.amount;
    }

    const cat = catMap[item.cat];
    const mode = modeMap[item.mode];

    await prisma.entry.create({
      data: {
        bookId: book1.id,
        type: item.type,
        amount: item.amount,
        date: getPastDate(item.daysAgo, parseInt(item.time.split(":")[0]), parseInt(item.time.split(":")[1])),
        time: item.time,
        remark: item.remark,
        categoryId: cat ? cat.id : null,
        categoryName: item.cat,
        paymentModeId: mode ? mode.id : null,
        paymentModeName: item.mode,
        partyName: item.party,
        runningBalance: currentBalanceBook1,
        createdBy: demoUser.id,
        createdByName: demoUser.name,
      },
    });
  }

  // 7. Generate 10 entries for Book 2 (Supplier & Khata Ledger)
  const rawEntriesBook2 = [
    { daysAgo: 12, time: "10:00", type: "OUT", amount: 15000, remark: "Goods received on 30-day credit", cat: "Wholesale Inventory", mode: "Bank Transfer (NEFT/IMPS)", party: "Ramesh Traders" },
    { daysAgo: 10, time: "11:30", type: "OUT", amount: 8000, remark: "Beverages consignment on credit", cat: "Wholesale Inventory", mode: "Cheque", party: "Gupta Wholesalers" },
    { daysAgo: 8, time: "14:00", type: "IN", amount: 5000, remark: "Credit repayment made to Ramesh Traders", cat: "Wholesale Inventory", mode: "Bank Transfer (NEFT/IMPS)", party: "Ramesh Traders" },
    { daysAgo: 7, time: "15:20", type: "IN", amount: 3500, remark: "Monthly ration credit given to Sharma Ji", cat: "Counter Sales", mode: "Cash", party: "Sharma Ji (Flat 204)" },
    { daysAgo: 6, time: "16:45", type: "OUT", amount: 12000, remark: "Dry snacks & namkeen bulk supplies", cat: "Wholesale Inventory", mode: "Bank Transfer (NEFT/IMPS)", party: "Haldiram Distributor" },
    { daysAgo: 5, time: "12:10", type: "IN", amount: 2000, remark: "Partial payment received from Sharma Ji", cat: "Customer Payment", mode: "UPI / QR Code", party: "Sharma Ji (Flat 204)" },
    { daysAgo: 4, time: "17:00", type: "IN", amount: 8000, remark: "Full settlement paid to Gupta Wholesalers", cat: "Wholesale Inventory", mode: "UPI / QR Code", party: "Gupta Wholesalers" },
    { daysAgo: 3, time: "11:15", type: "OUT", amount: 6200, remark: "Dairy & ice cream batch supplied on credit", cat: "Wholesale Inventory", mode: "Cash", party: "Priya Dairy" },
    { daysAgo: 2, time: "13:30", type: "IN", amount: 4000, remark: "Direct deposit from Priya Dairy settlement", cat: "Wholesale Inventory", mode: "Bank Transfer (NEFT/IMPS)", party: "Priya Dairy" },
    { daysAgo: 1, time: "18:00", type: "OUT", amount: 7500, remark: "New batch of pulses and spices on credit", cat: "Wholesale Inventory", mode: "Cheque", party: "Ramesh Traders" },
  ];

  let currentBalanceBook2 = book2.initialBalance;
  for (const item of rawEntriesBook2) {
    if (item.type === "IN") {
      currentBalanceBook2 += item.amount;
    } else {
      currentBalanceBook2 -= item.amount;
    }

    const cat = catMap[item.cat];
    const mode = modeMap[item.mode];

    await prisma.entry.create({
      data: {
        bookId: book2.id,
        type: item.type,
        amount: item.amount,
        date: getPastDate(item.daysAgo, parseInt(item.time.split(":")[0]), parseInt(item.time.split(":")[1])),
        time: item.time,
        remark: item.remark,
        categoryId: cat ? cat.id : null,
        categoryName: item.cat,
        paymentModeId: mode ? mode.id : null,
        paymentModeName: item.mode,
        partyName: item.party,
        runningBalance: currentBalanceBook2,
        createdBy: demoUser.id,
        createdByName: demoUser.name,
      },
    });
  }

  // 8. Recurring Entries
  await prisma.recurringEntry.create({
    data: {
      bookId: book1.id,
      type: "OUT",
      amount: 12000,
      remark: "Monthly Shop Rent to Landlord",
      categoryName: "Shop Rent",
      paymentModeName: "Bank Transfer (NEFT/IMPS)",
      partyName: "Landlord Mr. Kapoor",
      frequency: "MONTHLY",
      nextRunDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      isActive: true,
    },
  });

  await prisma.recurringEntry.create({
    data: {
      bookId: book1.id,
      type: "OUT",
      amount: 4500,
      remark: "Electricity & Power bill forecast",
      categoryName: "Electricity & Utilities",
      paymentModeName: "UPI / QR Code",
      frequency: "MONTHLY",
      nextRunDate: new Date(now.getFullYear(), now.getMonth() + 1, 5),
      isActive: true,
    },
  });

  // 9. Activity Logs
  await prisma.activityLog.createMany({
    data: [
      {
        businessId: business1.id,
        bookId: book1.id,
        userId: demoUser.id,
        userName: demoUser.name,
        action: "BUSINESS_CREATED",
        details: "Created business 'SSF Anakkayam Sector Finance ledger'",
        createdAt: getPastDate(15),
      },
      {
        businessId: business1.id,
        bookId: book1.id,
        userId: demoUser.id,
        userName: demoUser.name,
        action: "BOOK_CREATED",
        details: "Created cashbook 'Daily Counter Cashbook' with initial balance ₹5,000",
        createdAt: getPastDate(10),
      },
      {
        businessId: business1.id,
        bookId: book2.id,
        userId: demoUser.id,
        userName: demoUser.name,
        action: "BOOK_CREATED",
        details: "Created credit-debit khata book 'Supplier & Khata Ledger'",
        createdAt: getPastDate(12),
      },
      {
        businessId: business1.id,
        userId: demoUser.id,
        userName: demoUser.name,
        action: "MEMBER_INVITED",
        details: "Invited Rahul Sharma as EDITOR",
        createdAt: getPastDate(9),
      },
    ],
  });

  console.log("✅ Seeding completed successfully!");
  console.log(`✨ Created 2 Businesses, 3 Books, 30 Entries, Categories, Payment Modes, and Activity Logs.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
