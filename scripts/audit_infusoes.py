#!/usr/bin/env python3
"""Audita as concentracoes declaradas das infusoes contra a aritmetica do preparo.
Uso: python3 audit_infusoes.py [caminho_index.html]  |  saida: divergencias > 1%."""
import re, sys
path = sys.argv[1] if len(sys.argv) > 1 else '/Users/bugamoreira/Projetos/any-app/v2/public/hetrinped/index.html'
src = open(path, encoding='utf-8').read()
m = re.search(r'const INFUSIONS\s*=\s*\[', src); i = m.end(); d = 1; start = i
while d:
    if src[i] == '[': d += 1
    elif src[i] == ']': d -= 1
    i += 1
body = src[start:i-1]

def num(s):                       # "12,5 mg/mL" -> 12.5 (virgula = decimal)
    return float(re.sub(r'[^\d.]', '', s.replace(',', '.')))

problemas, ok = [], 0
for mm in re.finditer(r"\{\s*id:'([^']+)'", body):
    s = mm.start(); dd = 0; j = s
    while j < len(body):
        if body[j] == '{': dd += 1
        elif body[j] == '}':
            dd -= 1
            if dd == 0: break
        j += 1
    chunk = body[s:j+1]
    nome = re.search(r"name:'([^']+)'", chunk).group(1)
    pres = re.search(r"presentation:'([^']+)'", chunk).group(1)
    unit = re.search(r"unit:'([^']+)'", chunk).group(1)
    amp = num(pres.split('/')[0])
    fator = 1000 if (('mcg' in unit and 'mg/mL' in pres) or ('mU/' in unit and 'U/mL' in pres)) else 1
    for faixa in ('small', 'medium', 'large'):
        f = re.search(faixa + r':\{drug:([\d.]+),diluent:([\d.]+),conc:([\d.]+),vol:([\d.]+)\}', chunk)
        if not f: continue
        drug, dil, conc, vol = map(float, f.groups())
        conc_calc = (drug * amp * fator) / vol
        erro_vol = abs((drug + dil) - vol) > 0.01
        erro_conc = abs(conc_calc - conc) / conc > 0.01
        if erro_vol or erro_conc:
            problemas.append(f"{nome:16s} {faixa:6s} amp={pres:14s} vol {drug:g}+{dil:g}={drug+dil:g} (decl {vol:g}) | conc calc {conc_calc:.1f} vs decl {conc:g}")
        else:
            ok += 1
print(f"Apresentacoes: {ok+len(problemas)} | OK: {ok} | divergentes: {len(problemas)}")
for p in problemas: print("  !", p)
sys.exit(1 if problemas else 0)
