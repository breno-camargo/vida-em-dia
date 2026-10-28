import { guiasComplementares } from './guiasComplementares'

export type GuiaExercicio = {
  preparacao: string
  passos: readonly string[]
  evite: readonly [string, string]
}

// Textos originais do app. Associacoes exatas, sem inferir variacoes por palavras.
// Referencias e limites editoriais em docs/GUIAS-EXERCICIOS.md.
export const guiasExercicios: Record<string, GuiaExercicio> = {
  'supino reto com barra': {
    preparacao: 'Use um banco reto e ajuste as travas de segurança. Apoie os pés no chão, mantenha glúteos e parte superior das costas no banco e feche as mãos ao redor da barra.',
    passos: ['Retire a barra do suporte com ajuda, se necessário, mantendo os punhos alinhados aos antebraços.', 'Abaixe a barra devagar em direção à região média do peito, com os antebraços próximos da vertical.', 'Empurre a barra para cima sem perder o apoio das costas e dos pés.', 'Ao terminar, encaixe os dois lados da barra no suporte antes de soltá-la.'],
    evite: ['Quicar a barra no peito ou levantar o quadril.', 'Treinar até não conseguir subir a barra sem proteção ou auxílio.'],
  },
  'supino reto com halteres': {
    preparacao: 'Sente no banco reto com os halteres apoiados nas coxas. Deite com controle, trazendo-os para perto do peito; apoie os pés no chão.',
    passos: ['Posicione os halteres ao lado do peito, com punhos alinhados e cotovelos abaixo das mãos.', 'Empurre os dois halteres para cima em um movimento controlado.', 'Abaixe até uma amplitude confortável, mantendo as costas apoiadas.', 'Termine trazendo os halteres com controle para uma posição segura; peça ajuda se necessário.'],
    evite: ['Bater os halteres no alto.', 'Descer além do que consegue controlar ou jogar os pesos no chão.'],
  },
  'supino inclinado com halteres': {
    preparacao: 'Use um banco com inclinação moderada e firme. Apoie os pés e as costas; posicione os halteres ao lado da parte superior do peito.',
    passos: ['Mantenha as mãos acima dos cotovelos e os punhos alinhados.', 'Empurre os halteres para cima sem deslizar no banco.', 'Retorne devagar, mantendo o movimento confortável para os ombros.', 'Repita com o mesmo apoio e controle dos dois lados.'],
    evite: ['Usar impulso ou arquear excessivamente a lombar.', 'Transformar a inclinação em uma posição quase vertical.'],
  },
  'supino na maquina': {
    preparacao: 'Ajuste o assento para que as alças fiquem aproximadamente na altura do peito. Use a amplitude e os ajustes indicados na máquina.',
    passos: ['Apoie as costas e os pés; segure as alças com os punhos alinhados.', 'Empurre as alças para a frente mantendo os ombros estáveis.', 'Retorne devagar, sem deixar a carga puxar seus braços para trás.', 'Mantenha o corpo apoiado durante todas as repetições.'],
    evite: ['Deixar o assento tão baixo que os ombros fiquem elevados.', 'Soltar a carga de uma vez ou tirar as costas do encosto.'],
  },
  'flexao de bracos': {
    preparacao: 'Apoie as mãos no chão, um pouco além da largura dos ombros, e os pés atrás. Mantenha cabeça, tronco e quadril alinhados.',
    passos: ['Firme o abdômen e distribua o apoio entre as mãos.', 'Flexione os cotovelos e aproxime o peito do chão com controle.', 'Empurre o chão para voltar à posição inicial.', 'Mantenha o alinhamento do corpo e uma respiração contínua.'],
    evite: ['Deixar a lombar afundar ou levantar demais o quadril.', 'Abrir os cotovelos totalmente para os lados.'],
  },
  'remada baixa': {
    preparacao: 'Na polia baixa, use um puxador de pegada neutra. Apoie os pés, mantenha os joelhos levemente flexionados e o tronco ereto.',
    passos: ['Segure o puxador com os braços à frente, sem arredondar as costas.', 'Puxe em direção à cintura, conduzindo os cotovelos para trás.', 'Retorne os braços lentamente, sem perder a posição do tronco.'],
    evite: ['Balançar o tronco para movimentar a carga.', 'Encolher os ombros ou puxar com os punhos dobrados.'],
  },
  'remada unilateral com halter': {
    preparacao: 'Apoie uma mão e um joelho em um banco firme. Mantenha o outro pé no chão, as costas estáveis e o halter na mão livre.',
    passos: ['Deixe o braço com o halter estendido sob o ombro.', 'Puxe o cotovelo em direção ao quadril, sem girar o tronco.', 'Abaixe o halter devagar até estender o braço.', 'Troque o lado mantendo a mesma organização dos apoios.'],
    evite: ['Rodar o tronco para levantar mais peso.', 'Arredondar as costas ou encolher o ombro.'],
  },
  'puxada frontal': {
    preparacao: 'Ajuste o apoio das coxas e segure a barra com as palmas para a frente, um pouco além da largura dos ombros.',
    passos: ['Sente com o tronco firme e uma pequena inclinação para trás.', 'Puxe a barra à frente do rosto em direção à parte superior do peito.', 'Conduza os cotovelos para baixo sem usar impulso.', 'Retorne a barra devagar, permitindo que os braços se estendam.'],
    evite: ['Puxar a barra atrás da nuca.', 'Deitar o tronco para transformar a puxada em uma remada.'],
  },
  'elevacao lateral': {
    preparacao: 'Fique em pé com um halter em cada mão, pés firmes e cotovelos levemente flexionados.',
    passos: ['Eleve os braços para os lados, ligeiramente à frente do tronco.', 'Pare aproximadamente na altura dos ombros, sem forçar a amplitude.', 'Abaixe devagar, mantendo o tronco estável.'],
    evite: ['Balançar o corpo ou dar impulso com as pernas.', 'Encolher os ombros ou virar os polegares para baixo de propósito.'],
  },
  'rosca direta com barra': {
    preparacao: 'Fique em pé com os pés firmes. Segure a barra com as palmas para a frente e mantenha os cotovelos junto ao tronco.',
    passos: ['Flexione os cotovelos para elevar a barra, mantendo os punhos alinhados.', 'Pare antes de precisar deslocar os ombros para continuar subindo.', 'Abaixe a barra lentamente até uma extensão confortável dos braços.'],
    evite: ['Balançar a lombar para iniciar a repetição.', 'Dobrar os punhos ou lançar os cotovelos para a frente.'],
  },
  'rosca alternada': {
    preparacao: 'Fique em pé com os halteres ao lado do corpo, palmas voltadas para as coxas e cotovelos próximos ao tronco.',
    passos: ['Flexione um cotovelo e gire gradualmente a palma para a frente e para cima.', 'Abaixe esse halter com controle até a posição inicial.', 'Repita com o outro braço, mantendo o tronco parado.'],
    evite: ['Usar o balanço do corpo para levantar o peso.', 'Elevar o ombro ou deixar o punho dobrar.'],
  },
  'rosca martelo': {
    preparacao: 'Fique em pé segurando os halteres com as palmas voltadas uma para a outra.',
    passos: ['Mantenha os cotovelos próximos ao corpo e flexione os braços.', 'Suba sem alterar a posição dos punhos.', 'Desça devagar, mantendo o tronco firme.'],
    evite: ['Girar as palmas para cima durante a repetição.', 'Usar impulso ou levantar os ombros.'],
  },
  'triceps na polia com corda': {
    preparacao: 'Prenda a corda na polia alta. Fique de frente para ela, com os pés firmes e os cotovelos próximos ao tronco.',
    passos: ['Segure as pontas da corda e mantenha os braços superiores estáveis.', 'Estenda os cotovelos para levar a corda em direção às coxas.', 'Retorne com controle, flexionando os cotovelos sem elevar os ombros.'],
    evite: ['Mover o tronco para empurrar a corda.', 'Abrir os cotovelos ou deixar a carga puxar seus braços para cima.'],
  },
  'triceps na polia com barra': {
    preparacao: 'Use uma barra na polia alta. Segure com as palmas para baixo, pés firmes e cotovelos junto ao corpo.',
    passos: ['Mantenha os punhos alinhados e os braços superiores parados.', 'Estenda os cotovelos para abaixar a barra.', 'Volte lentamente, sem perder a posição dos cotovelos.'],
    evite: ['Dobrar os punhos para completar a extensão.', 'Usar o peso do corpo para movimentar a barra.'],
  },
  'cadeira extensora': {
    preparacao: 'Ajuste o encosto e alinhe os joelhos ao eixo da máquina. Posicione o rolo na frente das pernas, pouco acima dos tornozelos.',
    passos: ['Mantenha quadril e costas apoiados e segure as alças.', 'Estenda os joelhos de forma controlada, dentro de uma amplitude confortável.', 'Flexione os joelhos lentamente para retornar sem bater a carga.'],
    evite: ['Levantar o quadril para ajudar a carga.', 'Dar chutes ou terminar a extensão com um impacto.'],
  },
  'mesa flexora': {
    preparacao: 'Deite de barriga para baixo na máquina. Alinhe os joelhos ao eixo e coloque o rolo atrás das pernas, acima dos calcanhares.',
    passos: ['Mantenha o quadril apoiado e segure as alças.', 'Flexione os joelhos para aproximar os calcanhares dos glúteos.', 'Retorne lentamente até a posição inicial confortável.'],
    evite: ['Levantar o quadril ou arquear a lombar.', 'Balançar as pernas ou soltar a carga na descida.'],
  },
  'cadeira flexora': {
    preparacao: 'Sente com as costas apoiadas. Alinhe os joelhos ao eixo, coloque o rolo atrás da parte baixa das pernas e ajuste o apoio das coxas.',
    passos: ['Segure as alças e mantenha o quadril no assento.', 'Flexione os joelhos para levar o rolo para baixo e para trás.', 'Retorne devagar, sem perder o apoio das coxas.'],
    evite: ['Escorregar no assento ou levantar o quadril.', 'Deixar o rolo pressionar diretamente o tendão de Aquiles.'],
  },
  'agachamento com peso corporal': {
    preparacao: 'Fique em pé com os pés em uma largura confortável, próximos da largura dos ombros, e as pontas levemente voltadas para fora.',
    passos: ['Flexione quadris e joelhos para descer, mantendo o apoio de todo o pé.', 'Deixe os joelhos acompanharem a direção dos pés.', 'Desça apenas até onde consegue manter equilíbrio e controle.', 'Empurre o chão para voltar a ficar em pé.'],
    evite: ['Deixar os calcanhares levantarem ou os joelhos cederem para dentro.', 'Forçar profundidade perdendo o controle do tronco.'],
  },
  'leg press': {
    preparacao: 'Ajuste o banco e as travas conforme o modelo. Apoie costas e quadril; coloque os pés inteiros na plataforma, em uma largura confortável.',
    passos: ['Libere a trava somente depois de sustentar a plataforma com segurança.', 'Flexione quadris e joelhos devagar, mantendo os joelhos alinhados aos pés.', 'Pare a descida antes de o quadril ou a lombar perderem o apoio.', 'Empurre a plataforma com controle e recoloque as travas antes de sair.'],
    evite: ['Descer a ponto de enrolar o quadril e tirar a lombar do encosto.', 'Estender os joelhos com um impacto ou empurrá-los com as mãos.'],
  },
  'prancha abdominal': {
    preparacao: 'Apoie os antebraços no chão com os cotovelos abaixo dos ombros e as pontas dos pés atrás.',
    passos: ['Eleve o corpo e alinhe cabeça, tronco e quadril.', 'Mantenha o abdômen firme e respire continuamente durante o tempo planejado.', 'Encerre apoiando os joelhos quando não conseguir manter o alinhamento.'],
    evite: ['Deixar a lombar afundar ou o quadril subir demais.', 'Prender a respiração para prolongar o tempo.'],
  },
  'abdominal no solo': {
    preparacao: 'Deite de barriga para cima, joelhos flexionados e pés apoiados. Cruze os braços no peito ou apoie as mãos suavemente ao lado da cabeça.',
    passos: ['Contraia o abdômen para elevar cabeça e parte superior das costas.', 'Mantenha o pescoço confortável, sem puxar a cabeça.', 'Retorne lentamente, sem precisar sentar por completo.'],
    evite: ['Puxar o pescoço com as mãos.', 'Usar impulso para levantar todo o tronco.'],
  },
  'abdominal bicicleta': {
    preparacao: 'Deite de barriga para cima, com joelhos flexionados e mãos apoiadas suavemente ao lado da cabeça.',
    passos: ['Eleve um pouco as escápulas e aproxime um joelho do tronco.', 'Gire o tronco em direção a esse joelho enquanto estende a outra perna.', 'Alterne os lados devagar, mantendo a lombar controlada.', 'Reduza a extensão da perna se perder o apoio ou o controle da lombar.'],
    evite: ['Puxar a cabeça para tocar o cotovelo no joelho.', 'Acelerar e deixar a lombar arquear a cada troca.'],
  },
}

const normalizar = (nome: string) => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ').trim()
export function guiaExercicio(nome: string): GuiaExercicio | undefined {
  return guiasExercicios[normalizar(nome)] ?? guiasComplementares[normalizar(nome)]
}
