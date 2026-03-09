import * as React from 'react';
// Yêu cầu cài đặt cho môi trường Web (Next.js): npm install lucide-react
// Yêu cầu cài đặt cho môi trường Mobile (Expo/React Native): npm install lucide-react-native
import {
    LayoutDashboard,
    Search,
    Settings,
    Trophy,
    Swords,
    Medal,
    Scale,
    Users,
    UserCircle,
    Plus,
    Edit2,
    Trash2,
    Check,
    ChevronRight,
    ChevronDown,
    ChevronLeft,
    Clock,
    AlertTriangle,
    Moon,
    Sun,
    Download,
    Upload,
    FileText,
    ShieldCheck,
    Shield,
    Phone,
    Mail,
    MapPin,
    GripHorizontal,
    AlignJustify,
    Columns,
    MonitorPlay,
    Heart,
    Activity,
    Copy,
    X,
    Play,
    Pause,
    Wrench,
    Building2,
    ClipboardCheck,
    UserCheck,
    GitMerge,
    Star,
    Award,
    Calendar,
    AlertCircle,
    Printer,
    LayoutGrid,
    Layout,
    Shuffle,
    CheckCircle,
    RotateCcw,
    Eye,
    List,
    Flag,
    ClipboardList,
    Info
} from 'lucide-react';

/**
 * ════════════════════════════════════════
 * VCT PLATFORM ICONS (Powered by Lucide)
 * ════════════════════════════════════════
 * Bộ icon đã được quy chuẩn hóa cho Solito Monorepo.
 * Sử dụng thư viện Lucide để đảm bảo khả năng tương thích xuyên nền tảng (Web + Native)
 * và giữ được độ sắc nét ở mọi kích thước.
 */

// Định nghĩa chuẩn Props để icon nào cũng có thể nhận size, color, className
export interface IconProps {
    size?: number | string;
    color?: string;
    className?: string;
    strokeWidth?: number;
    style?: React.CSSProperties;
}

// Thiết lập thông số mặc định mang bản sắc VCT (Stroke 2.0, sắc nét)
const defaultProps = {
    size: 20,
    color: "currentColor",
    strokeWidth: 2,
};

export const VCT_Icons = {
    // --- Điều hướng & Hệ thống (Navigation & System) ---
    Dashboard: (p: IconProps) => <LayoutDashboard {...defaultProps} {...p} />,
    Search: (p: IconProps) => <Search {...defaultProps} {...p} />,
    Settings: (p: IconProps) => <Settings {...defaultProps} {...p} />,
    x: (p: IconProps) => <X {...defaultProps} {...p} />, // Chữ x thường để tương thích code cũ
    Activity: (p: IconProps) => <Activity {...defaultProps} {...p} />,
    Grip: (p: IconProps) => <GripHorizontal {...defaultProps} {...p} />,
    List: (p: IconProps) => <AlignJustify {...defaultProps} {...p} />,
    Columns: (p: IconProps) => <Columns {...defaultProps} {...p} />,

    // --- Võ thuật & Thi đấu (Martial Arts & Tournaments) ---
    Trophy: (p: IconProps) => <Trophy {...defaultProps} {...p} />,
    Swords: (p: IconProps) => <Swords {...defaultProps} {...p} />, // Thích hợp cho Đối Kháng
    Medal: (p: IconProps) => <Medal {...defaultProps} {...p} />,
    Scale: (p: IconProps) => <Scale {...defaultProps} {...p} />,   // Thích hợp cho cân nặng
    TV: (p: IconProps) => <MonitorPlay {...defaultProps} {...p} />, // Cho chế độ TV Dashboard

    // --- Nhân sự & Đoàn (Personnel & Teams) ---
    Users: (p: IconProps) => <Users {...defaultProps} {...p} />,
    User: (p: IconProps) => <UserCircle {...defaultProps} {...p} />,
    UserCircle: (p: IconProps) => <UserCircle {...defaultProps} {...p} />,
    Referee: (p: IconProps) => <UserCircle {...defaultProps} {...p} />, // Cần thay bằng icon trọng tài nếu có

    // --- Tương tác (Actions) ---
    Plus: (p: IconProps) => <Plus {...defaultProps} {...p} />,
    Edit: (p: IconProps) => <Edit2 {...defaultProps} {...p} />,
    Trash: (p: IconProps) => <Trash2 {...defaultProps} {...p} />,
    Check: (p: IconProps) => <Check {...defaultProps} {...p} />,
    Chevron: (p: IconProps) => <ChevronRight {...defaultProps} {...p} />, // Mặc định trỏ phải
    ChevronDown: (p: IconProps) => <ChevronDown {...defaultProps} {...p} />,
    ChevronLeft: (p: IconProps) => <ChevronLeft {...defaultProps} {...p} />,
    Copy: (p: IconProps) => <Copy {...defaultProps} {...p} />,
    Download: (p: IconProps) => <Download {...defaultProps} {...p} />,
    Upload: (p: IconProps) => <Upload {...defaultProps} {...p} />,

    // --- Thời gian, Trạng thái & Môi trường ---
    Clock: (p: IconProps) => <Clock {...defaultProps} {...p} />,
    Alert: (p: IconProps) => <AlertTriangle {...defaultProps} {...p} />,
    Moon: (p: IconProps) => <Moon {...defaultProps} {...p} />,
    Sun: (p: IconProps) => <Sun {...defaultProps} {...p} />,
    Play: (p: IconProps) => <Play {...defaultProps} {...p} />,
    Pause: (p: IconProps) => <Pause {...defaultProps} {...p} />,
    Wrench: (p: IconProps) => <Wrench {...defaultProps} {...p} />, // Cho trạng thái bảo trì
    MonitorPlay: (p: IconProps) => <MonitorPlay {...defaultProps} {...p} />,

    // --- Liên hệ & Hồ sơ (Contact & Documents) ---
    File: (p: IconProps) => <FileText {...defaultProps} {...p} />,
    ShieldCheck: (p: IconProps) => <ShieldCheck {...defaultProps} {...p} />, // Phù hợp cho Pháp lý/Bảo hiểm
    Phone: (p: IconProps) => <Phone {...defaultProps} {...p} />,
    Mail: (p: IconProps) => <Mail {...defaultProps} {...p} />,
    MapPin: (p: IconProps) => <MapPin {...defaultProps} {...p} />,
    Heart: (p: IconProps) => <Heart {...defaultProps} {...p} />, // Tài trợ/Y tế

    // --- Mở rộng cho Sidebar Cấu trúc mới ---
    Building2: (p: IconProps) => <Building2 {...defaultProps} {...p} />,
    ClipboardCheck: (p: IconProps) => <ClipboardCheck {...defaultProps} {...p} />,
    UserCheck: (p: IconProps) => <UserCheck {...defaultProps} {...p} />,
    GitMerge: (p: IconProps) => <GitMerge {...defaultProps} {...p} />,
    Star: (p: IconProps) => <Star {...defaultProps} {...p} />,
    Award: (p: IconProps) => <Award {...defaultProps} {...p} />,
    Calendar: (p: IconProps) => <Calendar {...defaultProps} {...p} />,
    AlertCircle: (p: IconProps) => <AlertCircle {...defaultProps} {...p} />,
    Printer: (p: IconProps) => <Printer {...defaultProps} {...p} />,
    LayoutGrid: (p: IconProps) => <LayoutGrid {...defaultProps} {...p} />,
    Shield: (p: IconProps) => <Shield {...defaultProps} {...p} />,
    Layout: (p: IconProps) => <Layout {...defaultProps} {...p} />,
    FileText: (p: IconProps) => <FileText {...defaultProps} {...p} />,

    // --- Bốc thăm & Xử lý ---
    Shuffle: (p: IconProps) => <Shuffle {...defaultProps} {...p} />,
    CheckCircle: (p: IconProps) => <CheckCircle {...defaultProps} {...p} />,
    RotateCcw: (p: IconProps) => <RotateCcw {...defaultProps} {...p} />,
    Eye: (p: IconProps) => <Eye {...defaultProps} {...p} />,
    Flag: (p: IconProps) => <Flag {...defaultProps} {...p} />,
    ClipboardList: (p: IconProps) => <ClipboardList {...defaultProps} {...p} />,
    Info: (p: IconProps) => <Info {...defaultProps} {...p} />,
    ChevronRight: (p: IconProps) => <ChevronRight {...defaultProps} {...p} />,
    AlertTriangle: (p: IconProps) => <AlertTriangle {...defaultProps} {...p} />,
};