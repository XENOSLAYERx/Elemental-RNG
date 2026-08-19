/* Derives the Artifact-ready page from the standalone index.html.
   Claude Artifacts wrap the uploaded file in its own <!doctype>/<head>/<body>,
   so those wrapper tags must be removed; everything else is byte-identical,
   keeping index.html the single source of truth. */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(root, "index.html"), "utf8");

const head = src.slice(src.indexOf("<head>") + 6, src.indexOf("</head>")).trim();
const body = src.slice(src.indexOf("<body>") + 6, src.lastIndexOf("</body>")).trim();

const out = head + "\n" + body + "\n";
if (/<!doctype|<html|<\/html>|<body>|<\/head>/i.test(out)) throw new Error("wrapper tags survived the strip");
if (!out.includes("<title>")) throw new Error("title missing");

const dest = path.join(root, "artifact.html");
fs.writeFileSync(dest, out);
console.log("artifact.html written:", out.length, "bytes,", out.split("\n").length, "lines");
