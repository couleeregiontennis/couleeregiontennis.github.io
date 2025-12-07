import { useState } from 'react';
import '../styles/PlayerResources.css';

const carouselImages = [
    { src: '/images/sub-1.jpeg', alt: 'Captains coordinating subs courtside' },
    { src: '/images/sub-2.jpeg', alt: 'Players celebrating after a win' },
    { src: '/images/sub-3.jpeg', alt: 'Courtside view of doubles match' },
    { src: '/images/sub-4-5.jpeg', alt: 'Team photo at Green Island courts' }
];

const subGuidelines = [
    'Tell your captain right away when you cannot make a match.',
    "Invite players who rarely get court time before asking the other play night.",
    'Post in GroupMe or your team chat with date, opponent, and courts to speed up responses.',
    'Share whether you need a doubles partner or full line—clarity helps others commit quickly.'
];

const supportHighlights = [
    {
        title: 'Phase 1 Complete',
        detail: '13 outdoor lighted courts opened September 2020 with new parking and walkways.'
    },
    {
        title: 'Vision for 19 Courts',
        detail: 'Phase 2 adds a six-court dome for year-round play and larger regional events.'
    },
    {
        title: 'Community Impact',
        detail: 'Home for LTTA leagues, USTA programs, scholastic teams, adaptive tennis, and travel tournaments.'
    }
];

const resourceLinks = [
    {
        label: 'City Parks Contact',
        value: 'Nikki Hansen · City of La Crosse Parks & Recreation',
        href: 'mailto:hansenn@cityoflacrosse.org?subject=Green%20Island%20Courts%20Inquiry'
    },
    {
        label: 'Tennis Courts Calendar',
        value: 'Reserve court time and monitor scheduled events.',
        href: 'https://www.cityoflacrosse.org/?splash=https%3a%2f%2fteamup.com%2fkssd3w9kyz9cin87zt&____isexternal=true'
    },
    {
        label: 'CRTA Donation Info',
        value: 'Mail checks to Coulee Region Tennis Association · PO Box 191, La Crosse, WI 54602-0191 or donate online.',
        href: 'https://www.facebook.com/CouleeRegionTennis'
    }
];

export const PlayerResources = () => {
    const [activeSlide, setActiveSlide] = useState(0);

    const changeSlide = (step) => {
        setActiveSlide((prev) => (prev + step + carouselImages.length) % carouselImages.length);
    };

    return (
        <main className="player-resources-page">
            <header className="resources-hero card card--interactive card--overlay">
                <div>
                    <p className="eyebrow">Player Hub</p>
                    <h1>Player Resources & Facilities</h1>
                    <p>
                        Everything captains and players need to recruit subs, share arrival details, and navigate Green Island.
                    </p>
                </div>
            </header>

            <section className="resources-grid">
                <article className="card card--interactive">
                    <h2>Sub Policy Quick Hits</h2>
                    <ul className="guideline-list">
                        {subGuidelines.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </article>
                <article className="card card--interactive">
                    <h2>Tips for Faster Coverage</h2>
                    <p>
                        When posting for a substitute, include opponent, court assignment, start time, and whether you need a doubles partner
                        or entire line. The clearer the request, the quicker someone can commit.
                    </p>
                    <p>
                        Captains looking for emergency coverage can email <a href="mailto:ltta@couleeregiontennis.com">ltta@couleeregiontennis.com</a>
                        for help broadcasting across league channels.
                    </p>
                </article>
            </section>

            <section className="carousel-section card card--interactive">
                <div className="section-header compact">
                    <div>
                        <h2>Sub Finder Carousel</h2>
                        <p>Swipe through example posts and match-night photos from LTTA teams.</p>
                    </div>
                    <div className="carousel-controls">
                        <button type="button" onClick={() => changeSlide(-1)} aria-label="Show previous photo">←</button>
                        <button type="button" onClick={() => changeSlide(1)} aria-label="Show next photo">→</button>
                    </div>
                </div>
                <div className="carousel-frame">
                    {carouselImages.map((image, index) => (
                        <img
                            key={image.src}
                            src={image.src}
                            alt={image.alt}
                            className={index === activeSlide ? 'carousel-image active' : 'carousel-image'}
                        />
                    ))}
                </div>
                <div className="carousel-dots">
                    {carouselImages.map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            className={index === activeSlide ? 'dot active' : 'dot'}
                            onClick={() => setActiveSlide(index)}
                            aria-label={`Show slide ${index + 1}`}
                        />
                    ))}
                </div>
            </section>

            <section className="card card--interactive">
                <div className="section-header compact">
                    <div>
                        <h2>Project Snapshot</h2>
                        <p>Your support keeps the facility thriving and moves Phase 2 forward.</p>
                    </div>
                </div>
                <div className="support-grid">
                    {supportHighlights.map((item) => (
                        <article className="support-card" key={item.title}>
                            <h3>{item.title}</h3>
                            <p>{item.detail}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="card card--interactive">
                <div className="section-header compact">
                    <div>
                        <h2>Quick Contacts & Links</h2>
                        <p>Share these with subs, supporters, and visiting captains.</p>
                    </div>
                </div>
                <div className="resource-grid">
                    {resourceLinks.map((resource) => (
                        <article className="resource-card" key={resource.label}>
                            <h3>{resource.label}</h3>
                            <p>{resource.value}</p>
                            <a href={resource.href} target="_blank" rel="noreferrer" className="btn-link">
                                Open Link
                            </a>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    );
};
