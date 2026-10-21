import { configuracaoAmbiente, servir } from '../_shared/runtime.ts'
import { servicos } from '../_shared/servicos.ts'
import { handlerExclusao } from '../_shared/handlers.ts'
const c=configuracaoAmbiente()
servir(handlerExclusao(servicos(c.url,c.anon,c.service,c.origem).api))
