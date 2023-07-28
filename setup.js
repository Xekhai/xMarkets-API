// const fs = require("fs");
// const path = require("path");

// // Recursive function to handle directory reading and processing
// function processDirectory(directory, stream) {
//   fs.readdirSync(directory).forEach((file) => {
//     let fullPath = path.join(directory, file);
//     if (fs.lstatSync(fullPath).isDirectory()) {
//       processDirectory(fullPath, stream);
//     } else {
//       stream.write(`\n---- File Path: ${fullPath} ----\n`);
//       if (path.extname(fullPath) === ".js") {
//         const data = fs.readFileSync(fullPath, "utf8");
//         stream.write(data);
//       }
//     }
//   });
// }

// // Start the process
// function listFilesToTxtFile(startPath) {
//   const stream = fs.createWriteStream("setup.txt");
//   stream.once("open", function (fd) {
//     processDirectory(startPath, stream);
//     stream.end();
//   });
// }

// listFilesToTxtFile("./src");
