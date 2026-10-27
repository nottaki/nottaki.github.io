// @ts-nocheck
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = (q: string) => new Promise<string>((res) => rl.question(q, res))

async function main() {
  console.log("\nLet's add a new release to the Discography ~!\n")
  console.log("---------------------------------------------\n\n")
  const title = await ask('Title: ')
  const type = await ask('Type (single/ep/album): ')
  const releasedOn = await ask('Release Date (YYYY-MM-DD): ')
  const artistName = await ask('Main Artist Name: ')
  const artistLink = await ask('Artist Link (optional, press Enter to skip): ')

  const label = await ask('Label (optional, press Enter to skip): ')
  const genre = await ask('Genre (optional, press Enter to skip): ')
  const duration = await ask('Duration (optional, e.g. 3:45, press Enter to skip): ')

  // Use exact title for the image filename
  const imageName = title
  const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
  const year = releasedOn.split('-')[0]
  const dir = path.join('src', 'content', 'discography', year)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  let artistsYaml = `  - name: "${artistName}"`
  if (artistLink.trim()) {
    artistsYaml += `\n    link: "${artistLink.trim()}"`
  }

  let metadataYaml = ''
  if (label.trim()) metadataYaml += `label: "${label.trim()}"\n`
  if (genre.trim()) metadataYaml += `genre: "${genre.trim()}"\n`
  if (duration.trim()) metadataYaml += `duration: "${duration.trim()}"\n`

  const template = `---
type: "${type}"
title: "${title}"
album_art: "/album-arts/${imageName}.jpg"
artists:
${artistsYaml}
platforms:
  - name: "Spotify"
    icon: "selfhst:spotify"
    link: "#"
  - name: "Apple Music"
    icon: "selfhst:apple-music"
    link: "#"
  - name: "YouTube Music"
    icon: "thesvg-color:youtube-music"
    link: "#"
  - name: "Deezer"
    icon: "selfhst:deezer"
    link: "#"
  - name: "TIDAL"
    icon: "selfhst:tidal"
    link: "#"
  - name: "QQMusic"
    icon: "arcticons:qq-music"
    link: "#"
  - name: "Amazon Music"
    icon: "selfhst:amazon-music"
    link: "#"
released_on: "${releasedOn}"
${metadataYaml}---

Release details go here ~
`

  const filePath = path.join(dir, `${slug}.md`)
  fs.writeFileSync(filePath, template)
  console.log(`\nSuccessfully created "${filePath}" (≧◡≦)\n`)
  console.log(`Reminder: Add your cover art to "public/album-arts/${imageName}.jpg"\n`)
  rl.close()
}

main()
