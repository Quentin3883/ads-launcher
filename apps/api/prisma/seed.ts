import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.lead.deleteMany()
  await prisma.launch.deleteMany()
  await prisma.blueprint.deleteMany()

  // Create sample blueprints
  const metaBlueprint = await prisma.blueprint.create({
    data: {
      name: 'Meta Lead Generation Campaign',
      platform: 'meta',
      status: 'active',
      config: {
        budget: 1000,
        duration: 30,
        targetAudience: {
          age: { min: 25, max: 45 },
          locations: ['US', 'CA', 'UK'],
          interests: ['technology', 'startups', 'marketing'],
        },
        creative: {
          headline: 'Grow Your Business Today',
          description:
            'Join thousands of businesses already using our platform',
          callToAction: 'Learn More',
        },
      },
    },
  })

  const googleBlueprint = await prisma.blueprint.create({
    data: {
      name: 'Google Search Ads - SaaS',
      platform: 'google',
      status: 'draft',
      config: {
        budget: 2000,
        duration: 60,
        targetAudience: {
          age: { min: 30, max: 55 },
          locations: ['US'],
          interests: ['software', 'business tools'],
        },
        creative: {
          headline: 'The Best SaaS Solution',
          description: 'Boost productivity by 10x with our platform',
          callToAction: 'Get Started',
        },
      },
    },
  })

  // Create sample launches
  const launch1 = await prisma.launch.create({
    data: {
      blueprintId: metaBlueprint.id,
      status: 'completed',
      externalCampaignId: 'meta_campaign_123',
      startedAt: new Date('2025-01-01'),
      completedAt: new Date('2025-01-31'),
    },
  })

  const launch2 = await prisma.launch.create({
    data: {
      blueprintId: metaBlueprint.id,
      status: 'running',
      externalCampaignId: 'meta_campaign_456',
      startedAt: new Date(),
    },
  })

  // Create sample leads
  await prisma.lead.createMany({
    data: [
      {
        launchId: launch1.id,
        source: 'meta_lead_ad',
        externalLeadId: 'lead_001',
        data: {
          email: 'john@example.com',
          name: 'John Doe',
          phone: '+1234567890',
        },
      },
      {
        launchId: launch1.id,
        source: 'meta_lead_ad',
        externalLeadId: 'lead_002',
        data: {
          email: 'jane@example.com',
          name: 'Jane Smith',
          company: 'Acme Corp',
        },
      },
      {
        launchId: launch2.id,
        source: 'typeform',
        externalLeadId: 'typeform_123',
        data: {
          email: 'bob@example.com',
          name: 'Bob Johnson',
          interests: ['marketing', 'analytics'],
        },
      },
    ],
  })

  console.log('✅ Database seeded successfully')
  console.log(`Created ${2} blueprints, ${2} launches, and ${3} leads`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
