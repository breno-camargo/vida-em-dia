import { useState } from 'react'
import { Info, Share2 } from 'lucide-react'

export function GuiaInstalacao({ instalado }: { instalado: boolean }) {
  const [plataforma, setPlataforma] = useState<'iphone' | 'android'>('iphone')
  return <section className="painel instalar-guia">
    <h2>Instalar o aplicativo</h2>
    <p className="nota-resumo">{instalado ? 'Você já abriu o app instalado. A ajuda continua disponível para instalar em outro aparelho.' : 'Tenha o Vida em Dia na Tela de Início do celular.'}</p>
    <div className="alternador-seletor" aria-label="Celular para instalação">
      <button type="button" aria-pressed={plataforma === 'iphone'} onClick={() => setPlataforma('iphone')}>iPhone</button>
      <button type="button" aria-pressed={plataforma === 'android'} onClick={() => setPlataforma('android')}>Android</button>
    </div>
    {plataforma === 'iphone' ? <ol className="instalar-passos">
      <li><span className="passo-numero">1</span><div><strong>Abra no Safari</strong><small>Acesse o endereço do Vida em Dia no Safari.</small></div></li>
      <li><span className="passo-numero">2</span><div><strong>Toque em Compartilhar</strong><small>Procure o ícone <Share2 size={14} aria-label="Compartilhar" /> no menu ou na barra do Safari.</small></div></li>
      <li><span className="passo-numero">3</span><div><strong>Adicionar à Tela de Início</strong><small>Se aparecer, ative Abrir como App da Web. Toque em Adicionar e abra pelo novo ícone.</small></div></li>
    </ol> : <ol className="instalar-passos">
      <li><span className="passo-numero">1</span><div><strong>Abra no Chrome</strong><small>Acesse o endereço do Vida em Dia no Chrome do Android.</small></div></li>
      <li><span className="passo-numero">2</span><div><strong>Abra o menu de três pontos</strong><small>Procure Instalar e criar atalho, Instalar aplicativo ou Adicionar à tela inicial. O nome varia conforme a versão.</small></div></li>
      <li><span className="passo-numero">3</span><div><strong>Confirme a instalação</strong><small>Toque em Instalar ou Adicionar e siga as instruções. Depois, abra pelo ícone do Vida em Dia.</small></div></li>
    </ol>}
    <p className="nota-resumo">Abriu pelo WhatsApp, Instagram ou outro aplicativo? Use o menu para abrir no Safari ou no Chrome e siga os passos acima.</p>
    <p className="aparelho-nota"><Info size={18} aria-hidden="true" /><span>Antes de trocar de navegador ou reinstalar, faça um backup ou sincronize sua conta. O navegador e o app instalado podem usar armazenamentos separados.</span></p>
    <a href={plataforma === 'iphone' ? 'https://support.apple.com/pt-br/guide/iphone/iphea86e5236/ios' : 'https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid&hl=pt-BR'} target="_blank" rel="noreferrer">Ver ajuda oficial de {plataforma === 'iphone' ? 'Apple' : 'Google'}</a>
  </section>
}
