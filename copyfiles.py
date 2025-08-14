import os
import shutil

def copiar_arquivos_com_novo_nome(diretorio, prefixo=''):
    """
    Copia todos os arquivos de um diretório para o mesmo diretório,
    adicionando um prefixo ao nome do novo arquivo.

    Args:
        diretorio (str): O caminho para a pasta que contém os arquivos.
        prefixo (str, optional): O prefixo a ser adicionado ao nome do novo arquivo.
                                 O padrão é 'copia_'.
    """
    # Verifica se a pasta existe
    if not os.path.isdir(diretorio):
        print(f"Erro: O diretório '{diretorio}' não foi encontrado.")
        return

    # Percorre todos os arquivos e pastas no diretório
    for nome_arquivo in os.listdir(diretorio):
        caminho_original = os.path.join(diretorio, nome_arquivo)

        # Verifica se é um arquivo (e não uma pasta)
        if os.path.isfile(caminho_original):
            # Cria o novo nome do arquivo com o prefixo
            novo_digito = str(int(nome_arquivo[-7])+1)
            nome_arquivo = nome_arquivo[:-7] + novo_digito + nome_arquivo[-6:]
            novo_nome_arquivo = f"{prefixo}{nome_arquivo}"
            caminho_novo = os.path.join(diretorio, novo_nome_arquivo)

            # Copia o arquivo original para o novo caminho
            try:
                shutil.copy2(caminho_original, caminho_novo)
                print(f"Arquivo '{nome_arquivo}' copiado para '{novo_nome_arquivo}'.")
            except Exception as e:
                print(f"Erro ao copiar o arquivo '{nome_arquivo}': {e}")

# --- Como usar o script ---
# Defina o diretório onde os arquivos estão
pasta_origem = r'C:\Users\danie\Documents\GitHub\Crafter\imgs\drakantos\orbs\ARRYN' # Use o caminho correto para a sua pasta

# Chame a função para executar a cópia
copiar_arquivos_com_novo_nome(pasta_origem)