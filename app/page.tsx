"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import LoadingScreen from "./components/LoadingScreen";
import SmoothScroll from "./components/SmoothScroll";
import ScrollFX from "./components/ScrollFX";
import CustomCursor from "./components/CustomCursor";
import Magnetic from "./components/Magnetic";
import RippleGrid from "./components/RippleGrid";
import { Spotlight } from "./components/ui/Spotlight";
import Sparkles from "./components/Sparkles";
import GlitchText from "./components/GlitchText";
import Typewriter from "./components/Typewriter";
import { CardContainer, CardBody, CardItem } from "./components/ui/ThreeDCard";
import WorkingStyle from "./components/WorkingStyle";
import Skills from "./components/Skills";
import Projects from "./components/Projects";
import Testimonials from "./components/Testimonials";
import LogoCloud from "./components/LogoCloud";
import Contact from "./components/Contact";

const titles = [
  "Web Developer",
  "UI/UX Designer",
  "Event Systems Architect",
  "Aspiring Aviator",
  "Freelance Developer",
];

// Staggered pop/fade-up for the hero, released once the loader dissolves.
const heroStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.1 } },
};
const heroItem = {
  hidden: { opacity: 0, y: 36, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function Home() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div>
      <LoadingScreen onDone={() => setLoaded(true)} />
      <SmoothScroll />
      <CustomCursor />

      <nav className="navbar">
        <Link
          href="/"
          className="logo"
          onClick={(e) => {
            e.preventDefault();
            if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.2 });
            else window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          AB<span>_</span>
        </Link>
        <div className="links">
          <a href="#about">About</a>
          <a href="#skills">Skills</a>
          <a href="#projects">Projects</a>
          <a href="#testimonials">Testimonials</a>
          <a href="#contact">Contact</a>
        </div>
        <Magnetic>
          <a href="#contact" className="cta">Hire Me</a>
        </Magnetic>
      </nav>

      <section className="hero">
        <div className="hero-bg" aria-hidden>
          <RippleGrid idleRipples={loaded} followMouse={loaded} beams />
          <div className="aurora-wash" />
          <div className="spotlight-flip">
            <Spotlight
              className="-top-40 left-0 md:-top-20 md:left-60"
              fill="#a78bfa"
            />
          </div>
          <div className="spotlight-low">
            <Spotlight
              className="-top-40 left-0 h-[120%] w-[110%] md:-top-10 md:left-10 lg:w-[62%]"
              fill="#22d3ee"
            />
          </div>
          <div className="hero-bg-vignette" />
        </div>
        <motion.div
          className="intro"
          variants={heroStagger}
          initial="hidden"
          animate={loaded ? "show" : "hidden"}
        >
          <motion.p variants={heroItem}>/ / Hello, World. I&apos;m</motion.p>
          <motion.h1 variants={heroItem} className="hero-name">
            <Sparkles density={34} />
            <GlitchText text="Abdulbasit" />
          </motion.h1>
          <motion.h2 variants={heroItem}>
            <Typewriter words={titles} />
          </motion.h2>
          <motion.p variants={heroItem} className="bio">
            From event platforms to pixel perfect UI, I build what needs building. Just 19, and already shipping things people use.
          </motion.p>
          <motion.div variants={heroItem} className="hero-btns">
            <Magnetic>
              <a href="#projects" className="work-btn">See My Work<span>↗</span></a>
            </Magnetic>
            <Magnetic>
              <a href="#letstalk" className="contact-btn">Lets Talk<span>↗</span></a>
            </Magnetic>
          </motion.div>
        </motion.div>

        <motion.div
          className="scroll-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: loaded ? 1 : 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <span className="scroll-mouse"><span className="scroll-wheel" /></span>
          <span className="scroll-text">scroll</span>
        </motion.div>
      </section>

      <section id="about" className="about-section">
        <p className="section-label">01 · About Me</p>
        <h2 className="section-title">Who I <span className="highlight">Am</span></h2>
        <p className="about-text">
          I&apos;m Abdulbasit -- a rare mix of leadership, tech, and design. I run the
          systems that move thousands of people, then build the software to power
          them. Somewhere between shipping code and managing events, I&apos;m also
          working toward a pilot&apos;s license.
        </p>

        <div className="about-cards-top">
          <CardContainer containerClassName="acard-wrap wrap-triple py-0" className="h-full w-full">
            <CardBody className="acard h-full w-full">
              <CardItem as="h3" translateZ={55} className="acard-title">
                The Triple Threat
              </CardItem>
              <CardItem translateZ={35} className="acard-photo w-full">
                <img src="/images/pillars.jpg" alt="Leading on stage" className="photo-pillars" />
              </CardItem>
              <CardItem translateZ={70} className="threat-list w-full">
                <div className="threat-item">
                  <span className="threat-dot dot-purple"></span>
                  <div>
                    <strong>Leadership</strong>
                    <p>Directing teams and events at scale</p>
                  </div>
                </div>
                <div className="threat-item">
                  <span className="threat-dot dot-cyan"></span>
                  <div>
                    <strong>Tech</strong>
                    <p>Building the systems behind the scenes</p>
                  </div>
                </div>
                <div className="threat-item">
                  <span className="threat-dot dot-pink"></span>
                  <div>
                    <strong>Design</strong>
                    <p>Making it all feel effortless to use</p>
                  </div>
                </div>
              </CardItem>
            </CardBody>
          </CardContainer>

          <CardContainer containerClassName="acard-wrap py-0" className="h-full w-full">
            <CardBody className="acard h-full w-full">
              <CardItem as="h3" translateZ={70} className="acard-title age-number">
                19
              </CardItem>
              <CardItem translateZ={35} className="acard-photo w-full">
                <img src="/images/me.jpg" alt="Abdulbasit" className="photo-me" />
              </CardItem>
              <CardItem as="p" translateZ={50} className="acard-sub">
                Young. Driven. Proven.
              </CardItem>
              <CardItem as="p" translateZ={40} className="acard-sub acard-sub-dim">
                Old enough to ship real products, young enough to still be figuring it out.
              </CardItem>
            </CardBody>
          </CardContainer>

          <CardContainer containerClassName="acard-wrap py-0" className="h-full w-full">
            <CardBody className="acard h-full w-full">
              <CardItem as="h3" translateZ={55} className="acard-title">
                Aspiring Aviator
              </CardItem>
              <CardItem translateZ={35} className="acard-photo w-full">
                <img src="/images/cockpit.jpg" alt="Cockpit view" className="photo-cockpit" />
              </CardItem>
              <CardItem as="p" translateZ={50} className="acard-sub">
                Training toward an EASA CPL
              </CardItem>
              <CardItem as="p" translateZ={40} className="acard-sub acard-sub-dim">
                Logging hours toward a private pilot&apos;s license, one flight at a time.
              </CardItem>
            </CardBody>
          </CardContainer>
        </div>

        <div className="about-cards-bottom">
          <CardContainer containerClassName="acard-wrap py-0" className="h-full w-full">
            <CardBody className="acard h-full w-full">
              <CardItem as="h3" translateZ={55} className="acard-title">
                Cleared for Takeoff
              </CardItem>
              <CardItem translateZ={35} className="acard-photo w-full">
                <img src="/images/runway.jpg" alt="Runway at dusk" className="photo-runway" />
              </CardItem>
              <CardItem as="p" translateZ={50} className="acard-sub">
                Building a career on the ground, training for one in the air
              </CardItem>
            </CardBody>
          </CardContainer>

          <CardContainer containerClassName="acard-wrap py-0" className="h-full w-full">
            <CardBody className="acard h-full w-full">
              <CardItem as="h3" translateZ={55} className="acard-title">
                Off the Clock
              </CardItem>
              <CardItem translateZ={35} className="acard-photo w-full">
                <img src="/images/gaming.jpg" alt="Gaming setup" className="photo-gaming" />
              </CardItem>
              <CardItem translateZ={60} className="gaming-stats w-full">
                <div className="gaming-stat">
                  <strong>Valorant</strong>
                  <p>Ascendant - ranked & premier</p>
                </div>
                <div className="gaming-stat">
                  <strong>Fortnite</strong>
                  <p>Earned in Fortnite FNCS & Cash Cups</p>
                </div>
              </CardItem>
            </CardBody>
          </CardContainer>
        </div>
      </section>

      <WorkingStyle />
      <Projects />
      <Skills />
      <Testimonials />
      <LogoCloud />
      <Contact />

      <ScrollFX />
    </div>
  );
}
