TripMitra | Full-Stack Travel Optimization Platform
TripMitra is a decoupled, high-performance travel planning platform designed to generate budget-optimized, multi-day itineraries using real-time geospatial data. By separating the frontend, orchestration layer, and computational engine, TripMitra ensures efficient route generation for complex multi-user trips.

🚀 Key Features
Greedy Route-Optimization Engine: Employs the Haversine formula and multi-factor heuristics to process and rank 25+ daily attractions in under 500ms.

Dynamic Budget Enforcer: A runtime heuristic that prunes high-cost itinerary nodes and substitutes geographically coherent, lower-cost alternatives to maintain budget compliance.

Microservice Architecture: Decoupled platform utilizing a Node.js orchestrator for client traffic and a dedicated FastAPI computational engine for heavy spatial processing.

Group Collaboration & Finance: Multi-user travel module with secure SMTP invitation workflows, stateful trip management, and automated expense-splitting ledgers.

Interactive Visualization: Real-time rendering of optimized itineraries and attraction markers using React, Leaflet, and OpenStreetMap.

🛠 Tech Stack
Frontend: React (Vite), Tailwind CSS, Leaflet.js

Backend & Compute: Node.js, Express.js, Python, FastAPI, Axios

Database & Security: MongoDB (Atlas), Mongoose ODM, JWT, bcrypt

APIs & Infrastructure: Geoapify API, Nodemailer, Redis (Caching), Docker, Nginx

🏗 System Architecture
TripMitra offloads heavy mathematical computations from the primary Node.js API gateway to a high-speed Python/FastAPI microservice. This ensures the application remains responsive under load while providing complex, data-driven itinerary generation.

⚙️ How It Works (Algorithmic Approach)
The core optimization engine uses a greedy approach to solve the constrained optimization problem of itinerary planning. It considers:

Spatial Proximity: Calculating distance using spherical trigonometry.

Popularity Metrics: Ranking attractions based on real-world metadata.

Fiscal Constraints: The "Budget Enforcer" monitors the cumulative cost of selected nodes and initiates a substitution algorithm if the itinerary exceeds the user-defined threshold.

📈 Performance
Optimized Routing: <500ms processing time for complex daily itineraries.

Data Pipeline: Live integration with Geoapify for accurate, context-aware metadata within configurable search radii.
