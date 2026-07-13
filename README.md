# mentor-app
Aplicativo de produtividade pessoal com sincronização opcional via Google Drive, mantendo o usuário como único proprietário dos seus dados.

SINCRONIZAÇÃO DO MENTOR COM O GOOGLE DRIVE

O Mentor armazena seus dados (tarefas, hábitos, listas e configurações) localmente no dispositivo para funcionar mesmo sem conexão com a internet. Opcionalmente, você pode sincronizar esses dados com sua própria conta do Google Drive, mantendo você como único proprietário das suas informações.

Os dados são armazenados em um arquivo exclusivo do aplicativo dentro da área appData do Google Drive. Esse arquivo não aparece na sua lista de arquivos do Drive e só pode ser acessado pelo próprio Mentor mediante sua autorização.

Configurando o Google Drive (feito apenas uma vez)
1. Criar um projeto no Google Cloud

Acesse o Google Cloud Console e crie um novo projeto (ou utilize um existente).

Nome sugerido:

Mentor App

2. Configurar a tela de consentimento OAuth

No menu APIs e Serviços → Tela de consentimento OAuth:

Tipo de usuário: Externo.
Informe o nome do aplicativo (Mentor), e-mail de suporte e e-mail do desenvolvedor.
Não é necessário adicionar escopos manualmente.
Em Usuários de teste, adicione sua própria conta Google.
Salve a configuração.

Durante o desenvolvimento, o aplicativo pode permanecer em modo de teste. Nesse caso, ao realizar o login, o Google exibirá um aviso de "Aplicativo não verificado". Basta selecionar Avançado e continuar.

3. Ativar a Google Drive API

Em APIs e Serviços → Biblioteca, procure por Google Drive API e clique em Ativar.

4. Criar um OAuth Client ID

Em APIs e Serviços → Credenciais:

Clique em Criar credenciais.
Selecione ID do cliente OAuth.
Escolha o tipo de aplicativo correspondente à plataforma utilizada (Web, Desktop ou Android).
Salve a configuração.

Ao finalizar, será gerado um Client ID, que termina com:

.apps.googleusercontent.com

5. Configurar o aplicativo

No Mentor:

Acesse Configurações.
Cole o Client ID.
Clique em Conectar ao Google Drive.
Faça login com sua conta Google e autorize o acesso.

O aplicativo solicitará apenas a permissão necessária para criar e atualizar os próprios arquivos utilizados na sincronização.

Sincronização

Após conectar sua conta, você poderá:

sincronizar automaticamente todas as alterações;
enviar manualmente os dados para o Google Drive;
recuperar os dados armazenados no Drive.

Assim, é possível utilizar o Mentor em diferentes dispositivos mantendo suas informações sincronizadas.

Funcionamento offline

Mesmo sem conexão com a internet, o Mentor continua funcionando normalmente utilizando o banco de dados local. Quando houver conexão, basta realizar a sincronização para atualizar os demais dispositivos.

Observações

Por motivos de segurança, o login do Google pode expirar após algum tempo. Nesses casos, basta realizar a autenticação novamente. Seus dados permanecem armazenados tanto localmente quanto na sua conta do Google Drive.

Caso ocorram alterações no mesmo conjunto de dados em dispositivos diferentes antes da sincronização, prevalecerá a versão enviada por último ao Google Drive. Esta é uma estratégia simples e adequada para uso pessoal.
