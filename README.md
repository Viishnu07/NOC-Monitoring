# NOC Monitoring Dashboard

A clean, professional dashboard designed for internal network monitoring and downtime detection. Built with a modern, responsive interface for tracking the health and performance of your critical infrastructure.

## Features

- **Professional UI/UX**: A clean, "enterprise SaaS" design avoiding overly gamified aesthetics, focusing on clarity, metrics, and readability.
- **Real-time Monitoring**: Continuously checks the health, response time, and availability of configured endpoints.
- **Automated Updates**: Deploys seamlessly via GitHub Pages, with a GitHub Action automatically running the monitoring script and pushing updates.
- **Public Dashboard**: Ideal for deployment as a public-facing status page to provide persistent monitoring of your infrastructure.

## Architecture

This application consists of two main components:
1. **Frontend**: A React application built with Vite and Tailwind CSS, presenting a live dashboard and historical reporting views.
2. **Backend**: A Python script (`monitor.py`) that periodically pings the configured URLs/IPs. A GitHub Action automatically runs this script on a schedule and pushes the updated JSON data back to the repository.

## Getting Started

### 1. Fork or Clone the repository

```bash
git clone https://github.com/Viishnu07/NOC-Public-Monitoring.git
cd NOC-Public-Monitoring
```

### 2. Configure Monitored Services

Edit the `urls.json` file in the root directory to define the endpoints you wish to monitor.

### 3. Deploy to GitHub Pages

1. Push your changes to your GitHub repository.
2. Ensure you have given your GitHub Actions **Read and write permissions** under `Settings > Actions > General > Workflow permissions`.
3. The included GitHub Action will automatically run the monitoring script, commit the new `status.json` and `history.json` files, and trigger a GitHub Pages rebuild.
4. Enable GitHub Pages in your repository settings, pointing it to the `gh-pages` branch or your deployment branch.

## Development Setup

To run and test the frontend UI locally:

```bash
npm install
npm run dev
```

## License

This project is licensed under the terms of the `LICENSE` file provided in the repository.
