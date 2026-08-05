export interface FaixaHoraria {
  hora: number;
  percentualInformado: number;
}

export const DISTRIBUICAO_HORARIA: FaixaHoraria[] = [
  { hora: 8, percentualInformado: 7.78 },
  { hora: 9, percentualInformado: 9.11 },
  { hora: 10, percentualInformado: 10.06 },
  { hora: 11, percentualInformado: 9.37 },
  { hora: 12, percentualInformado: 4.75 },
  { hora: 13, percentualInformado: 8.02 },
  { hora: 14, percentualInformado: 10.51 },
  { hora: 15, percentualInformado: 9.22 },
  { hora: 16, percentualInformado: 8.25 },
  { hora: 17, percentualInformado: 7.33 },
  { hora: 18, percentualInformado: 2.23 },
  { hora: 19, percentualInformado: 1.39 },
];

export const PERCENTUAL_INFORMADO = DISTRIBUICAO_HORARIA.reduce(
  (soma, faixa) => soma + faixa.percentualInformado,
  0,
);
