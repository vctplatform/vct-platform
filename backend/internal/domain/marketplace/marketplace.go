package marketplace

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"
)

type ProductCategory string

const (
	CategoryUniform    ProductCategory = "vo_phuc"
	CategoryProtection ProductCategory = "bao_ho"
	CategoryWeapon     ProductCategory = "binh_khi"
	CategoryEquipment  ProductCategory = "dung_cu"
	CategoryArena      ProductCategory = "san_dau"
	CategoryAccessory  ProductCategory = "phu_kien"
)

type ProductCondition string

const (
	ConditionNew       ProductCondition = "new"
	ConditionLikeNew   ProductCondition = "like_new"
	ConditionUsed      ProductCondition = "used"
	ConditionCollector ProductCondition = "collector"
)

type ProductStatus string

const (
	ProductStatusDraft      ProductStatus = "draft"
	ProductStatusActive     ProductStatus = "active"
	ProductStatusOutOfStock ProductStatus = "out_of_stock"
	ProductStatusArchived   ProductStatus = "archived"
)

type OrderStatus string

const (
	OrderStatusPending   OrderStatus = "pending"
	OrderStatusConfirmed OrderStatus = "confirmed"
	OrderStatusPreparing OrderStatus = "preparing"
	OrderStatusShipping  OrderStatus = "shipping"
	OrderStatusCompleted OrderStatus = "completed"
	OrderStatusCancelled OrderStatus = "cancelled"
)

type PaymentStatus string

const (
	PaymentStatusUnpaid      PaymentStatus = "unpaid"
	PaymentStatusDepositPaid PaymentStatus = "deposit_paid"
	PaymentStatusPaid        PaymentStatus = "paid"
)

type ProductSpec struct {
	Label string `json:"label"`
	Value string `json:"value"`
}

type ShippingProfile struct {
	LeadTimeDays    int      `json:"lead_time_days"`
	DeliveryZones   []string `json:"delivery_zones"`
	ShippingFeeVND  int64    `json:"shipping_fee_vnd"`
	PickupAvailable bool     `json:"pickup_available"`
}

type Product struct {
	ID                   string           `json:"id"`
	Slug                 string           `json:"slug"`
	SellerID             string           `json:"seller_id"`
	SellerName           string           `json:"seller_name"`
	SellerRole           string           `json:"seller_role"`
	Title                string           `json:"title"`
	ShortDescription     string           `json:"short_description"`
	Description          string           `json:"description"`
	Category             ProductCategory  `json:"category"`
	Condition            ProductCondition `json:"condition"`
	MartialArt           string           `json:"martial_art"`
	PriceVND             int64            `json:"price_vnd"`
	CompareAtPriceVND    int64            `json:"compare_at_price_vnd"`
	Currency             string           `json:"currency"`
	StockQuantity        int              `json:"stock_quantity"`
	MinimumOrderQuantity int              `json:"minimum_order_quantity"`
	Status               ProductStatus    `json:"status"`
	Location             string           `json:"location"`
	Featured             bool             `json:"featured"`
	Images               []string         `json:"images"`
	Tags                 []string         `json:"tags"`
	Specs                []ProductSpec    `json:"specs"`
	Shipping             ShippingProfile  `json:"shipping"`
	CreatedAt            time.Time        `json:"created_at"`
	UpdatedAt            time.Time        `json:"updated_at"`
}

type OrderItem struct {
	ID           string `json:"id"`
	ProductID    string `json:"product_id"`
	ProductSlug  string `json:"product_slug"`
	ProductTitle string `json:"product_title"`
	UnitPriceVND int64  `json:"unit_price_vnd"`
	Quantity     int    `json:"quantity"`
	LineTotalVND int64  `json:"line_total_vnd"`
}

type Order struct {
	ID             string        `json:"id"`
	OrderCode      string        `json:"order_code"`
	SellerID       string        `json:"seller_id"`
	SellerName     string        `json:"seller_name"`
	BuyerName      string        `json:"buyer_name"`
	BuyerPhone     string        `json:"buyer_phone"`
	BuyerEmail     string        `json:"buyer_email"`
	BuyerAddress   string        `json:"buyer_address"`
	Notes          string        `json:"notes"`
	Status         OrderStatus   `json:"status"`
	PaymentStatus  PaymentStatus `json:"payment_status"`
	Items          []OrderItem   `json:"items"`
	SubtotalVND    int64         `json:"subtotal_vnd"`
	ShippingFeeVND int64         `json:"shipping_fee_vnd"`
	DiscountVND    int64         `json:"discount_vnd"`
	TotalVND       int64         `json:"total_vnd"`
	CreatedAt      time.Time     `json:"created_at"`
	UpdatedAt      time.Time     `json:"updated_at"`
}

type CatalogFilter struct {
	Search       string `json:"search"`
	Category     string `json:"category"`
	Condition    string `json:"condition"`
	Status       string `json:"status"`
	FeaturedOnly bool   `json:"featured_only"`
}

type FacetCount struct {
	Key   string `json:"key"`
	Label string `json:"label"`
	Count int    `json:"count"`
}

type CatalogFacets struct {
	Categories []FacetCount `json:"categories"`
	Conditions []FacetCount `json:"conditions"`
}

type CatalogStats struct {
	TotalProducts     int   `json:"total_products"`
	FeaturedProducts  int   `json:"featured_products"`
	ActiveSellers     int   `json:"active_sellers"`
	CompletedOrders   int   `json:"completed_orders"`
	TotalInventoryVND int64 `json:"total_inventory_vnd"`
}

type CatalogResult struct {
	Items    []Product     `json:"items"`
	Featured []Product     `json:"featured"`
	Stats    CatalogStats  `json:"stats"`
	Facets   CatalogFacets `json:"facets"`
	Total    int           `json:"total"`
}

type SellerSummary struct {
	ActiveProducts   int   `json:"active_products"`
	PendingOrders    int   `json:"pending_orders"`
	CompletedOrders  int   `json:"completed_orders"`
	LowStockProducts int   `json:"low_stock_products"`
	GrossRevenueVND  int64 `json:"gross_revenue_vnd"`
}

type SellerDashboard struct {
	Summary          SellerSummary `json:"summary"`
	LowStockProducts []Product     `json:"low_stock_products"`
	RecentOrders     []Order       `json:"recent_orders"`
}

type CreateOrderInput struct {
	ProductID    string `json:"product_id"`
	ProductSlug  string `json:"product_slug"`
	Quantity     int    `json:"quantity"`
	BuyerName    string `json:"buyer_name"`
	BuyerPhone   string `json:"buyer_phone"`
	BuyerEmail   string `json:"buyer_email"`
	BuyerAddress string `json:"buyer_address"`
	Notes        string `json:"notes"`
}

type ProductRepository interface {
	List(ctx context.Context) ([]Product, error)
	GetByID(ctx context.Context, id string) (*Product, error)
	GetBySlug(ctx context.Context, slug string) (*Product, error)
	Create(ctx context.Context, product Product) (*Product, error)
	Update(ctx context.Context, id string, patch map[string]any) (*Product, error)
	Delete(ctx context.Context, id string) error
	ListBySeller(ctx context.Context, sellerID string) ([]Product, error)
}

type OrderRepository interface {
	List(ctx context.Context) ([]Order, error)
	GetByID(ctx context.Context, id string) (*Order, error)
	Create(ctx context.Context, order Order) (*Order, error)
	Update(ctx context.Context, id string, patch map[string]any) (*Order, error)
	ListBySeller(ctx context.Context, sellerID string) ([]Order, error)
}

type Service struct {
	productRepo ProductRepository
	orderRepo   OrderRepository
	newUUID     func() string
}

func NewService(productRepo ProductRepository, orderRepo OrderRepository, newUUID func() string) *Service {
	return &Service{
		productRepo: productRepo,
		orderRepo:   orderRepo,
		newUUID:     newUUID,
	}
}

func (s *Service) ListCatalog(ctx context.Context, filter CatalogFilter) (CatalogResult, error) {
	products, err := s.productRepo.List(ctx)
	if err != nil {
		return CatalogResult{}, fmt.Errorf("list products: %w", err)
	}
	orders, err := s.orderRepo.List(ctx)
	if err != nil {
		return CatalogResult{}, fmt.Errorf("list orders: %w", err)
	}

	sortProducts(products)

	filtered := make([]Product, 0, len(products))
	featured := make([]Product, 0, 4)
	categoryCounts := map[string]int{}
	conditionCounts := map[string]int{}
	sellerSet := map[string]struct{}{}

	for _, product := range products {
		if !matchesCatalogFilter(product, filter) {
			continue
		}
		filtered = append(filtered, product)
		categoryCounts[string(product.Category)]++
		conditionCounts[string(product.Condition)]++
		sellerKey := strings.TrimSpace(product.SellerID)
		if sellerKey == "" {
			sellerKey = strings.TrimSpace(product.SellerName)
		}
		if sellerKey != "" {
			sellerSet[sellerKey] = struct{}{}
		}
		if product.Featured && len(featured) < 4 && product.Status == ProductStatusActive {
			featured = append(featured, product)
		}
	}

	stats := CatalogStats{}
	for _, product := range products {
		if product.Status == ProductStatusArchived || product.Status == ProductStatusDraft {
			continue
		}
		stats.TotalProducts++
		if product.Featured {
			stats.FeaturedProducts++
		}
		stats.TotalInventoryVND += product.PriceVND * int64(max(product.StockQuantity, 0))
	}
	for _, order := range orders {
		if order.Status == OrderStatusCompleted {
			stats.CompletedOrders++
		}
	}
	stats.ActiveSellers = len(sellerSet)

	return CatalogResult{
		Items:    filtered,
		Featured: featured,
		Stats:    stats,
		Facets: CatalogFacets{
			Categories: sortedFacetCounts(categoryCounts, categoryLabels()),
			Conditions: sortedFacetCounts(conditionCounts, conditionLabels()),
		},
		Total: len(filtered),
	}, nil
}

func (s *Service) GetProductBySlug(ctx context.Context, slug string) (*Product, error) {
	slug = strings.TrimSpace(slug)
	if slug == "" {
		return nil, fmt.Errorf("slug sản phẩm không được để trống")
	}
	product, err := s.productRepo.GetBySlug(ctx, slug)
	if err == nil {
		return product, nil
	}
	return nil, fmt.Errorf("không tìm thấy sản phẩm: %s", slug)
}

func (s *Service) CreateProduct(ctx context.Context, input Product) (*Product, error) {
	if err := validateProduct(input); err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	products, err := s.productRepo.List(ctx)
	if err != nil {
		return nil, fmt.Errorf("load existing products: %w", err)
	}

	input.ID = s.newUUID()
	input.Slug = ensureUniqueSlug(slugify(input.Title), products)
	input.Currency = defaultString(input.Currency, "VND")
	input.MinimumOrderQuantity = max(input.MinimumOrderQuantity, 1)
	input.Status = normalizeProductStatus(input.Status, input.StockQuantity)
	input.Images = dedupeStrings(input.Images)
	input.Tags = dedupeStrings(input.Tags)
	input.CreatedAt = now
	input.UpdatedAt = now

	created, err := s.productRepo.Create(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("create product: %w", err)
	}
	return created, nil
}

func (s *Service) UpdateProduct(ctx context.Context, id string, patch map[string]any) (*Product, error) {
	current, err := s.productRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("load current product: %w", err)
	}
	if title, ok := patch["title"].(string); ok && strings.TrimSpace(title) != "" {
		products, listErr := s.productRepo.List(ctx)
		if listErr != nil {
			return nil, fmt.Errorf("load existing products: %w", listErr)
		}
		patch["slug"] = ensureUniqueSlugForID(slugify(title), id, products)
	}

	stock := current.StockQuantity
	if rawStock, ok := patch["stock_quantity"]; ok {
		switch typed := rawStock.(type) {
		case int:
			stock = typed
		case float64:
			stock = int(typed)
		}
	}

	status := current.Status
	if rawStatus, ok := patch["status"].(string); ok {
		status = ProductStatus(rawStatus)
	}
	patch["status"] = string(normalizeProductStatus(status, stock))
	patch["updated_at"] = time.Now().UTC()

	updated, err := s.productRepo.Update(ctx, id, patch)
	if err != nil {
		return nil, fmt.Errorf("update product: %w", err)
	}
	return updated, nil
}

func (s *Service) ListSellerProducts(ctx context.Context, sellerID string) ([]Product, error) {
	var (
		products []Product
		err      error
	)
	if strings.TrimSpace(sellerID) == "" {
		products, err = s.productRepo.List(ctx)
	} else {
		products, err = s.productRepo.ListBySeller(ctx, sellerID)
	}
	if err != nil {
		return nil, fmt.Errorf("list seller products: %w", err)
	}
	sortProducts(products)
	return products, nil
}

func (s *Service) CreateOrder(ctx context.Context, input CreateOrderInput) (*Order, error) {
	product, err := s.lookupProductForOrder(ctx, input.ProductID, input.ProductSlug)
	if err != nil {
		return nil, err
	}
	if product.Status != ProductStatusActive && product.Status != ProductStatusOutOfStock {
		return nil, fmt.Errorf("sản phẩm hiện không thể đặt mua")
	}
	if strings.TrimSpace(input.BuyerName) == "" {
		return nil, fmt.Errorf("vui lòng nhập tên người mua")
	}
	if strings.TrimSpace(input.BuyerPhone) == "" {
		return nil, fmt.Errorf("vui lòng nhập số điện thoại")
	}

	quantity := max(input.Quantity, product.MinimumOrderQuantity)
	if quantity < product.MinimumOrderQuantity {
		return nil, fmt.Errorf("số lượng tối thiểu là %d", product.MinimumOrderQuantity)
	}
	if product.StockQuantity < quantity {
		return nil, fmt.Errorf("tồn kho còn %d sản phẩm", product.StockQuantity)
	}

	now := time.Now().UTC()
	lineTotal := product.PriceVND * int64(quantity)
	orderID := s.newUUID()
	order := Order{
		ID:             orderID,
		OrderCode:      generateOrderCode(orderID, now),
		SellerID:       product.SellerID,
		SellerName:     product.SellerName,
		BuyerName:      strings.TrimSpace(input.BuyerName),
		BuyerPhone:     strings.TrimSpace(input.BuyerPhone),
		BuyerEmail:     strings.TrimSpace(input.BuyerEmail),
		BuyerAddress:   strings.TrimSpace(input.BuyerAddress),
		Notes:          strings.TrimSpace(input.Notes),
		Status:         OrderStatusPending,
		PaymentStatus:  PaymentStatusUnpaid,
		SubtotalVND:    lineTotal,
		ShippingFeeVND: product.Shipping.ShippingFeeVND,
		DiscountVND:    0,
		TotalVND:       lineTotal + product.Shipping.ShippingFeeVND,
		CreatedAt:      now,
		UpdatedAt:      now,
		Items: []OrderItem{
			{
				ID:           s.newUUID(),
				ProductID:    product.ID,
				ProductSlug:  product.Slug,
				ProductTitle: product.Title,
				UnitPriceVND: product.PriceVND,
				Quantity:     quantity,
				LineTotalVND: lineTotal,
			},
		},
	}

	created, err := s.orderRepo.Create(ctx, order)
	if err != nil {
		return nil, fmt.Errorf("create order: %w", err)
	}

	nextStock := product.StockQuantity - quantity
	_, err = s.productRepo.Update(ctx, product.ID, map[string]any{
		"stock_quantity": nextStock,
		"status":         string(normalizeProductStatus(product.Status, nextStock)),
		"updated_at":     now,
	})
	if err != nil {
		return nil, fmt.Errorf("update product stock: %w", err)
	}
	return created, nil
}

func (s *Service) ListOrders(ctx context.Context, sellerID string) ([]Order, error) {
	var (
		orders []Order
		err    error
	)
	if strings.TrimSpace(sellerID) == "" {
		orders, err = s.orderRepo.List(ctx)
	} else {
		orders, err = s.orderRepo.ListBySeller(ctx, sellerID)
	}
	if err != nil {
		return nil, fmt.Errorf("list orders: %w", err)
	}
	sortOrders(orders)
	return orders, nil
}

func (s *Service) UpdateOrder(ctx context.Context, id string, patch map[string]any) (*Order, error) {
	patch["updated_at"] = time.Now().UTC()
	updated, err := s.orderRepo.Update(ctx, id, patch)
	if err != nil {
		return nil, fmt.Errorf("update order: %w", err)
	}
	return updated, nil
}

func (s *Service) SellerDashboard(ctx context.Context, sellerID string) (SellerDashboard, error) {
	products, err := s.ListSellerProducts(ctx, sellerID)
	if err != nil {
		return SellerDashboard{}, err
	}
	orders, err := s.ListOrders(ctx, sellerID)
	if err != nil {
		return SellerDashboard{}, err
	}

	summary := SellerSummary{}
	lowStock := make([]Product, 0)
	for _, product := range products {
		if product.Status == ProductStatusActive || product.Status == ProductStatusOutOfStock {
			summary.ActiveProducts++
		}
		if product.StockQuantity > 0 && product.StockQuantity <= 5 {
			summary.LowStockProducts++
			lowStock = append(lowStock, product)
		}
	}
	for _, order := range orders {
		switch order.Status {
		case OrderStatusPending, OrderStatusConfirmed, OrderStatusPreparing:
			summary.PendingOrders++
		case OrderStatusCompleted:
			summary.CompletedOrders++
			summary.GrossRevenueVND += order.TotalVND
		}
	}

	if len(lowStock) > 5 {
		lowStock = lowStock[:5]
	}
	if len(orders) > 6 {
		orders = orders[:6]
	}

	return SellerDashboard{
		Summary:          summary,
		LowStockProducts: lowStock,
		RecentOrders:     orders,
	}, nil
}

func validateProduct(product Product) error {
	if strings.TrimSpace(product.Title) == "" {
		return fmt.Errorf("tên sản phẩm không được để trống")
	}
	if strings.TrimSpace(product.SellerName) == "" {
		return fmt.Errorf("vui lòng cung cấp tên người bán")
	}
	if product.PriceVND <= 0 {
		return fmt.Errorf("giá bán phải lớn hơn 0")
	}
	if product.StockQuantity < 0 {
		return fmt.Errorf("tồn kho không hợp lệ")
	}
	if product.Category == "" {
		return fmt.Errorf("vui lòng chọn danh mục")
	}
	if product.Condition == "" {
		return fmt.Errorf("vui lòng chọn tình trạng sản phẩm")
	}
	return nil
}

func matchesCatalogFilter(product Product, filter CatalogFilter) bool {
	if product.Status == ProductStatusDraft || product.Status == ProductStatusArchived {
		return false
	}
	if filter.FeaturedOnly && !product.Featured {
		return false
	}
	if filter.Status != "" && string(product.Status) != filter.Status {
		return false
	}
	if filter.Category != "" && string(product.Category) != filter.Category {
		return false
	}
	if filter.Condition != "" && string(product.Condition) != filter.Condition {
		return false
	}
	if strings.TrimSpace(filter.Search) == "" {
		return true
	}
	query := strings.ToLower(strings.TrimSpace(filter.Search))
	haystack := strings.ToLower(strings.Join([]string{
		product.Title,
		product.ShortDescription,
		product.Description,
		product.SellerName,
		product.MartialArt,
		strings.Join(product.Tags, " "),
	}, " "))
	return strings.Contains(haystack, query)
}

func normalizeProductStatus(status ProductStatus, stock int) ProductStatus {
	switch status {
	case ProductStatusDraft, ProductStatusArchived:
		return status
	case ProductStatusActive, ProductStatusOutOfStock:
		if stock <= 0 {
			return ProductStatusOutOfStock
		}
		return ProductStatusActive
	default:
		if stock <= 0 {
			return ProductStatusOutOfStock
		}
		return ProductStatusActive
	}
}

func (s *Service) lookupProductForOrder(ctx context.Context, productID string, productSlug string) (*Product, error) {
	productID = strings.TrimSpace(productID)
	productSlug = strings.TrimSpace(productSlug)
	switch {
	case productID != "":
		product, err := s.productRepo.GetByID(ctx, productID)
		if err != nil {
			return nil, fmt.Errorf("không tìm thấy sản phẩm")
		}
		return product, nil
	case productSlug != "":
		product, err := s.productRepo.GetBySlug(ctx, productSlug)
		if err != nil {
			return nil, fmt.Errorf("không tìm thấy sản phẩm")
		}
		return product, nil
	default:
		return nil, fmt.Errorf("thiếu thông tin sản phẩm")
	}
}

func sortProducts(products []Product) {
	sort.SliceStable(products, func(i, j int) bool {
		if products[i].Featured != products[j].Featured {
			return products[i].Featured
		}
		return products[i].UpdatedAt.After(products[j].UpdatedAt)
	})
}

func sortOrders(orders []Order) {
	sort.SliceStable(orders, func(i, j int) bool {
		return orders[i].CreatedAt.After(orders[j].CreatedAt)
	})
}

func sortedFacetCounts(counts map[string]int, labels map[string]string) []FacetCount {
	facets := make([]FacetCount, 0, len(counts))
	for key, count := range counts {
		facets = append(facets, FacetCount{
			Key:   key,
			Label: defaultString(labels[key], key),
			Count: count,
		})
	}
	sort.SliceStable(facets, func(i, j int) bool {
		if facets[i].Count != facets[j].Count {
			return facets[i].Count > facets[j].Count
		}
		return facets[i].Label < facets[j].Label
	})
	return facets
}

func ensureUniqueSlug(base string, products []Product) string {
	return ensureUniqueSlugForID(base, "", products)
}

func ensureUniqueSlugForID(base string, productID string, products []Product) string {
	base = strings.TrimSpace(base)
	if base == "" {
		base = "vct-marketplace-item"
	}
	candidate := base
	index := 2
	for {
		conflict := false
		for _, product := range products {
			if product.ID != productID && product.Slug == candidate {
				conflict = true
				break
			}
		}
		if !conflict {
			return candidate
		}
		candidate = fmt.Sprintf("%s-%d", base, index)
		index++
	}
}

func slugify(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	replacer := strings.NewReplacer(
		"a", "a", "à", "a", "á", "a", "ạ", "a", "ả", "a", "ã", "a",
		"â", "a", "ầ", "a", "ấ", "a", "ậ", "a", "ẩ", "a", "ẫ", "a",
		"ă", "a", "ằ", "a", "ắ", "a", "ặ", "a", "ẳ", "a", "ẵ", "a",
		"è", "e", "é", "e", "ẹ", "e", "ẻ", "e", "ẽ", "e",
		"ê", "e", "ề", "e", "ế", "e", "ệ", "e", "ể", "e", "ễ", "e",
		"ì", "i", "í", "i", "ị", "i", "ỉ", "i", "ĩ", "i",
		"ò", "o", "ó", "o", "ọ", "o", "ỏ", "o", "õ", "o",
		"ô", "o", "ồ", "o", "ố", "o", "ộ", "o", "ổ", "o", "ỗ", "o",
		"ơ", "o", "ờ", "o", "ớ", "o", "ợ", "o", "ở", "o", "ỡ", "o",
		"ù", "u", "ú", "u", "ụ", "u", "ủ", "u", "ũ", "u",
		"ư", "u", "ừ", "u", "ứ", "u", "ự", "u", "ử", "u", "ữ", "u",
		"ỳ", "y", "ý", "y", "ỵ", "y", "ỷ", "y", "ỹ", "y",
		"đ", "d",
	)
	value = replacer.Replace(value)

	var builder strings.Builder
	lastDash := false
	for _, r := range value {
		switch {
		case r >= 'a' && r <= 'z':
			builder.WriteRune(r)
			lastDash = false
		case r >= '0' && r <= '9':
			builder.WriteRune(r)
			lastDash = false
		default:
			if !lastDash {
				builder.WriteRune('-')
				lastDash = true
			}
		}
	}

	slug := strings.Trim(builder.String(), "-")
	return strings.TrimSpace(slug)
}

func generateOrderCode(orderID string, now time.Time) string {
	suffix := strings.ReplaceAll(orderID, "-", "")
	if len(suffix) > 6 {
		suffix = suffix[len(suffix)-6:]
	}
	return fmt.Sprintf("VMP-%s-%s", now.Format("20060102"), strings.ToUpper(suffix))
}

func dedupeStrings(values []string) []string {
	if len(values) == 0 {
		return []string{}
	}
	seen := map[string]struct{}{}
	out := make([]string, 0, len(values))
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed == "" {
			continue
		}
		if _, exists := seen[trimmed]; exists {
			continue
		}
		seen[trimmed] = struct{}{}
		out = append(out, trimmed)
	}
	return out
}

func defaultString(value string, fallback string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return fallback
	}
	return value
}

func categoryLabels() map[string]string {
	return map[string]string{
		string(CategoryUniform):    "Võ phục",
		string(CategoryProtection): "Bảo hộ",
		string(CategoryWeapon):     "Binh khí",
		string(CategoryEquipment):  "Dụng cụ",
		string(CategoryArena):      "Sàn đấu",
		string(CategoryAccessory):  "Phụ kiện",
	}
}

func conditionLabels() map[string]string {
	return map[string]string{
		string(ConditionNew):       "Mới",
		string(ConditionLikeNew):   "Như mới",
		string(ConditionUsed):      "Đã qua sử dụng",
		string(ConditionCollector): "Sưu tầm",
	}
}

func max(value int, minimum int) int {
	if value < minimum {
		return minimum
	}
	return value
}
