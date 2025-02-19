{{ define "styles" }}
    <link rel="stylesheet" href="/css/viewer.css">
{{ end }}
{{ define "scripts" }}
    <script type="importmap">
        {
          "imports": {
            "three": "https://unpkg.com/three@0.173.0/build/three.module.js",
            "three/addons/": "https://unpkg.com/three@0.173.0/examples/jsm/"
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