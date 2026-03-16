import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Xuất dữ liệu ra file Excel (.xlsx)
 * @param data Mảng các object dữ liệu nguyên thủy
 * @param filename Tên file mong muốn (không bao gồm đuôi .xlsx)
 * @param sheetName Tên sheet trong file Excel (mặc định: 'Sheet1')
 */
export const exportToExcel = async (data: any[], filename: string, sheetName: string = 'Sheet1') => {
    // 1. Tạo workbook mới
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    if (data.length === 0) {
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(blob, `${filename}.xlsx`);
        return;
    }

    // 2. Thiết lập columns từ keys của data
    const keys = Object.keys(data[0]);
    worksheet.columns = keys.map(key => ({
        header: key,
        key,
        width: Math.max(
            key.length,
            ...data.map(row => {
                const val = row[key];
                return val ? String(val).length : 0;
            })
        ) + 2, // Thêm 2 ký tự padding
    }));

    // 3. Thêm dữ liệu
    worksheet.addRows(data);

    // 4. Style header row
    worksheet.getRow(1).font = { bold: true };

    // 5. Ghi file dạng buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

    // 6. Lưu file
    saveAs(blob, `${filename}.xlsx`);
};

/**
 * Xuất dữ liệu ra file CSV
 * @param data Mảng các object dữ liệu nguyên thủy
 * @param filename Tên file mong muốn (không bao gồm đuôi .csv)
 */
export const exportToCSV = async (data: any[], filename: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    if (data.length > 0) {
        const keys = Object.keys(data[0]);
        worksheet.columns = keys.map(key => ({ header: key, key }));
        worksheet.addRows(data);
    }

    const csvBuffer = await workbook.csv.writeBuffer();

    // Thêm BOM để Excel đọc được tiếng Việt (UTF-8 with BOM)
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvBuffer], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
};
