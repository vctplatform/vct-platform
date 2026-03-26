import * as React from 'react';
// Yêu cầu cài đặt cho môi trường Web (Next.js): npm install lucide-react
// Yêu cầu cài đặt cho môi trường Mobile (Expo/React Native): npm install lucide-react-native
import {
    LayoutDashboard,
    Search,
    Settings,
    House,
    Trophy,
    Swords,
    Medal,
    Scale,
    Users,
    UserCircle,
    Plus,
    PlusCircle as PlusCircleIcon,
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
    CreditCard,
    Database,
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
    EyeOff,
    List,
    Flag,
    ClipboardList,
    LogOut,
    RefreshCw,
    Bell,
    MoreVertical,
    SquareCheckBig,
    Layers,
    TrendingUp,
    TrendingDown,
    DollarSign,
    ArrowDownLeft,
    ArrowUpRight,
    Book,
    Video,
    Network,
    Library,
    ZoomIn,
    ZoomOut,
    BarChart2,
    Laptop,
    ShoppingBag,
    Building,
    Camera,
    VideoOff,
    Info,
    Image as ImageIcon,
    MinusCircle,
    Target,
    Globe,
    Share2,
    Type,
    Palette,
    Smartphone
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
    Home: (p: IconProps) => <House {...defaultProps} {...p} />,
    x: (p: IconProps) => <X {...defaultProps} {...p} />, // Chữ x thường để tương thích code cũ
    X: (p: IconProps) => <X {...defaultProps} {...p} />,
    Close: (p: IconProps) => <X {...defaultProps} {...p} />,
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
    Monitor: (p: IconProps) => <MonitorPlay {...defaultProps} {...p} />,

    // --- Nhân sự & Đoàn (Personnel & Teams) ---
    Users: (p: IconProps) => <Users {...defaultProps} {...p} />,
    User: (p: IconProps) => <UserCircle {...defaultProps} {...p} />,
    UserCircle: (p: IconProps) => <UserCircle {...defaultProps} {...p} />,
    Referee: (p: IconProps) => <UserCircle {...defaultProps} {...p} />, // Cần thay bằng icon trọng tài nếu có
    Lock: (p: IconProps) => <Shield {...defaultProps} {...p} />,

    // --- Tương tác (Actions) ---
    Plus: (p: IconProps) => <Plus {...defaultProps} {...p} />,
    PlusCircle: (p: IconProps) => <PlusCircleIcon {...defaultProps} {...p} />,
    Edit: (p: IconProps) => <Edit2 {...defaultProps} {...p} />,
    Trash: (p: IconProps) => <Trash2 {...defaultProps} {...p} />,
    Check: (p: IconProps) => <Check {...defaultProps} {...p} />,
    Chevron: (p: IconProps) => <ChevronRight {...defaultProps} {...p} />, // Mặc định trỏ phải
    ChevronRight: (p: IconProps) => <ChevronRight {...defaultProps} {...p} />,
    ChevronDown: (p: IconProps) => <ChevronDown {...defaultProps} {...p} />,
    ExpandMore: (p: IconProps) => <ChevronDown {...defaultProps} {...p} />,
    ChevronLeft: (p: IconProps) => <ChevronLeft {...defaultProps} {...p} />,
    ArrowRight: (p: IconProps) => <ChevronRight {...defaultProps} {...p} />,
    Copy: (p: IconProps) => <Copy {...defaultProps} {...p} />,
    Download: (p: IconProps) => <Download {...defaultProps} {...p} />,
    Upload: (p: IconProps) => <Upload {...defaultProps} {...p} />,
    Refresh: (p: IconProps) => <RefreshCw {...defaultProps} {...p} />,

    // --- Thời gian, Trạng thái & Môi trường ---
    Clock: (p: IconProps) => <Clock {...defaultProps} {...p} />,
    CheckSquare: (p: IconProps) => <SquareCheckBig {...defaultProps} {...p} />,
    Alert: (p: IconProps) => <AlertTriangle {...defaultProps} {...p} />,
    AlertTriangle: (p: IconProps) => <AlertTriangle {...defaultProps} {...p} />,
    MinusCircle: (p: IconProps) => <MinusCircle {...defaultProps} {...p} />,
    Moon: (p: IconProps) => <Moon {...defaultProps} {...p} />,
    Sun: (p: IconProps) => <Sun {...defaultProps} {...p} />,
    Play: (p: IconProps) => <Play {...defaultProps} {...p} />,
    Pause: (p: IconProps) => <Pause {...defaultProps} {...p} />,
    Wrench: (p: IconProps) => <Wrench {...defaultProps} {...p} />, // Cho trạng thái bảo trì
    MonitorPlay: (p: IconProps) => <MonitorPlay {...defaultProps} {...p} />,

    // --- Liên hệ & Hồ sơ (Contact & Documents) ---
    File: (p: IconProps) => <FileText {...defaultProps} {...p} />,
    Database: (p: IconProps) => <Database {...defaultProps} {...p} />,
    ShieldCheck: (p: IconProps) => <ShieldCheck {...defaultProps} {...p} />, // Phù hợp cho Pháp lý/Bảo hiểm
    Phone: (p: IconProps) => <Phone {...defaultProps} {...p} />,
    Mail: (p: IconProps) => <Mail {...defaultProps} {...p} />,
    MapPin: (p: IconProps) => <MapPin {...defaultProps} {...p} />,
    Heart: (p: IconProps) => <Heart {...defaultProps} {...p} />, // Tài trợ/Y tế

    // --- Mở rộng cho Sidebar Cấu trúc mới ---
    Building: (p: IconProps) => <Building {...defaultProps} {...p} />,
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
    EyeOff: (p: IconProps) => <EyeOff {...defaultProps} {...p} />,
    Flag: (p: IconProps) => <Flag {...defaultProps} {...p} />,
    ClipboardList: (p: IconProps) => <ClipboardList {...defaultProps} {...p} />,

    // --- Header & Auth ---
    LogOut: (p: IconProps) => <LogOut {...defaultProps} {...p} />,
    Bell: (p: IconProps) => <Bell {...defaultProps} {...p} />,

    // --- Others ---
    MoreVertical: (p: IconProps) => <MoreVertical {...defaultProps} {...p} />,
    Layers: (p: IconProps) => <Layers {...defaultProps} {...p} />,
    TrendingUp: (p: IconProps) => <TrendingUp {...defaultProps} {...p} />,
    TrendingDown: (p: IconProps) => <TrendingDown {...defaultProps} {...p} />,
    CreditCard: (p: IconProps) => <CreditCard {...defaultProps} {...p} />,
    DollarSign: (p: IconProps) => <DollarSign {...defaultProps} {...p} />,
    ArrowDownLeft: (p: IconProps) => <ArrowDownLeft {...defaultProps} {...p} />,
    ArrowUpRight: (p: IconProps) => <ArrowUpRight {...defaultProps} {...p} />,
    Book: (p: IconProps) => <Book {...defaultProps} {...p} />,
    Video: (p: IconProps) => <Video {...defaultProps} {...p} />,
    Network: (p: IconProps) => <Network {...defaultProps} {...p} />,
    Library: (p: IconProps) => <Library {...defaultProps} {...p} />,
    ZoomIn: (p: IconProps) => <ZoomIn {...defaultProps} {...p} />,
    ZoomOut: (p: IconProps) => <ZoomOut {...defaultProps} {...p} />,
    BarChart: (p: IconProps) => <BarChart2 {...defaultProps} {...p} />,
    BarChart2: (p: IconProps) => <BarChart2 {...defaultProps} {...p} />,
    Laptop: (p: IconProps) => <Laptop {...defaultProps} {...p} />,
    ShoppingBag: (p: IconProps) => <ShoppingBag {...defaultProps} {...p} />,
    Camera: (p: IconProps) => <Camera {...defaultProps} {...p} />,
    VideoOff: (p: IconProps) => <VideoOff {...defaultProps} {...p} />,
    Info: (p: IconProps) => <Info {...defaultProps} {...p} />,
    Image: (p: IconProps) => <ImageIcon {...defaultProps} {...p} />,
    Target: (p: IconProps) => <Target {...defaultProps} {...p} />,
    Globe: (p: IconProps) => <Globe {...defaultProps} {...p} />,
    Share: (p: IconProps) => <Share2 {...defaultProps} {...p} />,
    Share2: (p: IconProps) => <Share2 {...defaultProps} {...p} />,
    Type: (p: IconProps) => <Type {...defaultProps} {...p} />,
    Palette: (p: IconProps) => <Palette {...defaultProps} {...p} />,
    Smartphone: (p: IconProps) => <Smartphone {...defaultProps} {...p} />,
};
