async function loadNav() {
  try {
    const response = await fetch('../partials/nav.html');
    const html = await response.text();
    document.getElementById('nav-placeholder').innerHTML = html;
  } catch (error) {
    console.error('Error loading nav:', error);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  loadNav();
  // Delegate in case nav is loaded dynamically
  document.body.addEventListener('click', function(e) {
    if (e.target.classList.contains('navbar-toggle')) {
      var menu = document.querySelector('.navbar-menu');
      if (menu) menu.classList.toggle('active');
    }
  });
});