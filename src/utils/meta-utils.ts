import { siteConfig } from '@/constants'

export type PageMetaInput = {
    path: string
    title: string
    description: string
    keywords?: string[]
    ogImage?: string
    noIndex?: boolean
}

export function buildMetaConfig(meta: PageMetaInput) {
    const fullTitle = meta.title.includes(siteConfig.name)
        ? meta.title
        : `${meta.title} | ${siteConfig.name}`

    const canonical = meta.path === '/'
        ? siteConfig.url
        : `${siteConfig.url}${meta.path}`

    const image = meta.ogImage || siteConfig.artist.image

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': siteConfig.artist.isSolo ? 'Person' : 'MusicGroup',
        'name': siteConfig.artist.name,
        'url': canonical,
        'image': siteConfig.artist.image,
        'genre': siteConfig.artist.genres,
        'description': meta.description,
        'sameAs': [
            siteConfig.socials.apple_music,
            siteConfig.socials.nicovideojp,
            siteConfig.socials.spotify,
            siteConfig.socials.youtube,
            siteConfig.socials.youtube_music,
            siteConfig.socials.x,
        ]
    }

    return {
        fullTitle,
        canonical,
        image,
        jsonLd,
        noIndex: meta.noIndex || false,
        keywords: meta.keywords || [],
        description: meta.description,
    }
}
