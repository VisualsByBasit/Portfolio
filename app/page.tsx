"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const titles = ["Web Developer", "UI/UX Designer", "Event Systems Architect", "Aspiring Aviator", "Freelance Developer"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % titles.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [titles.length]);

  return (
    <div>
      <nav className="navbar">
        <Link href="/" className="logo">AB<span>_</span></Link>
       <div className="links">
  <a href="#about">About</a>
  <a href="#skills">Skills</a>
  <a href="#projects">Projects</a>
  <a href="#testimonials">Testimonials</a>
  <a href="#contact">Contact</a>
      </div>
        <button className="cta">Hire Me</button>
      </nav>
      <div className="intro">
        <p>/ / Hello, World. I&apos;m</p>
        <h1>Abdulbasit</h1>
        <h2>{titles[index]}</h2>
        <p className="bio">From event platforms to pixel perfect UI, I build what needs building. Just 19, and already shipping things people use.</p>
        <a href="#projects" className="work-btn">See My Work<span>↗</span></a>
        <a href="#letstalk" className="contact-btn">Lets Talk<span>↗</span></a>
      </div>

      <section id="about" className="about-section">
        <p className="section-label">/ / 01 · About Me</p>
        <h2 className="section-title">Who I <span className="highlight">Am</span></h2>
        <p className="about-text">
          I&apos;m Abdulbasit — a rare mix of leadership, tech, and design. I run the
          systems that move thousands of people, then build the software to power
          them. Somewhere between shipping code and managing events, I&apos;m also
          working toward a pilot&apos;s license.
        </p>

        <div className="about-cards-top">
          <div className="about-card triple-card">
            <div className="triple-overlay">
              <h3>The Triple Threat</h3>
              <div className="threat-list">
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
              </div>
            </div>
          </div>

          <div className="about-card age-card">
            <div className="age-overlay">
              <h3 className="age-number">19</h3>
              <p>Young. Driven. Proven.</p>
            </div>
          </div>

          <div className="about-card runway-card">
            <div className="runway-overlay">
              <h3>Cleared for Takeoff</h3>
              <p>Building a career on the ground, training for one in the air</p>
            </div>
          </div>
        </div>

        <div className="about-cards-bottom">
          <div className="about-card aviator-card">
            <div className="aviator-overlay">
              <h3>Aspiring Aviator</h3>
              <p>Training toward an EASA CPL</p>
            </div>
          </div>

          <div className="about-card gaming-card">
            <div className="gaming-overlay">
              <h3>Off the Clock</h3>
              <div className="gaming-stats">
                <div className="gaming-stat">
                  <strong>Ascendant</strong>
                  <p>Valorant — ranked & premier</p>
                </div>
                <div className="gaming-stat">
                  <strong>$200+</strong>
                  <p>Earned in Fortnite FNCS & Cash Cups</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


