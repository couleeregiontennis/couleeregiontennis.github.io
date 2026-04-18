async function loadNav() {
  try {
    const response = await fetch('../partials/nav.html?v=2026');
    const html = await response.text();
    document.getElementById('nav-placeholder').innerHTML = html;
    
    // Add toggle functionality after nav is loaded
    const toggle = document.querySelector('.navbar-toggle');
    const menu = document.querySelector('.navbar-menu');
    
    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        menu.classList.toggle('active');
      });
    }

    // Modal Logic
    const donateLink = document.getElementById('donate-link');
    const modal = document.getElementById('donation-modal');
    const closeBtn = document.querySelector('.close-modal');

    if (donateLink && modal) {
      donateLink.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'block';
      });

      closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });

      window.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });
    }
  } catch (error) {
    console.error('Error loading nav:', error);
  }
}

document.addEventListener('DOMContentLoaded', loadNav);