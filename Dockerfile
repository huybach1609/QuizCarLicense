# --- Build stage -------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1) Leverage layer caching: copy project file only, restore, then copy the rest
COPY ["QuizCarLicense.csproj", "."]
RUN dotnet restore "QuizCarLicense.csproj"

# 2) Copy the whole source and build
COPY . .
RUN dotnet build "QuizCarLicense.csproj" -c Release -o /app/build

# --- Publish stage -----------------------------------------------------------
FROM build AS publish
RUN dotnet publish "QuizCarLicense.csproj" -c Release -o /app/publish \
    -p:PublishReadyToRun=true -p:UseAppHost=false

# --- Runtime stage -----------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

ENV TZ=Asia/Ho_Chi_Minh
ENV ASPNETCORE_FORWARDEDHEADERS_ENABLED=true
ENV ASPNETCORE_URLS=http://+:6789

COPY --from=publish /app/publish .

EXPOSE 6789

ENTRYPOINT ["dotnet", "QuizCarLicense.dll"]
