# Book Club Application

En web-basert bokklubb-applikasjon for å administrere og dele boksamlinger. Applikasjonen lar deg søke etter bøker ved hjelp av Google Books API, legge til bøker i samlingen og se detaljert informasjon om hver bok.

## Funksjoner

- Bla gjennom boksamlingen i et responsivt rutenett
- Søk etter bøker med Google Books API-integrasjon
- Se detaljert bokinformasjon inkludert omslag, forfatter og beskrivelse
- Legg til nye bøker i samlingen
- Mobilvennlig responsivt design

## Lokal Utviklingsoppsett

### Forutsetninger

- Node.js (Siste LTS-versjon anbefales)
- npm (følger med Node.js)

### Installasjon

1. Klon repositoriet:
```bash
git clone <repository-url>
cd book-1
```

2. Installer avhengigheter:
```bash
npm install
```

### Kjør Lokalt

1. Start utviklingsserveren:
```bash
npm start
```

2. Åpne nettleseren din og naviger til:
```
http://localhost:3000
```

### Prosjektstruktur

```
├── assets/         # Bokomslag og andre medier
├── css/           # Stilark
│   ├── app.css    # Hoved-applikasjonsstiler
│   ├── book.css   # Bokspesifikke stiler
│   └── search.css # Søkefunksjonalitetsstiler
├── js/            # JavaScript-filer
│   ├── app.js     # Hoved-applikasjonslogikk
│   ├── book.js    # Bokinformasjonshåndtering
│   └── search.js  # Søkefunksjonalitet
└── netlify/       # Netlify serverless-funksjoner
```

## API-Integrasjon

Applikasjonen bruker Google Books API for boksøkfunksjonalitet. Søket er implementert i `js/search.js` og gir søkeresultater i sanntid mens brukeren skriver.

## Distribusjon

Applikasjonen er konfigurert for distribusjon på Netlify med serverless-funksjoner som håndterer backend-operasjoner. `netlify.toml`-filen inneholder de nødvendige distribusjonskonfigurasjonene.

## Bidra

1. Fork repositoriet
2. Opprett din feature branch (`git checkout -b feature/FantastiskFunksjon`)
3. Commit endringene dine (`git commit -m 'Legg til FantastiskFunksjon'`)
4. Push til branchen (`git push origin feature/FantastiskFunksjon`)
5. Åpne en Pull Request