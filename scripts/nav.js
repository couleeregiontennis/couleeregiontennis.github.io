// Theme Management
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  const osPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  const theme = savedTheme || (osPrefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
};

// Execute immediately to prevent flash
initTheme();

async function loadNav() {
  try {
    // Determine path based on current location
    const isRoot = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    const navPath = isRoot ? 'partials/nav.html?v=2026.3' : '../partials/nav.html?v=2026.3';

    const response = await fetch(navPath);
    const html = await response.text();
    const placeholder = document.getElementById('nav-placeholder');
    if (placeholder) {
      placeholder.innerHTML = html;
      
      // Hide rain cancellation banner if not active or if expired
      const banner = placeholder.querySelector('.announcement-banner');
      if (banner) {
        try {
          const cancelPath = isRoot ? 'assets/cancellations.json' : '../assets/cancellations.json';
          const cancelRes = await fetch(`${cancelPath}?v=${Date.now()}`);
          if (cancelRes.ok) {
            const cancelData = await cancelRes.json();
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const localTodayStr = `${year}-${month}-${day}`;
            
            if (cancelData.cancelledDate && localTodayStr <= cancelData.cancelledDate) {
              // Banner is active! Update text dynamic reason
              const textSpan = banner.querySelector('.announcement-text');
              if (textSpan) {
                const dateObj = new Date(cancelData.cancelledDate + 'T12:00:00');
                const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
                const reasonText = cancelData.reason === 'heat' ? 'extreme heat' : 'rain';
                const emoji = cancelData.reason === 'heat' ? '🔥' : '🌧️';
                textSpan.innerHTML = `${emoji} All matches tonight (${formattedDate}) are cancelled due to ${reasonText}.`;
              }
            } else {
              banner.remove();
            }
          } else {
            banner.remove();
          }
        } catch (err) {
          console.error('Error loading cancellation banner state:', err);
          banner.remove();
        }
      }

      // Fix paths if not at root
      if (!isRoot) {
        const logo = placeholder.querySelector('.navbar-logo');
        if (logo) logo.src = '../assets/crta-logo.png';
        
        const brandLink = placeholder.querySelector('.navbar-brand a');
        if (brandLink) brandLink.href = '../index.html';

        // Fix other links in the menu if needed
        placeholder.querySelectorAll('.navbar-menu a').forEach(link => {
          if (link.getAttribute('href').startsWith('../')) {
            // Already correct
          } else if (link.getAttribute('href').startsWith('/')) {
             // Absolute path - keep or fix?
          }
        });
      } else {
        // Fix paths if at root (they are hardcoded as ../ in partials/nav.html)
        const logo = placeholder.querySelector('.navbar-logo');
        if (logo) logo.src = 'assets/crta-logo.png';
        
        const brandLink = placeholder.querySelector('.navbar-brand a');
        if (brandLink) brandLink.href = 'index.html';

        placeholder.querySelectorAll('.navbar-menu a').forEach(link => {
          const href = link.getAttribute('href');
          if (href && href.startsWith('../')) {
            link.setAttribute('href', href.replace(/^(\.\.\/)+/, ''));
          }
        });
      }

      // Initialize Theme Toggle
      const themeToggle = document.getElementById('theme-toggle');
      if (themeToggle) {
        themeToggle.addEventListener('click', () => {
          const currentTheme = document.documentElement.getAttribute('data-theme');
          const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', newTheme);
          localStorage.setItem('theme', newTheme);
        });
      }

      // Add toggle functionality
      const toggle = placeholder.querySelector('.navbar-toggle');
      const menu = placeholder.querySelector('.navbar-menu');
      if (toggle && menu) {
        toggle.addEventListener('click', () => {
          menu.classList.toggle('active');
        });
      }

      // Mobile Dropdown Toggle
      const dropdownTrigger = placeholder.querySelector('.navbar-dropdown > a');
      if (dropdownTrigger) {
        dropdownTrigger.addEventListener('click', (e) => {
          if (window.innerWidth <= 1150) {
            e.preventDefault();
            const parent = dropdownTrigger.closest('.navbar-dropdown');
            if (parent) {
              parent.classList.toggle('active');
            }
          }
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
          const qrContainer = document.getElementById('qr-container');
          if (qrContainer) qrContainer.style.display = 'none';
        });

        const qrToggleBtn = document.getElementById('qr-toggle-btn');
        const qrContainer = document.getElementById('qr-container');
        if (qrToggleBtn && qrContainer) {
          qrToggleBtn.addEventListener('click', () => {
            qrContainer.style.display = qrContainer.style.display === 'none' ? 'block' : 'none';
            qrToggleBtn.innerText = qrContainer.style.display === 'none' ? 'Scan QR Instead' : 'Hide QR Code';
          });
        }

        const payButtonFinal = document.getElementById('pay-button-final-link');
        if (payButtonFinal) {
          payButtonFinal.addEventListener('click', () => {
            modal.style.display = 'none';
          });
        }

        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
          });
        }

        window.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.style.display = 'none';
          }
        });
      }
    }
  } catch (error) {
    console.error('Error loading nav:', error);
  }
}

document.addEventListener('DOMContentLoaded', loadNav);
