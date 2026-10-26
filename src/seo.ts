import { siteConfig } from './siteconfig.ts'
import { buildMetaConfig, type PageMetaInput } from './utils/meta-utils.ts'

export const pages: PageMetaInput[] = [
    {
        path: '/',
        title: 'Home',
        description: `The Official ${siteConfig.artist.name} Website.`,
        keywords: ['nottaki', 'notTaki', 'j-pop artist', 'official website', 'indie music', 'definitely not Taki !'],
        ogImage: `${siteConfig.url}/images/og-home.jpg`,
    },
    {
        path: '/discography',
        title: 'Discography',
        description: `Discover the music of ${siteConfig.artist.name}. Browse the full discography, including the latest singles, EPs, and studio albums.`,
        keywords: ['music', 'j-pop', 'albums', 'notTaki', 'streaming', 'singles'],
        ogImage: `${siteConfig.url}/images/og-discography.jpg`,
    },
    {
        path: '/commissions',
        title: 'Commissions',
        description: 'Looking for custom music production, mixing, or mastering? Maybe I can help...',
        keywords: ['music commissions', 'custom song', 'vocal track', 'music production', 'hire musician'],
        ogImage: `${siteConfig.url}/images/og-commissions.jpg`,
    },
    {
        path: '/404',
        title: '404 - Page Not Found',
        description: "Oops! It looks like the page you are looking for doesn't exist.",
        keywords: ['404', 'page not found', 'error'],
        ogImage: `${siteConfig.url}/images/og-404.jpg`,
        noIndex: true,
    }
]

export function generateMetaHtml(meta: PageMetaInput) {
    const config = buildMetaConfig(meta)

    return `
    <title>${config.fullTitle}</title>
    <meta name="description" content="${config.description}" />
    ${config.keywords.length > 0 ? `<meta name="keywords" content="${config.keywords.join(', ')}" />` : ''}
    ${config.noIndex ? '<meta name="robots" content="noindex, nofollow" />' : '<meta name="robots" content="index, follow" />'}
    <link rel="canonical" href="${config.canonical}" />

    <meta property="og:title" content="${config.fullTitle}" />
    <meta property="og:description" content="${config.description}" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="${siteConfig.locale}" />
    <meta property="og:site_name" content="${siteConfig.name}" />
    <meta property="og:url" content="${config.canonical}" />
    <meta property="og:image" content="${config.image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="${siteConfig.socials.twitterSite}" />
    <meta name="twitter:creator" content="${siteConfig.socials.twitterCreator}" />
    <meta name="twitter:title" content="${config.fullTitle}" />
    <meta name="twitter:description" content="${config.description}" />
    <meta name="twitter:image" content="${config.image}" />

    <script type="application/ld+json">${JSON.stringify(config.jsonLd).replace(/</g, '\\u003c')}</script>
  `
}
