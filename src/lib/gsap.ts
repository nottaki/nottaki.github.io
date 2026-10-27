import { useGSAP } from "@gsap/react"
import { gsap } from "gsap"
import Lenis from 'lenis'

import { Flip } from 'gsap/Flip'
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { TextPlugin } from "gsap/TextPlugin"

gsap.registerPlugin(useGSAP, ScrollTrigger, TextPlugin, Flip, ScrambleTextPlugin)

export const lenis = new Lenis({ prevent: (node) => node.classList.contains('no-smooth-scroll') })
lenis.on('scroll', ScrollTrigger.update)

gsap.ticker.add((time) => {
    lenis.raf(time * 1000)
})

gsap.ticker.lagSmoothing(0)
