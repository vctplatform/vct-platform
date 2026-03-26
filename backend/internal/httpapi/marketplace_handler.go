package httpapi

import (
	"net/http"
	"strings"

	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/domain/marketplace"
)

func (s *Server) handleMarketplaceProducts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}

	result, err := s.Extended.Marketplace.ListCatalog(r.Context(), marketplace.CatalogFilter{
		Search:       strings.TrimSpace(r.URL.Query().Get("search")),
		Category:     strings.TrimSpace(r.URL.Query().Get("category")),
		Condition:    strings.TrimSpace(r.URL.Query().Get("condition")),
		Status:       strings.TrimSpace(r.URL.Query().Get("status")),
		FeaturedOnly: strings.EqualFold(strings.TrimSpace(r.URL.Query().Get("featured")), "true"),
	})
	if err != nil {
		apiInternal(w, err)
		return
	}
	success(w, http.StatusOK, result)
}

func (s *Server) handleMarketplaceProductDetail(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}

	slug := strings.TrimPrefix(r.URL.Path, "/api/v1/marketplace/products/")
	slug = strings.TrimSpace(strings.Trim(slug, "/"))
	if slug == "" {
		apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy tài nguyên")
		return
	}

	product, err := s.Extended.Marketplace.GetProductBySlug(r.Context(), slug)
	if err != nil {
		apiError(w, http.StatusNotFound, CodeNotFound, err.Error())
		return
	}
	success(w, http.StatusOK, product)
}

func (s *Server) handleMarketplaceOrders(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		apiMethodNotAllowed(w)
		return
	}

	var payload marketplace.CreateOrderInput
	if err := decodeJSON(r, &payload); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
		return
	}

	order, err := s.Extended.Marketplace.CreateOrder(r.Context(), payload)
	if err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
		return
	}
	success(w, http.StatusCreated, order)
}

func (s *Server) handleMarketplaceStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}

	result, err := s.Extended.Marketplace.ListCatalog(r.Context(), marketplace.CatalogFilter{})
	if err != nil {
		apiInternal(w, err)
		return
	}
	success(w, http.StatusOK, map[string]any{"stats": result.Stats})
}

func (s *Server) handleMarketplaceSellerDashboard(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}
	if !requireMarketplaceManager(w, p) {
		return
	}

	dashboard, err := s.Extended.Marketplace.SellerDashboard(r.Context(), marketplaceScopeSellerID(p))
	if err != nil {
		apiInternal(w, err)
		return
	}
	success(w, http.StatusOK, dashboard)
}

func (s *Server) handleMarketplaceSellerProducts(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if !requireMarketplaceManager(w, p) {
		return
	}

	switch r.Method {
	case http.MethodGet:
		items, err := s.Extended.Marketplace.ListSellerProducts(r.Context(), marketplaceScopeSellerID(p))
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{
			"items": items,
			"total": len(items),
		})
	case http.MethodPost:
		var payload marketplace.Product
		if err := decodeJSON(r, &payload); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		if !isMarketplaceAdmin(p) {
			payload.SellerID = p.User.ID
			payload.SellerRole = string(p.User.Role)
			payload.SellerName = marketplacePrincipalName(p)
		} else {
			if strings.TrimSpace(payload.SellerID) == "" {
				payload.SellerID = p.User.ID
			}
			if strings.TrimSpace(payload.SellerRole) == "" {
				payload.SellerRole = string(p.User.Role)
			}
			if strings.TrimSpace(payload.SellerName) == "" {
				payload.SellerName = marketplacePrincipalName(p)
			}
		}

		created, err := s.Extended.Marketplace.CreateProduct(r.Context(), payload)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusCreated, created)
	default:
		apiMethodNotAllowed(w)
	}
}

func (s *Server) handleMarketplaceSellerProductDetail(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if !requireMarketplaceManager(w, p) {
		return
	}

	productID := strings.TrimPrefix(r.URL.Path, "/api/v1/marketplace/seller/products/")
	productID = strings.TrimSpace(strings.Trim(productID, "/"))
	if productID == "" {
		apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy tài nguyên")
		return
	}

	switch r.Method {
	case http.MethodGet:
		items, err := s.Extended.Marketplace.ListSellerProducts(r.Context(), marketplaceScopeSellerID(p))
		if err != nil {
			apiInternal(w, err)
			return
		}
		for _, item := range items {
			if item.ID == productID {
				success(w, http.StatusOK, item)
				return
			}
		}
		apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy tài nguyên")
	case http.MethodPatch:
		patch := map[string]any{}
		if err := decodeJSON(r, &patch); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		updated, err := s.Extended.Marketplace.UpdateProduct(r.Context(), productID, patch)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, updated)
	default:
		apiMethodNotAllowed(w)
	}
}

func (s *Server) handleMarketplaceSellerOrders(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}
	if !requireMarketplaceManager(w, p) {
		return
	}

	items, err := s.Extended.Marketplace.ListOrders(r.Context(), marketplaceScopeSellerID(p))
	if err != nil {
		apiInternal(w, err)
		return
	}
	success(w, http.StatusOK, map[string]any{
		"items": items,
		"total": len(items),
	})
}

func (s *Server) handleMarketplaceSellerOrderDetail(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodPatch {
		apiMethodNotAllowed(w)
		return
	}
	if !requireMarketplaceManager(w, p) {
		return
	}

	orderID := strings.TrimPrefix(r.URL.Path, "/api/v1/marketplace/seller/orders/")
	orderID = strings.TrimSpace(strings.Trim(orderID, "/"))
	if orderID == "" {
		apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy tài nguyên")
		return
	}

	patch := map[string]any{}
	if err := decodeJSON(r, &patch); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
		return
	}
	updated, err := s.Extended.Marketplace.UpdateOrder(r.Context(), orderID, patch)
	if err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
		return
	}
	success(w, http.StatusOK, updated)
}

func requireMarketplaceManager(w http.ResponseWriter, p auth.Principal) bool {
	return requireRole(
		w,
		p,
		auth.RoleAdmin,
		auth.RoleFederationPresident,
		auth.RoleFederationSecretary,
		auth.RoleProvincialAdmin,
		auth.RoleClubLeader,
		auth.RoleClubViceLeader,
		auth.RoleClubSecretary,
		auth.RoleClubAccountant,
		auth.RoleCoach,
	)
}

func isMarketplaceAdmin(p auth.Principal) bool {
	switch p.User.Role {
	case auth.RoleAdmin, auth.RoleFederationPresident, auth.RoleFederationSecretary, auth.RoleProvincialAdmin:
		return true
	default:
		return false
	}
}

func marketplaceScopeSellerID(p auth.Principal) string {
	if isMarketplaceAdmin(p) {
		return ""
	}
	return strings.TrimSpace(p.User.ID)
}

func marketplacePrincipalName(p auth.Principal) string {
	if strings.TrimSpace(p.User.DisplayName) != "" {
		return strings.TrimSpace(p.User.DisplayName)
	}
	if strings.TrimSpace(p.User.Username) != "" {
		return strings.TrimSpace(p.User.Username)
	}
	return "Seller"
}
