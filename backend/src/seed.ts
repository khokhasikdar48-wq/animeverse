# Seed script (typescript) - uses Prisma client
// Run with: npx ts-node backend/src/seed.ts (after installing deps and prisma client)
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main(){
  console.log('Seeding demo data...')

  const genres = ['Action','Adventure','Fantasy','Drama']
  for(const name of genres){
    await prisma.genre.upsert({where:{name}, update:{}, create:{name, slug:name.toLowerCase()}})
  }

  const animeSamples = [
    {title:'Shadow of the Moon', slug:'shadow-of-the-moon', year:2024, status:'ongoing', rating:8.7},
    {title:'Crystal Warriors', slug:'crystal-warriors', year:2019, status:'completed', rating:7.9},
    {title:'Village of Dragons', slug:'village-of-dragons', year:2021, status:'completed', rating:8.2},
    {title:'Sky Adventure', slug:'sky-adventure', year:2020, status:'ongoing', rating:8.0}
  ]

  for(const a of animeSamples){
    const anime = await prisma.anime.upsert({
      where:{slug:a.slug},
      update:{},
      create:{
        title:a.title,
        slug:a.slug,
        description:`Demo description for ${a.title}`,
        year:a.year,
        status:a.status,
        rating:a.rating,
        totalEpisodes: (a.title==='Crystal Warriors'?24:12),
        posterUrl:null,
        coverUrl:null
      }
    })

    // create 4 demo episodes each
    for(let i=1;i<=4;i++){
      await prisma.episode.upsert({
        where:{ id: `${anime.id}-ep-${i}` },
        update:{},
        create:{
          id: `${anime.id}-ep-${i}`,
          animeId: anime.id,
          title: `${anime.title} - Episode ${i}`,
          episodeNumber: i,
          description: 'Demo episode (public-domain placeholder video).',
          videoUrl: '',
        }
      })
    }
  }

  // seed admin invite user (no password) - invite flow recommended
  const adminEmail = process.env.ADMIN_EMAIL || 'demo@animeverse.local'
  await prisma.user.upsert({where:{email:adminEmail}, update:{isAdmin:true}, create:{email:adminEmail, isAdmin:true}})

  console.log('Seeding complete')
}

main().catch(e=>{console.error(e); process.exit(1)})
