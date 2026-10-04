const fs = require('fs');
const path = require('path');
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.next')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.css')) {
                results.push(file);
            }
        }
    });
    return results;
}
const files = walk('./src');
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let changed = false;
    
    const rules = [
        [/coaching center/gi, 'school'],
        [/Coaching Center/g, 'School'],
        [/coaching centers/gi, 'schools'],
        [/Coaching Centers/g, 'Schools'],
        [/coaching name/gi, 'school name'],
        [/Coaching Name/g, 'School Name'],
        [/coaching profile/gi, 'school profile'],
        [/Coaching Profile/g, 'School Profile'],
        [/Welcome to coaching/gi, 'Welcome to school'],
        [/coaching ID/gi, 'school ID'],
        [/coaching subscription/gi, 'school subscription'],
        [/starter coaching/gi, 'starter schools'],
        [/coaching management/gi, 'school management'],
        [/coaching system/gi, 'school system'],
        [/coaching software/gi, 'school software'],
        [/coaching app/gi, 'school app'],
        [/coaching admin/gi, 'school admin'], 
    ];
    
    for (const [regex, replacement] of rules) {
        if (regex.test(content)) {
            content = content.replace(regex, replacement);
            changed = true;
        }
    }
    
    const standaloneRegex = /(?<![a-zA-Z_])(coaching)(?![a-zA-Z_])/g;
    const standaloneRegexCap = /(?<![a-zA-Z_])(Coaching)(?![a-zA-Z_])/g;
    
    if (standaloneRegex.test(content)) {
        content = content.replace(standaloneRegex, 'school');
        changed = true;
    }
    if (standaloneRegexCap.test(content)) {
        content = content.replace(standaloneRegexCap, 'School');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(f, content, 'utf8');
        console.log('Updated', f);
    }
})
