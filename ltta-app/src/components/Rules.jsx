import '../styles/Rules.css';

export const Rules = () => {
  return (
    <div className="rules-page">
      <h1>LTTA Rules & Guidelines</h1>

      <section className="rules-section">
        <h2>Match Format</h2>
        <ul>
          <li>Teams consist of 8 players</li>
          <li>Three lines of play each match night</li>
          <li>Line 1: Players #1 & #2 (choice of doubles or singles)</li>
          <li>Line 2: Players #3 & #4 (doubles only)</li>
          <li>Line 3: Players #5-#8 (two doubles matches)</li>
        </ul>
      </section>

      <section className="rules-section">
        <h2>Scoring</h2>
        <ul>
          <li>Best 2-out-of-3 sets</li>
          <li>Regular scoring (not no-ad)</li>
          <li>12-point tiebreak at 6-all</li>
          <li>Third set is a 10-point match tiebreak</li>
        </ul>
      </section>

      <section className="rules-section">
        <h2>Match Time & Courts</h2>
        <ul>
          <li>Matches start at 5:30 PM or 7:00 PM</li>
          <li>Please arrive 10 minutes early</li>
          <li>New players: arrive 15 minutes early for orientation</li>
          <li>Courts 1-5 have lights for evening play</li>
        </ul>
      </section>

      <section className="rules-section">
        <h2>Substitutes</h2>
        <ul>
          <li>Notify your captain if you need a sub</li>
          <li>Use GroupMe to find substitutes</li>
          <li>Subs should play at their regular position level</li>
          <li>Priority to players who don't regularly play</li>
        </ul>
      </section>

      <section className="rules-section">
        <h2>Weather Policy</h2>
        <ul>
          <li>Captains will communicate any weather-related changes</li>
          <li>Rain date matches typically scheduled for following week</li>
          <li>Lightning: clear courts immediately, wait 30 minutes after last strike</li>
        </ul>
      </section>
    </div>
  );
};