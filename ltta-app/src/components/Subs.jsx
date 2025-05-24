import '../styles/Subs.css';

export function Subs() {
  return (
    <div className="subs-page">
      <h1>Find a Sub</h1>
      <div className="groupme-container">
        <section className="groupme-section">
          <h2>Tuesday Night GroupMe</h2>
          <p>Join the Tuesday night group to find or be a substitute:</p>
          <a 
            className="groupme-link"
            href="https://groupme.com/join_group/107614095/EnzqFFBq"
            target="_blank"
            rel="noopener noreferrer"
          >
            Join Tuesday GroupMe
          </a>
        </section>

        <section className="groupme-section">
          <h2>Wednesday Night GroupMe</h2>
          <p>Join the Wednesday night group to find or be a substitute:</p>
          <a 
            className="groupme-link"
            href="https://groupme.com/join_group/107614096/AzxqGGCr"
            target="_blank"
            rel="noopener noreferrer"
          >
            Join Wednesday GroupMe
          </a>
        </section>

        <section className="sub-rules">
          <h2>Sub Policy</h2>
          <ul>
            <li>Tell your captain if you can't make a match</li>
            <li>Try to find a sub that doesn't get to play normally, before asking players from the other night</li>
            <li>Use GroupMe – it makes finding subs easier</li>
          </ul>
        </section>
      </div>
    </div>
  );
}