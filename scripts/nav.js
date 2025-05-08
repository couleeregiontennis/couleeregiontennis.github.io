async function loadNav() {
  try {
    const response = await fetch('../partials/nav.html');
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
  } catch (error) {
    console.error('Error loading nav:', error);
  }
}

document.addEventListener('DOMContentLoaded', loadNav);