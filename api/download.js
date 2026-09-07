const JSZip = require('jszip');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    var filesJson = req.body.files;
    if (typeof filesJson === 'string') {
      filesJson = JSON.parse(filesJson);
    }

    if (!filesJson || typeof filesJson !== 'object') {
      return res.status(400).json({ error: 'No files provided' });
    }

    var zip = new JSZip();
    var claudeFolder = zip.folder('.claude');

    // Files that belong at the project root, not inside .claude/
    var rootFiles = { 'memory.ps1': true, 'setup.ps1': true };

    // Add generated template files
    var fileNames = Object.keys(filesJson);
    for (var i = 0; i < fileNames.length; i++) {
      var fileName = fileNames[i];
      var content = filesJson[fileName];
      if (rootFiles[fileName]) {
        zip.file(fileName, content);
      } else {
        claudeFolder.file(fileName, content);
      }
    }


    var zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="claude-setup.zip"');
    res.setHeader('Content-Length', zipBuffer.length);
    return res.send(zipBuffer);
  } catch (err) {
    console.error('Zip error:', err.message);
    return res.status(500).json({ error: 'Failed to create zip' });
  }
};
