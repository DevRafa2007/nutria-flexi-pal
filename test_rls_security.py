"""
Script de Teste: Row Level Security (RLS)
==========================================

Este script testa se a correção de RLS está funcionando.

ANTES da migration: deve mostrar TODOS os perfis (vulnerabilidade)
DEPOIS da migration: deve mostrar VAZIO (seguro)

Execute este script ANTES e DEPOIS de aplicar a migration para verificar.
"""

import requests
import json

# Suas credenciais do Supabase
SUPABASE_URL = "https://zeovlkmweekxcgepyicu.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inplb3Zsa213ZWVreGNnZXB5aWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MDAwODMsImV4cCI6MjA3ODM3NjA4M30.Te-sUCV71KuX_xFonDjDX4mo_n4JH6DV0Xe5WNxItKo"

HEADERS = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json"
}


def testar_rls_profiles():
    """
    Tenta acessar a tabela profiles com a chave anônima.
    
    Resultado esperado DEPOIS da correção:
    - Status 200, mas array VAZIO []
    - Ou erro 401/403 (ainda melhor)
    """
    print("=" * 60)
    print("TESTE: Acesso à tabela PROFILES com chave anônima")
    print("=" * 60)
    
    url = f"{SUPABASE_URL}/rest/v1/profiles"
    
    try:
        response = requests.get(url, headers=HEADERS)
        
        print(f"\n✓ Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Número de perfis retornados: {len(data)}")
            
            if len(data) == 0:
                print("\n🎉 SEGURO! Nenhum perfil foi retornado.")
                print("   A política RLS está funcionando corretamente!")
                return True
            else:
                print("\n⚠️  VULNERÁVEL! Perfis foram retornados:")
                print(json.dumps(data, indent=2))
                print("\n   ❌ Aplique a migration urgentemente!")
                return False
        
        elif response.status_code in [401, 403]:
            print("\n🎉 SEGURO! Acesso negado (401/403).")
            print("   A política RLS está funcionando perfeitamente!")
            return True
        
        else:
            print(f"\n❓ Resposta inesperada: {response.text}")
            return False
            
    except Exception as e:
        print(f"\n❌ Erro na requisição: {e}")
        return False


def testar_rls_meals():
    """Testa se meals também está protegida"""
    print("\n" + "=" * 60)
    print("TESTE: Acesso à tabela MEALS com chave anônima")
    print("=" * 60)
    
    url = f"{SUPABASE_URL}/rest/v1/meals"
    
    try:
        response = requests.get(url, headers=HEADERS)
        print(f"\n✓ Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Número de refeições retornadas: {len(data)}")
            
            if len(data) == 0:
                print("🎉 SEGURO! Tabela meals protegida.")
            else:
                print("⚠️  VULNERÁVEL! Refeições expostas.")
        else:
            print("🎉 SEGURO! Acesso negado.")
            
    except Exception as e:
        print(f"❌ Erro: {e}")


if __name__ == "__main__":
    print("\n" + "🔐" * 30)
    print("TESTE DE SEGURANÇA: Row Level Security (RLS)")
    print("🔐" * 30)
    
    resultado_profiles = testar_rls_profiles()
    testar_rls_meals()
    
    print("\n" + "=" * 60)
    print("RESUMO")
    print("=" * 60)
    
    if resultado_profiles:
        print("✅ Banco de dados SEGURO!")
        print("   Os dados dos usuários estão protegidos.")
    else:
        print("❌ Banco de dados VULNERÁVEL!")
        print("   AÇÃO NECESSÁRIA: Aplique a migration 0011_fix_profiles_rls.sql")
        print("   1. Abra Supabase Dashboard > SQL Editor")
        print("   2. Cole o conteúdo da migration")
        print("   3. Execute")
        print("   4. Execute este script novamente para verificar")
    
    print("=" * 60)
