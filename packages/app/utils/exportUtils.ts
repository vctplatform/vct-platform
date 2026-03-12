import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Xuất dữ liệu ra file Excel (.xlsx)
 * @param data Mảng các object dữ liệu nguyên thủy
 * @param filename Tên file mong muốn (không bao gồm đuôi .xlsx)
 * @param sheetName Tên sheet trong file Excel (mặc định: 'Sheet1')
 */
export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Sheet1') => {
    // 1. Tạo workbook mới
    const wb = XLSX.utils.book_new();

    // 2. Chuyển đổi JSON sang Worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // 3. Tùy chỉnh độ rộng cột (tự động dựa trên độ dài dữ liệu)
    const colWidths: { wch: number }[] = [];
    if (data.length > 0) {
        const keys = Object.keys(data[0]);
        keys.forEach(key => {
            let maxLen = key.length;
            data.forEach(row => {
                const val = row[key];
                const valLen = val ? String(val).length : 0;
                if (valLen > maxLen) {
                    maxLen = valLen;
                }
            });
            colWidths.push({ wch: maxLen + 2 }); // Thêm 2 ký tự padding
        });
        ws['!cols'] = colWidths;
    }

    // 4. Thêm worksheet vào workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // 5. Ghi file dạng binary
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

    // 6. Lưu file
    saveAs(dataBlob, `${filename}.xlsx`);
};

/**
 * Xuất dữ liệu ra file CSV
 * @param data Mảng các object dữ liệu nguyên thủy
 * @param filename Tên file mong muốn (không bao gồm đuôi .csv)
 */
export const exportToCSV = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const csvContent = XLSX.utils.sheet_to_csv(ws);
    
    // Thêm BOM để Excel đọc được tiếng Việt (UTF-8 with BOM)
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
};
