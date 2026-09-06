import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27117/loanforge';

const syntheticApplicants = [
  { applicantId: 'APP-0001', name: 'Jordan Rivera', income: '5200.00', age: 34, employmentType: 'SALARIED' },
  { applicantId: 'APP-0002', name: 'Sam Okafor', income: '3100.00', age: 22, employmentType: 'SELF_EMPLOYED' },
  { applicantId: 'APP-0003', name: 'Priya Nandan', income: '7800.00', age: 45, employmentType: 'SALARIED' },
];

const syntheticProducts = [
  { productId: 'PRD-PERSONAL', name: 'Personal Loan', minAmount: '1000.00', maxAmount: '25000.00' },
  { productId: 'PRD-AUTO', name: 'Auto Loan', minAmount: '5000.00', maxAmount: '60000.00' },
];

async function seed() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db();

    await db.collection('applicants').deleteMany({});
    await db.collection('products').deleteMany({});

    await db.collection('applicants').insertMany(syntheticApplicants);
    await db.collection('products').insertMany(syntheticProducts);

    console.log(`Seeded ${syntheticApplicants.length} applicants and ${syntheticProducts.length} products into ${MONGO_URI}`);
  } finally {
    await client.close();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
