# Zen Sudoku

A beautifully designed, minimalist Sudoku game built with React, TypeScript, and Tailwind CSS. Enjoy a classic puzzle experience with multiple difficulty levels and a clean, black and white aesthetic that's easy on the eyes.

**[> View Live Demo <](https://<your-username>.github.io/<your-repo-name>/)**

*(You'll need to deploy your own version to see it live!)*

![Zen Sudoku Screenshot](https://i.imgur.com/example.png "Screenshot of the Zen Sudoku game board")
*(Replace this with a screenshot of your app after deploying)*

---

## ✨ Features

*   **Five Difficulty Levels**: From `Easy` to `Master`, suitable for all players.
*   **Clean & Minimalist UI**: A distraction-free, black and white theme helps you focus on the puzzle.
*   **Responsive Design**: Plays perfectly on both desktop and mobile devices.
*   **Automatic Saving**: In-progress games are saved automatically, so you never lose your place.
*   **Game History**: Track all your completed games, sorted by difficulty.
*   **Detailed Statistics**: Review your performance for each completed game, including time taken and total moves.
*   **Move Timelapse**: Watch a replay of your entire solution from start to finish.
*   **Mistake Highlighting**: Choose from three modes: off, temporary, or persistent highlighting to help you spot errors.
*   **Intuitive Controls**:
    *   **Desktop**: Use your keyboard (`1-9` for numbers, `Backspace` to erase).
    *   **Mobile**: A sleek, pop-up number pad for easy input.
*   **Gesture Navigation**: On mobile, swipe down from the game or right from other screens to return to the main menu.

## 🛠️ Tech Stack

*   **Framework**: [React](https://reactjs.org/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)

---

## 🚀 Getting Started: Installation & Deployment

Follow these instructions to set up the project locally and deploy it to your own GitHub Pages.

### Prerequisites

*   **Node.js and npm**: You must have Node.js (which includes npm) installed on your computer. You can download it from [nodejs.org](https://nodejs.org/).
*   **Git**: You must have Git installed.

### 1. Local Development

To run the app on your local machine for development and testing:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/<your-username>/<your-repo-name>.git
    cd <your-repo-name>
    ```

2.  **Install dependencies:**
    This command reads `package.json` and installs all the necessary libraries.
    ```bash
    npm install
    ```

3.  **Run the development server:**
    This will start a local server, usually at `http://localhost:5173`.
    ```bash
    npm run dev
    ```

### 2. Deployment to GitHub Pages

Follow these steps carefully to publish your app as a live website.

#### **Step A: Critical Configuration**

You **must** update two files to point to your specific GitHub repository. Let's assume your GitHub username is `my-username` and your repository is `zen-sudoku`.

1.  **Edit `package.json`:**
    *   Open the `package.json` file.
    *   Find the `"homepage"` line and replace the placeholders.

    **Example:**
    ```diff
    - "homepage": "https://<your-username>.github.io/<your-repo-name>/",
    + "homepage": "https://my-username.github.io/zen-sudoku/",
    ```

2.  **Edit `vite.config.ts`:**
    *   Open the `vite.config.ts` file.
    *   Find the `base` property and replace the placeholder.

    **Example:**
    ```diff
    - base: '/<your-repo-name>/',
    + base: '/zen-sudoku/',
    ```

#### **Step B: Push to GitHub**

Commit your configuration changes and push the project to your GitHub repository.

```bash
git add .
git commit -m "Configure for deployment"
git push origin main
```

#### **Step C: Run the Deploy Script**

This single command builds your application and pushes the final version to a `gh-pages` branch on your repository.

```bash
npm run deploy
```

#### **Step D: Enable GitHub Pages in Repository Settings**

1.  Go to your repository on GitHub.
2.  Click on the **Settings** tab.
3.  In the left sidebar, navigate to the **Pages** section.
4.  Under "Build and deployment", set the **Source** to **Deploy from a branch**.
5.  In the branch dropdowns, select **`gh-pages`** as the branch and `/ (root)` as the folder.
6.  Click **Save**.

Your website will be live in a few minutes at the URL you specified in the `homepage` field!

## 📂 Project Structure

```
/
├── public/
├── src/
│   ├── components/    # Reusable React components (Board, NumberPad, etc.)
│   ├── services/      # Sudoku generation logic
│   ├── utils/         # Helper functions (e.g., time formatting)
│   ├── App.tsx        # Main application component
│   ├── constants.ts   # Project constants
│   ├── index.tsx      # Entry point for React
│   └── types.ts       # TypeScript type definitions
├── .gitignore
├── index.html
├── package.json
├── README.md
└── vite.config.ts
```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
