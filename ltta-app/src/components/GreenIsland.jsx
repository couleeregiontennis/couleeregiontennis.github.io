import '../styles/GreenIsland.css';

export const GreenIsland = () => {
  return (
    <main className="green-island-page">
      <h1>Green Island</h1>

      <section className="intro">
        <h2>Tennis Courts</h2>
        <p>
          The Green Island Tennis Courts are located at 
          <a href="https://www.google.com/maps/place/2312+7th+St+S,+La+Crosse,+WI+54601/@43.7892534,-91.2536261,17z/data=!3m1!4b1!4m6!3m5!1s0x87f955820572ab03:0x58c826c87fb5b4db!8m2!3d43.7892534!4d-91.2510512!16s%2Fg%2F11b8v7kp8h?entry=ttu&g_ep=EgoyMDI1MDUxMi4wIKXMDSoJLDEwMjExNDU1SAFQAw%3D%3D">
          2312 7th St S, La Crosse, WI 54601, 
          </a>
          and are a popular destination for tennis enthusiasts in the area. The facility features multiple courts that are well-maintained and open to the public. These courts are used for recreational play, league matches, and tournaments.
        </p>
        <p>When we have conflicts with Green Island court times we often make use of courts nearby, usually Central High School - 
        <a href="https://www.google.com/maps/place/1801+Losey+Blvd+S,+La+Crosse,+WI+54601/@43.7931869,-91.2214665,17z/data=!3m1!4b1!4m6!3m5!1s0x87f95551c55d0f1b:0x3cb7a094d7959bb3!8m2!3d43.7931869!4d-91.2188916!16s%2Fg%2F11c2h9x25h?entry=ttu&g_ep=EgoyMDI1MDUxMi4wIKXMDSoJLDEwMjExNDU1SAFQAw%3D%3D">
          1801 Losey Blvd S, La Crosse, WI 54601-6866 
          </a>
        </p>
      </section>

      <section className="court-numbering">
        <h2>Court Numbering</h2>
        <p>
          The courts at Green Island are numbered sequentially from 1 to 13. 
          Court 1 is the court by itself, closest to the ice arena. The courts are then grouped in pairs, with court 13 being on the far left side of the facility in the photo.
        </p>
        <h3>LTTA Court Assignments</h3>
        <p>
          The teams will be assigned a group of courts for their matches. The groups are as follows:
          <ul>
            <li>Courts 1-5:</li>
            <li>Courts 6-9:</li>
            <li>Courts 10-13:</li>
          </ul>
          The team assigned to the courts 1-5 have the ability to use court 1 and court 2 both, which gives them the option to play
          singles or doubles matches at the 1&2 position. Please consult your team captain for details.
          <br/>
          Teams play on the courts in ascending order. In the case of teams playing at courts 6-9: 
          <ul>
            <li>Courts 6: #1/#2 Doubles</li>
            <li>Courts 7: #3 Doubles</li>
            <li>Courts 8: #3 Doubles</li>
            <li>Courts 9: #4/#5 Doubles </li>
          </ul>
        </p>
      </section>

      <section className="image-section">
        <h2>Facility Overview</h2>
        <div className="image-container">
          <img 
            src="/images/greenisland.jpg" 
            alt="Green Island Tennis Courts" 
            className="responsive-image"
          />
          <p className="image-caption">
            A view of the Green Island Tennis Courts in La Crosse, Wisconsin. 
            Courts 1-7 are lighted, and come on automatically at dusk. 
            Courts 8-13 are not lighted.
          </p>
        </div>
      </section>
    </main>
  );
};