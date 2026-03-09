package authz

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"strings"

	"vct-platform/backend/internal/auth"
)

type EntityAction string

const (
	ActionView   EntityAction = "view"
	ActionCreate EntityAction = "create"
	ActionUpdate EntityAction = "update"
	ActionDelete EntityAction = "delete"
	ActionImport EntityAction = "import"
	ActionExport EntityAction = "export"
)

type actionSet map[EntityAction]struct{}
type rolePolicy map[string]actionSet

type policyContract struct {
	Version  int                                         `json:"version"`
	Roles    []auth.UserRole                             `json:"roles"`
	Actions  []EntityAction                              `json:"actions"`
	Policies map[auth.UserRole]map[string][]EntityAction `json:"policies"`
}

//go:embed policy.contract.json
var policyContractRaw []byte

var (
	entityPolicyContract = mustLoadPolicyContract()
	rolePolicies         = buildRolePolicies(entityPolicyContract)
	supportedRoles       = append([]auth.UserRole(nil), entityPolicyContract.Roles...)
	supportedActions     = append([]EntityAction(nil), entityPolicyContract.Actions...)
)

func allow(actions ...EntityAction) actionSet {
	set := make(actionSet, len(actions))
	for _, action := range actions {
		set[action] = struct{}{}
	}
	return set
}

func mustLoadPolicyContract() policyContract {
	var contract policyContract
	if err := json.Unmarshal(policyContractRaw, &contract); err != nil {
		panic(fmt.Sprintf("authz policy contract invalid json: %v", err))
	}
	if len(contract.Roles) == 0 {
		panic("authz policy contract must declare roles")
	}
	if len(contract.Actions) == 0 {
		panic("authz policy contract must declare actions")
	}
	if len(contract.Policies) == 0 {
		panic("authz policy contract must declare policies")
	}

	roleSet := make(map[auth.UserRole]struct{}, len(contract.Roles))
	for _, role := range contract.Roles {
		roleSet[role] = struct{}{}
	}
	actionSet := make(map[EntityAction]struct{}, len(contract.Actions))
	for _, action := range contract.Actions {
		actionSet[action] = struct{}{}
	}

	for role, entityPolicies := range contract.Policies {
		if _, ok := roleSet[role]; !ok {
			panic(fmt.Sprintf("authz policy contract has unknown role in policies: %q", role))
		}
		if len(entityPolicies) == 0 {
			panic(fmt.Sprintf("authz policy contract role %q has empty policy map", role))
		}
		for entity, actions := range entityPolicies {
			if strings.TrimSpace(entity) == "" {
				panic(fmt.Sprintf("authz policy contract role %q has empty entity key", role))
			}
			if len(actions) == 0 {
				panic(fmt.Sprintf("authz policy contract role %q entity %q has no actions", role, entity))
			}
			for _, action := range actions {
				if _, ok := actionSet[action]; !ok {
					panic(fmt.Sprintf("authz policy contract role %q entity %q has unknown action %q", role, entity, action))
				}
			}
		}
	}

	return contract
}

func buildRolePolicies(contract policyContract) map[auth.UserRole]rolePolicy {
	policies := make(map[auth.UserRole]rolePolicy, len(contract.Policies))
	for role, entityPolicies := range contract.Policies {
		entityMap := make(rolePolicy, len(entityPolicies))
		for entity, actions := range entityPolicies {
			normalizedEntity := strings.TrimSpace(strings.ToLower(entity))
			entityMap[normalizedEntity] = allow(actions...)
		}
		policies[role] = entityMap
	}
	return policies
}

func SupportedRoles() []auth.UserRole {
	return append([]auth.UserRole(nil), supportedRoles...)
}

func SupportedActions() []EntityAction {
	return append([]EntityAction(nil), supportedActions...)
}

func CanEntityAction(role auth.UserRole, entity string, action EntityAction) bool {
	policy, ok := rolePolicies[role]
	if !ok {
		return false
	}

	entityName := strings.TrimSpace(strings.ToLower(entity))
	if entityName == "" {
		return false
	}

	if wildcard, hasWildcard := policy["*"]; hasWildcard {
		if _, allowed := wildcard[action]; allowed {
			return true
		}
	}

	actions, hasEntity := policy[entityName]
	if !hasEntity {
		return false
	}
	_, allowed := actions[action]
	return allowed
}
