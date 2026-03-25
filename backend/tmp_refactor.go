package main

import (
	"fmt"
	"io/ioutil"
	"path/filepath"
	"strings"
)

func main() {
	replacements := map[string]string{
		"s.athleteService": "s.Core.Athlete",
		"s.orgService": "s.Core.Organization",
		"s.scoringService": "s.Core.Scoring",
		"s.registrationService": "s.Core.Registration",
		"s.tournamentCRUD": "s.Core.Tournament",
		"s.rankingService": "s.Core.Ranking",
		"s.heritageService": "s.Core.Heritage",
		"s.financeService": "s.Core.Finance",
		"s.communityService": "s.Core.Community",
		"s.clubSvc": "s.Core.Club",

		"s.federationSvc": "s.Federation.Main",
		"s.approvalSvc": "s.Federation.Approval",
		"s.workflowRepo": "s.Federation.WorkflowRepo",
		"s.certificationSvc": "s.Federation.Certification",
		"s.disciplineSvc": "s.Federation.Discipline",
		"s.documentSvc": "s.Federation.Document",
		"s.internationalSvc": "s.Federation.International",

		"s.provincialSvc": "s.Provincial.Main",
		"s.tournamentStore": "s.Provincial.TournamentStore",
		"s.financeStore": "s.Provincial.FinanceStore",
		"s.certStore": "s.Provincial.CertStore",
		"s.disciplineStore": "s.Provincial.DisciplineStore",
		"s.docStore": "s.Provincial.DocStore",

		"s.athleteProfileSvc": "s.Extended.AthleteProfile",
		"s.trainingSessionSvc": "s.Extended.TrainingSession",
		"s.btcSvc": "s.Extended.BTC",
		"s.parentSvc": "s.Extended.Parent",
		"s.tournamentMgmtSvc": "s.Extended.TournamentMgmt",
		"s.marketplaceSvc": "s.Extended.Marketplace",
		"s.supportSvc": "s.Extended.Support",
		"s.subscriptionSvc": "s.Extended.Subscription",

        // Also handle tests replacing api.*
		"api.athleteService": "api.Core.Athlete",
		"api.orgService": "api.Core.Organization",
		"api.scoringService": "api.Core.Scoring",
		"api.registrationService": "api.Core.Registration",
		"api.tournamentCRUD": "api.Core.Tournament",
		"api.rankingService": "api.Core.Ranking",
		"api.heritageService": "api.Core.Heritage",
		"api.financeService": "api.Core.Finance",
		"api.communityService": "api.Core.Community",
		"api.clubSvc": "api.Core.Club",

		"api.federationSvc": "api.Federation.Main",
		"api.approvalSvc": "api.Federation.Approval",
		"api.workflowRepo": "api.Federation.WorkflowRepo",
		"api.certificationSvc": "api.Federation.Certification",
		"api.disciplineSvc": "api.Federation.Discipline",
		"api.documentSvc": "api.Federation.Document",
		"api.internationalSvc": "api.Federation.International",

		"api.provincialSvc": "api.Provincial.Main",
		"api.tournamentStore": "api.Provincial.TournamentStore",
		"api.financeStore": "api.Provincial.FinanceStore",
		"api.certStore": "api.Provincial.CertStore",
		"api.disciplineStore": "api.Provincial.DisciplineStore",
		"api.docStore": "api.Provincial.DocStore",

		"api.athleteProfileSvc": "api.Extended.AthleteProfile",
		"api.trainingSessionSvc": "api.Extended.TrainingSession",
		"api.btcSvc": "api.Extended.BTC",
		"api.parentSvc": "api.Extended.Parent",
		"api.tournamentMgmtSvc": "api.Extended.TournamentMgmt",
		"api.marketplaceSvc": "api.Extended.Marketplace",
		"api.supportSvc": "api.Extended.Support",
		"api.subscriptionSvc": "api.Extended.Subscription",
	}

	dir := "d:\\VCT PLATFORM\\vct-platform\\backend\\internal\\httpapi"
	files, err := ioutil.ReadDir(dir)
	if err != nil {
		panic(err)
	}

	for _, f := range files {
		if f.IsDir() || !strings.HasSuffix(f.Name(), ".go") {
			continue
		}
		
		path := filepath.Join(dir, f.Name())
		// Skip server.go and wire.go because we will manually refactor their declarations
		if f.Name() == "server.go" || f.Name() == "wire.go" || f.Name() == "router.go" {
			continue
		}

		contentBytes, err := ioutil.ReadFile(path)
		if err != nil {
			panic(err)
		}
		content := string(contentBytes)
		original := content

		for oldStr, newStr := range replacements {
			content = strings.ReplaceAll(content, oldStr, newStr)
		}

		if content != original {
			ioutil.WriteFile(path, []byte(content), 0644)
			fmt.Printf("Updated %s\n", f.Name())
		}
	}
}
