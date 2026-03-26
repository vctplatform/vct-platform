const fs = require('fs');
try {
    const raw = fs.readFileSync('eslint_report.json', 'utf16le');
    // Remove BOM if present
    const cleanRaw = raw.replace(/^\uFEFF/, '');
    const data = JSON.parse(cleanRaw);
    
    let count = 0;
    data.forEach(d => {
        const boundMessages = d.messages.filter(m => m.ruleId && m.ruleId.includes('boundaries'));
        if (boundMessages.length > 0) {
            console.log(d.filePath);
            boundMessages.forEach(m => console.log('  ' + m.message));
            count++;
        }
    });
    console.log(`Found ${count} files with boundary violations.`);
} catch(e) {
    console.error("Parse error:", e);
}
