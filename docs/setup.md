# Setup

## Required Dependencies
- PostgreSQL (recommended Version 11 or higher)
- NodeJS (recommended Version 14 or higher)
- npm (recommended Version 7.6 or higher)
- npm dependencies, installed by running `npm install`

## Optional Dependencies
- Graphviz - Needed for Madge and therefore needed to run `npm run docs:madge`
and `npm run docs`

## Setup
To setup PeerLab's database, config and user-content directory structure, run
`npm run setup`.

To add mock data, first ensure you have run `npm run setup`, then launch PeerLab
and sign up on the app, inserting you as the first and only user into the
database. Finally, run `npm run mock` and mock data will be added to the app,
tied to your account.
