
import { Difficulty } from './types.ts';

export const DIFFICULTIES: Difficulty[] = [Difficulty.Easy, Difficulty.Medium, Difficulty.Hard, Difficulty.Expert, Difficulty.Master];

export const VERSION_HISTORY = [
    {
        version: "1.0.0",
        date: "December 1, 2024",
        changes: [
            "Initial release with Sudoku, Wordle, Colordle, and Geodle games.",
            "Basic game logic and UI.",
        ]
    },
    {
        version: "1.1.0",
        date: "December 10, 2024",
        changes: [
            "Performance improvement: Migrated Geo and Color game logic from remote AI to client-side calculations.",
            "Optimized AI usage for hints with caching.",
            "Fixed automatic difficulty selection bug.",
            "Fixed Colordle: Accepts valid color names, rejects made-up words.",
            "Implemented larger Wordle word bank and random word selection.",
            "Ensured core application functionality works offline.",
            "Enhanced Wordle input logic to prevent over-typing.",
            "Improved mobile keyboard responsiveness for Wordle.",
            "Enhanced overall mobile experience with content scrolling.",
            "Fixed End Game/Completion Menu not appearing.",
            "Fixed History Tab to display definitions for completed Wordle words.",
            "Fixed Wordle: 'PLENE' word validation issue.",
            "Improved History Tab design and visual appeal.",
            "Added game version display in the Settings Menu."
        ]
    },
    {
        version: "1.2.0",
        date: "December 20, 2024",
        changes: [
            "Re-evaluated and improved Wordle difficulty assignment logic.",
            "Enhanced End Game Menu to display outcome details (completed/failed, time, description).",
            "Fixed Colordle validation to reject invalid inputs and stop incorrectly labeling them as grey, and provided visual feedback.",
            "Implemented saving of all unfinished (in-progress) games in the History Tab for all game modes.",
            "Fixed Colordle 100% match issue, ensuring correct answers now yield a precise 100% score.",
            "Improved Settings Screen styling for better layout and visibility.",
            "Adjusted Wordle Letter Boxes sizes for better fit on mobile screens.",
            "Implemented enhanced mobile back gesture for smoother navigation."
        ]
    },
    {
        version: "1.3.1",
        date: "December 26, 2025",
        changes: [
            "Version bump."
        ]
    },
    {
        version: "1.3.3",
        date: "December 26, 2025",
        changes: [
            "Implemented ESC key functionality in Pause Menu to resume game.",
            "Adjusted hint icon alignment in ColordleInput and GeodleInput.",
            "Redesigned the BulbIcon for a simpler appearance.",
            "Moved game info (title, difficulty, timer) to the top-center in game view.",
            "Modified CompletionMenu to explicitly show success/failure status and the actual solution.",
            "Removed redundant overflow-y-auto from HistoryScreen's main tag to fix mobile scrolling.",
            "Increased general size and improved appearance of the Settings tab.",
            "Adjusted Wordle letter box sizes to fit better on mobile screens.",
            "Improved mobile typing experience for Colordle and Geodle by optimizing autofocus and adding inputmode/enterKeyHint attributes."
        ]
    },
    {
        version: "1.3.4",
        date: "December 26, 2025",
        changes: [
            "Implemented auto-typing on PC: Input fields now gain focus automatically when a game view is active.",
            "Corrected version dates in VERSION_HISTORY to be accurate and chronological.",
            "Implemented ESC key functionality in NotesEditor to close the notes editor.",
            "Ensured a subtle transition back to the pause menu after closing the notes editor (animations already present).",
            "Made the 'Resume Game' button in StatisticsModal larger and black for improved visibility."
        ]
    },
    {
        version: "1.3.5",
        date: "December 26, 2025",
        changes: [
            "Version bump as per user request."
        ]
    },
    {
        version: "1.3.6",
        date: "December 26, 2025",
        changes: [
            "Implemented robust, centralized focus management for auto-typing on PC. Input fields for Colordle/Geodle and the game container for Wordle now reliably gain and retain focus, allowing typing without clicking."
        ]
    },
    {
        version: "1.3.7",
        date: "December 26, 2025",
        changes: [
            "Fixed 'question mark' placeholder placement on Colordle and Geodle to be correctly centered.",
            "Ensured the textarea in NotesEditor automatically gains focus when the editor opens."
        ]
    },
    {
        version: "1.3.8",
        date: "December 26, 2025",
        changes: [
            "Implemented aggressive focus retention for NotesEditor textarea to ensure continuous typing without interruption."
        ]
    },
    {
        version: "1.3.9",
        date: "December 26, 2025",
        changes: [
            "Fixed critical crash when opening NotesEditor by reverting aggressive focus retention logic."
        ]
    },
    {
        version: "1.4.0",
        date: "December 26, 2025",
        changes: [
            "Centralized Escape key handling in App.tsx for consistent pause menu behavior.",
            "Re-implemented auto-focus for NotesEditor to ensure typing without clicking, leveraging autoFocus attribute and App.tsx's centralized focus management."
        ]
    }
];