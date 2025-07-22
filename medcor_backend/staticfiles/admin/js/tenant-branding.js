/* Tenant Branding Admin JavaScript */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize color pickers with proper event handling
    initializeColorPickers();
    
    // Initialize live preview updates
    initializeLivePreview();
    
    // Initialize preset application
    initializePresetActions();
    
    // Initialize font family preview
    initializeFontPreview();
});

function initializeColorPickers() {
    const colorFields = [
        'primary_color', 'secondary_color', 'accent_color', 
        'background_color', 'text_color'
    ];
    
    colorFields.forEach(fieldName => {
        const field = document.querySelector(`#id_${fieldName}`);
        if (field) {
            field.setAttribute('type', 'color');
            field.addEventListener('change', updateLivePreview);
            field.addEventListener('input', updateLivePreview);
        }
    });
}

function initializeLivePreview() {
    // Add live preview functionality for all branding fields
    const previewableFields = [
        'primary_color', 'secondary_color', 'accent_color',
        'background_color', 'text_color', 'font_family'
    ];
    
    previewableFields.forEach(fieldName => {
        const field = document.querySelector(`#id_${fieldName}`);
        if (field) {
            field.addEventListener('change', updateLivePreview);
            field.addEventListener('input', updateLivePreview);
        }
    });
}

function updateLivePreview() {
    const previewElement = document.querySelector('.branding-preview-card');
    if (!previewElement) return;
    
    // Get current values
    const primaryColor = document.querySelector('#id_primary_color')?.value || '#2563eb';
    const secondaryColor = document.querySelector('#id_secondary_color')?.value || '#64748b';
    const accentColor = document.querySelector('#id_accent_color')?.value || '#06b6d4';
    const backgroundColor = document.querySelector('#id_background_color')?.value || '#ffffff';
    const textColor = document.querySelector('#id_text_color')?.value || '#1e293b';
    const fontFamily = document.querySelector('#id_font_family')?.value || 'Inter, system-ui, sans-serif';
    
    // Update preview styles
    previewElement.style.backgroundColor = backgroundColor;
    previewElement.style.color = textColor;
    previewElement.style.fontFamily = fontFamily;
    
    // Update buttons in preview
    const buttons = previewElement.querySelectorAll('button, .button-preview');
    buttons.forEach((button, index) => {
        switch(index) {
            case 0:
                button.style.backgroundColor = primaryColor;
                break;
            case 1:
                button.style.backgroundColor = secondaryColor;
                break;
            case 2:
                button.style.backgroundColor = accentColor;
                break;
        }
        button.style.fontFamily = fontFamily;
    });
    
    // Update headings
    const headings = previewElement.querySelectorAll('h3, h4, .heading-preview');
    headings.forEach(heading => {
        heading.style.color = primaryColor;
        heading.style.fontFamily = fontFamily;
    });
}

function initializePresetActions() {
    // Add preset application buttons
    const presetSelectors = document.querySelectorAll('.preset-selector');
    presetSelectors.forEach(selector => {
        selector.addEventListener('click', function(e) {
            e.preventDefault();
            applyPreset(this.dataset.presetId);
        });
    });
}

function applyPreset(presetId) {
    // This would typically make an AJAX call to apply a preset
    console.log('Applying preset:', presetId);
    
    // For demo purposes, show a confirmation
    if (confirm('Apply this branding preset? This will overwrite current branding settings.')) {
        // In a real implementation, this would make an API call
        alert('Preset application would be implemented here');
    }
}

function initializeFontPreview() {
    const fontField = document.querySelector('#id_font_family');
    if (fontField) {
        // Add font preview to the field itself
        fontField.addEventListener('change', function() {
            this.style.fontFamily = this.value;
        });
        
        // Set initial font
        fontField.style.fontFamily = fontField.value;
    }
}

// CSS Validation for custom CSS field
function validateCustomCSS() {
    const cssField = document.querySelector('#id_custom_css');
    if (!cssField) return;
    
    cssField.addEventListener('blur', function() {
        const css = this.value;
        
        // Basic CSS validation (this is a simple example)
        if (css && !css.includes('{') && css.includes(':')) {
            this.style.borderColor = '#ef4444';
            showValidationMessage(this, 'CSS appears to be invalid. Make sure to use proper CSS syntax.');
        } else {
            this.style.borderColor = '#10b981';
            hideValidationMessage(this);
        }
    });
}

function showValidationMessage(field, message) {
    // Remove existing message
    hideValidationMessage(field);
    
    const messageEl = document.createElement('div');
    messageEl.className = 'validation-message';
    messageEl.style.color = '#ef4444';
    messageEl.style.fontSize = '12px';
    messageEl.style.marginTop = '4px';
    messageEl.textContent = message;
    
    field.parentNode.appendChild(messageEl);
}

function hideValidationMessage(field) {
    const existingMessage = field.parentNode.querySelector('.validation-message');
    if (existingMessage) {
        existingMessage.remove();
    }
}

// Color accessibility checker
function checkColorContrast(backgroundColor, textColor) {
    // This is a simplified contrast checker
    // In a real implementation, you'd use a proper WCAG contrast ratio calculation
    
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    function getLuminance(rgb) {
        const { r, g, b } = rgb;
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }
    
    const bgRgb = hexToRgb(backgroundColor);
    const textRgb = hexToRgb(textColor);
    
    if (!bgRgb || !textRgb) return null;
    
    const bgLum = getLuminance(bgRgb);
    const textLum = getLuminance(textRgb);
    
    const contrast = (Math.max(bgLum, textLum) + 0.05) / (Math.min(bgLum, textLum) + 0.05);
    
    return contrast;
}

// Initialize contrast checking
function initializeContrastChecking() {
    const bgField = document.querySelector('#id_background_color');
    const textField = document.querySelector('#id_text_color');
    
    if (bgField && textField) {
        function checkContrast() {
            const contrast = checkColorContrast(bgField.value, textField.value);
            if (contrast && contrast < 4.5) {
                showContrastWarning();
            } else {
                hideContrastWarning();
            }
        }
        
        bgField.addEventListener('change', checkContrast);
        textField.addEventListener('change', checkContrast);
    }
}

function showContrastWarning() {
    const warning = document.querySelector('.contrast-warning') || document.createElement('div');
    warning.className = 'contrast-warning';
    warning.style.cssText = `
        background-color: #fef3c7;
        border: 1px solid #f59e0b;
        color: #92400e;
        padding: 8px 12px;
        border-radius: 4px;
        margin-top: 8px;
        font-size: 13px;
    `;
    warning.textContent = '⚠ Low contrast ratio detected. Consider adjusting colors for better accessibility.';
    
    const textField = document.querySelector('#id_text_color');
    if (textField && !document.querySelector('.contrast-warning')) {
        textField.parentNode.appendChild(warning);
    }
}

function hideContrastWarning() {
    const warning = document.querySelector('.contrast-warning');
    if (warning) {
        warning.remove();
    }
}

// Initialize all features
document.addEventListener('DOMContentLoaded', function() {
    initializeContrastChecking();
    validateCustomCSS();
});