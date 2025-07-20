export function capitalizeFirstLetter(word: string): string {
  if (!word) {
    return "";
  }
  const lowercasedWord = word.toLocaleLowerCase();

  return lowercasedWord.charAt(0).toUpperCase() + lowercasedWord.slice(1);
}

