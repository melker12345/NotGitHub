1. Introduktion
Detta examensarbete har genomförts enskilt för att maximera inlärningspotentialen. Under perioden valde jag att fördjupa mina kunskaper om Git, GitHub, SSH och programmeringsspråket Golang genom att skapa en klon av GitHub, vilket innebar att jag behövde en god förståelse för hur Git fungerar.

1.1 Versionshanteringsverktyg
Tack vare Linus Torvalds verktyg Git är versionshantering sällan ett problem för nya utvecklare idag, eftersom många adop­terar Git utan att reflektera över hur komplicerat det hade varit att hantera olika kodversioner utan ett verktyg som Git. Men hur fungerar Git egentligen?

Ett versionshanteringsverktyg låter användaren spara kodbasen i ett speci­fikt tillstånd och fortsätta utveckla med möjlighet att återgå till den sparade versionen. Detta underlättar:

    Utveckla nya funktioner i en separat branch.

    Skriva om en komponent utan att förstöra en fungerande version.

    Återställa kodbasen om något skulle hända med filerna.

1.2 GitHub
GitHub är en plattform som bygger på Git för att underlätta samarbete mel­lan utvecklare på olika kodbaser. GitHub erbjuder en mängd funktioner som gör det enklare att arbeta tillsammans, oavsett om man är en del av ett litet team eller en stor organisation. Genom att använda GitHub kan utvecklare enkelt lagra, dela och hantera sin kod. De viktigaste funktionerna är:

    Fjärrlagring (Remote Repositories): Möjliggör dataöverföring mellan lokala och fjärrlagrade kopior, vilket gör det enkelt att samarbeta med andra.

    Pull-requests: En funktion för att granska koden och smidigt införa ändringar, vilket underlättar samarbetet.

    Issues: Rapportera buggar, föreslå nya funktioner eller diskutera allmänna frågor, vilket hjälper till att hålla projektet organiserat.

    Behörigheter: Ger kontroll över åtkomst till repository, vilket säkerställer att endast auktoriserade användare kan göra ändringar.

1.3 NotGithub
NotGithub är en självhostad Git-baserad versionshanteringsplattform som låter användare ladda upp sin Git-repo­sitory till en server. Användaren kan hosta denna applikation lokalt på ett LAN (Local Area Network) för att dela kod med andra på samma nätverk, utan att förlora de funktioner som GitHub erbjuder.

Plattformen stödjer inloggningsfunktionalitet samt HTTP och SSH pro­tokoll för dataöverföring. Den har en databas för att lagra användarinform­ation, repository-metadata och repository-åtkomst, med en React-frontend stylad med Tailwind CSS. Git körs i bakgrunden och fungerar som en lokal lösning för versionshantering. Applikationen gör det möjligt för användare att dela och samarbeta på samma Git-repository.

2. Examensarbete

2.1 Mål
Målet med detta projekt var att:

    Fördjupa min förståelse för de verktyg jag använder, Git och Golang.

    Utveckla ett praktiskt verktyg, i stort sett en klon av GitHub, för att undvika beroende av tredjepartstjänster.

Eftersom Large Language Models (LLM) ökar i efterfrågan, ökar också behovet av att hämta data genom webscraping, vilket kan leda till att LLM-företag nyttjar den kod som utvecklare skriver. Detta gör att fler söker egna lösningar för att hosta sin kod.

Problemet som denna applikation löser är att slippa förlita sig på tred­jepartslösningar för att samarbeta på en kodbas. Istället kan man hosta sin egen version för att erhålla högre kontroll över hur koden hanteras och vem som har tillgång till den.

3. Metod

3.1 Övergripande arkitektur
Detta projekt består av tre huvuddelar: server, datalager och frontend. Servern är den huvudsakliga delen av applikationen och ansvarar för all affärslogik, autentisering, API-hantering och Git-operationer.

    Frontend
    Applikationens frontend är utvecklad med React, ett populärt JavaScript-bibliotek för att bygga dynamiska och interaktiva webbapplikationer. React Router hanterar navigering mellan olika vyer och sidor. Styling av komponenter och layout sköts med hjälp av Tailwind CSS, ett CSS-ramverk som möjliggör snabb och flexibel design direkt i HTML.

    Kommunikation med backend-API:et sker via Axios, en HTTP-klient som förenklar hanteringen av förfrågningar och svar. För att visa kodavsnitt med syntaxmarkering, exempelvis när en användare granskar filer i ett repository, används PrismJS. Hela frontend-applikationen byggs och optimeras med hjälp av Vite, ett byggverktyg som erbjuder snabb utveckling och effektiva produktionsbyggen.

    Källkoden för frontenden är strukturerad i flera mappar:

        src/components: Innehåller återanvändbara UI-komponenter som Navbar, RepositoryCard och en animationskomponent NumberSpinner.

        src/pages: Definierar de olika sidorna i applikationen, exempelvis inloggningssidan, översiktssidan för repositories och specifika repository-vyer.

        src/services: Hanterar all logik för API-anrop till backend.

        src/contexts: Använder Reacts Context API för att hantera globalt tillstånd, exempelvis användarinformation.

        src/utils: Samlar hjälpfunktioner som används på flera ställen i applikationen.

    Applikationens startpunkt är main.jsx, som renderar huvudkomponen­ten App.jsx. App.jsx sätter upp routing och den övergripande layouten.

    Server
    Tech-stack som använts för servern inkluderar:

        Programmeringsspråk: Go (Golang)

        Databas: SQLite

        Routing: Gorilla Mux

        SSH: golang.org/x/crypto/ssh

    Servern är skriven i Go, ett statiskt typat och kom­pilerat systemutvecklingsspråk som erbjuder hög prestanda. Go har en inbyggd garbage collector, vilket förenklar minneshantering jämfört med andra lågnivåspråk som C. Gorilla Mux hanterar HTTP-rutter, vilket gör det enkelt att utöka API:t med framtida funktioner samtidigt som koden hålls organiserad.

    SSH-stöd:
    Genom att använda modulen golang.org/x/crypto/ssh kan servern ta emot och hantera SSH-anslutningar. Detta gör det möjligt för användare att klona repositories eller pusha kod på ett säkert sätt. Servern tar emot SSH-nycklar för autentisering från användaren. Varje inkommande HTTP och SSH förfrågan hanteras i sin egen goroutine. Detta gör det möjligt att hantera flera förfrågningar parallellt.

**Hur servern hanterar Git-kommandon (Clone, Push, Pull)**

När du använder NotGithub och kör kommandon som `git clone`, `git push` eller `git pull`, så händer det en del saker i bakgrunden för att allt ska fungera smidigt, oavsett om du ansluter via HTTP eller SSH. Servern ser till att rätt saker händer:

**Via HTTP:**

Om du kör Git-kommandon över HTTP (den vanliga webbadressen), går det ungefär så här till:

1.  **Förfrågan och Autentisering med JWT:** Din Git-klient skickar en förfrågan till servern. För operationer som kräver identifikation (t.ex. push till ett privat repo, eller kloning av ett privat repo), måste din Git-klient inkludera en JWT (JSON Web Token) i `Authorization`-headern (som ett `Bearer` token). Servern, via funktionen `getUserIDOptional` i `repository.go`-filen, extraherar och validerar detta token med hjälp av `auth.ValidateToken` för att identifiera dig. Detta skiljer sig från webbläsarens cookie-baserade sessioner.
2.  **Kontroll av Rättigheter:** När servern vet vem du är (via ditt `userID` från JWT:n), kollar den om du har rättigheter för den specifika operationen och det specifika repositoriet. För att få `pusha` kod (vilket använder `git-receive-pack`-tjänsten), måste du vara ägare till repositoriet. Denna kontroll sker genom att jämföra ditt `userID` med repositoriets ägar-ID (`repoOwnerID`) som finns i databasen, med hjälp av funktioner som `CanPushToRepository` i `utils/repo_access.go`. Om du inte har rättigheter, avvisas förfrågan (t.ex. med HTTP-status 401 Unauthorized om inget giltigt token finns, eller 403 Forbidden om du saknar behörighet).
3.  **`git http-backend` tar över:** Om autentisering och auktorisering lyckas, lämnar servern över jobbet till `git http-backend`. Servern konfigurerar miljön för `git http-backend` med nödvändig information, inklusive sökvägen till det faktiska Git-repot på servern (`GIT_PROJECT_ROOT`) och den specifika åtgärden (`PATH_INFO`).
4.  **Git-kommunikation:** `git http-backend` hanterar sedan den direkta kommunikationen med din Git-klient för att överföra data (t.ex. de objekt som ska pushas eller hämtas). Allt som `git http-backend` skickar tillbaka blir ett vanligt HTTP-svar till din Git-klient.

**Via SSH:**

Använder du istället SSH (ofta med en adress som `git@serveradress:användarnamn/reponamn.git`), ser processen lite annorlunda ut:

1.  **Anslutning och nyckelkoll:** Du startar en SSH-anslutning till servern. Servern använder då `golang.org/x/crypto/ssh`-paketet för att hantera SSH-snacket. Istället för lösenord används här publika SSH-nycklar. Servern kollar om din publika nyckel matchar någon av de nycklar du har registrerat i NotGithub. Om den hittar en match, vet den vem du är.
2.  **Git-kommando skickas:** När du är identifierad, skickar din Git-klient ett kommando till servern. Det är oftast `git-upload-pack '/användarnamn/reponamn.git'` (om du ska hämta, som vid clone/fetch/pull) eller `git-receive-pack '/användarnamn/reponamn.git'` (om du ska skicka upp ändringar, som vid push).
3.  **Koll av rättigheter:** Precis som med HTTP, kollar servern även här att du som SSH-användare har rätt att göra det du försöker göra med det specifika repot.
4.  **Direkt Git kommunikation:** Om du har rättigheter, startar servern den Git-process som din klient bad om (`git-upload-pack` eller `git-receive-pack`). Denna process får prata direkt med din Git-klient över SSH-anslutningen. Det blir som en direktlinje mellan din dators Git och serverns Git för att skicka över all data.
5.  **Klart!** När Git-operationen är färdig, avslutas Git-processen på servern, och din Git-klient får en status tillbaka som säger hur det gick.

På det här sättet ser NotGithub till att bara rätt personer kommer åt dina repositories, samtidigt som den använder Gits egna smarta sätt att effektivt skicka data fram och tillbaka.


    Datalager
    Datalagret består av två delar: en SQLite-databas och repository-lagring.

    3.1.1 Databas
    Databasen är SQLite och ansvarar för att lagra metadata, issues och behörigheter med mera. Eftersom SQLite är filbaserad låses hela databasen vid varje skriv­ning, vilket innebär att samtidiga skrivoperationer måste köa. Detta kan leda till försämrad prestanda om många användare försöker skriva samtidigt, men eftersom applikationen är tänkt som en lokal, självhostad lösning med relativt låg belastning är detta sällan ett problem.

    3.1.2 Databasens innehåll
    Applikationens SQLite-databas är navet som håller ordning på all viktig information och de olika kopplingarna mellan data. Här är en närmare titt på vad som sparas:

        Användare (users):
        Varje användare har ett unikt ID, användarnamn, e-postadress och ett hashat lösenord. Tidsstämplar för när kontot skapades och när det senast ändrades sparas också.

        Repositories (repositories):
        För varje repo lagras dess unika ID, namn, en beskrivning, vem som äger det (via en koppling till users-tabellen) samt om det är publikt eller privat. Tidsstämplar för skapande och senaste uppdatering ingår. Denna information är grunden för att hantera Git-repositories.

        SSH-nycklar (ssh_keys):
        För att användare ska kunna ansluta säkert med SSH sparas deras publika SSH-nycklar. Varje nyckel får ett eget ID, kopplas till en användare och får ett namn som användaren själv väljer (t.ex. “Min laptop”). Själva nyckeln, dess fingeravtryck (så man snabbare känner igen den) och en tids­stämpel sparas.

        Ärenden (issues):
        Till varje repo finns ett system för att hantera ärenden (eller “issues”). Ett ärende har ett eget ID, kopplas till sitt repo, har en titel och beskrivning, vet vem som skapade det (användarnamn), samt aktuell status (öppen/stängd). Tidsstämplar för skapande, senaste ändring och eventuellt stängningsdatum sparas. Det framgår också vem som stängde ärendet.

        Röster på ärenden (issue_votes):
        Användare kan ge tummen upp eller ner på ärenden. Dessa röster registreras med koppling till både ärendet och användaren, själva rösten (+1 eller -1) samt tidsstämplar. Detta gör det möjligt att exempelvis se vilka ärenden som är mest populära eller omdiskuterade.

    Genom att hålla all denna information välorganiserad kan systemet smidigt hantera inloggning och filåtkomst samt följa diskussioner och problem i projekten. Det säkerställer också att rätt användare kopplas till rätt kod och aktiviteter på plattformen.

    3.1.3 Repository-lagring
    Servern sparar varje bare repository (enbart .git-mappen) i mappen /backend/repository. Eftersom alla filer i .git-mappen är hashade med SHA-1 (Git-objekt som blobs, trees och commits) går det inte att läsa innehållet som vanliga filer om man inte använder Git-kommandon. För att hämta information från Git-objekten kör servern följande kommandon:

        git http-backend
        Körs för att hantera Git-operationer som push, fetch och pull över HTTP.

        git ls-tree -r HEAD --name-only
        Används för att visa innehåll och räkna antal filer i den senaste commit.

        git show HEAD:<filnamn>
        Visar innehåll i en specifik fil utan att behöva checka ut dem på disk.

        git init --bare
        Initierar en bare-repository.

    Utan dessa Git-kommandon skulle applikationen inte stödja skapande av repositories, rendering av innehåll i frontend eller clone/push/fetch.

    3.1.4 Reflektion kring valet av databas
    Eftersom applikationen är tänkt att köras lokalt – exempelvis på en laptop eller Raspberry Pi – är belastningen på databasen oftast låg. Det gör det enkelt att migrera applikationen mellan olika enheter, eftersom det räcker att kopiera databasen och mappen med repositories.

    När blir skrivbegränsningen en begränsning?
    Skrivlåset i SQLite påverkar primärt dessa operationer:

        Skapande av nya repositories

        Skapande eller uppdatering av issues

        Ändring av repository-behörigheter eller användarinställningar

    Vid normal användning, med en eller ett par samtidiga användare, är risken för märkbara låsningar liten. Om applikationen däremot används av många användare samtidigt eller om automatiserade processer gör många skrivningar kan låsningen bli problematisk.

    Skalbarhet och framtida utveckling
    Om applikationen ska skalas upp för fler användare bör man överväga att byta till en mer skalbar databas, exempelvis PostgreSQL. På samma sätt kan repository-lagringen flyttas till ett distribuerat filsystem eller en extern server för ökad säkerhet och tillgänglighet. Det är också viktigt att tänka på filrättigheter och isolering mellan användares repositories för att skydda mot otillåten åtkomst.

    Backup och portabilitet
    En fördel med filbaserad lagring är att backup och återställning blir enkelt – det räcker att kopiera databasen och mappen med .git-repositories. Detta förenklar både migrationen och återställning vid fel.

Servern lagrar så kallade bare repositories i mappen /backend/repository. Varje användare har en egen undermapp som i sin tur innehåller de olika .git-mapparna användaren skapar. Om till exempel användaren “melker” skapar två repositories, “dotfiles” och “reading-speed”, så finns dessa i /backend/repository/melker/dotfiles respektive /backend/repository/melker/reading-speed.

Om vi tittar närmare på innehållet i en .git-mapp kan vi se att det finns en fil som heter HEAD. Denna fil fungerar som “toplevel” för Git-applikationen eftersom den anger vilken gren som för närvarande är aktiv och därmed styr Git:s operationer. Den består av en SHA-1-hash. Vi kan även se mappar som objects och refs, vilka är väsentliga för Git:s funktionalitet:

    Objects: Git lagrar all data som “objects”. Det finns olika typer av objekt, inklusive:

        Blob: Innehåller filinnehåll.

        Tree: Representerar en katalog och kan innehålla andra träd och blobbar.

        Commit: Innehåller metadata om en commit, inklusive referens till ett träd och en eller flera föräldra-commits.

        Tag: Används för att markera specifika commits, ofta för versionering.

    Refs: “Refs” är referenser som pekar på specifika commits. De används för att hantera grenar och taggar, till exempel:

        Branches: En ref som pekar på den senaste commit i en gren.

        Tags: En ref som pekar på en specifik commit för att markera en version.



4. Resultat
Här redovisas resultatet av arbetet. Det kan vara exempel på olika dokument, bilder, skärmdumpar, loggar, protokoll med mera.

5. Slutsatser och diskussion
Reflektioner om arbetet som helhet:

    Blev det som jag tänkt mig från början?

    Kunde man gjort på ett annat sätt?

    Blev planeringen bra, eller var jag tvungen att byta plan för att hinna i tid?