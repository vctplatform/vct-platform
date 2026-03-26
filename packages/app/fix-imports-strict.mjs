import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirsToScan = [
    path.join(__dirname, 'features'),
];

let changedFilesCount = 0;

function traverse(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverse(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let updated = false;

            // Matches: from '../../components/Something' or from '../../../components/vct-ui'
            const regex = /(import\s+.*?from\s+)(['"])((?:\.\.\/)+components\/([^'"]+))(['"])/g;
            
            content = content.replace(regex, (match, importExpr, quote1, relPath, componentName, quote2) => {
                // Determine the absolute path that this relative path points to
                const resolvedPath = path.resolve(dir, relPath);
                const targetComponentsDir = path.resolve(__dirname, 'features', 'components');

                // If this import does NOT point to the central features/components directory, skip it!
                // We don't want to replace features/admin/components etc.
                if (path.dirname(resolvedPath) !== targetComponentsDir) {
                    return match;
                }

                // If it's a hybrid component, KEEP IT untouched because it STILL lives in features/components!
                if (componentName === 'VCT_CommandPalette' || componentName === 'VCT_AddressSelect') {
                    return match; 
                }

                updated = true;
                return `${importExpr}${quote1}@vct/ui${quote2}`;
            });

            if (updated) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath.replace(__dirname, '')}`);
                changedFilesCount++;
            }
        }
    }
}

for (const dir of dirsToScan) {
    traverse(dir);
}

console.log(`\nCOMPLETED: Strictly updated ${changedFilesCount} files.`);
