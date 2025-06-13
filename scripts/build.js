const fs = require('fs');
const path = require('path');

// Create a simple build script that copies the contract ABI if needed
const contractPath = path.join(__dirname, '../artifacts/contracts');
const buildPath = path.join(__dirname, '../src/contracts');

// Create build directory if it doesn't exist
if (!fs.existsSync(buildPath)) {
    fs.mkdirSync(buildPath, { recursive: true });
}

// Copy contract files if they exist
if (fs.existsSync(contractPath)) {
    const files = fs.readdirSync(contractPath);
    files.forEach(file => {
        if (file.endsWith('.json')) {
            const filePath = path.join(contractPath, file);
            const destPath = path.join(buildPath, file);
            fs.copyFileSync(filePath, destPath);
            console.log(`Copied ${file} to build directory`);
        }
    });
} else {
    console.log('No contract artifacts found to build');
}
