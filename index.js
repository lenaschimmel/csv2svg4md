const http = require("http");
const axios = require("axios").default;
const { parse } = require("csv-parse/sync");
const xmlescape = require("xml-escape");
const port = 3000;

const requestHandler = (request, ourResponse) => {
  let csvUrl = request.url.substring(1);

  ourResponse.setHeader("Content-Type", "image/svg+xml");
  ourResponse.setHeader("Cache-Control", "no-cache");

  if (csvUrl == "favicon.ico") {
    ourResponse.end(csvReady("csv\nsvg"));
    return;
  }

  try {
  axios
    .get(csvUrl)
    .then((remoteResponse) => {
      ourResponse.end(csvReady(remoteResponse.data));
    })
    .catch((error) => {
      console.log("URL: " + csvUrl);
      console.log("Error: " + error);
      let errorReport =
        "Error while generatring table\nPlease check out input URL\nIt should look like this:\nhttp://csv.lenaschimmel.de/http://url.of.your/input/file.csv";
      ourResponse.end(csvReady(errorReport));
    });
  } catch(error) {
    console.log("Error: " + error);
    let errorReport = "Error while generatring table\nPlease check out input URL\nIt should look like this:\nhttp://csv.lenaschimmel.de/http://url.of.your/input/file.csv";
    ourResponse.end(csvReady(errorReport));
  }
};

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
  if (err) {
    return console.log("something bad happened", err);
  }

  console.log(`server is listening on ${port}`);
});

function csvReady(rawData) {
  const charW = 9;
  const charH = 18;

  const records = parse(rawData, {
    skip_empty_lines: true,
    relax_column_count: true,
  });

  let maxWidth = [];
  let totalWidth = 10;
  for (let record of records) {
    for (let i = 0; i < record.length; i++) {
      const text = record[i];
      let w = maxWidth[i] || 0;

      if (text.length > w) {
        w = text.length;
      }

      maxWidth[i] = w;
    }
  }

  for (let w of maxWidth) {
    totalWidth += (w + 1) * charW;
  }
  let totalHeight = (records.length + 1) * charH + 10;

  let svg =
    '<svg version="1.1" width="' +
    totalWidth +
    '" height="' +
    totalHeight +
    '" xmlns="http://www.w3.org/2000/svg">\n';

  svg += "<style>text { font-family: monospace; } </style>";

  let y = 20;

  for (let lineIndex = 0; lineIndex < records.length; lineIndex++) {
    const record = records[lineIndex];
    let x = 10;
    for (let i = 0; i < record.length; i++) {
      const text = xmlescape(record[i]);
      let w = maxWidth[i] * charW + charW;
      let fill = (lineIndex % 2 == 0) ? '#FFF' : '#EEE';
      let textStyle = (lineIndex == 0) ? 'style="font-weight:bold;"' : '';
      svg += '    <rect fill="' + fill + '" stroke="lightgrey" x="' + (x - 5) + '" y="' + (y - 15) + '" width="' + w + '" height="' + charH + '" />'
      svg += '    <text x="' + x + '" y="' + y + '" ' + textStyle + '>' + text + "</text>\n";
      x += w;
    }
    y += charH;
  }
  svg += '    <text x="' + 10 + '" y="' + y + '" style="fill:#AAA; font-size: 70%;">Generated at ' + new Date().toISOString() + "</text>\n";
  svg += "</svg>\n";

  return svg;
}
