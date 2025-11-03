#!/bin/bash

# Script de validation du refactoring
# Usage: ./validate-refactoring.sh

echo "🔍 Validation du refactoring Launcher-Ads v2.0.0"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

errors=0
warnings=0

# Function to check if a file exists
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $2"
  else
    echo -e "${RED}✗${NC} $2 (fichier manquant: $1)"
    errors=$((errors + 1))
  fi
}

# Function to check if a file does NOT exist (should be deleted)
check_deleted() {
  if [ ! -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $2"
  else
    echo -e "${YELLOW}⚠${NC} $2 (fichier devrait être supprimé: $1)"
    warnings=$((warnings + 1))
  fi
}

# Function to check if a directory exists
check_dir() {
  if [ -d "$1" ]; then
    echo -e "${GREEN}✓${NC} $2"
  else
    echo -e "${RED}✗${NC} $2 (dossier manquant: $1)"
    errors=$((errors + 1))
  fi
}

echo "📋 Vérification des fichiers créés..."
echo ""

# Documentation
check_file "ARCHITECTURE.md" "ARCHITECTURE.md existe"
check_file ".claudecode/RULES.md" "RULES.md existe"
check_file ".claudecode/README.md" "Claude Code README existe"
check_file "CHANGELOG.md" "CHANGELOG.md existe"
check_file "REFACTORING_REPORT.md" "REFACTORING_REPORT.md existe"

echo ""
echo "📋 Vérification des fichiers supprimés..."
echo ""

# Fichiers qui devraient être supprimés
check_deleted "PHASE1_README.md" "PHASE1_README.md supprimé"
check_deleted "PROJECT_COMPLETE.md" "PROJECT_COMPLETE.md supprimé"
check_deleted "TASK_3_COMPLETE.md" "TASK_3_COMPLETE.md supprimé"
check_deleted "TASK_4_COMPLETE.md" "TASK_4_COMPLETE.md supprimé"
check_deleted "TASK_5_COMPLETE.md" "TASK_5_COMPLETE.md supprimé"
check_deleted "SETUP_COMPLETE.md" "SETUP_COMPLETE.md supprimé"
check_deleted "apps/web/lib/types/bulk-launcher.ts" "bulk-launcher.ts supprimé"
check_deleted "apps/web/lib/hooks/use-autosave.ts" "use-autosave.ts supprimé"
check_deleted "apps/web/lib/hooks/use-undo-redo.ts" "use-undo-redo.ts supprimé"
check_deleted "apps/web/lib/hooks/use-supabase-query.ts" "use-supabase-query.ts supprimé"
check_deleted "apps/web/lib/hooks/use-supabase-mutation.ts" "use-supabase-mutation.ts supprimé"
check_deleted "apps/web/lib/utils/storage.ts" "storage.ts supprimé"

echo ""
echo "📋 Vérification des nouveaux controllers..."
echo ""

check_dir "apps/api/src/facebook/controllers" "Dossier controllers créé"
check_file "apps/api/src/facebook/controllers/index.ts" "Controllers index existe"
check_file "apps/api/src/facebook/controllers/facebook-auth.controller.ts" "AuthController créé"
check_file "apps/api/src/facebook/controllers/facebook-campaigns.controller.ts" "CampaignsController créé"
check_file "apps/api/src/facebook/controllers/facebook-insights.controller.ts" "InsightsController créé"
check_file "apps/api/src/facebook/controllers/facebook-admin.controller.ts" "AdminController créé"
check_file "apps/api/src/facebook/controllers/facebook-debug.controller.ts" "DebugController créé"

echo ""
echo "📋 Vérification du SDK..."
echo ""

check_file "packages/sdk/src/schemas/bulk-launcher.schema.ts" "bulk-launcher.schema.ts créé"
check_file "packages/sdk/src/schemas/index.ts" "SDK index mis à jour"

echo ""
echo "📋 Vérification des imports SDK..."
echo ""

# Compter les fichiers qui importent depuis le SDK
sdk_imports=$(grep -r "from '@launcher-ads/sdk'" apps/web/components apps/web/lib 2>/dev/null | wc -l)
old_imports=$(grep -r "from '@/lib/types/bulk-launcher'" apps/web 2>/dev/null | wc -l)

if [ "$sdk_imports" -gt 0 ]; then
  echo -e "${GREEN}✓${NC} Imports SDK trouvés: $sdk_imports fichiers"
else
  echo -e "${RED}✗${NC} Aucun import SDK trouvé"
  errors=$((errors + 1))
fi

if [ "$old_imports" -eq 0 ]; then
  echo -e "${GREEN}✓${NC} Aucun ancien import trouvé"
else
  echo -e "${YELLOW}⚠${NC} Anciens imports restants: $old_imports fichiers"
  warnings=$((warnings + 1))
fi

echo ""
echo "📋 Vérification TypeScript..."
echo ""

# Type checking (ne bloque pas si erreurs)
if pnpm typecheck > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} TypeScript: Aucune erreur"
else
  echo -e "${YELLOW}⚠${NC} TypeScript: Erreurs détectées (vérifier avec 'pnpm typecheck')"
  warnings=$((warnings + 1))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Summary
if [ $errors -eq 0 ] && [ $warnings -eq 0 ]; then
  echo -e "${GREEN}✅ Validation réussie !${NC}"
  echo ""
  echo "Tous les changements du refactoring sont présents."
  echo ""
  echo "🚀 Prochaines étapes:"
  echo "  1. Tester l'API: pnpm dev:api"
  echo "  2. Tester le frontend: pnpm dev:web"
  echo "  3. Supprimer le backup: rm apps/api/src/facebook/facebook.controller.ts.backup"
  exit 0
elif [ $errors -eq 0 ]; then
  echo -e "${YELLOW}⚠️  Validation partielle${NC}"
  echo ""
  echo "Refactoring OK mais $warnings avertissement(s) détecté(s)."
  echo ""
  echo "Vérifier les warnings ci-dessus."
  exit 1
else
  echo -e "${RED}❌ Validation échouée${NC}"
  echo ""
  echo "$errors erreur(s) et $warnings avertissement(s) détecté(s)."
  echo ""
  echo "Corriger les erreurs ci-dessus avant de continuer."
  exit 2
fi
