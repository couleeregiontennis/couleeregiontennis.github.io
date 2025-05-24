import '../styles/GreenIsland.css';

export function GreenIsland() {
  return (
    <div className="green-island-page">
      <h1>Green Island Tennis Courts</h1>

      <section className="court-info">
        <h2>Location</h2>
        <p>2312 7th Street South<br />La Crosse, WI 54601</p>
        <div className="map-link">
          <a 
            href="https://maps.google.com/?q=Green+Island+Tennis+Courts+La+Crosse+WI" 
            target="_blank"
            rel="noopener noreferrer"
          >
            📍 Open in Google Maps
          </a>
        </div>
      </section>

      <section className="court-details">
        <h2>Court Information</h2>
        <ul>
          <li>8 courts total (numbered 1-8)</li>
          <li>Courts 1-5 have lighting for evening play</li>
          <li>Water fountain available</li>
          <li>Restrooms on-site</li>
          <li>Parking available in adjacent lot</li>
        </ul>
      </section>

      <section className="court-rules">
        <h2>Court Rules & Etiquette</h2>
        <ul>
          <li>Courts are first-come, first-served outside of league play</li>
          <li>LTTA matches have priority during league nights (Tues/Wed)</li>
          <li>Please keep courts clean and dispose of trash properly</li>
          <li>Be mindful of noise levels during play</li>
          <li>Report any court damage to Parks & Recreation: (608) 789-7533</li>
        </ul>
      </section>

      <section className="image-section">
        <img 
          src="/images/green-island-courts.jpg" 
          alt="Green Island Tennis Courts"
          className="responsive-image"
        />
        <p className="image-caption">Green Island Tennis Courts - La Crosse, WI</p>
      </section>
    </div>
  );
}