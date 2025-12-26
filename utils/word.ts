
export async function getWordDefinition(word: string): Promise<string | undefined> {
    if (!navigator.onLine) {
        return undefined; // Cannot fetch definition offline
    }

    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        if (!response.ok) {
            return undefined;
        }
        const data = await response.json();
        if (data && data.length > 0 && data[0].meanings && data[0].meanings.length > 0 && data[0].meanings[0].definitions && data[0].meanings[0].definitions.length > 0) {
            return data[0].meanings[0].definitions[0].definition;
        }
    } catch (error) {
        console.error("Error fetching word definition:", error);
    }
    return undefined;
}
