# NOC Monitoring Dashboard

A clean, professional dashboard designed for internal network monitoring and downtime detection. Built with a modern, responsive interface for tracking the health and performance of your critical infrastructure.

## Features

- **Professional UI/UX**: A clean, "enterprise SaaS" design avoiding overly gamified aesthetics, focusing on clarity, metrics, and readability.
- **Real-time Monitoring**: Continuously checks the health, response time, and availability of configured endpoints.
- **Containerized Architecture**: Deploys seamlessly using Docker and Docker Compose, combining the React/Vite frontend and the Python monitoring backend.
- **Internal-Network Ready**: Ideal for deployment on an office network to provide a persistent, localized dashboard for infrastructure monitoring.

## Architecture

This application consists of two main components:
1. **Frontend**: A React application built with Vite and Tailwind CSS, presenting a live dashboard and historical reporting views.
2. **Backend**: A Python script (`monitor.py`) that periodically pings the configured URLs/IPs and logs status metrics locally.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Viishnu07/NOC-Monitoring.git
cd NOC-Monitoring
```

### 2. Configure Monitored Services

Edit the `urls.json` file in the root directory to define the endpoints you wish to monitor.

### 3. Deploy using Docker

Start the entire stack in detached mode:

```bash
docker-compose up -d --build
```

### 4. Access the Dashboard

Once the containers are successfully running, access the dashboard by navigating to `http://localhost` (or your machine's IP address) in your browser.

## Development Setup

To run the project locally without Docker:

### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
pip install -r requirements.txt
python monitor.py
```

## License

This project is licensed under the terms of the `LICENSE` file provided in the repository.
