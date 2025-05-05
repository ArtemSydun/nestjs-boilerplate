export const toCamelCase = (str: string, separator: string): string => {
  const words = str.split(separator);

  return words
    .map((word, index) => {
      return index === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
};
