const fs = require('fs');
const path = require('path');

function updateCoverAssets() {
  const assetsDir = path.join(__dirname, '..', 'assets');
  const coverAssetsPath = path.join(__dirname, 'coverAssets.json');

  // Read the assets directory
  fs.readdir(assetsDir, (err, files) => {
    if (err) {
      console.error('Error reading assets directory:', err);
      return;
    }

    // Filter for image files
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });

    // Create the new coverAssets.json content
    const coverAssets = {
      covers: imageFiles
    };

    // Write the updated JSON file
    fs.writeFile(
      coverAssetsPath,
      JSON.stringify(coverAssets, null, 2),
      'utf8',
      err => {
        if (err) {
          console.error('Error writing coverAssets.json:', err);
          return;
        }
        console.log('coverAssets.json has been updated successfully');
      }
    );
  });
}

// Export the function
module.exports = updateCoverAssets;