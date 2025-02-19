# go-h-3d-Viewer

A 3D viewer application built to visualize and interact with 3D models and GIS data, powered by Go and JavaScript. This project provides a web-based interface for loading, displaying, and manipulating 3D models in formats like STL, FBX, and PLY, along with GIS scene building and collection management.

## Overview

The `go-h-3d-viewer` is designed to offer an intuitive interface for users to explore 3D models and geospatial data. It includes features such as model fitting, axis adjustments, snapshot generation, and a table of contents (TOC) for managing collections. The application leverages modern web technologies, REST API calls, and GLSL shaders for rendering.

## Features

- Load and display 3D models in formats such as STL, FBX, and PLY.
- Interactive GIS scene building and visualization.
- Toolbar for common actions like model fitting, axis adjustments, and snapshot capture.
- Table of Contents (TOC) for managing and selecting collections.
- REST API integration for fetching data dynamically.
- Customizable CSS and JavaScript components for a tailored user experience.

## Prerequisites

- Go (latest stable version)
- Node.js and npm (for handling frontend assets)
- Web browser (modern browsers like Chrome, Firefox, or Edge)
- Git (for cloning the repository)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/go-h-3d-viewer.git
cd go-h-3d-viewer
```

2. Install Go dependencies:

```bash
go mod download
```

3. Copy the sample configuration and environment files:

```bash
cp config.sample.json config.json
cp .env.sample .env
```

Edit config.json and .env to match your environment settings (e.g., API endpoints, database configurations).

6. Build the Go application:

```bash
go build -o viewersrv main.go
```

## Usage
1. Run the application:

```bash
./viewersrv
```

2. Open your web browser and navigate to http://localhost:8080 (or the port specified in your configuration).

3. Use the interface to:
- Load 3D models from the public/3d/ directory (e.g., example.stl, robo-arm.fbx).
- Interact with the viewer using the toolbar (fit model, adjust axes, take snapshots).
- Manage collections via the TOC component, which allows selecting and highlighting specific data sets.

4. To fetch and display GIS data, ensure the REST API is configured and accessible. The application will automatically load collections as defined in pageInfo.params.collections.

## Project Structure
The project is organized as follows:

```
teocci-go-h-3d-viewer/
├── LICENSE
├── app.db
├── config.sample.json
├── go.mod
├── go.sum
├── main.go
├── package.json
├── users.json
├── .env.sample
└── public/
├── page.html
├── viewer.html
├── 3d/ (3D model files like STL, FBX, PLY)
├── css/ (Stylesheets for different components and pages)
├── glsl/ (Shader files for 3D rendering)
├── img/ (Image assets)
├── js/ (JavaScript modules and components)
└── json/ (JSON data files for collections)
```

## Main Components
- ViewerModule: The core JavaScript module (`public/js/modules/viewer-module.js`) handles the initialization of the 3D viewer, toolbar, and TOC. It loads GIS data via REST API, builds scenes, and manages user interactions.
- ToolbarComponent: Provides controls for fitting models, adjusting axes, and capturing snapshots.
- ViewerComponent: Renders and animates 3D models, handles scene building, and highlights collections.
- TOCComponent: Manages the table of contents, allowing users to select and deselect collections.

## Contributing
Contributions are welcome! Please fork the repository, make your changes, and submit a pull request. Ensure your code follows the existing style and includes appropriate tests.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.

## Contact
For questions or support, contact [teocci@yandex.com][1].

[1]: mailto:teocci@yandex.com