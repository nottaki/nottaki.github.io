import { siteConfig } from "@/siteconfig"
import { Icon } from "@iconify/react"

const SNS = [
    {
        name: "Discord",
        icon: "hugeicons:discord",
        link: "#",
    },
    {
        name: "X (Twitter)",
        icon: "hugeicons:new-twitter-rectangle",
        link: "https://x.com/_notTaki",
    },
    // {
    //     name: "",
    //     icon: "",
    //     link: "",
    // },
]

const Footer = () => {
    const year = new Date().getFullYear()

    return (
        <footer className="flex items-center justify-between px-4 py-8 border-t cursor-default">
            <div className="flex items-center gap-1">
                <p>&copy; {year} {siteConfig.artist.name}</p>
                <Icon icon="fluent:divider-tall-16-filled" />
                <div className="flex items-center gap-2">
                    {
                        SNS.map((sns, idx) => (
                            <a
                                key={idx}
                                href={sns.link}
                                title={sns.name}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="not-really-a-el active:translate-y-px transition-all duration-300 ease-in-out"
                            >
                                <Icon icon={sns.icon} width={20} height={20} />
                            </a>
                        ))
                    }
                </div>

            </div>
            <p>で、真剣に誰？</p>
        </footer>
    )
}


export default Footer
