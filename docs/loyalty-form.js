// Loyalty form client-side logic
(function() {
  // Store payload data for use in JavaScript
  const userData = {
    userId: document.getElementById('formTitle')?.dataset.userid || '',
    evseId: document.getElementById('formTitle')?.dataset.evseid || '',
    firstName: document.getElementById('formTitle')?.dataset.firstname || '',
    evseReference: document.getElementById('formTitle')?.dataset.evsereference || ''
  };
  const form = document.getElementById('loyaltyForm');
  const input = document.getElementById('loyaltyNumber');
  const inputHelp = document.getElementById('inputHelp');
  const submitButton = document.getElementById('submitButton');
  const successMessage = document.getElementById('successMessage');
  if (!form) { return; }
  if (!input) { return; }
  if (!submitButton) { return; }
  form.addEventListener('submit', function(e) {
    try {
      e.preventDefault();
      const value = input.value;
      if (value.length === 0) {
        inputHelp.textContent = 'Please enter your loyalty card number';
        inputHelp.className = 'input-help error-text';
        input.className = 'error';
        return;
      }
      if (!/^\d+$/.test(value)) {
        inputHelp.textContent = 'Please enter numbers only';
        inputHelp.className = 'input-help error-text';
        input.className = 'error';
        return;
      }
      if (value.length < 7) {
        inputHelp.textContent = 'Please enter a 7-digit card number';
        inputHelp.className = 'input-help error-text';
        input.className = 'error';
        return;
      }
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';
      const userId = document.querySelector('.context-info')?.dataset.userid;
      fetch(window.location.pathname, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      })
      .then(async resp => {
        if (resp.ok) {
          window.location.replace('/close');
          return;
        } else {
          const err = await resp.json();
          inputHelp.textContent = err.error || 'Server error';
          inputHelp.className = 'input-help error-text';
          input.className = 'error';
          submitButton.disabled = false;
          submitButton.textContent = 'Submit';
        }
      })
      .catch((err) => {
        inputHelp.textContent = 'Network/server error';
        inputHelp.className = 'input-help error-text';
        input.className = 'error';
        submitButton.disabled = false;
        submitButton.textContent = 'Submit';
      });
    return false;
    } catch (err) {
      inputHelp.textContent = 'An unexpected error occurred.';
    }
  });
})();