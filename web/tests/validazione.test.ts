import { describe, expect, it } from 'vitest'
import {
  codiceOtpValido,
  leggiProfilo,
  mostraTelefono,
  normalizzaTelefono,
  zonaValida,
} from '../lib/validazione'

describe('normalizzaTelefono', () => {
  it.each([
    ['333 123 4567', '+393331234567'],
    ['3331234567', '+393331234567'],
    ['+39 333-123-4567', '+393331234567'],
    ['0039 333 1234567', '+393331234567'],
    ['393331234567', '+393331234567'],
    ['(+39) 345.678.901', '+39345678901'],
  ])('%s → %s', (dentro, fuori) => {
    expect(normalizzaTelefono(dentro)).toBe(fuori)
  })

  it.each([
    '',
    '0543 123456', // fisso
    '333 12',
    '+44 7700 900123', // estero
    '333 123 4567 89',
    'tre tre tre',
    '33312345a7',
  ])('rifiuta %j', (dentro) => {
    expect(normalizzaTelefono(dentro)).toBeNull()
  })
})

it('mostraTelefono', () => {
  expect(mostraTelefono('+393331234567')).toBe('+39 333 123 4567')
})

it('codiceOtpValido', () => {
  expect(codiceOtpValido('123456')).toBe(true)
  expect(codiceOtpValido(' 123456 ')).toBe(true)
  expect(codiceOtpValido('12345')).toBe(false)
  expect(codiceOtpValido('12a456')).toBe(false)
})

it('zonaValida', () => {
  expect(zonaValida('Centro')).toBe(true)
  expect(zonaValida('centro')).toBe(false)
  expect(zonaValida('Milano')).toBe(false)
})

describe('leggiProfilo', () => {
  it('pulisce il nome e accetta dati validi', () => {
    expect(leggiProfilo({ nome: '  Anna   Rossi ', zona: 'Saffi', consenso: 'si' })).toEqual({
      ok: true,
      dati: { nome: 'Anna Rossi', zona: 'Saffi' },
    })
  })

  it('rifiuta nome troppo corto', () => {
    expect(leggiProfilo({ nome: ' A ', zona: 'Saffi', consenso: 'si' }).ok).toBe(false)
  })

  it('rifiuta zona fuori elenco', () => {
    expect(leggiProfilo({ nome: 'Anna', zona: 'Roma', consenso: 'si' }).ok).toBe(false)
  })

  it('rifiuta senza consenso', () => {
    expect(leggiProfilo({ nome: 'Anna', zona: 'Saffi', consenso: null }).ok).toBe(false)
  })

  it('rifiuta valori non testuali', () => {
    expect(leggiProfilo({ nome: 42, zona: ['Saffi'], consenso: 'si' }).ok).toBe(false)
  })
})
