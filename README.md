# QuizCarLicense

## Overview
QuizCarLicense is an ASP.NET Core Razor Pages application designed to help Vietnamese drivers practice for the national car license exam. The site delivers multiple-choice quizzes drawn from the official question bank, tracks user progress, and highlights areas that need more study.

## Features
- 🇻🇳 **Localized question bank** sourced from the official Vietnamese driving exam material.
- 📝 **Practice quizzes** with instant feedback for each answer.
- 📊 **Progress tracking** so learners can monitor strengths and weaknesses.
- 🔁 **Category-based review** to focus on specific topics (traffic signs, theory, situational awareness, etc.).
- 📱 **Responsive UI** built with Razor Pages and Bootstrap for desktop and mobile users.

## Tech Stack
- [.NET 8](https://dotnet.microsoft.com/) with ASP.NET Core Razor Pages
- Entity Framework Core for data access
- SQL Server (local or Azure) as the backing database
- Docker & Docker Compose for containerized deployments

## Getting Started
### Prerequisites
- .NET 8 SDK
- SQL Server instance (LocalDB, Docker, or hosted)
- Node.js & npm (for building static assets if you extend the front-end)
- Docker (optional, for containerized workflows)

### Clone the Repository
```bash
git clone https://github.com/<your-account>/QuizCarLicense.git
cd QuizCarLicense
```

### Configure Environment
1. Copy the sample settings file:
   ```bash
   cp appsettings.json appsettings.Development.json
   ```
2. Update connection strings and other secrets in `appsettings.Development.json`.
3. Apply database migrations:
   ```bash
   dotnet ef database update
   ```

### Run the Application
```bash
dotnet watch run
```
The site will be available at `https://localhost:5001` (or the port printed in the console).

### Run with Docker

You can launch the published Docker image together with a SQL Server instance by using the provided `docker-compose.yml` and `.env` template.

1. Copy the sample environment file and adjust the values for your environment (especially the passwords and data paths):
   ```bash
   cp .env\(sample\) .env
   # edit .env
   ```
2. Start the stack:
   ```bash
   docker compose up -d
   ```
   This pulls the [`weback1609/quizcarlicense`](https://hub.docker.com/r/weback1609/quizcarlicense) image, provisions a SQL Server 2022 container, and binds the web app to `http://localhost:6789`.
3. Tear down the containers when you are done:
   ```bash
   docker compose down
   ```

If you prefer to build the image locally from the `Dockerfile`, run:
```bash
docker compose build
docker compose up -d
```
This will build the application image and use it in place of the published image.

## Testing
```bash
dotnet test
```
Add more unit and integration tests under the `Tests/` directory as the project evolves.

## Demo & Screenshots
To display a demo image or animated GIF in the README, add the asset to the repository (for example inside `wwwroot/images/`). Then reference it using Markdown:
```markdown
![QuizCarLicense demo](wwwroot/images/demo.png)
```
For externally hosted media, use the full URL instead of a relative path.

## Deployment
- **Azure App Service**: Publish with `dotnet publish` and deploy via GitHub Actions or the Azure CLI.
- **Docker**: Push the built image to a container registry and deploy to Azure Web Apps for Containers or any Docker-compatible host.
- **On-premises IIS**: Publish a self-contained package and configure IIS to run the site under the ASP.NET Core Module.

## Contributing
1. Fork the project.
2. Create your feature branch (`git checkout -b feature/awesome-feature`).
3. Commit your changes (`git commit -m "Add awesome feature"`).
4. Push to the branch (`git push origin feature/awesome-feature`).
5. Open a Pull Request.

Please follow the existing coding conventions and run the test suite before submitting PRs.

## License
Distributed under the MIT License. See `LICENSE` for more information.

## Contact
- **Project Maintainer**: Your Name – <you@example.com>
- **Project Link**: https://github.com/<your-account>/QuizCarLicense