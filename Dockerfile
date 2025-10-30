# ﻿# User SDK image to build
# FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
# WORKDIR /src

# # Copy csproj and restore dependencies
# COPY ["QuizCarLicense.csproj", "."]
# RUN dotnet restore "QuizCarLicense.csproj"

# # Copy source code và build
# COPY . .
# RUN dotnet build "QuizCarLicense.csproj" -c Release -o /app/build

# FROM build AS publish
# RUN dotnet publish "QuizCarLicense.csproj" -c Release -o /app/publish

# # User runtime image to run app
# FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
# WORKDIR /app
# COPY --from=publish /app/publish .

# # Expose port
# EXPOSE 6211
# EXPOSE 6212

# ENTRYPOINT ["dotnet", "QuizCarLicense.dll"]


# --- Build stage -------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1) Leverage layer caching: copy project files only, restore, then copy the rest
COPY ["QuizCarLicense.csproj", "."]
# If you use Directory.Packages.props / NuGet.config, copy them too:
# COPY ["Directory.Packages.props", "NuGet.config", "./"]

RUN dotnet restore "QuizCarLicense.csproj"

# 2) Copy the whole source and build
COPY . .
RUN dotnet build "QuizCarLicense.csproj" -c Release -o /app/build

# --- Publish stage -----------------------------------------------------------
FROM build AS publish
# ReadyToRun gives faster startup (safe for Razor Pages). UseAppHost=false reduces image size
RUN dotnet publish "QuizCarLicense.csproj" -c Release -o /app/publish \
    -p:PublishReadyToRun=true -p:UseAppHost=false

# --- Runtime stage -----------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# (Optional) set timezone for logs; adjust as you like
ENV TZ=Asia/Ho_Chi_Minh

# Behind a reverse proxy, this enables X-Forwarded-* handling automatically
ENV ASPNETCORE_FORWARDEDHEADERS_ENABLED=true

# .NET 8 container default port is 8080; pick your port and make it explicit
ENV ASPNETCORE_URLS=http://+:6789

COPY --from=publish /app/publish .

# Expose only the port you actually bind to
EXPOSE 6789

# (Optional) healthcheck — if you map an endpoint like /health in your app
# HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "QuizCarLicense.dll"]
