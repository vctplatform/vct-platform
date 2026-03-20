const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if ((file.endsWith('.tsx') || file.endsWith('.ts')) && !file.includes('node_modules')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('d:/VCT PLATFORM/vct-platform/packages/app/features');
let changed = 0;
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    const regex = /\[var\((--[a-zA-Z0-9\-]+)\)\]/g;
    // Also, let's fix bg-red-500/[0.08] to bg-red-500/8 just in case
    const regex2 = /\[0\.08\]/g;
    
    let hasChanges = false;
    if (regex.test(content)) {
        content = content.replace(regex, '($1)');
        hasChanges = true;
    }
    if (regex2.test(content)) {
        content = content.replace(regex2, '8');
        hasChanges = true;
    }
    
    if (hasChanges) {
        fs.writeFileSync(f, content, 'utf8');
        changed++;
        console.log('Fixed ' + f);
    }
});
console.log('Fixed syntax in ' + changed + ' files.');
