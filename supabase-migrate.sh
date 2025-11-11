#!/bin/bash

# Script para auxiliar no gerenciamento de migrations do Supabase
# Uso: ./supabase-migrate.sh [comando]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para exibir erro
error() {
    echo -e "${RED}❌ Erro: $1${NC}"
    exit 1
}

# Função para exibir sucesso
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Função para exibir info
info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Verificar se Supabase CLI está instalado
check_cli() {
    if ! command -v supabase &> /dev/null; then
        error "Supabase CLI não encontrado. Instale com: npm install -g @supabase/cli"
    fi
}

# Listar migrations
list_migrations() {
    info "Migrations encontradas:"
    ls -1 supabase/migrations/ || error "Pasta de migrations não encontrada"
}

# Status das migrations (requer credenciais)
status_migrations() {
    check_cli
    info "Verificando status das migrations no Supabase..."
    
    if [ -z "$SUPABASE_PROJECT_ID" ]; then
        error "SUPABASE_PROJECT_ID não definido. Configure a variável de ambiente."
    fi
    
    supabase migration list --project-ref $SUPABASE_PROJECT_ID || \
        error "Não foi possível conectar ao Supabase. Verifique suas credenciais."
}

# Push migrations para o Supabase
push_migrations() {
    check_cli
    
    if [ -z "$SUPABASE_PROJECT_ID" ]; then
        error "SUPABASE_PROJECT_ID não definido. Configure a variável de ambiente."
    fi
    
    info "Fazendo push das migrations para o Supabase..."
    supabase db push --project-ref $SUPABASE_PROJECT_ID || \
        error "Erro ao fazer push das migrations"
    
    success "Migrations enviadas com sucesso!"
}

# Criar nova migration
create_migration() {
    if [ -z "$1" ]; then
        error "Nome da migration não fornecido. Uso: ./supabase-migrate.sh new nome_da_migration"
    fi
    
    check_cli
    
    info "Criando nova migration: $1..."
    supabase migration new "$1" || error "Erro ao criar migration"
    
    success "Migration criada! Edite o arquivo em supabase/migrations/"
}

# Exibir ajuda
show_help() {
    cat << EOF
Supabase Migrations Manager

Uso: ./supabase-migrate.sh [COMANDO]

Comandos:
    list        - Lista todas as migrations locais
    status      - Verifica o status das migrations no Supabase
    push        - Envia todas as migrations para o Supabase
    new [name]  - Cria uma nova migration
    help        - Exibe esta mensagem

Exemplos:
    ./supabase-migrate.sh list
    ./supabase-migrate.sh new create_users_table
    ./supabase-migrate.sh push

Variáveis de Ambiente Necessárias:
    SUPABASE_PROJECT_ID    - ID do projeto Supabase
    SUPABASE_ACCESS_TOKEN  - Token de acesso (para push automático)

EOF
}

# Comando principal
case "${1:-help}" in
    list)
        list_migrations
        ;;
    status)
        status_migrations
        ;;
    push)
        push_migrations
        ;;
    new)
        create_migration "$2"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        error "Comando desconhecido: $1. Use './supabase-migrate.sh help' para ajuda."
        ;;
esac
