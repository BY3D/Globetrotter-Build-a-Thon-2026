# A Walkthrough of GlobeTrotter

## The Backend

The Backend of GlobeTrotter consists of Node JS, Microsoft Foundry Local, 

When Node JS executes `server.js`, it configures Foundry Local and the local web server for GlobeTrotter.
`server.js` finds the appropriate files in the `/javascript` and `/ui` folders.
From there, `server.js` initialises `agents-api.js` to activate the AI agents and to allow communication between the frontend and backend.
The web server itself is created as well.
The API key for MapTiler, stored in `javascript/keys.js` is packaged into an accessible API call
Note that MapLibre,