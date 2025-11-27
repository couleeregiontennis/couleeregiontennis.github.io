import '../styles/GreenIsland.css';

export const GreenIsland = () => {
  const primaryLocation = {
    title: 'Green Island Courts',
    address: '2312 7th St S, La Crosse, WI 54601',
    map: 'https://www.google.com/maps/place/2312+7th+St+S,+La+Crosse,+WI+54601/@43.7892534,-91.2536261,17z/data=!3m1!4b1!4m6!3m5!1s0x87f955820572ab03:0x58c826c87fb5b4db!8m2!3d43.7892534!4d-91.2510512!16s%2Fg%2F11b8v7kp8h?entry=ttu&g_ep=EgoyMDI1MDUxMi4wIKXMDSoJLDEwMjExNDU1SAFQAw%3D%3D'
  };

  const alternateLocation = {
    title: 'Central High School Courts',
    address: '1801 Losey Blvd S, La Crosse, WI 54601',
    map: 'https://www.google.com/maps/place/1801+Losey+Blvd+S,+La+Crosse,+WI+54601/@43.7931869,-91.2214665,17z/data=!3m1!4b1!4m6!3m5!1s0x87f95551c55d0f1b:0x3cb7a094d7959bb3!8m2!3d43.7931869!4d-91.2188916!16s%2Fg%2F11c2h9x25h?entry=ttu&g_ep=EgoyMDI1MDUxMi4wIKXMDSoJLDEwMjExNDU1SAFQAw%3D%3D'
  };

  const courtAssignments = [
    {
      title: 'Courts 1 - 5',
      description: 'Includes a single court near the ice arena and four adjacent courts. Captains can choose singles or doubles for Line 1 here.'
    },
    {
      title: 'Courts 6 - 9',
      description: 'Central bank used for Lines #1-#5 during peak nights. Refer to detailed breakdown below for doubles pairings.'
    },
    {
      title: 'Courts 10 - 13',
      description: 'Western-most courts in the complex, ideal for late evening play when lights are less critical.'
    }
  ];

  const courtBreakdown = [
    { court: 'Court 6', usage: '#1/#2 Doubles (or Singles if designated)' },
    { court: 'Court 7', usage: '#3 Doubles' },
    { court: 'Court 8', usage: '#3 Doubles' },
    { court: 'Court 9', usage: '#4/#5 Doubles' }
  ];

  const projectHighlights = [
    {
      title: 'Master Plan',
      detail:
        '19-court complex anchored by 13 outdoor lighted courts (Phase 1) with 6 indoor courts planned inside a year-round dome for Phase 2.'
    },
    {
      title: 'Collaborative Partners',
      detail:
        'City of La Crosse, Coulee Region Tennis Association (CRTA), University of Wisconsin-La Crosse, and La Crosse Aquinas Catholic Schools.'
    },
    {
      title: 'Funding Snapshot',
      detail:
        'Phase 1 construction launched in April 2020 and finished September 2020 at a cost of $1.3M. CRTA is raising $250,000 locally to support the project and future maintenance.'
    },
    {
      title: 'Next Milestone',
      detail:
        'Phase 2 indoor dome and six courts remain on hold pending $4.5M in additional funding.'
    }
  ];

  const communityBenefits = [
    'Home base for LTTA adult leagues, USTA adult competition, USTA Junior Team Tennis, and local social tennis groups.',
    'Enhances scholastic tennis for area middle schools, high schools, UW-La Crosse NCAA Division III teams, and La Crosse Aquinas Catholic Schools with a shared facility.',
    'Unlocks year-round play with planned indoor dome plus lighted outdoor courts, supporting adapted, wheelchair, and veterans programs in addition to standard play.',
    'Positions La Crosse to host invitationals, regional events, and national-caliber tournaments while driving new visitors to local hotels, restaurants, and businesses.'
  ];

  const supportActions = [
    {
      label: 'Mail a Donation',
      description: 'Checks payable to Coulee Region Tennis Association · PO Box 191, La Crosse, WI 54602-0191.',
      href: null
    },
    {
      label: 'Give Online',
      description: 'Donate through the CRTA Facebook page to support the complex buildout.',
      href: ''
    }
  ];

  const facilityResources = [
    {
      label: 'Green Island Tennis Courts Contact',
      value: 'Nikki Hansen · City of La Crosse Parks & Recreation',
      href: 'mailto:hansenn@cityoflacrosse.org?subject=Green%20Island%20Tennis%20Courts%20Inquiry'
    },
    {
      label: 'Tennis Courts Calendar',
      value: 'Reserve court time and monitor scheduled events.',
      href: 'https://www.cityoflacrosse.org/?splash=https%3a%2f%2fteamup.com%2fkssd3w9kyz9cin87zt&____isexternal=true'
    },
    {
      label: 'Complex Address',
      value: '2300–2312 7th Street South, La Crosse, WI 54601',
      href: 'https://www.google.com/maps/place/2312+7th+St+S,+La+Crosse,+WI+54601/'
    }
  ];

  return (
    <main className="green-island-page">
      <div className="green-island-header">
        <h1>Green Island Facility Guide</h1>
        <p>Courts, layouts, and nearby options for LTTA matches and practice sessions.</p>
      </div>

      <div className="gi-overview-cards">
        <div className="gi-card">
          <div className="gi-card-label">Phase 1 Complete</div>
          <div className="gi-card-value">13 Outdoor Courts</div>
          <div className="gi-card-subtitle">Hard-surface courts opened September 2020 with north bank lighting and expanded parking.</div>
        </div>
        <div className="gi-card">
          <div className="gi-card-label">Total Vision</div>
          <div className="gi-card-value">19 Courts</div>
          <div className="gi-card-subtitle">Phase 2 plans include a six-court indoor dome to deliver uninterrupted year-round tennis.</div>
        </div>
        <div className="gi-card">
          <div className="gi-card-label">Financial Goal</div>
          <div className="gi-card-value">$250K</div>
          <div className="gi-card-subtitle">CRTA community fundraising target for Phase 1 support, maintenance, and momentum toward the dome.</div>
        </div>
        <div className="gi-card">
          <div className="gi-card-label">Lighting</div>
          <div className="gi-card-value">Courts 1 - 7</div>
          <div className="gi-card-subtitle">Lights activate automatically at dusk and power down at 10:00 PM</div>
        </div>
      </div>

      <section className="gi-section">
        <div className="section-intro">
          <h2>Facility Locations</h2>
          <p>Plan arrivals, share directions with visiting teams, and keep alternate courts ready for quick adjustments.</p>
        </div>
        <div className="location-grid">
          {[primaryLocation, alternateLocation].map((location) => (
            <article className="location-card" key={location.title}>
              <h3>{location.title}</h3>
              <p>{location.address}</p>
              <a className="location-link" href={location.map} target="_blank" rel="noreferrer">
                Open in Google Maps
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="gi-section">
        <div className="section-intro">
          <h2>Court Groupings</h2>
          <p>Courts are clustered to streamline match assignments and simplify player navigation.</p>
        </div>
        <div className="assignment-grid">
          {courtAssignments.map((assignment) => (
            <article className="assignment-card" key={assignment.title}>
              <h3>{assignment.title}</h3>
              <p>{assignment.description}</p>
            </article>
          ))}
        </div>
        <div className="detail-card">
          <h3>Courts 6 - 9 Breakdown</h3>
          <ul>
            {courtBreakdown.map((item) => (
              <li key={item.court}>
                <span className="court-label">{item.court}</span>
                <span className="court-usage">{item.usage}</span>
              </li>
            ))}
          </ul>
          <p className="detail-note">
            Captains should communicate any deviations before match night to ensure both teams agree on court usage.
          </p>
        </div>
      </section>

      <section className="gi-section">
        <div className="section-intro">
          <h2>Facility Overview</h2>
          <p>Preview the complex layout before arriving to help new players or visiting teams get oriented quickly.</p>
        </div>
        <div className="image-card">
          <img
            src="/images/greenisland.jpg"
            alt="Green Island Tennis Courts"
            className="gi-image"
          />
          <div className="image-meta">
            <p className="image-title">Green Island Tennis Courts</p>
            <p className="image-caption">
              Courts 1-7 feature lighting for evening play. Courts 8-13 are optimal for daytime matches and drills.
            </p>
          </div>
        </div>
      </section>

      <section className="gi-section">
        <div className="section-intro">
          <h2>Project Vision & Partners</h2>
          <p>Understand how the Green Island expansion came together and where the project is heading next.</p>
        </div>
        <div className="project-highlights">
          {projectHighlights.map((highlight) => (
            <article className="highlight-card" key={highlight.title}>
              <h3>{highlight.title}</h3>
              <p>{highlight.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="gi-section">
        <div className="section-intro">
          <h2>Community Impact</h2>
          <p>The complex is designed to elevate tennis across the Coulee Region while creating new economic and recreational opportunities.</p>
        </div>
        <ul className="gi-list">
          {communityBenefits.map((benefit) => (
            <li key={benefit}>{benefit}</li>
          ))}
        </ul>
      </section>

      <section className="gi-section">
        <div className="section-intro">
          <h2>Support the Project</h2>
          <p>CRTA is a 501(c)(3) nonprofit. Every contribution keeps the courts thriving and moves the dome closer to reality.</p>
        </div>
        <div className="support-grid">
          {supportActions.map((action) => (
            <article className="support-card" key={action.label}>
              <h3>{action.label}</h3>
              <p>{action.description}</p>
              {action.href && (
                <a className="gi-cta-link" href={action.href} target="_blank" rel="noreferrer">
                  Learn More
                </a>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="gi-section">
        <div className="section-intro">
          <h2>Facility Contacts & Resources</h2>
          <p>Use these quick links to coordinate scheduling, connect with city staff, and share location details with your team.</p>
        </div>
        <div className="resources-grid">
          {facilityResources.map((resource) => (
            <article className="resource-card" key={resource.label}>
              <h3>{resource.label}</h3>
              <p>{resource.value}</p>
              <a className="gi-cta-link" href={resource.href} target="_blank" rel="noreferrer">
                Open Link
              </a>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};