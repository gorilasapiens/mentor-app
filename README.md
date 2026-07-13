# mentor-app
Aplicativo de produtividade pessoal com sincronização opcional via Google Drive, mantendo o usuário como único proprietário dos seus dados.

# Sincronização com o Google Drive

O **Mentor** armazena seus dados (tarefas, hábitos, listas e configurações) localmente no dispositivo para funcionar mesmo sem conexão com a internet. Opcionalmente, você pode sincronizar essas informações com sua própria conta do **Google Drive**, mantendo você como único proprietário dos seus dados.

Os dados são armazenados em um arquivo exclusivo do aplicativo dentro da pasta **appData** do Google Drive. Esse arquivo não aparece na sua lista de arquivos do Drive e só pode ser acessado pelo próprio Mentor mediante sua autorização.

---

## Configurando o Google Drive

> Esta configuração é realizada apenas uma vez.

### 1. Criar um projeto no Google Cloud

Acesse o **Google Cloud Console** e crie um novo projeto (ou utilize um existente).

**Nome sugerido:**

```text
Mentor App
```

---

### 2. Configurar a Tela de Consentimento OAuth

No menu:

```text
APIs e Serviços → Tela de consentimento OAuth
```

Configure:

* **Tipo de usuário:** Externo
* Nome do aplicativo: **Mentor**
* E-mail de suporte
* E-mail do desenvolvedor
* Não é necessário adicionar escopos manualmente
* Em **Usuários de teste**, adicione sua própria conta Google

Durante o desenvolvimento o aplicativo pode permanecer em **Modo de Teste**.

Nesse caso, o Google exibirá a mensagem **"Aplicativo não verificado"** durante o login. Basta selecionar:

```text
Avançado → Continuar
```

---

### 3. Ativar a Google Drive API

No menu:

```text
APIs e Serviços → Biblioteca
```

Pesquise por:

```text
Google Drive API
```

e clique em **Ativar**.

---

### 4. Criar um OAuth Client ID

Acesse:

```text
APIs e Serviços → Credenciais
```

Clique em:

```text
Criar credenciais
```

Escolha:

```text
ID do cliente OAuth
```

Selecione o tipo de aplicativo correspondente:

* Web
* Desktop
* Android

Ao finalizar será gerado um **Client ID**, semelhante a:

```text
123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
```

---

### 5. Configurar o Mentor

No aplicativo:

1. Abra **Configurações**.
2. Cole o **Client ID**.
3. Clique em **Conectar ao Google Drive**.
4. Faça login com sua conta Google.
5. Autorize o acesso solicitado.

O Mentor solicitará apenas a permissão necessária para criar e atualizar os arquivos utilizados pelo próprio aplicativo.

---

# Sincronização

Após conectar sua conta, você poderá:

* ✅ Sincronizar automaticamente todas as alterações.
* ✅ Enviar os dados manualmente para o Google Drive.
* ✅ Recuperar os dados armazenados no Google Drive.
* ✅ Utilizar o aplicativo em diferentes dispositivos mantendo os dados sincronizados.

---

# Funcionamento Offline

O Mentor foi desenvolvido com a filosofia **Offline First**.

Isso significa que:

* Todas as alterações são gravadas imediatamente no banco de dados local.
* O aplicativo funciona normalmente sem internet.
* Quando houver conexão disponível, basta sincronizar para atualizar os demais dispositivos.

---

# Segurança

* Os dados pertencem exclusivamente ao usuário.
* O Mentor não utiliza servidores próprios para armazenar informações.
* Os arquivos permanecem na conta Google do próprio usuário.
* Apenas o aplicativo possui acesso ao arquivo criado para sincronização.

---

# Observações

* O login do Google pode expirar após algum tempo. Nesse caso, basta autenticar-se novamente.
* Seus dados permanecem armazenados tanto localmente quanto na sua conta do Google Drive.
* Caso existam alterações conflitantes em dispositivos diferentes antes da sincronização, prevalecerá a versão sincronizada por último. Esta estratégia é adequada para uso pessoal e mantém a implementação simples e confiável.

