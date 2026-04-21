const https = require('https');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend/public/assets/google-icons');
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

const icons = [
    { url: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg', name: 'google-drive.svg' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg', name: 'google-calendar.svg' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg', name: 'google-sheets.svg' }
];

icons.forEach(icon => {
    https.get(icon.url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            fs.writeFileSync(path.join(dir, icon.name), data);
            console.log('Downloaded', icon.name);
        });
    }).on('error', (err) => {
        console.error('Error downloading', icon.name, err);
    });
});
