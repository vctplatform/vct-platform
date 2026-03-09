// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — RBAC Matrix
// Role → Route → Actions capability mapping
// ════════════════════════════════════════════════════════════════

import type { UserRole } from '../auth/types'
import type { RouteAction, RouteCapability, RoleRouteCapabilities } from './route-types'

const capability = (
    actions: RouteAction[],
    note: string
): RouteCapability => ({
    actions: Array.from(new Set<RouteAction>(['view', ...actions])),
    note,
})

export const ROUTE_ROLE_CAPABILITIES: Record<UserRole, RoleRouteCapabilities> = {
    admin: {
        'command-center': capability(
            ['monitor', 'export'],
            'Toan quyen theo doi dieu hanh, KPI va canh bao tong calculations the giai dau'
        ),
        organizations: capability(
            ['create', 'update', 'delete', 'approve', 'publish'],
            'Quan tri lien doan va co cau to chuc'
        ),
        clubs: capability(
            ['create', 'update', 'delete', 'approve', 'publish'],
            'Quan tri cau lac bo, vo duong, chi nhanh'
        ),
        curriculum: capability(['create', 'update', 'delete', 'approve', 'publish'], 'Quan ly dien tien va bai quyen'),
        techniques: capability(['create', 'update', 'delete', 'approve', 'publish'], 'Quan ly thu vien ky thuat, video'),
        'training-plans': capability(['create', 'update', 'delete', 'approve', 'publish'], 'Tao ke hoach huan luyen'),
        attendance: capability(['create', 'update', 'delete'], 'Quan tri diem danh, lich su chuyen can'),
        'belt-exams': capability(['create', 'update', 'delete', 'approve', 'publish'], 'Quan tri ky thi thang cap dai'),
        elearning: capability(['create', 'update', 'delete', 'approve'], 'Quan tri he thong e-learning'),
        rankings: capability(['create', 'update', 'delete', 'approve', 'publish'], 'Quan tri bang xep hang quoc gia'),
        heritage: capability(['create', 'update', 'delete', 'approve', 'publish'], 'Quan tri di san, pha he va van hoa vo thuat'),
        finance: capability(['create', 'update', 'delete', 'approve', 'publish', 'export'], 'Quan tri giao dich, phi thanh vien va ngan sach'),
        community: capability(['create', 'update', 'delete', 'approve', 'publish'], 'Quan tri tin tuc cong dong va su kien'),
        marketplace: capability(['create', 'update', 'delete', 'approve', 'publish'], 'Quan tri san giao dich trang thiet bi vo thuat'),
        'admin-dashboard': capability(['monitor', 'manage'], 'Giam sat he thong, hieu suat va dich vu'),
        'audit-logs': capability(['monitor', 'export'], 'Xem va xuat nhat ky hoat dong he thong'),
        people: capability(['create', 'update', 'delete', 'approve', 'export'], 'Quan ly VDV, HLV, trong tai va nhan su'),
        'tournament-config': capability(
            ['create', 'update', 'approve', 'publish', 'lock'],
            'Toan quyen cau hinh giai, dieu le, quota va khoa mo giai doan'
        ),
        'tournament-wizard': capability(
            ['create'],
            'Khoi tao giai dau moi'
        ),
        'content-categories': capability(
            ['create', 'update', 'delete', 'approve', 'publish'],
            'Quan tri noi dung quyen, hang can va cau hinh danh muc thi dau'
        ),
        arenas: capability(
            ['create', 'update', 'delete', 'assign', 'approve', 'monitor'],
            'Quan tri san dau, nang luc van hanh, phu trach va trang thai truc tiep'
        ),
        referees: capability(
            ['create', 'update', 'delete', 'assign', 'approve', 'export'],
            'Quan tri ho so trong tai va nang luc dieu phoi theo san/phien'
        ),
        teams: capability(
            ['create', 'update', 'delete', 'approve', 'import', 'export'],
            'Quan tri don vi, xet duyet tham gia, doi soat ho so va du lieu nhap lo'
        ),
        athletes: capability(
            ['create', 'update', 'delete', 'approve', 'import', 'export'],
            'Quan tri ho so VDV, duyet dieu kien va xu ly import theo mau'
        ),
        registration: capability(
            ['create', 'update', 'delete', 'approve', 'import', 'export'],
            'Quan tri dang ky noi dung thi dau va duyet phan bo suat thi'
        ),
        'technical-meeting': capability(
            ['create', 'update', 'approve', 'publish'],
            'Chot danh sach ky thuat, bien ban hop chuyen mon va cong bo ket luan'
        ),
        draw: capability(
            ['create', 'update', 'approve', 'publish'],
            'Thuc hien boc tham, xac nhan ket qua va phat hanh danh sach xep nhanh'
        ),
        'weigh-in': capability(
            ['create', 'update', 'approve', 'monitor', 'export'],
            'Quan ly can ky, xac nhan dat/khong dat va giam sat bat thuong can nang'
        ),
        schedule: capability(
            ['create', 'update', 'delete', 'approve', 'publish', 'export'],
            'Lap lich thi dau, dieu phoi theo san/phien va cong bo lich chinh thuc'
        ),
        'referee-assignments': capability(
            ['create', 'update', 'delete', 'assign', 'approve', 'publish'],
            'Phan cong to trong tai theo noi dung, phien va nang luc'
        ),
        combat: capability(
            ['create', 'update', 'approve', 'monitor', 'publish'],
            'Dieu hanh tran doi khang, cap nhat diem va xac nhan ket qua tung tran'
        ),
        forms: capability(
            ['create', 'update', 'approve', 'monitor', 'publish'],
            'Dieu hanh luot thi quyen, cham diem va cong bo ket qua so bo'
        ),
        bracket: capability(
            ['create', 'update', 'approve', 'publish', 'export'],
            'Quan tri so do nhanh, cap nhat nguoi thang va dong bo lich vong dau'
        ),
        results: capability(
            ['create', 'update', 'delete', 'approve', 'publish', 'export'],
            'Tong hop ket qua chinh thuc, xac nhan trang thai cong bo va doi soat'
        ),
        medals: capability(
            ['update', 'approve', 'publish', 'export'],
            'Quan tri bang huy chuong va xep hang toan doan theo quy che'
        ),
        appeals: capability(
            ['create', 'update', 'approve', 'publish', 'export'],
            'Xu ly khieu nai/khang nghi, theo doi SLA va phat hanh ket luan'
        ),
        reports: capability(
            ['export', 'publish'],
            'Phat hanh bao cao tong hop, in an va trich xuat du lieu van hanh'
        ),
        'user-detail': capability(
            ['create', 'update', 'delete', 'manage'],
            'Quan tri tai khoan he thong, vai tro va truy vet thao tac theo nguoi dung'
        ),
    },
    btc: {
        'command-center': capability(['monitor', 'export'], 'Dieu hanh tac nghiep hieu suat giai dau theo ca truc'),
        'tournament-config': capability(['update', 'approve', 'publish'], 'Cap nhat thong tin giai va xac nhan cau hinh van hanh'),
        'content-categories': capability(['create', 'update', 'approve', 'publish'], 'Cap nhat danh muc noi dung thi dau theo ke hoach'),
        arenas: capability(['create', 'update', 'assign', 'monitor'], 'To chuc van hanh san dau va dieu phoi nguon luc'),
        referees: capability(['create', 'update', 'assign', 'approve'], 'Quan ly danh sach trong tai va xac nhan san sang truc'),
        teams: capability(['create', 'update', 'approve', 'import', 'export'], 'Xu ly ho so doan, duyet tham gia va doi soat'),
        athletes: capability(['create', 'update', 'approve', 'import', 'export'], 'Quan ly ho so VDV va tien trinh hoan thien dieu kien'),
        registration: capability(['create', 'update', 'approve', 'import', 'export'], 'Dieu phoi dang ky noi dung va xac nhan phan bo'),
        'technical-meeting': capability(['create', 'update', 'approve', 'publish'], 'Tong hop ket luan hop chuyen mon'),
        draw: capability(['create', 'update', 'approve', 'publish'], 'To chuc boc tham va xac nhan ket qua'),
        'weigh-in': capability(['create', 'update', 'approve', 'monitor', 'export'], 'Van hanh can ky thuc dia'),
        schedule: capability(['create', 'update', 'approve', 'publish', 'export'], 'Lap, dieu chinh va cong bo lich thi dau'),
        'referee-assignments': capability(['create', 'update', 'assign', 'approve', 'publish'], 'Phan cong trong tai tac nghiep'),
        combat: capability(['update', 'approve', 'monitor', 'publish'], 'Theo doi tran doi khang va xac nhan ket qua'),
        forms: capability(['update', 'approve', 'monitor', 'publish'], 'Dieu phoi cham diem quyen'),
        bracket: capability(['update', 'approve', 'publish', 'export'], 'Cap nhat so do nhanh va ket qua vong dau'),
        results: capability(['create', 'update', 'approve', 'publish', 'export'], 'Tong hop va cong bo ket qua'),
        medals: capability(['update', 'approve', 'publish', 'export'], 'Cap nhat bang huy chuong va cong bo xep hang'),
        appeals: capability(['create', 'update', 'approve', 'publish', 'export'], 'Xu ly khieu nai/khang nghi theo quy che BTC'),
        reports: capability(['export', 'publish'], 'Xuat bao cao tong hop va bo ho so tong ket'),
    },
    referee_manager: {
        'command-center': capability([], 'Theo doi tien do thi dau de dieu phoi trong tai'),
        referees: capability(['update', 'assign', 'approve'], 'Quan ly nang luc va trang thai san sang trong tai'),
        'technical-meeting': capability(['update'], 'Cap nhat noi dung hop chuyen mon lien quan trong tai'),
        draw: capability([], 'Theo doi ket qua boc tham de bo tri to trong tai'),
        'weigh-in': capability([], 'Theo doi ket qua can ky de bo tri noi dung phu hop'),
        schedule: capability(['update'], 'Dieu chinh lich truong hop can doi trong tai'),
        'referee-assignments': capability(
            ['create', 'update', 'assign', 'approve', 'publish'],
            'Toan quyen tac nghiep phan cong trong tai'
        ),
        combat: capability(['update', 'monitor'], 'Theo doi va ghi nhan bien dong tran doi khang'),
        forms: capability(['update', 'monitor'], 'Theo doi va ho tro nghiep vu cham quyen'),
        bracket: capability([], 'Theo doi nhanh dau de dieu phoi trong tai'),
        results: capability([], 'Xem ket qua da xac nhan'),
        medals: capability([], 'Xem bang huy chuong phuc vu tong hop'),
        appeals: capability(['update', 'approve'], 'Phoi hop xu ly khieu nai theo tham quyen'),
        reports: capability(['export'], 'Trich xuat bao cao nghiep vu trong tai'),
    },
    referee: {
        'command-center': capability([], 'Theo doi thong bao van hanh va lenh dieu dong'),
        'technical-meeting': capability([], 'Xem ket luan hop chuyen mon'),
        draw: capability([], 'Xem ket qua boc tham theo noi dung duoc phan cong'),
        'weigh-in': capability(['update'], 'Ghi nhan ket qua can ky khi duoc uy quyen'),
        schedule: capability([], 'Xem lich thi dau theo ca truc'),
        combat: capability(['update', 'monitor'], 'Nhap diem va cap nhat trang thai tran dau'),
        forms: capability(['update', 'monitor'], 'Nhap diem luot thi quyen'),
        bracket: capability([], 'Xem nhanh dau va cap nhat doi thu'),
        results: capability([], 'Xem ket qua tong hop'),
    },
    delegate: {
        'command-center': capability([], 'Theo doi thong bao chung cua giai'),
        teams: capability(['create', 'update', 'import', 'export'], 'Quan ly thong tin don vi cua doan'),
        athletes: capability(['create', 'update', 'import', 'export'], 'Quan ly ho so VDV cua doan'),
        registration: capability(['create', 'update', 'import', 'export'], 'Dang ky noi dung thi dau cho VDV cua doan'),
        schedule: capability([], 'Xem lich thi dau duoc cong bo'),
        results: capability([], 'Xem ket qua VDV va noi dung thi dau'),
        medals: capability([], 'Xem bang huy chuong va xep hang'),
        appeals: capability(['create'], 'Nop khieu nai/khang nghi theo quy che'),
        reports: capability(['export'], 'Tai ve bao cao cong bo cho doan'),
    },
}
