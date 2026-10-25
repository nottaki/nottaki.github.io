import { useGSAP } from "@gsap/react"
import { gsap } from "gsap"
import Lenis from 'lenis'

import { ScrollTrigger } from "gsap/ScrollTrigger"
import { TextPlugin } from "gsap/TextPlugin"

gsap.registerPlugin(useGSAP, ScrollTrigger, TextPlugin)

export const lenis = new Lenis()
lenis.on('scroll', ScrollTrigger.update)

gsap.ticker.add((time) => {
    lenis.raf(time * 1000)
})

gsap.ticker.lagSmoothing(0)
