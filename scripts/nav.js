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
    const payLink = document.getElementById('pay-link');
    const modal = document.getElementById('registration-modal');
    const closeBtn = document.querySelector('.close-modal');

    if (payLink && modal) {
      payLink.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'block';
      });

      // Close our informational modal when the Zeffy button is clicked
      // Zeffy's script will intercept this same click to open its popup
      const payButtonFinal = document.querySelector('.pay-button-final');
      if (payButtonFinal) {
        payButtonFinal.addEventListener('click', () => {
          // Use a tiny delay to ensure Zeffy script sees the click before we hide the button
          setTimeout(() => {
            modal.style.display = 'none';
          }, 100);
        });
      }

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