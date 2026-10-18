import { siteConfig } from '@/constants'
import { pages } from '@/seo'
import { buildMetaConfig } from '@/utils/meta-utils'

const Meta: React.FC = () => {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/'
    const pageData = pages.find(p => p.path === currentPath) || pages.find(p => p.path === '/404')!
    const config = buildMetaConfig(pageData)

    return (
        <>
            <title>{config.fullTitle}</title>
            <meta name="description" content={config.description} />
            {config.keywords.length > 0 && <meta name="keywords" content={config.keywords.join(', ')} />}

            <link rel="canonical" href={config.canonical} />
            <meta name="robots" content={config.noIndex ? 'noindex, nofollow' : 'index, follow'} />

            <meta property="og:title" content={config.fullTitle} />
            <meta property="og:description" content={config.description} />
            <meta property="og:type" content="website" />
            <meta property="og:locale" content={siteConfig.locale} />
            <meta property="og:site_name" content={siteConfig.name} />
            <meta property="og:url" content={config.canonical} />
            <meta property="og:image" content={config.image} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content={siteConfig.socials.twitterSite} />
            <meta name="twitter:creator" content={siteConfig.socials.twitterCreator} />
            <meta name="twitter:title" content={config.fullTitle} />
            <meta name="twitter:description" content={config.description} />
            <meta name="twitter:image" content={config.image} />

            <script type="application/ld+json">
                {JSON.stringify(config.jsonLd)}
            </script>
        </>
    )
}

export default Meta
