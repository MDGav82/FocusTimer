# Description
This project is an app to create a Pomodoro.
It is created with Bun and PostgreSQL.


# Prérequis
 Bun : https://bun.com/

# Install 
## bun-react-tailwind-template

1. Clone the repository.

2. To install dependencies:

    ```bash
    bun install
    ```

To start a development server:

```bash
bun dev
```

To run for production:

```bash
bun start
```

This project was created using `bun init` in bun v1.3.9. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## Run with docker

### Build :

Create a .env with .env.example

Build the image :
```bash 
docker-compose up --build -d
```
Start 
```bash 
docker-compose up -d
```
Stop
```bash 
docker compose down
```
Connect to database 
```bash 
docker exec -it focustimer-postgres-1 psql -U POSTGRES_USER -d POSTGRES_DB
```


# Access 

http://localhost:3000/
# Swagger 

Link : http://localhost:3000/api-docs