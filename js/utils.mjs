// It fetches a template to use it later
async function loadTemplate(templatePath) {
    const response = await fetch(templatePath);
    
    if (response.ok) {
      return response.text();
    } else {
      throw new Error(`Failed to load template: ${templatePath}`);
    }
  }
  
// It loads the header and footer dynamically
  async function loadHeaderFooter() {
    try {
      const headerTemplate = await loadTemplate('/partials/header.html');
      const footerTemplate = await loadTemplate('/partials/footer.html');
  
      const headerElement = document.getElementById('main-header');
      const footerElement = document.getElementById('main-footer');

      headerElement.innerHTML = headerTemplate;
      footerElement.innerHTML = footerTemplate;

    } catch (error) {
      console.error('Error loading header or footer:', error);
    }
  }

loadHeaderFooter();