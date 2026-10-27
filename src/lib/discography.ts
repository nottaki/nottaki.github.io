import { parse } from 'yaml'

export interface DiscographyItem {
    slug: string
    type: "single" | "ep" | "album"
    title: string
    album_art: string
    artists: { name: string; link?: string }[]
    platforms: { name: string; icon: string; link: string }[]
    released_on: string
    label?: string
    genre?: string
    duration?: string
    content: string
    totalTracks?: number
}

const modules = import.meta.glob('/src/content/discography/**/*.md', {
    query: '?raw',
    import: 'default',
    eager: true
})

export const discography: DiscographyItem[] = Object.entries(modules).map(([filePath, rawContent]) => {
    const contentString = rawContent as string
    const match = contentString.match(/^---\s*([\s\S]*?)\s*---/)

    if (!match) {
        return {
            slug: filePath.split('/').pop()?.replace('.md', '') || '',
            type: "album" as const,
            title: 'Unknown',
            album_art: '',
            artists: [],
            platforms: [],
            released_on: '',
            content: contentString
        }
    }

    const frontmatterString = match[1]
    const markdownContent = contentString.slice(match[0].length).trim()

    const data = parse(frontmatterString) as {
        type: "single" | "ep" | "album"
        title: string
        album_art: string
        artists: { name: string; link?: string }[]
        platforms: { name: string; icon: string; link: string }[]
        released_on: string
        label?: string
        genre?: string
        duration?: string
        total_tracks?: number
    }

    const slug = filePath.split('/').pop()?.replace('.md', '') || ''

    return {
        slug,
        type: data.type,
        title: data.title,
        album_art: data.album_art,
        artists: data.artists || [],
        platforms: data.platforms || [],
        released_on: data.released_on,
        label: data.label,
        genre: data.genre,
        duration: data.duration,
        totalTracks: data.total_tracks,
        content: markdownContent,
    }
}).sort((a, b) => new Date(b.released_on).getTime() - new Date(a.released_on).getTime())
