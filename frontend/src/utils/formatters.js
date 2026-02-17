export const formatPhoneNumber = (number) => {
  if (!number) return '';
  
  // Remove all non-numeric characters
  const cleaned = ('' + number).replace(/\D/g, '');
  
  // Handle empty or short numbers
  if (cleaned.length < 10) return number;

  // Check for common country codes or patterns
  
  // US/Canada: 1 + 10 digits => +1 (XXX) XXX-XXXX
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  // Brazil: 55 + 10 or 11 digits => +55 (XX) XXXXX-XXXX
  if (cleaned.startsWith('55')) {
    const local = cleaned.slice(2);
    if (local.length === 11) {
      return `+55 (${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
    }
    if (local.length === 10) {
      return `+55 (${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
    }
  }

  // Generic formatting (groups of 3-4) if valid length
  if (cleaned.length > 6) {
     const match = cleaned.match(/^(\d{1,3})(\d{3})(\d{3})(\d{4})$/);
     if (match) {
       return `+${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
     }
  }

  return '+' + cleaned;
};
