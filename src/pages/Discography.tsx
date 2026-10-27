import Meta from '@/components/Meta'
import { discography, type DiscographyItem } from '@/lib/discography'
import { cn } from '@/lib/utils'
import { useGSAP } from '@gsap/react'
import { Icon } from '@iconify/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'

type FilterType = 'all' | 'single' | 'ep' | 'album'
type SortOrder = 'newest' | 'oldest'

const filterLabels: Record<FilterType, string> = {
    all: 'All',
    single: 'Singles',
    ep: 'EPs',
    album: 'Albums'
}

const Discography = () => {
    const [filter, setFilter] = useState<FilterType>('all')
    const [selectedItem, setSelectedItem] = useState<DiscographyItem | null>(null)
    const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
    const [detailReady, setDetailReady] = useState(false)
    const [gridKey, setGridKey] = useState(0)

    const containerRef = useRef<HTMLDivElement>(null)
    const gridViewRef = useRef<HTMLDivElement>(null)
    const detailViewRef = useRef<HTMLDivElement>(null)
    const prevSelectedItemRef = useRef<DiscographyItem | null>(null)

    const setSelectedRelease = useCallback((item: DiscographyItem | null) => {
        setDetailReady(false)
        setSelectedItem(item)
    }, [])

    useEffect(() => {
        const syncFromUrl = () => {
            const stateSlug = window.history.state?.release as string | undefined
            const hashSlug = window.location.hash.replace(/^#/, '')
            const slug = stateSlug || hashSlug

            if (!slug) {
                setSelectedRelease(null)
                return
            }

            const item = discography.find((entry) => entry.slug === slug)

            if (!item) {
                window.history.replaceState(null, '', window.location.pathname + window.location.search)
                setSelectedRelease(null)
                return
            }

            setSelectedRelease(item)
        }

        syncFromUrl()
        window.addEventListener('popstate', syncFromUrl)

        return () => {
            window.removeEventListener('popstate', syncFromUrl)
        }
    }, [setSelectedRelease])

    const typeCounts = useMemo(() => {
        return discography.reduce((acc, item) => {
            acc[item.type] = (acc[item.type] || 0) + 1
            return acc
        }, {} as Record<string, number>)
    }, [])

    const sortedDiscography = useMemo(() => {
        return [...discography].sort((a, b) => {
            const dateA = new Date(a.released_on).getTime()
            const dateB = new Date(b.released_on).getTime()
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
        })
    }, [sortOrder])

    const filteredDiscography = useMemo(() => {
        return filter === 'all'
            ? sortedDiscography
            : sortedDiscography.filter((item) => item.type === filter)
    }, [filter, sortedDiscography])

    const killScrollTriggersByClasses = useCallback((classNames: string[]) => {
        ScrollTrigger.getAll().forEach((trigger) => {
            const el = trigger.trigger
            if (el instanceof Element && classNames.some((className) => el.classList.contains(className))) {
                trigger.kill()
            }
        })
    }, [])

    useEffect(() => {
        return () => {
            killScrollTriggersByClasses(['release-card', 'reveal-section'])
        }
    }, [killScrollTriggersByClasses])

    useEffect(() => {
        if (!selectedItem || !detailReady) {
            killScrollTriggersByClasses(['reveal-section'])
        }
    }, [selectedItem, detailReady, killScrollTriggersByClasses])

    useGSAP(() => {
        const grid = gridViewRef.current
        if (!grid) return

        killScrollTriggersByClasses(['release-card'])

        if (grid.style.display === 'none') return

        const cards = gsap.utils.toArray<HTMLElement>('.release-card', grid)
        if (!cards.length) return

        gsap.set(cards, { autoAlpha: 0, y: 32 })

        ScrollTrigger.batch(cards, {
            onEnter: (batch) => {
                gsap.fromTo(
                    batch,
                    { autoAlpha: 0, y: 32 },
                    {
                        autoAlpha: 1,
                        y: 0,
                        duration: 0.8,
                        ease: 'sine.out',
                        stagger: 0.1,
                        overwrite: true
                    }
                )
            },
            onLeaveBack: (batch) => {
                gsap.to(batch, {
                    autoAlpha: 0,
                    y: 32,
                    duration: 0.5,
                    ease: 'power2.in',
                    overwrite: true
                })
            },
            start: 'top 90%'
        })

        ScrollTrigger.refresh()

        return () => {
            killScrollTriggersByClasses(['release-card'])
        }
    }, { scope: gridViewRef, dependencies: [filteredDiscography, gridKey, killScrollTriggersByClasses] })

    useGSAP(() => {
        const grid = gridViewRef.current
        const detail = detailViewRef.current
        if (!grid || !detail) return

        const prev = prevSelectedItemRef.current
        prevSelectedItemRef.current = selectedItem

        if (!selectedItem && !prev) {
            grid.style.display = 'block'
            gsap.set(grid, { autoAlpha: 1, y: 0 })
            return
        }

        gsap.killTweensOf([grid, detail])

        if (selectedItem) {
            killScrollTriggersByClasses(['release-card'])

            const showDetail = () => {
                if (!containerRef.current) return

                detail.style.display = 'block'

                gsap.fromTo(
                    detail,
                    { autoAlpha: 0, y: 20 },
                    {
                        autoAlpha: 1,
                        y: 0,
                        duration: 0.4,
                        ease: 'power2.out',
                        onComplete: () => {
                            if (!containerRef.current) return
                            setDetailReady(true)
                            ScrollTrigger.refresh()
                        }
                    }
                )
            }

            if (grid.style.display === 'none') {
                showDetail()
                return
            }

            gsap.to(grid, {
                autoAlpha: 0,
                y: -10,
                duration: 0.25,
                ease: 'power2.in',
                onComplete: () => {
                    if (!containerRef.current) return
                    grid.style.display = 'none'
                    showDetail()
                }
            })

            return
        }

        if (detail.style.display === 'none') {
            grid.style.display = 'block'
            gsap.set(grid, { autoAlpha: 1, y: 0 })
            setGridKey((key) => key + 1)
            return
        }

        gsap.to(detail, {
            autoAlpha: 0,
            y: -10,
            duration: 0.25,
            ease: 'power2.in',
            onComplete: () => {
                if (!containerRef.current) return

                detail.style.display = 'none'
                grid.style.display = 'block'
                gsap.set(grid, { autoAlpha: 1, y: 0 })
                setGridKey((key) => key + 1)
            }
        })
    }, { scope: containerRef, dependencies: [selectedItem, killScrollTriggersByClasses] })

    useGSAP(() => {
        const detail = detailViewRef.current
        if (!selectedItem || !detailReady || !detail) return

        killScrollTriggersByClasses(['reveal-section'])

        const links = gsap.utils.toArray<HTMLElement>('.streaming-link', detail)
        const sections = gsap.utils.toArray<HTMLElement>('.reveal-section', detail)

        if (links.length) {
            gsap.killTweensOf(links)

            // Remove any inline transform so Tailwind hover translate-y can work.
            gsap.set(links, { clearProps: 'transform' })

            gsap.fromTo(
                links,
                { autoAlpha: 0 },
                {
                    autoAlpha: 1,
                    duration: 0.6,
                    ease: 'power2.out',
                    stagger: 0.08,
                    overwrite: true
                }
            )
        }

        if (sections.length) {
            gsap.set(sections, { autoAlpha: 0, y: 40 })

            ScrollTrigger.batch(sections, {
                onEnter: (batch) => {
                    gsap.fromTo(
                        batch,
                        { autoAlpha: 0, y: 40 },
                        {
                            autoAlpha: 1,
                            y: 0,
                            duration: 0.8,
                            ease: 'power2.out',
                            stagger: 0.15,
                            overwrite: true
                        }
                    )
                },
                onLeaveBack: (batch) => {
                    gsap.to(batch, {
                        autoAlpha: 0,
                        y: 40,
                        duration: 0.6,
                        ease: 'power2.in',
                        overwrite: true
                    })
                },
                start: 'top 90%'
            })

            ScrollTrigger.refresh()
        }

        return () => {
            if (links.length) gsap.killTweensOf(links)
            killScrollTriggersByClasses(['reveal-section'])
        }
    }, { scope: detailViewRef, dependencies: [selectedItem, detailReady, killScrollTriggersByClasses] })

    const handleFilterChange = (newFilter: FilterType) => {
        if (newFilter === filter) return
        setFilter(newFilter)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleCardClick = (item: DiscographyItem) => {
        window.scrollTo({ top: 0, behavior: 'auto' })
        window.history.pushState({ release: item.slug }, '', `#${item.slug}`)
        setSelectedRelease(item)
    }

    const handleBack = () => {
        if (window.history.state?.release && window.history.length > 1) {
            window.history.back()
            return
        }

        window.history.replaceState(null, '', window.location.pathname + window.location.search)
        setSelectedRelease(null)
    }

    const getFilterLabel = (type: FilterType) => {
        if (type === 'all') return 'All'
        const count = typeCounts[type] || 0
        return `${filterLabels[type]} (${count})`
    }

    return (
        <>
            <Meta />

            <section ref={containerRef} className="min-h-[calc(100dvh-60px)] w-full p-8 xs:p-4 md:px-8 lg:px-12 mb-4">
                <div className="max-w-7xl mx-auto">

                    <div ref={gridViewRef}>
                        <header className="flex Iflex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-12">
                            <div className="flex flex-wrap gap-2 w-auto">
                                {(['all', 'single', 'ep', 'album'] as FilterType[]).map((type) => {
                                    const count = typeCounts[type] || 0
                                    const isDisabled = type !== 'all' && count === 0

                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => !isDisabled && handleFilterChange(type)}
                                            disabled={isDisabled}
                                            className={cn(
                                                "px-3 py-1 sm:px-4 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 border flex items-center gap-1.5",
                                                filter === type
                                                    ? "bg-gray-900 text-white border-gray-900"
                                                    : isDisabled
                                                        ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                                                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900"
                                            )}
                                        >
                                            {getFilterLabel(type)}
                                        </button>
                                    )
                                })}
                            </div>

                            <button
                                type="button"
                                onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                                className="flex items-center justify-center sm:justify-start gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 border bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900 w-auto"
                                title={sortOrder === 'newest' ? 'Sort: New to Old' : 'Sort: Old to New'}
                                aria-label={sortOrder === 'newest' ? 'Switch to oldest first' : 'Switch to newest first'}
                            >
                                <Icon icon={sortOrder === 'newest' ? 'andrsrxn:calendar-out' : 'andrsrxn:calendar-in'} className="text-base sm:text-lg" />
                                <span className="hidden sm:inline">{sortOrder === 'newest' ? 'Newest' : 'Oldest'}</span>
                            </button>
                        </header>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 justify-items-center">
                            {filteredDiscography.map((item) => (
                                <button
                                    key={item.slug}
                                    type="button"
                                    onClick={() => handleCardClick(item)}
                                    className="release-card opacity-0 w-full max-w-sm flex flex-col items-center group cursor-pointer text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-4 rounded-md"
                                >
                                    <div
                                        className="aspect-square w-full overflow-hidden rounded-md bg-pink-100 shadow-sm transition-all duration-300 ease-out group-hover:-translate-y-2 group-hover:shadow-xl"
                                        style={{
                                            backgroundImage: `url("${item.album_art}")`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                        }}
                                    />
                                    <div className="mt-5 text-center w-full">
                                        <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-black transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1.5">
                                            {new Date(item.released_on).getFullYear()} • {item.type === 'ep' ? 'EP' : item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div ref={detailViewRef} className="hidden">
                        {selectedItem && (
                            <div key={selectedItem.slug} className="w-full max-w-6xl mx-auto">
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600 hover:text-gray-900 mb-12 group"
                                >
                                    <Icon icon="akar-icons:arrow-left" className="text-base transition-transform group-hover:-translate-x-1" />
                                    Back to all releases
                                </button>

                                <div className="mb-12">
                                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
                                        {selectedItem.title}
                                    </h2>
                                    <div className="flex flex-wrap gap-x-2 gap-y-1 text-base text-gray-600">
                                        {selectedItem.artists.map((artist, idx) => (
                                            <span key={idx} className="flex items-center gap-2">
                                                {artist.link ? (
                                                    <a href={artist.link} target="_blank" rel="noopener noreferrer" className="hover:text-black hover:underline transition-all font-medium">
                                                        {artist.name}
                                                    </a>
                                                ) : (
                                                    <span className="font-medium">{artist.name}</span>
                                                )}
                                                {idx < selectedItem.artists.length - 1 && <span className="text-gray-300">•</span>}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-8 sm:gap-10 md:gap-16 md:items-stretch mb-6 sm:mb-12 md:mb-16">
                                    <div className="w-full md:w-1/2">
                                        <div
                                            className="aspect-square w-full rounded-md bg-pink-100 shadow-lg"
                                            style={{
                                                backgroundImage: `url("${selectedItem.album_art}")`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center'
                                            }}
                                        />
                                    </div>

                                    <div className="flex-1 w-full md:w-1/2 py-4 overflow-y-auto overflow-x-hidden space-y-3.5 no-smooth-scroll aspect-square">
                                        {selectedItem.platforms.map((platform, idx) => (
                                            <a
                                                key={idx}
                                                href={platform.link}
                                                target="_blank"
                                                rel="noopener"
                                                className="not-really-a-el streaming-link opacity-0 flex items-center justify-between w-full px-5 py-4 bg-white border border-gray-200 rounded-md transition-transform duration-150 hover:border-gray-400 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-inner active:border-gray-300 group shrink-0"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon icon={platform.icon} className="text-xl text-gray-700 group-hover:text-black transition-colors" />
                                                    <span className="font-medium text-gray-900">Listen on {platform.name}</span>
                                                </div>
                                                <Icon icon="akar-icons:arrow-up-right" className="text-lg text-gray-300 group-hover:text-gray-900 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                            </a>
                                        ))}
                                    </div>
                                </div>

                                <div className="reveal-wrapper grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 pt-6 sm:pt-8 md:pt-10 lg:pt-12 place-items-start justify-items-stretch px-2">
                                    <div className="reveal-section opacity-0 grid grid-cols-2 gap-x-8 gap-y-6">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Release Date</span>
                                            <span className="text-sm text-gray-800 font-medium">
                                                {new Date(selectedItem.released_on).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Type</span>
                                            <span className="text-sm text-gray-800 font-medium capitalize">{selectedItem.type === 'ep' ? 'EP' : selectedItem.type}</span>
                                        </div>
                                        {selectedItem.genre && (
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Genre</span>
                                                <span className="text-sm text-gray-800 font-medium">{selectedItem.genre}</span>
                                            </div>
                                        )}
                                        {selectedItem.label && (
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Label</span>
                                                <span className="text-sm text-gray-800 font-medium">{selectedItem.label}</span>
                                            </div>
                                        )}
                                        {selectedItem.duration && (
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Duration</span>
                                                <span className="text-sm text-gray-800 font-medium">{selectedItem.duration}</span>
                                            </div>
                                        )}
                                        {selectedItem.totalTracks && (
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Total Tracks</span>
                                                <span className="text-sm text-gray-800 font-medium">{selectedItem.totalTracks}</span>
                                            </div>
                                        )}
                                    </div>

                                    {selectedItem.content && (
                                        <div className="reveal-section opacity-0">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">
                                                Behind the Music
                                            </h3>
                                            <div className="prose">
                                                <ReactMarkdown>{selectedItem.content}</ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>
                        )}
                    </div>

                </div>
            </section>
        </>
    )
}

export default Discography
