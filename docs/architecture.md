# Software Architecture
Architecture design dictating the layers, components and file structure of the web application.


## Architecture
![Architecture Diagram](img/architecture.png)
- Express API Layer - Contains all the API routes, middleware and controllers
- Service Layer - Contains all the business logic
- Data Access Layer - Contains all database interactions


## File Structure
```
.
|-- db                      # Database initialisation
    |-- migrations
    |-- index.js
|-- docs                    # Documentation
|-- public                  # Static content
    |-- assets
        |-- img
    |-- css
    |-- js
    |-- user-content        # User content for work pdfs, profile imgs, etc.
|-- src
    |-- controllers         # Controllers for route logic
    |-- db-access           # Data access - Parameterized queries
    |-- middleware          # Middleware for authentication, validation, etc.
    |-- routes              # Express API routes
    |-- services            # Business logic
    |-- utils               # Common logic functions
    |-- app.js              # Server entry point
|-- tests                   # Unit Tests
```