import os
import unicodedata

def converter_nomes_arquivos(diretorio):
    """
    Converte os nomes de todos os arquivos em um diretório:
    1. Coloca o nome em letras maiúsculas.
    2. Troca espaços por underscores.
    3. Remove acentos.

    Args:
        diretorio (str): O caminho para o diretório que contém os arquivos.
    """
    try:
        arquivos = os.listdir(diretorio)
    except FileNotFoundError:
        print(f"Erro: O diretório '{diretorio}' não foi encontrado.")
        return

    for nome_antigo in arquivos:
        # Pular diretórios, focar apenas em arquivos
        if os.path.isdir(os.path.join(diretorio, nome_antigo)):
            continue
        
        # 1. Remover acentos
        nfkd_form = unicodedata.normalize('NFKD', nome_antigo)
        nome_sem_acento = "".join([c for c in nfkd_form if not unicodedata.combining(c)])

        # 2. Colocar em maiúsculas
        nome_maiusculo = nome_sem_acento.upper()

        # 3. Trocar espaços por underscores
        nome_novo = nome_maiusculo.replace(" ", "_")
        
        # Manter a extensão do arquivo
        nome_base, extensao = os.path.splitext(nome_novo)
        nome_novo_final = nome_base + extensao.upper()
        
        caminho_antigo = os.path.join(diretorio, nome_antigo)
        caminho_novo = os.path.join(diretorio, nome_novo_final)

        # Renomear o arquivo
        if caminho_antigo != caminho_novo:
            try:
                os.rename(caminho_antigo, caminho_novo)
                print(f"Renomeado: '{nome_antigo}' -> '{nome_novo_final}'")
            except Exception as e:
                print(f"Não foi possível renomear o arquivo '{nome_antigo}'. Erro: {e}")

# Exemplo de uso:
# Altere 'meu_diretorio_com_arquivos' para o caminho do seu diretório.
# Para o diretório atual, você pode usar '.'
converter_nomes_arquivos(r'C:\Users\danie\Documents\GitHub\Crafter\imgs\drakantos\characters')
converter_nomes_arquivos(r'C:\Users\danie\Documents\GitHub\Crafter\imgs\drakantos\orbs')
converter_nomes_arquivos(r'C:\Users\danie\Documents\GitHub\Crafter\imgs\drakantos\trophies')