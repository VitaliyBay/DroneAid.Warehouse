FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY DroneAid.Barcelona.Api.csproj ./
RUN dotnet restore

COPY . ./
RUN dotnet publish --configuration Release --output /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish ./

EXPOSE 8080
ENTRYPOINT ["dotnet", "DroneAid.Barcelona.Api.dll"]
