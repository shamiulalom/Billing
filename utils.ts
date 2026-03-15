export const getFormattedDate = (date: Date): string => {
  // Returns format: 01-Jan-2025
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date).replace(/ /g, '-');
};

export const getFilenameDate = (dateStr: string): string => {
  // Input: 01-Jan-2025 -> Output: 01.01.25
  try {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      // Handle DD/MMM/YYYY
      const day = parts[0].padStart(2, '0');
      const monthMap: Record<string, string> = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
      const month = monthMap[parts[1]] || '01';
      const year = parts[2].slice(-2);
      return `${day}.${month}.${year}`;
    }
    return '00.00.00';
  } catch (e) {
    return '00.00.00';
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

export const numberToWords = (num: number): string => {
  if (num === 0) return "Zero dollars";

  const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];

  const convertHelper = (n: number): string => {
    let res = "";
    if (n >= 100) {
      res += ones[Math.floor(n / 100)] + " hundred ";
      n %= 100;
    }
    if (n >= 20) {
      res += tens[Math.floor(n / 10)] + (n % 10 !== 0 ? "-" + ones[n % 10] : "");
    } else if (n >= 10) {
      res += teens[n - 10];
    } else if (n > 0) {
      res += ones[n];
    }
    return res.trim();
  };

  let integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let words = "";

  if (integerPart >= 1000000) {
    words += convertHelper(Math.floor(integerPart / 1000000)) + " million, ";
    integerPart %= 1000000;
  }
  
  if (integerPart >= 1000) {
    words += convertHelper(Math.floor(integerPart / 1000)) + " thousand, ";
    integerPart %= 1000;
  }

  if (integerPart > 0) {
    words += convertHelper(integerPart);
  }

  // Clean up potential trailing commas and spaces
  words = words.trim().replace(/,$/, "");
  
  if (!words) words = "Zero";
  
  const dollarStr = Math.floor(num) === 1 ? " dollar" : " dollars";
  let result = words.charAt(0).toUpperCase() + words.slice(1) + dollarStr;

  if (decimalPart > 0) {
    const centStr = decimalPart === 1 ? " cent" : " cents";
    result += " and " + convertHelper(decimalPart) + centStr;
  }

  return result + ".";
};