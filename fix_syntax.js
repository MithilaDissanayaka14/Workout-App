const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'mobile', 'app', 'nutrition.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix the bad regex replacement
content = content.replace(/,\n  , fontStyle: 'italic'}/g, ",\n    fontStyle: 'italic'\n  }");
content = content.replace(/,\n  , fontStyle: 'italic', letterSpacing: 0.5}/g, ",\n    fontStyle: 'italic',\n    letterSpacing: 0.5\n  }");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Syntax fixed!');
