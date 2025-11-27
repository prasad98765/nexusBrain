/**
 * Button Action Utilities
 * 
 * Handles various button actions like call, email, and URL opening
 * for Interactive Node buttons in the flow preview.
 */

/**
 * Execute a phone call action
 * @param phoneNumber - The phone number to call
 */
export const executeCallAction = (phoneNumber: string): void => {
    if (!phoneNumber) {
        console.warn('[ButtonAction] No phone number provided');
        return;
    }

    // Clean phone number (remove non-digit characters except +)
    const cleanedNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    console.log('[ButtonAction] Initiating call to:', cleanedNumber);
    
    // Open phone dialer
    window.location.href = `tel:${cleanedNumber}`;
};

/**
 * Execute an email action
 * @param emailAddress - The email address to send to
 * @param subject - Optional email subject
 * @param body - Optional email body
 */
export const executeEmailAction = (
    emailAddress: string,
    subject?: string,
    body?: string
): void => {
    if (!emailAddress) {
        console.warn('[ButtonAction] No email address provided');
        return;
    }

    console.log('[ButtonAction] Opening email client for:', emailAddress);

    // Build mailto URL
    let mailtoUrl = `mailto:${emailAddress}`;
    const params: string[] = [];

    if (subject) {
        params.push(`subject=${encodeURIComponent(subject)}`);
    }

    if (body) {
        params.push(`body=${encodeURIComponent(body)}`);
    }

    if (params.length > 0) {
        mailtoUrl += '?' + params.join('&');
    }

    // Open email client
    window.location.href = mailtoUrl;
};

/**
 * Execute an open URL action
 * @param url - The URL to open
 * @param openInNewTab - Whether to open in a new tab (default: true)
 */
export const executeOpenUrlAction = (
    url: string,
    openInNewTab: boolean = true
): void => {
    if (!url) {
        console.warn('[ButtonAction] No URL provided');
        return;
    }

    console.log('[ButtonAction] Opening URL:', url);

    // Ensure URL has protocol
    let finalUrl = url;
    if (!url.match(/^https?:\/\//i)) {
        finalUrl = 'https://' + url;
    }

    // Validate URL
    try {
        new URL(finalUrl);
    } catch (error) {
        console.error('[ButtonAction] Invalid URL:', url);
        return;
    }

    if (openInNewTab) {
        // Open in new tab with security features
        window.open(finalUrl, '_blank', 'noopener,noreferrer');
    } else {
        // Open in current tab
        window.location.href = finalUrl;
    }
};

/**
 * Execute button action based on action type
 * @param actionType - The type of action (connect_to_node, call_number, send_email, open_url)
 * @param actionValue - The value for the action (phone number, email, URL, etc.)
 * @returns boolean - Whether the action requires flow continuation
 */
export const executeButtonAction = (
    actionType: string,
    actionValue?: string
): boolean => {
    console.log('[ButtonAction] Executing action:', { actionType, actionValue });

    switch (actionType) {
        case 'connect_to_node':
            // This action is handled by flow execution
            return true;

        case 'call_number':
            if (actionValue) {
                executeCallAction(actionValue);
            }
            return true; // Continue flow after action

        case 'send_email':
            if (actionValue) {
                executeEmailAction(actionValue);
            }
            return true; // Continue flow after action

        case 'open_url':
            if (actionValue) {
                executeOpenUrlAction(actionValue);
            }
            return true; // Continue flow after action

        default:
            console.warn('[ButtonAction] Unknown action type:', actionType);
            return true; // Continue flow by default
    }
};

/**
 * Validate phone number format
 * @param phoneNumber - The phone number to validate
 * @returns boolean - Whether the phone number is valid
 */
export const validatePhoneNumber = (phoneNumber: string): boolean => {
    if (!phoneNumber) return false;
    
    // Basic validation: should contain digits and optionally +, -, (), spaces
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phoneNumber) && phoneNumber.replace(/\D/g, '').length >= 7;
};

/**
 * Validate email address format
 * @param email - The email address to validate
 * @returns boolean - Whether the email is valid
 */
export const validateEmail = (email: string): boolean => {
    if (!email) return false;
    
    // Standard email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate URL format
 * @param url - The URL to validate
 * @returns boolean - Whether the URL is valid
 */
export const validateUrl = (url: string): boolean => {
    if (!url) return false;
    
    try {
        // Add protocol if missing for validation
        const urlToValidate = url.match(/^https?:\/\//i) ? url : 'https://' + url;
        new URL(urlToValidate);
        return true;
    } catch {
        return false;
    }
};
