/**
 * Secao 6 — planilha de acompanhamento.
 *
 * Artefato EXCLUSIVAMENTE impresso: nao ha versao em tela para preenchimento,
 * nao calcula nada, nao persiste nada. Sai em branco, para imprimir e fixar no
 * leito. A hora e preenchida a mao.
 *
 * Gerada por impressao nativa do navegador (`window.print`), sem biblioteca de
 * PDF — decisao do Gustavo. No iPhone, o Safari oferece "Salvar em Arquivos"
 * como PDF na propria caixa de impressao.
 */

const COLUNAS = [
  { label: 'Hora', grupo: '' },
  { label: 'Glicemia', grupo: 'Laboratório' },
  { label: 'K', grupo: 'Laboratório' },
  { label: 'Na', grupo: 'Laboratório' },
  { label: 'Cl', grupo: 'Laboratório' },
  { label: 'HCO₃', grupo: 'Laboratório' },
  { label: 'pH venoso', grupo: 'Laboratório' },
  { label: 'Fósforo', grupo: 'Laboratório' },
  { label: 'Creatinina', grupo: 'Laboratório' },
  { label: 'PA', grupo: 'Clínico' },
  { label: 'FC', grupo: 'Clínico' },
  { label: 'Diurese (mL/h)', grupo: 'Clínico' },
  { label: 'Nível de consciência', grupo: 'Clínico' },
  { label: 'Balanço acumulado', grupo: 'Clínico' },
  { label: 'Insulina — vazão (mL/h)', grupo: 'Conduta' },
  { label: 'Insulina — volume infundido (mL)', grupo: 'Conduta' },
  { label: 'Fluido — tipo e volume', grupo: 'Conduta' },
  { label: 'KCl reposto', grupo: 'Conduta' },
  { label: 'Dextrose (sim/não, %)', grupo: 'Conduta' },
]

const LINHAS = 12

export function KetoPlanilha() {
  return (
    <>
      <p className="text-sm text-text-secondary leading-relaxed mb-3">
        Formulário em branco para impressão e fixação no leito. Não preenche, não calcula e não guarda
        nada — a hora é anotada à mão.
      </p>
      <button
        onClick={() => window.print()}
        className="w-full min-h-[52px] rounded-xl border border-accent bg-accent text-white text-base font-semibold cursor-pointer active:opacity-80 transition-opacity"
      >
        Imprimir planilha
      </button>
      <p className="text-xs text-text-muted leading-relaxed mt-2">
        Escolha <strong className="text-text-secondary">paisagem</strong> na caixa de impressão — são 19
        colunas. No iPhone, a mesma caixa oferece "Salvar em Arquivos" para gerar o PDF.
      </p>

      {/* Só existe na impressão. Fora dela, `display: none` pelo CSS. */}
      <div className="keto-planilha-impressa" aria-hidden="true">
        <h1>KetoPath — Planilha de acompanhamento</h1>
        <div className="keto-planilha-cabecalho">
          <span>Nome do paciente: ______________________________________</span>
          <span>Registro: ______________</span>
          <span>Peso: ________ kg</span>
          <span>Data: ____ / ____ / ______</span>
          <span>Diagnóstico: ( ) CAD&nbsp;&nbsp;( ) EHH&nbsp;&nbsp;( ) Misto</span>
        </div>
        <table>
          <thead>
            <tr>
              {COLUNAS.map(c => (
                <th key={c.label}>
                  {/* O span e o que gira: writing-mode vertical no TH nao
                      funciona de forma confiavel entre navegadores. */}
                  <span>
                    {c.label}
                    {c.grupo && <><br /><span className="keto-planilha-grupo">{c.grupo}</span></>}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: LINHAS }, (_, i) => (
              <tr key={i}>
                {COLUNAS.map(c => <td key={c.label} />)}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="keto-planilha-rodape">
          <div>Ferramenta de apoio em teste — não substitui o julgamento clínico. Confirme antes de usar.</div>
          <div>Gustavo Moreira · KetoPath — ANY App</div>
        </div>
      </div>
    </>
  )
}
