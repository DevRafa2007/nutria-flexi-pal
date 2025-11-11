# Script para auxiliar no gerenciamento de migrations do Supabase
# Uso: .\supabase-migrate.ps1 -Command list|status|push|new

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('list', 'status', 'push', 'new', 'help')]
    [string]$Command,
    
    [Parameter(Mandatory=$false)]
    [string]$Name
)

# Função para exibir erro
function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ Erro: $Message" -ForegroundColor Red
    exit 1
}

# Função para exibir sucesso
function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

# Função para exibir info
function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Yellow
}

# Verificar se Supabase CLI está instalado
function Test-SupabaseCLI {
    try {
        $null = & supabase --version 2>$null
        return $true
    } catch {
        return $false
    }
}

# Listar migrations
function List-Migrations {
    Write-Info "Migrations encontradas:"
    Get-ChildItem -Path "supabase/migrations/" -ErrorAction Stop | ForEach-Object { Write-Host $_.Name }
}

# Status das migrations
function Get-MigrationStatus {
    if (-not (Test-SupabaseCLI)) {
        Write-Error-Custom "Supabase CLI não encontrado. Instale com: npm install -g @supabase/cli"
    }
    
    Write-Info "Verificando status das migrations no Supabase..."
    
    if ([string]::IsNullOrEmpty($env:SUPABASE_PROJECT_ID)) {
        Write-Error-Custom "SUPABASE_PROJECT_ID não definido. Configure a variável de ambiente."
    }
    
    & supabase migration list --project-ref $env:SUPABASE_PROJECT_ID 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Não foi possível conectar ao Supabase. Verifique suas credenciais."
    }
}

# Push migrations para Supabase
function Push-Migrations {
    if (-not (Test-SupabaseCLI)) {
        Write-Error-Custom "Supabase CLI não encontrado. Instale com: npm install -g @supabase/cli"
    }
    
    if ([string]::IsNullOrEmpty($env:SUPABASE_PROJECT_ID)) {
        Write-Error-Custom "SUPABASE_PROJECT_ID não definido. Configure a variável de ambiente."
    }
    
    Write-Info "Fazendo push das migrations para o Supabase..."
    & supabase db push --project-ref $env:SUPABASE_PROJECT_ID 2>$null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Erro ao fazer push das migrations"
    }
    
    Write-Success "Migrations enviadas com sucesso!"
}

# Criar nova migration
function New-Migration {
    param([string]$MigrationName)
    
    if ([string]::IsNullOrEmpty($MigrationName)) {
        Write-Error-Custom "Nome da migration não fornecido. Uso: .\supabase-migrate.ps1 -Command new -Name nome_da_migration"
    }
    
    if (-not (Test-SupabaseCLI)) {
        Write-Error-Custom "Supabase CLI não encontrado. Instale com: npm install -g @supabase/cli"
    }
    
    Write-Info "Criando nova migration: $MigrationName..."
    & supabase migration new "$MigrationName"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Migration criada! Edite o arquivo em supabase/migrations/"
    } else {
        Write-Error-Custom "Erro ao criar migration"
    }
}

# Exibir ajuda
function Show-Help {
    @"
Supabase Migrations Manager

Uso: .\supabase-migrate.ps1 -Command [COMANDO]

Comandos:
    list        - Lista todas as migrations locais
    status      - Verifica o status das migrations no Supabase
    push        - Envia todas as migrations para o Supabase
    new         - Cria uma nova migration (use: -Name nome_da_migration)
    help        - Exibe esta mensagem

Exemplos:
    .\supabase-migrate.ps1 -Command list
    .\supabase-migrate.ps1 -Command new -Name create_users_table
    .\supabase-migrate.ps1 -Command push

Variáveis de Ambiente Necessárias:
    SUPABASE_PROJECT_ID    - ID do projeto Supabase
    SUPABASE_ACCESS_TOKEN  - Token de acesso (para push automático)

"@
}

# Executar comando
switch ($Command) {
    'list' {
        List-Migrations
    }
    'status' {
        Get-MigrationStatus
    }
    'push' {
        Push-Migrations
    }
    'new' {
        New-Migration -MigrationName $Name
    }
    'help' {
        Show-Help
    }
}
