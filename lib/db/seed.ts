import { db } from './drizzle';
import { users, organizations, organizationMembers, plans } from './schema';
import { generateId, hashPassword } from './utils';

async function seedDatabase() {
  console.log('🌱 Seeding database...');

  try {
    // Create sample plans
    const samplePlans = [
      {
        id: generateId('plan'),
        productId: 'prod_free',
        name: 'Free',
        description: 'Basic features for getting started',
        price: '0.00',
        interval: 'month' as const,
        features: ['5 projects', 'Basic support', '1GB storage'],
        active: true,
        sort: 1,
      },
      {
        id: generateId('plan'),
        productId: 'prod_pro',
        name: 'Pro',
        description: 'Advanced features for growing teams',
        price: '29.00',
        interval: 'month' as const,
        features: ['Unlimited projects', 'Priority support', '100GB storage', 'Advanced analytics'],
        active: true,
        sort: 2,
      },
      {
        id: generateId('plan'),
        productId: 'prod_enterprise',
        name: 'Enterprise',
        description: 'Full features for large organizations',
        price: '99.00',
        interval: 'month' as const,
        features: ['Everything in Pro', 'Custom integrations', 'Dedicated support', 'Unlimited storage'],
        active: true,
        sort: 3,
      },
    ];

    console.log('📋 Creating plans...');
    await db.insert(plans).values(samplePlans);

    // Create sample users
    const sampleUsers = [
      {
        id: generateId('user'),
        email: 'admin@example.com',
        password: await hashPassword('password123'),
        name: 'Admin User',
        emailVerified: true,
      },
      {
        id: generateId('user'),
        email: 'john@example.com',
        password: await hashPassword('password123'),
        name: 'John Doe',
        emailVerified: true,
      },
      {
        id: generateId('user'),
        email: 'jane@example.com',
        password: await hashPassword('password123'),
        name: 'Jane Smith',
        emailVerified: false,
      },
    ];

    console.log('👥 Creating users...');
    await db.insert(users).values(sampleUsers);

    // Create sample organizations
    const sampleOrganizations = [
      {
        id: generateId('org'),
        name: 'Acme Corporation',
        slug: 'acme-corp',
        plan: 'pro' as const,
      },
      {
        id: generateId('org'),
        name: 'Tech Startup Inc',
        slug: 'tech-startup',
        plan: 'free' as const,
      },
    ];

    console.log('🏢 Creating organizations...');
    await db.insert(organizations).values(sampleOrganizations);

    // Create organization memberships
    const memberships = [
      {
        id: generateId('member'),
        userId: sampleUsers[0].id,
        organizationId: sampleOrganizations[0].id,
        role: 'owner' as const,
      },
      {
        id: generateId('member'),
        userId: sampleUsers[1].id,
        organizationId: sampleOrganizations[0].id,
        role: 'admin' as const,
      },
      {
        id: generateId('member'),
        userId: sampleUsers[1].id,
        organizationId: sampleOrganizations[1].id,
        role: 'owner' as const,
      },
      {
        id: generateId('member'),
        userId: sampleUsers[2].id,
        organizationId: sampleOrganizations[1].id,
        role: 'member' as const,
      },
    ];

    console.log('🤝 Creating organization memberships...');
    await db.insert(organizationMembers).values(memberships);

    console.log('✅ Database seeded successfully!');
    console.log('\n📊 Sample data created:');
    console.log(`- ${samplePlans.length} plans`);
    console.log(`- ${sampleUsers.length} users`);
    console.log(`- ${sampleOrganizations.length} organizations`);
    console.log(`- ${memberships.length} memberships`);
    console.log('\n🔐 Sample login credentials:');
    console.log('Email: admin@example.com | Password: password123');
    console.log('Email: john@example.com | Password: password123');
    console.log('Email: jane@example.com | Password: password123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase }; 