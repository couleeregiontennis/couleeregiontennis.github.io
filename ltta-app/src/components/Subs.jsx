<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>LTTA Sub GroupMe Links</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="../styles/nav.css" />
    <link rel="stylesheet" href="../styles/style.css" />
    <link rel="stylesheet" href="../styles/subs.css" />
  </head>
  <body>
    <script src="../scripts/nav.js"></script>
    <div id="nav-placeholder"></div>
    <main>
      <h1>LTTA Sub GroupMe Links</h1>
      <p>
        Use the links or QR codes below to join the GroupMe groups for subs.<br>
        Please join the group(s) that match your night or level.
      </p>
      <p>
        <b>Tips for using GroupMe:</b>
        <ul class="disc">
          <li>Post in the group what date and time you need a sub for.</li>
          <li>If you tap on someone's picture, you can message them directly.</li>
          <li>Use the 'Reply' option if you want to take a spot someone posts, this helps with clarity if multiple people are talking.</li>
          <li>If no one responds, and you need help finding a sub, try sending a second message in the group, and/or ask your captian to help find someone.</li>
          <li>Make sure your captain knows you have a sub coming.</li>
        </ul>
      </p>

      <div class="carousel-container">
        <div class="carousel-nav">
          <button class="carousel-btn prev-btn" aria-label="Previous">&#8592;</button>
          <button class="carousel-btn next-btn" aria-label="Next">&#8594;</button>
        </div>
        <div class="carousel-track">
          <div class="groupme-section">
            <h2 class="groupme-info">
              <a class="groupme-link" href="https://groupme.com/join_group/107614095/EnzqFFBq" target="_blank">
                Level 1 Subs
              </a>
            </h2>
            <img class="qr-img" src="../resources/sub-1.jpeg" alt="Sub Group 1 QR Code" />
          </div>
          <div class="groupme-section">
            <h2 class="groupme-info">
              <a class="groupme-link" href="https://groupme.com/join_group/107614126/Pb9RhLpp" target="_blank">
                Level 2 Subs
              </a>
            </h2>
            <img class="qr-img" src="../resources/sub-2.jpeg" alt="Sub Group 2 QR Code" />
          </div>
          <div class="groupme-section">
            <h2 class="groupme-info">
              <a class="groupme-link" href="https://groupme.com/join_group/107613890/YP9b8Dt4" target="_blank">
                Level 3 Subs
              </a>
            </h2>
            <img class="qr-img" src="../resources/sub-3.jpeg" alt="Sub Group 3 QR Code" />
          </div>
          <div class="groupme-section">
            <h2 class="groupme-info">
              <a class="groupme-link" href="https://groupme.com/join_group/107614052/BTImdRec" target="_blank">
                Level 4 & 5 Subs
              </a>
            </h2>
            <img class="qr-img" src="../resources/sub-4-5.jpeg" alt="Sub Group 5 & 5 QR Code" />
          </div>
        </div>
      </div>
    </main>
    <script>
      // Carousel
      const track = document.querySelector('.carousel-track');
      const sections = Array.from(track.children);
      let current = 0;

      function updateCarousel() {
        sections.forEach((sec, idx) => {
          sec.style.display = idx === current ? 'flex' : 'none';
        });
      }
      document.querySelector('.prev-btn').onclick = () => {
        current = (current - 1 + sections.length) % sections.length;
        updateCarousel();
      };
      document.querySelector('.next-btn').onclick = () => {
        current = (current + 1) % sections.length;
        updateCarousel();
      };
      updateCarousel();
    </script>
  </body>
</html>