import { useState } from 'react';

const useCopyToClipboard = () => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return true;
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        
        textarea.focus();
        textarea.select();
        
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          return true;
        } else {
          // Last resort: show prompt
          window.prompt('Copy this text:', text);
          return false;
        }
      }
    } catch (error) {
      console.error('Copy failed:', error);
      window.prompt('Copy this text:', text);
      return false;
    }
  };

  return { copyToClipboard, copied };
};

export default useCopyToClipboard;