import { describe, expect, it } from 'vitest'
import { etichettaGiorno, orarioMessaggio, passata, prossimiGiorni } from '../lib/date'
import { iniziali } from '../components/Avatar'
import { messaggioDb } from '../lib/errori'
import { idaVisibile, leggiVoti, livelloDi, punteggioDa } from '../lib/ida'
import {
  adessoARoma,
  codiceFiscaleValido,
  etaDa,
  haContatti,
  haIndirizzo,
  haTelefonoOEmail,
  leggiDatiFiscali,
  leggiPost,
  leggiPrenotazione,
  leggiScheda,
  leggiSegnalazione,
  orarioPrenotabile,
  nomeValido,
  partitaIvaValida,
  pulisci,
} from '../lib/validazione'
import { distanza, ordina } from '../lib/zone'

const form = (campi: Record<string, string | string[]>) => {
  const f = new FormData()
  for (const [k, v] of Object.entries(campi)) for (const x of [v].flat()) f.append(k, x)
  return f
}

// 10 ottobre 2026, ore 12:00 a Roma (10:00 UTC)
const ADESSO = new Date('2026-10-10T10:00:00Z')

describe('dati fiscali', () => {
  it('codice fiscale: controlla il carattere finale', () => {
    expect(codiceFiscaleValido('RSSMRA80A01D704D')).toBe(true)
    expect(codiceFiscaleValido('rssmra80a01d704d')).toBe(true)
    expect(codiceFiscaleValido('RSSMRA80A01D704Y')).toBe(false)
    expect(codiceFiscaleValido('RSSMRA80A01D704')).toBe(false)
  })

  it('partita IVA: controlla la cifra finale', () => {
    expect(partitaIvaValida('01114601006')).toBe(true)
    expect(partitaIvaValida('01114601007')).toBe(false)
    expect(partitaIvaValida('00000000000')).toBe(false)
    expect(partitaIvaValida('1234')).toBe(false)
  })

  it('età', () => {
    expect(etaDa('2008-10-10', ADESSO)).toBe(18)
    expect(etaDa('2008-10-11', ADESSO)).toBe(17)
    expect(etaDa('2030-01-01', ADESSO)).toBeNull()
    expect(etaDa('ciao', ADESSO)).toBeNull()
  })

  it('leggiDatiFiscali: minorenne rifiutato, dati validi accettati', () => {
    const base = { codice_fiscale: 'RSSMRA80A01D704D', residenza: 'Via Roma 1, Forlì', dichiarazione_fiscale: 'si', termini: 'si' }
    expect(leggiDatiFiscali(form({ ...base, data_nascita: '2010-01-01' }), ADESSO)).toMatchObject({ ok: false })
    expect(leggiDatiFiscali(form({ ...base, data_nascita: '1980-01-01' }), ADESSO)).toMatchObject({ ok: true })
    expect(leggiDatiFiscali(form({ ...base, data_nascita: '1980-01-01', termini: '' }), ADESSO)).toMatchObject({ ok: false })
  })
})

describe('scheda professionista', () => {
  const base = { tipo: 'privato', competenze: ['Montaggio mobili'], zone: ['Centro'], tariffa: '20', bio: 'Monto mobili da 10 anni' }

  it('accetta una scheda normale', () => {
    const r = leggiScheda(form(base))
    expect(r).toMatchObject({ ok: true, dati: { tipo: 'privato', partitaIva: null, tariffa: 20 } })
  })

  it('impianti solo con P.IVA e abilitazione', () => {
    expect(leggiScheda(form({ ...base, competenze: ['Idraulica'] })).ok).toBe(false)
    expect(leggiScheda(form({ ...base, tipo: 'piva', partita_iva: '01114601006', competenze: ['Idraulica'] })).ok).toBe(false)
    expect(
      leggiScheda(form({ ...base, tipo: 'piva', partita_iva: '01114601006', competenze: ['Idraulica'], abilitazione: 'si' })),
    ).toMatchObject({ ok: true, dati: { abilitazione: true } })
  })

  it('niente contatti nella presentazione, tariffa nei limiti', () => {
    expect(leggiScheda(form({ ...base, bio: 'Chiamami al 333 123 4567' })).ok).toBe(false)
    expect(leggiScheda(form({ ...base, tariffa: '500' })).ok).toBe(false)
    expect(leggiScheda(form({ ...base, zone: ['Milano'] })).ok).toBe(false)
  })
})

describe('contatti nei testi pubblici', () => {
  it.each(['chiamami 333 123 4567', 'scrivi a mario@example.com', '+39 0543 123456', 'tel 3331234567'])('trova %j', (t) => {
    expect(haTelefonoOEmail(t)).toBe(true)
  })
  it.each(['armadio 120 cm', 'costa 30 €', 'dal 12/10/2026', 'secondo piano, 2 poltrone'])('ignora %j', (t) => {
    expect(haContatti(t)).toBe(false)
  })
  it('trova un indirizzo con civico', () => {
    expect(haIndirizzo('abito in Via Emilia 15')).toBe(true)
    expect(haIndirizzo('portare via le 2 poltrone')).toBe(false)
  })
  it('leggiPost', () => {
    expect(leggiPost(form({ titolo: 'Tapparella bloccata', dettagli: '', zona: 'Centro' }))).toMatchObject({ ok: true })
    expect(leggiPost(form({ titolo: 'Tapparella', dettagli: 'chiama 3331234567', zona: 'Centro' })).ok).toBe(false)
    expect(leggiPost(form({ titolo: 'Ciao', zona: 'Centro' })).ok).toBe(false)
  })
})

describe('orari', () => {
  it('ora di Roma', () => {
    expect(adessoARoma(ADESSO)).toEqual({ giorno: '2026-10-10', minuti: 12 * 60 })
  })
  it('serve almeno un’ora di anticipo, entro 30 giorni', () => {
    expect(orarioPrenotabile('2026-10-10', '12:00', ADESSO)).toBe(false)
    expect(orarioPrenotabile('2026-10-10', '14:00', ADESSO)).toBe(true)
    expect(orarioPrenotabile('2026-10-09', '17:00', ADESSO)).toBe(false)
    expect(orarioPrenotabile('2026-11-09', '09:00', ADESSO)).toBe(true)
    expect(orarioPrenotabile('2026-11-10', '09:00', ADESSO)).toBe(false)
    expect(orarioPrenotabile('2026-10-11', '13:00', ADESSO)).toBe(false) // pausa pranzo
  })
  it('etichette dei giorni', () => {
    expect(etichettaGiorno('2026-10-10', ADESSO)).toBe('Oggi')
    expect(etichettaGiorno('2026-10-11', ADESSO)).toBe('Domani')
    expect(etichettaGiorno('2026-10-09', ADESSO)).toBe('Ieri')
    expect(prossimiGiorni(3, ADESSO).map((g) => g.iso)).toEqual(['2026-10-10', '2026-10-11', '2026-10-12'])
  })
  it('passata', () => {
    expect(passata('2026-10-10', '11:00:00', ADESSO)).toBe(true)
    expect(passata('2026-10-10', '14:00:00', ADESSO)).toBe(false)
  })
  it('leggiPrenotazione', () => {
    const base = {
      competenza: 'Montaggio mobili',
      descrizione: 'Montare un armadio a tre ante',
      indirizzo: 'Via Emilia 5, Forlì',
      zona: 'Centro',
      giorno: '2026-10-11',
      ora: '10:00',
      ore: 'non_so',
    }
    expect(leggiPrenotazione(form(base), ['Montaggio mobili'], ADESSO)).toMatchObject({ ok: true, dati: { ore: null } })
    expect(leggiPrenotazione(form({ ...base, ore: '3' }), ['Montaggio mobili'], ADESSO)).toMatchObject({ ok: true, dati: { ore: 3 } })
    expect(leggiPrenotazione(form(base), ['Pulizie'], ADESSO).ok).toBe(false)
    expect(leggiPrenotazione(form({ ...base, indirizzo: '' }), ['Montaggio mobili'], ADESSO).ok).toBe(false)
  })
})

describe('IDA', () => {
  it('punteggio da 20 a 100 con i pesi', () => {
    expect(punteggioDa({ puntualita: 5, qualita: 5, parola: 5, pulizia: 5, comunicazione: 5 })).toBe(100)
    expect(punteggioDa({ puntualita: 1, qualita: 1, parola: 1, pulizia: 1, comunicazione: 1 })).toBe(20)
    // stesso esempio verificato nel database: 97
    expect(punteggioDa({ puntualita: 5, qualita: 5, parola: 5, pulizia: 5, comunicazione: 4 })).toBe(97)
  })
  it('livello e visibilità dopo 3 giudizi', () => {
    expect(livelloDi(99, 2)).toBe('bronzo')
    expect(idaVisibile(99, 2)).toBeNull()
    expect(livelloDi(95, 3)).toBe('diamante')
    expect(livelloDi(88, 10)).toBe('oro')
    expect(livelloDi(59, 10)).toBe('ferro')
  })
  it('leggiVoti', () => {
    expect(leggiVoti(form({ puntualita: '5', qualita: '4', parola: '3', pulizia: '2', comunicazione: '1' }))).toBeTruthy()
    expect(leggiVoti(form({ puntualita: '6', qualita: '4', parola: '3', pulizia: '2', comunicazione: '1' }))).toBeNull()
    expect(leggiVoti(form({ puntualita: '5' }))).toBeNull()
  })
})

describe('ordine dei risultati', () => {
  const p = (nome: string, zone: string[], tariffa: number, ida: number | null, giudizi: number) => ({ nome, zone, tariffa_oraria: tariffa, ida, giudizi })
  const lista = [p('Anna', ['Ronco'], 30, 90, 5), p('Bruno', ['Centro'], 25, null, 0), p('Carla', ['Saffi'], 15, 96, 4)]

  it('dal più vicino', () => {
    expect(distanza('Centro', ['Centro'])).toBe(0)
    expect(ordina(lista, 'Centro', 'vicini').map((x) => x.nome)[0]).toBe('Bruno')
  })
  it('per prezzo', () => {
    expect(ordina(lista, 'Centro', 'prezzo').map((x) => x.nome)).toEqual(['Carla', 'Bruno', 'Anna'])
  })
  it('per IDA: i nuovi in fondo', () => {
    expect(ordina(lista, 'Centro', 'ida').map((x) => x.nome)).toEqual(['Carla', 'Anna', 'Bruno'])
  })
})

describe('segnalazioni', () => {
  it('motivo dall’elenco, “Altro” chiede il racconto', () => {
    expect(leggiSegnalazione(form({ tipo: 'contenuto', motivo: 'Possibile truffa' })).ok).toBe(true)
    expect(leggiSegnalazione(form({ tipo: 'contenuto', motivo: 'Boh' })).ok).toBe(false)
    expect(leggiSegnalazione(form({ tipo: 'problema_lavoro', motivo: 'Altro', testo: 'corto' })).ok).toBe(false)
    expect(leggiSegnalazione(form({ tipo: 'problema_lavoro', motivo: 'Altro', testo: 'Non ha finito il lavoro concordato' })).ok).toBe(true)
  })
})

describe('numeri del pannello', () => {
  it('campi mancanti o sbagliati diventano 0, null o vuoti', async () => {
    const { leggiNumeri } = await import('../lib/numeri')
    const n = leggiNumeri({ iscritti: 5, giudizi: 'tre', prenotazioni_per_stato: { richiesta: 2, rotto: 'x' }, ida_medio: null })
    expect(n.iscritti).toBe(5)
    expect(n.giudizi).toBe(0)
    expect(n.prenotazioni_per_stato).toEqual({ richiesta: 2, rotto: 0 })
    expect(n.ida_medio).toBeNull()
    expect(leggiNumeri(null).eventi).toEqual({})
  })
})

describe('foto e collegamenti', () => {
  it('riconosce il tipo vero dai primi byte', async () => {
    const { tipoDaiByte, fotoValida } = await import('../lib/foto')
    expect(tipoDaiByte(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg')
    expect(tipoDaiByte(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]))).toBe('image/png')
    expect(tipoDaiByte(new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 '))).toBe('image/webp')
    expect(tipoDaiByte(new TextEncoder().encode('<html><script>'))).toBeNull()
    const finta = new File(['<html>ciao</html>'], 'x.jpg', { type: 'image/jpeg' })
    expect(await fotoValida(finta)).toMatch(/non sembra/)
    const vera = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])], 'x.jpg', { type: 'image/jpeg' })
    expect(await fotoValida(vera)).toBeNull()
  })
  it('accetta solo collegamenti interni', async () => {
    const { linkInterno } = await import('../lib/link')
    expect(linkInterno('/prenotazioni/3')).toBe('/prenotazioni/3')
    expect(linkInterno('//evil.example')).toBe('/')
    expect(linkInterno('/\\evil.example')).toBe('/')
    expect(linkInterno('https://evil.example')).toBe('/')
    expect(linkInterno(null, '/notifiche')).toBe('/notifiche')
    expect(linkInterno('/\t/evil.example')).toBe('/')
    expect(linkInterno('/\n/evil.example')).toBe('/')
    expect(linkInterno('/.//evil.example')).toBe('/')
    expect(linkInterno('/a/..//evil.example')).toBe('/')
    expect(linkInterno('/cerca?competenza=Pulizie#su')).toBe('/cerca?competenza=Pulizie#su')
  })
})

describe('messaggi e orari', () => {
  it('lavoro sovrapposto: frase chiara', () => {
    expect(messaggioDb({ code: 'TE409' })).toMatch(/accavalla/)
    expect(messaggioDb({ code: 'XXXXX' })).toMatch(/Riprova/)
  })
  it('orario dei messaggi sempre all’ora italiana', () => {
    const adesso = new Date('2026-10-09T10:00:00Z')
    expect(orarioMessaggio('2026-10-09T08:05:00Z', adesso)).toBe('10:05')
    expect(orarioMessaggio('2026-10-08T21:30:00Z', adesso)).toBe('Ieri, 23:30')
    expect(orarioMessaggio('2026-10-08T22:30:00Z', adesso)).toBe('00:30')
  })
})

describe('testi ingannevoli', () => {
  it('toglie i caratteri di inversione e invisibili, tiene le emoji composte', () => {
    expect(pulisci('‮Carla‬')).toBe('Carla')
    expect(pulisci(' a​b ')).toBe('ab')
    expect(pulisci('👩🏽‍🔧')).toBe('👩🏽‍🔧')
    expect(pulisci(42)).toBe('')
  })
  it('un nome deve avere almeno due lettere', () => {
    expect(nomeValido('😀😀')).toBe(false)
    expect(nomeValido('Lù')).toBe(true)
  })
  it('iniziali senza mezze emoji', () => {
    expect(iniziali('<img src=x> Carla 😀👩🏽‍🔧')).toBe('IC')
    expect(iniziali('😀')).toBe('?')
    expect(iniziali('anna d’amico')).toBe('AD')
  })
})
