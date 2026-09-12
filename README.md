# cognitiverhythm

# Product Requirements Document (PRD): Progressive Survey Platform

## 1. Overview
The objective of this project is to build a responsive, mobile-first web application designed to collect academic survey data from IT professionals. The platform reduces survey fatigue by dividing a 47-item questionnaire into manageable modules, allowing participants to save their progress and complete it over multiple sessions. 

## 2. User Roles
* **Participant:** An IT professional taking the survey. They need a frictionless way to log in, track their progress, and complete modules at their own pace.
* **Administrator:** The primary researcher. They need secure access to monitor response rates and export raw data for statistical analysis.

## 3. Functional Requirements: Participant Flow
* **Authentication:** Simple email and password registration/login. Email acts as the unique identifier to prevent duplicate submissions. No complex password rules or Single Sign-On (SSO) required.
* **Session Management:** The application must remember the user's state (via cookies or local storage) across sessions to minimize re-login friction on the same device.
* **Modular Survey Engine:** The questionnaire is split into thematic clusters (e.g., Technostress, AI Anxiety, Grit, Job Performance). Users can complete one module at a time.
* **Progress Tracking:** A visual dashboard (e.g., circular progress bars or checklists) displaying completed versus pending modules.
* **Auto-Save:** Answers are automatically committed to the database upon selection or when navigating to the next question, ensuring zero data loss if a user closes the tab.

## 4. Functional Requirements: Administrator Flow
* **Secure Admin Gateway:** A hidden login route (e.g., `/admin`) restricted to researcher credentials.
* **Real-Time Analytics Dashboard:** High-level metrics showing total registered users, active users, and fully completed surveys.
* **Data Export Engine:** A one-click download feature that compiles all participant responses into a flattened CSV or Excel file. The export must align unique participant IDs with their specific answers across all modules for easy import into statistical software (e.g., SPSS, AMOS, or Python).

## 5. Non-Functional & Technical Requirements
* **Mobile-First Responsiveness:** The UI must adapt flawlessly to mobile screens, catering to users taking the survey on their phones during breaks.
* **Data Security & Privacy:** Passwords must be securely hashed (e.g., bcrypt) in the database. The backend must enforce role-based access control so participants can only access their own data.
* **Performance:** The application must be lightweight and load quickly on standard cellular networks to avoid user drop-off.

## 6. User Experience (UX) Architecture
* **Frictionless Onboarding:** Registration requires only an email and a simple password. No CAPTCHAs or email verification loops required to start answering questions.
* **Progressive Disclosure:** Use a "one-item-per-screen" or "one-cluster-per-screen" format to minimize cognitive load, rather than a long, scrolling page.
* **The Completion Reward:** Upon reaching 100%, the user is immediately redirected to a dynamic "Thank You" page displaying personalized insights based on their responses.

## 7. User Interface (UI) Design Guidelines
* **Dark Mode Default:** Defaults to a dark theme (dark greys with subtle accents) to align with standard developer environments and reduce eye strain.
* **Keyboard Navigation:** Support keyboard shortcuts (number keys 1-5 for Likert scales, 'Enter' for next) so power users can navigate the desktop version without a mouse.
* **Large Tap Targets:** The mobile interface must feature large, easily tappable buttons for Likert-scale options.
* **Micro-Interactions:** Provide subtle visual feedback (e.g., a non-intrusive "Saved" toast notification in the corner) when an answer is selected, building trust that data is secure.
