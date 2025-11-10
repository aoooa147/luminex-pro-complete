const fs = require('fs');
const path = require('path');

const buildInfoPath = path.join(__dirname, '..', 'artifacts', 'build-info', '9264a49fbd44843c237710fdf1abb9c7.json');

try {
  const data = JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));
  
  if (data.input) {
    const outputPath = path.join(__dirname, '..', 'standard-json-input.json');
    fs.writeFileSync(outputPath, JSON.stringify(data.input, null, 2));
    console.log('âœ… Standard JSON Input extracted successfully!');
    console.log('ðŸ“„ Output file: standard-json-input.json');
    console.log('ðŸ“Š Size: ' + (fs.statSync(outputPath).size / 1024).toFixed(2) + ' KB');
  } else {
    console.log('âŒ Input field not found in build-info file');
  }
} catch (error) {
  console.error('âŒ Error:', error.message);
}
