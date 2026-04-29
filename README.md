Almi Birds — Scoreboard & Social Platform

Almi Birds is a high-performance web platform designed for tracking game scores and managing a community of players. It features a futuristic "Cyberpunk" aesthetic and a robust frontend-to-API architecture for real-time leaderboards and user profile management.
🚀 Key Features

    Smart API Discovery: Features a self-healing connection logic that attempts multiple backend endpoints to ensure maximum uptime.

    Global Rankings: Real-time leaderboards with dynamic filtering by player name and score sorting.

    Top 3 Dashboard: An animated "Hall of Fame" on the home page highlighting the elite players with custom avatars and medals.

    Multi-Step Registration: A polished, user-friendly registration flow including account setup and profile customization.

    Profile Management: Users can update their email, country (integrated with the RestCountries API), and change passwords.

    Cloudinary Integration: Supports high-quality avatar uploads directly to the cloud.

    Cyberpunk UI: A fully responsive, dark-themed interface built with Rajdhani and Orbitron typography for a gaming feel.

🛠️ Technology Stack

    Frontend: HTML5, CSS3 (Advanced Flexbox/Grid and CSS Variables).

    Scripts: jQuery 3.7.1 for DOM manipulation and animations.

    Images: Cloudinary API for cloud-based media storage.

    Data Sources: RestCountries API for automated country selection.

    Session: Persistent authentication using Browser LocalStorage.

📂 Project Structure

    api.js: The core "engine." Handles all fetch requests, error handling, timeouts, and session security (Route Protection).

    index.js / ranking.js: Logic for fetching and rendering competitive data and Top 3 players.

    perfil.js / registro.js: Handles complex user interactions, form validation, and image uploads.

    index.css: Centralized design system with neon effects and mobile-first media queries.

⚙️ Installation & Backend Setup

    Clone the Repository:
    Bash

    git clone https://github.com/endikaa007-jpg/LDMMecalmi.git

    API Configuration:
    The system is configured to look for a backend at http://74.161.44.50:3000/api or localhost:3000/api. You can change the primary endpoint in the API_FALLBACK_URL constant inside js/api.js.

    Cloudinary Setup:
    To enable avatar uploads, ensure your Cloudinary cloudName and uploadPreset are updated in the obtenerConfigCloudinary() function or stored in LocalStorage.

📖 Usage Examples
Protected Routes

The platform automatically redirects unauthenticated users to the login page using the protegerPagina() function:
JavaScript

$(document).ready(function () {
    protegerPagina(); // Ensures the user is logged in
});

Manual API Calls

The requestApi helper manages retries and timeouts automatically across various base URLs:
JavaScript

const scores = await requestApi('/rankings');

Developed with ❤️ for the Almi Birds gaming community.