const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');
content = content.replace(/\u0000/g, ''); // remove null bytes
const lines = content.split('\n');
const cleanLines = [];
for (let line of lines) {
    if (line.includes('model Sport') || line.includes('StudentSport') || line.includes('e n u m')) {
        break; // Stop before the corrupted text
    }
    cleanLines.push(line);
}
fs.writeFileSync('prisma/schema.prisma', cleanLines.join('\n'));
