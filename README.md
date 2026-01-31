# Abitare Holding

Sito istituzionale di Abitare Holding - Il futuro dell'abitare, oggi.

## Stack

- **Framework:** Astro
- **Styling:** Tailwind CSS
- **Hosting:** Hostinger

## Branches

| Branch | Descrizione |
|--------|-------------|
| `main` | Codice sorgente (Astro, componenti, assets) |
| `deploy` | Build compilato (solo HTML/CSS/JS statico) |

## Sviluppo locale

```bash
# Installa dipendenze
npm install

# Avvia server di sviluppo
npm run dev

# Genera build di produzione
npm run build

# Anteprima del build
npm run preview
```

Il server di sviluppo avvia su `http://localhost:4321`

## Deploy su Hostinger

Il sito e hostato su Hostinger tramite Git deployment.

### Configurazione Hostinger

- **Repository:** `https://github.com/Pedrocorgnati/abitare-holding.git`
- **Branch:** `deploy`
- **Directory:** `/` (public_html)
- **Auto Deployment:** Attivo

### Processo di deploy

1. Fai le modifiche nel branch `main`
2. Esegui il build:
```bash
npm run build
```

3. Aggiorna il branch `deploy` con i file compilati:
```bash
git checkout deploy
rm -rf _astro images videos *.html *.xml robots.txt .htaccess
cp -r dist/* .
cp dist/.htaccess . 2>/dev/null
git add .
git commit -m "Deploy: descrizione delle modifiche"
git push origin deploy
git checkout main
```

4. Il deploy automatico su Hostinger verra attivato

### Deploy manuale (alternativa)

Se l'auto deployment non funziona:
1. Vai su Hostinger → Advanced → Git
2. Clicca su **Deploy** nel repository configurato

## Struttura del progetto

```
src/
├── components/
│   ├── layout/      # Header, Footer, Navigation
│   ├── sections/    # Hero, ChiSiamo, Aziende, etc.
│   ├── seo/         # SEO, Analytics, StructuredData
│   └── ui/          # Button, Card, Input
├── layouts/         # BaseLayout, LegalLayout
├── lib/             # constants, utils
├── pages/           # index, privacy, cookie
├── scripts/         # analytics, contact-form
└── styles/          # base.css, design-tokens.css
```

## URL

- **Produzione:** https://abitareholding.it
- **Repository:** https://github.com/Pedrocorgnati/abitare-holding

## Aziende del gruppo

- [Immobilitalia](https://www.immobilitaliaonline.it)
- [Servizi per Casa](https://servizipercasa.it)
- [Dove Abitare Bene](https://doveabitarebene.it)
