import { configuracaoStaging, servir } from '../_shared/runtime.ts'
import { servicos } from '../_shared/servicos.ts'
import { handlerPurga } from '../_shared/handlers.ts'
const c=configuracaoStaging(),s=servicos(c.url,c.anon,c.service,c.origem)
servir(handlerPurga({segredo:c.segredo,origem:c.origem,purgar:s.purgar,removerObjetos:s.removerObjetos}))
