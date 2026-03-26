const fs = require('fs');
const path = require('path');

const httpApiDir = path.join(__dirname, 'backend', 'internal', 'httpapi');

const replacements = [
    {
        regex: /http\.Error\(w,\s*"method not allowed",\s*http\.StatusMethodNotAllowed\)/g,
        replace: "methodNotAllowedErr(w)"
    },
    {
        regex: /http\.Error\(w,\s*"not found",\s*http\.StatusNotFound\)/g,
        replace: 'notFoundErr(w, "Không tìm thấy dữ liệu")'
    },
    {
        regex: /http\.Error\(w,\s*"invalid json",\s*http\.StatusBadRequest\)/g,
        replace: 'badRequestErr(w, errors.New("Dữ liệu JSON không hợp lệ"))'
    },
    {
        regex: /http\.Error\(w,\s*err\.Error\(\),\s*http\.StatusBadRequest\)/g,
        replace: 'badRequestErr(w, err)'
    },
    {
        regex: /http\.Error\(w,\s*"forbidden: requires parent role",\s*http\.StatusForbidden\)/g,
        replace: 'forbiddenErr(w)'
    },
    {
        regex: /http\.Error\(w,\s*"missing child link id",\s*http\.StatusBadRequest\)/g,
        replace: 'validationErr(w, "Thiếu ID liên kết")'
    },
    {
        regex: /http\.Error\(w,\s*"link not found",\s*http\.StatusNotFound\)/g,
        replace: 'notFoundErr(w, "Không tìm thấy liên kết")'
    },
    {
        regex: /http\.Error\(w,\s*"forbidden: link does not belong to you",\s*http\.StatusForbidden\)/g,
        replace: 'forbiddenErr(w)'
    },
    {
        regex: /http\.Error\(w,\s*"missing sub-resource.*",\s*http\.StatusBadRequest\)/g,
        replace: 'validationErr(w, "Thiếu tài nguyên phụ")'
    },
    {
        regex: /http\.Error\(w,\s*"forbidden: athlete is not linked to your account",\s*http\.StatusForbidden\)/g,
        replace: 'forbiddenErr(w)'
    },
    {
        regex: /http\.Error\(w,\s*"unknown sub-resource",\s*http\.StatusBadRequest\)/g,
        replace: 'validationErr(w, "Tài nguyên phụ không hợp lệ")'
    },
    {
        regex: /http\.Error\(w,\s*"missing consent id",\s*http\.StatusBadRequest\)/g,
        replace: 'validationErr(w, "Thiếu ID chấp thuận")'
    },
    {
        regex: /http\.Error\(w,\s*err\.Error\(\),\s*http\.StatusForbidden\)/g,
        replace: 'forbiddenErr(w)'
    },
    {
        regex: /http\.Error\(w,\s*fmt\.Sprintf\("OpenAPI spec not found: %v",\s*err\),\s*http\.StatusNotFound\)/g,
        replace: 'notFoundErr(w, "Không tìm thấy tài liệu OpenAPI")'
    }
];

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (file.endsWith('_handler.go') || file === 'docs.go' || file === 'server.go' || file === 'middleware.go') {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            let modified = false;

            for (const r of replacements) {
                if (r.regex.test(content)) {
                    content = content.replace(r.regex, r.replace);
                    modified = true;
                }
            }

            if (modified) {
                // If the file used errors.New but didn't import "errors", we might need to add it, but it's likely already imported or badRequestErr takes the error format directly if it's already an error variable. We used errors.New("...") so we must ensure "errors" is imported. Wait, validationErr(w, string) is better so we don't need "errors".
                // I will update the replacement list for invalid json:
                content = content.replace(/badRequestErr\(w, errors\.New\("Dữ liệu JSON không hợp lệ"\)\)/g, 'validationErr(w, "Dữ liệu JSON không hợp lệ")');

                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Refactored ${file}`);
            }
        }
    }
}

processDirectory(httpApiDir);
console.log("Refactoring complete.");
