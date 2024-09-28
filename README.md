# How to Run Source Code Using `http-server`

## Requirements
- Node.js must be installed on your computer. You can download Node.js from [nodejs.org](https://nodejs.org/).

## Step 1: Install `http-server`
To install `http-server` on your computer, open the terminal or command prompt and run the following command:

```bash
npm install -g http-server
```
## Step 2: Navigate to the Project Directory
Using the terminal or command prompt, navigate to the directory containing your covid-gis-vn project.

```bash
cd ~/covid-gis-vn
```
## Step 3: Run http-server
Once you are in the directory containing your source code, run the following command to start the HTTP server:

```
http-server
```

## Step 4: Access the Website
Open your browser and navigate to the URL provided by http-server, for example: http://127.0.0.1:8080.

## Notes
In some rare cases, data might not load when the page is first accessed. You can interact with the map by using Zoom in, Zoom out, or reselecting the date to trigger the data to load.
In the /diagram folder, there are files for generating diagrams. You can use Mermaid and PlantUML to run them.