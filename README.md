# Globetrotter - Microsoft Reactor JavaScript AI Build-a-Thon 2026
A fun, LLM-powered way to discover landmarks on a globe

### Software Requirements:
- [Node JS](https://nodejs.org/)
- [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- Free MapTiler API key [(Guide)](https://docs.maptiler.com/cloud/api/authentication-key/)

### Hardware Requirements:
- 16GB+ of system memory
- Dedicated graphics processor with 10GB+ VRAM
- Internet connection

## Running GlobeTrotter
1. Download the repository
2. Open up Terminal or Command Prompt
3. Change directory to the root of the repository download (`/Globetrotter-Build-a-Thon-2026`)
4. Enter `npm install` (`npm.cmd install` for Windows)
5. Once installed, you should see a `node_modules` folder
6. Run the Node JS server: `node javascript/server.js`
7. On the first run, Foundry Local Manager will install Phi-4-mini (4GB to 6GB)
8. On Windows, Phi-4-mini is installed in the user folder: `C/Users/<You>/.GlobeTrotter`
9. Once downloaded and loaded into memory, Node JS will initialise the LLM agents
10. Then the server will activate on `http://localhost:8000`
11. Visit the local host domain to use GlobeTrotter
12. To quit GlobeTrotter, press `ctrl+c` at least twice in the Terminal to shut down the server and Microsoft Foundry

> [!IMPORTANT]
> Before you run GlobeTrotter, create a keys.js file in the javascript folder.
> In keys.js, paste the following code: module.exports = { MAPTILER_KEY: "key_from_internet" };
> Remember to generate a MapTiler API key using the guide in Software Requirements

>[!NOTE]
> In `client.js` there are commented-out functions that display an image of a location from Wikipedia.
> The idea was to show a picture of a given landmark next to the MapTiler map on GlobeTrotter
> However, the Wikipedia pictures didn't match the aesthetic.
> If you want to try it, uncomment the code and add an image element with id='Wikipedia-Image' in `index.html`
