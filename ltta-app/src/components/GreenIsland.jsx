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

  return (
    <main className="green-island-page">
      <div className="green-island-header">
        <h1>Green Island Facility Guide</h1>
        <p>Courts, layouts, and nearby options for LTTA matches and practice sessions.</p>
      </div>

      <div className="gi-overview-cards">
        <div className="gi-card">
          <div className="gi-card-label">Primary Complex</div>
          <div className="gi-card-value">13 Courts</div>
          <div className="gi-card-subtitle">6 lighted courts · Seasonal restrooms · Parking near ice arena</div>
        </div>
        <div className="gi-card">
          <div className="gi-card-label">Availability</div>
          <div className="gi-card-value">Open Daily</div>
          <div className="gi-card-subtitle">Public access with priority for LTTA matches and scheduled events</div>
        </div>
        <div className="gi-card">
          <div className="gi-card-label">Backup Courts</div>
          <div className="gi-card-value">Central HS</div>
          <div className="gi-card-subtitle">Used during weather delays or scheduling conflicts</div>
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
    </main>
  );
};