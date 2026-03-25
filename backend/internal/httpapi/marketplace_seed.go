package httpapi

import (
	"context"
	"log/slog"

	"vct-platform/backend/internal/domain/marketplace"
)

func (s *Server) seedDefaultMarketplaceData() {
	if s.Extended.Marketplace == nil {
		return
	}

	ctx := context.Background()
	products, err := s.Extended.Marketplace.ListSellerProducts(ctx, "")
	if err != nil {
		s.logger.Warn("marketplace seed skipped", slog.String("error", err.Error()))
		return
	}
	if len(products) > 0 {
		return
	}

	defaultProducts := []marketplace.Product{
		{
			SellerID:             "seller-vo-duong-binh-dinh",
			SellerName:           "Vo Duong Binh Dinh",
			SellerRole:           "club_leader",
			Title:                "Bộ võ phục cổ truyền thi đấu premium",
			ShortDescription:     "Vải thun lạnh 2 lớp, phù hợp tập luyện và biểu diễn bài quyền.",
			Description:          "Thiết kế riêng cho VCT Marketplace với form rộng, đường may tăng cường và logo thêu nổi cho các CLB cần bộ đồng phục chuyên nghiệp.",
			Category:             marketplace.CategoryUniform,
			Condition:            marketplace.ConditionNew,
			MartialArt:           "Vo Co Truyen",
			PriceVND:             980000,
			CompareAtPriceVND:    1150000,
			Currency:             "VND",
			StockQuantity:        24,
			MinimumOrderQuantity: 1,
			Status:               marketplace.ProductStatusActive,
			Location:             "Binh Dinh",
			Featured:             true,
			Tags:                 []string{"dong phuc", "bai quyen", "clb"},
			Specs: []marketplace.ProductSpec{
				{Label: "Chat lieu", Value: "Thun lanh 2 lop"},
				{Label: "Size", Value: "S-XXL"},
				{Label: "Bo kem", Value: "Ao, quan, dai lung"},
			},
			Shipping: marketplace.ShippingProfile{
				LeadTimeDays:    3,
				DeliveryZones:   []string{"Toan quoc"},
				ShippingFeeVND:  35000,
				PickupAvailable: true,
			},
		},
		{
			SellerID:             "seller-thien-long-lab",
			SellerName:           "Thien Long Equipment Lab",
			SellerRole:           "club_accountant",
			Title:                "Bo giap doi khang 5 mon",
			ShortDescription:     "Bo bao ho day du cho doi khang giai phong trao den chuyen nghiep.",
			Description:          "Trang bi giap nguc, gang tay, ong chan, bao ho dau, bao ho ham trong cung mot bo dong nhat de CLB va BTC co the dua vao su dung ngay.",
			Category:             marketplace.CategoryProtection,
			Condition:            marketplace.ConditionNew,
			MartialArt:           "Vo Co Truyen",
			PriceVND:             3650000,
			CompareAtPriceVND:    4200000,
			Currency:             "VND",
			StockQuantity:        9,
			MinimumOrderQuantity: 1,
			Status:               marketplace.ProductStatusActive,
			Location:             "TP HCM",
			Featured:             true,
			Tags:                 []string{"bao ho", "doi khang", "giai dau"},
			Specs: []marketplace.ProductSpec{
				{Label: "Mau", Value: "Do/Xanh"},
				{Label: "Chuan", Value: "Tap luyen va thi dau"},
				{Label: "Trong luong", Value: "3.2 kg"},
			},
			Shipping: marketplace.ShippingProfile{
				LeadTimeDays:    2,
				DeliveryZones:   []string{"Mien Nam", "Mien Trung"},
				ShippingFeeVND:  55000,
				PickupAvailable: false,
			},
		},
		{
			SellerID:             "seller-an-nam",
			SellerName:           "Xuong Binh Khi An Nam",
			SellerRole:           "coach",
			Title:                "Truong cong go lim luyen tap",
			ShortDescription:     "Binh khi go lim da xu ly chong cong venh, can bang tot cho tap co ban va nang cao.",
			Description:          "Phu hop cho CLB day binh khi va cac vo sinh muon so huu bo truong cong ben dep, dung trong tap luyen va bieu dien.",
			Category:             marketplace.CategoryWeapon,
			Condition:            marketplace.ConditionNew,
			MartialArt:           "Vo Co Truyen",
			PriceVND:             1450000,
			CompareAtPriceVND:    1650000,
			Currency:             "VND",
			StockQuantity:        15,
			MinimumOrderQuantity: 1,
			Status:               marketplace.ProductStatusActive,
			Location:             "Hue",
			Featured:             true,
			Tags:                 []string{"truong cong", "go lim", "binh khi"},
			Specs: []marketplace.ProductSpec{
				{Label: "Chieu dai", Value: "2.3 m"},
				{Label: "Vat lieu", Value: "Go lim"},
				{Label: "Hoan thien", Value: "Phu dau thuc vat"},
			},
			Shipping: marketplace.ShippingProfile{
				LeadTimeDays:    4,
				DeliveryZones:   []string{"Toan quoc"},
				ShippingFeeVND:  80000,
				PickupAvailable: false,
			},
		},
		{
			SellerID:             "seller-moc-son-lam",
			SellerName:           "Moc Son Lam",
			SellerRole:           "club_secretary",
			Title:                "Gia treo binh khi 12 vi tri",
			ShortDescription:     "Gia treo go thong kho de trung bay dao, kiem, con va truong cong trong vo duong.",
			Description:          "Thiet ke de lap dat tren tuong vo duong, giup giu gin binh khi gon gang va an toan trong khong gian tap luyen.",
			Category:             marketplace.CategoryAccessory,
			Condition:            marketplace.ConditionLikeNew,
			MartialArt:           "Vo Duong",
			PriceVND:             2200000,
			CompareAtPriceVND:    0,
			Currency:             "VND",
			StockQuantity:        6,
			MinimumOrderQuantity: 1,
			Status:               marketplace.ProductStatusActive,
			Location:             "Da Nang",
			Featured:             false,
			Tags:                 []string{"gia treo", "vo duong", "binh khi"},
			Specs: []marketplace.ProductSpec{
				{Label: "Suc chua", Value: "12 vi tri"},
				{Label: "Vat lieu", Value: "Go thong kho"},
				{Label: "Lap dat", Value: "Treo tuong"},
			},
			Shipping: marketplace.ShippingProfile{
				LeadTimeDays:    5,
				DeliveryZones:   []string{"Toan quoc"},
				ShippingFeeVND:  65000,
				PickupAvailable: true,
			},
		},
		{
			SellerID:             "seller-vct-sandau",
			SellerName:           "VCT San Dau",
			SellerRole:           "club_leader",
			Title:                "Tham san dau ghep 20mm",
			ShortDescription:     "Bo tham ghep EVA mat nham, dung cho vo duong, khu khoi dong va san thi dau mini.",
			Description:          "Bo tam xop ghep mau xanh do co do dan hoi cao, giam chan thuong, phu hop cho CLB muon nang cap khu vuc tap luyen.",
			Category:             marketplace.CategoryArena,
			Condition:            marketplace.ConditionNew,
			MartialArt:           "Vo Co Truyen",
			PriceVND:             12500000,
			CompareAtPriceVND:    13800000,
			Currency:             "VND",
			StockQuantity:        4,
			MinimumOrderQuantity: 1,
			Status:               marketplace.ProductStatusActive,
			Location:             "Ha Noi",
			Featured:             true,
			Tags:                 []string{"tham", "san dau", "vo duong"},
			Specs: []marketplace.ProductSpec{
				{Label: "Do day", Value: "20 mm"},
				{Label: "Bo gom", Value: "100 tam 1x1 m"},
				{Label: "Mau", Value: "Do/Xanh"},
			},
			Shipping: marketplace.ShippingProfile{
				LeadTimeDays:    7,
				DeliveryZones:   []string{"Toan quoc"},
				ShippingFeeVND:  250000,
				PickupAvailable: false,
			},
		},
		{
			SellerID:             "seller-vo-duong-binh-dinh",
			SellerName:           "Vo Duong Binh Dinh",
			SellerRole:           "club_leader",
			Title:                "Bao cat da nang treo tran",
			ShortDescription:     "Bao dam day, phu hop luyen da, dam, phan don the luc cho vo sinh.",
			Description:          "Lop da PU day, day treo thep va nhan xoay giup tap lien hoan de dang trong cac vo duong can thiet bi the luc ben bi.",
			Category:             marketplace.CategoryEquipment,
			Condition:            marketplace.ConditionNew,
			MartialArt:           "The luc",
			PriceVND:             1850000,
			CompareAtPriceVND:    2150000,
			Currency:             "VND",
			StockQuantity:        11,
			MinimumOrderQuantity: 1,
			Status:               marketplace.ProductStatusActive,
			Location:             "Binh Dinh",
			Featured:             false,
			Tags:                 []string{"bao dam", "the luc", "tap luyen"},
			Specs: []marketplace.ProductSpec{
				{Label: "Chieu cao", Value: "150 cm"},
				{Label: "Trong luong", Value: "35 kg"},
				{Label: "Chat lieu", Value: "Da PU"},
			},
			Shipping: marketplace.ShippingProfile{
				LeadTimeDays:    3,
				DeliveryZones:   []string{"Toan quoc"},
				ShippingFeeVND:  90000,
				PickupAvailable: false,
			},
		},
	}

	for _, product := range defaultProducts {
		if _, err := s.Extended.Marketplace.CreateProduct(ctx, product); err != nil {
			s.logger.Warn("seed marketplace product failed", slog.String("title", product.Title), slog.String("error", err.Error()))
		}
	}

	orders, err := s.Extended.Marketplace.ListOrders(ctx, "")
	if err != nil || len(orders) > 0 {
		return
	}

	catalog, err := s.Extended.Marketplace.ListCatalog(ctx, marketplace.CatalogFilter{})
	if err != nil || len(catalog.Items) < 2 {
		return
	}

	seedOrders := []marketplace.CreateOrderInput{
		{
			ProductID:    catalog.Items[0].ID,
			Quantity:     2,
			BuyerName:    "CLB Tay Son Ho",
			BuyerPhone:   "0909000111",
			BuyerEmail:   "muahang@taysonho.vn",
			BuyerAddress: "Quy Nhon, Binh Dinh",
			Notes:        "Can xuat hoa don dien tu cho CLB.",
		},
		{
			ProductID:    catalog.Items[1].ID,
			Quantity:     1,
			BuyerName:    "Vo Duong Thanh Cong",
			BuyerPhone:   "0911000222",
			BuyerEmail:   "thanhcong@example.com",
			BuyerAddress: "Thu Duc, TP HCM",
			Notes:        "Giao gio hanh chinh.",
		},
	}

	for _, input := range seedOrders {
		if _, err := s.Extended.Marketplace.CreateOrder(ctx, input); err != nil {
			s.logger.Warn("seed marketplace order failed", slog.String("product_id", input.ProductID), slog.String("error", err.Error()))
		}
	}
}
