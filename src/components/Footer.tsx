import { siteConfig } from "@/siteconfig"
import { Icon } from "@iconify/react"

const SNS = [
    {
        name: "Discord",
        icon: {
            "width": 24,
            "height": 24,
            "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"><path d=\"M15.5 17.5c1 1.5 1.833 2.167 2.5 2.5c1.333-.333 4-1.8 4-5s-1.333-7.667-2-9.5C18 4.3 15.833 4 15 4l-.802 1.604c-.784-.317-1.792-.35-2.198-.326c-.406-.024-1.414.01-2.198.326L9 4c-.833 0-3 .3-5 1.5c-.667 1.833-2 6.3-2 9.5s2.667 4.667 4 5c.667-.333 1.5-1 2.5-2.5\"/><path d=\"M17.365 11.5c0 1.105-.783 2-1.75 2c-.966 0-1.75-.895-1.75-2s.784-2 1.75-2c.967 0 1.75.895 1.75 2M10 11.5c0 1.105-.784 2-1.75 2s-1.75-.895-1.75-2s.784-2 1.75-2s1.75.895 1.75 2m7.5 5c-1.098.897-3.15 1.5-5.5 1.5s-4.402-.603-5.5-1.5\"/></g>"
        },
        link: "#",
    },
    {
        name: "X (Twitter)",
        icon: {
            "width": 24,
            "height": 24,
            "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"><path d=\"M2.5 12c0-4.478 0-6.718 1.391-8.109S7.521 2.5 12.001 2.5c4.478 0 6.717 0 8.108 1.391S21.5 7.521 21.5 12c0 4.478 0 6.718-1.391 8.109S16.479 21.5 12 21.5c-4.478 0-6.717 0-8.109-1.391c-1.39-1.392-1.39-3.63-1.39-8.109\"/><path d=\"m7 17l4.194-4.193M17 7l-4.193 4.194m0 0L9.777 7H7l4.194 5.807m1.613-1.614L17 17h-2.778l-3.028-4.193\"/></g>"
        },
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
                                className="active:translate-y-px transition-all duration-300 ease-in-out"
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
