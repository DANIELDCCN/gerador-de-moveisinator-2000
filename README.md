# Oficina Clara

Gerador de projeto de **gaveteiro em MDF**. A pessoa informa as medidas de fora, a espessura, o número de gavetas, o roda-pé e a corrediça. O programa devolve peças com medida, plano de corte nas chapas, lista de materiais, passo a passo de montagem, uma vista explodida e um PDF.

A conta é determinística e roda no navegador. A mesma entrada produz sempre o mesmo projeto. Nenhum modelo de IA calcula milímetro. A leitura de foto está preparada, mas **desligada** nesta versão.

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

O build é estático. O `base` do Vite está em `./`, então os arquivos funcionam na raiz de um site.

1. No repositório, em **Settings → Pages**, escolha **GitHub Actions** como fonte.
2. O workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) roda os testes, gera `dist/` e publica a cada push na branch `main`.
3. Se o site ficar num subcaminho (por exemplo `https://usuario.github.io/nome-do-repo/`) e algum arquivo não carregar, troque `base` em `vite.config.ts` para `"/nome-do-repo/"` e publique de novo.

Dá para publicar a pasta `dist/` em qualquer host estático. Não há variável de ambiente obrigatória.

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

1. **Visão (próxima etapa).** A pessoa manda uma foto. Um modelo (por exemplo Gemini, via um proxy pequeno e uma chave digitada na hora) só sugere altura, largura, profundidade e número de gavetas. A pessoa confirma. O motor continua sendo o único a calcular. O contrato está em `src/vision/gemini.ts`. Não há chave no repositório. Na tela, o botão responde “em breve”.
2. **Mais móveis.** Estante, armário, bancada. Cada tipo ganha o próprio módulo puro, no mesmo estilo de `src/domain/gaveteiro.ts`.
3. **Fase 2, outros materiais.** Metal e madeira maciça, com regras próprias de junta, folga e borda. O MDF continua o caminho já testado.
4. **Empacotar com Capacitor** para publicar na Play Store, reaproveitando este front estático. Não faz parte deste MVP.

## Licença

MIT. Veja [LICENSE](LICENSE).
