import { IDA_MIN_LAVORI } from './ida'
import { VERSIONE_DOCUMENTI } from './validazione'

/* Dati legali di chi gestisce TaskEase: si compilano SOLO qui e valgono in tutti i documenti.
   Finché un campo resta tra [parentesi], i documenti mostrano l'avviso "Bozza". */
export const TITOLARE = {
  nome: '[Nome e cognome o ragione sociale]',
  piva: '[11 cifre]',
  indirizzo: '[indirizzo]',
  citta: 'Forlì (FC)',
  email: '[email di contatto]',
  telefono: '[numero]',
  whatsapp: '[numero WhatsApp]',
}
export const titolareCompleto = Object.values(TITOLARE).every((v) => !/^\[.*\]$/.test(v))

type Documento = { t: string; s: [string, string][] }

export const LEGALE: Record<string, Documento> = {
  info: {
    t: 'Informazioni legali',
    s: [
      ['Chi gestisce TaskEase', `${TITOLARE.nome} · P.IVA ${TITOLARE.piva} · Sede: ${TITOLARE.indirizzo}, ${TITOLARE.citta}.`],
      [
        'Contatti',
        `Email: ${TITOLARE.email} · Telefono/WhatsApp: ${TITOLARE.telefono}. È anche il punto di contatto per utenti e autorità previsto dal Regolamento UE sui servizi digitali (DSA). Rispondiamo in italiano.`,
      ],
      [
        'Cosa siamo',
        'Una piattaforma che mette in contatto chi cerca aiuto con chi lavora nella zona di Forlì-Cesena. Non siamo parte dell’accordo tra cliente e chi lavora e non incassiamo il prezzo del lavoro.',
      ],
      [
        'Versione dei documenti',
        `${VERSIONE_DOCUMENTI}. Le modifiche ai Termini vengono annunciate almeno 15 giorni prima; quelle alle regole dell’IDA 30 giorni prima.`,
      ],
    ],
  },
  termini: {
    t: 'Termini d’uso',
    s: [
      [
        'Cosa fa TaskEase',
        'Ti aiuta a trovare chi può fare un lavoro e a prenotarlo. L’accordo su lavoro, tempi e prezzo è tra te e chi lavora: TaskEase non lo esegue, non lo dirige e non è il datore di lavoro di nessuno.',
      ],
      ['Chi può usarla', 'Persone maggiorenni che danno dati veri. Un profilo per persona. Sei responsabile di quello che scrivi.'],
      [
        'Professionisti e privati',
        'Ogni profilo dichiara se lavora con Partita IVA o da privato in prestazione occasionale, e lo mostriamo. Con un privato non si applicano i diritti dei consumatori previsti dal diritto UE (per esempio recesso e garanzie del Codice del Consumo).',
      ],
      [
        'Impianti',
        'Lavori su impianti elettrici, gas, idrico-sanitari e di riscaldamento li possono fare solo imprese abilitate (DM 37/2008). Chi sceglie queste categorie lo dichiara e ne risponde.',
      ],
      [
        'Prezzi e pagamenti',
        'La tariffa è decisa da chi lavora e mostrata prima della prenotazione. Paghi direttamente a fine lavoro, come vi accordate. TaskEase non incassa né trattiene niente sul lavoro.',
      ],
      [
        'Giudizi e IDA',
        'Può giudicare solo chi ha prenotato tramite TaskEase, una volta per prenotazione. Le regole di calcolo sono pubbliche nella pagina “Come verifichiamo i giudizi”. Chi riceve un giudizio può rispondere una volta.',
      ],
      [
        'Contenuti vietati e segnalazioni',
        'Vietati contenuti illegali, offensivi, falsi o con dati personali di altri. Chiunque può segnalarli con il tasto “Segnala”. Decidiamo in modo motivato e lo comunichiamo a chi ha segnalato e a chi ha pubblicato. Entrambi possono contestare la decisione, gratis, entro 6 mesi: la riesamina una persona.',
      ],
      [
        'Sospensione e chiusura',
        'Possiamo sospendere un profilo per violazioni gravi o ripetute, spiegando il motivo. Puoi cancellare il tuo profilo quando vuoi da Profilo.',
      ],
      ['Responsabilità', 'Chi esegue il lavoro ne risponde. TaskEase risponde del proprio servizio di messa in contatto, nei limiti di legge.'],
      ['Legge e foro', 'Legge italiana. Per i consumatori è competente il giudice del luogo in cui risiedono.'],
    ],
  },
  privacy: {
    t: 'Informativa privacy',
    s: [
      ['Titolare del trattamento', `${TITOLARE.nome}, ${TITOLARE.indirizzo}, ${TITOLARE.citta} · ${TITOLARE.email}.`],
      [
        'Quali dati',
        'Per tutti: nome, cellulare, zona, foto se la carichi; l’indirizzo solo quando prenoti. Chi lavora: in più competenze, tariffa, zone, data di nascita, residenza, codice fiscale, eventuale Partita IVA e le dichiarazioni su abilitazione e assicurazione. Inoltre: prenotazioni, giudizi, messaggi, richieste in bacheca, preferiti, persone bloccate, segnalazioni e la data in cui hai accettato i documenti.',
      ],
      [
        'Perché e su quale base',
        'Per far funzionare il servizio che chiedi (contratto). Per obblighi di legge: comunicazione fiscale delle piattaforme (DAC7) e gestione delle segnalazioni previste dal Regolamento UE sui servizi digitali. Per la sicurezza degli utenti, compresa la verifica dell’identità di chi lavora (legittimo interesse). Niente pubblicità e niente vendita di dati.',
      ],
      [
        'Chi li vede',
        'Pubblici per chi usa l’app: la scheda di chi lavora (nome e cognome, foto, competenze, tariffa, zone, IDA, se è privato o con P.IVA), i giudizi con nome e iniziale di chi li ha scritti, le richieste in bacheca con nome e zona. Riservati: l’indirizzo lo vede solo chi conferma il lavoro; il telefono non lo vede nessun utente; i dati fiscali solo noi e, quando dovuto, l’Agenzia delle Entrate. I fornitori tecnici (hosting nell’Unione europea e invio SMS) li trattano per nostro conto.',
      ],
      [
        'Per quanto tempo',
        'Finché il profilo è attivo. Messaggi e segnalazioni: 12 mesi dalla chiusura. Se un profilo resta inattivo 24 mesi ti avvisiamo e poi lo cancelliamo. Dopo la cancellazione togliamo i dati subito, tranne quelli che la legge ci obbliga a conservare (dati fiscali, fino a 10 anni); i giudizi che hai lasciato restano senza il tuo nome.',
      ],
      [
        'Documenti d’identità',
        'La verifica la facciamo guardando il documento di persona o in videochiamata. Non conserviamo copie: salviamo solo che la verifica è avvenuta e quando.',
      ],
      [
        'I tuoi diritti',
        'Accesso, correzione, cancellazione, portabilità (“Scarica i miei dati” in Profilo), opposizione e limitazione. Puoi fare reclamo al Garante per la protezione dei dati personali.',
      ],
      ['Cookie', 'Solo cookie tecnici necessari per restare collegato. Nessun cookie di profilazione o di statistica. Le statistiche dell’app contano solo eventi anonimi, senza sapere chi sei.'],
    ],
  },
  ranking: {
    t: 'Come ordiniamo i risultati',
    s: [
      [
        'L’ordine di partenza',
        'Dalla persona più vicina a te. La distanza si calcola dalla tua zona, non dal tuo indirizzo. Nessuno paga per comparire prima.',
      ],
      ['In home', 'Vedi le tre persone disponibili più vicine. Chi ha spento “Disponibile” lo trovi comunque in Cerca.'],
      [
        'Gli ordinamenti che scegli tu',
        'Puoi ordinare per prezzo o per IDA più alto. Ordinando per IDA, chi è nuovo e non ha ancora un IDA va in fondo. Le categorie filtrano per competenze dichiarate.',
      ],
      ['Cosa non usiamo', 'Non premiamo chi accetta più lavori o risponde più spesso, e non nascondiamo chi rifiuta.'],
    ],
  },
  giudizi: {
    t: 'Come verifichiamo i giudizi',
    s: [
      ['Chi può giudicare', 'Solo chi ha prenotato quel lavoro tramite TaskEase e dopo che chi lavora l’ha segnato come fatto: un giudizio per prenotazione.'],
      [
        'Come si calcola',
        `Cinque domande da 1 a 5: puntualità 20%, qualità 30%, parola mantenuta 20%, pulizia 15%, comunicazione 15%. Ogni giudizio vale da 20 a 100. L’IDA compare dopo ${IDA_MIN_LAVORI} lavori: gli ultimi 12 mesi contano per intero, da 12 a 24 mesi a metà, oltre non contano. Il calcolo lo fa il database: nessuno, nemmeno noi, scrive l’IDA a mano.`,
      ],
      [
        'Cosa non facciamo',
        'Non paghiamo giudizi, non li scriviamo noi e non togliamo quelli negativi. Nascondiamo solo testi illegali, offensivi o con dati personali, spiegando il motivo.',
      ],
      ['Diritto di replica', 'Chi riceve un giudizio può rispondere una volta, sotto al giudizio.'],
    ],
  },
  sicurezza: {
    t: 'Consigli di sicurezza',
    s: [
      ['Prima del lavoro', 'Concorda per iscritto in chat cosa va fatto, la tariffa e le ore stimate. Diffida di chi chiede soldi in anticipo.'],
      [
        'Durante',
        'Se puoi, non restare solo in casa con persone che non conosci la prima volta. Per i lavori su impianti chiedi la dichiarazione di conformità.',
      ],
      ['Dopo', 'Paga solo le ore reali, chiedi la ricevuta o la fattura se dovuta, e lascia il giudizio: aiuta chi verrà dopo.'],
      ['Se qualcosa va storto', 'Usa “Segnala un problema”: leggiamo ogni segnalazione. In caso di pericolo chiama il 112.'],
    ],
  },
}
