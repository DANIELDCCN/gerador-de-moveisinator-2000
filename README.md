# Oficina Clara

Gerador de projeto de **gaveteiro em MDF**. A pessoa informa as medidas de fora, a espessura, o número de gavetas, o roda-pé e a corrediça. O programa devolve peças com medida, plano de corte nas chapas, lista de materiais, passo a passo de montagem, uma vista explodida e um PDF.

A conta é determinística e roda no navegador. A mesma entrada produz sempre o mesmo projeto. Nenhum modelo de IA calcula milímetro: a foto, quando você pede, estima tipo, gavetas e proporção, e o programa converte a proporção em milímetro usando uma medida que já estava no formulário.

Feito para Daniel Carvalho, com interface em português (pt-BR), alto contraste e sem usar cor como única informação. O tipo é [Atkinson Hyperlegible](https://brailleinstitute.org/freefont). Padrões, rótulos e texto marcam o que cada peça é.

## O que o exemplo gera

Cômoda de 900 × 600 × 450 mm, 4 gavetas, MDF 15 mm, traseiro de 3 mm, roda-pé de 80 mm. O formulário já abre com esses números.

Sistema construtivo desta versão:

- laterais inteiras, do piso ao topo
- tampo e base entram entre as laterais
- painel traseiro fino, pregado por trás
- frentes embutidas, com folga em volta
- caixa da gaveta com laterais no comprimento da corrediça
- fundo da gaveta na mesma chapa fina do traseiro

## Como rodar

Requisitos: Node.js 20 ou mais novo.

```bash
npm install
npm test
npm run dev
```

Abra [http://127.0.0.1:4179](http://127.0.0.1:4179).

Outros comandos:

```bash
npm run build    # gera a pasta dist/
npm run preview  # serve o build em http://127.0.0.1:4179
npm run lint
```

Nada do formulário sai do navegador. Não há servidor de aplicação.

## Como publicar no GitHub Pages

O site público fica em [https://danieldccn.github.io/gerador-de-moveisinator-2000/](https://danieldccn.github.io/gerador-de-moveisinator-2000/), no repositório `DANIELDCCN/gerador-de-moveisinator-2000`.

O `base` do Vite, o `start_url` e o `scope` do PWA já estão em `/gerador-de-moveisinator-2000/`. O service worker é gerado nesse mesmo caminho.

1. O repositório precisa ser público e estar vazio, ou já ter esta branch `main`.
2. Em **Settings → Pages → Build and deployment → Source**, escolha **GitHub Actions**.
3. Cada push na branch `main` dispara [`.github/workflows/pages.yml`](.github/workflows/pages.yml): testes, `npm run build` e publicação com `actions/deploy-pages`.

Não há variável de ambiente obrigatória. Para ver o build deste subcaminho na sua máquina:

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4181 --strictPort
```

Abra [http://127.0.0.1:4181/gerador-de-moveisinator-2000/](http://127.0.0.1:4181/gerador-de-moveisinator-2000/). A raiz sem esse caminho não é o site.

## Onde mudar os valores de referência

Tudo que um marceneiro precisa conferir está em [`src/config/carpentry.ts`](src/config/carpentry.ts). Cada item tem o comentário `[CONFIRMAR]`.

Ali ficam, entre outros:

- folga da corrediça por lado (12,5 mm)
- folga entre frentes (3 mm)
- desconto de altura da caixa da gaveta (20 mm)
- recuo e altura do roda-pé
- parafusos por junta, por gaveta e por puxador
- arruelas, cola, perda da fita de borda
- kerf, margem e tamanho da chapa (2750 × 1850 mm)
- comprimentos comerciais de corrediça

A tela repete essa lista no fim do formulário e avisa que os padrões ainda precisam de validação. Folga da corrediça, folga das frentes, kerf, margem e tamanho da chapa também podem ser alterados num projeto só, em **Ajustes de oficina**, sem mexer no arquivo.

Não espalhe número de marcenaria pelo resto do código. O motor só lê esse arquivo.

## Testes

```bash
npm test
```

O exemplo 900 × 600 × 450 mm trava as deduções (espessura, folga, corrediça de 400 mm). O plano de corte é conferido para não sobrepor peças, respeitar o kerf e não misturar espessuras. Também há teste de giro de peça, de chapa extra e do PDF.

## Acessibilidade

- texto grande, contraste preto sobre papel claro
- foco com contorno grosso
- “Selecionado”, “Erro” e “Atenção” escritos, não só pintados
- peças do corte e da vista 3D distinguíveis por padrão e por código
- tabelas que viram fichas no celular

## Roteiro

1. **Visão, ligada.** A pessoa cola a própria chave do Gemini. Ela fica só no navegador (`localStorage`) e a foto vai direto para `gemini-3.5-flash-lite` no Google. A resposta traz tipo, gavetas, portas, proporção e confiança. Uma leitura bem-sucedida entra na hora no formulário e substitui o exemplo ou o que já estava digitado nos campos que a foto consegue inferir. Cada campo continua editável; o que a pessoa alterar depois permanece, até uma nova análise. O campo leva a marca “da foto”, e “desfazer análise da foto” devolve os valores anteriores. Não há chave no repositório.
2. **Mais móveis.** Estante, armário, bancada. Cada tipo ganha o próprio módulo puro, no mesmo estilo de `src/domain/gaveteiro.ts`.
3. **Fase 2, outros materiais.** Metal e madeira maciça, com regras próprias de junta, folga e borda. O MDF continua o caminho já testado.
4. **Empacotar com Capacitor** para publicar na Play Store, reaproveitando este front estático. Não faz parte deste MVP.

## Licença

MIT. Veja [LICENSE](LICENSE).
