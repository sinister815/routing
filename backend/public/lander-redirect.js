/**
 * Lander Redirect Script
 * 
 * Include this script on your lander page to enable automatic redirect to the offer URL.
 * The offer URL is passed via the 'next' query parameter by the routing engine.
 * 
 * Usage:
 *   <script src="https://YOUR_DOMAIN/lander-redirect.js" data-trigger="form" data-form-id="myForm"></script>
 *   <script src="https://YOUR_DOMAIN/lander-redirect.js" data-trigger="button" data-button-id="myBtn"></script>
 * 
 * Trigger options:
 *   - "form"    : Redirects when the specified form is submitted
 *   - "button"  : Redirects when the specified button is clicked
 * 
 * The script preserves the click_id parameter for attribution tracking.
 */
(function () {
  'use strict';

  // Configuration from script tag data attributes
  const scriptTag = document.currentScript;
  const trigger = scriptTag?.getAttribute('data-trigger') || 'form';
  const formId = scriptTag?.getAttribute('data-form-id');
  const buttonId = scriptTag?.getAttribute('data-button-id');

  /**
   * Get the 'next' URL from query parameters
   */
  function getNextUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('next');
  }

  /**
   * Get the 'click_id' from query parameters
   */
  function getClickId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('click_id');
  }

  /**
   * Build the final redirect URL with click_id preserved
   */
  function buildRedirectUrl() {
    const nextUrl = getNextUrl();
    if (!nextUrl) return null;

    const clickId = getClickId();
    if (!clickId) return nextUrl;

    // Append click_id to the next URL for attribution
    const separator = nextUrl.includes('?') ? '&' : '?';
    return `${nextUrl}${separator}click_id=${encodeURIComponent(clickId)}`;
  }

  /**
   * Perform the redirect
   */
  function redirect() {
    const url = buildRedirectUrl();
    if (url) {
      window.location.href = url;
    }
  }

  /**
 * Attach event listener based on trigger type
   */
  function attachTrigger() {
    if (trigger === 'button') {
      const button = document.getElementById(buttonId);
      if (button) {
        button.addEventListener('click', function (e) {
          e.preventDefault();
          redirect();
        });
      } else {
        console.warn(`[LanderRedirect] Button with id "${buttonId}" not found.`);
      }
    } else {
      // Default: form submit
      const form = formId ? document.getElementById(formId) : document.querySelector('form');
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          redirect();
        });
      } else {
        console.warn(`[LanderRedirect] Form${formId ? ` with id "${formId}"` : ''} not found.`);
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachTrigger);
  } else {
    attachTrigger();
  }
})();
