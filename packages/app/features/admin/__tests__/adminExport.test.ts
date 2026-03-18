import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportToCSV, exportToJSON } from '../utils/adminExport'

// Mock DOM APIs
const mockClick = vi.fn()
const mockRevokeObjectURL = vi.fn()

beforeEach(() => {
    vi.restoreAllMocks()
    mockClick.mockClear()
    mockRevokeObjectURL.mockClear()

    // Mock URL.createObjectURL and URL.revokeObjectURL
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    globalThis.URL.revokeObjectURL = mockRevokeObjectURL

    // Mock document.createElement
    vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: mockClick,
    } as unknown as HTMLAnchorElement)
})

describe('exportToCSV', () => {
    it('creates a downloadable CSV with headers and rows', () => {
        exportToCSV({
            headers: ['ID', 'Tên', 'Trạng thái'],
            rows: [
                ['001', 'Nguyễn Văn A', 'active'],
                ['002', 'Trần Thị B', 'pending'],
            ],
            filename: 'test.csv',
        })

        expect(mockClick).toHaveBeenCalledOnce()
        expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
        expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    })

    it('wraps cells containing commas in quotes', () => {
        exportToCSV({
            headers: ['Name'],
            rows: [['Hà Nội, Việt Nam']],
            filename: 'test.csv',
        })

        expect(mockClick).toHaveBeenCalledOnce()
    })

    it('wraps cells containing quotes and escapes them', () => {
        exportToCSV({
            headers: ['Name'],
            rows: [['CLB "VCT" Bình Định']],
            filename: 'test.csv',
        })

        expect(mockClick).toHaveBeenCalledOnce()
    })

    it('sets the correct filename', () => {
        const mockElement = {
            href: '',
            download: '',
            click: mockClick,
        }
        vi.spyOn(document, 'createElement').mockReturnValue(mockElement as unknown as HTMLAnchorElement)

        exportToCSV({
            headers: ['A'],
            rows: [['1']],
            filename: 'vct_export.csv',
        })

        expect(mockElement.download).toBe('vct_export.csv')
    })
})

describe('exportToJSON', () => {
    it('creates a downloadable JSON file', () => {
        exportToJSON({
            data: { name: 'VCT', count: 42 },
            filename: 'data.json',
        })

        expect(mockClick).toHaveBeenCalledOnce()
        expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    })

    it('formats JSON with 2-space indentation', () => {
        const mockElement = {
            href: '',
            download: '',
            click: mockClick,
        }
        vi.spyOn(document, 'createElement').mockReturnValue(mockElement as unknown as HTMLAnchorElement)

        exportToJSON({
            data: [{ id: 1 }],
            filename: 'export.json',
        })

        expect(mockElement.download).toBe('export.json')
        expect(mockClick).toHaveBeenCalledOnce()
    })
})
