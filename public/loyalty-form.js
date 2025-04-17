// Loyalty form client-side logic
(function() {
  var debugDiv = document.getElementById('debugMessage');
  function showDebug(msg) {
    if (debugDiv) debugDiv.textContent = msg;
  }
  // Clear fallback error if script runs
  if (debugDiv) debugDiv.textContent = '';
  showDebug('Loyalty form script loaded');
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
  if (!form) { showDebug('Form element not found!'); return; }
  if (!input) { showDebug('Input element not found!'); return; }
  if (!submitButton) { showDebug('Submit button not found!'); return; }
  form.addEventListener('submit', function(e) {
    try {
      showDebug('Form submit event triggered (handler start)');
      e.preventDefault();
      const value = input.value;
      if (value.length === 0) {
        showDebug('Validation failed: Loyalty card number is empty');
        inputHelp.textContent = 'Please enter your loyalty card number';
        inputHelp.className = 'input-help error-text';
        input.className = 'error';
        return;
      }
      if (!/^\d+$/.test(value)) {
        showDebug('Validation failed: Non-numeric characters entered');
        inputHelp.textContent = 'Please enter numbers only';
        inputHelp.className = 'input-help error-text';
        input.className = 'error';
        return;
      }
      if (value.length < 7) {
        showDebug('Validation failed: Loyalty card number is less than 7 digits');
        inputHelp.textContent = 'Please enter a 7-digit card number';
        inputHelp.className = 'input-help error-text';
        input.className = 'error';
        return;
      }
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';
      const userId = document.querySelector('.context-info')?.dataset.userid;
      showDebug('userId being sent: ' + userId);
      showDebug('POST body: ' + JSON.stringify({userId}));
      fetch(window.location.pathname, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    })
    .then(async resp => {
      if (resp.ok) {
        showDebug('Submission successful!');
        form.style.display = 'none';
        successMessage.style.display = 'block';
      } else {
        const err = await resp.json();
        showDebug('Server error: ' + (err.error || 'Unknown'));
        inputHelp.textContent = err.error || 'Server error';
        inputHelp.className = 'input-help error-text';
        input.className = 'error';
        submitButton.disabled = false;
        submitButton.textContent = 'Submit';
      }
    })
    .catch((err) => {
      showDebug('Network/server error: ' + err);
      inputHelp.textContent = 'Network/server error';
      inputHelp.className = 'input-help error-text';
      input.className = 'error';
      submitButton.disabled = false;
      submitButton.textContent = 'Submit';
    });
    return false;
    } catch (err) {
      showDebug('JS error: ' + (err && err.message ? err.message : err));
    }
  });
})();