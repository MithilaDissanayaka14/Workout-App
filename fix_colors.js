const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'mobile', 'app', 'nutrition.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Colors
content = content.replace(/#2D2E49/gi, '#000');
content = content.replace(/#6C63FF/gi, '#000');
content = content.replace(/#F8F9FE/gi, '#f8f9fa');
content = content.replace(/#E3F2FD/gi, '#f4f4f4');
content = content.replace(/#2196F3/gi, '#000');
content = content.replace(/#4facfe/gi, '#000');

// Typography (Italics for headers)
content = content.replace(/headerTitle: {([^}]+)}/g, "headerTitle: {$1, fontStyle: 'italic'}");
content = content.replace(/sectionTitle: {([^}]+)}/g, "sectionTitle: {$1, fontStyle: 'italic', letterSpacing: 0.5}");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Colors replaced successfully!');
