import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import GovernmentScheme from '../models/GovernmentScheme.js';

dotenv.config();

const schemes = [
  {
    name: 'PM Mudra Yojana - Shishu',
    description: 'Loans up to ₹50,000 for micro enterprises without collateral. Ideal for starting or expanding small businesses.',
    link: 'https://www.mudra.org.in',
    minIncome: 0,
    maxIncome: 100000,
    eligibility: 'Women entrepreneurs with small business ideas, no collateral required'
  },
  {
    name: 'PM Mudra Yojana - Kishor',
    description: 'Loans from ₹50,000 to ₹5 lakh for established businesses looking to expand.',
    link: 'https://www.mudra.org.in',
    minIncome: 50000,
    maxIncome: 300000,
    eligibility: 'Women with existing business, revenue proof required'
  },
  {
    name: 'PM Mudra Yojana - Tarun',
    description: 'Loans from ₹5 lakh to ₹10 lakh for well-established businesses.',
    link: 'https://www.mudra.org.in',
    minIncome: 200000,
    maxIncome: 1000000,
    eligibility: 'Women entrepreneurs with established business track record'
  },
  {
    name: 'Stand Up India',
    description: 'Bank loans between ₹10 lakh to ₹1 crore for SC/ST and women entrepreneurs for greenfield enterprises.',
    link: 'https://www.standupmitra.in',
    minIncome: 200000,
    maxIncome: 2000000,
    eligibility: 'Women starting new manufacturing, services, or trading enterprises'
  },
  {
    name: 'Mahila Udyam Nidhi Scheme',
    description: 'SIDBI scheme providing loans to small-scale industries owned by women.',
    link: 'https://sidbi.in',
    minIncome: 100000,
    maxIncome: 500000,
    eligibility: 'Women in small scale industries, manufacturing sector'
  },
  {
    name: 'PMEGP - Prime Minister Employment Generation Programme',
    description: 'Credit-linked subsidy programme for generating self-employment. Subsidy ranges from 15-35% of project cost.',
    link: 'https://www.kviconline.gov.in/pmegpeportal',
    minIncome: 0,
    maxIncome: 500000,
    eligibility: 'Women above 18 years, no income limit for certain categories'
  },
  {
    name: 'Annapurna Scheme',
    description: 'Loans up to ₹50,000 for setting up food catering businesses.',
    link: 'https://www.indiafilings.com/learn/annapurna-scheme',
    minIncome: 0,
    maxIncome: 200000,
    eligibility: 'Women entrepreneurs in food catering, small food businesses'
  },
  {
    name: 'Cent Kalyani Scheme',
    description: 'Central Bank of India scheme offering loans up to ₹1 lakh with reduced interest rates.',
    link: 'https://www.centralbankofindia.co.in',
    minIncome: 0,
    maxIncome: 300000,
    eligibility: 'Women entrepreneurs, preferential rates for women'
  },
  {
    name: 'Dena Shakti Scheme',
    description: 'Loans for women in agriculture, manufacturing, micro-credit, retail, and small enterprises.',
    link: 'https://www.bankofbaroda.in',
    minIncome: 50000,
    maxIncome: 400000,
    eligibility: 'Women engaged in agriculture, retail stores, small enterprises'
  },
  {
    name: 'Stree Shakti Package for Women Entrepreneurs',
    description: 'State Bank of India scheme with reduced interest rates for women-owned businesses.',
    link: 'https://sbi.co.in',
    minIncome: 100000,
    maxIncome: 1000000,
    eligibility: 'Women entrepreneurs with 50%+ stake in the enterprise'
  },
  {
    name: 'Bharatiya Mahila Bank Business Loan',
    description: 'Specialized loans for women entrepreneurs with flexible repayment options.',
    link: 'https://www.sbi.co.in',
    minIncome: 50000,
    maxIncome: 2000000,
    eligibility: 'Women-owned businesses, all sectors'
  },
  {
    name: 'Trade Related Entrepreneurship Assistance and Development (TREAD)',
    description: 'Government grant for development of women entrepreneurs, particularly in rural areas.',
    link: 'https://msme.gov.in',
    minIncome: 0,
    maxIncome: 300000,
    eligibility: 'Rural women entrepreneurs, NGOs working with women'
  }
];

const seedSchemes = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Starting to seed government schemes...');
    
    // Clear existing schemes
    await GovernmentScheme.deleteMany({});
    console.log('✨ Cleared existing schemes');
    
    // Insert new schemes
    const insertedSchemes = await GovernmentScheme.insertMany(schemes);
    console.log(`✅ Successfully seeded ${insertedSchemes.length} government schemes`);
    
    console.log('\n📋 Schemes added:');
    insertedSchemes.forEach((scheme, index) => {
      console.log(`${index + 1}. ${scheme.name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding schemes:', error);
    process.exit(1);
  }
};

seedSchemes();

