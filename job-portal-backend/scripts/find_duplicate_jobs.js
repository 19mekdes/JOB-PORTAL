const { PrismaClient } = require('@prisma/client')

/**
 * Usage:
 *  node scripts/find_duplicate_jobs.js       # list duplicates
 *  node scripts/find_duplicate_jobs.js --delete   # remove duplicates (keep earliest)
 */

const prisma = new PrismaClient()

async function main() {
  const doDelete = process.argv.includes('--delete')

  console.log('Fetching job posts...')
  const jobs = await prisma.jobPost.findMany({
    select: {
      id: true,
      title: true,
      location: true,
      employer_id: true,
      employment_type_id: true,
      industry_id: true,
      created_at: true
    }
  })

  const groups = new Map()

  for (const j of jobs) {
    const key = [
      j.employer_id,
      (j.title || '').trim().toLowerCase(),
      (j.location || '').trim().toLowerCase(),
      String(j.employment_type_id || ''),
      String(j.industry_id || '')
    ].join('||')

    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(j)
  }

  let dupCount = 0
  for (const [key, list] of groups.entries()) {
    if (list.length > 1) {
      dupCount += list.length - 1
      console.log('\n--- Duplicate group ---')
      console.log('Key:', key)
      list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      for (let i = 0; i < list.length; i++) {
        const keep = i === 0
        console.log(`${keep ? '[KEEP]' : '[DEL ]'} id=${list[i].id} title="${list[i].title}" location="${list[i].location}" created_at=${list[i].created_at}`)
      }

      if (doDelete) {
        const toDelete = list.slice(1).map((r) => r.id)
        console.log('Deleting:', toDelete)
        for (const id of toDelete) {
          await prisma.jobPost.delete({ where: { id } })
        }
      }
    }
  }

  if (dupCount === 0) console.log('\nNo duplicates found (by employer,title,location,employment_type,industry).')
  else console.log(`\nFound ${dupCount} duplicate job posts${doDelete ? ' (deleted)' : ''}.`)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
