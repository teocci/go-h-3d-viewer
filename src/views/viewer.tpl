{{ define "styles" }}
    <link rel="stylesheet" href="/css/viewer.css">
{{ end }}
{{ define "scripts" }}
    <script type="importmap">
        {
          "imports": {
            "three": "/vendors/three/bin/three.module.js",
            "three/addons/": "/vendors/three/examples/jsm/"
          }
        }
    </script>
{{ end }}
{{ define "modules" }}
    <script type="module" src="/js/viewer.js"></script>
{{ end }}
{{ define "content" }}
    <header>
        <div id="toolbar"></div>
    </header>
    <main>
        <div id="collections"></div>
        <div id="viewer"></div>
    </main>
    <footer>
        <div class="copyright"></div>
    </footer>
{{ end }}